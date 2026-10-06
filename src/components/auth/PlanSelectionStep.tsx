import React, { useState } from 'react';
import { Check, Shield, AlertTriangle, ArrowRight, Zap, Star, Info, HelpCircle } from 'lucide-react';
import { MEMBERSHIP_PLANS, MembershipPlan } from '../../data/plans';
import { calculatePaymentBreakdown } from '../../utils/paymentStructure';

interface PlanSelectionStepProps {
  selectedPlanId: string;
  onSelectPlan: (planId: string) => void;
  accountType?: string;
}

export function PlanSelectionStep({ selectedPlanId, onSelectPlan, accountType }: PlanSelectionStepProps) {
  const [showComparisonTable, setShowComparisonTable] = useState(false);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Banner */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-red-500 uppercase tracking-widest">
              <Shield className="w-4 h-4 text-red-500" />
              <span>OFFICIAL SAME DAY ASSIST MEMBERSHIP PLANS</span>
            </div>
            <h3 className="text-xl font-black text-white mt-1">Select Your Membership Plan</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Compare monthly subscription rates and annual assistance benefits. You pay your monthly membership subscription to maintain rapid dispatch coverage, with an annual assistance benefit available for repairs, parts, and emergencies.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowComparisonTable(!showComparisonTable)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 rounded-xl transition-all cursor-pointer shrink-0"
          >
            {showComparisonTable ? 'Hide Comparison Table' : 'Compare All 6 Plans'}
          </button>
        </div>
      </div>

      {/* Distinction Reminder Callout */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 flex items-start gap-3 text-xs text-amber-200">
        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5 leading-relaxed">
          <span className="font-bold text-amber-300">Understanding Your Plan:</span>{' '}
          Your <strong>Monthly Membership</strong> (e.g. R1,499/mo) is your recurring subscription fee for 24/7 same-day assistance. Your <strong>Annual Assistance Benefit</strong> (e.g. R15,000/yr) is the maximum coverage allowance available per membership year for repairs and replacements.
        </div>
      </div>

      {/* Comparison Table Toggle */}
      {showComparisonTable && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 overflow-x-auto shadow-2xl animate-fadeIn">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-3">
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Quick Plan Comparison Matrix
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">6 Plans Available</span>
          </div>
          <table className="w-full text-xs text-left min-w-[620px]">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase">
                <th className="py-2.5 px-3">Plan</th>
                <th className="py-2.5 px-3">Monthly Subscription</th>
                <th className="py-2.5 px-3">Annual Assistance Benefit</th>
                <th className="py-2.5 px-3">Parts Coverage</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {MEMBERSHIP_PLANS.map(plan => {
                const isSelected = selectedPlanId === plan.id;
                return (
                  <tr
                    key={plan.id}
                    className={`transition-colors ${
                      isSelected ? 'bg-red-600/10 text-white font-semibold' : 'text-slate-300 hover:bg-slate-900/60'
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="font-bold text-white">{plan.name}</div>
                      <span className="text-[9.5px] text-slate-500 font-mono">{plan.badge}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-white">
                      R{plan.monthlyPrice.toLocaleString()} <span className="text-slate-400 text-[10px]">/ month</span>
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {plan.annualBenefit === 0 ? (
                        <span className="text-amber-400 font-bold">R0 Parts Benefit</span>
                      ) : (
                        <span className="text-emerald-400 font-bold">R{plan.annualBenefit.toLocaleString()} / year</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-400">
                      {plan.annualBenefit === 0
                        ? "Labour covered; parts on member's account"
                        : `Repairs & replacements up to R${plan.annualBenefit.toLocaleString()}/yr`}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectPlan(plan.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-red-600 text-white shadow-md'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                        }`}
                      >
                        {isSelected ? '✓ Selected' : 'Select'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Plan Cards Grid (All 6 Plans) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MEMBERSHIP_PLANS.map(plan => {
          const isSelected = selectedPlanId === plan.id;
          const isAssistZero = plan.annualBenefit === 0;

          return (
            <div
              key={plan.id}
              onClick={() => onSelectPlan(plan.id)}
              className={`rounded-2xl border p-5 flex flex-col justify-between transition-all cursor-pointer relative overflow-hidden ${
                isSelected
                  ? 'bg-gradient-to-b from-slate-900 to-slate-950 border-red-500 ring-2 ring-red-500/40 shadow-xl shadow-red-600/10'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              {/* Badge */}
              <div className="flex justify-between items-start mb-3">
                <span
                  className={`text-[9.5px] font-mono font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-wider border ${
                    isSelected
                      ? 'bg-red-500/20 text-red-400 border-red-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {plan.badge || 'Plan Option'}
                </span>
                {isSelected && (
                  <span className="flex items-center gap-1 bg-red-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-md shadow-xs font-mono">
                    <Check className="w-3 h-3" /> Selected
                  </span>
                )}
              </div>

              {/* Title & Monthly Price */}
              <div>
                <h4 className="text-lg font-black text-white tracking-wide uppercase font-brand-header">
                  {plan.name}
                </h4>

                <div className="mt-2 pb-3 border-b border-slate-800">
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    Monthly Membership
                  </div>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-black font-mono text-white">
                      R{plan.monthlyPrice.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">/ month</span>
                  </div>
                </div>

                {/* Annual Assistance Benefit Callout */}
                <div
                  className={`my-3 p-3 rounded-xl border ${
                    isAssistZero
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-emerald-500/10 border-emerald-500/30'
                  }`}
                >
                  <div className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    Annual Assistance Benefit
                  </div>
                  <div className="text-base font-black font-mono mt-0.5">
                    {isAssistZero ? (
                      <span className="text-amber-400">R0 Parts Benefit</span>
                    ) : (
                      <span className="text-emerald-400">R{plan.annualBenefit.toLocaleString()} / year</span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 leading-tight">
                    {isAssistZero
                      ? 'Labour & diagnostics included. Hardware replacements on member account.'
                      : `Up to R${plan.annualBenefit.toLocaleString()} annual benefit for repairs & replacements.`}
                  </div>
                </div>

                {/* 3-Stage Payment Structure */}
                {(() => {
                  const bd = calculatePaymentBreakdown(plan.monthlyPrice);
                  return (
                    <div className="my-3 p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-[9.5px] font-mono font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800/80 pb-1.5">
                        <span className="text-red-400 flex items-center gap-1">
                          <Zap className="w-3 h-3 text-red-400" /> Payment Structure
                        </span>
                        <span className="text-slate-400">3-Stage Activation</span>
                      </div>
                      <div className="space-y-1 text-[11px] font-mono">
                        <div className="flex justify-between items-center text-slate-300">
                          <span className="text-slate-400">Today: 20%</span>
                          <span className="font-bold text-white">R{bd.initialPayment.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-300">
                          <span className="text-slate-400">First billing: 40%</span>
                          <span className="font-bold text-white">R{bd.firstBillingPayment.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-300">
                          <span className="text-slate-400">Second billing: 40%</span>
                          <span className="font-bold text-white">R{bd.secondBillingPayment.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-slate-800/80 text-[10px] text-slate-400">
                          <span>Total activation:</span>
                          <span className="font-bold text-white">R{bd.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Included Benefits */}
                <div className="space-y-2 mt-4 text-xs">
                  <div className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">
                    Included Benefits:
                  </div>
                  {plan.benefits.map((b, i) => (
                    <div key={i} className="flex items-start gap-2 text-slate-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{b}</span>
                    </div>
                  ))}
                </div>

                {/* Important Limitations */}
                <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
                  <div className="text-[9.5px] font-mono font-bold uppercase text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    <span>Important Limitations:</span>
                  </div>
                  {plan.limitations.map((lim, idx) => (
                    <p key={idx} className="leading-tight text-slate-400 pl-4 relative before:content-['•'] before:absolute before:left-1 before:text-slate-600">
                      {lim}
                    </p>
                  ))}
                </div>
              </div>

              {/* Selection Button */}
              <div className="mt-5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPlan(plan.id);
                  }}
                  className={`w-full py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check className="w-4 h-4" /> Selected: {plan.name}
                    </>
                  ) : (
                    <>Select {plan.name}</>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
