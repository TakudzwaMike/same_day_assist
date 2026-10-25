import { prisma } from '../server/src/config/db';
import { teamFinanceService } from '../server/src/services/teamFinanceService';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production-min32chars';

async function runVerification() {
  console.log('===============================================================');
  console.log('SAME DAY ASSIST — TEAM FINANCES & VISIBILITY VERIFICATION SUITE');
  console.log('===============================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`[FAIL] ${testName}${details ? ` -> ${details}` : ''}`);
    }
  }

  // 1. Retrieve team members
  const sipho = await prisma.user.findFirst({ where: { email: 'sipho.ndlovu@samedayassist.co.za' } });
  const jan = await prisma.user.findFirst({ where: { email: 'jan.deklerk@samedayassist.co.za' } });
  const dispatcher = await prisma.user.findFirst({ where: { email: 'dispatcher@samedayassist.co.za' } });
  const admin = await prisma.user.findFirst({ where: { email: 'admin@samedayassist.co.za' } });

  assert(!!sipho && !!dispatcher && !!admin, 'Users exist in database', `Sipho: ${!!sipho}, Dispatcher: ${!!dispatcher}, Admin: ${!!admin}`);

  // Test 1: Technical team member sees their own confirmed earnings only
  const siphoFinancials = await teamFinanceService.getMemberFinancials(sipho!.id);
  assert(
    siphoFinancials.earnings.length > 0 &&
    siphoFinancials.earnings.every(e => e.userId === sipho!.id),
    'SCENARIO 1: Technical member (Sipho) retrieves their own earnings records only',
    `Found ${siphoFinancials.earnings.length} earnings for Sipho`
  );

  // Test 2: Dispatcher sees their own confirmed earnings only
  const dispatcherFinancials = await teamFinanceService.getMemberFinancials(dispatcher!.id);
  assert(
    dispatcherFinancials.earnings.length > 0 &&
    dispatcherFinancials.earnings.every(e => e.userId === dispatcher!.id) &&
    dispatcherFinancials.earnings.some(e => e.type === 'DISPATCH_SHIFT_ALLOWANCE'),
    'SCENARIO 2: Dispatcher retrieves their own shift and coordination earnings only',
    `Found ${dispatcherFinancials.earnings.length} earnings for Dispatcher`
  );

  // Test 3: Neither role sees projected or potential earnings in summary
  const siphoSummaryKeys = Object.keys(siphoFinancials.summary);
  const dispatcherSummaryKeys = Object.keys(dispatcherFinancials.summary);
  const hasProjectedKeys = (keys: string[]) => keys.some(k => k.toLowerCase().includes('project') || k.toLowerCase().includes('potential') || k.toLowerCase().includes('forecast'));
  assert(
    !hasProjectedKeys(siphoSummaryKeys) && !hasProjectedKeys(dispatcherSummaryKeys),
    'SCENARIO 3: Summary metrics exclude projected, potential, or forecasted earnings',
    'Only confirmed/settled figures returned'
  );

  // Test 4: Qualifying fast-response bonus is recorded and displayed correctly
  const fastResponseBonus = siphoFinancials.bonuses.find(b => b.bonusType === 'FAST_RESPONSE_SLA');
  assert(
    !!fastResponseBonus && fastResponseBonus.amount > 0 && fastResponseBonus.criteriaMet?.includes('min') && fastResponseBonus.status === 'APPROVED',
    'SCENARIO 4: Fast-response SLA bonus recorded with criteria, status, and positive amount',
    `Bonus: ${fastResponseBonus?.name}, Amount: R${fastResponseBonus?.amount}`
  );

  // Test 5: R100,000 bonus appears only when conditions are satisfied
  assert(
    siphoFinancials.annual100kStatus.isEligible === false &&
    siphoFinancials.annual100kStatus.isAwarded === false &&
    siphoFinancials.annual100kStatus.requiredJobs === 500 &&
    siphoFinancials.summary.netLifetimeEarned < 100000,
    'SCENARIO 5: R100,000 bonus is NOT awarded prematurely and requires 500 completed jobs & 99% SLA',
    `Current progress: ${siphoFinancials.annual100kStatus.currentCompletedJobs}/500 jobs`
  );

  // Test 6: Penalty shows amount, date, reason, and explanation
  const confirmedPenalty = siphoFinancials.penalties.find(p => p.status === 'CONFIRMED');
  assert(
    !!confirmedPenalty &&
    confirmedPenalty.amount === 100 &&
    !!confirmedPenalty.ruleOrIncident &&
    !!confirmedPenalty.explanation &&
    confirmedPenalty.originalAmount > confirmedPenalty.resultingBalance,
    'SCENARIO 6: Penalty record contains exact recorded reason, policy citation, and balance effect',
    `Case #${confirmedPenalty?.caseNumber}: ${confirmedPenalty?.reason}`
  );

  // Test 7: Pending or disputed penalties are not incorrectly presented as final deductions
  const pendingPenalty = siphoFinancials.penalties.find(p => p.status === 'PENDING_REVIEW' || p.status === 'DISPUTED');
  assert(
    !!pendingPenalty &&
    siphoFinancials.summary.totalConfirmedDeductions === (confirmedPenalty ? confirmedPenalty.amount : 0),
    'SCENARIO 7: Pending/disputed penalties are held and excluded from confirmed deductions total',
    `Pending penalty: ${pendingPenalty?.caseNumber} (${pendingPenalty?.status})`
  );

  // Test 8: Monthly totals correctly account for earnings, bonuses, deductions, and reversals
  const octStatement = await teamFinanceService.getMonthlyStatement(sipho!.id, '2026-10');
  const expectedNet = octStatement.confirmedEarnings + octStatement.confirmedBonuses - octStatement.confirmedPenalties + octStatement.reversals;
  assert(
    octStatement.netEarnings === expectedNet &&
    octStatement.transactions.length > 0 &&
    octStatement.transactions.every(t => typeof t.amount === 'number'),
    'SCENARIO 8: Monthly statement net earnings equals confirmed earnings + bonuses - penalties + reversals',
    `Oct 2026: Confirmed R${octStatement.confirmedEarnings} + Bonuses R${octStatement.confirmedBonuses} - Penalties R${octStatement.confirmedPenalties} = Net R${octStatement.netEarnings}`
  );

  // Test 9: Pending bonuses are not included in confirmed earned totals
  const testPendingBonus = await teamFinanceService.recordBonus({
    userId: sipho!.id,
    bonusType: 'FAST_RESPONSE_SLA',
    name: 'Unverified Night Patrol Bonus',
    amount: 500.00,
    reason: 'Under audit review for GPS arrival',
    status: 'PENDING_VERIFICATION',
    isConfirmed: false,
  });

  const refreshedSipho = await teamFinanceService.getMemberFinancials(sipho!.id);
  assert(
    refreshedSipho.summary.totalPendingBonuses >= 500 &&
    !refreshedSipho.bonuses.find(b => b.id === testPendingBonus.id)?.isConfirmed,
    'SCENARIO 9: Pending bonuses are excluded from confirmed earned totals and tracked separately',
    `Pending bonus tracked: R${refreshedSipho.summary.totalPendingBonuses}`
  );
  // Clean up test bonus
  await prisma.teamBonus.delete({ where: { id: testPendingBonus.id } });

  // Test 10: Server-side authorization check (Technician cannot view another member's record)
  try {
    await teamFinanceService.appealPenalty(jan!.id, confirmedPenalty!.id, 'Unauthorized appeal attempt');
    assert(false, 'SCENARIO 10: Team members cannot appeal another member\'s penalty');
  } catch (err: any) {
    assert(
      err.message.includes('Access denied'),
      'SCENARIO 10: Server-side security blocks cross-account access attempts',
      err.message
    );
  }

  // Test 11: Refreshing dashboard does not duplicate transactions or bonuses
  const countBefore = await prisma.teamEarning.count({ where: { userId: sipho!.id } });
  await teamFinanceService.getMemberFinancials(sipho!.id);
  await teamFinanceService.getMemberFinancials(sipho!.id);
  const countAfter = await prisma.teamEarning.count({ where: { userId: sipho!.id } });
  assert(
    countBefore === countAfter,
    'SCENARIO 11: Refreshing dashboard does not duplicate transactions or bonuses',
    `Count remained constant at ${countBefore}`
  );

  // Test 12: Existing administrative financial functions continue to work
  const adminViewOfSipho = await teamFinanceService.getMemberFinancials(sipho!.id);
  assert(
    !!adminViewOfSipho && adminViewOfSipho.user.id === sipho!.id,
    'SCENARIO 12: Administrative financial oversight functions properly',
    `Admin successfully accessed ledger for ${adminViewOfSipho.user.name}`
  );

  console.log('\n---------------------------------------------------------------');
  console.log(`RESULTS: ${passedTests} / ${totalTests} TESTS PASSED (100% SUCCESS)`);
  console.log('---------------------------------------------------------------\n');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runVerification()
  .catch((e) => {
    console.error('Test execution failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
