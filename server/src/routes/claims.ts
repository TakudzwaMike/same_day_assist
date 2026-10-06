import { Router, Response } from 'express';
import { prisma } from '../config/db';
import { requireAuth, requireRoles, AuthenticatedRequest } from '../middleware/auth';
// Claims & Assistance Invoices API Router
import { writeAuditLog } from '../middleware/auditLog';
import {
  getMemberBenefitSummary,
  calculateBenefitCoverage,
  deductFromBenefit,
  getOrCreateActiveMembership,
} from '../services/benefitService';

const router = Router();

function generateClaimNumber(): string {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `SDA-CLM-${rand}`;
}

function generateInvoiceNumber(): string {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `SDA-INV-${rand}`;
}

// GET /api/claims/my — Customer: get own claims
router.get('/my', requireAuth, requireRoles('Customer'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const claims = await prisma.claim.findMany({
      where: { userId: req.user!.id },
      include: {
        invoice: true,
        membership: { select: { planName: true, planId: true, annualBenefit: true } },
        job: { select: { id: true, status: true, serviceType: true, servicePerformed: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });
    return res.json(claims);
  } catch (error: any) {
    console.error('[Claims/My]', error);
    return res.status(500).json({ error: 'Failed to retrieve claims' });
  }
});

// GET /api/claims — Admin/Dispatcher: get all claims with search & filters
router.get(
  '/',
  requireAuth,
  requireRoles('Administrator', 'Super Administrator', 'Dispatcher'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { status, search, plan, serviceType } = req.query;

      const where: any = {};
      if (status && status !== 'all') {
        where.status = String(status);
      }
      if (serviceType) {
        where.serviceType = { contains: String(serviceType) };
      }
      if (search) {
        const query = String(search).trim();
        where.OR = [
          { claimNumber: { contains: query } },
          { description: { contains: query } },
          { user: { name: { contains: query } } },
          { user: { email: { contains: query } } },
        ];
      }
      if (plan) {
        where.membership = { planName: { contains: String(plan) } };
      }

      const claims = await prisma.claim.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, package: true } },
          membership: { select: { planName: true, planId: true, annualBenefit: true } },
          invoice: true,
          job: { select: { id: true, status: true, assignedContractor: { select: { name: true } } } },
        },
        orderBy: { submittedAt: 'desc' },
      });

      return res.json(claims);
    } catch (error: any) {
      console.error('[Claims/All]', error);
      return res.status(500).json({ error: 'Failed to retrieve claims' });
    }
  }
);

// GET /api/claims/:id — Customer (own only) / Admin
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const claim = await prisma.claim.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, address: true, package: true } },
        membership: true,
        invoice: true,
        benefitTransactions: { orderBy: { date: 'desc' } },
        job: true,
      },
    });

    if (!claim) return res.status(404).json({ error: 'Claim not found' });

    // Strict Authorization: Customers can only access their own claims
    if (req.user!.role === 'Customer' && claim.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied. You can only view your own claims.' });
    }

    return res.json(claim);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve claim details' });
  }
});

// POST /api/claims/calculate-coverage — Customer or Admin preview coverage
router.post('/calculate-coverage', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { userId, totalAmount, partsAmount, labourAmount } = req.body;
  const targetUserId =
    userId && (req.user!.role === 'Administrator' || req.user!.role === 'Super Administrator')
      ? userId
      : req.user!.id;

  try {
    const coverage = await calculateBenefitCoverage({
      userId: targetUserId,
      totalServiceAmount: parseFloat(totalAmount || 0),
      partsAmount: parseFloat(partsAmount || 0),
      labourAmount: parseFloat(labourAmount || 0),
    });
    return res.json(coverage);
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Calculation failed' });
  }
});

// POST /api/claims — Customer: submit new claim
router.post('/', requireAuth, requireRoles('Customer'), async (req: AuthenticatedRequest, res: Response) => {
  const { serviceType, description, vehicleOrProperty, contractorName, amountClaimed, jobId, supportingDocs } =
    req.body;

  if (!serviceType || !description || amountClaimed === undefined) {
    return res.status(400).json({ error: 'serviceType, description, and amountClaimed are required.' });
  }

  try {
    const membership = await getOrCreateActiveMembership(req.user!.id);
    const claimNumber = generateClaimNumber();

    const claim = await prisma.claim.create({
      data: {
        claimNumber,
        userId: req.user!.id,
        membershipId: membership.id,
        jobId: jobId || null,
        serviceType,
        description,
        vehicleOrProperty: vehicleOrProperty || null,
        contractorName: contractorName || null,
        amountClaimed: parseFloat(amountClaimed),
        amountApproved: 0,
        amountDeductedFromBenefit: 0,
        customerResponsibility: parseFloat(amountClaimed),
        status: 'Submitted',
        supportingDocs: supportingDocs ? JSON.stringify(supportingDocs) : null,
      },
      include: {
        membership: true,
      },
    });

    await writeAuditLog({
      userId: req.user!.id,
      userType: req.user!.role,
      action: 'Claim Created',
      details: `Submitted assistance claim ${claimNumber} for ${serviceType} (R${parseFloat(amountClaimed).toFixed(2)})`,
      newValue: { claimNumber, amountClaimed, serviceType },
    });

    return res.status(201).json(claim);
  } catch (error: any) {
    console.error('[Claims/Create]', error);
    return res.status(500).json({ error: error.message || 'Failed to submit claim' });
  }
});

