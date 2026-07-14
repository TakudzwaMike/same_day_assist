import { Router, Response } from 'express';
import { prisma } from '../config/db';
import { requireAuth, requireRoles, AuthenticatedRequest } from '../middleware/auth';
import { validate, jobCreateSchema, jobStatusSchema, completionSchema, ratingSchema } from '../middleware/validation';
import { writeAuditLog } from '../middleware/auditLog';
import { Server as SocketServer } from 'socket.io';

const router = Router();

// Inject io via middleware factory
export function createJobsRouter(io: SocketServer) {

  // GET /api/jobs — Admin/Contractor: get all jobs
  router.get('/', requireAuth, requireRoles('Administrator', 'Super Administrator', 'Contractor'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      let jobs;
      if (req.user!.role === 'Contractor') {
        jobs = await prisma.job.findMany({
          where: { assignedContractorId: req.user!.id },
          include: {
            customer: { select: { id: true, name: true, phone: true, address: true } },
            assignedContractor: { select: { id: true, name: true, phone: true, specialty: true } },
          },
          orderBy: { createdAt: 'desc' },
        });
      } else {
        jobs = await prisma.job.findMany({
          include: {
            customer: { select: { id: true, name: true, phone: true, address: true } },
            assignedContractor: { select: { id: true, name: true, phone: true, specialty: true } },
          },
          orderBy: { createdAt: 'desc' },
        });
      }
      return res.json(jobs);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to retrieve jobs' });
    }
  });

  // GET /api/jobs/my — Customer: get own jobs
  router.get('/my', requireAuth, requireRoles('Customer'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const jobs = await prisma.job.findMany({
        where: { customerId: req.user!.id },
        include: {
          assignedContractor: { select: { id: true, name: true, phone: true, specialty: true, rating: true, lat: true, lng: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      return res.json(jobs);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to retrieve jobs' });
    }
  });

  // POST /api/jobs — Customer: create emergency request
  router.post('/', requireAuth, requireRoles('Customer'), validate(jobCreateSchema), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const customer = await prisma.user.findUnique({ where: { id: req.user!.id } });
      if (!customer) return res.status(404).json({ error: 'Customer not found' });

      if (customer.status !== 'Active Member') {
        return res.status(403).json({ error: 'Only Active Members can request emergency assistance' });
      }

      const job = await prisma.job.create({
        data: {
          customerId: req.user!.id,
          serviceType: req.body.serviceType,
          description: req.body.description,
          photoUrl: req.body.photoUrl,
          status: 'Submitted',
          trackerProgress: 0,
        },
        include: {
          customer: { select: { id: true, name: true, phone: true, address: true } },
        },
      });

      // Emit to control room via WebSocket
      io.to('admin-room').emit('new-job', job);

      await writeAuditLog({
        userId: req.user!.id,
        userType: 'Customer',
        action: 'Emergency Assistance Requested',
        details: `Customer ${customer.name} requested emergency assistance: ${req.body.serviceType} — "${req.body.description}"`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        newValue: { jobId: job.id, serviceType: job.serviceType },
      });

      return res.status(201).json(job);
    } catch (error) {
      console.error('[Jobs/Create]', error);
      return res.status(500).json({ error: 'Failed to create job request' });
    }
  });

  // PATCH /api/jobs/:id/assign — Admin: assign contractor
  router.patch('/:id/assign', requireAuth, requireRoles('Administrator', 'Super Administrator'), async (req: AuthenticatedRequest, res: Response) => {
    const { contractorId } = req.body;
    if (!contractorId) return res.status(400).json({ error: 'contractorId is required' });

    try {
      const [job, contractor] = await Promise.all([
        prisma.job.findUnique({ where: { id: req.params.id }, include: { customer: true } }),
        prisma.user.findUnique({ where: { id: contractorId } }),
      ]);
      if (!job) return res.status(404).json({ error: 'Job not found' });
      if (!contractor || contractor.role !== 'Contractor') return res.status(400).json({ error: 'Invalid contractor' });

      const prevStatus = job.status;
      const updated = await prisma.job.update({
        where: { id: req.params.id },
        data: {
          assignedContractorId: contractorId,
          status: 'Assigned',
          trackerProgress: 20,
          assignedAt: new Date(),
        },
        include: {
          customer: { select: { id: true, name: true, phone: true, address: true } },
          assignedContractor: { select: { id: true, name: true, phone: true, specialty: true } },
        },
      });

      // Increment contractor workload
      await prisma.user.update({ where: { id: contractorId }, data: { workload: { increment: 1 } } });

      // Notify contractor via WebSocket
      io.to(`contractor-${contractorId}`).emit('job-assigned', updated);
      // Notify customer
      io.to(`customer-${job.customerId}`).emit('job-updated', updated);

      await writeAuditLog({
        userId: req.user!.id,
        userType: req.user!.role,
        action: 'Contractor Assigned to Job',
        details: `Administrator dispatched ${contractor.name} to Job ${req.params.id} for customer ${job.customer.name}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        previousValue: { status: prevStatus },
        newValue: { status: 'Assigned', contractorId, contractorName: contractor.name },
      });

      return res.json(updated);
    } catch (error) {
      console.error('[Jobs/Assign]', error);
      return res.status(500).json({ error: 'Failed to assign contractor' });
    }
  });

  // PATCH /api/jobs/:id/status — Contractor: update job status (Accepted, En Route, Arrived, etc.)
  router.patch('/:id/status', requireAuth, requireRoles('Contractor'), validate(jobStatusSchema), async (req: AuthenticatedRequest, res: Response) => {
    const { status } = req.body;
    const allowedTransitions: Record<string, string[]> = {
      Assigned: ['Accepted', 'En Route'],
      Accepted: ['En Route'],
      'En Route': ['Arrived'],
      Arrived: ['Repair In Progress', 'Quality Inspection'],
      'Repair In Progress': ['Quality Inspection'],
      'Quality Inspection': ['Completed'],
    };

    try {
      const job = await prisma.job.findUnique({ where: { id: req.params.id } });
      if (!job) return res.status(404).json({ error: 'Job not found' });
      if (job.assignedContractorId !== req.user!.id) {
        return res.status(403).json({ error: 'Not authorized to update this job' });
      }

      const allowed = allowedTransitions[job.status] || [];
      if (!allowed.includes(status)) {
        return res.status(400).json({ error: `Invalid status transition from ${job.status} to ${status}` });
      }

      const progressMap: Record<string, number> = {
        Accepted: 30, 'En Route': 50, Arrived: 70,
        'Repair In Progress': 80, 'Quality Inspection': 90, Completed: 100,
      };

      const updated = await prisma.job.update({
        where: { id: req.params.id },
        data: { status, trackerProgress: progressMap[status] ?? job.trackerProgress },
        include: {
          customer: { select: { id: true, name: true, phone: true, address: true } },
          assignedContractor: { select: { id: true, name: true, phone: true, lat: true, lng: true } },
        },
      });

      // Broadcast live update to customer and admin room
      io.to(`customer-${job.customerId}`).emit('job-updated', updated);
      io.to('admin-room').emit('job-updated', updated);

      await writeAuditLog({
        userId: req.user!.id,
        userType: req.user!.role,
        action: 'Job Status Updated',
        details: `Contractor updated job ${req.params.id} from ${job.status} to ${status}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        previousValue: { status: job.status },
        newValue: { status },
      });

      return res.json(updated);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update job status' });
    }
  });

  // PATCH /api/jobs/:id/location — Contractor: update live GPS location
  router.patch('/:id/location', requireAuth, requireRoles('Contractor'), async (req: AuthenticatedRequest, res: Response) => {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) return res.status(400).json({ error: 'lat and lng are required' });

    try {
      // Update contractor's location
      await prisma.user.update({
        where: { id: req.user!.id },
        data: { lat, lng },
      });

      // Broadcast location to customer and admin
      const job = await prisma.job.findUnique({ where: { id: req.params.id } });
      if (job) {
        io.to(`customer-${job.customerId}`).emit('contractor-location', { jobId: req.params.id, lat, lng, contractorId: req.user!.id });
        io.to('admin-room').emit('contractor-location', { jobId: req.params.id, lat, lng, contractorId: req.user!.id });
      }

      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update location' });
    }
  });

  // POST /api/jobs/:id/complete — Contractor: submit completion report
  router.post('/:id/complete', requireAuth, requireRoles('Contractor'), validate(completionSchema), async (req: AuthenticatedRequest, res: Response) => {
    const { contractorNotes, contractorSignature, completionPhoto } = req.body;

    try {
      const job = await prisma.job.findUnique({ where: { id: req.params.id }, include: { customer: true } });
      if (!job) return res.status(404).json({ error: 'Job not found' });
      if (job.assignedContractorId !== req.user!.id) return res.status(403).json({ error: 'Not authorized' });
      if (!['Arrived', 'Repair In Progress', 'Quality Inspection'].includes(job.status)) {
        return res.status(400).json({ error: `Cannot complete job in status: ${job.status}` });
      }

      const [updated] = await prisma.$transaction([
        prisma.job.update({
          where: { id: req.params.id },
          data: {
            status: 'Completed',
            trackerProgress: 100,
            completedAt: new Date(),
            contractorNotes,
            contractorSignature,
            completionPhoto,
          },
          include: {
            customer: { select: { id: true, name: true, phone: true } },
            assignedContractor: { select: { id: true, name: true } },
          },
        }),
        // Decrement contractor workload
        prisma.user.update({
          where: { id: req.user!.id },
          data: { workload: { decrement: 1 } },
        }),
      ]);

      io.to(`customer-${job.customerId}`).emit('job-updated', updated);
      io.to('admin-room').emit('job-updated', updated);

      await writeAuditLog({
        userId: req.user!.id,
        userType: req.user!.role,
        action: 'Job Completed',
        details: `Contractor resolved Job ${req.params.id} for ${job.customer.name}. Digital signature and completion report uploaded.`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        newValue: { status: 'Completed', hasSignature: !!contractorSignature },
      });

      return res.json(updated);
    } catch (error) {
      console.error('[Jobs/Complete]', error);
      return res.status(500).json({ error: 'Failed to complete job' });
    }
  });

  // POST /api/jobs/:id/rate — Customer: rate completed job
  router.post('/:id/rate', requireAuth, requireRoles('Customer'), validate(ratingSchema), async (req: AuthenticatedRequest, res: Response) => {
    const { rating, ratingComment } = req.body;

    try {
      const job = await prisma.job.findUnique({ where: { id: req.params.id } });
      if (!job) return res.status(404).json({ error: 'Job not found' });
      if (job.customerId !== req.user!.id) return res.status(403).json({ error: 'Not authorized' });
      if (job.status !== 'Completed') return res.status(400).json({ error: 'Job must be Completed before rating' });

      const updated = await prisma.job.update({
        where: { id: req.params.id },
        data: { status: 'Closed', rating, ratingComment, closedAt: new Date() },
      });

      // Update contractor average rating
      if (job.assignedContractorId) {
        const contractorJobs = await prisma.job.findMany({
          where: { assignedContractorId: job.assignedContractorId, rating: { not: null } },
          select: { rating: true },
        });
        const avgRating = contractorJobs.reduce((sum, j) => sum + (j.rating || 0), 0) / contractorJobs.length;
        await prisma.user.update({
          where: { id: job.assignedContractorId },
          data: { rating: Math.round(avgRating * 10) / 10 },
        });
      }

      io.to('admin-room').emit('job-updated', updated);

      await writeAuditLog({
        userId: req.user!.id,
        userType: 'Customer',
        action: 'Job Rated',
        details: `Customer rated Job ${req.params.id} with ${rating}/5 stars`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        newValue: { rating, ratingComment, status: 'Closed' },
      });

      return res.json(updated);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to rate job' });
    }
  });

  // PATCH /api/jobs/:id/close — Admin: close completed job
  router.patch('/:id/close', requireAuth, requireRoles('Administrator', 'Super Administrator'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const job = await prisma.job.findUnique({ where: { id: req.params.id } });
      if (!job) return res.status(404).json({ error: 'Job not found' });

      const updated = await prisma.job.update({
        where: { id: req.params.id },
        data: { status: 'Closed', closedAt: new Date() },
      });

      io.to('admin-room').emit('job-updated', updated);

      await writeAuditLog({
        userId: req.user!.id,
        userType: req.user!.role,
        action: 'Job Closed',
        details: `Administrator officially closed Job Card ${req.params.id}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        previousValue: { status: job.status },
        newValue: { status: 'Closed' },
      });

      return res.json(updated);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to close job' });
    }
  });

  return router;
}

export default router;
