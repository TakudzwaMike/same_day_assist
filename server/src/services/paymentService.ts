import { prisma } from '../config/db';
import { getPlanById } from '../config/plans';
import { writeAuditLog } from '../middleware/auditLog';

export interface PaymentBreakdown {
  monthlyPrice: number;
  initialAmount: number;       // 20%
  firstBillingAmount: number;  // 40%
  secondBillingAmount: number; // 40%
  totalActivationAmount: number; // 100%
}

export interface BillingDates {
  startDate: Date;
  firstBillingDate: Date;
  secondBillingDate: Date;
  recurringBillingDate: Date;
}

/**
 * Calculates exact monetary decimal breakdown for 20% + 40% + 40% activation structure.
 * Uses integer cents to eliminate any currency floating-point errors.
 */
export function calculatePaymentBreakdown(monthlyPrice: number): PaymentBreakdown {
  const monthlyCents = Math.round(monthlyPrice * 100);
  const initialCents = Math.round(monthlyCents * 0.20);
  const firstBillingCents = Math.round(monthlyCents * 0.40);
  // Ensure the exact sum equals monthlyCents down to 1 cent
  const secondBillingCents = monthlyCents - initialCents - firstBillingCents;

  const initialAmount = initialCents / 100;
  const firstBillingAmount = firstBillingCents / 100;
  const secondBillingAmount = secondBillingCents / 100;

  return {
    monthlyPrice,
    initialAmount,
    firstBillingAmount,
    secondBillingAmount,
    totalActivationAmount: Number((initialAmount + firstBillingAmount + secondBillingAmount).toFixed(2)),
  };
}

/**
 * Calculates billing dates based on start date and billing day of month (default 25th).
 * If joined on or before the 20th, first billing is 25th of current month.
 * If joined after the 20th, first billing is 25th of next month.
 * Second billing is 1 month after first billing.
 * Handles month-end clamping cleanly (e.g. Feb 28/29, April 30).
 */
export function calculateBillingDates(startDate: Date = new Date(), billingDay = 25): BillingDates {
  const start = new Date(startDate);
  
  // Calculate first billing date
  let firstYear = start.getFullYear();
  let firstMonth = start.getMonth(); // 0-indexed

  if (start.getDate() > 20) {
    // Falls into next month
    firstMonth += 1;
    if (firstMonth > 11) {
      firstMonth = 0;
      firstYear += 1;
    }
  }

  const daysInFirstMonth = new Date(Date.UTC(firstYear, firstMonth + 1, 0)).getUTCDate();
  const clampedFirstDay = Math.min(billingDay, daysInFirstMonth);
  const firstBillingDate = new Date(Date.UTC(firstYear, firstMonth, clampedFirstDay, 12, 0, 0, 0));

  // Calculate second billing date (1 month after first billing date)
  let secondYear = firstYear;
  let secondMonth = firstMonth + 1;
  if (secondMonth > 11) {
    secondMonth = 0;
    secondYear += 1;
  }
  const daysInSecondMonth = new Date(Date.UTC(secondYear, secondMonth + 1, 0)).getUTCDate();
  const clampedSecondDay = Math.min(billingDay, daysInSecondMonth);
  const secondBillingDate = new Date(Date.UTC(secondYear, secondMonth, clampedSecondDay, 12, 0, 0, 0));

  // Calculate recurring billing date (1 month after second billing date)
  let recurYear = secondYear;
  let recurMonth = secondMonth + 1;
  if (recurMonth > 11) {
    recurMonth = 0;
    recurYear += 1;
  }
  const daysInRecurMonth = new Date(Date.UTC(recurYear, recurMonth + 1, 0)).getUTCDate();
  const clampedRecurDay = Math.min(billingDay, daysInRecurMonth);
  const recurringBillingDate = new Date(Date.UTC(recurYear, recurMonth, clampedRecurDay, 12, 0, 0, 0));

  return {
    startDate: start,
    firstBillingDate,
    secondBillingDate,
    recurringBillingDate,
  };
}

