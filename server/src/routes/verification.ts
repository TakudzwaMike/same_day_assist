import { Router, Response } from 'express';
import { prisma } from '../config/db';
import { requireAuth, requireRoles, AuthenticatedRequest } from '../middleware/auth';
import { writeAuditLog } from '../middleware/auditLog';

const router = Router();

// POST /api/verification/apply — Contractor submits compliance documentation
router.post('/apply', requireAuth, requireRoles('Contractor'), async (req: AuthenticatedRequest, res: Response) => {
  const {
    yearsOfExperience,
    businessLicenseUrl,
    taxClearanceUrl,
    insuranceProofUrl,
    policeClearanceUrl,
    tradeQualificationsUrl,
    coverageAreas,
  } = req.body;

  try {
    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        verificationStatus: 'Pending Review',
        yearsOfExperience: parseInt(yearsOfExperience || '1', 10),
        businessLicenseUrl: businessLicenseUrl || null,
        taxClearanceUrl: taxClearanceUrl || null,
        insuranceProofUrl: insuranceProofUrl || null,
        policeClearanceUrl: policeClearanceUrl || null,
        tradeQualificationsUrl: tradeQualificationsUrl || null,
        coverageAreaJson: Array.isArray(coverageAreas) ? JSON.stringify(coverageAreas) : JSON.stringify([coverageAreas]),
      },
    });

    await writeAuditLog({
      userId: req.user!.id,
      userType: req.user!.role,
      action: 'Submit Verification Documents',
      details: `Service Provider ${req.user!.email} submitted compliance documentation for vetting review.`,
    });

    return res.json({ success: true, user: updated });
  } catch (error) {
    console.error('[Verification/Apply]', error);
    return res.status(500).json({ error: 'Failed to submit verification application' });
  }
});

// GET /api/verification/applications — Admin lists contractor verification applications
router.get('/applications', requireAuth, requireRoles('Administrator', 'Super Administrator', 'Dispatcher'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const contractors = await prisma.user.findMany({
      where: { role: 'Contractor' },
      include: { providerAwards: true },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(contractors);
  } catch (error) {
    console.error('[Verification/Applications]', error);
    return res.status(500).json({ error: 'Failed to fetch verification applications' });
  }
});

// POST /api/verification/:id/approve — Admin approves contractor application
router.post('/:id/approve', requireAuth, requireRoles('Administrator', 'Super Administrator'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const contractor = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        verificationStatus: 'Approved',
        verifiedAt: new Date(),
        isAvailable: true,
      },
    });

    await writeAuditLog({
      userId: req.user!.id,
      userType: req.user!.role,
      action: 'Approve Contractor Vetting',
      details: `Administrator ${req.user!.email} approved compliance documents for contractor ${contractor.email}`,
    });

    return res.json({ success: true, contractor });
  } catch (error) {
    console.error('[Verification/Approve]', error);
    return res.status(500).json({ error: 'Failed to approve contractor application' });
  }
});

// POST /api/verification/:id/request-info — Admin requests additional information
router.post('/:id/request-info', requireAuth, requireRoles('Administrator', 'Super Administrator'), async (req: AuthenticatedRequest, res: Response) => {
  const { notes } = req.body;
  try {
    const contractor = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        verificationStatus: 'Information Requested',
        verificationNotes: notes || 'Additional documents or clarifications required.',
      },
    });

    await writeAuditLog({
      userId: req.user!.id,
      userType: req.user!.role,
      action: 'Request Additional Info for Vetting',
      details: `Requested info for contractor ${contractor.email}: ${notes}`,
    });

    return res.json({ success: true, contractor });
  } catch (error) {
    console.error('[Verification/RequestInfo]', error);
    return res.status(500).json({ error: 'Failed to request info' });
  }
});

// POST /api/verification/:id/reject — Admin rejects application
router.post('/:id/reject', requireAuth, requireRoles('Administrator', 'Super Administrator'), async (req: AuthenticatedRequest, res: Response) => {
  const { reason } = req.body;
  try {
    const contractor = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        verificationStatus: 'Rejected',
        verificationNotes: reason || 'Application did not meet compliance requirements.',
        isAvailable: false,
      },
    });

    await writeAuditLog({
      userId: req.user!.id,
      userType: req.user!.role,
      action: 'Reject Contractor Vetting',
      details: `Rejected contractor ${contractor.email}: ${reason}`,
    });

    return res.json({ success: true, contractor });
  } catch (error) {
    console.error('[Verification/Reject]', error);
    return res.status(500).json({ error: 'Failed to reject application' });
  }
});

// POST /api/verification/:id/award-badge — Admin grants an achievement award/badge
router.post('/:id/award-badge', requireAuth, requireRoles('Administrator', 'Super Administrator'), async (req: AuthenticatedRequest, res: Response) => {
  const { title, category, iconName } = req.body;
  try {
    const award = await prisma.providerAward.create({
      data: {
        contractorId: req.params.id,
        title: title || 'Certificated Top Performer',
        category: category || 'Performance Excellence',
        iconName: iconName || 'Award',
      },
    });

    // Update contractor badgeTitles JSON
    const contractor = await prisma.user.findUnique({ where: { id: req.params.id }, include: { providerAwards: true } });
    if (contractor) {
      const titles = contractor.providerAwards.map(a => a.title);
      await prisma.user.update({
        where: { id: req.params.id },
        data: {
          badgeTitles: JSON.stringify(titles),
          isFeatured: true,
        },
      });
    }

    return res.json({ success: true, award });
  } catch (error) {
    console.error('[Verification/AwardBadge]', error);
    return res.status(500).json({ error: 'Failed to award badge' });
  }
});

export default router;
