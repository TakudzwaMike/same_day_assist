/**
 * Membership payment structure calculation utilities.
 * Uses integer cents to eliminate floating-point rounding errors.
 */

export interface PaymentBreakdown {
  monthlyPrice: number;
  initialPayment: number;       // 20%
  firstBillingPayment: number;  // 40%
  secondBillingPayment: number; // 40%
  total: number;
  initialPercentage: number;
  firstBillingPercentage: number;
  secondBillingPercentage: number;
}

export function calculatePaymentBreakdown(monthlyPrice: number): PaymentBreakdown {
  const monthlyCents = Math.round(monthlyPrice * 100);
  const initialCents = Math.round(monthlyCents * 0.20);
  const firstBillingCents = Math.round(monthlyCents * 0.40);
  // Ensure the sum of cents matches exactly 100% of the subscription cents
  const secondBillingCents = monthlyCents - initialCents - firstBillingCents;

  return {
    monthlyPrice,
    initialPayment: initialCents / 100,
    firstBillingPayment: firstBillingCents / 100,
    secondBillingPayment: secondBillingCents / 100,
    total: monthlyPrice,
    initialPercentage: 20,
    firstBillingPercentage: 40,
    secondBillingPercentage: 40,
  };
}

export function formatZAR(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount).replace('ZAR', 'R').trim();
}
