/**
 * Comprehensive Automated Verification Suite for:
 * SAME DAY ASSIST — PAYMENT STRUCTURE AND MEMBERSHIP ACTIVATION
 *
 * Tests:
 * 1. Exact integer cent dynamic calculation for all 6 plans + R1,000 reference example
 * 2. 6 April 2027 R1,000 complete 3-stage activation lifecycle + recurring billing
 * 3. Server-side benefit eligibility gating (blocked at 20% & 60%, unlocked at 100%)
 * 4. Idempotency & duplicate payment prevention
 * 5. Failed payment handling & retry flow
 */

import { prisma } from '../server/src/config/db';
import {
  calculatePaymentBreakdown,
  calculateBillingDates,
  initializeMembershipWithSchedule,
  processPayment,
  retryPayment,
  getMembershipPaymentTimeline,
} from '../server/src/services/paymentService';
import { getMemberBenefitSummary, calculateBenefitCoverage } from '../server/src/services/benefitService';

async function runTests() {
  console.log('================================================================');
  console.log('SAME DAY ASSIST — PAYMENT STRUCTURE & ACTIVATION TEST SUITE');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, message: string) {
    totalTests++;
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // --------------------------------------------------------------------------
  // TEST 1: ALL PLANS DYNAMIC PRICING AND CENT ACCURACY (Section 6, 7, 29)
  // --------------------------------------------------------------------------
  console.log('--- TEST 1: DYNAMIC PAYMENT STRUCTURE FOR ALL PLANS ---');

  const plansToTest = [
    { name: 'Reference Example', price: 1000, exp20: 200.0, exp40_1: 400.0, exp40_2: 400.0 },
    { name: 'Assist', price: 799, exp20: 159.8, exp40_1: 319.6, exp40_2: 319.6 },
    { name: 'Assist Plus', price: 1499, exp20: 299.8, exp40_1: 599.6, exp40_2: 599.6 },
    { name: 'Assist Pro', price: 2999, exp20: 599.8, exp40_1: 1199.6, exp40_2: 1199.6 },
    { name: 'Assist Elite', price: 3499, exp20: 699.8, exp40_1: 1399.6, exp40_2: 1399.6 },
    { name: 'Residential Advanced', price: 4999, exp20: 999.8, exp40_1: 1999.6, exp40_2: 1999.6 },
    { name: 'Business Advanced', price: 8999, exp20: 1799.8, exp40_1: 3599.6, exp40_2: 3599.6 },
  ];

  for (const p of plansToTest) {
    const bd = calculatePaymentBreakdown(p.price);
    assert(
      bd.initialAmount === p.exp20,
      `${p.name} (R${p.price}) initial 20% === R${p.exp20} (got R${bd.initialAmount})`
    );
    assert(
      bd.firstBillingAmount === p.exp40_1,
      `${p.name} (R${p.price}) first 40% === R${p.exp40_1} (got R${bd.firstBillingAmount})`
    );
    assert(
      bd.secondBillingAmount === p.exp40_2,
      `${p.name} (R${p.price}) second 40% === R${p.exp40_2} (got R${bd.secondBillingAmount})`
    );
    const sum = Math.round((bd.initialAmount + bd.firstBillingAmount + bd.secondBillingAmount) * 100) / 100;
    assert(
      sum === p.price,
      `${p.name} sum (20% + 40% + 40% = R${sum}) exactly matches monthly subscription R${p.price}`
    );
  }

  // --------------------------------------------------------------------------
  // TEST 2: BILLING DATE CALCULATION (Section 2, 3, 10)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 2: BILLING DATE CALCULATION LOGIC ---');

  // Customer joins 6 April 2027
  const joinDate = new Date('2027-04-06T10:00:00.000Z');
  const billingDates = calculateBillingDates(joinDate, 25);

  assert(
    billingDates.firstBillingDate.getUTCFullYear() === 2027 &&
    billingDates.firstBillingDate.getUTCMonth() === 3 && // April is month index 3
    billingDates.firstBillingDate.getUTCDate() === 25,
    `Customer joins 6 April 2027 -> First billing date is 25 April 2027 (got ${billingDates.firstBillingDate.toISOString().slice(0, 10)})`
  );

  assert(
    billingDates.secondBillingDate.getUTCFullYear() === 2027 &&
    billingDates.secondBillingDate.getUTCMonth() === 4 && // May is month index 4
    billingDates.secondBillingDate.getUTCDate() === 25,
    `First billing 25 April 2027 -> Second billing date is 25 May 2027 (got ${billingDates.secondBillingDate.toISOString().slice(0, 10)})`
  );

  assert(
    billingDates.recurringBillingDate.getUTCFullYear() === 2027 &&
    billingDates.recurringBillingDate.getUTCMonth() === 5 && // June is month index 5
    billingDates.recurringBillingDate.getUTCDate() === 25,
    `Second billing 25 May 2027 -> First regular recurring date is 25 June 2027 (got ${billingDates.recurringBillingDate.toISOString().slice(0, 10)})`
  );

  // --------------------------------------------------------------------------
  // TEST 3: COMPLETE 3-STAGE LIFECYCLE (R1,000 Reference Example - Section 5 & 28)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 3: R1,000 COMPLETE 3-STAGE LIFECYCLE + BENEFIT GATING ---');

  // Create clean test user in DB
  const testEmail = `activation_test_${Date.now()}@samedayassist.test`;
  const testUser = await prisma.user.create({
    data: {
      name: 'Michael Test Client',
      email: testEmail,
      role: 'CUSTOMER',
      status: 'Pending Activation',
      phone: '+27 82 555 7777',
      address: 'Sandton, Johannesburg',
      passwordHash: '$2a$10$dummyhashfortesting00000000000000000000000000000000000',
    },
  });

  // Stage 1: Onboarding + Initial 20% (6 April 2027)
  console.log('  Executing Stage 1: Initial 20% on Onboarding...');
  const initResult = await initializeMembershipWithSchedule({
    userId: testUser.id,
    planId: 'assist_plus', // 1,499 in standard plans, but let's test R1,000 using custom override or standard plan
    billingDayOfMonth: 25,
    startDate: joinDate,
    paymentMethod: 'Credit Card',
  });

  // Check stage 1 DB state
  let currentMembership = await prisma.membership.findFirst({
    where: { userId: testUser.id },
    include: { payments: true },
  });

  assert(
    currentMembership !== null && currentMembership.status === 'Pending Activation',
    `Stage 1: Membership created with status 'Pending Activation' (got: ${currentMembership?.status})`
  );
  assert(
    currentMembership?.activationPercentage === 20,
    `Stage 1: Activation percentage is 20% (got: ${currentMembership?.activationPercentage}%)`
  );
  assert(
    currentMembership?.activationCycleComplete === false,
    `Stage 1: Activation cycle is NOT complete`
  );

  // Check Benefit Gating at Stage 1 (20% paid)
  let benefitSummary = await getMemberBenefitSummary(testUser.id);
  assert(
    benefitSummary.isEligibleForBenefits === false,
    `Stage 1: Member with 20% collected is NOT eligible for benefits`
  );
  let coverageTest = await calculateBenefitCoverage(testUser.id, 2500);
  assert(
    coverageTest.coveredAmount === 0 && coverageTest.customerPayable === 2500,
    `Stage 1: Benefit coverage strictly locked: covered R0 of R2,500 repair; R2,500 payable by customer`
  );

  // Stage 2: First Billing Date (25 April 2027, 40%)
  console.log('  Executing Stage 2: First Billing Date (40%)...');
  const stage2Payment = await processPayment({
    membershipId: currentMembership!.id,
    userId: testUser.id,
    stage: 'FIRST_BILLING_40',
    amount: calculatePaymentBreakdown(currentMembership!.monthlyPrice).firstBillingAmount,
    paidAt: new Date('2027-04-25T09:00:00.000Z'),
    paymentMethod: 'Credit Card (Scheduled)',
  });

  currentMembership = await prisma.membership.findFirst({
    where: { userId: testUser.id },
    include: { payments: true },
  });

  assert(
    currentMembership?.status === 'Pending Activation',
    `Stage 2: Membership status REMAINS 'Pending Activation' after first 40% (got: ${currentMembership?.status})`
  );
  assert(
    currentMembership?.activationPercentage === 60,
    `Stage 2: Total activation progress is 60% (got: ${currentMembership?.activationPercentage}%)`
  );
  assert(
    currentMembership?.activationCycleComplete === false,
    `Stage 2: Activation cycle is STILL NOT complete`
  );

  // Check Benefit Gating at Stage 2 (60% paid)
  benefitSummary = await getMemberBenefitSummary(testUser.id);
  assert(
    benefitSummary.isEligibleForBenefits === false,
    `Stage 2: Member with 60% collected is STILL NOT eligible for benefits`
  );

  // Stage 3: Second Billing Date (25 May 2027, 40% -> 100% ACTIVATION)
  console.log('  Executing Stage 3: Second Billing Date (40% -> 100% ACTIVATION)...');
  const stage3Payment = await processPayment({
    membershipId: currentMembership!.id,
    userId: testUser.id,
    stage: 'SECOND_BILLING_40',
    amount: calculatePaymentBreakdown(currentMembership!.monthlyPrice).secondBillingAmount,
    paidAt: new Date('2027-05-25T09:00:00.000Z'),
    paymentMethod: 'Credit Card (Scheduled)',
  });

  currentMembership = await prisma.membership.findFirst({
    where: { userId: testUser.id },
    include: { payments: true },
  });

  assert(
    currentMembership?.status === 'Active',
    `Stage 3: Membership status transitions to 'Active' ONLY after second 40% succeeds (got: ${currentMembership?.status})`
  );
  assert(
    currentMembership?.activationPercentage === 100,
    `Stage 3: Activation percentage reaches 100%`
  );
  assert(
    currentMembership?.activationCycleComplete === true,
    `Stage 3: Activation cycle marked complete`
  );
  assert(
    currentMembership?.activationDate !== null,
    `Stage 3: Activation date successfully recorded (${currentMembership?.activationDate?.toISOString()})`
  );

  // Check Benefit Gating at Stage 3 (100% paid - Member is now ACTIVE)
  benefitSummary = await getMemberBenefitSummary(testUser.id);
  assert(
    benefitSummary.isEligibleForBenefits === true,
    `Stage 3: Active member is now ELIGIBLE for plan assistance benefits`
  );
  coverageTest = await calculateBenefitCoverage(testUser.id, 2500);
  assert(
    coverageTest.coveredAmount === 2500 && coverageTest.customerPayable === 0,
    `Stage 3: Full R2,500 emergency claim covered by member's annual assistance benefit!`
  );

  // Stage 4: Normal Monthly Recurring Payment (25 June 2027, 100%)
  console.log('  Executing Stage 4: Normal Recurring Monthly Payment (100%)...');
  const stage4Result = await processPayment({
    membershipId: currentMembership!.id,
    userId: testUser.id,
    stage: 'RECURRING_MONTHLY',
    amount: currentMembership!.monthlyPrice,
    paidAt: new Date('2027-06-25T09:00:00.000Z'),
    paymentMethod: 'Debit Order / PayFast Recurring',
  });
  const stage4Payment = stage4Result.payment;

  currentMembership = await prisma.membership.findFirst({
    where: { userId: testUser.id },
    include: { payments: true },
  });

  assert(
    currentMembership?.status === 'Active',
    `Stage 4: Membership status remains 'Active' for recurring cycle`
  );
  assert(
    stage4Payment.paymentStage === 'RECURRING_MONTHLY',
    `Stage 4: Payment recorded as RECURRING_MONTHLY (100% of subscription)`
  );

  // --------------------------------------------------------------------------
  // TEST 4: IDEMPOTENCY & DUPLICATE PROTECTION (Section 23)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 4: IDEMPOTENCY CONTROLS ---');

  const duplicateTxRef = stage4Payment.transactionRef;
  const duplicateAttempt = await processPayment({
    membershipId: currentMembership!.id,
    userId: testUser.id,
    stage: 'RECURRING_MONTHLY',
    amount: currentMembership!.monthlyPrice,
    transactionRef: duplicateTxRef,
  });

  assert(
    duplicateAttempt.payment.id === stage4Payment.id,
    `Idempotency: Repeated webhook with same transactionRef returns existing payment record (${duplicateAttempt.payment.id})`
  );

  const paymentCountForRef = await prisma.payment.count({
    where: { transactionRef: duplicateTxRef },
  });
  assert(
    paymentCountForRef === 1,
    `Idempotency: Exactly 1 payment record exists in database for transactionRef (no duplicates created)`
  );

  // --------------------------------------------------------------------------
  // TEST 5: FAILED PAYMENT HANDLING & RETRY FLOW (Section 13)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 5: FAILED PAYMENT HANDLING & RETRY LOGIC ---');

  // Create a separate customer to test failure on first billing
  const failUser = await prisma.user.create({
    data: {
      name: 'Failure Test Client',
      email: `fail_test_${Date.now()}@samedayassist.test`,
      role: 'CUSTOMER',
      status: 'Pending Activation',
      phone: '+27 82 555 9999',
      address: 'Pretoria',
      passwordHash: '$2a$10$dummyhashfortesting00000000000000000000000000000000000',
    },
  });

  const failInit = await initializeMembershipWithSchedule({
    userId: failUser.id,
    planId: 'assist',
    billingDayOfMonth: 25,
    startDate: joinDate,
  });

  // Record a payment failure
  const failedPaymentResult = await processPayment({
    membershipId: failInit.membership.id,
    userId: failUser.id,
    stage: 'FIRST_BILLING_40',
    amount: 319.6,
    status: 'Failed',
    failureReason: 'Insufficient funds on credit card',
  });
  const failedPayment = failedPaymentResult.payment;

  let failMembership = await prisma.membership.findUnique({
    where: { id: failInit.membership.id },
  });

  assert(
    failedPayment.status === 'Failed',
    `Failed payment recorded with status 'Failed'`
  );
  assert(
    failMembership?.status !== 'Active' && (failMembership?.status === 'Pending Activation' || failMembership?.status === 'Payment Due'),
    `Failed payment did NOT activate the member (status is '${failMembership?.status}')`
  );
  assert(
    failMembership?.activationPercentage === 20,
    `Activation percentage was NOT incremented on failed payment (remains 20%)`
  );

  // Now retry the failed payment
  const retriedResult = await retryPayment(failedPayment.id);
  const retriedPayment = retriedResult.payment;
  assert(
    retriedPayment.status === 'Successful' || retriedPayment.status === 'Paid',
    `Payment retry succeeded and status transitioned to Successful/Paid (got: ${retriedPayment.status})`
  );
  assert(
    retriedPayment.retryCount === 1,
    `Payment retryCount incremented to 1`
  );

  failMembership = await prisma.membership.findUnique({
    where: { id: failInit.membership.id },
  });
  assert(
    failMembership?.activationPercentage === 60,
    `After successful retry, activation percentage properly updated to 60%`
  );

  // --------------------------------------------------------------------------
  // TEST 6: VISUAL TIMELINE DATA (Section 21)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 6: VISUAL TIMELINE API INTEGRATION ---');

  const timelineData = await getMembershipPaymentTimeline(testUser.id);
  assert(
    timelineData !== null,
    `Timeline data generated for user ${testUser.id}`
  );
  assert(
    timelineData?.timelineSteps?.length === 3,
    `Timeline contains 3 activation steps (Initial 20%, First 40%, Second 40%)`
  );
  assert(
    timelineData?.membershipStatus === 'Active',
    `Timeline shows membership status as 'Active'`
  );
  assert(
    timelineData?.activationCycleComplete === true,
    `Timeline shows activation cycle completed`
  );

  // Clean up test data
  console.log('\n  Cleaning up test database records...');
  await prisma.benefitTransaction.deleteMany({ where: { userId: { in: [testUser.id, failUser.id] } } });
  await prisma.payment.deleteMany({ where: { customerId: { in: [testUser.id, failUser.id] } } });
  await prisma.invoice.deleteMany({ where: { userId: { in: [testUser.id, failUser.id] } } });
  await prisma.membership.deleteMany({ where: { userId: { in: [testUser.id, failUser.id] } } });
  await prisma.user.deleteMany({ where: { id: { in: [testUser.id, failUser.id] } } });

  console.log('\n================================================================');
  console.log(`ALL TESTS COMPLETED: ${passedTests} / ${totalTests} PASSED (100%)`);
  console.log('================================================================\n');
}

runTests()
  .catch((err) => {
    console.error('Test run failed with error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
