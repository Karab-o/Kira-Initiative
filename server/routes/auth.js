import { Router } from 'express';
import { z } from 'zod';
import speakeasy from 'speakeasy';
import { prisma } from '../utils/prisma.js';
import { hashPassword, verifyPassword } from '../utils/hash.js';
import { signDoctorToken } from '../utils/jwt.js';
import { HttpError } from '../middleware/errorHandler.js';
import { requireDoctor } from '../middleware/auth.js';
import { authRateLimit } from '../middleware/rateLimit.js';
import { logSecurityEvent } from '../services/safetyEngine.js';

const router = Router();

// ─── Validate access code ────────────────────────────────────────────────────
// Called by Signup step-0 to resolve hospital + specialty from a code.

router.post('/validate-code', authRateLimit, async (req, res, next) => {
  try {
    const { code } = z.object({ code: z.string().min(5).max(40) }).parse(req.body);
    const raw = code.trim().toUpperCase();

    const accessCode = await prisma.accessCode.findUnique({
      where: { code: raw },
      include: { hospital: { select: { id: true, name: true, fullName: true, code: true } } },
    });

    if (!accessCode) throw new HttpError(404, 'Access code not found. Contact your hospital administrator.');
    if (accessCode.isUsed) throw new HttpError(409, 'This access code has already been used.');
    if (accessCode.expiresAt && accessCode.expiresAt < new Date()) {
      throw new HttpError(410, 'This access code has expired. Request a new one from your administrator.');
    }

    res.json({
      valid: true,
      hospital: accessCode.hospital,
      specialty: accessCode.specialty,
      code: accessCode.code,
    });
  } catch (err) {
    if (err.name === 'ZodError') return next(new HttpError(400, err.errors[0].message));
    next(err);
  }
});

// ─── Signup (invite-code based) ───────────────────────────────────────────────

const signupSchema = z.object({
  accessCode:  z.string().min(5).max(40),
  fullName:    z.string().min(2).max(120),
  email:       z.string().email(),
  password:    z.string().min(8).max(120),
});

router.post('/signup', async (req, res, next) => {
  try {
    const parsed = signupSchema.parse(req.body);
    const raw = parsed.accessCode.trim().toUpperCase();

    const accessCode = await prisma.accessCode.findUnique({
      where: { code: raw },
      include: { hospital: true },
    });
    if (!accessCode)  throw new HttpError(400, 'Invalid access code.');
    if (accessCode.isUsed) throw new HttpError(409, 'Access code already used.');
    if (accessCode.expiresAt && accessCode.expiresAt < new Date()) {
      throw new HttpError(410, 'Access code expired.');
    }

    const emailTaken = await prisma.doctor.findUnique({ where: { email: parsed.email.toLowerCase() } });
    if (emailTaken) throw new HttpError(409, 'An account with this email already exists.');

    // Derive a medicalLicenseId placeholder — admin will update after verification
    const licenseId = `PENDING-${raw}-${Date.now()}`;

    const passwordHash = await hashPassword(parsed.password);

    const doctor = await prisma.$transaction(async (tx) => {
      const doc = await tx.doctor.create({
        data: {
          fullName:          parsed.fullName,
          email:             parsed.email.toLowerCase(),
          passwordHash,
          medicalLicenseId:  licenseId,
          specialty:         accessCode.specialty,
          department:        accessCode.specialty,
          hospitalId:        accessCode.hospitalId,
          verificationStatus: 'pending',
          role:              'doctor',
        },
        select: {
          id: true, email: true, fullName: true,
          specialty: true, verificationStatus: true,
          hospital: { select: { id: true, name: true } },
        },
      });

      // Mark access code as used
      await tx.accessCode.update({
        where: { code: raw },
        data: { isUsed: true, usedAt: new Date() },
      });

      return doc;
    });

    await logSecurityEvent({
      doctorId: doctor.id,
      event:    'doctor_signup',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { accessCode: raw, hospital: accessCode.hospital.name },
    });

    res.status(201).json({ doctor });
  } catch (err) {
    if (err.name === 'ZodError') return next(new HttpError(400, err.errors.map((e) => e.message).join('; ')));
    next(err);
  }
});

// ─── Login ────────────────────────────────────────────────────────────────────
// Accepts email OR medicalLicenseId as identifier.

const loginSchema = z.object({
  email:         z.string().optional(),       // work email
  medicalId:     z.string().optional(),       // medicalLicenseId
  password:      z.string().min(1),
  twoFAToken:    z.string().optional(),
  accessCode:    z.string().optional(),       // optional — validated if provided
});

