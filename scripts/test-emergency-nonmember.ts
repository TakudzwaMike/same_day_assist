import { prisma } from '../server/src/config/db';
import { generateAccessToken } from '../server/src/config/auth';

const BASE_URL = 'http://localhost:5000/api';

function generateToken(user: any) {
  return generateAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });
}

async function runTestSuite() {
  console.log('\n============================================================');
  console.log('🚨 SAME DAY ASSIST — NON-MEMBER EMERGENCY ASSISTANCE TEST SUITE');
  console.log('============================================================\n');

  // 1. Identify Admin user & Contractor user in DB
  const admin = await prisma.user.findFirst({
    where: { role: { in: ['Administrator', 'Super Administrator'] } }
  });
  if (!admin) throw new Error('No administrator user found in database');
  const adminToken = generateToken(admin);

  const contractor = await prisma.user.findFirst({
    where: { role: 'Contractor' }
  });
  if (!contractor) throw new Error('No contractor user found in database');

  console.log(`✓ Admin User: ${admin.name} (${admin.email})`);
  console.log(`✓ Certified Contractor: ${contractor.name} (${contractor.specialty})`);

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✅ [PASS] ${testName}`);
    } else {
      console.error(`  ❌ [FAIL] ${testName}${detail ? ` - Detail: ${detail}` : ''}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  // -------------------------------------------------------------------------
  // TEST 1: NEGATIVE TEST — REJECT ROADSIDE ASSISTANCE / TOWING
  // -------------------------------------------------------------------------
  console.log('\n[1/7] Testing Roadside / Towing Rejection (Strict Feature Boundary)...');
  const roadsideRes = await fetch(`${BASE_URL}/jobs/emergency-non-member`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Unsuspecting Motorist',
      phone: '+27 82 999 1111',
      address: 'N1 Highway Exit 22',
      serviceType: 'Roadside Assistance',
      description: 'Flat tyre on highway',
      consentAgreed: true,
    }),
  });
  const roadsideBody = await roadsideRes.json();

  assert(
    roadsideRes.status === 400 && roadsideBody.error.includes('Roadside assistance is not offered'),
    'Reject Roadside Assistance request with 400',
    `Status ${roadsideRes.status}: ${JSON.stringify(roadsideBody)}`
  );

  // -------------------------------------------------------------------------
  // TEST 2: NON-MEMBER EMERGENCY REQUEST INTAKE WITH FIXED R650 CALL-OUT FEE
  // -------------------------------------------------------------------------
  console.log('\n[2/7] Testing Non-Member Emergency Request Intake (Garage & Gate Automation)...');
  const emergencyPayload = {
    name: 'Tendai Moyo',
    phone: `+27 82 555 ${Math.floor(1000 + Math.random() * 9000)}`,
    email: 'tendai.moyo@gmail.com',
    address: '88 Katherine Street, Sandton, Johannesburg',
    serviceType: 'Garage & Gate Automation',
    description: 'Electric main security gate motor burned out and gate is jammed half-open leaving property exposed.',
    urgency: 'Immediate Emergency (Rapid Dispatch)',
    additionalNotes: 'Intercom code #1234, watch out for German Shepherd inside',
    consentAgreed: true,
  };

  const createRes = await fetch(`${BASE_URL}/jobs/emergency-non-member`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(emergencyPayload),
  });
  const createBody = await createRes.json();

  assert(createRes.status === 201, 'Create emergency non-member job returned HTTP 201');
  const job = createBody.job;
  assert(job.customerType === 'NON_MEMBER_EMERGENCY', 'Job customerType is strictly NON_MEMBER_EMERGENCY');
  assert(job.customerId === null, 'Job customerId is null (NO monthly user profile created)');
  assert(job.finalAmount === 650.00, 'Job finalAmount is fixed at R650.00');
  assert(job.callOutFee === 650.00, 'Job callOutFee is fixed at R650.00');
  assert(job.status === 'Payment Required', 'Initial status is "Payment Required"');
  assert(job.paymentStatus === 'Payment Required', 'Initial paymentStatus is "Payment Required"');

  // Verify non-member received NO membership, NO membership benefits
  const memberships = await prisma.membership.findMany({
    where: { user: { email: emergencyPayload.email } }
  });
  assert(memberships.length === 0, 'No monthly membership or recurring subscription created for non-member');

  // -------------------------------------------------------------------------
  // TEST 3: NEGATIVE TESTS — DISPATCH MUST BE LOCKED BEFORE PAYMENT
  // -------------------------------------------------------------------------
  console.log('\n[3/7] Testing Dispatch Locking Before Payment Confirmation...');

  // 3a. Admin attempts to assign contractor before R650 fee is paid
  const assignBeforePayRes = await fetch(`${BASE_URL}/jobs/${job.id}/assign`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ contractorId: contractor.id }),
  });
  const assignBeforePayBody = await assignBeforePayRes.json();

  assert(
    assignBeforePayRes.status === 400 && assignBeforePayBody.error.includes('must be confirmed and paid before dispatch'),
    'Backend rejects contractor assignment when payment is pending',
    `Status ${assignBeforePayRes.status}: ${JSON.stringify(assignBeforePayBody)}`
  );

  // 3b. Attempt to force status to "Dispatched" before payment
  const statusBeforePayRes = await fetch(`${BASE_URL}/jobs/${job.id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ status: 'Dispatched' }),
  });
  const statusBeforePayBody = await statusBeforePayRes.json();

  assert(
    statusBeforePayRes.status === 400 && statusBeforePayBody.error.includes('must be confirmed before dispatch'),
    'Backend rejects status change to "Dispatched" before payment',
    `Status ${statusBeforePayRes.status}: ${JSON.stringify(statusBeforePayBody)}`
  );

  // 3c. Failed payment simulation keeps dispatch locked
  const failedPayRes = await fetch(`${BASE_URL}/jobs/emergency-non-member/${job.id}/pay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentMethod: 'Credit Card (Visa)',
      simulateFailure: true,
    }),
  });
  const failedPayBody = await failedPayRes.json();

  assert(
    failedPayRes.status === 400 && failedPayBody.paymentStatus === 'Failed',
    'Failed payment simulation returns 400 and keeps status unconfirmed'
  );

  const jobStillUnpaid = await prisma.job.findUnique({ where: { id: job.id } });
  assert(jobStillUnpaid?.paymentStatus === 'Payment Required', 'Job paymentStatus remains "Payment Required" after failed payment');

  // -------------------------------------------------------------------------
  // TEST 4: SUCCESSFUL R650 CALL-OUT FEE PAYMENT & FINANCIAL AUDIT
  // -------------------------------------------------------------------------
  console.log('\n[4/7] Testing Successful R650 Call-Out Payment & Financial Records...');
  const payRes = await fetch(`${BASE_URL}/jobs/emergency-non-member/${job.id}/pay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentMethod: 'Credit Card (Visa)',
      cardLast4: '4242',
      transactionRef: `GW-TEST-${Date.now()}`,
      gatewayReference: `SDA-GW-REF-${Date.now()}`,
      simulateFailure: false,
    }),
  });
  const payBody = await payRes.json();

  assert(payRes.status === 200, 'Pay emergency service returned HTTP 200');
  assert(payBody.success === true, 'Response indicates success');
  assert(payBody.payment.amount === 650.00, 'Payment record amount is exactly R650.00');
  assert(payBody.payment.type === 'Emergency Assistance Call-Out Fee', 'Payment type is "Emergency Assistance Call-Out Fee"');
  assert(payBody.payment.status === 'Paid', 'Payment status is "Paid"');

  // Verify Invoice Record
  assert(payBody.invoice !== null, 'Invoice record was generated');
  assert(payBody.invoice.subtotal === 650.00, 'Invoice subtotal is R650.00');
  assert(payBody.invoice.total === 650.00, 'Invoice total is R650.00');
  assert(payBody.invoice.paymentStatus === 'Paid', 'Invoice paymentStatus is "Paid"');

  // Verify Job Status Updated to Awaiting Dispatch
  assert(payBody.job.paymentStatus === 'Paid', 'Job paymentStatus is updated to "Paid"');
  assert(payBody.job.status === 'Awaiting Dispatch', 'Job status moved to "Awaiting Dispatch"');
  assert(payBody.job.trackerProgress === 25, 'Tracker progress moved to 25%');

  // -------------------------------------------------------------------------
  // TEST 5: IDEMPOTENCY & DUPLICATE PAYMENT PROTECTION
  // -------------------------------------------------------------------------
  console.log('\n[5/7] Testing Idempotency (Duplicate Payment Prevention)...');
  const duplicatePayRes = await fetch(`${BASE_URL}/jobs/emergency-non-member/${job.id}/pay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentMethod: 'Credit Card', cardLast4: '4242' }),
  });
  const duplicatePayBody = await duplicatePayRes.json();

  assert(duplicatePayRes.status === 200, 'Duplicate payment returns HTTP 200');
  assert(duplicatePayBody.message.includes('already confirmed'), 'Duplicate payment detected and handled gracefully');

  const paymentsCount = await prisma.payment.count({ where: { jobId: job.id } });
  assert(paymentsCount === 1, 'Only 1 payment record exists for this job (no double charge)');

  // -------------------------------------------------------------------------
  // TEST 6: ADMIN DISPATCH OF CONTRACTOR AFTER CONFIRMED PAYMENT
  // -------------------------------------------------------------------------
  console.log('\n[6/7] Testing Admin Dispatch & Contractor Assignment After Payment...');
  const assignRes = await fetch(`${BASE_URL}/jobs/${job.id}/assign`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ contractorId: contractor.id }),
  });
  const assignBody = await assignRes.json();

  assert(assignRes.status === 200, 'Assign contractor after payment returned HTTP 200');
  assert(assignBody.assignedContractorId === contractor.id, 'Contractor successfully assigned to emergency job');
  assert(assignBody.status === 'Service Provider Assigned', 'Status transitioned to "Service Provider Assigned"');

  // -------------------------------------------------------------------------
  // TEST 7: DISPATCH PROGRESSION (En Route -> Assistance In Progress -> Completed)
  // -------------------------------------------------------------------------
  console.log('\n[7/7] Testing Complete Workflow Progression To Completion...');

  // 7a. Team En Route
  const enRouteRes = await fetch(`${BASE_URL}/jobs/${job.id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ status: 'Team En Route' }),
  });
  const enRouteBody = await enRouteRes.json();
  assert(enRouteRes.status === 200 && enRouteBody.status === 'Team En Route', 'Status updated to "Team En Route"');

  // 7b. Assistance In Progress
  const inProgressRes = await fetch(`${BASE_URL}/jobs/${job.id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ status: 'Assistance In Progress' }),
  });
  const inProgressBody = await inProgressRes.json();
  assert(inProgressRes.status === 200 && inProgressBody.status === 'Assistance In Progress', 'Status updated to "Assistance In Progress"');

  // 7c. Completed
  const completedRes = await fetch(`${BASE_URL}/jobs/${job.id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ status: 'Completed' }),
  });
  const completedBody = await completedRes.json();
  assert(completedRes.status === 200 && completedBody.status === 'Completed', 'Status updated to "Completed"');

  // 7d. Public tracking verification
  const publicTrackingRes = await fetch(`${BASE_URL}/jobs/emergency-non-member/${job.id}`);
  const publicTrackingBody = await publicTrackingRes.json();
  assert(publicTrackingRes.status === 200, 'Public non-member tracking endpoint returns HTTP 200');
  assert(publicTrackingBody.status === 'Completed', 'Public tracker reflects "Completed" status');
  assert(publicTrackingBody.assignedContractor.name === contractor.name, 'Public tracker shows assigned contractor details');
  assert(publicTrackingBody.payments.length > 0, 'Public tracker includes payment history');

  console.log('\n============================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED WITH 100% SUCCESS!`);
  console.log('============================================================\n');
}

runTestSuite()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[Emergency Test Suite Error]', err);
    process.exit(1);
  });
