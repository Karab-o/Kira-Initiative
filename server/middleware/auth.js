import { verifyDoctorToken } from '../utils/jwt.js';
import { HttpError } from './errorHandler.js';
import { prisma } from '../utils/prisma.js';

export async function requireDoctor(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new HttpError(401, 'Missing auth token');

    const payload = verifyDoctorToken(token);
    const doctor = await prisma.doctor.findUnique({
      where: { id: payload.doctorId },
      select: {
        id: true, email: true, fullName: true, role: true,
        verificationStatus: true, hospitalId: true,
      },
    });
    if (!doctor) throw new HttpError(401, 'Doctor not found');
    if (doctor.verificationStatus !== 'approved') {
      throw new HttpError(403, 'Doctor account is not verified yet');
    }

    req.doctor = doctor;
    next();
  } catch (err) {
    if (err.statusCode) return next(err);
    next(new HttpError(401, 'Invalid or expired token'));
  }
}

export function requireAdmin(req, _res, next) {
  if (!req.doctor) return next(new HttpError(401, 'Auth required'));
  if (req.doctor.role !== 'admin') return next(new HttpError(403, 'Admin access required'));
  next();
}