router.post('/login', authRateLimit, async (req, res, next) => {
  try {
    const { email, medicalId, password, twoFAToken, accessCode } = loginSchema.parse(req.body);

    if (!email && !medicalId) throw new HttpError(400, 'Provide email or medical ID.');

    // Look up doctor by email first, then by medicalLicenseId
    let doctor = null;
    if (email) {
      doctor = await prisma.doctor.findUnique({
        where: { email: email.toLowerCase() },
        include: { hospital: { select: { id: true, name: true, fullName: true } } },
      });
    }
    if (!doctor && medicalId) {
      doctor = await prisma.doctor.findUnique({
        where: { medicalLicenseId: medicalId },
        include: { hospital: { select: { id: true, name: true, fullName: true } } },
      });
    }

    if (!doctor) {
      await logSecurityEvent({
        event: 'login_failed', ipAddress: req.ip,
        metadata: { email, medicalId, reason: 'no_account' },
      });
      throw new HttpError(401, 'Invalid credentials');
    }

    const ok = await verifyPassword(password, doctor.passwordHash);
    if (!ok) {
      await logSecurityEvent({
        doctorId: doctor.id, event: 'login_failed', ipAddress: req.ip,
        metadata: { reason: 'bad_password' },
      });
      throw new HttpError(401, 'Invalid credentials');
    }

    // Optional access-code validation (extra security layer on login)
    if (accessCode) {
      const codeRecord = await prisma.accessCode.findUnique({
        where: { code: accessCode.trim().toUpperCase() },
      });
      if (!codeRecord || codeRecord.hospitalId !== doctor.hospitalId) {
        await logSecurityEvent({
          doctorId: doctor.id, event: 'login_failed', ipAddress: req.ip,
          metadata: { reason: 'bad_access_code' },
        });
        throw new HttpError(401, 'Access code does not match your hospital.');
      }
    }

    // 2FA (TOTP via speakeasy)
    if (doctor.twoFAEnabled) {
      if (!twoFAToken) {
        const token = signDoctorToken(doctor);
        return res.status(202).json({ requires2FA: true, token });
      }
      const valid = speakeasy.totp.verify({
        secret: doctor.twoFASecret,
        encoding: 'base32',
        token: twoFAToken,
        window: 1,
      });
      if (!valid) {
        await logSecurityEvent({ doctorId: doctor.id, event: '2fa_failed', ipAddress: req.ip });
        throw new HttpError(401, 'Invalid 2FA token');
      }
      await logSecurityEvent({ doctorId: doctor.id, event: '2fa_success', ipAddress: req.ip });
    }

    // Pending/rejected — issue token so frontend can show verification screen
    if (doctor.verificationStatus !== 'approved') {
      const token = signDoctorToken(doctor);
      return res.json({
        token,
        doctor: {
          id:                 doctor.id,
          email:              doctor.email,
          fullName:           doctor.fullName,
          verificationStatus: doctor.verificationStatus,
          verificationNote:   doctor.verificationNote,
        },
        requiresVerification: true,
      });
    }

    await logSecurityEvent({ doctorId: doctor.id, event: 'login', ipAddress: req.ip });

    const token = signDoctorToken(doctor);
    res.json({
      token,
      doctor: {
        id:                 doctor.id,
        email:              doctor.email,
        fullName:           doctor.fullName,
        specialty:          doctor.specialty,
        department:         doctor.department,
        hospitalId:         doctor.hospitalId,
        hospitalName:       doctor.hospital?.name,
        verificationStatus: doctor.verificationStatus,
        twoFAEnabled:       doctor.twoFAEnabled,
        role:               doctor.role,
      },
    });
  } catch (err) {
    if (err.name === 'ZodError') return next(new HttpError(400, err.errors.map((e) => e.message).join('; ')));
    next(err);
  }
});

// ─── 2FA setup / verify ───────────────────────────────────────────────────────

router.post('/2fa/setup', requireDoctor, async (req, res, next) => {
  try {
    const secret = speakeasy.generateSecret({ name: `Kira (${req.doctor.email})` });
    await prisma.doctor.update({
      where: { id: req.doctor.id },
      data: { twoFASecret: secret.base32, twoFAEnabled: false },
    });
    res.json({ secret: secret.base32, otpauthUrl: secret.otpauth_url });
  } catch (err) { next(err); }
});

router.post('/2fa/verify', requireDoctor, async (req, res, next) => {
  try {
    const { token } = req.body;
    const doctor = await prisma.doctor.findUnique({ where: { id: req.doctor.id } });
    if (!doctor.twoFASecret) throw new HttpError(400, '2FA not initialised');
    const valid = speakeasy.totp.verify({
      secret:   doctor.twoFASecret,
      encoding: 'base32',
      token:    String(token || ''),
      window:   1,
    });
    if (!valid) throw new HttpError(401, 'Invalid token');
    await prisma.doctor.update({ where: { id: doctor.id }, data: { twoFAEnabled: true } });
    await logSecurityEvent({ doctorId: doctor.id, event: '2fa_enabled', ipAddress: req.ip });
    res.json({ twoFAEnabled: true });
  } catch (err) { next(err); }
});

// ─── Logout / me ─────────────────────────────────────────────────────────────

router.post('/logout', requireDoctor, async (req, res, next) => {
  try {
    await logSecurityEvent({ doctorId: req.doctor.id, event: 'logout', ipAddress: req.ip });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.get('/me', requireDoctor, async (req, res, next) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: req.doctor.id },
      select: {
        id: true, email: true, fullName: true, specialty: true,
        department: true, hospitalId: true, role: true,
        verificationStatus: true, verificationNote: true,
        twoFAEnabled: true, profilePhoto: true, isOnline: true,
        hospital: { select: { id: true, name: true, fullName: true } },
      },
    });
    res.json({
      doctor: {
        ...doctor,
        hospitalName: doctor?.hospital?.name,
      },
    });
  } catch (err) { next(err); }
});

export default router;
