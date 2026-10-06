import React from 'react';
import { Shield, Check, AlertCircle, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { getPlan } from '../../data/plans';
import { calculatePaymentBreakdown } from '../../utils/paymentStructure';

interface PlanConfirmationStepProps {
  selectedPlanId: string;
  confirmed: boolean;
  onToggleConfirm: (confirmed: boolean) => void;
  onBackToPlans: () => void;
}

export function PlanConfirmationStep({
  selectedPlanId,
  confirmed,
  onToggleConfirm,
  onBackToPlans,
}: PlanConfirmationStepProps) {
  const plan = getPlan(selectedPlanId);
  const isAssistZero = plan.annualBenefit === 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="text-center space-y-1">
        <span className="text-[10px] font-mono font-bold text-red-500 uppercase tracking-widest">
          STEP CONFIRMATION BEFORE SUBSCRIPTION
        </span>
        <h3 className="text-2xl font-black text-white">Confirm Your Selected Plan</h3>
        <p className="text-xs text-slate-400">
          Please review and explicitly confirm your understanding of the monthly membership fee and annual assistance benefit.
        </p>
      </div>

      {/* Main Confirmation Card */}
      <div className="bg-slate-950 border-2 border-red-500/80 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-6">
          <div className="flex justify-between items-start border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Your Selected Plan
              </span>
              <h2 className="text-2xl font-black text-white tracking-wide uppercase font-brand-header mt-0.5">
                {plan.name}
              </h2>
            </div>
            <button
              type="button"
              onClick={onBackToPlans}
              className="text-xs text-red-400 hover:text-red-300 font-bold underline cursor-pointer"
            >
              Change Plan
            </button>
          </div>

          {/* Pricing & Benefit Dual Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Monthly Subscription */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Monthly Membership Subscription
              </span>
              <div className="text-2xl font-black font-mono text-white mt-1">
                R{plan.monthlyPrice.toLocaleString()}{' '}
                <span className="text-xs text-slate-400 font-normal">/ month</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                Recurring monthly fee for same-day dispatch and 24/7 incident response.
              </p>
            </div>

            {/* Annual Assistance Benefit */}
            <div
              className={`border rounded-2xl p-4 ${
                isAssistZero
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                  : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
              }`}
            >
              <span className="text-[10px] font-mono uppercase tracking-wider block text-slate-400">
                Annual Assistance Benefit
              </span>
              <div className="text-2xl font-black font-mono mt-1">
                {isAssistZero ? (
                  <span className="text-amber-400">R0 Parts Benefit</span>
                ) : (
                  <span className="text-emerald-400">R{plan.annualBenefit.toLocaleString()} / year</span>
                )}
              </div>
              <p className="text-[10px] mt-1 leading-snug text-slate-300">
                {isAssistZero
                  ? 'Monetary parts allowance is R0. Certified labour & fault finding are included.'
                  : `Maximum annual benefit pool available for repairs & parts during your 12-month membership.`}
              </p>
            </div>
          </div>

          {/* Explicit Customer Statement */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="text-xs text-slate-300 leading-relaxed font-medium">
              "You pay <strong className="text-white">R{plan.monthlyPrice.toLocaleString()} per month</strong> for your membership and have an annual assistance benefit of{' '}
              <strong className={isAssistZero ? 'text-amber-400' : 'text-emerald-400'}>
                {isAssistZero ? 'R0 Parts Benefit (Labour & Fault Finding Included)' : `up to R${plan.annualBenefit.toLocaleString()}`}
              </strong>."
            </div>
          </div>

          {/* YOUR PAYMENT SCHEDULE (Specification Section 9) */}
          {(() => {
            const bd = calculatePaymentBreakdown(plan.monthlyPrice);
            return (
              <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-2 border-red-500/40 rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-widest block">
                      ACTIVATION PAYMENT BREAKDOWN
                    </span>
                    <h3 className="text-base font-black text-white uppercase tracking-wider font-brand-header">
                      YOUR PAYMENT SCHEDULE
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono bg-red-500/10 text-red-300 border border-red-500/30 px-2.5 py-1 rounded-full font-bold">
                    3-Stage Structure
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Initial 20% */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">
                      Initial Payment — 20%
                    </span>
                    <div className="text-lg font-black font-mono text-white mt-1">
                      R{bd.initialPayment.toFixed(2)}
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono mt-1 block">
                      Due Today (Onboarding)
                    </span>
                  </div>

                  {/* First Billing 40% */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">
                      First Billing — 40%
                    </span>
                    <div className="text-lg font-black font-mono text-white mt-1">
                      R{bd.firstBillingPayment.toFixed(2)}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                      Scheduled (25th of month)
                    </span>
                  </div>

                  {/* Second Billing 40% */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">
                      Second Billing — 40%
                    </span>
                    <div className="text-lg font-black font-mono text-white mt-1">
                      R{bd.secondBillingPayment.toFixed(2)}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                      Scheduled (+1 month)
                    </span>
                  </div>
                </div>

                {/* Total & Activation Milestone Warning */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-950 p-3.5 rounded-xl border border-slate-800 gap-2">
                  <div className="text-xs text-slate-300">
                    <span className="text-slate-400 font-mono">Total Activation Payments: </span>
                    <span className="font-mono font-bold text-white text-sm">R{bd.total.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-400 font-mono ml-2">(20% + 40% + 40% = 100%)</span>
                  </div>
                  <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md">
                    Activation Status: Pending Activation
                  </span>
                </div>

                {/* Explicit Requirement Callout */}
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 flex items-start gap-3 text-xs text-red-200">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold text-white block">
                      Crucial Membership Activation Notice:
                    </span>
                    <p className="leading-relaxed">
                      <strong>Your membership becomes ACTIVE after the second billing payment is successfully completed.</strong>{' '}
                      You will remain in <span className="font-mono text-amber-300">Pending Activation</span> status after paying the initial 20% and first 40%. Full plan assistance benefits and claims unlock exclusively once 100% of the activation structure is collected.
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Benefits Included */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              Benefits Included:
            </h4>
            <div className="space-y-2 text-xs">
              {plan.benefits.map((benefit, i) => (
                <div key={i} className="flex items-start gap-2 text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* What You Receive */}
          <div className="space-y-2 pt-3 border-t border-slate-800">
            <h4 className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              What You Receive:
            </h4>
            <div className="space-y-1.5 text-xs text-slate-300">
              {plan.whatYouReceive.map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Explicit Confirmation Checkbox */}
          <div className="pt-4 border-t border-slate-800">
            <label className="flex items-start gap-3 p-3.5 bg-slate-900/90 hover:bg-slate-900 border border-slate-800 rounded-xl cursor-pointer transition-all">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={e => onToggleConfirm(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded bg-slate-800 border-slate-700 text-red-600 focus:ring-0 cursor-pointer"
              />
              <div className="text-xs text-slate-300 leading-snug">
                <span className="font-bold text-white block mb-0.5">
                  I explicitly confirm that I understand this membership plan and payment schedule:
                </span>
                I acknowledge that the monthly subscription is{' '}
                <strong>R{plan.monthlyPrice.toLocaleString()}/month</strong>, the initial onboarding payment is{' '}
                <strong>20% (R{calculatePaymentBreakdown(plan.monthlyPrice).initialPayment.toFixed(2)})</strong>, followed by two 40% billing cycles, and my membership becomes <strong>ACTIVE only after the second billing payment is successfully completed</strong>.
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
