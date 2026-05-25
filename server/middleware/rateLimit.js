import rateLimit from 'express-rate-limit';

const AI_PER_HOUR = Number(process.env.AI_RATE_LIMIT_PER_HOUR) || 30;

// Per-session rate limit on Claude calls.
// Key resolution: session token first, then IP fallback.
export const aiRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: AI_PER_HOUR,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    req.body?.sessionToken ||
    req.query?.sessionToken ||
    req.headers['x-session-token'] ||
    req.ip,
  message: {
    error: "You've reached today's chat limit. Please rest and come back in a bit — Kira will be here.",
  },
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' },
});

export const generalRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});
