import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import { Server as SocketServer } from 'socket.io';
import { prisma } from './config/db';

// Routes
import authRouter from './routes/auth';
import enquiriesRouter from './routes/enquiries';
import assessmentsRouter from './routes/assessments';
import quotationsRouter from './routes/quotations';
import paymentsRouter from './routes/payments';
import auditLogsRouter from './routes/auditLogs';
import filesRouter from './routes/files';
import reportsRouter from './routes/reports';
import { createJobsRouter } from './routes/jobs';

const app = express();
const server = http.createServer(app);

// Socket.IO for real-time dispatch
const io = new SocketServer(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      connections: io.engine.clientsCount,
    });
  } catch (error) {
    return res.status(503).json({ status: 'unhealthy', database: 'disconnected' });
  }
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/enquiries', enquiriesRouter);
app.use('/api/assessments', assessmentsRouter);
app.use('/api/quotations', quotationsRouter);
app.use('/api/jobs', createJobsRouter(io));
app.use('/api/payments', paymentsRouter);
app.use('/api/audit-logs', auditLogsRouter);
app.use('/api/files', filesRouter);
app.use('/api/reports', reportsRouter);

// PDF download routes
app.get('/api/pdf/quotation/:id', async (req, res) => {
  try {
    const { generateQuotationPDF } = await import('./services/pdf');
    const quotation = await prisma.quotation.findUnique({
      where: { id: req.params.id },
      include: { enquiry: true },
    });
    if (!quotation) return res.status(404).json({ error: 'Quotation not found' });
    const lineItems = JSON.parse(quotation.lineItems);
    const pdfBuffer = await generateQuotationPDF({
      id: quotation.id,
      customerName: quotation.enquiry.customerName,
      customerEmail: quotation.enquiry.email,
      customerAddress: quotation.enquiry.address,
      serviceCategory: quotation.enquiry.serviceCategory,
      lineItems,
      amount: quotation.amount,
      createdAt: quotation.createdAt.toISOString(),
    });
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="SDA-Quote-${quotation.id}.pdf"` });
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('[PDF/Quotation]', error);
    return res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

app.get('/api/pdf/invoice/:id', async (req, res) => {
  try {
    const { generateInvoicePDF } = await import('./services/pdf');
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: { customer: true },
    });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    const pdfBuffer = await generateInvoicePDF({
      id: payment.id,
      customerName: payment.customerName,
      customerEmail: payment.customer.email,
      type: payment.type,
      amount: payment.amount,
      date: payment.date,
      status: payment.status,
    });
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="SDA-Invoice-${payment.id}.pdf"` });
    return res.send(pdfBuffer);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

app.get('/api/pdf/completion/:id', async (req, res) => {
  try {
    const { generateCompletionReportPDF } = await import('./services/pdf');
    const job = await prisma.job.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        assignedContractor: true,
      },
    });
    if (!job || !job.completedAt) return res.status(404).json({ error: 'Completed job not found' });
    const pdfBuffer = await generateCompletionReportPDF({
      jobId: job.id,
      customerName: job.customer.name,
      customerAddress: job.customer.address,
      serviceType: job.serviceType,
      description: job.description,
      contractorName: job.assignedContractor?.name || 'Same Day Assist Responder',
      contractorNotes: job.contractorNotes || '',
      contractorSignature: job.contractorSignature || '',
      completedAt: job.completedAt.toISOString(),
      rating: job.rating || undefined,
    });
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="SDA-Completion-${job.id}.pdf"` });
    return res.send(pdfBuffer);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// WebSocket connections
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  // Join appropriate room based on role and user ID
  socket.on('join', ({ role, userId }: { role: string; userId: string }) => {
    if (role === 'Administrator' || role === 'Super Administrator') {
      socket.join('admin-room');
      console.log(`[Socket.IO] Admin ${userId} joined admin-room`);
    } else if (role === 'Contractor') {
      socket.join(`contractor-${userId}`);
      console.log(`[Socket.IO] Contractor ${userId} joined contractor room`);
    } else if (role === 'Customer') {
      socket.join(`customer-${userId}`);
      console.log(`[Socket.IO] Customer ${userId} joined customer room`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
}

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Server Error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = parseInt(process.env.PORT || '5000');
server.listen(PORT, () => {
  console.log(`\n🚀 Same Day Assist API running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

export { io };
