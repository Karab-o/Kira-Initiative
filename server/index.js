import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

import { logger } from './utils/logger.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { generalRateLimit } from './middleware/rateLimit.js';
import { attachSocket } from './socket.js';
import { startSessionCleanup } from './services/sessionCleanup.js';

import authRoutes from './routes/auth.js';
import sessionRoutes from './routes/sessions.js';
import aiRoutes from './routes/ai.js';
import safetyRoutes from './routes/safety.js';
import escalationRoutes from './routes/escalations.js';
import doctorRoutes from './routes/doctors.js';
import consultationRoutes from './routes/consultations.js';
import prescriptionRoutes from './routes/prescriptions.js';
import appointmentRoutes from './routes/appointments.js';
import hospitalRoutes from './routes/hospitals.js';
import feedRoutes from './routes/feed.js';
import adminRoutes from './routes/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const server = http.createServer(app);

// Trust the first hop (Render / Railway / Heroku reverse proxy).
// This makes req.ip accurate for rate limiting and security logs.
app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Broad rate limit on all /api routes (120 req/min/IP).
// Specific routes (AI, auth) have tighter limits applied at the router level.
app.use('/api', generalRateLimit);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'kira-api', time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/safety', safetyRoutes);
app.use('/api/escalations', escalationRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

attachSocket(server);
startSessionCleanup();

const port = Number(process.env.PORT) || 4000;
server.listen(port, () => {
  logger.info(`Kira API listening on http://localhost:${port}`);
});
