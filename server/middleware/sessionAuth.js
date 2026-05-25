import { prisma } from '../utils/prisma.js';
import { HttpError } from './errorHandler.js';

// Reads sessionToken from either the body, query, or X-Session-Token header.
// Attaches req.session = AnonymousSession record.
export async function requireSession(req, _res, next) {
  try {
    const token =
      req.body?.sessionToken ||
      req.query?.sessionToken ||
      req.headers['x-session-token'];
    if (!token) throw new HttpError(401, 'Missing session token');

    const session = await prisma.anonymousSession.findUnique({
      where: { sessionToken: String(token) },
    });
    if (!session) throw new HttpError(401, 'Invalid session');
    if (session.expiresAt < new Date()) {
      throw new HttpError(401, 'Session expired');
    }

    req.session = session;
    next();
  } catch (err) {
    next(err);
  }
}
