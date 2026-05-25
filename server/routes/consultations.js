import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { requireDoctor } from '../middleware/auth.js';
import { requireSession } from '../middleware/sessionAuth.js';
import { HttpError } from '../middleware/errorHandler.js';

const router = Router();

// Middleware: allow either doctor OR session, attach req.actor = { role, id }
async function requireDoctorOrSession(req, res, next) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return requireDoctor(req, res, (err) => {
    if (err) return next(err);
    req.actor = { role: 'doctor', id: req.doctor.id };
    next();
  });
  return requireSession(req, res, (err) => {
    if (err) return next(err);
    req.actor = { role: 'patient', sessionId: req.session.id };
    next();
  });
}

// Verify the actor can access this consultation
async function loadConsultation(consultationId, actor) {
  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
    include: { escalation: true },
  });
  if (!consultation) throw new HttpError(404, 'Consultation not found');

  if (actor.role === 'doctor' && consultation.doctorId !== actor.id) {
    throw new HttpError(403, 'Not your consultation');
  }
  if (actor.role === 'patient' && consultation.escalation.sessionId !== actor.sessionId) {
    throw new HttpError(403, 'Not your consultation');
  }
  return consultation;
}

// ─────────────────────────────────────────
// CREATE — doctor accepts an escalation and opens a consultation
// ─────────────────────────────────────────

const createSchema = z.object({
  escalationId: z.string().uuid(),
});

router.post('/', requireDoctor, async (req, res, next) => {
  try {
    const { escalationId } = createSchema.parse(req.body);

    const escalation = await prisma.escalation.findUnique({ where: { id: escalationId } });
    if (!escalation) throw new HttpError(404, 'Escalation not found');
    if (escalation.hospitalId !== req.doctor.hospitalId) throw new HttpError(403, 'Out of scope');

    const existing = await prisma.consultation.findUnique({ where: { escalationId } });
    if (existing) return res.json({ consultation: existing });

    const [consultation] = await prisma.$transaction([
      prisma.consultation.create({
        data: { escalationId, doctorId: req.doctor.id, status: 'active' },
      }),
      prisma.escalation.update({
        where: { id: escalationId },
        data: { status: 'active', assignedDoctorId: req.doctor.id },
      }),
    ]);

    res.status(201).json({ consultation });
  } catch (err) {
    if (err.name === 'ZodError') return next(new HttpError(400, err.errors.map((e) => e.message).join('; ')));
    next(err);
  }
});

// ─────────────────────────────────────────
// READ — full consultation (no internal notes for patients)
// ─────────────────────────────────────────

