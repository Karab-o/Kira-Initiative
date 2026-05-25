import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { requireDoctor } from '../middleware/auth.js';
import { HttpError } from '../middleware/errorHandler.js';

const router = Router();

const createSchema = z.object({
  sessionToken: z.string().min(10).optional(),
  escalationId: z.string().uuid(),
  doctorId: z.string().uuid(),
  hospitalId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  type: z.enum(['online', 'inperson']),
  notes: z.string().max(1000).optional(),
});

router.post('/', async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);

    const escalation = await prisma.escalation.findUnique({
      where: { id: data.escalationId },
      include: { session: true },
    });
    if (!escalation) throw new HttpError(404, 'Escalation not found');

    // Either patient (with matching sessionToken) or doctor (with auth header) can book
    const authHeader = req.headers.authorization;
    let authorised = false;

    if (authHeader?.startsWith('Bearer ')) {
      try {
        const jwt = await import('jsonwebtoken');
        const payload = jwt.default.verify(authHeader.slice(7), process.env.JWT_SECRET);
        if (payload.hospitalId === escalation.hospitalId) authorised = true;
      } catch (e) { /* fall through */ }
    }

    if (!authorised && data.sessionToken) {
      if (escalation.session.sessionToken === data.sessionToken) authorised = true;
    }

    if (!authorised) throw new HttpError(403, 'Not authorised to book for this escalation');

    const existing = await prisma.appointment.findUnique({ where: { escalationId: data.escalationId } });
    if (existing) throw new HttpError(409, 'Appointment already exists for this escalation');

    const appointment = await prisma.appointment.create({
      data: {
        escalationId: data.escalationId,
        doctorId: data.doctorId,
        hospitalId: data.hospitalId,
        scheduledAt: new Date(data.scheduledAt),
        type: data.type,
        notes: data.notes || null,
        status: 'scheduled',
      },
    });

    res.status(201).json({ appointment });
  } catch (err) {
    if (err.name === 'ZodError') return next(new HttpError(400, err.errors.map((e) => e.message).join('; ')));
    next(err);
  }
});

router.get('/', requireDoctor, async (req, res, next) => {
  try {
    const { from, to, mine } = req.query;
    const where = { hospitalId: req.doctor.hospitalId };
    if (mine === 'true') where.doctorId = req.doctor.id;
    if (from || to) {
      where.scheduledAt = {};
      if (from) where.scheduledAt.gte = new Date(String(from));
      if (to) where.scheduledAt.lte = new Date(String(to));
    }

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
      take: 200,
      include: {
        doctor: { select: { id: true, fullName: true, specialty: true } },
        hospital: { select: { id: true, name: true } },
        escalation: { select: { id: true, patientName: true, patientPhone: true, severityAtEscalation: true } },
      },
    });

    res.json({ appointments });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: {
        doctor: { select: { id: true, fullName: true, specialty: true, profilePhoto: true } },
        hospital: { select: { id: true, name: true, address: true, helpdeskPhone: true } },
        escalation: { select: { id: true, sessionId: true, hospitalId: true } },
      },
    });
    if (!appointment) throw new HttpError(404, 'Appointment not found');

    // Same auth pattern as prescription
    const authHeader = req.headers.authorization;
    const sessionToken = req.headers['x-session-token'] || req.query.sessionToken;
    let authorised = false;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const jwt = await import('jsonwebtoken');
        const payload = jwt.default.verify(authHeader.slice(7), process.env.JWT_SECRET);
        if (payload.hospitalId === appointment.hospitalId) authorised = true;
      } catch (e) {}
    }
    if (!authorised && sessionToken) {
      const session = await prisma.anonymousSession.findUnique({ where: { sessionToken: String(sessionToken) } });
      if (session && session.id === appointment.escalation.sessionId) authorised = true;
    }
    if (!authorised) throw new HttpError(403, 'Not authorised');

    res.json({ appointment });
  } catch (err) { next(err); }
});

const patchSchema = z.object({
  status: z.enum(['scheduled', 'completed', 'cancelled']).optional(),
  scheduledAt: z.string().datetime().optional(),
  notes: z.string().max(1000).optional(),
});

router.patch('/:id', requireDoctor, async (req, res, next) => {
  try {
    const appointment = await prisma.appointment.findUnique({ where: { id: req.params.id } });
    if (!appointment) throw new HttpError(404, 'Appointment not found');
    if (appointment.hospitalId !== req.doctor.hospitalId) throw new HttpError(403, 'Out of scope');

    const data = patchSchema.parse(req.body);
    const updateData = {};
    if (data.status) updateData.status = data.status;
    if (data.scheduledAt) updateData.scheduledAt = new Date(data.scheduledAt);
    if (data.notes !== undefined) updateData.notes = data.notes;

    const updated = await prisma.appointment.update({ where: { id: req.params.id }, data: updateData });
    res.json({ appointment: updated });
  } catch (err) {
    if (err.name === 'ZodError') return next(new HttpError(400, err.errors.map((e) => e.message).join('; ')));
    next(err);
  }
});

export default router;
