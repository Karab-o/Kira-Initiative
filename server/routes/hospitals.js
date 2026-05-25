import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { HttpError } from '../middleware/errorHandler.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const hospitals = await prisma.hospital.findMany({
      where: { menHealth: true },
      orderBy: { name: 'asc' },
      select: {
        id: true, name: true, fullName: true, address: true,
        helpdeskPhone: true, type: true, departments: true,
      },
    });
    res.json({ hospitals });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const hospital = await prisma.hospital.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, name: true, fullName: true, address: true,
        helpdeskPhone: true, type: true, departments: true,
      },
    });
    if (!hospital) throw new HttpError(404, 'Hospital not found');
    res.json({ hospital });
  } catch (err) { next(err); }
});

export default router;
