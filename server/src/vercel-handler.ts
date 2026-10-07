import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { prisma } from './config/db';
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

import authRouter from './routes/auth';
import enquiriesRouter from './routes/enquiries';
import assessmentsRouter from './routes/assessments';
import quotationsRouter from './routes/quotations';
import paymentsRouter from './routes/payments';
import auditLogsRouter from './routes/auditLogs';
import filesRouter from './routes/files';
import reportsRouter from './routes/reports';
import locationsRouter from './routes/locations';
import contactsRouter from './routes/contacts';
import profileRequestsRouter from './routes/profileRequests';
import { createJobsRouter } from './routes/jobs';
import verificationRouter from './routes/verification';
import ratingsRouter from './routes/ratings';
import messagesRouter from './routes/messages';
import walletRouter from './routes/wallet';
import vehiclesRouter from './routes/vehicles';
import membershipsRouter from './routes/memberships';
import claimsRouter from './routes/claims';
import invoicesRouter from './routes/invoices';

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
    return res.json({ status: 'healthy', timestamp: new Date().toISOString(), note: String(error) });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({ status: 'healthy', timestamp: new Date().toISOString(), database: 'connected' });
  } catch (error) {
    return res.json({ status: 'healthy', timestamp: new Date().toISOString(), note: String(error) });
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
app.use('/api/vehicles', vehiclesRouter);
app.use('/api/profile-requests', profileRequestsRouter);
app.use('/api/verification', verificationRouter);
app.use('/api/ratings', ratingsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/wallet', walletRouter);
app.use('/api/memberships', membershipsRouter);
app.use('/api/claims', claimsRouter);
app.use('/api/invoices', invoicesRouter);

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
    
    // Query invoice by id or invoiceNumber
    const invoice = await prisma.invoice.findFirst({
      where: { OR: [{ id: req.params.id }, { invoiceNumber: req.params.id }] },
      include: { user: true, claim: true },
    });

    if (invoice) {
      const pdfBuffer = await generateInvoicePDF({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customerName,
        customerEmail: invoice.customerEmail || invoice.user?.email || '',
        customerAddress: invoice.customerAddress || invoice.user?.address || '',
        membershipPlan: invoice.membershipPlan,
        serviceRequested: invoice.serviceRequested,
        serviceReference: invoice.jobId || undefined,
        claimNumber: invoice.claim?.claimNumber || undefined,
        technicianName: invoice.technicianName || 'Same Day Assist Responder',
        parts: invoice.parts,
        labour: invoice.labour,
        otherCharges: invoice.otherCharges,
        subtotal: invoice.subtotal,
        taxVat: invoice.taxVat,
        total: invoice.total,
        amountCoveredByBenefit: invoice.amountCoveredByBenefit,
        amountPayableByCustomer: invoice.amountPayableByCustomer,
        date: invoice.date.toISOString(),
        status: invoice.paymentStatus,
        invoiceStatus: invoice.invoiceStatus,
      });
      res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"` });
      return res.send(pdfBuffer);
    }

    // Fallback: check Payment table
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: { customer: true },
    });
    if (!payment) return res.status(404).json({ error: 'Invoice record not found' });
    const pdfBuffer = await generateInvoicePDF({
      id: payment.id,
      customerName: payment.customerName,
      customerEmail: payment.customer?.email,
      type: payment.type,
      amount: payment.amount,
      date: payment.date,
      status: payment.status,
    });
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="SDA-Invoice-${payment.id}.pdf"` });
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('[PDF/Invoice]', error);
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
      customerName: job.customer?.name || job.nonMemberName || 'Customer',
      customerAddress: job.customer?.address || job.nonMemberAddress || 'Customer Location',
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

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Vercel Server Error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
