import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { requireDoctor } from '../middleware/auth.js';
import { HttpError } from '../middleware/errorHandler.js';

const router = Router();

const createSchema = z.object({
  sessionToken: z.string().min(10),
  name: z.string().min(1).max(120),
  age: z.number().int().min(13).max(120),
  phone: z.string().min(7).max(30),
  email: z.string().email().optional().nullable(),
  hospitalId: z.string().uuid(),
  symptomSummary: z.string().min(10),
  escalationReason: z.string().min(3).max(500),
  severityAtEscalation: z.enum(['green', 'amber', 'red']),
  consentConfirmed: z.literal(true, {
    errorMap: () => ({ message: 'Explicit consent (consentConfirmed: true) is required' }),
  }),
});

// PATIENT: create escalation (anonymity ends here — PII is captured)
router.post('/', async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);

    const session = await prisma.anonymousSession.findUnique({
      where: { sessionToken: data.sessionToken },
      include: { escalation: true },
    });
    if (!session) throw new HttpError(401, 'Invalid session');
    if (session.expiresAt < new Date()) throw new HttpError(410, 'Session expired');
    if (session.escalation) throw new HttpError(409, 'Session already escalated');

    const hospital = await prisma.hospital.findUnique({ where: { id: data.hospitalId } });
    if (!hospital) throw new HttpError(400, 'Hospital not found');

    const escalation = await prisma.escalation.create({
      data: {
        sessionId: session.id,
        patientName: data.name,
        patientAge: data.age,
        patientPhone: data.phone,
        patientEmail: data.email || null,
        hospitalId: data.hospitalId,
        symptomSummary: data.symptomSummary,
        escalationReason: data.escalationReason,
        severityAtEscalation: data.severityAtEscalation,
        status: 'pending',
      },
      select: {
        id: true, status: true, severityAtEscalation: true,
        hospitalId: true, createdAt: true,
      },
    });

    res.status(201).json({ escalation });
  } catch (err) {
    if (err.name === 'ZodError') return next(new HttpError(400, err.errors.map((e) => e.message).join('; ')));
    next(err);
  }
});

// DOCTOR: list escalations (filtered by doctor's hospital + assignment)
router.get('/', requireDoctor, async (req, res, next) => {
  try {
    const { status, mine } = req.query;
    const where = {
      hospitalId: req.doctor.hospitalId,
    };
    if (status) where.status = String(status);
    if (mine === 'true') where.assignedDoctorId = req.doctor.id;

    const escalations = await prisma.escalation.findMany({
      where,
      orderBy: [{ severityAtEscalation: 'desc' }, { createdAt: 'desc' }],
      take: 100,
      select: {
        id: true, patientName: true, patientAge: true,
        escalationReason: true, severityAtEscalation: true,
        status: true, assignedDoctorId: true,
        createdAt: true,
        consultation: { select: { id: true, status: true, riskLevel: true } },
        hospital: { select: { id: true, name: true } },
      },
    });

    res.json({ escalations });
  } catch (err) { next(err); }
});

// DOCTOR: get a single escalation in full
router.get('/:id', requireDoctor, async (req, res, next) => {
  try {
    const escalation = await prisma.escalation.findUnique({
      where: { id: req.params.id },
      include: {
        hospital: { select: { id: true, name: true, fullName: true } },
        doctor: { select: { id: true, fullName: true, specialty: true } },
        consultation: {
          select: {
            id: true, status: true, riskLevel: true,
            createdAt: true, updatedAt: true,
            soapNote: { select: { id: true, finalized: true } },
          },
        },
        appointment: true,
        // Important: we DO NOT include session.messages (the AI transcript).
        // Doctors only see the escalation summary, never the chat.
      },
    });
    if (!escalation) throw new HttpError(404, 'Escalation not found');
    if (escalation.hospitalId !== req.doctor.hospitalId) throw new HttpError(403, 'Out of scope');
    res.json({ escalation });
  } catch (err) { next(err); }
});

const patchSchema = z.object({
  status: z.enum(['pending', 'assigned', 'active', 'closed']).optional(),
  assignedDoctorId: z.string().uuid().optional().nullable(),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
});

router.patch('/:id', requireDoctor, async (req, res, next) => {
  try {
    const data = patchSchema.parse(req.body);

    const escalation = await prisma.escalation.findUnique({ where: { id: req.params.id } });
    if (!escalation) throw new HttpError(404, 'Escalation not found');
    if (escalation.hospitalId !== req.doctor.hospitalId) throw new HttpError(403, 'Out of scope');

    const updateData = {};
    if (data.status) updateData.status = data.status;
    if ('assignedDoctorId' in data) updateData.assignedDoctorId = data.assignedDoctorId;

    const updated = await prisma.escalation.update({
      where: { id: req.params.id },
      data: updateData,
    });

    // riskLevel lives on the Consultation
    if (data.riskLevel) {
      await prisma.consultation.updateMany({
        where: { escalationId: updated.id },
        data: { riskLevel: data.riskLevel },
      });
    }

    res.json({ escalation: updated });
  } catch (err) {
    if (err.name === 'ZodError') return next(new HttpError(400, err.errors.map((e) => e.message).join('; ')));
    next(err);
  }
});

export default router;
