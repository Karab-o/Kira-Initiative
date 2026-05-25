import { Router } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { HttpError } from '../middleware/errorHandler.js';

const router = Router();

const SESSION_TTL_HOURS = Number(process.env.SESSION_TTL_HOURS) || 24;

const createSchema = z.object({
  language: z.enum(['en', 'rw']).optional(),
});

router.post('/', async (req, res, next) => {
  try {
    const { language } = createSchema.parse(req.body || {});
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000);

    const session = await prisma.anonymousSession.create({
      data: {
        sessionToken,
        language: language || 'en',
        expiresAt,
      },
      select: {
        id: true, sessionToken: true, language: true,
        severityLevel: true, scanLocked: true, isSexualHealth: true,
        createdAt: true, expiresAt: true,
      },
    });

    res.status(201).json({ session });
  } catch (err) {
    if (err.name === 'ZodError') return next(new HttpError(400, err.errors.map((e) => e.message).join('; ')));
    next(err);
  }
});

router.get('/:token', async (req, res, next) => {
  try {
    const session = await prisma.anonymousSession.findUnique({
      where: { sessionToken: req.params.token },
      select: {
        id: true, language: true, currentTopic: true,
        isSexualHealth: true, scanLocked: true, severityLevel: true,
        createdAt: true, expiresAt: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          select: { id: true, role: true, content: true, careBadge: true, scanResult: true, createdAt: true },
        },
        escalation: { select: { id: true, status: true } },
      },
    });
    if (!session) throw new HttpError(404, 'Session not found');
    if (session.expiresAt < new Date()) throw new HttpError(410, 'Session expired');

    res.json({ session });
  } catch (err) { next(err); }
});

router.delete('/:token', async (req, res, next) => {
  try {
    const found = await prisma.anonymousSession.findUnique({
      where: { sessionToken: req.params.token },
      select: { id: true },
    });
    if (!found) return res.json({ ok: true });
    await prisma.anonymousSession.delete({ where: { id: found.id } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
