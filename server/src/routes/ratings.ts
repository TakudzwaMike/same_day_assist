import { Router, Response } from 'express';
import { prisma } from '../config/db';
import { requireAuth, requireRoles, AuthenticatedRequest } from '../middleware/auth';
import { writeAuditLog } from '../middleware/auditLog';

const router = Router();

// POST /api/ratings/job/:jobId — Submit 8-dimensional rating for completed job
router.post('/job/:jobId', requireAuth, requireRoles('Customer'), async (req: AuthenticatedRequest, res: Response) => {
  const {
    professionalism,
    punctuality,
    responseTime,
    communication,
    qualityOfWork,
    friendliness,
    problemResolution,
    overallSatisfaction,
    writtenFeedback,
    photoBeforeUrl,
    photoAfterUrl,
  } = req.body;

  try {
    const job = await prisma.job.findUnique({
      where: { id: req.params.jobId },
      include: { assignedContractor: true },
    });

    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.customerId !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized to rate this job' });
    }
    if (!job.assignedContractorId) {
      return res.status(400).json({ error: 'No contractor assigned to this job' });
    }

    // Create 8D rating entry
    const rating = await prisma.jobRating.create({
      data: {
        jobId: job.id,
        customerId: req.user!.id,
        contractorId: job.assignedContractorId,
        professionalism: parseInt(professionalism || '5', 10),
        punctuality: parseInt(punctuality || '5', 10),
        responseTime: parseInt(responseTime || '5', 10),
        communication: parseInt(communication || '5', 10),
        qualityOfWork: parseInt(qualityOfWork || '5', 10),
        friendliness: parseInt(friendliness || '5', 10),
        problemResolution: parseInt(problemResolution || '5', 10),
        overallSatisfaction: parseInt(overallSatisfaction || '5', 10),
        writtenFeedback: writtenFeedback || null,
        photoBeforeUrl: photoBeforeUrl || null,
        photoAfterUrl: photoAfterUrl || null,
      },
    });

    // Update job rating score & status
    const overall = parseInt(overallSatisfaction || '5', 10);
    await prisma.job.update({
      where: { id: job.id },
      data: {
        rating: overall,
        ratingComment: writtenFeedback || null,
        photoBeforeUrl: photoBeforeUrl || job.photoBeforeUrl,
        photoAfterUrl: photoAfterUrl || job.photoAfterUrl,
      },
    });

    // Re-calculate contractor overall rating average across all job ratings
    const contractorRatings = await prisma.jobRating.findMany({
      where: { contractorId: job.assignedContractorId },
    });

    if (contractorRatings.length > 0) {
      const avgScore = contractorRatings.reduce((sum, r) => sum + r.overallSatisfaction, 0) / contractorRatings.length;
      await prisma.user.update({
        where: { id: job.assignedContractorId },
        data: { rating: parseFloat(avgScore.toFixed(2)) },
      });
    }

    await writeAuditLog({
      userId: req.user!.id,
      userType: req.user!.role,
      action: 'Submit Job Rating',
      details: `Customer submitted 8-D rating for job ${job.id} (Satisfaction: ${overall}/5 stars).`,
    });

    return res.json({ success: true, rating });
  } catch (error) {
    console.error('[Ratings/Job]', error);
    return res.status(500).json({ error: 'Failed to submit rating' });
  }
});

// GET /api/ratings/contractor/:contractorId — Fetch multi-dimensional rating metrics for contractor
router.get('/contractor/:contractorId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ratings = await prisma.jobRating.findMany({
      where: { contractorId: req.params.contractorId },
      include: { customer: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const contractor = await prisma.user.findUnique({
      where: { id: req.params.contractorId },
      include: { providerAwards: true, jobsAsContractor: true },
    });

    if (!contractor) return res.status(404).json({ error: 'Contractor not found' });

    // Calculate metric averages
    const count = ratings.length || 1;
    const metrics = {
      professionalism: (ratings.reduce((sum, r) => sum + r.professionalism, 0) / count).toFixed(1),
      punctuality: (ratings.reduce((sum, r) => sum + r.punctuality, 0) / count).toFixed(1),
      responseTime: (ratings.reduce((sum, r) => sum + r.responseTime, 0) / count).toFixed(1),
      communication: (ratings.reduce((sum, r) => sum + r.communication, 0) / count).toFixed(1),
      qualityOfWork: (ratings.reduce((sum, r) => sum + r.qualityOfWork, 0) / count).toFixed(1),
      friendliness: (ratings.reduce((sum, r) => sum + r.friendliness, 0) / count).toFixed(1),
      problemResolution: (ratings.reduce((sum, r) => sum + r.problemResolution, 0) / count).toFixed(1),
      overallSatisfaction: (ratings.reduce((sum, r) => sum + r.overallSatisfaction, 0) / count).toFixed(1),
    };

    const completedJobs = contractor.jobsAsContractor.filter(j => j.status === 'Service Completed').length;
    const totalAssigned = contractor.jobsAsContractor.length || 1;
    const completionRate = Math.round((completedJobs / totalAssigned) * 100);

    return res.json({
      contractor: {
        id: contractor.id,
        name: contractor.name,
        email: contractor.email,
        rating: contractor.rating,
        yearsOfExperience: contractor.yearsOfExperience,
        verificationStatus: contractor.verificationStatus,
        isFeatured: contractor.isFeatured,
        providerAwards: contractor.providerAwards,
      },
      metrics,
      totalRatings: ratings.length,
      completionRate,
      completedJobs,
      ratings,
    });
  } catch (error) {
    console.error('[Ratings/GetContractor]', error);
    return res.status(500).json({ error: 'Failed to fetch contractor performance' });
  }
});

export default router;
