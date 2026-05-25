import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from './utils/prisma.js';
import { logger } from './utils/logger.js';

let io = null;

export function attachSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    logger.info(`socket connected: ${socket.id}`);

    // Patient or doctor joins a consultation room.
    // Patients authenticate with sessionToken; doctors with JWT.
    socket.on('join-consultation', async ({ consultationId, sessionToken, doctorToken }) => {
      try {
        const consultation = await prisma.consultation.findUnique({
          where: { id: consultationId },
          include: { escalation: true, doctor: true },
        });
        if (!consultation) return socket.emit('error', { message: 'Consultation not found' });

        let role = null;

        if (doctorToken) {
          const payload = jwt.verify(doctorToken, process.env.JWT_SECRET);
          if (payload.doctorId === consultation.doctorId) role = 'doctor';
        } else if (sessionToken) {
          const session = await prisma.anonymousSession.findUnique({
            where: { sessionToken },
            include: { escalation: true },
          });
          if (session && session.escalation && session.escalation.id === consultation.escalationId) {
            role = 'patient';
          }
        }

        if (!role) return socket.emit('error', { message: 'Unauthorized' });

        socket.data.role = role;
        socket.data.consultationId = consultationId;
        socket.join(`consult:${consultationId}`);

        if (role === 'doctor') {
          await prisma.doctor.update({
            where: { id: consultation.doctorId },
            data: { isOnline: true },
          });
          io.to(`consult:${consultationId}`).emit('doctor-online', { doctorId: consultation.doctorId });
        }

        socket.emit('joined', { role, consultationId });
      } catch (err) {
        logger.error('join-consultation failed', err);
        socket.emit('error', { message: 'Could not join consultation' });
      }
    });

    socket.on('send-message', async ({ consultationId, content, fileUrl }) => {
      try {
        if (socket.data.consultationId !== consultationId) {
          return socket.emit('error', { message: 'Not in this consultation room' });
        }
        const senderRole = socket.data.role;
        if (!senderRole) return socket.emit('error', { message: 'Unauthorized' });

        const message = await prisma.consultMessage.create({
          data: {
            consultationId,
            senderRole,
            content: String(content || '').slice(0, 4000),
            fileUrl: fileUrl || null,
            seenByDoctor: senderRole === 'doctor',
            seenByPatient: senderRole === 'patient',
          },
        });

        io.to(`consult:${consultationId}`).emit('new-message', { message });
      } catch (err) {
        logger.error('send-message failed', err);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('typing', ({ consultationId }) => {
      if (socket.data.consultationId !== consultationId) return;
      socket.to(`consult:${consultationId}`).emit('user-typing', { role: socket.data.role });
    });

    socket.on('disconnect', async () => {
      const { consultationId, role } = socket.data || {};
      if (role === 'doctor' && consultationId) {
        try {
          const consultation = await prisma.consultation.findUnique({
            where: { id: consultationId },
          });
          if (consultation) {
            await prisma.doctor.update({
              where: { id: consultation.doctorId },
              data: { isOnline: false },
            });
            io.to(`consult:${consultationId}`).emit('doctor-offline', { doctorId: consultation.doctorId });
          }
        } catch (err) {
          logger.error('disconnect cleanup failed', err);
        }
      }
    });
  });
}

export function getIo() {
  return io;
}
