import { Router, Response } from 'express';
import { prisma } from '../config/db';
import { requireAuth, requireRoles, AuthenticatedRequest } from '../middleware/auth';
import { writeAuditLog } from '../middleware/auditLog';
import {
  calculatePaymentBreakdown,
  calculateBillingDates,
  getPaymentScheduleForPlan,
  processPayment,
  retryPayment,
  getMembershipPaymentTimeline,
} from '../services/paymentService';
import crypto from 'crypto';

const router = Router();

const PAYFAST_MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID || 'SANDBOX_MERCHANT_ID';
const PAYFAST_MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY || 'SANDBOX_MERCHANT_KEY';
const PAYFAST_PASSPHRASE = process.env.PAYFAST_PASSPHRASE || '';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

// ==========================================
// 1. PUBLIC / AUTH: PAYMENT SCHEDULE CALCULATION
// ==========================================
// GET /api/payments/schedule/:planId — Returns 20/40/40 decimal breakdown & dates
router.get('/schedule/:planId', async (req: any, res: Response) => {
  try {
    const { planId } = req.params;
    const { startDate, billingDay } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date();
    const day = billingDay ? parseInt(billingDay as string, 10) : 25;

    const schedule = getPaymentScheduleForPlan(planId, start, day);
    return res.json(schedule);
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Failed to calculate payment schedule' });
  }
});

// ==========================================
// 2. CUSTOMER: PAYMENT HISTORY & TIMELINE
// ==========================================
// GET /api/payments/my — Customer's payment history and complete timeline
router.get('/my', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const timeline = await getMembershipPaymentTimeline(userId);

    const payments = await prisma.payment.findMany({
      where: { customerId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        invoice: {
          select: { id: true, invoiceNumber: true, total: true, paymentStatus: true },
        },
      },
    });

    return res.json({
      payments,
      timeline,
    });
  } catch (error) {
    console.error('[Payments/My]', error);
    return res.status(500).json({ error: 'Failed to retrieve payment history' });
  }
});

// GET /api/payments/timeline/:userId? — Visual 3-stage activation timeline
router.get('/timeline/:userId?', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    let targetUserId = req.user!.id;

    // Admins can inspect any user's timeline
    if (req.params.userId) {
      if (req.user!.role !== 'ADMIN' && req.user!.role !== 'Administrator' && req.user!.role !== 'Super Administrator') {
        return res.status(403).json({ error: 'Unauthorized to view other customer payment timelines' });
      }
      targetUserId = req.params.userId;
    }

    const timeline = await getMembershipPaymentTimeline(targetUserId);
    if (!timeline) {
      return res.status(404).json({ error: 'No membership or payment schedule found for this customer' });
    }

    return res.json(timeline);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to retrieve payment timeline' });
  }
});

// ==========================================
// 3. PAYMENT PROCESSING & ACTIVATION
// ==========================================
// POST /api/payments/pay-activation — Process an activation stage or scheduled payment
router.post('/pay-activation', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { paymentId, paymentMethod = 'Card', simulateFailure = false } = req.body;

    let targetPaymentId = paymentId;

    // If paymentId not provided directly, find next pending payment for authenticated user
    if (!targetPaymentId) {
      const pendingPayment = await prisma.payment.findFirst({
        where: {
          customerId: req.user!.id,
          status: { in: ['Pending', 'Failed'] },
        },
        orderBy: { createdAt: 'asc' },
      });

      if (!pendingPayment) {
        return res.status(400).json({ error: 'No pending payment found to process' });
      }
      targetPaymentId = pendingPayment.id;
    }

    // Verify ownership if not admin
    const paymentRecord = await prisma.payment.findUnique({ where: { id: targetPaymentId } });
    if (!paymentRecord) return res.status(404).json({ error: 'Payment not found' });

    if (
      paymentRecord.customerId !== req.user!.id &&
      req.user!.role !== 'ADMIN' &&
      req.user!.role !== 'Administrator' &&
      req.user!.role !== 'Super Administrator'
    ) {
      return res.status(403).json({ error: 'Unauthorized to process this payment' });
    }

    // Process payment through server-side lifecycle engine
    const result = await processPayment({
      paymentId: targetPaymentId,
      status: simulateFailure ? 'Failed' : 'Successful',
      gatewayReference: `GW-SDA-${Date.now()}`,
      paymentMethod,
      failureReason: simulateFailure ? 'Bank decline: Insufficient balance / 3DS authentication rejected' : undefined,
      actorId: req.user!.id,
      actorRole: req.user!.role || 'Customer',
    });

    const updatedTimeline = await getMembershipPaymentTimeline(paymentRecord.customerId || req.user!.id);

    return res.json({
      ...result,
      timeline: updatedTimeline,
    });
  } catch (error: any) {
    console.error('[Payments/PayActivation]', error);
    return res.status(500).json({ error: error.message || 'Payment processing failed' });
  }
});

