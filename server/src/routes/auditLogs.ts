import { Router, Response } from 'express';
import { prisma } from '../config/db';
import { requireAuth, requireRoles, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/audit-logs — Super Admin only
router.get('/', requireAuth, requireRoles('Super Administrator'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { limit = '50', offset = '0', action, userId } = req.query;
    
    const where: any = {};
    if (action) where.action = { contains: action as string };
    if (userId) where.userId = userId as string;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { timestamp: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      }),
      prisma.auditLog.count({ where }),
    ]);

    return res.json({ logs, total, limit: parseInt(limit as string), offset: parseInt(offset as string) });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve audit logs' });
  }
});

export default router;
