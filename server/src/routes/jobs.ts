import { Router, Response } from 'express';
import { prisma } from '../config/db';
import { requireAuth, requireRoles, AuthenticatedRequest } from '../middleware/auth';
import { validate, jobCreateSchema, completionSchema, ratingSchema } from '../middleware/validation';
import { writeAuditLog } from '../middleware/auditLog';
import { Server as SocketServer } from 'socket.io';
import {
  getOrCreateActiveMembership,
  calculateBenefitCoverage,
  deductFromBenefit,
} from '../services/benefitService';

const router = Router();

function generateClaimNumber(): string {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `SDA-CLM-${rand}`;
}

function generateInvoiceNumber(): string {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `SDA-INV-${rand}`;
}

function formatJob(j: any) {
  const isNonMember = j.customerType === 'NON_MEMBER_EMERGENCY';
  let parsedVehicle = null;
  if (j.customerVehicle) {
    try {
      parsedVehicle = typeof j.customerVehicle === 'string' ? JSON.parse(j.customerVehicle) : j.customerVehicle;
    } catch {
      parsedVehicle = j.customerVehicle;
    }
  }
  let parsedResponderVehicle = null;
  if (j.vehicleInfo) {
    try {
      parsedResponderVehicle = typeof j.vehicleInfo === 'string' ? JSON.parse(j.vehicleInfo) : j.vehicleInfo;
    } catch {
      parsedResponderVehicle = j.vehicleInfo;
    }
  }

  return {
    ...j,
    customerType: j.customerType || 'MEMBER',
    customerName: isNonMember ? (j.nonMemberName || 'Emergency Caller') : (j.customer?.name || 'Valued Member'),
    customerAddress: isNonMember ? (j.nonMemberAddress || 'Incident Location') : (j.customer?.address || 'Sandton, Johannesburg'),
    customerPhone: isNonMember ? (j.nonMemberPhone || '') : (j.customer?.phone || ''),
    customerEmail: isNonMember ? (j.nonMemberEmail || '') : (j.customer?.email || ''),
    customerVehicle: parsedVehicle,
    vehicleInfo: parsedResponderVehicle,
    finalAmount: isNonMember ? 650.00 : (j.finalAmount || 0),
    callOutFee: isNonMember ? 650.00 : null,
    paymentStatus: j.paymentStatus || (isNonMember ? 'Payment Required' : 'Pending'),
    servicePerformed: j.servicePerformed || null,
  };
}

