import { Router, Response } from 'express';
import { prisma } from '../config/db';
import { requireAuth, requireRoles, AuthenticatedRequest } from '../middleware/auth';
import { writeAuditLog } from '../middleware/auditLog';

const router = Router();

// GET /api/profile-requests — List all pending or past profile change requests (Admin/SuperAdmin)
router.get('/', requireAuth, requireRoles('Administrator', 'Super Administrator'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requests = await prisma.profileUpdateRequest.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true, phone: true },
        },
      },
      orderBy: { requestedAt: 'desc' },
    });

    const parsed = requests.map(r => ({
      ...r,
      proposedChanges: JSON.parse(r.proposedChanges),
    }));

    return res.json(parsed);
  } catch (error) {
    console.error('[ProfileRequests/GET]', error);
    return res.status(500).json({ error: 'Failed to fetch profile requests' });
  }
});

// POST /api/profile-requests/:id/approve — Approve a sensitive profile update request
router.post('/:id/approve', requireAuth, requireRoles('Administrator', 'Super Administrator'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const profileReq = await prisma.profileUpdateRequest.findUnique({ where: { id: req.params.id } });
    if (!profileReq) return res.status(404).json({ error: 'Profile update request not found' });
    if (profileReq.status !== 'Pending') {
      return res.status(400).json({ error: `Request has already been ${profileReq.status}` });
    }

    const proposed = JSON.parse(profileReq.proposedChanges);

    // Apply updates to user
    await prisma.user.update({
      where: { id: profileReq.userId },
      data: {
        ...proposed,
        lastProfileUpdateAt: new Date(),
      },
    });

    // Mark request as Approved
    const updatedReq = await prisma.profileUpdateRequest.update({
      where: { id: req.params.id },
      data: {
        status: 'Approved',
        reviewedAt: new Date(),
        reviewedBy: req.user!.id,
      },
    });

    await writeAuditLog({
      userId: req.user!.id,
      userType: req.user!.role,
      action: 'Approve Profile Update',
      details: `Approved profile update request ${profileReq.id} for user ${profileReq.userId}`,
    });

    return res.json({ success: true, request: updatedReq });
  } catch (error) {
    console.error('[ProfileRequests/Approve]', error);
    return res.status(500).json({ error: 'Failed to approve profile update' });
  }
});

// POST /api/profile-requests/:id/reject — Reject a profile update request
router.post('/:id/reject', requireAuth, requireRoles('Administrator', 'Super Administrator'), async (req: AuthenticatedRequest, res: Response) => {
  const { rejectionReason } = req.body;
  try {
    const profileReq = await prisma.profileUpdateRequest.findUnique({ where: { id: req.params.id } });
    if (!profileReq) return res.status(404).json({ error: 'Profile update request not found' });

    const updatedReq = await prisma.profileUpdateRequest.update({
      where: { id: req.params.id },
      data: {
        status: 'Rejected',
        reviewedAt: new Date(),
        reviewedBy: req.user!.id,
        rejectionReason: rejectionReason || 'Information provided could not be verified.',
      },
    });

    await writeAuditLog({
      userId: req.user!.id,
      userType: req.user!.role,
      action: 'Reject Profile Update',
      details: `Rejected profile update request ${profileReq.id} for user ${profileReq.userId}`,
    });

    return res.json({ success: true, request: updatedReq });
  } catch (error) {
    console.error('[ProfileRequests/Reject]', error);
    return res.status(500).json({ error: 'Failed to reject profile update' });
  }
});

// POST /api/profile-requests/override-lock/:userId — Admin override to unlock a user's 60-day profile edit lock
router.post('/override-lock/:userId', requireAuth, requireRoles('Administrator', 'Super Administrator'), async (req: AuthenticatedRequest, res: Response) => {

  try {
    const targetUser = await prisma.user.findUnique({ where: { id: req.params.userId } });
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    // Reset lastProfileUpdateAt to null so user can edit immediately
    await prisma.user.update({
      where: { id: req.params.userId },
      data: { lastProfileUpdateAt: null },
    });

    await writeAuditLog({
      userId: req.user!.id,
      userType: req.user!.role,
      action: 'Override Profile Lock',
      details: `Administrator ${req.user!.email} bypassed 60-day profile edit lock for user ${targetUser.email}`,
    });


    return res.json({ success: true, message: `Profile edit lock successfully bypassed for ${targetUser.name}` });
  } catch (error) {
    console.error('[ProfileRequests/OverrideLock]', error);
    return res.status(500).json({ error: 'Failed to override profile lock' });
  }
});

export default router;
