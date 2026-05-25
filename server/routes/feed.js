import { Router } from 'express';
import { prisma } from '../utils/prisma.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Number(req.query.limit) || 20);
    const { topic } = req.query;

    const where = topic ? { topic: String(topic) } : {};
    const [entries, total] = await Promise.all([
      prisma.othersAskedEntry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.othersAskedEntry.count({ where }),
    ]);

    res.json({
      entries,
      pagination: { page, limit, total, hasMore: page * limit < total },
    });
  } catch (err) { next(err); }
});

export default router;
