import { Router, Response } from 'express';
import { prisma } from '../config/db';
import { requireAuth, requireRoles, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/reports/dashboard — Admin: key operational metrics
router.get('/dashboard', requireAuth, requireRoles('Administrator', 'Super Administrator'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const [
      totalCustomers,
      activeMembers,
      pendingEnquiries,
      openJobs,
      completedJobs,
      totalRevenue,
      availableContractors,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'Customer' } }),
      prisma.user.count({ where: { role: 'Customer', status: 'Active Member' } }),
      prisma.enquiry.count({ where: { status: 'Pending' } }),
      prisma.job.count({ where: { status: { notIn: ['Completed', 'Closed', 'Archived'] } } }),
      prisma.job.count({ where: { status: { in: ['Completed', 'Closed'] } } }),
      prisma.payment.aggregate({ where: { status: 'Paid' }, _sum: { amount: true } }),
      prisma.user.count({ where: { role: 'Contractor', isAvailable: true } }),
      prisma.auditLog.findMany({ orderBy: { timestamp: 'desc' }, take: 10 }),
    ]);

    // Job completion rate
    const totalJobs = openJobs + completedJobs;
    const completionRate = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;

    // Average contractor rating
    const contractors = await prisma.user.findMany({
      where: { role: 'Contractor', rating: { not: null } },
      select: { rating: true },
    });
    const avgContractorRating = contractors.length > 0
      ? Math.round((contractors.reduce((sum, c) => sum + (c.rating || 0), 0) / contractors.length) * 10) / 10
      : 0;

    // Pending quotations
    const pendingQuotations = await prisma.quotation.count({ where: { status: 'Pending' } });

    // Monthly revenue (current month)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const monthlyRevenue = await prisma.payment.aggregate({
      where: { status: 'Paid', date: { gte: monthStart } },
      _sum: { amount: true },
    });

    return res.json({
      totalCustomers,
      activeMembers,
      pendingEnquiries,
      openJobs,
      completedJobs,
      completionRate,
      totalRevenue: totalRevenue._sum.amount || 0,
      monthlyRevenue: monthlyRevenue._sum.amount || 0,
      availableContractors,
      pendingQuotations,
      avgContractorRating,
      recentAuditLogs,
    });
  } catch (error) {
    console.error('[Reports/Dashboard]', error);
    return res.status(500).json({ error: 'Failed to generate dashboard report' });
  }
});

// GET /api/reports/contractors — Admin: contractor performance report
router.get('/contractors', requireAuth, requireRoles('Administrator', 'Super Administrator'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const contractors = await prisma.user.findMany({
      where: { role: 'Contractor' },
      select: {
        id: true, name: true, specialty: true, rating: true, isAvailable: true, workload: true,
        certifications: true,
        jobsAsContractor: {
          select: { id: true, status: true, rating: true, createdAt: true, completedAt: true },
        },
      },
    });

    const report = contractors.map(c => {
      const totalJobs = c.jobsAsContractor.length;
      const completedJobs = c.jobsAsContractor.filter(j => ['Completed', 'Closed'].includes(j.status)).length;
      const avgResponseTime = completedJobs > 0
        ? c.jobsAsContractor
            .filter(j => j.completedAt)
            .reduce((sum, j) => {
              const diff = new Date(j.completedAt!).getTime() - new Date(j.createdAt).getTime();
              return sum + diff / 60000; // minutes
            }, 0) / completedJobs
        : 0;
      return {
        id: c.id,
        name: c.name,
        specialty: c.specialty,
        rating: c.rating,
        isAvailable: c.isAvailable,
        workload: c.workload,
        certifications: c.certifications ? JSON.parse(c.certifications) : [],
        totalJobs,
        completedJobs,
        completionRate: totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0,
        avgResponseTimeMinutes: Math.round(avgResponseTime),
      };
    });

    return res.json(report);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to generate contractor report' });
  }
});

// GET /api/reports/revenue — Admin: revenue breakdown
router.get('/revenue', requireAuth, requireRoles('Administrator', 'Super Administrator'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { from, to } = req.query;
    const where: any = { status: 'Paid' };
    if (from) where.date = { ...where.date, gte: from as string };
    if (to) where.date = { ...where.date, lte: to as string };

    const payments = await prisma.payment.findMany({
      where,
      include: { customer: { select: { name: true, package: true } } },
      orderBy: { date: 'desc' },
    });

    const byType = payments.reduce((acc: Record<string, number>, p) => {
      acc[p.type] = (acc[p.type] || 0) + p.amount;
      return acc;
    }, {});

    const total = payments.reduce((sum, p) => sum + p.amount, 0);

    return res.json({ payments, byType, total });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to generate revenue report' });
  }
});

// GET /api/reports/customers/:id/timeline — Admin: complete customer history timeline
router.get('/customers/:id/timeline', requireAuth, requireRoles('Administrator', 'Super Administrator'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const customer = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        jobsAsCustomer: {
          include: {
            assignedContractor: { select: { name: true, specialty: true } },
            fileRecords: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        payments: { orderBy: { createdAt: 'desc' } },
        auditLogs: { orderBy: { timestamp: 'desc' }, take: 50 },
        fileRecords: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    // Also get enquiries/assessments/quotations by email
    const enquiries = await prisma.enquiry.findMany({
      where: { email: customer.email },
      include: {
        assessments: { include: { contractor: { select: { name: true } } } },
        quotations: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ customer, enquiries });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve customer timeline' });
  }
});

export default router;
