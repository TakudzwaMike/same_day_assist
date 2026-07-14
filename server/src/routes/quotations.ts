import { Router, Response } from 'express';
import { prisma } from '../config/db';
import { requireAuth, requireRoles, AuthenticatedRequest } from '../middleware/auth';
import { validate, quotationSchema } from '../middleware/validation';
import { writeAuditLog } from '../middleware/auditLog';

const router = Router();

// GET /api/quotations — Admin: all quotations
router.get('/', requireAuth, requireRoles('Administrator', 'Super Administrator'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const quotations = await prisma.quotation.findMany({
      include: { enquiry: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(quotations.map(q => ({ ...q, lineItems: JSON.parse(q.lineItems) })));
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve quotations' });
  }
});

// GET /api/quotations/my — Customer: own quotations
router.get('/my', requireAuth, requireRoles('Customer'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const quotations = await prisma.quotation.findMany({
      where: {
        enquiry: { email: user.email },
      },
      include: { enquiry: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(quotations.map(q => ({ ...q, lineItems: JSON.parse(q.lineItems) })));
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve quotations' });
  }
});

// POST /api/quotations — Admin: manually create quotation
router.post('/', requireAuth, requireRoles('Administrator', 'Super Administrator'), validate(quotationSchema), async (req: AuthenticatedRequest, res: Response) => {
  const { enquiryId, lineItems } = req.body;
  try {
    const enquiry = await prisma.enquiry.findUnique({ where: { id: enquiryId } });
    if (!enquiry) return res.status(404).json({ error: 'Enquiry not found' });

    const amount = lineItems.reduce((sum: number, item: any) => sum + item.cost, 0);
    const formattedItems = lineItems.map((item: any, i: number) => ({
      id: `li-${i}`,
      description: item.description,
      cost: item.cost,
    }));

    const quotation = await prisma.quotation.create({
      data: {
        enquiryId,
        amount,
        lineItems: JSON.stringify(formattedItems),
        status: 'Pending',
      },
    });

    await prisma.enquiry.update({ where: { id: enquiryId }, data: { status: 'Quoted' } });

    const customer = await prisma.user.findFirst({ where: { email: enquiry.email, role: 'Customer' } });
    if (customer) {
      await prisma.user.update({ where: { id: customer.id }, data: { status: 'Awaiting Approval' } });
    }

    await writeAuditLog({
      userId: req.user!.id,
      userType: req.user!.role,
      action: 'Quotation Dispatched',
      details: `Administrator finalized pre-compliance quote of R${amount} for ${enquiry.customerName}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      newValue: { quotationId: quotation.id, amount },
    });

    return res.status(201).json({ ...quotation, lineItems: formattedItems });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create quotation' });
  }
});

// PATCH /api/quotations/:id/approve — Customer: approve quotation
router.patch('/:id/approve', requireAuth, requireRoles('Customer'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: req.params.id },
      include: { enquiry: true },
    });
    if (!quotation) return res.status(404).json({ error: 'Quotation not found' });

    const customer = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    // Verify this quotation belongs to this customer
    if (quotation.enquiry.email.toLowerCase() !== customer.email.toLowerCase()) {
      return res.status(403).json({ error: 'Not authorized to approve this quotation' });
    }
    if (quotation.status !== 'Pending') {
      return res.status(400).json({ error: `Quotation is already ${quotation.status}` });
    }

    const [updatedQuotation] = await prisma.$transaction([
      prisma.quotation.update({
        where: { id: req.params.id },
        data: { status: 'Approved', approvedAt: new Date() },
      }),
      prisma.enquiry.update({
        where: { id: quotation.enquiryId },
        data: { status: 'Approved' },
      }),
      prisma.user.update({
        where: { id: customer.id },
        data: { status: 'Awaiting Repairs' },
      }),
    ]);

    await writeAuditLog({
      userId: req.user!.id,
      userType: req.user!.role,
      action: 'Quotation Approved',
      details: `Customer approved quotation ${req.params.id} for pre-membership repairs`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      previousValue: { status: 'Pending' },
      newValue: { status: 'Approved' },
    });

    return res.json({ ...updatedQuotation, lineItems: JSON.parse(updatedQuotation.lineItems) });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to approve quotation' });
  }
});

// PATCH /api/quotations/:id/decline — Customer: decline quotation
router.patch('/:id/decline', requireAuth, requireRoles('Customer'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: req.params.id },
      include: { enquiry: true },
    });
    if (!quotation) return res.status(404).json({ error: 'Quotation not found' });

    const customer = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!customer || quotation.enquiry.email.toLowerCase() !== customer.email.toLowerCase()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updated = await prisma.quotation.update({
      where: { id: req.params.id },
      data: { status: 'Declined' },
    });

    await writeAuditLog({
      userId: req.user!.id,
      userType: req.user!.role,
      action: 'Quotation Declined',
      details: `Customer declined quotation ${req.params.id}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ ...updated, lineItems: JSON.parse(updated.lineItems) });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to decline quotation' });
  }
});

export default router;
