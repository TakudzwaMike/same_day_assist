import { Router, Response } from 'express';
import { prisma } from '../config/db';
import { requireAuth, requireRoles, AuthenticatedRequest } from '../middleware/auth';
import { writeAuditLog } from '../middleware/auditLog';

const router = Router();

function formatAssessment(a: any) {
  let issuesFound = [];
  try {
    issuesFound = a.issuesFound ? JSON.parse(a.issuesFound) : [];
  } catch {
    issuesFound = [];
  }

  let technicalAssessment = null;
  if (a.structuredData) {
    try {
      technicalAssessment = JSON.parse(a.structuredData);
    } catch {
      technicalAssessment = null;
    }
  }

  return {
    ...a,
    issuesFound,
    technicalAssessment,
  };
}

// GET /api/assessments — Admin: all assessments
router.get('/', requireAuth, requireRoles('Administrator', 'Super Administrator'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const assessments = await prisma.assessment.findMany({
      include: { contractor: { select: { id: true, name: true, email: true, specialty: true } }, enquiry: true },
      orderBy: { scheduledAt: 'desc' },
    });
    return res.json(assessments.map(formatAssessment));
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve assessments' });
  }
});

// GET /api/assessments/my — Contractor: get own scheduled assessments
router.get('/my', requireAuth, requireRoles('Contractor'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const assessments = await prisma.assessment.findMany({
      where: { contractorId: req.user!.id },
      include: { enquiry: true },
      orderBy: { scheduledAt: 'asc' },
    });
    return res.json(assessments.map(formatAssessment));
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve assessments' });
  }
});

// GET /api/assessments/:id — Get single assessment (Object-level authorization enforced)
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: req.params.id },
      include: { contractor: true, enquiry: true },
    });
    if (!assessment) return res.status(404).json({ error: 'Assessment not found' });

    const userRole = req.user!.role;
    const userId = req.user!.id;
    const userEmail = req.user!.email?.toLowerCase();
    const isStaff = ['Administrator', 'Super Administrator', 'Dispatcher', 'ADMIN'].includes(userRole);
    const isContractor = assessment.contractorId === userId;
    const isCustomer = (assessment.enquiry && assessment.enquiry.email && assessment.enquiry.email.toLowerCase() === userEmail);

    if (!isStaff && !isContractor && !isCustomer) {
      return res.status(403).json({ error: 'Access denied: You do not have permission to view this assessment survey.' });
    }

    return res.json(formatAssessment(assessment));
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve assessment' });
  }
});

// PATCH /api/assessments/:id/start — Contractor: start assessment
router.patch('/:id/start', requireAuth, requireRoles('Contractor'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const assessment = await prisma.assessment.findUnique({ where: { id: req.params.id } });
    if (!assessment) return res.status(404).json({ error: 'Assessment not found' });
    if (assessment.contractorId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized to update this assessment' });
    }

    const updated = await prisma.assessment.update({
      where: { id: req.params.id },
      data: { status: 'Assessing' },
      include: { contractor: true, enquiry: true },
    });

    await writeAuditLog({
      userId: req.user!.id,
      userType: req.user!.role,
      action: 'Compliance Survey Started',
      details: `Contractor arrived at property and commenced safety compliance assessment (ID: ${req.params.id})`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      previousValue: { status: assessment.status },
      newValue: { status: 'Assessing' },
    });

    return res.json(formatAssessment(updated));
  } catch (error) {
    return res.status(500).json({ error: 'Failed to start assessment' });
  }
});

