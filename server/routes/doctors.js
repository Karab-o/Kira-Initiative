import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { requireDoctor } from '../middleware/auth.js';
import { uploadProfilePhoto } from '../middleware/upload.js';
import { HttpError } from '../middleware/errorHandler.js';

const router = Router();

// PATIENT-FACING: list available doctors. We expose only what's needed to choose one.
router.get('/', async (req, res, next) => {
  try {
    const { hospitalId, specialty } = req.query;
    const where = {
      verificationStatus: 'approved',
    };
    if (hospitalId) where.hospitalId = String(hospitalId);
    if (specialty) where.specialty = { contains: String(specialty), mode: 'insensitive' };

    const doctors = await prisma.doctor.findMany({
      where,
      orderBy: [{ isOnline: 'desc' }, { fullName: 'asc' }],
      select: {
        id: true, fullName: true, specialty: true, department: true,
        profilePhoto: true, isOnline: true,
        hospital: { select: { id: true, name: true } },
      },
    });

    res.json({ doctors });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, fullName: true, specialty: true, department: true,
        profilePhoto: true, isOnline: true,
        verificationStatus: true,
        hospital: { select: { id: true, name: true, fullName: true, address: true } },
      },
    });
    if (!doctor || doctor.verificationStatus !== 'approved') {
      throw new HttpError(404, 'Doctor not found');
    }
    // Strip verificationStatus from response — patients don't need it
    delete doctor.verificationStatus;
    res.json({ doctor });
  } catch (err) { next(err); }
});

const updateSchema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  specialty: z.string().min(2).max(80).optional(),
  department: z.string().min(2).max(80).optional(),
});

router.patch('/:id', requireDoctor, uploadProfilePhoto.single('profilePhoto'), async (req, res, next) => {
  try {
    if (req.params.id !== req.doctor.id) throw new HttpError(403, 'Cannot edit other doctor profiles');
    const parsed = updateSchema.parse(req.body);

    const data = { ...parsed };
    if (req.file) data.profilePhoto = `/uploads/profiles/${req.file.filename}`;

    const doctor = await prisma.doctor.update({
      where: { id: req.params.id },
      data,
      select: {
        id: true, fullName: true, specialty: true, department: true,
        profilePhoto: true, hospitalId: true,
      },
    });

    res.json({ doctor });
  } catch (err) {
    if (err.name === 'ZodError') return next(new HttpError(400, err.errors.map((e) => e.message).join('; ')));
    next(err);
  }
});

// Available appointment slots — naive demo: next 5 working days at 09/11/14/16.
// In production this comes from a real availability table.
router.get('/:id/slots', async (req, res, next) => {
  try {
    const doctor = await prisma.doctor.findUnique({ where: { id: req.params.id }, select: { id: true, verificationStatus: true } });
    if (!doctor || doctor.verificationStatus !== 'approved') throw new HttpError(404, 'Doctor not found');

    const slots = [];
    const now = new Date();
    const hours = [9, 11, 14, 16];
    for (let d = 1; d <= 5; d++) {
      for (const h of hours) {
        const slot = new Date(now);
        slot.setDate(now.getDate() + d);
        slot.setHours(h, 0, 0, 0);
        slots.push(slot.toISOString());
      }
    }

    // Exclude already-booked
    const booked = await prisma.appointment.findMany({
      where: { doctorId: req.params.id, scheduledAt: { gte: now } },
      select: { scheduledAt: true },
    });
    const bookedSet = new Set(booked.map((b) => b.scheduledAt.toISOString()));
    res.json({ slots: slots.filter((s) => !bookedSet.has(s)) });
  } catch (err) { next(err); }
});

export default router;
