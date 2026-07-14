import { Router, Response } from 'express';
import { prisma } from '../config/db';
import { requireAuth, requireRoles, AuthenticatedRequest } from '../middleware/auth';
import { writeAuditLog } from '../middleware/auditLog';
import crypto from 'crypto';

const router = Router();

const PAYFAST_MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID || 'SANDBOX_MERCHANT_ID';
const PAYFAST_MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY || 'SANDBOX_MERCHANT_KEY';
const PAYFAST_PASSPHRASE = process.env.PAYFAST_PASSPHRASE || '';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

// GET /api/payments — Admin: all payments
router.get('/', requireAuth, requireRoles('Administrator', 'Super Administrator'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const payments = await prisma.payment.findMany({
      include: { customer: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(payments);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve payments' });
  }
});

// GET /api/payments/my — Customer: own payment history
router.get('/my', requireAuth, requireRoles('Customer'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { customerId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(payments);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve payments' });
  }
});

// POST /api/payments/initiate — Customer: generate PayFast checkout payload
router.post('/initiate', requireAuth, requireRoles('Customer'), async (req: AuthenticatedRequest, res: Response) => {
  const { type, amount } = req.body;
  if (!type || !amount) return res.status(400).json({ error: 'type and amount are required' });

  try {
    const customer = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    // Create pending payment record
    const payment = await prisma.payment.create({
      data: {
        customerId: customer.id,
        customerName: customer.name,
        type,
        amount,
        status: 'Pending',
        date: new Date().toISOString().slice(0, 10),
      },
    });

    // Build PayFast form data
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
      amount: amount.toFixed(2),
      item_name: `Same Day Assist - ${type}`,
    };

    // Generate PayFast signature
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

// POST /api/payments/webhook — PayFast IPN webhook callback
router.post('/webhook', async (req: any, res: Response) => {
  try {
    const pfData = req.body;
    const paymentId = pfData.m_payment_id;

    if (!paymentId) return res.status(400).send('Missing payment ID');

    // Verify PayFast signature
    const pfParamString = Object.keys(pfData)
      .filter(k => k !== 'signature')
      .map(k => `${k}=${encodeURIComponent(pfData[k].trim())}`)
      .join('&');
    const calculatedSignature = crypto.createHash('md5').update(pfParamString).digest('hex');

    if (pfData.payment_status !== 'COMPLETE' || calculatedSignature !== pfData.signature) {
      console.warn('[Payments/Webhook] Signature mismatch or incomplete payment');
      return res.status(400).send('Invalid payment');
    }

    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) return res.status(404).send('Payment not found');

    // Update payment status
    await prisma.payment.update({ where: { id: paymentId }, data: { status: 'Paid' } });

    // Update customer status to Active Member
    const customer = await prisma.user.findUnique({ where: { id: payment.customerId } });
    if (customer && payment.type === 'Onboarding Fee') {
      await prisma.user.update({
        where: { id: payment.customerId },
        data: {
          status: 'Active Member',
          memberSince: new Date().toISOString().slice(0, 10),
          totalPaid: { increment: payment.amount },
        },
      });

      await writeAuditLog({
        userId: payment.customerId,
        userType: 'Customer',
        action: 'Membership Activated',
        details: `Customer ${customer.name} completed onboarding payment of R${payment.amount}. Membership is now ACTIVE.`,
        newValue: { status: 'Active Member', paymentId },
      });
    }

    return res.status(200).send('OK');
  } catch (error) {
    console.error('[Payments/Webhook]', error);
    return res.status(500).send('Server error');
  }
});

export default router;
