import { prisma } from '../utils/prisma.js';
import { logger } from '../utils/logger.js';

// ─────────────────────────────────────────
// PATTERNS — fast deterministic checks before the model.
// Deliberately conservative: only block clearly explicit/abusive content.
// The Claude classifier handles the nuance.
// ─────────────────────────────────────────

const EXPLICIT_PATTERNS = [
  /\b(fuck|shit|cunt|bitch|asshole|motherfucker)\b/i,
  /\b(send|show|share|give).{0,15}(nude|naked|dick|cock|pussy|penis pic)/i,
  /\b(jerk\s*off|wank|cum on|blow\s?job|hand\s?job)\b/i,
];

const IMAGE_REQUEST_PATTERNS = [
  /(picture|photo|pic|image).{0,20}(my|of my)\s*(penis|dick|cock|genital|testicle|scrotum|balls?)/i,
  /(can|will|should) i (send|share|post).{0,30}(below the belt|private part|genital|penis)/i,
];

const SLUR_PATTERNS = [
  // Conservative: only the unambiguous bucket. Claude classifier handles edge cases.
  /\b(faggot|tranny|retard|gook|spic|chink|kike|nigger)\b/i,
];

function detectViolation(text) {
  const t = String(text || '');
  if (SLUR_PATTERNS.some((re) => re.test(t))) {
    return { violation: true, reason: 'hate_speech' };
  }
  if (IMAGE_REQUEST_PATTERNS.some((re) => re.test(t))) {
    return { violation: true, reason: 'inappropriate_image_request' };
  }
  if (EXPLICIT_PATTERNS.some((re) => re.test(t))) {
    return { violation: true, reason: 'explicit_language' };
  }
  return { violation: false, reason: null };
}

// ─────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────

export async function checkMessage(message, session) {
  const { violation, reason } = detectViolation(message);
  if (!violation) return { passed: true };

  const updated = await prisma.anonymousSession.update({
    where: { id: session.id },
    data: { offenceCount: { increment: 1 } },
  });

  const shouldReset = updated.offenceCount >= 2;
  logger.warn(`safety violation on session ${session.id}: ${reason} (count=${updated.offenceCount})`);

  return {
    passed: false,
    reason,
    offenceCount: updated.offenceCount,
    resetSession: shouldReset,
    replyText: shouldReset
      ? "Kira is a health tool. Continued misuse means we need to end this session. You can start a new private session whenever you're ready to be respectful."
      : "Kira is a health tool. Let's keep it respectful so I can help you.",
  };
}

// Permanent per-session locks driven by classifier output.
// Once `isSexualHealth` or `scanLocked` is true, it stays true for this session.
export async function applyClassifierLocks(classifierResult, session) {
  const updates = {};

  if (classifierResult.isSexualHealth === true && !session.isSexualHealth) {
    updates.isSexualHealth = true;
    updates.scanLocked = true;
  }

  if (classifierResult.severity && classifierResult.severity !== session.severityLevel) {
    updates.severityLevel = classifierResult.severity;
  }

  if (classifierResult.topic && classifierResult.topic !== session.currentTopic) {
    updates.currentTopic = classifierResult.topic;
  }

  if (classifierResult.policyViolation === true) {
    updates.offenceCount = { increment: 1 };
  }

  if (Object.keys(updates).length === 0) return session;

  return prisma.anonymousSession.update({
    where: { id: session.id },
    data: updates,
  });
}

// Pre-screen image before sending it to Claude Vision.
// Hard block: if session is flagged as sexual-health, NEVER allow scan.
export async function preScreenImage(_imageBase64, session) {
  if (session.scanLocked || session.isSexualHealth) {
    return {
      passed: false,
      reason: 'Scans are not available for this conversation topic',
    };
  }
  // We delegate the actual content check to Claude Vision (system prompt rejects
  // anything outside face/neck/eyes/mouth and returns approved=false).
  return { passed: true };
}

// Log a security event (best-effort; failures don't break the request).
export async function logSecurityEvent({ doctorId, event, ipAddress, userAgent, metadata }) {
  try {
    await prisma.securityLog.create({
      data: {
        doctorId: doctorId || null,
        event,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        metadata: metadata || undefined,
      },
    });
  } catch (err) {
    logger.error('securityLog write failed', err);
  }
}
