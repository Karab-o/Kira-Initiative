import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { prisma } from '../utils/prisma.js';
import { requireDoctor } from '../middleware/auth.js';
import { uploadPrescription } from '../middleware/upload.js';
import { HttpError } from '../middleware/errorHandler.js';

const router = Router();

router.post('/', requireDoctor, uploadPrescription.single('prescription'), async (req, res, next) => {
  try {
    if (!req.file) throw new HttpError(400, 'No prescription file uploaded');
    const { consultationId, notes } = req.body;
    if (!consultationId) throw new HttpError(400, 'consultationId is required');

    const consultation = await prisma.consultation.findUnique({ where: { id: consultationId } });
    if (!consultation) throw new HttpError(404, 'Consultation not found');
    if (consultation.doctorId !== req.doctor.id) throw new HttpError(403, 'Not your consultation');

    const filePath = `/uploads/prescriptions/${req.file.filename}`;

    const prescription = await prisma.prescription.upsert({
      where: { consultationId },
      create: { consultationId, filePath, notes: notes || null },
      update: { filePath, notes: notes || null },
    });

    res.status(201).json({ prescription });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const prescription = await prisma.prescription.findUnique({
      where: { id: req.params.id },
      include: { consultation: { include: { escalation: true } } },
    });
    if (!prescription) throw new HttpError(404, 'Prescription not found');

    // Auth: either doctor on this consultation, or patient session attached to escalation
    const authHeader = req.headers.authorization;
    const sessionToken = req.headers['x-session-token'] || req.query.sessionToken;
    let authorised = false;

    if (authHeader?.startsWith('Bearer ')) {
      try {
        const jwt = await import('jsonwebtoken');
        const payload = jwt.default.verify(authHeader.slice(7), process.env.JWT_SECRET);
        if (payload.doctorId === prescription.consultation.doctorId) authorised = true;
      } catch (e) { /* fall through */ }
    }

    if (!authorised && sessionToken) {
      const session = await prisma.anonymousSession.findUnique({ where: { sessionToken: String(sessionToken) } });
      if (session && session.id === prescription.consultation.escalation.sessionId) authorised = true;
    }

    if (!authorised) throw new HttpError(403, 'Not authorised');

    res.json({
      prescription: {
        id: prescription.id,
        filePath: prescription.filePath,
        notes: prescription.notes,
        createdAt: prescription.createdAt,
      },
    });
  } catch (err) { next(err); }
});

export default router;
