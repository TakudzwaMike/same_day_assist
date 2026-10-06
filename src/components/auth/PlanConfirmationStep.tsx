import React from 'react';
import { Shield, Check, AlertCircle, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { getPlan } from '../../data/plans';

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
                  I explicitly confirm that I understand this membership plan:
                </span>
                I acknowledge that the monthly subscription is{' '}
                <strong>R{plan.monthlyPrice.toLocaleString()}/month</strong> and the annual assistance benefit allowance is{' '}
                <strong className={isAssistZero ? 'text-amber-400' : 'text-emerald-400'}>
                  {plan.partsBenefitDescription}
                </strong>
                .
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
