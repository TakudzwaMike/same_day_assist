import { Router, Response } from 'express';
import { prisma } from '../config/db';
import { requireAuth, requireRoles, AuthenticatedRequest } from '../middleware/auth';
import { validate, assessmentUploadSchema } from '../middleware/validation';
import { writeAuditLog } from '../middleware/auditLog';
import { generateQuotationPDF } from '../services/pdf';

const router = Router();

// GET /api/assessments — Admin: all assessments
router.get('/', requireAuth, requireRoles('Administrator', 'Super Administrator'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const assessments = await prisma.assessment.findMany({
      include: { contractor: { select: { id: true, name: true, email: true, specialty: true } }, enquiry: true },
      orderBy: { scheduledAt: 'desc' },
    });
    return res.json(assessments.map(a => ({
      ...a,
      issuesFound: JSON.parse(a.issuesFound),
    })));
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
    return res.json(assessments.map(a => ({
      ...a,
      issuesFound: JSON.parse(a.issuesFound),
    })));
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve assessments' });
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

    return res.json({ ...updated, issuesFound: JSON.parse(updated.issuesFound) });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to start assessment' });
  }
});

// POST /api/assessments/:id/upload — Contractor: upload completed assessment
router.post('/:id/upload', requireAuth, requireRoles('Contractor'), async (req: AuthenticatedRequest, res: Response) => {
  const { issuesFound, estimatedCost, contractorNotes, photoUrl, videoUrl } = req.body;

  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: req.params.id },
      include: { enquiry: true },
    });
    if (!assessment) return res.status(404).json({ error: 'Assessment not found' });
    if (assessment.contractorId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized to upload this assessment' });
    }

    const [updatedAssessment, updatedEnquiry, newQuotation] = await prisma.$transaction([
      prisma.assessment.update({
        where: { id: req.params.id },
        data: {
          issuesFound: JSON.stringify(issuesFound),
          estimatedCost,
          contractorNotes,
          photoUrl,
          videoUrl,
          status: 'Uploaded',
          completedAt: new Date(),
        },
      }),
      prisma.enquiry.update({
        where: { id: assessment.enquiryId },
        data: { status: 'Assessed' },
      }),
      prisma.quotation.create({
        data: {
          enquiryId: assessment.enquiryId,
          amount: estimatedCost,
          lineItems: JSON.stringify(
            issuesFound.map((issue: string, i: number) => ({
              id: `li-${i}`,
              description: issue,
              cost: Math.round(estimatedCost / issuesFound.length),
            }))
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
        data: { status: 'Awaiting Quotation' },
      });
    }

    await writeAuditLog({
      userId: req.user!.id,
      userType: req.user!.role,
      action: 'Compliance Survey Uploaded',
      details: `Contractor uploaded ${issuesFound.length} defects requiring R${estimatedCost} in pre-membership repairs`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      newValue: { issuesCount: issuesFound.length, estimatedCost, quotationId: newQuotation.id },
    });

    return res.json({
      assessment: { ...updatedAssessment, issuesFound },
      enquiry: updatedEnquiry,
      quotation: { ...newQuotation, lineItems: JSON.parse(newQuotation.lineItems) },
    });
  } catch (error) {
    console.error('[Assessments/Upload]', error);
    return res.status(500).json({ error: 'Failed to upload assessment' });
  }
});

export default router;