/**
 * Returns complete explanation schedule for any plan ID and start date.
 */
export function getPaymentScheduleForPlan(planId: string, startDate?: Date, billingDay = 25) {
  const plan = getPlanById(planId);
  const breakdown = calculatePaymentBreakdown(plan.monthlyPrice);
  const dates = calculateBillingDates(startDate || new Date(), billingDay);

  return {
    planId: plan.id,
    planName: plan.name,
    monthlySubscription: plan.monthlyPrice,
    annualAssistanceBenefit: plan.annualBenefit,
    isPartsBenefitZero: plan.isPartsBenefitZero,
    billingDay,
    breakdown,
    dates: {
      startDate: dates.startDate.toISOString(),
      firstBillingDate: dates.firstBillingDate.toISOString(),
      secondBillingDate: dates.secondBillingDate.toISOString(),
      recurringBillingDate: dates.recurringBillingDate.toISOString(),
    },
    stages: [
      {
        stage: 'INITIAL_20',
        name: 'Initial Activation Payment',
        percentage: 20,
        amount: breakdown.initialAmount,
        dueDate: dates.startDate.toISOString(),
        description: 'Initial 20% activation fee collected upon onboarding. Membership enters Pending Activation status.',
      },
      {
        stage: 'FIRST_BILLING_40',
        name: 'First Billing Payment',
        percentage: 40,
        amount: breakdown.firstBillingAmount,
        dueDate: dates.firstBillingDate.toISOString(),
        description: 'First 40% billing payment (60% total collected). Membership remains Pending Activation.',
      },
      {
        stage: 'SECOND_BILLING_40',
        name: 'Second Billing Payment (Activation)',
        percentage: 40,
        amount: breakdown.secondBillingAmount,
        dueDate: dates.secondBillingDate.toISOString(),
        description: 'Second 40% billing payment (100% total collected). Membership transitions to ACTIVE upon successful receipt.',
      },
      {
        stage: 'RECURRING_MONTHLY',
        name: 'Standard Monthly Subscription',
        percentage: 100,
        amount: plan.monthlyPrice,
        dueDate: dates.recurringBillingDate.toISOString(),
        description: 'Regular recurring monthly subscription billed on scheduled monthly billing date.',
      },
    ],
    activationRule: 'Your membership becomes ACTIVE after the second billing payment is successfully completed, bringing total activation payments to 100%. Annual assistance benefits unlock only once ACTIVE.',
  };
}

/**
 * Initializes a new customer membership with the 3-stage payment structure.
 * Sets status to 'Pending Activation' and creates initial payment & schedule.
 */