// POST /api/payments/:id/retry — Retry a failed payment
router.post('/:id/retry', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const payment = await prisma.payment.findUnique({ where: { id: req.params.id } });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    if (
      payment.customerId !== req.user!.id &&
      req.user!.role !== 'ADMIN' &&
      req.user!.role !== 'Administrator' &&
      req.user!.role !== 'Super Administrator'
    ) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { paymentMethod = 'Card' } = req.body;
    const result = await retryPayment(payment.id, `GW-RETRY-${Date.now()}`, paymentMethod);

    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Payment retry failed' });
  }
});

// ==========================================
// 4. PAYFAST / GATEWAY INITIATION & WEBHOOK
// ==========================================
// POST /api/payments/initiate — Customer: generate PayFast checkout payload
router.post('/initiate', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { type, amount, membershipId, paymentStage } = req.body;
  if (!amount) return res.status(400).json({ error: 'amount is required' });

  try {
    const customer = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    // Create pending payment record
    const payment = await prisma.payment.create({
      data: {
        customerId: customer.id,
        customerName: customer.name,
        membershipId: membershipId || null,
        paymentStage: paymentStage || 'RECURRING_MONTHLY',
        type: type || 'Membership Payment',
        amount: Number(amount),
        status: 'Pending',
        date: new Date().toISOString().slice(0, 10),
        transactionRef: `PF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      },
    });

    const pfData: Record<string, string> = {
      merchant_id: PAYFAST_MERCHANT_ID,
      merchant_key: PAYFAST_MERCHANT_KEY,
      return_url: `${APP_URL}/payment/success?paymentId=${payment.id}`,
      cancel_url: `${APP_URL}/payment/cancelled`,
      notify_url: `${APP_URL}/api/payments/webhook`,
      name_first: customer.name.split(' ')[0],
      name_last: customer.name.split(' ').slice(1).join(' ') || 'Client',
      email_address: customer.email,
      m_payment_id: payment.id,
      amount: Number(amount).toFixed(2),
      item_name: `Same Day Assist - ${type || 'Membership'}`,
    };

    if (PAYFAST_PASSPHRASE) pfData.passphrase = PAYFAST_PASSPHRASE;
    const pfString = Object.keys(pfData)
      .filter(k => k !== 'passphrase' || PAYFAST_PASSPHRASE)
      .map(k => `${k}=${encodeURIComponent(pfData[k].trim())}`)
      .join('&');
    const signature = crypto.createHash('md5').update(pfString).digest('hex');
    pfData.signature = signature;

    const isSandbox = !process.env.PAYFAST_MERCHANT_ID;
    const pfHost = isSandbox ? 'sandbox.payfast.co.za' : 'www.payfast.co.za';

    return res.json({
      paymentId: payment.id,
      pfHost,
      pfData,
      checkoutUrl: `https://${pfHost}/eng/process`,
    });
  } catch (error) {
    console.error('[Payments/Initiate]', error);
    return res.status(500).json({ error: 'Failed to initiate payment' });
  }
});

