import { Router, Response } from 'express';
import { prisma } from '../config/db';
import { requireAuth, requireRoles, AuthenticatedRequest } from '../middleware/auth';
// Membership Subscriptions & Plan Lifecycle Management
import { writeAuditLog } from '../middleware/auditLog';
import { PLANS_LIST, getPlanById } from '../config/plans';
import {
  getMemberBenefitSummary,
  getOrCreateActiveMembership,
  changeCustomerPlan,
  deductFromBenefit,
} from '../services/benefitService';

const router = Router();

// GET /api/memberships/plans — List all 6 membership plans
router.get('/plans', async (req, res: Response) => {
  return res.json(PLANS_LIST);
});

// GET /api/memberships/my — Customer: get own active membership & benefit ledger
router.get('/my', requireAuth, requireRoles('Customer'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const summary = await getMemberBenefitSummary(req.user!.id);
    return res.json(summary);
  } catch (error: any) {
    console.error('[Memberships/My]', error);
    return res.status(500).json({ error: error.message || 'Failed to retrieve membership benefit summary' });
  }
});

// POST /api/memberships/change-plan — Customer: change plan or Admin change for customer
router.post('/change-plan', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { planId, customerId, reason } = req.body;
  if (!planId) return res.status(400).json({ error: 'planId is required' });

  // Security: Only admins can change another customer's plan
  const targetUserId =
    customerId && (req.user!.role === 'Administrator' || req.user!.role === 'Super Administrator')
      ? customerId
      : req.user!.id;

  try {
    const newMembership = await changeCustomerPlan({
      userId: targetUserId,
      newPlanId: planId,
      actorId: req.user!.id,
      actorRole: req.user!.role,
      reason,
    });

    const summary = await getMemberBenefitSummary(targetUserId);
    return res.json({
      success: true,
      message: `Plan successfully updated to ${newMembership.planName}`,
      summary,
    });
  } catch (error: any) {
    console.error('[Memberships/ChangePlan]', error);
    return res.status(500).json({ error: error.message || 'Failed to change membership plan' });
  }
});

// GET /api/memberships/customer/:userId — Admin: get full benefit profile and ledger for any customer
router.get(
  '/customer/:userId',
  requireAuth,
  requireRoles('Administrator', 'Super Administrator', 'Dispatcher'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const summary = await getMemberBenefitSummary(req.params.userId);
      const user = await prisma.user.findUnique({
        where: { id: req.params.userId },
        select: { id: true, name: true, email: true, phone: true, address: true, status: true, package: true, memberSince: true },
      });
      return res.json({ customer: user, summary });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Failed to load customer benefit data' });
    }
  }
);

// POST /api/memberships/customer/:userId/override-deduction — Admin: override deduction
router.post(
  '/customer/:userId/override-deduction',
  requireAuth,
  requireRoles('Administrator', 'Super Administrator'),
  async (req: AuthenticatedRequest, res: Response) => {
    const { amount, description, reference, reason } = req.body;
    if (!amount || !description) {
      return res.status(400).json({ error: 'amount and description are required' });
    }

    try {
      const transaction = await deductFromBenefit({
        userId: req.params.userId,
        amountToDeduct: parseFloat(amount),
        description,
        reference: reference || `ADMIN-ADJ-${Date.now().toString().slice(-4)}`,
        adminOverride: true,
        overrideReason: reason || 'Administrative authorization',
        actorId: req.user!.id,
        actorRole: req.user!.role,
      });

      const summary = await getMemberBenefitSummary(req.params.userId);
      return res.json({ success: true, transaction, summary });
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Override deduction failed' });
    }
  }
);

// POST /api/memberships/customer/:userId/reset-period — Admin: start new benefit year
router.post(
  '/customer/:userId/reset-period',
  requireAuth,
  requireRoles('Administrator', 'Super Administrator'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const current = await prisma.membership.findFirst({
        where: { userId: req.params.userId, status: 'Active' },
        orderBy: { createdAt: 'desc' },
      });
      if (!current) return res.status(404).json({ error: 'Active membership not found' });

      // Supercede old period
      await prisma.membership.update({
        where: { id: current.id },
        data: { status: 'Expired' },
      });

      const now = new Date();
      const oneYearLater = new Date(now);
      oneYearLater.setFullYear(now.getFullYear() + 1);

      const newMembership = await prisma.membership.create({
        data: {
          userId: req.params.userId,
          planId: current.planId,
          planName: current.planName,
          monthlyPrice: current.monthlyPrice,
          annualBenefit: current.annualBenefit,
          benefitYearStart: now,
          benefitYearEnd: oneYearLater,
          status: 'Active',
          benefitTransactions: {
            create: {
              userId: req.params.userId,
              reference: `RENEWAL-${now.getFullYear()}`,
              description: `Annual Benefit Period Renewal (${current.planName})`,
              credit: current.annualBenefit,
              debit: 0,
              balance: current.annualBenefit,
              date: now,
            },
          },
        },
      });

      await writeAuditLog({
        userId: req.user!.id,
        userType: req.user!.role,
        action: 'Benefit Period Reset',
        details: `Reset annual benefit period for customer ${req.params.userId}. New period ends ${oneYearLater.toISOString().slice(0, 10)}. Initial allowance R${current.annualBenefit.toLocaleString()}`,
        newValue: { membershipId: newMembership.id },
      });

      const summary = await getMemberBenefitSummary(req.params.userId);
      return res.json({ success: true, message: 'New benefit period established', summary });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Failed to reset benefit period' });
    }
  }
);

export default router;