router.get('/:id', requireDoctorOrSession, async (req, res, next) => {
  try {
    const consultation = await loadConsultation(req.params.id, req.actor);

    const detail = await prisma.consultation.findUnique({
      where: { id: consultation.id },
      include: {
        escalation: {
          select: {
            id: true, patientName: true, patientAge: true, patientPhone: true,
            symptomSummary: true, escalationReason: true, severityAtEscalation: true,
            hospital: { select: { id: true, name: true } },
          },
        },
        doctor: {
          select: {
            id: true, fullName: true, specialty: true, department: true,
            profilePhoto: true, isOnline: true,
            hospital: { select: { id: true, name: true } },
          },
        },
        soapNote: req.actor.role === 'doctor', // doctors get the SOAP; patients do not
        prescription: true,
      },
    });

    // Strip internal notes entirely for patients (defence in depth — we didn't include them above either)
    if (req.actor.role === 'patient') {
      delete detail.soapNote;
    }

    res.json({ consultation: detail });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────
// MESSAGES — list (filters out InternalNote entirely)
// ─────────────────────────────────────────

router.get('/:id/messages', requireDoctorOrSession, async (req, res, next) => {
  try {
    await loadConsultation(req.params.id, req.actor);

    const messages = await prisma.consultMessage.findMany({
      where: { consultationId: req.params.id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true, senderRole: true, content: true, fileUrl: true,
        seenByPatient: true, seenByDoctor: true, createdAt: true,
      },
    });

    res.json({ messages });
  } catch (err) { next(err); }
});

// REST fallback for sending a message (Socket.io is preferred)
const sendSchema = z.object({
  content: z.string().min(1).max(4000),
  fileUrl: z.string().optional().nullable(),
});

router.post('/:id/messages', requireDoctorOrSession, async (req, res, next) => {
  try {
    await loadConsultation(req.params.id, req.actor);
    const { content, fileUrl } = sendSchema.parse(req.body);
    const senderRole = req.actor.role; // 'doctor' | 'patient'

    const message = await prisma.consultMessage.create({
      data: {
        consultationId: req.params.id,
        senderRole,
        content,
        fileUrl: fileUrl || null,
        seenByDoctor: senderRole === 'doctor',
        seenByPatient: senderRole === 'patient',
      },
    });

    res.status(201).json({ message });
  } catch (err) {
    if (err.name === 'ZodError') return next(new HttpError(400, err.errors.map((e) => e.message).join('; ')));
    next(err);
  }
});

// ─────────────────────────────────────────
// INTERNAL NOTES (doctor only — never returned to patient)
// ─────────────────────────────────────────

const noteSchema = z.object({
  content: z.string().min(1).max(4000),
});

router.post('/:id/internal-notes', requireDoctor, async (req, res, next) => {
  try {
    const consultation = await prisma.consultation.findUnique({ where: { id: req.params.id } });
    if (!consultation) throw new HttpError(404, 'Consultation not found');
    if (consultation.doctorId !== req.doctor.id) throw new HttpError(403, 'Not your consultation');

    const { content } = noteSchema.parse(req.body);
    const note = await prisma.internalNote.create({
      data: { consultationId: req.params.id, content },
    });
    res.status(201).json({ note });
  } catch (err) {
    if (err.name === 'ZodError') return next(new HttpError(400, err.errors.map((e) => e.message).join('; ')));
    next(err);
  }
});

router.get('/:id/internal-notes', requireDoctor, async (req, res, next) => {
  try {
    const consultation = await prisma.consultation.findUnique({ where: { id: req.params.id } });
    if (!consultation) throw new HttpError(404, 'Consultation not found');
    if (consultation.doctorId !== req.doctor.id) throw new HttpError(403, 'Not your consultation');

    const notes = await prisma.internalNote.findMany({
      where: { consultationId: req.params.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ notes });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────
// SOAP NOTE (doctor only)
// ─────────────────────────────────────────

const soapSchema = z.object({
  subjective: z.string().min(1).max(5000),
  objective: z.string().min(1).max(5000),
  assessment: z.string().min(1).max(5000),
  plan: z.string().min(1).max(5000),
  finalized: z.boolean().optional(),
});

router.post('/:id/soap', requireDoctor, async (req, res, next) => {
  try {
    const consultation = await prisma.consultation.findUnique({ where: { id: req.params.id } });
    if (!consultation) throw new HttpError(404, 'Consultation not found');
    if (consultation.doctorId !== req.doctor.id) throw new HttpError(403, 'Not your consultation');

    const data = soapSchema.parse(req.body);
    const note = await prisma.soapNote.upsert({
      where: { consultationId: req.params.id },
      create: { ...data, consultationId: req.params.id },
      update: data,
    });
    res.status(201).json({ soapNote: note });
  } catch (err) {
    if (err.name === 'ZodError') return next(new HttpError(400, err.errors.map((e) => e.message).join('; ')));
    next(err);
  }
});

router.patch('/:id/soap', requireDoctor, async (req, res, next) => {
  try {
    const consultation = await prisma.consultation.findUnique({ where: { id: req.params.id } });
    if (!consultation) throw new HttpError(404, 'Consultation not found');
    if (consultation.doctorId !== req.doctor.id) throw new HttpError(403, 'Not your consultation');

    const data = soapSchema.partial().parse(req.body);
    const note = await prisma.soapNote.update({
      where: { consultationId: req.params.id },
      data,
    });
    res.json({ soapNote: note });
  } catch (err) {
    if (err.name === 'ZodError') return next(new HttpError(400, err.errors.map((e) => e.message).join('; ')));
    next(err);
  }
});

// ─────────────────────────────────────────
// FINALIZE
// ─────────────────────────────────────────

router.post('/:id/finalize', requireDoctor, async (req, res, next) => {
  try {
    const consultation = await prisma.consultation.findUnique({
      where: { id: req.params.id },
      include: { soapNote: true },
    });
    if (!consultation) throw new HttpError(404, 'Consultation not found');
    if (consultation.doctorId !== req.doctor.id) throw new HttpError(403, 'Not your consultation');

    if (consultation.soapNote) {
      await prisma.soapNote.update({
        where: { consultationId: req.params.id },
        data: { finalized: true },
      });
    }

    const [updated] = await prisma.$transaction([
      prisma.consultation.update({
        where: { id: req.params.id },
        data: { status: 'completed', recommendation: req.body.recommendation || null, followUpDate: req.body.followUpDate ? new Date(req.body.followUpDate) : null },
      }),
      prisma.escalation.update({
        where: { id: consultation.escalationId },
        data: { status: 'closed' },
      }),
    ]);

    res.json({ consultation: updated });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────
// RISK LEVEL
// ─────────────────────────────────────────

const riskSchema = z.object({
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
});

router.patch('/:id/risk', requireDoctor, async (req, res, next) => {
  try {
    const consultation = await prisma.consultation.findUnique({ where: { id: req.params.id } });
    if (!consultation) throw new HttpError(404, 'Consultation not found');
    if (consultation.doctorId !== req.doctor.id) throw new HttpError(403, 'Not your consultation');

    const { riskLevel } = riskSchema.parse(req.body);
    const updated = await prisma.consultation.update({
      where: { id: req.params.id },
      data: { riskLevel },
    });
    res.json({ consultation: updated });
  } catch (err) {
    if (err.name === 'ZodError') return next(new HttpError(400, err.errors.map((e) => e.message).join('; ')));
    next(err);
  }
});

export default router;