export async function initializeMembershipWithSchedule(params: {
  userId: string;
  planId: string;
  billingDay?: number;
  autoProcessInitial?: boolean;
  paymentMethod?: string;
  startDate?: Date;
}) {
  const {
    userId,
    planId,
    billingDay = 25,
    autoProcessInitial = true,
    paymentMethod = 'Card',
    startDate = new Date(),
  } = params;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const plan = getPlanById(planId);
  const breakdown = calculatePaymentBreakdown(plan.monthlyPrice);
  const dates = calculateBillingDates(startDate, billingDay);

  const oneYearLater = new Date(startDate);
  oneYearLater.setFullYear(startDate.getFullYear() + 1);

  // 1. Create or supersede any existing membership
  await prisma.membership.updateMany({
    where: { userId, status: { in: ['Active', 'Pending Activation'] } },
    data: { status: 'Superseded' },
  });

  const membership = await prisma.membership.create({
    data: {
      userId,
      planId: plan.id,
      planName: plan.name,
      monthlyPrice: plan.monthlyPrice,
      annualBenefit: plan.annualBenefit,
      benefitYearStart: startDate,
      benefitYearEnd: oneYearLater,
      status: 'Pending Activation', // Requirement 1 & 4: MUST be Pending Activation initially
      billingDayOfMonth: billingDay,
      startDate,
      firstBillingDate: dates.firstBillingDate,
      secondBillingDate: dates.secondBillingDate,
      nextBillingDate: dates.firstBillingDate,
      activationCycleComplete: false,
      totalActivationPaid: 0,
      activationPercentage: 0,
      benefitTransactions: {
        create: {
          userId,
          reference: `OPENING-${startDate.getFullYear()}`,
          description: `Annual Benefit Allocation (${plan.name}). Unlocks upon 100% activation payment.`,
          credit: plan.annualBenefit,
          debit: 0,
          balance: plan.annualBenefit,
          date: startDate,
        },
      },
    },
  });

  // 2. Create the Initial 20% Payment record
  const initialPayment = await prisma.payment.create({
    data: {
      customerId: user.id,
      customerName: user.name,
      membershipId: membership.id,
      paymentStage: 'INITIAL_20',
      type: `Initial 20% Activation Payment (${plan.name})`,
      amount: breakdown.initialAmount,
      status: 'Pending',
      paymentMethod,
      date: startDate.toISOString().slice(0, 10),
      dueDate: startDate,
      transactionRef: `ACT-20-${membership.id.slice(0, 8)}-${Date.now()}`,
    },
  });

  // 3. Pre-create the first scheduled invoice for the initial 20%
  const initialInvoice = await prisma.invoice.create({
    data: {
      invoiceNumber: `INV-ACT20-${Date.now().toString().slice(-6)}`,
      userId: user.id,
      membershipId: membership.id,
      customerName: user.name,
      customerEmail: user.email,
      customerAddress: user.address || 'Address on file',
      membershipPlan: plan.name,
      serviceRequested: `Membership Onboarding Initial 20% Activation Fee (${plan.name})`,
      parts: 0,
      labour: 0,
      otherCharges: breakdown.initialAmount,
      subtotal: breakdown.initialAmount,
      taxVat: Number((breakdown.initialAmount * 0.15).toFixed(2)),
      total: breakdown.initialAmount,
      amountCoveredByBenefit: 0,
      amountPayableByCustomer: breakdown.initialAmount,
      paymentStatus: 'Unpaid',
      invoiceStatus: 'Issued',
      notes: 'Initial 20% payment for membership activation cycle (Stage 1 of 3)',
    },
  });

  await prisma.payment.update({
    where: { id: initialPayment.id },
    data: { invoiceId: initialInvoice.id },
  });

  // 4. If autoProcessInitial is true, settle the initial 20% payment right away
  let processedPayment = initialPayment;
  if (autoProcessInitial) {
    const processRes = await processPayment({
      paymentId: initialPayment.id,
      status: 'Successful',
      gatewayReference: `GW-PAYFAST-INIT-${Date.now()}`,
      paymentMethod,
    });
    processedPayment = processRes.payment;
  }

  // Update user package reference
  await prisma.user.update({
    where: { id: userId },
    data: {
      package: plan.name,
      status: 'Onboarding', // User is Onboarding until membership activation completes
    },
  });

  await writeAuditLog({
    userId,
    userType: 'Customer',
    action: 'Plan Selected (Pending Activation)',
    details: `Customer ${user.name} selected ${plan.name} (R${plan.monthlyPrice}/mo). Initial 20% payment of R${breakdown.initialAmount} generated. Membership status: PENDING ACTIVATION.`,
    newValue: {
      membershipId: membership.id,
      plan: plan.name,
      status: 'Pending Activation',
      breakdown,
    },
  });

  return {
    membership: await prisma.membership.findUnique({ where: { id: membership.id } }),
    initialPayment: processedPayment,
    initialInvoice,
    schedule: getPaymentScheduleForPlan(planId, startDate, billingDay),
  };
}

/**
 * Server-side payment processor with strict idempotency and activation lifecycle management.
 */
