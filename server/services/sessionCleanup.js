import cron from 'node-cron';
import fs from 'fs';
import { prisma } from '../utils/prisma.js';
import { logger } from '../utils/logger.js';

// Runs every hour at minute 7. Deletes expired anonymous sessions
// (cascades to messages + scan images). Logs the count.
export function startSessionCleanup() {
  cron.schedule('7 * * * *', async () => {
    const now = new Date();
    try {
      const expired = await prisma.anonymousSession.findMany({
        where: { expiresAt: { lt: now } },
        select: { id: true, scans: { select: { filePath: true } } },
      });

      if (expired.length === 0) {
        logger.debug('session cleanup: nothing to delete');
        return;
      }

      // Best-effort filesystem cleanup (most scans are deleted right after analysis anyway).
      for (const session of expired) {
        for (const scan of session.scans) {
          if (scan.filePath && fs.existsSync(scan.filePath)) {
            try { fs.unlinkSync(scan.filePath); } catch (e) { /* swallow */ }
          }
        }
      }

      const deleted = await prisma.anonymousSession.deleteMany({
        where: { id: { in: expired.map((s) => s.id) } },
      });

      await prisma.securityLog.create({
        data: {
          event: 'session_cleanup',
          metadata: { deletedCount: deleted.count, ranAt: now.toISOString() },
        },
      }).catch(() => {});

      logger.info(`session cleanup: deleted ${deleted.count} expired sessions`);
    } catch (err) {
      logger.error('session cleanup failed', err);
    }
  });

  logger.info('session cleanup cron registered (every hour at :07)');
}