// POST /api/payments/webhook — PayFast IPN webhook callback with idempotency
router.post('/webhook', async (req: any, res: Response) => {
  try {
    const pfData = req.body;
    const paymentId = pfData.m_payment_id;

    if (!paymentId) return res.status(400).send('Missing payment ID');

    // In sandbox or simulated environments, verify signature if passphrase configured
    if (PAYFAST_PASSPHRASE && pfData.signature) {
      const pfParamString = Object.keys(pfData)
        .filter(k => k !== 'signature')
        .map(k => `${k}=${encodeURIComponent(pfData[k].trim())}`)
        .join('&');
      const calculatedSignature = crypto.createHash('md5').update(pfParamString).digest('hex');

      if (calculatedSignature !== pfData.signature) {
        console.warn('[Payments/Webhook] Signature mismatch');
        return res.status(400).send('Invalid signature');
      }
    }

    const isComplete = pfData.payment_status === 'COMPLETE' || pfData.status === 'COMPLETE' || pfData.status === 'Successful';

    const result = await processPayment({
      paymentId,
      status: isComplete ? 'Successful' : 'Failed',
      gatewayReference: pfData.pf_payment_id || `PF-GW-${Date.now()}`,
      paymentMethod: pfData.payment_method || 'PayFast',
      failureReason: !isComplete ? pfData.reason || 'Payment uncompleted at gateway' : undefined,
    });

    console.log(`[Payments/Webhook] Processed payment ${paymentId}: ${result.message}`);
    return res.status(200).send('OK');
  } catch (error) {
    console.error('[Payments/Webhook]', error);
    return res.status(500).send('Server error');
  }
});

// ==========================================
// 5. ADMIN DASHBOARD & TIMELINE CONTROLS
// ==========================================
// GET /api/payments/admin/all — Platform-wide payments with filtering
router.get('/admin/all', requireAuth, requireRoles('Administrator', 'Super Administrator', 'Admin', 'ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, stage, customerId } = req.query;

    const where: any = {};
    if (status && status !== 'ALL') where.status = status;
    if (stage && stage !== 'ALL') where.paymentStage = stage;
    if (customerId) where.customerId = customerId;

    const payments = await prisma.payment.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        membership: { select: { id: true, planName: true, status: true, monthlyPrice: true } },
        invoice: { select: { id: true, invoiceNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(payments);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve payments' });
  }
});

// POST /api/payments/admin/trigger-billing — Admin manual billing date trigger
router.post('/admin/trigger-billing', requireAuth, requireRoles('Administrator', 'Super Administrator', 'Admin', 'ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { customerId, membershipId } = req.body;

    let targetMembershipId = membershipId;
    if (!targetMembershipId && customerId) {
      const activeMem = await prisma.membership.findFirst({
        where: { userId: customerId, status: { in: ['Active', 'Pending Activation', 'Payment Due'] } },
        orderBy: { createdAt: 'desc' },
      });
      if (!activeMem) return res.status(404).json({ error: 'No membership found for customer' });
      targetMembershipId = activeMem.id;
    }

    // Find next pending payment
    const nextPayment = await prisma.payment.findFirst({
      where: { membershipId: targetMembershipId, status: { in: ['Pending', 'Failed'] } },
      orderBy: { createdAt: 'asc' },
    });

    if (!nextPayment) {
      return res.status(400).json({ error: 'No pending payment scheduled for this membership' });
    }

    const processRes = await processPayment({
      paymentId: nextPayment.id,
      status: 'Successful',
      gatewayReference: `ADMIN-TRIGGER-${Date.now()}`,
      paymentMethod: 'Debit Order / Direct Charge',
      actorId: req.user!.id,
      actorRole: 'Admin',
    });

    const timeline = await getMembershipPaymentTimeline(nextPayment.customerId!);

    return res.json({
      success: true,
      message: `Triggered payment for ${nextPayment.type}. ${processRes.message}`,
      payment: processRes.payment,
      timeline,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Billing trigger failed' });
  }
});

export default router;
