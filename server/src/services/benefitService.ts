import { prisma } from '../config/db';
import { getPlanById, MEMBERSHIP_PLANS } from '../config/plans';
import { writeAuditLog } from '../middleware/auditLog';

export interface BenefitSummary {
  membershipId: string;
  planId: string;
  planName: string;
  monthlyPrice: number;
  annualBenefit: number;
  isPartsBenefitZero: boolean;
  partsBenefitDescription: string;
  usedBenefit: number;
  remainingBenefit: number;
  usagePercentage: number;
  remainingPercentage: number;
  benefitYearStart: string;
  benefitYearEnd: string;
  status: string;
  claimsCount: number;
  invoicesCount: number;
  transactions: any[];
}

/**
 * Retrieves the customer's active membership or initializes a default active membership if none exists.
 */
export async function getOrCreateActiveMembership(userId: string, requestedPlanId?: string) {
  let membership = await prisma.membership.findFirst({
    where: { userId, status: 'Active' },
    orderBy: { createdAt: 'desc' },
    include: {
      benefitTransactions: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!membership) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const planKey = requestedPlanId || (user.package ? user.package.toLowerCase().replace(/[\s-]/g, '_') : 'assist_plus');
    const plan = getPlanById(planKey);

    const now = new Date();
    const oneYearLater = new Date(now);
    oneYearLater.setFullYear(now.getFullYear() + 1);

    membership = await prisma.membership.create({
      data: {
        userId,
        planId: plan.id,
        planName: plan.name,
        monthlyPrice: plan.monthlyPrice,
        annualBenefit: plan.annualBenefit,
        benefitYearStart: now,
        benefitYearEnd: oneYearLater,
        status: 'Active',
        benefitTransactions: {
          create: {
            userId,
            reference: 'OPENING-' + now.getFullYear(),
            description: `Annual Benefit Allocation (${plan.name})`,
            credit: plan.annualBenefit,
            debit: 0,
            balance: plan.annualBenefit,
            date: now,
          },
        },
      },
      include: {
        benefitTransactions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    await writeAuditLog({
      userId,
      userType: user.role,
      action: 'Membership Activated',
      details: `Active membership for plan ${plan.name} initialized with annual benefit allowance of R${plan.annualBenefit.toLocaleString()}`,
      newValue: {
        membershipId: membership.id,
        planId: plan.id,
        annualBenefit: plan.annualBenefit,
      },
    });
  }

  return membership;
}

/**
 * Calculates complete live benefit statistics from the transactional ledger.
 */
export async function getMemberBenefitSummary(userId: string): Promise<BenefitSummary> {
  const membership = await getOrCreateActiveMembership(userId);

  const transactions = await prisma.benefitTransaction.findMany({
    where: { membershipId: membership.id },
    orderBy: { date: 'desc' },
    include: {
      claim: { select: { id: true, claimNumber: true, serviceType: true, status: true } },
      invoice: { select: { id: true, invoiceNumber: true, total: true, paymentStatus: true } },
    },
  });

  // Calculate used amount from debits within current benefit period
  const totalDebits = transactions.reduce((acc, t) => acc + (t.debit || 0), 0);
  const totalCredits = transactions.reduce((acc, t) => acc + (t.credit || 0), 0);

  const annualAllowance = membership.annualBenefit;
  const usedBenefit = totalDebits;
  const remainingBenefit = Math.max(0, annualAllowance - usedBenefit);

  const usagePercentage = annualAllowance > 0
    ? Math.min(100, parseFloat(((usedBenefit / annualAllowance) * 100).toFixed(2)))
    : 0;

  const remainingPercentage = annualAllowance > 0
    ? Math.max(0, parseFloat(((remainingBenefit / annualAllowance) * 100).toFixed(2)))
    : 0;

  const [claimsCount, invoicesCount] = await Promise.all([
    prisma.claim.count({ where: { userId } }),
    prisma.invoice.count({ where: { userId } }),
  ]);

  const plan = getPlanById(membership.planId);

  return {
    membershipId: membership.id,
    planId: membership.planId,
    planName: membership.planName,
    monthlyPrice: membership.monthlyPrice,
    annualBenefit: membership.annualBenefit,
    isPartsBenefitZero: membership.planId === 'assist' || membership.annualBenefit === 0,
    partsBenefitDescription: plan.partsBenefitDescription,
    usedBenefit,
    remainingBenefit,
    usagePercentage,
    remainingPercentage,
    benefitYearStart: membership.benefitYearStart.toISOString(),
    benefitYearEnd: membership.benefitYearEnd.toISOString(),
    status: membership.status,
    claimsCount,
    invoicesCount,
    transactions,
  };
}

/**
 * Calculates how much of a given service charge is covered by the member's annual benefit
 * vs how much must be paid out-of-pocket by the customer.
 */
export async function calculateBenefitCoverage(
  arg1:
    | string
    | {
        userId: string;
        totalServiceAmount?: number;
        amount?: number;
        totalAmount?: number;
        partsAmount?: number;
        labourAmount?: number;
      },
  arg2?: number,
  arg3?: { partsAmount?: number; labourAmount?: number }
) {
  let userId: string;
  let totalServiceAmount = 0;
  let partsAmount = 0;
  let labourAmount = 0;

  if (typeof arg1 === 'object') {
    userId = arg1.userId;
    totalServiceAmount = Number(arg1.totalServiceAmount ?? arg1.amount ?? arg1.totalAmount ?? 0);
    partsAmount = Number(arg1.partsAmount ?? 0);
    labourAmount = Number(arg1.labourAmount ?? 0);
  } else {
    userId = arg1;
    totalServiceAmount = Number(arg2 ?? 0);
    partsAmount = Number(arg3?.partsAmount ?? 0);
    labourAmount = Number(arg3?.labourAmount ?? 0);
  }

  const summary = await getMemberBenefitSummary(userId);

  // Assist R799: R0 Parts benefit
  if (summary.isPartsBenefitZero) {
    // Labour & fault finding are included; parts & replacements are on member's account
    const coveredLabour = labourAmount > 0 ? labourAmount : 0;
    const customerPayable = partsAmount > 0 ? partsAmount : totalServiceAmount;
    const amountCoveredByBenefit = 0; // monetary parts benefit is R0

    return {
      annualBenefit: 0,
      availableBenefit: 0,
      usedBenefit: 0,
      isPartsBenefitZero: true,
      coveredAmount: amountCoveredByBenefit,
      amountCoveredByBenefit,
      customerPayable,
      amountPayableByCustomer: customerPayable,
      exceededBy: customerPayable,
      coveredLabour,
      partsCustomerPayable: partsAmount,
      explanation: 'Assist Plan: Labour & fault finding included. Parts & replacements billed directly to member account (R0 parts benefit).',
    };
  }

  // Assist Plus, Pro, Elite, Residential, Business
  const availableBenefit = summary.remainingBenefit;
  const amountCoveredByBenefit = Math.min(totalServiceAmount, availableBenefit);
  const amountPayableByCustomer = Math.max(0, totalServiceAmount - amountCoveredByBenefit);

  return {
    annualBenefit: summary.annualBenefit,
    availableBenefit,
    usedBenefit: summary.usedBenefit,
    isPartsBenefitZero: false,
    coveredAmount: amountCoveredByBenefit,
    amountCoveredByBenefit,
    customerPayable: amountPayableByCustomer,
    amountPayableByCustomer,
    exceededBy: amountPayableByCustomer,
    exceedsBenefit: amountPayableByCustomer > 0,
    explanation:
      amountPayableByCustomer > 0
        ? `Service total (R${totalServiceAmount.toFixed(2)}) exceeds available annual benefit (R${availableBenefit.toFixed(2)}). R${amountCoveredByBenefit.toFixed(2)} covered by assistance benefit, remaining R${amountPayableByCustomer.toFixed(2)} payable by member.`
        : `Service total of R${totalServiceAmount.toFixed(2)} is 100% covered by your available annual assistance benefit. Customer payable: R0.00.`,
  };
}

/**
 * Records a benefit transaction deduction and updates running ledger balance.
 */
export async function deductFromBenefit(params: {
  userId: string;
  amountToDeduct?: number;
  amount?: number;
  description: string;
  reference: string;
  claimId?: string;
  invoiceId?: string;
  isOverride?: boolean;
  adminOverride?: boolean;
  overrideReason?: string;
  actorId?: string;
  actorRole?: string;
}) {
  const {
    userId,
    description,
    reference,
    claimId,
    invoiceId,
    overrideReason,
    actorId,
    actorRole = 'System',
  } = params;

  const amountToDeduct = Number(params.amountToDeduct ?? params.amount ?? 0);
  const adminOverride = Boolean(params.adminOverride ?? params.isOverride ?? false);

  if (amountToDeduct <= 0) {
    return {
      remainingBenefit: 0,
      usedBenefit: 0,
      transaction: null as any,
    };
  }

  const membership = await getOrCreateActiveMembership(userId);
  const summary = await getMemberBenefitSummary(userId);

  // Assist plan check
  if (summary.isPartsBenefitZero && !adminOverride) {
    throw new Error('Assist plan has R0 parts benefit. Cannot deduct benefit allowance unless authorised by administrative override.');
  }

  // Enforce annual benefit limit
  if (amountToDeduct > summary.remainingBenefit && !adminOverride) {
    throw new Error(
      `Benefit limit exceeded. Requested deduction R${amountToDeduct.toFixed(2)} exceeds remaining annual allowance of R${summary.remainingBenefit.toFixed(2)}. Administrative override required.`
    );
  }

  const previousBalance = summary.remainingBenefit;
  const newBalance = Math.max(0, previousBalance - amountToDeduct);

  const transaction = await prisma.benefitTransaction.create({
    data: {
      membershipId: membership.id,
      userId,
      claimId,
      invoiceId,
      date: new Date(),
      reference,
      description: adminOverride ? `${description} [ADMIN OVERRIDE: ${overrideReason || 'Approved'}]` : description,
      debit: amountToDeduct,
      credit: 0,
      balance: newBalance,
    },
  });

  await writeAuditLog({
    userId: actorId || userId,
    userType: actorRole,
    action: adminOverride ? 'Benefit Deduction (Admin Override)' : 'Benefit Deduction',
    details: `Deducted R${amountToDeduct.toLocaleString()} from annual assistance benefit for ${reference}. Running balance: R${newBalance.toLocaleString()}. Reason: ${description}`,
    newValue: { transactionId: transaction.id, remainingBenefit: newBalance, debit: amountToDeduct },
  });

  return {
    transaction: {
      ...transaction,
      notes: overrideReason || description,
    },
    remainingBenefit: newBalance,
    usedBenefit: summary.usedBenefit + amountToDeduct,
    membership,
  };
}

/**
 * Changes a customer's plan with historical tracking and audit logging.
 */
export async function changeCustomerPlan(
  arg1: string | { userId: string; newPlanId: string; actorId?: string; actorRole?: string; reason?: string },
  arg2?: string,
  arg3?: string,
  arg4?: string,
  arg5?: string
) {
  let userId: string;
  let newPlanId: string;
  let actorId = 'system';
  let actorRole = 'System';
  let reason = '';

  if (typeof arg1 === 'object') {
    userId = arg1.userId;
    newPlanId = arg1.newPlanId;
    actorId = arg1.actorId || 'system';
    actorRole = arg1.actorRole || 'System';
    reason = arg1.reason || '';
  } else {
    userId = arg1;
    newPlanId = arg2 || 'assist_plus';
    reason = arg3 || '';
    actorId = arg4 || 'system';
    actorRole = arg5 || 'System';
  }

  const newPlan = getPlanById(newPlanId);

  const currentMembership = await prisma.membership.findFirst({
    where: { userId, status: 'Active' },
    orderBy: { createdAt: 'desc' },
  });

  const previousPlanName = currentMembership ? currentMembership.planName : 'None';

  // Mark current as superseded
  if (currentMembership) {
    await prisma.membership.update({
      where: { id: currentMembership.id },
      data: { status: 'Superseded' },
    });
  }

  const now = new Date();
  const oneYearLater = new Date(now);
  oneYearLater.setFullYear(now.getFullYear() + 1);

  const newMembership = await prisma.membership.create({
    data: {
      userId,
      planId: newPlan.id,
      planName: newPlan.name,
      monthlyPrice: newPlan.monthlyPrice,
      annualBenefit: newPlan.annualBenefit,
      benefitYearStart: now,
      benefitYearEnd: oneYearLater,
      status: 'Active',
      benefitTransactions: {
        create: {
          userId,
          reference: `PLAN-CHG-${now.getFullYear()}`,
          description: `Plan Upgrade/Migration to ${newPlan.name}. Initial Annual Allowance R${newPlan.annualBenefit.toLocaleString()}`,
          credit: newPlan.annualBenefit,
          debit: 0,
          balance: newPlan.annualBenefit,
          date: now,
        },
      },
    },
    include: {
      benefitTransactions: true,
    },
  });

  // Update user package reference as well
  await prisma.user.update({
    where: { id: userId },
    data: {
      package: newPlan.name,
    },
  });

  await writeAuditLog({
    userId: actorId,
    userType: actorRole,
    action: 'Plan Changed',
    details: `Customer plan updated from ${previousPlanName} to ${newPlan.name} (R${newPlan.monthlyPrice}/mo, R${newPlan.annualBenefit.toLocaleString()} annual benefit). Reason: ${reason || 'Customer/Admin plan update'}`,
    previousValue: { plan: previousPlanName },
    newValue: { plan: newPlan.name, monthlyPrice: newPlan.monthlyPrice, annualBenefit: newPlan.annualBenefit },
  });

  return newMembership;
}

/**
 * Resets the benefit period for a customer, creating a new annual allowance cycle.
 */
export async function resetBenefitPeriod(userId: string, actorId = 'system', actorRole = 'System') {
  const current = await prisma.membership.findFirst({
    where: { userId, status: 'Active' },
    orderBy: { createdAt: 'desc' },
  });
  if (!current) throw new Error('Active membership not found');

  await prisma.membership.update({
    where: { id: current.id },
    data: { status: 'Expired' },
  });

  const now = new Date();
  const oneYearLater = new Date(now);
  oneYearLater.setFullYear(now.getFullYear() + 1);

  const newMembership = await prisma.membership.create({
    data: {
      userId,
      planId: current.planId,
      planName: current.planName,
      monthlyPrice: current.monthlyPrice,
      annualBenefit: current.annualBenefit,
      benefitYearStart: now,
      benefitYearEnd: oneYearLater,
      status: 'Active',
      benefitTransactions: {
        create: {
          userId,
          reference: `RENEWAL-${now.getFullYear()}`,
          description: `Annual Benefit Period Renewal (${current.planName})`,
          credit: current.annualBenefit,
          debit: 0,
          balance: current.annualBenefit,
          date: now,
        },
      },
    },
  });

  await writeAuditLog({
    userId: actorId,
    userType: actorRole,
    action: 'Benefit Period Reset',
    details: `Reset annual benefit period for customer ${userId}. Initial allowance R${current.annualBenefit.toLocaleString()}`,
    newValue: { membershipId: newMembership.id },
  });

  return getMemberBenefitSummary(userId);
}

