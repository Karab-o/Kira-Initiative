import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { requireSession } from '../middleware/sessionAuth.js';
import { aiRateLimit } from '../middleware/rateLimit.js';
import { HttpError } from '../middleware/errorHandler.js';
import {
  chatReply,
  chatReplyStream,
  classifyConversation,
  analyseScanImage,
  summariseForDoctor,
  isAnthropicBillingError,
} from '../services/claudeService.js';
import { checkMessage, applyClassifierLocks } from '../services/safetyEngine.js';
import { logger } from '../utils/logger.js';

const router = Router();

// ─────────────────────────────────────────
// POST /api/ai/chat — main patient chat (Server-Sent Events stream)
//
// Events emitted:
//   delta   { text }                              — incremental Claude text chunks
//   meta    { careBadge, severity, topic, ... }   — classifier result (sent once near end)
//   refusal { text, reason, resetSession }        — safety blocked, no streaming
//   error   { message }                           — fatal stream error
//   done    {}                                    — stream finished
// ─────────────────────────────────────────

const chatSchema = z.object({
  sessionToken: z.string().min(10),
  message: z.string().min(1).max(2000),
});

router.post('/chat', aiRateLimit, requireSession, async (req, res, next) => {
  let headersSent = false;
  const sendEvent = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data || {})}\n\n`);
  };

  try {
    const { message } = chatSchema.parse(req.body);
    const session = req.session;

    // 1. Safety gate (synchronous — runs before SSE headers so we could 4xx)
    const safety = await checkMessage(message, session);

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    headersSent = true;

    if (!safety.passed) {
      await prisma.message.createMany({
        data: [
          { sessionId: session.id, role: 'user', content: message },
          { sessionId: session.id, role: 'assistant', content: safety.replyText, careBadge: 'green' },
        ],
      });
      sendEvent('refusal', {
        text: safety.replyText,
        reason: safety.reason,
        resetSession: safety.resetSession,
        careBadge: 'green',
      });
      sendEvent('done', {});
      return res.end();
    }

    // 2. Persist user message
    await prisma.message.create({
      data: { sessionId: session.id, role: 'user', content: message },
    });

    // 3. Load prior history (last 40 turns max)
    const history = await prisma.message.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'asc' },
      take: 40,
      select: { role: true, content: true },
    });

    // 4. Kick off classifier in parallel (don't await yet — we want streaming first)
    const classifierPromise = classifyConversation({ history }).catch((err) => {
      logger.warn('classifier failed during stream', err);
      return {
        topic: 'general', severity: 'green', isSexualHealth: false,
        triggerDoctor: false, careBadgeText: 'Handle at home',
        policyViolation: false, violationReason: null,
      };
    });

    // 5. Stream the Claude reply
    let fullText = '';
    let aborted = false;
    req.on('close', () => { aborted = true; });

    try {
      const stream = await chatReplyStream({
        message,
        history: history.slice(0, -1), // exclude the user msg we just added (already in `message`)
        language: session.language,
      });

      for await (const chunk of stream) {
        if (aborted) break;
        const text = chunk.choices[0]?.delta?.content || '';
        if (text) {
          fullText += text;
          sendEvent('delta', { text });
        }
      }
    } catch (streamErr) {
      logger.error('chat stream failed', streamErr);

      // Billing / credits exhausted — send a graceful Kira message instead of a
      // raw error so the user sees something helpful rather than a broken bubble.
      if (isAnthropicBillingError(streamErr)) {
        const gracefulMsg = fullText.length > 0
          ? null  // already sent some text; just close cleanly
          : "I'm having a brief interruption and can't respond right now. Please try again in a moment, or call the hospital helpdesk if your concern is urgent.";

        if (gracefulMsg) {
          sendEvent('delta', { text: gracefulMsg });
          // Persist the fallback as an assistant message
          await prisma.message.create({
            data: { sessionId: session.id, role: 'assistant', content: gracefulMsg, careBadge: 'green' },
          }).catch(() => {});
        }
        sendEvent('done', {});
        return res.end();
      }

      sendEvent('error', { message: 'AI response failed. Please try again.' });
      sendEvent('done', {});
      return res.end();
    }

    // 6. Resolve classifier and apply locks
    const classifier = await classifierPromise;
    await applyClassifierLocks(classifier, session);
    const careBadge = classifier.severity || 'green';

    // 7. Persist assistant message (only if we got at least something)
    if (fullText.length > 0) {
      await prisma.message.create({
        data: {
          sessionId: session.id,
          role: 'assistant',
          content: fullText,
          careBadge,
        },
      });
    }

    // 8. Send final metadata + done
    if (!aborted) {
      sendEvent('meta', {
        careBadge,
        severity: classifier.severity,
        topic: classifier.topic,
        isSexualHealth: classifier.isSexualHealth,
        triggerDoctor: classifier.triggerDoctor,
        careBadgeText: classifier.careBadgeText,
        scanLocked: classifier.isSexualHealth || session.scanLocked,
      });
      sendEvent('done', {});
    }
    res.end();
  } catch (err) {
    if (headersSent) {
      try {
        sendEvent('error', { message: err.message || 'Server error' });
        sendEvent('done', {});
        res.end();
      } catch {}
    } else {
      if (err.name === 'ZodError') return next(new HttpError(400, err.errors.map((e) => e.message).join('; ')));
      next(err);
    }
  }
});

// ─────────────────────────────────────────
// POST /api/ai/classify — silent classifier (callable separately if needed)
// ─────────────────────────────────────────

router.post('/classify', aiRateLimit, requireSession, async (req, res, next) => {
  try {
    const history = await prisma.message.findMany({
      where: { sessionId: req.session.id },
      orderBy: { createdAt: 'asc' },
      select: { role: true, content: true },
    });
    const classifier = await classifyConversation({ history });
    await applyClassifierLocks(classifier, req.session);
    res.json(classifier);
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────
// POST /api/ai/scan — vision analysis (image base64 in body)
// (Production-style scan upload also exists at /api/scans for multipart)
// ─────────────────────────────────────────

const scanSchema = z.object({
  sessionToken: z.string().min(10),
  imageBase64: z.string().min(50),
  mediaType: z.string().optional(),
  chatContext: z.string().max(500).optional(),
});

router.post('/scan', aiRateLimit, requireSession, async (req, res, next) => {
  try {
    const { imageBase64, mediaType, chatContext } = scanSchema.parse(req.body);
    const session = req.session;

    if (session.scanLocked || session.isSexualHealth) {
      return res.status(423).json({
        approved: false,
        reason: 'Scans are not available for this conversation topic',
        scanLocked: true,
      });
    }

    const result = await analyseScanImage({
      imageBase64,
      mediaType: mediaType || 'image/jpeg',
      chatContext: chatContext || '',
    });

    // Save ScanImage record (filePath stays null since this path didn't go through Multer)
    await prisma.scanImage.create({
      data: {
        sessionId: session.id,
        bodyArea: result.bodyArea || 'unknown',
        approved: !!result.approved,
        claudeAnalysis: JSON.stringify(result),
        severity: result.severity || null,
      },
    });

    res.json(result);
  } catch (err) {
    if (err.name === 'ZodError') return next(new HttpError(400, err.errors.map((e) => e.message).join('; ')));
    next(err);
  }
});

// ─────────────────────────────────────────
// POST /api/ai/summarise — anonymous symptom summary for doctor handoff
// ─────────────────────────────────────────

router.post('/summarise', aiRateLimit, requireSession, async (req, res, next) => {
  try {
    const history = await prisma.message.findMany({
      where: { sessionId: req.session.id },
      orderBy: { createdAt: 'asc' },
      select: { role: true, content: true },
    });
    if (history.length === 0) {
      throw new HttpError(400, 'No conversation to summarise');
    }
    const summary = await summariseForDoctor({ history, language: req.session.language });
    res.json({ summary });
  } catch (err) { next(err); }
});

export default router;
