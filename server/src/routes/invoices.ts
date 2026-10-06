import { Router, Response } from 'express';
import { prisma } from '../config/db';
import { requireAuth, requireRoles, AuthenticatedRequest } from '../middleware/auth';
import { writeAuditLog } from '../middleware/auditLog';
import { generateInvoicePDF } from '../services/pdf';

const router = Router();

function generateInvoiceNumber(): string {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `SDA-INV-${rand}`;
}

// GET /api/invoices/my — Customer: get own invoices
router.get('/my', requireAuth, requireRoles('Customer'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { userId: req.user!.id },
      include: {
        claim: { select: { id: true, claimNumber: true, serviceType: true, status: true } },
        job: { select: { id: true, status: true, serviceType: true } },
        membership: { select: { planName: true, planId: true, annualBenefit: true } },
      },
      orderBy: { date: 'desc' },
    });
    return res.json(invoices);
  } catch (error: any) {
    console.error('[Invoices/My]', error);
    return res.status(500).json({ error: 'Failed to retrieve invoices' });
  }
});

// GET /api/invoices — Admin: get all invoices with full search & filtering
router.get(
  '/',
  requireAuth,
  requireRoles('Administrator', 'Super Administrator', 'Dispatcher'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { search, paymentStatus, plan, dateFrom, dateTo } = req.query;

      const where: any = {};
      if (paymentStatus && paymentStatus !== 'all') {
        where.paymentStatus = String(paymentStatus);
      }
      if (plan) {
        where.membershipPlan = { contains: String(plan) };
      }
      if (search) {
        const query = String(search).trim();
        where.OR = [
          { invoiceNumber: { contains: query } },
          { customerName: { contains: query } },
          { serviceRequested: { contains: query } },
          { claim: { claimNumber: { contains: query } } },
          { user: { email: { contains: query } } },
          { user: { id: { contains: query } } },
        ];
      }
      if (dateFrom || dateTo) {
        where.date = {};
        if (dateFrom) where.date.gte = new Date(String(dateFrom));
        if (dateTo) where.date.lte = new Date(String(dateTo));
      }

      const invoices = await prisma.invoice.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          claim: { select: { id: true, claimNumber: true, status: true } },
          job: { select: { id: true, status: true } },
          membership: { select: { planName: true, planId: true } },
        },
        orderBy: { date: 'desc' },
      });

      return res.json(invoices);
    } catch (error: any) {
      console.error('[Invoices/All]', error);
      return res.status(500).json({ error: 'Failed to retrieve invoices' });
    }
  }
);

// GET /api/invoices/:id — Customer (own only) / Admin
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, address: true } },
        claim: true,
        job: true,
        membership: true,
        benefitTransactions: true,
      },
    });

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    // Strict Authorization: Customers can only access their own invoices
    if (req.user!.role === 'Customer' && invoice.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied. You can only view your own invoices.' });
    }

    return res.json(invoice);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve invoice' });
  }
});