// PATCH /api/claims/:id/review — Admin review claim & process benefit deduction & invoice
router.patch(
  '/:id/review',
  requireAuth,
  requireRoles('Administrator', 'Super Administrator'),
  async (req: AuthenticatedRequest, res: Response) => {
    const { status, amountApproved, partsAmount, labourAmount, rejectionReason, adminOverride, overrideReason } =
      req.body;

    if (!status) return res.status(400).json({ error: 'Status is required' });

    try {
      const claim = await prisma.claim.findUnique({
        where: { id: req.params.id },
        include: { user: true, membership: true, invoice: true },
      });

      if (!claim) return res.status(404).json({ error: 'Claim not found' });

      let approvedNum = amountApproved !== undefined ? parseFloat(amountApproved) : claim.amountClaimed;
      let partsNum = partsAmount !== undefined ? parseFloat(partsAmount) : 0;
      let labourNum = labourAmount !== undefined ? parseFloat(labourAmount) : approvedNum - partsNum;
      if (labourNum < 0) labourNum = 0;

      let amountDeducted = 0;
      let customerPayable = approvedNum;
      let createdInvoice = claim.invoice;

      if (status === 'Approved') {
        // Calculate benefit coverage
        const coverage = await calculateBenefitCoverage({
          userId: claim.userId,
          totalServiceAmount: approvedNum,
          partsAmount: partsNum,
          labourAmount: labourNum,
        });

        amountDeducted = coverage.amountCoveredByBenefit;
        customerPayable = coverage.amountPayableByCustomer;

        // Perform transactional benefit deduction if coverage > 0
        if (amountDeducted > 0) {
          await deductFromBenefit({
            userId: claim.userId,
            amountToDeduct: amountDeducted,
            description: `Claim ${claim.claimNumber} (${claim.serviceType}) Benefit Coverage`,
            reference: claim.claimNumber,
            claimId: claim.id,
            adminOverride: Boolean(adminOverride),
            overrideReason,
            actorId: req.user!.id,
            actorRole: req.user!.role,
          });
        }

        // Generate / link Tax Invoice if not already created
        if (!createdInvoice) {
          const invNumber = generateInvoiceNumber();
          const userObj = claim.user;
          const membershipObj = claim.membership;

          createdInvoice = await prisma.invoice.create({
            data: {
              invoiceNumber: invNumber,
              userId: claim.userId,
              membershipId: claim.membershipId,
              claimId: claim.id,
              jobId: claim.jobId,
              customerName: userObj.name,
              customerEmail: userObj.email,
              customerAddress: userObj.address,
              membershipPlan: membershipObj ? membershipObj.planName : (userObj.package || 'Assist Plus'),
              serviceRequested: claim.serviceType,
              technicianName: claim.contractorName || 'Same Day Assist Certified Responder',
              parts: partsNum,
              labour: labourNum,
              otherCharges: 0,
              subtotal: approvedNum,
              taxVat: parseFloat((approvedNum * 0.15).toFixed(2)),
              total: approvedNum,
              amountCoveredByBenefit: amountDeducted,
              amountPayableByCustomer: customerPayable,
              paymentStatus: customerPayable === 0 ? 'Paid' : 'Unpaid',
              invoiceStatus: 'Issued',
              paidAt: customerPayable === 0 ? new Date() : null,
              notes: coverage.explanation,
            },
          });

          // Link invoice ID to any created benefit transaction for this claim
          await prisma.benefitTransaction.updateMany({
            where: { claimId: claim.id },
            data: { invoiceId: createdInvoice.id },
          });
        }
      }

      const updatedClaim = await prisma.claim.update({
        where: { id: claim.id },
        data: {
          status,
          amountApproved: status === 'Approved' ? approvedNum : claim.amountApproved,
          amountDeductedFromBenefit: status === 'Approved' ? amountDeducted : claim.amountDeductedFromBenefit,
          customerResponsibility: status === 'Approved' ? customerPayable : claim.customerResponsibility,
          rejectionReason: status === 'Rejected' ? rejectionReason || 'Claim declined by administrator' : null,
          adminOverride: Boolean(adminOverride),
          overrideReason: overrideReason || null,
          reviewedAt: new Date(),
          completedAt: ['Completed', 'Approved'].includes(status) ? new Date() : null,
        },
        include: {
          invoice: true,
          membership: true,
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
      });

      await writeAuditLog({
        userId: req.user!.id,
        userType: req.user!.role,
        action: status === 'Approved' ? 'Claim Approved' : status === 'Rejected' ? 'Claim Rejected' : 'Claim Updated',
        details: `Claim ${claim.claimNumber} updated to ${status}. Approved amount: R${approvedNum.toFixed(2)}, Deducted from annual benefit: R${amountDeducted.toFixed(2)}, Customer owes: R${customerPayable.toFixed(2)}`,
        previousValue: { status: claim.status },
        newValue: { status, amountApproved: approvedNum, amountDeducted, customerPayable },
      });

      return res.json(updatedClaim);
    } catch (error: any) {
      console.error('[Claims/Review]', error);
      return res.status(400).json({ error: error.message || 'Failed to review claim' });
    }
  }
);

export default router;
