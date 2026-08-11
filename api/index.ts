import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { prisma } from '../server/src/config/db';

import fs from 'fs';

dotenv.config();

process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'sda-access-secret-key-12345';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'sda-refresh-secret-key-67890';

// Ensure SQLite DB exists in /tmp for Vercel functions
try {
  const tmpDbPath = path.join('/tmp', 'dev.db');
  if (!fs.existsSync(tmpDbPath)) {
    const srcDb = path.join(process.cwd(), 'prisma', 'dev.db');
    if (fs.existsSync(srcDb)) {
      fs.copyFileSync(srcDb, tmpDbPath);
    } else {
      const rootDb = path.join(process.cwd(), 'dev.db');
      if (fs.existsSync(rootDb)) fs.copyFileSync(rootDb, tmpDbPath);
    }
  }
} catch (e) {
  console.error('[Vercel DB Init]', e);
}

import authRouter from '../server/src/routes/auth';
import enquiriesRouter from '../server/src/routes/enquiries';
import assessmentsRouter from '../server/src/routes/assessments';
import quotationsRouter from '../server/src/routes/quotations';
import paymentsRouter from '../server/src/routes/payments';
import auditLogsRouter from '../server/src/routes/auditLogs';
import filesRouter from '../server/src/routes/files';
import reportsRouter from '../server/src/routes/reports';
import locationsRouter from '../server/src/routes/locations';
import contactsRouter from '../server/src/routes/contacts';
import profileRequestsRouter from '../server/src/routes/profileRequests';
import { createJobsRouter } from '../server/src/routes/jobs';
import verificationRouter from '../server/src/routes/verification';
import ratingsRouter from '../server/src/routes/ratings';
import messagesRouter from '../server/src/routes/messages';
import walletRouter from '../server/src/routes/wallet';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({ status: 'healthy', timestamp: new Date().toISOString(), database: 'connected' });
  } catch (error) {
    return res.status(500).json({ status: 'unhealthy', error: String(error) });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({ status: 'healthy', timestamp: new Date().toISOString(), database: 'connected' });
  } catch (error) {
    return res.status(500).json({ status: 'unhealthy', error: String(error) });
  }
});

// Mount API routers
app.use('/api/auth', authRouter);
app.use('/api/enquiries', enquiriesRouter);
app.use('/api/assessments', assessmentsRouter);
app.use('/api/quotations', quotationsRouter);
app.use('/api/jobs', createJobsRouter());
app.use('/api/payments', paymentsRouter);
app.use('/api/audit-logs', auditLogsRouter);
app.use('/api/files', filesRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/locations', locationsRouter);
app.use('/api/contacts', contactsRouter);
app.use('/api/profile-requests', profileRequestsRouter);
app.use('/api/verification', verificationRouter);
app.use('/api/ratings', ratingsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/wallet', walletRouter);

export default app;