// POST /api/assessments/:id/upload — Contractor: upload completed technical assessment
router.post('/:id/upload', requireAuth, requireRoles('Contractor'), async (req: AuthenticatedRequest, res: Response) => {
  const {
    issuesFound = [],
    estimatedCost = 0,
    contractorNotes,
    photoUrl,
    videoUrl,
    structuredData,
    outcome = 'Repairs required',
  } = req.body;

  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: req.params.id },
      include: { enquiry: true },
    });
    if (!assessment) return res.status(404).json({ error: 'Assessment not found' });
    if (assessment.contractorId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized to upload this assessment' });
    }

    const structuredDataString = typeof structuredData === 'object' ? JSON.stringify(structuredData) : structuredData;
    const issuesList = Array.isArray(issuesFound) ? issuesFound : [];

    const [updatedAssessment, updatedEnquiry, newQuotation] = await prisma.$transaction([
      prisma.assessment.update({
        where: { id: req.params.id },
        data: {
          issuesFound: JSON.stringify(issuesList),
          estimatedCost: Number(estimatedCost) || 0,
          contractorNotes: contractorNotes || null,
          photoUrl: photoUrl || null,
          videoUrl: videoUrl || null,
          structuredData: structuredDataString || null,
          outcome: outcome || 'Repairs required',
          supervisorStatus: 'Pending Review',
          status: 'Uploaded',
          completedAt: new Date(),
        },
        include: { contractor: true, enquiry: true },
      }),
      prisma.enquiry.update({
        where: { id: assessment.enquiryId },
        data: { status: 'Assessed' },
      }),
      prisma.quotation.create({
        data: {
          enquiryId: assessment.enquiryId,
          amount: Number(estimatedCost) || 0,
          lineItems: JSON.stringify(
            issuesList.length > 0
              ? issuesList.map((issue: string, i: number) => ({
                  id: `li-${i}`,
                  description: issue,
                  cost: Math.round((Number(estimatedCost) || 0) / issuesList.length),
                }))
              : [
                  {
                    id: 'li-0',
                    description: 'Full Technical Assessment & Baseline Verification (Compliant)',
                    cost: 0,
                  },
                ]
          ),
          status: 'Pending',
        },
      }),
    ]);

    // Update customer status
    const enquiry = assessment.enquiry;
    const customer = await prisma.user.findFirst({ where: { email: enquiry.email, role: 'Customer' } });
    if (customer) {
      await prisma.user.update({
        where: { id: customer.id },
        data: { status: Number(estimatedCost) > 0 ? 'Awaiting Quotation' : 'Application Approved' },
      });
    }

    await writeAuditLog({
      userId: req.user!.id,
      userType: req.user!.role,
      action: 'Technical Assessment Uploaded',
      details: `Technician uploaded technical assessment & equipment register with ${issuesList.length} items (Outcome: ${outcome})`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      newValue: { issuesCount: issuesList.length, estimatedCost, quotationId: newQuotation.id, outcome },
    });

    return res.json({
      assessment: formatAssessment(updatedAssessment),
      enquiry: updatedEnquiry,
      quotation: { ...newQuotation, lineItems: JSON.parse(newQuotation.lineItems) },
    });
  } catch (error) {
    console.error('[Assessments/Upload]', error);
    return res.status(500).json({ error: 'Failed to upload assessment' });
  }
});

// PATCH /api/assessments/:id/supervisor-review — Admin/Supervisor: review and lock baseline
router.patch('/:id/supervisor-review', requireAuth, requireRoles('Administrator', 'Super Administrator'), async (req: AuthenticatedRequest, res: Response) => {
  const { action, notes = '' } = req.body; // action: 'APPROVE' | 'RETURN_FOR_CORRECTION'

  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: req.params.id },
      include: { enquiry: true, contractor: true },
    });
    if (!assessment) return res.status(404).json({ error: 'Assessment not found' });

    const isApprove = action === 'APPROVE';
    const supervisorStatus = isApprove ? 'Approved' : 'Returned for Correction';

    // Update existing structuredData with supervisor review status and lock baseline
    let structuredObj: any = null;
    if (assessment.structuredData) {
      try {
        structuredObj = JSON.parse(assessment.structuredData);
        const supervisorName = (req.user as any)?.name || req.user?.email || 'Technical Supervisor';
        structuredObj.supervisorReview = {
          status: supervisorStatus,
          supervisorName,
          reviewedAt: new Date().toISOString(),
          supervisorNotes: notes,
        };
        if (isApprove) {
          structuredObj.baselineLocked = true;
          structuredObj.baselineLockedAt = new Date().toISOString();
        }
        structuredObj.changeHistory = structuredObj.changeHistory || [];
        structuredObj.changeHistory.push({
          date: new Date().toISOString(),
          author: `${supervisorName} (${req.user?.role || 'SUPERVISOR'})`,
          summary: `Supervisor review: ${supervisorStatus}. Notes: ${notes || 'No additional remarks'}`,
        });
      } catch (e) {
        // fallback
      }
    }

    const updated = await prisma.assessment.update({
      where: { id: req.params.id },
      data: {
        supervisorStatus,
        supervisorNotes: notes,
        baselineLocked: isApprove,
        baselineLockedAt: isApprove ? new Date() : assessment.baselineLockedAt,
        structuredData: structuredObj ? JSON.stringify(structuredObj) : assessment.structuredData,
        status: isApprove ? 'Uploaded' : 'Assessing',
      },
      include: { contractor: true, enquiry: true },
    });

    await writeAuditLog({
      userId: req.user!.id,
      userType: req.user!.role,
      action: isApprove ? 'Equipment Register Baseline Locked' : 'Assessment Returned for Correction',
      details: `Technical supervisor reviewed assessment ${req.params.id}: ${supervisorStatus}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      newValue: { supervisorStatus, baselineLocked: isApprove },
    });

    return res.json(formatAssessment(updated));
  } catch (error) {
    console.error('[Assessments/SupervisorReview]', error);
    return res.status(500).json({ error: 'Failed to record supervisor review' });
  }
});

export default router;