export async function processPayment(params: {
  paymentId?: string;
  membershipId?: string;
  userId?: string;
  stage?: 'INITIAL_20' | 'FIRST_BILLING_40' | 'SECOND_BILLING_40' | 'RECURRING_MONTHLY' | string;
  amount?: number;
  status?: 'Successful' | 'Paid' | 'Failed' | 'Processing';
  gatewayReference?: string;
  paymentMethod?: string;
  failureReason?: string;
  transactionRef?: string;
  paidAt?: Date;
  actorId?: string;
  actorRole?: string;
}) {
  const {
    paymentId,
    membershipId,
    userId,
    stage,
    amount,
    status = 'Successful',
    gatewayReference,
    paymentMethod = 'Card',
    failureReason,
    transactionRef,
    paidAt,
    actorId = 'system',
    actorRole = 'System',
  } = params;

  let payment: any = null;

  if (paymentId) {
    payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { membership: true, invoice: true, customer: true },
    });
  } else if (transactionRef) {
    payment = await prisma.payment.findUnique({
      where: { transactionRef },
      include: { membership: true, invoice: true, customer: true },
    });
  }

  if (!payment && membershipId && stage) {
    payment = await prisma.payment.findFirst({
      where: { membershipId, paymentStage: stage },
      include: { membership: true, invoice: true, customer: true },
    });
  }

  // If payment does not exist yet for this stage, dynamically create it
  if (!payment && membershipId && stage) {
    const mem = await prisma.membership.findUnique({ where: { id: membershipId } });
    if (!mem) throw new Error('Associated membership record not found');
    const uId = userId || mem.userId;
    const user = await prisma.user.findUnique({ where: { id: uId } });
    const breakdown = calculatePaymentBreakdown(mem.monthlyPrice);

    let stageAmount = amount;
    if (!stageAmount) {
      if (stage === 'INITIAL_20') stageAmount = breakdown.initialAmount;
      else if (stage === 'FIRST_BILLING_40') stageAmount = breakdown.firstBillingAmount;
      else if (stage === 'SECOND_BILLING_40') stageAmount = breakdown.secondBillingAmount;
      else stageAmount = mem.monthlyPrice;
    }

    const typeDesc =
      stage === 'INITIAL_20' ? 'Initial 20% Membership Payment' :
      stage === 'FIRST_BILLING_40' ? 'First 40% Billing Payment' :
      stage === 'SECOND_BILLING_40' ? 'Second 40% Activation Payment' :
      'Monthly Membership Subscription';

    const pDate = paidAt || new Date();

    payment = await prisma.payment.create({
      data: {
        customerId: uId,
        customerName: user?.name || 'Customer',
        membershipId,
        paymentStage: stage,
        type: typeDesc,
        amount: stageAmount,
        status: status === 'Failed' ? 'Failed' : 'Pending',
        transactionRef: transactionRef || `TXN-${stage}-${Date.now()}`,
        paymentMethod,
        date: pDate.toISOString().split('T')[0],
        dueDate: pDate,
        failureReason: status === 'Failed' ? failureReason : null,
      },
      include: { membership: true, invoice: true, customer: true },
    });
  }

  if (!payment) throw new Error('Payment record not found');

  // Requirement 23: Idempotency Protection
  if (payment.status === 'Successful' || payment.status === 'Paid') {
    return {
      success: true,
      alreadyProcessed: true,
      payment,
      membership: payment.membership,
      message: 'Payment has already been successfully processed (idempotent)',
    };
  }

  const membership = payment.membership;
  if (!membership) throw new Error('Associated membership record not found');

  const now = paidAt || new Date();
  const plan = getPlanById(membership.planId);
  const breakdown = calculatePaymentBreakdown(membership.monthlyPrice);

  if (status === 'Failed') {
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'Failed',
        failureReason: failureReason || 'Gateway transaction declined',
        retryCount: (payment.retryCount || 0) + 1,
      },
    });

    // Update membership status if not active
    if (membership.status !== 'Active') {
      await prisma.membership.update({
        where: { id: membership.id },
        data: { status: 'Payment Due' },
      });
    }

    await writeAuditLog({
      userId: payment.customerId || actorId,
      userType: actorRole,
      action: 'Payment Failed',
      details: `Payment ${payment.type} (R${payment.amount}) failed. Reason: ${failureReason || 'Declined'}. Retry count: ${updatedPayment.retryCount}`,
      newValue: { paymentId: payment.id, status: 'Failed', failureReason },
    });

    return {
      success: false,
      alreadyProcessed: false,
      payment: updatedPayment,
      membership: await prisma.membership.findUnique({ where: { id: membership.id } }),
      message: `Payment failed: ${failureReason || 'Declined'}`,
    };
  }

  // --- SUCCESSFUL PAYMENT PROCESSING ---
  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'Successful',
      paidAt: now,
      paymentMethod,
      gatewayReference: gatewayReference || `GW-${Date.now()}`,
      transactionRef: transactionRef || payment.transactionRef || `TXN-${Date.now()}`,
    },
  });

  // Mark linked invoice as settled if present
  if (payment.invoiceId) {
    await prisma.invoice.update({
      where: { id: payment.invoiceId },
      data: {
        paymentStatus: 'Paid',
        invoiceStatus: 'Settled',
        paidAt: now,
        paymentMethod,
      },
    });
  }

  let newStatus = membership.status;
  let newPercentage = membership.activationPercentage;
  let newTotalPaid = membership.totalActivationPaid;
  let nextBilling = membership.nextBillingDate;
  let isActivationComplete = membership.activationCycleComplete;
  let activationDate = membership.activationDate;

  // Handle stage transitions
  if (payment.paymentStage === 'INITIAL_20') {
    newTotalPaid = breakdown.initialAmount;
    newPercentage = 20;
    newStatus = 'Pending Activation'; // Must remain Pending Activation
    nextBilling = membership.firstBillingDate;

    // Pre-create the upcoming First Billing (40%) payment record
    const existingNext = await prisma.payment.findFirst({
      where: { membershipId: membership.id, paymentStage: 'FIRST_BILLING_40' },
    });

    if (!existingNext && membership.firstBillingDate) {
      await prisma.payment.create({
        data: {
          customerId: payment.customerId,
          customerName: payment.customerName,
          membershipId: membership.id,
          paymentStage: 'FIRST_BILLING_40',
          type: `First 40% Billing Payment (${membership.planName})`,
          amount: breakdown.firstBillingAmount,
          status: 'Pending',
          date: membership.firstBillingDate.toISOString().slice(0, 10),
          dueDate: membership.firstBillingDate,
          transactionRef: `ACT-40A-${membership.id.slice(0, 8)}-${Date.now()}`,
        },
      });
    }

    await writeAuditLog({
      userId: payment.customerId || actorId,
      userType: actorRole,
      action: 'Initial 20% Payment Successful',
      details: `Collected R${payment.amount} (20% of monthly subscription). Total collected: R${newTotalPaid}. Status: PENDING ACTIVATION.`,
      newValue: { paymentId, status: newStatus, activationPercentage: newPercentage },
    });
  } else if (payment.paymentStage === 'FIRST_BILLING_40') {
    newTotalPaid = Number((membership.totalActivationPaid + payment.amount).toFixed(2));
    newPercentage = 60;
    newStatus = 'Pending Activation'; // Requirement 2 & 4: MUST STILL BE PENDING ACTIVATION (60% only)
    nextBilling = membership.secondBillingDate;

    // Pre-create the upcoming Second Billing (40%) payment record
    const existingNext = await prisma.payment.findFirst({
      where: { membershipId: membership.id, paymentStage: 'SECOND_BILLING_40' },
    });

    if (!existingNext && membership.secondBillingDate) {
      await prisma.payment.create({
        data: {
          customerId: payment.customerId,
          customerName: payment.customerName,
          membershipId: membership.id,
          paymentStage: 'SECOND_BILLING_40',
          type: `Second 40% Activation Billing Payment (${membership.planName})`,
          amount: breakdown.secondBillingAmount,
          status: 'Pending',
          date: membership.secondBillingDate.toISOString().slice(0, 10),
          dueDate: membership.secondBillingDate,
          transactionRef: `ACT-40B-${membership.id.slice(0, 8)}-${Date.now()}`,
        },
      });
    }

    await writeAuditLog({
      userId: payment.customerId || actorId,
      userType: actorRole,
      action: 'First 40% Billing Payment Successful',
      details: `Collected R${payment.amount} (40% first billing). Total collected: R${newTotalPaid} (60%). Status: PENDING ACTIVATION.`,
      newValue: { paymentId, status: newStatus, activationPercentage: newPercentage },
    });
  } else if (payment.paymentStage === 'SECOND_BILLING_40') {
    // Requirement 3 & 4: 100% COLLECTED -> MEMBERSHIP TRANSITIONS TO ACTIVE!
    newTotalPaid = Number((membership.totalActivationPaid + payment.amount).toFixed(2));
    newPercentage = 100;
    newStatus = 'Active';
    isActivationComplete = true;
    activationDate = now;

    // Calculate next recurring billing date (1 month after second billing)
    const dates = calculateBillingDates(membership.secondBillingDate || now, membership.billingDayOfMonth);
    nextBilling = dates.recurringBillingDate;

    // Update User model to Active Member
    if (payment.customerId) {
      await prisma.user.update({
        where: { id: payment.customerId },
        data: {
          status: 'Active Member',
          memberSince: now.toISOString().slice(0, 10),
          totalPaid: { increment: payment.amount },
        },
      });
    }

    // Pre-create the next recurring monthly payment record
    await prisma.payment.create({
      data: {
        customerId: payment.customerId,
        customerName: payment.customerName,
        membershipId: membership.id,
        paymentStage: 'RECURRING_MONTHLY',
        type: `Monthly Membership Subscription (${membership.planName})`,
        amount: membership.monthlyPrice,
        status: 'Pending',
        date: nextBilling.toISOString().slice(0, 10),
        dueDate: nextBilling,
        transactionRef: `REC-${membership.id.slice(0, 8)}-${Date.now()}`,
      },
    });

    await writeAuditLog({
      userId: payment.customerId || actorId,
      userType: actorRole,
      action: 'Membership Activated',
      details: `Second 40% payment of R${payment.amount} successful. Total activation payments collected: R${newTotalPaid} (100%). Membership is now ACTIVE.`,
      newValue: {
        membershipId: membership.id,
        status: 'Active',
        activationDate: now,
        activationPercentage: 100,
      },
    });
  } else if (payment.paymentStage === 'RECURRING_MONTHLY') {
    // Normal recurring subscription payment after activation
    newStatus = 'Active';
    const dates = calculateBillingDates(payment.dueDate || now, membership.billingDayOfMonth);
    nextBilling = dates.recurringBillingDate;

    if (payment.customerId) {
      await prisma.user.update({
        where: { id: payment.customerId },
        data: { totalPaid: { increment: payment.amount } },
      });
    }

    // Pre-create next month's recurring payment record
    await prisma.payment.create({
      data: {
        customerId: payment.customerId,
        customerName: payment.customerName,
        membershipId: membership.id,
        paymentStage: 'RECURRING_MONTHLY',
        type: `Monthly Membership Subscription (${membership.planName})`,
        amount: membership.monthlyPrice,
        status: 'Pending',
        date: nextBilling.toISOString().slice(0, 10),
        dueDate: nextBilling,
        transactionRef: `REC-${membership.id.slice(0, 8)}-${Date.now()}`,
      },
    });

    await writeAuditLog({
      userId: payment.customerId || actorId,
      userType: actorRole,
      action: 'Monthly Subscription Payment Successful',
      details: `Collected normal monthly subscription of R${payment.amount} for ${membership.planName}. Next billing date: ${nextBilling.toISOString().slice(0, 10)}.`,
      newValue: { paymentId, nextBillingDate: nextBilling },
    });
  }

  // Update membership entity with new stats
  const updatedMembership = await prisma.membership.update({
    where: { id: membership.id },
    data: {
      status: newStatus,
      activationPercentage: newPercentage,
      totalActivationPaid: newTotalPaid,
      nextBillingDate: nextBilling,
      activationCycleComplete: isActivationComplete,
      activationDate,
    },
  });

  return {
    success: true,
    alreadyProcessed: false,
    payment: updatedPayment,
    membership: updatedMembership,
    message: newStatus === 'Active' && membership.status !== 'Active'
      ? 'Membership successfully activated! All plan benefits are now available.'
      : `Payment successful. Current status: ${newStatus} (${newPercentage}% collected)`,
  };
}

