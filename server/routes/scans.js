import { Router } from 'express';
import fs from 'fs';
import { prisma } from '../utils/prisma.js';
import { requireSession } from '../middleware/sessionAuth.js';
import { uploadScan } from '../middleware/upload.js';
import { aiRateLimit } from '../middleware/rateLimit.js';
import { HttpError } from '../middleware/errorHandler.js';
import { analyseScanImage } from '../services/claudeService.js';
import { preScreenImage } from '../services/safetyEngine.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Multipart upload path — preferred over base64.
router.post('/', aiRateLimit, requireSession, uploadScan.single('image'), async (req, res, next) => {
  let filePath = null;
  try {
    if (!req.file) throw new HttpError(400, 'No image uploaded');
    filePath = req.file.path;

    const session = req.session;
    const fileBuf = fs.readFileSync(filePath);
    const imageBase64 = fileBuf.toString('base64');

    const preCheck = await preScreenImage(imageBase64, session);
    if (!preCheck.passed) {
      fs.unlinkSync(filePath); filePath = null;
      return res.status(423).json({ approved: false, reason: preCheck.reason, scanLocked: true });
    }

    const result = await analyseScanImage({
      imageBase64,
      mediaType: req.file.mimetype || 'image/jpeg',
      chatContext: req.body.chatContext || '',
    });

    // Per safety invariant #7: delete the image file after analysis completes.
    // Keep only the text result.
    try { fs.unlinkSync(filePath); } catch (e) { logger.warn('could not delete scan file', e); }
    filePath = null;

    const scan = await prisma.scanImage.create({
      data: {
        sessionId: session.id,
        filePath: null,
        bodyArea: result.bodyArea || 'unknown',
        approved: !!result.approved,
        claudeAnalysis: JSON.stringify(result),
        severity: result.severity || null,
      },
      select: {
        id: true, bodyArea: true, approved: true, severity: true, claudeAnalysis: true, createdAt: true,
      },
    });

    res.status(201).json({ scan, ...result });
  } catch (err) {
    if (filePath && fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) { /* swallow */ }
    }
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const scan = await prisma.scanImage.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, sessionId: true, bodyArea: true, approved: true,
        severity: true, claudeAnalysis: true, createdAt: true,
      },
    });
    if (!scan) throw new HttpError(404, 'Scan not found');
    res.json({ scan });
  } catch (err) { next(err); }
});

export default router;
