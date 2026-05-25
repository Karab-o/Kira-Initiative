import { Router } from 'express';
import { z } from 'zod';
import { requireSession } from '../middleware/sessionAuth.js';
import { HttpError } from '../middleware/errorHandler.js';
import { checkMessage, preScreenImage } from '../services/safetyEngine.js';

const router = Router();

const msgSchema = z.object({
  sessionToken: z.string().min(10),
  message: z.string().min(1).max(2000),
});

router.post('/check-message', requireSession, async (req, res, next) => {
  try {
    const { message } = msgSchema.parse(req.body);
    const result = await checkMessage(message, req.session);
    res.json(result);
  } catch (err) {
    if (err.name === 'ZodError') return next(new HttpError(400, err.errors.map((e) => e.message).join('; ')));
    next(err);
  }
});

const imgSchema = z.object({
  sessionToken: z.string().min(10),
  imageBase64: z.string().min(50),
});

router.post('/check-image', requireSession, async (req, res, next) => {
  try {
    const { imageBase64 } = imgSchema.parse(req.body);
    const result = await preScreenImage(imageBase64, req.session);
    res.json(result);
  } catch (err) {
    if (err.name === 'ZodError') return next(new HttpError(400, err.errors.map((e) => e.message).join('; ')));
    next(err);
  }
});

export default router;