// GET /api/invoices/:id/pdf — Download PDF invoice
router.get('/:id/pdf', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        user: true,
        claim: true,
        job: true,
        membership: true,
      },
    });

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    // Authorization check
    if (req.user!.role === 'Customer' && invoice.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

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

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`,
    });
    return res.send(pdfBuffer);
  } catch (error: any) {
    console.error('[Invoices/PDF]', error);
    return res.status(500).json({ error: 'Failed to generate invoice PDF' });
  }
});

// POST /api/invoices — Admin generate invoice
router.post(
  '/',
  requireAuth,
  requireRoles('Administrator', 'Super Administrator'),
  async (req: AuthenticatedRequest, res: Response) => {
    const {
      customerId,
      claimId,
      jobId,
      serviceRequested,
      technicianName,
      parts,
      labour,
      otherCharges,
      amountCoveredByBenefit,
      amountPayableByCustomer,
      paymentStatus,
      notes,
    } = req.body;

    if (!customerId || !serviceRequested) {
      return res.status(400).json({ error: 'customerId and serviceRequested are required' });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: customerId },
        include: {
          memberships: { where: { status: 'Active' }, take: 1 },
        },
      });
      if (!user) return res.status(404).json({ error: 'Customer not found' });

      const activeMembership = user.memberships[0] || null;
      const partsNum = parseFloat(parts || 0);
      const labourNum = parseFloat(labour || 0);
      const otherNum = parseFloat(otherCharges || 0);
      const subtotalNum = partsNum + labourNum + otherNum;
      const vatNum = parseFloat((subtotalNum * 0.15).toFixed(2));
      const totalNum = subtotalNum;

      const coveredNum = amountCoveredByBenefit !== undefined ? parseFloat(amountCoveredByBenefit) : 0;
      const payableNum = amountPayableByCustomer !== undefined ? parseFloat(amountPayableByCustomer) : Math.max(0, totalNum - coveredNum);

      const invoiceNumber = generateInvoiceNumber();

      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          userId: user.id,
          membershipId: activeMembership?.id || null,
          claimId: claimId || null,
          jobId: jobId || null,
          customerName: user.name,
          customerEmail: user.email,
          customerAddress: user.address,
          membershipPlan: activeMembership?.planName || user.package || 'Assist Plus',
          serviceRequested,
          technicianName: technicianName || 'Same Day Assist Certified Responder',
          parts: partsNum,
          labour: labourNum,
          otherCharges: otherNum,
          subtotal: subtotalNum,
          taxVat: vatNum,
          total: totalNum,
          amountCoveredByBenefit: coveredNum,
          amountPayableByCustomer: payableNum,
          paymentStatus: paymentStatus || (payableNum === 0 ? 'Paid' : 'Unpaid'),
          invoiceStatus: 'Issued',
          paidAt: payableNum === 0 ? new Date() : null,
          notes,
        },
        include: {
          user: true,
          claim: true,
        },
      });

      await writeAuditLog({
        userId: req.user!.id,
        userType: req.user!.role,
        action: 'Invoice Generated',
        details: `Generated Tax Invoice ${invoiceNumber} for ${user.name}. Total: R${totalNum.toFixed(2)}, Covered by benefit: R${coveredNum.toFixed(2)}, Customer payable: R${payableNum.toFixed(2)}`,
        newValue: { invoiceNumber, total: totalNum, covered: coveredNum, payable: payableNum },
      });

      return res.status(201).json(invoice);
    } catch (error: any) {
      console.error('[Invoices/Create]', error);
      return res.status(500).json({ error: error.message || 'Failed to generate invoice' });
    }
  }
);

// PATCH /api/invoices/:id/pay — Pay invoice customer portion
router.patch('/:id/pay', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { paymentMethod, cardLast4 } = req.body;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: { user: true },
    });

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    // Authorization: own invoice or admin
    if (req.user!.role === 'Customer' && invoice.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    if (invoice.paymentStatus === 'Paid') {
      return res.status(400).json({ error: 'Invoice is already paid in full.' });
    }

    const updated = await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        paymentStatus: 'Paid',
        invoiceStatus: 'Settled',
        paidAt: new Date(),
        paymentMethod: paymentMethod || 'Card Online',
      },
    });

    // Record payment in Payments table
    await prisma.payment.create({
      data: {
        customerId: invoice.userId,
        customerName: invoice.customerName,
        jobId: invoice.jobId,
        type: `Invoice Payment (${invoice.invoiceNumber})`,
        amount: invoice.amountPayableByCustomer,
        status: 'Paid',
        paymentMethod: paymentMethod || 'Card Online',
        date: new Date().toISOString().slice(0, 10),
      },
    });

    await writeAuditLog({
      userId: req.user!.id,
      userType: req.user!.role,
      action: 'Invoice Paid',
      details: `Settled customer-payable balance of R${invoice.amountPayableByCustomer.toFixed(2)} on Invoice ${invoice.invoiceNumber} via ${paymentMethod || 'Card'}${cardLast4 ? ` (Card: ****${cardLast4})` : ''}`,
      newValue: { invoiceNumber: invoice.invoiceNumber, amountPaid: invoice.amountPayableByCustomer },
    });

    return res.json({ success: true, message: 'Invoice settled successfully!', invoice: updated });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Payment processing failed' });
  }
});

export default router;