// Inject io via middleware factory
export function createJobsRouter(io?: SocketServer) {

  // GET /api/jobs — Admin/Contractor/Dispatcher: get all jobs (both member & non-member)
  router.get('/', requireAuth, requireRoles('Administrator', 'Super Administrator', 'Contractor', 'Dispatcher'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      let jobs;
      if (req.user!.role === 'Contractor') {
        jobs = await prisma.job.findMany({
          where: { assignedContractorId: req.user!.id },
          include: {
            customer: { select: { id: true, name: true, phone: true, address: true, email: true } },
            assignedContractor: { select: { id: true, name: true, phone: true, specialty: true } },
          },
          orderBy: { createdAt: 'desc' },
        });
      } else {
        jobs = await prisma.job.findMany({
          include: {
            customer: { select: { id: true, name: true, phone: true, address: true, email: true } },
            assignedContractor: { select: { id: true, name: true, phone: true, specialty: true } },
          },
          orderBy: { createdAt: 'desc' },
        });
      }
      return res.json(jobs.map(formatJob));
    } catch (error) {
      console.error('[Jobs/GET]', error);
      return res.status(500).json({ error: 'Failed to retrieve jobs' });
    }
  });

  // GET /api/jobs/my — Member Customer: get own jobs
  router.get('/my', requireAuth, requireRoles('Customer'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const jobs = await prisma.job.findMany({
        where: { customerId: req.user!.id },
        include: {
          customer: { select: { id: true, name: true, phone: true, address: true, email: true } },
          assignedContractor: { select: { id: true, name: true, phone: true, specialty: true, rating: true, lat: true, lng: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      return res.json(jobs.map(formatJob));
    } catch (error) {
      return res.status(500).json({ error: 'Failed to retrieve jobs' });
    }
  });

  // POST /api/jobs — Member Customer: create emergency / service request
  router.post('/', requireAuth, requireRoles('Customer'), validate(jobCreateSchema), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const customer = await prisma.user.findUnique({ where: { id: req.user!.id } });
      if (!customer) return res.status(404).json({ error: 'Customer not found' });

      const statusUpper = (customer.status || '').toUpperCase();
      if (statusUpper !== 'ACTIVE MEMBER' && statusUpper !== 'ACTIVE') {
        return res.status(403).json({ error: 'Your account is still undergoing onboarding.' });
      }

      let customerVehicleStr: string | null = null;
      if (req.body.vehicle) {
        customerVehicleStr = typeof req.body.vehicle === 'string' ? req.body.vehicle : JSON.stringify(req.body.vehicle);
      }

      const membership = await getOrCreateActiveMembership(req.user!.id);
      const claimNumber = generateClaimNumber();

      const job = await prisma.job.create({
        data: {
          customerType: 'MEMBER',
          customerId: req.user!.id,
          serviceType: req.body.serviceType,
          description: req.body.description,
          photoUrl: req.body.photoUrl,
          customerVehicle: customerVehicleStr,
          status: 'Requested',
          trackerProgress: 10,
          claim: {
            create: {
              claimNumber,
              userId: req.user!.id,
              membershipId: membership.id,
              serviceType: req.body.serviceType,
              description: req.body.description,
              vehicleOrProperty: customerVehicleStr ? 'Vehicle on file' : (customer.address || 'Member Residence'),
              amountClaimed: 0,
              amountApproved: 0,
              amountDeductedFromBenefit: 0,
              customerResponsibility: 0,
              status: 'Submitted',
            },
          },
        },
        include: {
          customer: { select: { id: true, name: true, phone: true, address: true, email: true } },
          claim: true,
        },
      });

      const formattedJob = formatJob(job);

      // Emit to control room via WebSocket
      io?.to('admin-room').emit('new-job', formattedJob);

      await writeAuditLog({
        userId: req.user!.id,
        userType: 'Customer',
        action: 'Member Service Requested',
        details: `Member ${customer.name} requested service: ${req.body.serviceType} — "${req.body.description}". Linked claim ${claimNumber} created.`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        newValue: { jobId: job.id, serviceType: job.serviceType, customerType: 'MEMBER', claimNumber },
      });

      return res.status(201).json(formattedJob);
    } catch (error) {
      console.error('[Jobs/Create]', error);
      return res.status(500).json({ error: 'Failed to create job request' });
    }
  });

  // =========================================================================
  // EMERGENCY NON-MEMBER ENDPOINTS (ONE-TIME SERVICE, STRICTLY SEPARATE BILLING)
  // =========================================================================

  // POST /api/jobs/emergency-non-member — Public entry point for non-member emergency requests
  router.post('/emergency-non-member', async (req: any, res: Response) => {
    const { name, phone, email, address, serviceType, description, urgency, additionalNotes, consentAgreed, photoUrl } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Full name is required for emergency dispatch.' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ error: 'Mobile contact number is required for dispatch communication.' });
    }
    if (!address || !address.trim()) {
      return res.status(400).json({ error: 'Incident location or address is required.' });
    }
    if (!serviceType || !serviceType.trim()) {
      return res.status(400).json({ error: 'Service category is required.' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Please provide a brief description of the problem.' });
    }

    // STRICT: This is NOT roadside assistance. Reject roadside or towing submissions.
    const serviceLower = serviceType.toLowerCase();
    if (serviceLower.includes('roadside') || serviceLower.includes('towing') || serviceLower.includes('tyre') || serviceLower.includes('flat battery')) {
      return res.status(400).json({
        error: 'Same Day Assist Emergency Assistance is for property and security services (Garage & Gate, Electric Fence, Alarm, CCTV, Access Control, Electrical, Plumbing, Locksmith, Security). Roadside assistance is not offered.',
      });
    }

    if (consentAgreed !== undefined && consentAgreed !== true && consentAgreed !== 'true') {
      return res.status(400).json({ error: 'Terms and R650 Call-Out Fee confirmation is required.' });
    }

    try {
      // Prevent accidental duplicate submissions within 60 seconds
      const sixtySecondsAgo = new Date(Date.now() - 60 * 1000);
      const existingRecent = await prisma.job.findFirst({
        where: {
          customerType: 'NON_MEMBER_EMERGENCY',
          nonMemberPhone: phone.trim(),
          serviceType: serviceType.trim(),
          createdAt: { gte: sixtySecondsAgo },
          paymentStatus: 'Payment Required',
        },
      });

      if (existingRecent) {
        return res.status(200).json({
          success: true,
          duplicatePrevented: true,
          message: 'Active emergency request found. Please complete the R650 Call-Out Fee payment to dispatch assistance.',
          job: formatJob(existingRecent),
          callOutFee: 650.00,
        });
      }

      const problemDescription = urgency 
        ? `[Urgency: ${urgency}] ${description.trim()}${additionalNotes ? ` | Note: ${additionalNotes.trim()}` : ''}`
        : description.trim();

      const job = await prisma.job.create({
        data: {
          customerType: 'NON_MEMBER_EMERGENCY',
          customerId: null,
          nonMemberName: name.trim(),
          nonMemberPhone: phone.trim(),
          nonMemberEmail: email ? email.trim() : null,
          nonMemberAddress: address.trim(),
          customerVehicle: null, // Strictly NO roadside/vehicle tracking
          serviceType: serviceType.trim(),
          description: problemDescription,
          photoUrl: photoUrl || null,
          status: 'Payment Required',
          trackerProgress: 10,
          paymentStatus: 'Payment Required',
          finalAmount: 650.00, // Fixed R650 Call-Out Fee
        },
      });

      const formattedJob = formatJob(job);

      // Broadcast immediately to Operations Control Room
      io?.to('admin-room').emit('new-job', formattedJob);

      await writeAuditLog({
        userId: undefined,
        userType: 'Non-Member Emergency',
        action: 'Emergency Non-Member Request Created',
        details: `Non-member emergency requested by ${name} (${phone}) at "${address}": ${serviceType}. Status: Payment Required (R650 Call-Out Fee).`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        newValue: { jobId: job.id, customerType: 'NON_MEMBER_EMERGENCY', name, phone, address, callOutFee: 650.00 },
      });

      return res.status(201).json({
        success: true,
        message: 'Emergency request registered. Payment of fixed R650 Call-Out Fee is required before dispatch.',
        job: formattedJob,
        callOutFee: 650.00,
      });
    } catch (error) {
      console.error('[Jobs/EmergencyNonMember]', error);
      return res.status(500).json({ error: 'Failed to submit emergency assistance request' });
    }
  });

  // GET /api/jobs/emergency-non-member/:id — Public tracking endpoint for non-member emergency
  router.get('/emergency-non-member/:id', async (req: any, res: Response) => {
    try {
      const job = await prisma.job.findUnique({
        where: { id: req.params.id },
        include: {
          assignedContractor: { select: { id: true, name: true, phone: true, specialty: true, rating: true, lat: true, lng: true } },
          payments: { select: { id: true, amount: true, status: true, paymentMethod: true, date: true, transactionRef: true, gatewayReference: true } },
          invoice: { select: { id: true, invoiceNumber: true, total: true, paymentStatus: true, date: true } },
        },
      });

      if (!job || job.customerType !== 'NON_MEMBER_EMERGENCY') {
        return res.status(404).json({ error: 'Emergency request not found' });
      }

      return res.json(formatJob(job));
    } catch (error) {
      console.error('[Jobs/GetEmergencyNonMember]', error);
      return res.status(500).json({ error: 'Failed to retrieve emergency status' });
    }
  });

  // PATCH /api/jobs/:id/service-amount — Staff/Contractor: determine final service amount & work performed
  router.patch('/:id/service-amount', requireAuth, requireRoles('Administrator', 'Super Administrator', 'Dispatcher', 'Contractor'), async (req: AuthenticatedRequest, res: Response) => {
    const { finalAmount, servicePerformed, status } = req.body;

    const amountNum = parseFloat(finalAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ error: 'Please provide a valid final service amount greater than zero.' });
    }

    try {
      const job = await prisma.job.findUnique({
        where: { id: req.params.id },
        include: {
          customer: { include: { memberships: { where: { status: 'Active' }, take: 1 } } },
          claim: true,
          assignedContractor: true,
        },
      });
      if (!job) return res.status(404).json({ error: 'Job not found' });

      const newStatus = status || 'Work Completed';
      let benefitCovered = 0;
      let customerPayable = amountNum;
      let paymentStatus = 'Payment Due';

      // If customer is a member, calculate and deduct from annual assistance benefit automatically
      if (job.customerId) {
        const coverage = await calculateBenefitCoverage({
          userId: job.customerId,
          totalServiceAmount: amountNum,
          partsAmount: req.body.partsAmount ? parseFloat(req.body.partsAmount) : 0,
          labourAmount: req.body.labourAmount ? parseFloat(req.body.labourAmount) : amountNum,
        });

        benefitCovered = coverage.amountCoveredByBenefit;
        customerPayable = coverage.amountPayableByCustomer;
        paymentStatus = customerPayable === 0 ? 'Paid' : 'Payment Due';

        let claimRecord = job.claim;
        if (!claimRecord) {
          claimRecord = await prisma.claim.create({
            data: {
              claimNumber: generateClaimNumber(),
              userId: job.customerId,
              membershipId: job.customer?.memberships[0]?.id || null,
              jobId: job.id,
              serviceType: job.serviceType,
              description: job.description,
              amountClaimed: amountNum,
              amountApproved: amountNum,
              amountDeductedFromBenefit: benefitCovered,
              customerResponsibility: customerPayable,
              status: 'Approved',
            },
          });
        } else {
          claimRecord = await prisma.claim.update({
            where: { id: claimRecord.id },
            data: {
              amountClaimed: amountNum,
              amountApproved: amountNum,
              amountDeductedFromBenefit: benefitCovered,
              customerResponsibility: customerPayable,
              status: 'Approved',
              completedAt: new Date(),
            },
          });
        }

        // Deduct from benefit if covered
        if (benefitCovered > 0) {
          await deductFromBenefit({
            userId: job.customerId,
            amountToDeduct: benefitCovered,
            description: `Job ${job.id} (${job.serviceType}) Benefit Allowance`,
            reference: claimRecord.claimNumber,
            claimId: claimRecord.id,
            adminOverride: Boolean(req.body.adminOverride),
            overrideReason: req.body.overrideReason,
            actorId: req.user!.id,
            actorRole: req.user!.role,
          });
        }

        // Generate / Update Invoice
        const existingInvoice = await prisma.invoice.findFirst({ where: { jobId: job.id } });
        if (!existingInvoice) {
          await prisma.invoice.create({
            data: {
              invoiceNumber: generateInvoiceNumber(),
              userId: job.customerId,
              membershipId: job.customer?.memberships[0]?.id || null,
              jobId: job.id,
              claimId: claimRecord.id,
              customerName: job.customer?.name || 'Member',
              customerEmail: job.customer?.email || null,
              customerAddress: job.customer?.address || null,
              membershipPlan: job.customer?.memberships[0]?.planName || job.customer?.package || 'Assist Plus',
              serviceRequested: job.serviceType,
              technicianName: job.assignedContractor?.name || 'Same Day Assist Certified Responder',
              parts: req.body.partsAmount ? parseFloat(req.body.partsAmount) : 0,
              labour: req.body.labourAmount ? parseFloat(req.body.labourAmount) : amountNum,
              subtotal: amountNum,
              taxVat: parseFloat((amountNum * 0.15).toFixed(2)),
              total: amountNum,
              amountCoveredByBenefit: benefitCovered,
              amountPayableByCustomer: customerPayable,
              paymentStatus: customerPayable === 0 ? 'Paid' : 'Unpaid',
              invoiceStatus: 'Issued',
              paidAt: customerPayable === 0 ? new Date() : null,
              notes: coverage.explanation,
            },
          });
        }
      }

      const updated = await prisma.job.update({
        where: { id: req.params.id },
        data: {
          finalAmount: amountNum,
          servicePerformed: servicePerformed || job.servicePerformed || 'Emergency Assistance Performed',
          paymentStatus: job.paymentStatus === 'Paid' ? 'Paid' : paymentStatus,
          status: newStatus,
          trackerProgress: 95,
          completedAt: new Date(),
        },
        include: {
          customer: { select: { id: true, name: true, phone: true, address: true, email: true } },
          assignedContractor: { select: { id: true, name: true, phone: true } },
        },
      });

      const formatted = formatJob(updated);

      if (job.customerId) {
        io?.to(`customer-${job.customerId}`).emit('job-updated', formatted);
      }
      io?.to(`emergency-job-${job.id}`).emit('job-updated', formatted);
      io?.to('admin-room').emit('job-updated', formatted);

      await writeAuditLog({
        userId: req.user!.id,
        userType: req.user!.role,
        action: 'Emergency Service Amount Set',
        details: `Final amount of R${amountNum.toFixed(2)} set for Job ${job.id} (${job.customerType})`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        newValue: { finalAmount: amountNum, servicePerformed, status: newStatus },
      });

      return res.json(formatted);
    } catch (error) {
      console.error('[Jobs/SetServiceAmount]', error);
      return res.status(500).json({ error: 'Failed to set service amount' });
    }
  });

  // POST /api/jobs/emergency-non-member/:id/pay — Upfront fixed R650 Call-Out Fee payment before dispatch
  router.post('/emergency-non-member/:id/pay', async (req: any, res: Response) => {
    const { paymentMethod, cardLast4, transactionRef, gatewayReference, simulateFailure } = req.body;

    try {
      const job = await prisma.job.findUnique({ 
        where: { id: req.params.id },
        include: { payments: true, invoice: true }
      });
      if (!job) return res.status(404).json({ error: 'Emergency request not found' });
      if (job.customerType !== 'NON_MEMBER_EMERGENCY') {
        return res.status(400).json({ error: 'This payment route is only for one-time emergency requests' });
      }

      // Idempotency: If already paid, return confirmed status directly
      if (job.paymentStatus === 'Paid') {
        return res.json({
          success: true,
          message: 'Payment already confirmed. Request is currently dispatchable.',
          job: formatJob(job),
          payment: job.payments?.[0] || null,
          invoice: job.invoice || null,
        });
      }

      // Negative Test Verification: Failed / Declined Payment Simulation
      if (simulateFailure === true) {
        await writeAuditLog({
          userId: undefined,
          userType: 'Non-Member Emergency',
          action: 'Emergency Call-Out Payment Failed',
          details: `Card declined for emergency call-out fee (R650) on Job ${job.id} for ${job.nonMemberName}. Dispatch remains blocked.`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          newValue: { jobId: job.id, amount: 650.00, status: 'Failed' },
        });

        return res.status(400).json({
          error: 'Payment failed: Card authorization declined by issuing bank. The emergency dispatch team cannot be sent until the R650 call-out fee is successfully paid.',
          paymentStatus: 'Failed',
          callOutFee: 650.00,
        });
      }

      // Fixed R650 Emergency Call-Out Fee
      const CALL_OUT_FEE = 650.00;
      const actualTxRef = transactionRef || `GW-SDA-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const actualGwRef = gatewayReference || `SDA-EMG-${Date.now()}`;

      // 1. Create Invoice record for the non-member Call-Out Fee
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber: generateInvoiceNumber(),
          userId: null,
          membershipId: null,
          jobId: job.id,
          customerName: job.nonMemberName || 'Emergency Non-Member Customer',
          customerEmail: job.nonMemberEmail || null,
          customerAddress: job.nonMemberAddress || null,
          membershipPlan: 'Non-Member Emergency Assistance',
          serviceRequested: job.serviceType,
          technicianName: 'Same Day Assist Emergency Response Unit',
          parts: 0.0,
          labour: CALL_OUT_FEE,
          otherCharges: 0.0,
          subtotal: CALL_OUT_FEE,
          taxVat: parseFloat((CALL_OUT_FEE * 0.15).toFixed(2)),
          total: CALL_OUT_FEE,
          amountCoveredByBenefit: 0.0,
          amountPayableByCustomer: CALL_OUT_FEE,
          paymentStatus: 'Paid',
          invoiceStatus: 'Paid',
          paidAt: new Date(),
          paymentMethod: paymentMethod || 'Card Online',
          notes: 'Emergency Assistance Call-Out Fee (R650.00). Fixed non-member one-time fee paid prior to dispatch.',
        },
      });

      // 2. Create independent one-time service payment record (NO monthly subscription created!)
      const payment = await prisma.payment.create({
        data: {
          customerId: null,
          customerName: job.nonMemberName || 'Emergency Non-Member Customer',
          jobId: job.id,
          invoiceId: invoice.id,
          paymentStage: 'SERVICE_COPAY',
          type: 'Emergency Assistance Call-Out Fee',
          amount: CALL_OUT_FEE,
          status: 'Paid',
          paymentMethod: paymentMethod || 'Card Online',
          date: new Date().toISOString().slice(0, 10),
          paidAt: new Date(),
          transactionRef: actualTxRef,
          gatewayReference: actualGwRef,
        },
      });

      // 3. Mark Job as Paid and move to Awaiting Dispatch (Ready for dispatch assignment)
      const updatedJob = await prisma.job.update({
        where: { id: job.id },
        data: {
          paymentStatus: 'Paid',
          status: 'Awaiting Dispatch',
          trackerProgress: 25,
          finalAmount: CALL_OUT_FEE,
        },
        include: {
          assignedContractor: { select: { id: true, name: true, phone: true, specialty: true, rating: true, lat: true, lng: true } },
          payments: true,
          invoice: true,
        },
      });

      const formatted = formatJob(updatedJob);

      // Emit live updates to tracking room and admin dispatch room
      io?.to(`emergency-job-${job.id}`).emit('job-updated', formatted);
      io?.to('admin-room').emit('job-updated', formatted);
      io?.to('admin-room').emit('emergency-paid', { 
        jobId: job.id, 
        amount: CALL_OUT_FEE, 
        customerName: job.nonMemberName,
        paymentRef: actualGwRef 
      });

      await writeAuditLog({
        userId: undefined,
        userType: 'Non-Member Emergency',
        action: 'Emergency Call-Out Fee Confirmed',
        details: `Non-member ${job.nonMemberName} paid Emergency Call-Out Fee of R${CALL_OUT_FEE.toFixed(2)} for Job ${job.id} via ${paymentMethod || 'Card'} (Ref: ${actualGwRef}). Request unlocked for dispatch.`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        newValue: { paymentId: payment.id, invoiceId: invoice.id, amount: CALL_OUT_FEE, status: 'Paid', customerType: 'NON_MEMBER_EMERGENCY' },
      });

      return res.json({
        success: true,
        message: 'Payment confirmed! R650 Emergency Call-Out Fee paid. Dispatch team has been notified.',
        payment,
        invoice,
        job: formatted,
      });
    } catch (error) {
      console.error('[Jobs/PayEmergency]', error);
      return res.status(500).json({ error: 'Failed to process payment' });
    }
  });

  // PATCH /api/jobs/:id/assign — Admin/Dispatcher: assign contractor
  router.patch('/:id/assign', requireAuth, requireRoles('Administrator', 'Super Administrator', 'Dispatcher'), async (req: AuthenticatedRequest, res: Response) => {
    const { contractorId } = req.body;
    if (!contractorId) return res.status(400).json({ error: 'contractorId is required' });

    try {
      const [job, contractor] = await Promise.all([
        prisma.job.findUnique({ where: { id: req.params.id }, include: { customer: true } }),
        prisma.user.findUnique({ where: { id: contractorId } }),
      ]);
      if (!job) return res.status(404).json({ error: 'Job not found' });
      if (!contractor || contractor.role !== 'Contractor') return res.status(400).json({ error: 'Invalid contractor' });

      // STRICT REQUIREMENT: For non-members, dispatch team CANNOT be dispatched until R650 Call-Out fee is paid
      if (job.customerType === 'NON_MEMBER_EMERGENCY' && job.paymentStatus !== 'Paid') {
        return res.status(400).json({
          error: 'Cannot dispatch unit: Emergency Assistance Call-Out Fee (R650) must be confirmed and paid before dispatch.',
          paymentStatus: job.paymentStatus,
          callOutFeeRequired: 650.00,
        });
      }

      const prevStatus = job.status;
      const vehicleInfo = JSON.stringify({
        make: 'Toyota',
        model: 'Hilux 4x4 Response Unit',
        licensePlate: 'SDA-01-GP',
        color: 'Tactical White',
      });

      const updated = await prisma.job.update({
        where: { id: req.params.id },
        data: {
          assignedContractorId: contractorId,
          status: 'Service Provider Assigned',
          trackerProgress: 35,
          assignedAt: new Date(),
          vehicleInfo,
          currentLat: contractor.lat || -26.2041,
          currentLng: contractor.lng || 28.0473,
          estimatedArrivalMinutes: 15,
          distanceRemainingKm: 4.5,
        },
        include: {
          customer: { select: { id: true, name: true, phone: true, address: true, email: true } },
          assignedContractor: { select: { id: true, name: true, phone: true, specialty: true, rating: true } },
        },
      });

      // Increment contractor workload
      await prisma.user.update({ where: { id: contractorId }, data: { workload: { increment: 1 } } });

      const formatted = formatJob(updated);

      // Notify contractor, customer (member or non-member socket) & admin
      io?.to(`contractor-${contractorId}`).emit('job-assigned', formatted);
      if (job.customerId) {
        io?.to(`customer-${job.customerId}`).emit('job-updated', formatted);
      }
      io?.to(`emergency-job-${job.id}`).emit('job-updated', formatted);
      io?.to('admin-room').emit('job-updated', formatted);

      await writeAuditLog({
        userId: req.user!.id,
        userType: req.user!.role,
        action: 'Service Provider Assigned',
        details: `Dispatched ${contractor.name} to Job ${req.params.id} for ${job.nonMemberName || job.customer?.name || 'Customer'}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        previousValue: { status: prevStatus },
        newValue: { status: 'Service Provider Assigned', contractorId, contractorName: contractor.name },
      });

      return res.json(formatted);
    } catch (error) {
      console.error('[Jobs/Assign]', error);
      return res.status(500).json({ error: 'Failed to assign contractor' });
    }
  });

  // PATCH /api/jobs/:id/status — Update job workflow status
  router.patch('/:id/status', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const { status } = req.body;
    
    const progressMap: Record<string, number> = {
      'Payment Required': 10,
      'Payment Processing': 15,
      'Payment Confirmed': 20,
      'Awaiting Dispatch': 25,
      'Request Received': 10,
      'Requested': 10,
      'Request Under Review': 20,
      'Accepted': 25,
      'Service Provider Assigned': 35,
      'Preparing for Dispatch': 45,
      'Dispatched': 50,
      'Team Dispatched': 50,
      'Team En Route': 65,
      'En Route': 65,
      'Arrived': 80,
      'Assistance In Progress': 85,
      'Service In Progress': 85,
      'In Progress': 85,
      'Work Completed': 95,
      'Payment Pending': 98,
      'Service Completed': 100,
      'Completed': 100,
      'Paid': 100,
      'Closed': 100,
      'Cancelled': 0,
    };

    if (progressMap[status] === undefined) {
      return res.status(400).json({ error: `Invalid status: ${status}` });
    }

    try {
      const job = await prisma.job.findUnique({ where: { id: req.params.id } });
      if (!job) return res.status(404).json({ error: 'Job not found' });

      // STRICT: For non-member emergency, cannot bypass payment to dispatch
      const DISPATCH_WORKFLOW_STATUSES = [
        'Service Provider Assigned',
        'Preparing for Dispatch',
        'Dispatched',
        'Team Dispatched',
        'En Route',
        'Team En Route',
        'Arrived',
        'Assistance In Progress',
        'Service In Progress',
        'In Progress',
        'Work Completed',
        'Service Completed',
        'Completed',
      ];

      if (job.customerType === 'NON_MEMBER_EMERGENCY' && job.paymentStatus !== 'Paid' && DISPATCH_WORKFLOW_STATUSES.includes(status)) {
        return res.status(400).json({
          error: `Cannot change status to "${status}": The R650 Emergency Call-Out Fee must be confirmed before dispatch.`,
          paymentStatus: job.paymentStatus,
          callOutFeeRequired: 650.00,
        });
      }

      const updated = await prisma.job.update({
        where: { id: req.params.id },
        data: {
          status,
          trackerProgress: progressMap[status],
          completedAt: ['Service Completed', 'Completed', 'Work Completed'].includes(status) ? new Date() : job.completedAt,
        },
        include: {
          customer: { select: { id: true, name: true, phone: true, address: true, email: true } },
          assignedContractor: { select: { id: true, name: true, phone: true, lat: true, lng: true } },
        },
      });

      const formatted = formatJob(updated);

      // Broadcast live update
      if (job.customerId) {
        io?.to(`customer-${job.customerId}`).emit('job-updated', formatted);
      }
      io?.to(`emergency-job-${job.id}`).emit('job-updated', formatted);
      io?.to('admin-room').emit('job-updated', formatted);

      await writeAuditLog({
        userId: req.user!.id,
        userType: req.user!.role,
        action: 'Job Status Updated',
        details: `Updated job ${req.params.id} status to "${status}"`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        previousValue: { status: job.status },
        newValue: { status },
      });

      return res.json(formatted);
    } catch (error) {
      console.error('[Jobs/Status]', error);
      return res.status(500).json({ error: 'Failed to update job status' });
    }
  });

  // PATCH /api/jobs/:id/location — Real-Time GPS Stream & ETA Update
  router.patch('/:id/location', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const { lat, lng, estimatedArrivalMinutes, distanceRemainingKm } = req.body;
    if (lat === undefined || lng === undefined) return res.status(400).json({ error: 'lat and lng are required' });

    try {
      const job = await prisma.job.update({
        where: { id: req.params.id },
        data: {
          currentLat: parseFloat(lat),
          currentLng: parseFloat(lng),
          estimatedArrivalMinutes: estimatedArrivalMinutes !== undefined ? parseInt(estimatedArrivalMinutes) : undefined,
          distanceRemainingKm: distanceRemainingKm !== undefined ? parseFloat(distanceRemainingKm) : undefined,
        },
      });

      const locationPayload = {
        jobId: req.params.id,
        currentLat: parseFloat(lat),
        currentLng: parseFloat(lng),
        estimatedArrivalMinutes: job.estimatedArrivalMinutes,
        distanceRemainingKm: job.distanceRemainingKm,
      };

      if (job.customerId) {
        io?.to(`customer-${job.customerId}`).emit('contractor-location', locationPayload);
      }
      io?.to(`emergency-job-${job.id}`).emit('contractor-location', locationPayload);
      io?.to('admin-room').emit('contractor-location', locationPayload);

      return res.json({ success: true, location: locationPayload });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update live GPS location' });
    }
  });

  // POST /api/jobs/:id/complete — Contractor: submit completion report
  router.post('/:id/complete', requireAuth, requireRoles('Contractor'), validate(completionSchema), async (req: AuthenticatedRequest, res: Response) => {
    const { contractorNotes, contractorSignature, completionPhoto } = req.body;

    try {
      const job = await prisma.job.findUnique({ where: { id: req.params.id }, include: { customer: true } });
      if (!job) return res.status(404).json({ error: 'Job not found' });
      if (job.assignedContractorId !== req.user!.id) return res.status(403).json({ error: 'Not authorized' });

      const [updated] = await prisma.$transaction([
        prisma.job.update({
          where: { id: req.params.id },
          data: {
            status: 'Work Completed',
            trackerProgress: 95,
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
        prisma.user.update({
          where: { id: req.user!.id },
          data: { workload: { decrement: 1 } },
        }),
      ]);

      const formatted = formatJob(updated);

      if (job.customerId) {
        io?.to(`customer-${job.customerId}`).emit('job-updated', formatted);
      }
      io?.to(`emergency-job-${job.id}`).emit('job-updated', formatted);
      io?.to('admin-room').emit('job-updated', formatted);

      await writeAuditLog({
        userId: req.user!.id,
        userType: req.user!.role,
        action: 'Job Work Completed',
        details: `Contractor completed work on Job ${req.params.id} for ${job.nonMemberName || job.customer?.name || 'Customer'}.`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        newValue: { status: 'Work Completed', hasSignature: !!contractorSignature },
      });

      return res.json(formatted);
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

      const updated = await prisma.job.update({
        where: { id: req.params.id },
        data: { status: 'Closed', rating, ratingComment, closedAt: new Date() },
      });

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

      const formatted = formatJob(updated);
      io?.to('admin-room').emit('job-updated', formatted);

      await writeAuditLog({
        userId: req.user!.id,
        userType: 'Customer',
        action: 'Job Rated',
        details: `Customer rated Job ${req.params.id} with ${rating}/5 stars`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        newValue: { rating, ratingComment, status: 'Closed' },
      });

      return res.json(formatted);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to rate job' });
    }
  });

  // PATCH /api/jobs/:id/close — Admin/Dispatcher: close completed job
  router.patch('/:id/close', requireAuth, requireRoles('Administrator', 'Super Administrator', 'Dispatcher'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const job = await prisma.job.findUnique({ where: { id: req.params.id } });
      if (!job) return res.status(404).json({ error: 'Job not found' });

      const updated = await prisma.job.update({
        where: { id: req.params.id },
        data: { status: 'Closed', closedAt: new Date() },
      });

      const formatted = formatJob(updated);
      io?.to('admin-room').emit('job-updated', formatted);

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

      return res.json(formatted);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to close job' });
    }
  });

  return router;
}

export default router;