/**
 * Retries a previously failed payment.
 */
export async function retryPayment(paymentId: string, gatewayReference?: string, paymentMethod = 'Card') {
  return processPayment({
    paymentId,
    status: 'Successful',
    gatewayReference: gatewayReference || `GW-RETRY-${Date.now()}`,
    paymentMethod,
    transactionRef: `RETRY-${paymentId.slice(0, 8)}-${Date.now()}`,
  });
}

/**
 * Returns complete visual payment timeline for customer portal or admin dashboard.
 */
export async function getMembershipPaymentTimeline(userId: string) {
  const membership = await prisma.membership.findFirst({
    where: { userId, status: { in: ['Active', 'Pending Activation', 'Payment Due'] } },
    orderBy: { createdAt: 'desc' },
    include: {
      payments: {
        orderBy: { createdAt: 'asc' },
        include: { invoice: { select: { id: true, invoiceNumber: true } } },
      },
    },
  });

  if (!membership) {
    // Return empty timeline if user has no membership
    return null;
  }

  const breakdown = calculatePaymentBreakdown(membership.monthlyPrice);
  const plan = getPlanById(membership.planId);

  // Group payments
  const initial20 = membership.payments.find(p => p.paymentStage === 'INITIAL_20');
  const firstBilling40 = membership.payments.find(p => p.paymentStage === 'FIRST_BILLING_40');
  const secondBilling40 = membership.payments.find(p => p.paymentStage === 'SECOND_BILLING_40');
  const recurringPayments = membership.payments.filter(p => p.paymentStage === 'RECURRING_MONTHLY');

  // Next scheduled payment
  const pendingPayment = membership.payments.find(p => p.status === 'Pending' || p.status === 'Failed');

  const isActive = membership.status === 'Active';
  const totalCollected = membership.totalActivationPaid;
  const outstandingActivation = Math.max(0, Number((breakdown.totalActivationAmount - totalCollected).toFixed(2)));

  return {
    membershipId: membership.id,
    planId: membership.planId,
    planName: membership.planName,
    monthlySubscription: membership.monthlyPrice,
    monthlyPrice: membership.monthlyPrice,
    annualAssistanceBenefit: membership.annualBenefit,
    status: membership.status,
    membershipStatus: membership.status,
    isActive,
    isEligibleForBenefits: isActive, // Requirement 26: Benefits only available when ACTIVE
    activationPercentage: membership.activationPercentage,
    totalActivationPaid: membership.totalActivationPaid,
    totalCollected: membership.totalActivationPaid,
    outstandingActivation,
    activationCycleComplete: membership.activationCycleComplete,
    activationDate: membership.activationDate ? membership.activationDate.toISOString() : null,
    billingDayOfMonth: membership.billingDayOfMonth,
    dates: {
      startDate: membership.startDate.toISOString(),
      firstBillingDate: membership.firstBillingDate ? membership.firstBillingDate.toISOString() : null,
      secondBillingDate: membership.secondBillingDate ? membership.secondBillingDate.toISOString() : null,
      activationDate: membership.activationDate ? membership.activationDate.toISOString() : null,
      nextBillingDate: membership.nextBillingDate ? membership.nextBillingDate.toISOString() : null,
    },
    breakdown,
    activationTimeline: [
      {
        stage: 'INITIAL_20',
        title: 'Initial Payment',
        percentage: '20%',
        amount: breakdown.initialAmount,
        dueDate: membership.startDate.toISOString().slice(0, 10),
        status: initial20 ? initial20.status : 'Pending',
        paidAt: initial20?.paidAt ? initial20.paidAt.toISOString() : null,
        paymentId: initial20?.id || null,
        invoiceNumber: initial20?.invoice?.invoiceNumber || null,
        isCompleted: initial20?.status === 'Successful' || initial20?.status === 'Paid',
      },
      {
        stage: 'FIRST_BILLING_40',
        title: 'First Billing',
        percentage: '40%',
        amount: breakdown.firstBillingAmount,
        dueDate: membership.firstBillingDate ? membership.firstBillingDate.toISOString().slice(0, 10) : 'Pending Date',
        status: firstBilling40 ? firstBilling40.status : 'Scheduled',
        paidAt: firstBilling40?.paidAt ? firstBilling40.paidAt.toISOString() : null,
        paymentId: firstBilling40?.id || null,
        invoiceNumber: firstBilling40?.invoice?.invoiceNumber || null,
        isCompleted: firstBilling40?.status === 'Successful' || firstBilling40?.status === 'Paid',
      },
      {
        stage: 'SECOND_BILLING_40',
        title: 'Second Billing (Activation)',
        percentage: '40%',
        amount: breakdown.secondBillingAmount,
        dueDate: membership.secondBillingDate ? membership.secondBillingDate.toISOString().slice(0, 10) : 'Pending Date',
        status: secondBilling40 ? secondBilling40.status : 'Scheduled',
        paidAt: secondBilling40?.paidAt ? secondBilling40.paidAt.toISOString() : null,
        paymentId: secondBilling40?.id || null,
        invoiceNumber: secondBilling40?.invoice?.invoiceNumber || null,
        isCompleted: secondBilling40?.status === 'Successful' || secondBilling40?.status === 'Paid',
      },
    ],
    timelineSteps: [
      {
        stage: 'INITIAL_20',
        description: 'Initial Payment',
        percentage: 20,
        amount: breakdown.initialAmount,
        date: membership.startDate ? membership.startDate.toISOString() : null,
        status: initial20 ? initial20.status : 'Pending',
        isPaid: initial20?.status === 'Successful' || initial20?.status === 'Paid',
      },
      {
        stage: 'FIRST_BILLING_40',
        description: 'First Billing',
        percentage: 40,
        amount: breakdown.firstBillingAmount,
        date: membership.firstBillingDate ? membership.firstBillingDate.toISOString() : null,
        status: firstBilling40 ? firstBilling40.status : 'Scheduled',
        isPaid: firstBilling40?.status === 'Successful' || firstBilling40?.status === 'Paid',
      },
      {
        stage: 'SECOND_BILLING_40',
        description: 'Second Billing (Activation)',
        percentage: 40,
        amount: breakdown.secondBillingAmount,
        date: membership.secondBillingDate ? membership.secondBillingDate.toISOString() : null,
        status: secondBilling40 ? secondBilling40.status : 'Scheduled',
        isPaid: secondBilling40?.status === 'Successful' || secondBilling40?.status === 'Paid',
      },
    ],
    nextPayment: pendingPayment
      ? {
          id: pendingPayment.id,
          stage: pendingPayment.paymentStage,
          description: pendingPayment.type,
          amount: pendingPayment.amount,
          dueDate: pendingPayment.dueDate ? pendingPayment.dueDate.toISOString().slice(0, 10) : pendingPayment.date,
          status: pendingPayment.status,
          failureReason: pendingPayment.failureReason,
        }
      : null,
    nextScheduledPayment: pendingPayment
      ? {
          id: pendingPayment.id,
          stage: pendingPayment.paymentStage,
          type: pendingPayment.type,
          amount: pendingPayment.amount,
          dueDate: pendingPayment.dueDate ? pendingPayment.dueDate.toISOString().slice(0, 10) : pendingPayment.date,
          status: pendingPayment.status,
          failureReason: pendingPayment.failureReason,
        }
      : null,
    payments: membership.payments,
    allPayments: membership.payments,
    recurringPayments,
  };
}
