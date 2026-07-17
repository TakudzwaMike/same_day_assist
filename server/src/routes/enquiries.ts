import { Router, Response } from 'express';
import { prisma } from '../config/db';
import { requireAuth, requireRoles, AuthenticatedRequest } from '../middleware/auth';
import { validate, enquirySchema } from '../middleware/validation';
import { writeAuditLog } from '../middleware/auditLog';

const router = Router();

// GET /api/enquiries — Admin/Dispatcher: get all enquiries
router.get('/', requireAuth, requireRoles('Administrator', 'Super Administrator', 'Dispatcher'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const enquiries = await prisma.enquiry.findMany({
      include: { assessments: true, quotations: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(enquiries);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve enquiries' });
  }
});

// GET /api/enquiries/:id
router.get('/:id', requireAuth, requireRoles('Administrator', 'Super Administrator', 'Dispatcher'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const enquiry = await prisma.enquiry.findUnique({
      where: { id: req.params.id },
      include: { assessments: { include: { contractor: true } }, quotations: true },
    });
    if (!enquiry) return res.status(404).json({ error: 'Enquiry not found' });
    return res.json(enquiry);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve enquiry' });
  }
});

// POST /api/enquiries — Public: submit new enquiry (no auth needed for initial contact)
router.post('/', validate(enquirySchema), async (req: any, res: Response) => {
  try {
    const enquiry = await prisma.enquiry.create({ data: req.body });

    await writeAuditLog({
      userType: 'Customer',
      action: 'Enquiry Created',
      details: `Prospective customer ${req.body.customerName} submitted onboarding enquiry for ${req.body.serviceCategory}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json(enquiry);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create enquiry' });
  }
});

// PATCH /api/enquiries/:id/schedule — Admin/Dispatcher: schedule assessment for enquiry
router.patch('/:id/schedule', requireAuth, requireRoles('Administrator', 'Super Administrator', 'Dispatcher'), async (req: AuthenticatedRequest, res: Response) => {
  const { contractorId } = req.body;
  if (!contractorId) return res.status(400).json({ error: 'contractorId is required' });

  try {
    const enquiry = await prisma.enquiry.findUnique({ where: { id: req.params.id } });
    if (!enquiry) return res.status(404).json({ error: 'Enquiry not found' });

    const contractor = await prisma.user.findUnique({ where: { id: contractorId } });
    if (!contractor || contractor.role !== 'Contractor') {
      return res.status(400).json({ error: 'Invalid contractor' });
    }

    const [updatedEnquiry, assessment] = await prisma.$transaction([
      prisma.enquiry.update({
        where: { id: req.params.id },
        data: { status: 'Scheduled' },
      }),
      prisma.assessment.create({
        data: {
          enquiryId: req.params.id,
          contractorId,
          scheduledAt: new Date(),
          estimatedCost: 0,
          issuesFound: JSON.stringify([]),
          status: 'Scheduled',
        },
      }),
    ]);

    await writeAuditLog({
      userId: req.user!.id,
      userType: req.user!.role,
      action: 'Assessment Scheduled',
      details: `Administrator scheduled property survey for ${enquiry.customerName} with contractor ${contractor.name}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      previousValue: { status: enquiry.status },
      newValue: { status: 'Scheduled', assessmentId: assessment.id },
    });

    return res.json({ enquiry: updatedEnquiry, assessment });
  } catch (error) {
    console.error('[Enquiries/Schedule]', error);
    return res.status(500).json({ error: 'Failed to schedule assessment' });
  }
});

export default router;
