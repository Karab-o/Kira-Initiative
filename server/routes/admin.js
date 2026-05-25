import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { requireDoctor, requireAdmin } from '../middleware/auth.js';
import { HttpError } from '../middleware/errorHandler.js';
import { logSecurityEvent } from '../services/safetyEngine.js';

const router = Router();

router.get('/logs', requireDoctor, requireAdmin, async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 50);
    const { event, doctorId } = req.query;

    const where = {};
    if (event) where.event = String(event);
    if (doctorId) where.doctorId = String(doctorId);

    const [logs, total] = await Promise.all([
      prisma.securityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.securityLog.count({ where }),
    ]);

    res.json({ logs, pagination: { page, limit, total, hasMore: page * limit < total } });
  } catch (err) { next(err); }
});

router.get('/doctors', requireDoctor, requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = status ? { verificationStatus: String(status) } : {};
    const doctors = await prisma.doctor.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, fullName: true, email: true, specialty: true,
        department: true, medicalLicenseId: true,
        licenseFilePath: true, verificationStatus: true,
        verificationNote: true, createdAt: true,
        hospital: { select: { id: true, name: true } },
      },
    });
    res.json({ doctors });
  } catch (err) { next(err); }
});

const verifySchema = z.object({
  status: z.enum(['approved', 'rejected']),
  note: z.string().max(500).optional(),
});

router.patch('/doctors/:id/verify', requireDoctor, requireAdmin, async (req, res, next) => {
  try {
    const { status, note } = verifySchema.parse(req.body);
    const updated = await prisma.doctor.update({
      where: { id: req.params.id },
      data: { verificationStatus: status, verificationNote: note || null },
      select: { id: true, fullName: true, verificationStatus: true, verificationNote: true },
    });
    await logSecurityEvent({
      doctorId: req.doctor.id,
      event: `doctor_${status}`,
      metadata: { targetDoctorId: req.params.id, note },
    });
    res.json({ doctor: updated });
  } catch (err) {
    if (err.name === 'ZodError') return next(new HttpError(400, err.errors.map((e) => e.message).join('; ')));
    next(err);
  }
});

export default router;
