import { Router } from 'express';
import { z } from 'zod';
import speakeasy from 'speakeasy';
import { prisma } from '../utils/prisma.js';
import { hashPassword, verifyPassword } from '../utils/hash.js';
import { signDoctorToken } from '../utils/jwt.js';
import { HttpError } from '../middleware/errorHandler.js';
import { requireDoctor } from '../middleware/auth.js';
import { authRateLimit } from '../middleware/rateLimit.js';
import { uploadLicense } from '../middleware/upload.js';
import { logSecurityEvent } from '../services/safetyEngine.js';

const router = Router();

const signupSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(120),
  medicalLicenseId: z.string().min(3).max(80),
  specialty: z.string().min(2).max(80),
  department: z.string().min(2).max(80),
  hospitalId: z.string().uuid(),
});

router.post('/signup', uploadLicense.single('license'), async (req, res, next) => {
  try {
    const parsed = signupSchema.parse(req.body);

    const exists = await prisma.doctor.findFirst({
      where: { OR: [{ email: parsed.email }, { medicalLicenseId: parsed.medicalLicenseId }] },
      select: { id: true },
    });
    if (exists) throw new HttpError(409, 'Email or medical license already registered');

    const hospital = await prisma.hospital.findUnique({ where: { id: parsed.hospitalId } });
    if (!hospital) throw new HttpError(400, 'Hospital not found');

    const passwordHash = await hashPassword(parsed.password);

    const doctor = await prisma.doctor.create({
      data: {
        fullName: parsed.fullName,
        email: parsed.email.toLowerCase(),
        passwordHash,
        medicalLicenseId: parsed.medicalLicenseId,
        specialty: parsed.specialty,
        department: parsed.department,
        hospitalId: parsed.hospitalId,
        licenseFilePath: req.file ? req.file.path : null,
        verificationStatus: 'pending',
      },
      select: {
        id: true, email: true, fullName: true,
        specialty: true, verificationStatus: true,
      },
    });

    await logSecurityEvent({
      doctorId: doctor.id,
      event: 'doctor_signup',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({ doctor });
  } catch (err) {
    if (err.name === 'ZodError') return next(new HttpError(400, err.errors.map((e) => e.message).join('; ')));
    next(err);
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  twoFAToken: z.string().optional(),
});

router.post('/login', authRateLimit, async (req, res, next) => {
  try {
    const { email, password, twoFAToken } = loginSchema.parse(req.body);

    const doctor = await prisma.doctor.findUnique({ where: { email: email.toLowerCase() } });
    if (!doctor) {
      await logSecurityEvent({ event: 'login_failed', ipAddress: req.ip, metadata: { email, reason: 'no_account' } });
      throw new HttpError(401, 'Invalid credentials');
    }

    const ok = await verifyPassword(password, doctor.passwordHash);
    if (!ok) {
      await logSecurityEvent({ doctorId: doctor.id, event: 'login_failed', ipAddress: req.ip, metadata: { reason: 'bad_password' } });
      throw new HttpError(401, 'Invalid credentials');
    }

    if (doctor.twoFAEnabled) {
      if (!twoFAToken) throw new HttpError(403, '2FA token required');
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

    if (doctor.verificationStatus !== 'approved') {
      // We still issue a token so the frontend can show the verification screen.
      const token = signDoctorToken(doctor);
      return res.json({
        token,
        doctor: {
          id: doctor.id,
          email: doctor.email,
          fullName: doctor.fullName,
          verificationStatus: doctor.verificationStatus,
          verificationNote: doctor.verificationNote,
        },
        requiresVerification: true,
      });
    }

    await logSecurityEvent({ doctorId: doctor.id, event: 'login', ipAddress: req.ip });

    const token = signDoctorToken(doctor);
    res.json({
      token,
      doctor: {
        id: doctor.id,
        email: doctor.email,
        fullName: doctor.fullName,
        specialty: doctor.specialty,
        department: doctor.department,
        hospitalId: doctor.hospitalId,
        verificationStatus: doctor.verificationStatus,
        twoFAEnabled: doctor.twoFAEnabled,
        role: doctor.role,
      },
    });
  } catch (err) {
    if (err.name === 'ZodError') return next(new HttpError(400, err.errors.map((e) => e.message).join('; ')));
    next(err);
  }
});

router.post('/2fa/setup', requireDoctor, async (req, res, next) => {
  try {
    const secret = speakeasy.generateSecret({ name: `Kira (${req.doctor.email})` });
    await prisma.doctor.update({
      where: { id: req.doctor.id },
      data: { twoFASecret: secret.base32, twoFAEnabled: false }, // not enabled until verified
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
      secret: doctor.twoFASecret,
      encoding: 'base32',
      token: String(token || ''),
      window: 1,
    });
    if (!valid) throw new HttpError(401, 'Invalid token');
    await prisma.doctor.update({
      where: { id: doctor.id },
      data: { twoFAEnabled: true },
    });
    await logSecurityEvent({ doctorId: doctor.id, event: '2fa_enabled', ipAddress: req.ip });
    res.json({ twoFAEnabled: true });
  } catch (err) { next(err); }
});

router.post('/logout', requireDoctor, async (req, res, next) => {
  try {
    await logSecurityEvent({ doctorId: req.doctor.id, event: 'logout', ipAddress: req.ip });
    // JWT is stateless; client just drops the token. We log the event.
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
    res.json({ doctor });
  } catch (err) { next(err); }
});

export default router;
