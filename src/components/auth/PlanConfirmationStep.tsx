import React, { useState } from 'react';
import { Shield, Check, AlertCircle, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { getPlan } from '../../data/plans';
import { calculatePaymentBreakdown, calculatePaymentBreakdown5050, PaymentArrangement } from '../../utils/paymentStructure';
import { useTheme } from '../../contexts/ThemeContext';

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
  const [arrangement, setArrangement] = useState<PaymentArrangement>('20_40_40');
  const { isDark } = useTheme();
  const plan = getPlan(selectedPlanId);
  const isAssistZero = plan.annualBenefit === 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="text-center space-y-1">
        <span className="text-[10px] font-mono font-bold text-red uppercase tracking-widest">
          STEP CONFIRMATION BEFORE SUBSCRIPTION
        </span>
        <h3 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-navy'}`}>
          Confirm Your Selected Plan
        </h3>
        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Please review and explicitly confirm your understanding of the monthly membership fee and annual assistance benefit.
        </p>
      </div>

      {/* Main Confirmation Card */}
      <div className={`border-2 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden transition-colors ${
        isDark 
          ? 'bg-[#091C3E] border-[#142D59] text-white' 
          : 'bg-white border-slate-200 shadow-xl text-slate-900'
      }`}>
        <div className="relative z-10 space-y-6">
          <div className={`flex justify-between items-start border-b pb-4 ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}>
            <div>
              <span className={`text-[10px] font-mono uppercase tracking-wider block ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Your Selected Plan
              </span>
              <h2 className={`text-2xl font-black tracking-wide uppercase font-brand-header mt-0.5 ${
                isDark ? 'text-white' : 'text-navy'
              }`}>
                {plan.name}
              </h2>
            </div>
            <button
              type="button"
              onClick={onBackToPlans}
              className="text-xs text-red hover:underline font-bold cursor-pointer"
            >
              Change Plan
            </button>
          </div>

          {/* Pricing & Benefit Dual Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Monthly Subscription */}
            <div className={`border rounded-2xl p-4 ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className={`text-[10px] font-mono uppercase tracking-wider block ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Monthly Membership Subscription
              </span>
              <div className={`text-2xl font-black font-mono mt-1 ${
                isDark ? 'text-white' : 'text-navy'
              }`}>
                R{plan.monthlyPrice.toLocaleString()}{' '}
                <span className={`text-xs font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>/ month</span>
              </div>
              <p className={`text-[10px] mt-1 leading-snug ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Recurring monthly fee for same-day dispatch and 24/7 incident response.
              </p>
            </div>

            {/* Annual Assistance Benefit */}
            <div
              className={`border rounded-2xl p-4 ${
                isAssistZero
                  ? isDark ? 'bg-amber-500/10 border-amber-500/40 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-950'
                  : isDark ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-950'
              }`}
            >
              <span className={`text-[10px] font-mono uppercase tracking-wider block ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Annual Assistance Benefit
              </span>
              <div className="text-2xl font-black font-mono mt-1">
                {isAssistZero ? (
                  <span className="text-amber-500 font-bold">R0 Parts Benefit</span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    R{plan.annualBenefit.toLocaleString()} / year
                  </span>
                )}
              </div>
              <p className={`text-[10px] mt-1 leading-snug ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}>
                {isAssistZero
                  ? 'Monetary parts allowance is R0. Certified labour & fault finding are included.'
                  : `Maximum annual benefit pool available for repairs & parts during your 12-month membership.`}
              </p>
            </div>
          </div>

          {/* Explicit Customer Statement */}
          <div className={`border rounded-2xl p-4 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className={`text-xs leading-relaxed font-medium ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              "You pay <strong className={isDark ? 'text-white' : 'text-navy'}>R{plan.monthlyPrice.toLocaleString()} per month</strong> for your membership and have an annual assistance benefit of{' '}
              <strong className={isAssistZero ? 'text-amber-500 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-bold'}>
                {isAssistZero ? 'R0 Parts Benefit (Labour & Fault Finding Included)' : `up to R${plan.annualBenefit.toLocaleString()}`}
              </strong>."
            </div>
          </div>

          {/* YOUR PAYMENT SCHEDULE */}
          {(() => {
            const bd3 = calculatePaymentBreakdown(plan.monthlyPrice);
            const bd2 = calculatePaymentBreakdown5050(plan.monthlyPrice);
            const is2Stage = arrangement === '50_50';

            return (
              <div className={`border-2 rounded-2xl p-5 space-y-4 shadow-xl ${
                isDark 
                  ? 'bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-red/40' 
                  : 'bg-white border-red/30'
              }`}>
                <div className={`flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b pb-3 ${
                  isDark ? 'border-slate-800' : 'border-slate-200'
                }`}>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-red uppercase tracking-widest block">
                      ACTIVATION PAYMENT BREAKDOWN
                    </span>
                    <h3 className={`text-base font-black uppercase tracking-wider font-brand-header ${
                      isDark ? 'text-white' : 'text-navy'
                    }`}>
                      YOUR PAYMENT SCHEDULE & ARRANGEMENT
                    </h3>
                  </div>

                  {/* Arrangement Selector Pills */}
                  <div className={`flex p-1 rounded-xl border shrink-0 ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
                  }`}>
                    <button
                      type="button"
                      onClick={() => setArrangement('20_40_40')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all ${
                        !is2Stage
                          ? 'bg-red text-white shadow-xs'
                          : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-navy'
                      }`}
                    >
                      20% / 40% / 40% (3-Stage)
                    </button>
                    <button
                      type="button"
                      onClick={() => setArrangement('50_50')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all ${
                        is2Stage
                          ? 'bg-red text-white shadow-xs'
                          : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-navy'
                      }`}
                    >
                      50% / 50% (2-Stage)
                    </button>
                  </div>
                </div>

                {!is2Stage ? (
                  /* 3-Stage: 20% / 40% / 40% */
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className={`border rounded-xl p-3.5 ${
                      isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <span className={`text-[10px] font-mono uppercase block ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        Initial Payment — 20%
                      </span>
                      <div className={`text-lg font-black font-mono mt-1 ${
                        isDark ? 'text-white' : 'text-navy'
                      }`}>
                        R{bd3.initialPayment.toFixed(2)}
                      </div>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">
                        Due Today (Onboarding)
                      </span>
                    </div>

                    <div className={`border rounded-xl p-3.5 ${
                      isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <span className={`text-[10px] font-mono uppercase block ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        1st Billing — 40%
                      </span>
                      <div className={`text-lg font-black font-mono mt-1 ${
                        isDark ? 'text-white' : 'text-navy'
                      }`}>
                        R{bd3.firstBillingPayment.toFixed(2)}
                      </div>
                      <span className={`text-[10px] font-mono mt-1 block ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        Scheduled (25th of month)
                      </span>
                    </div>

                    <div className={`border rounded-xl p-3.5 ${
                      isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <span className={`text-[10px] font-mono uppercase block ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        2nd Billing — 40% (3rd Payment)
                      </span>
                      <div className={`text-lg font-black font-mono mt-1 ${
                        isDark ? 'text-white' : 'text-navy'
                      }`}>
                        R{bd3.secondBillingPayment.toFixed(2)}
                      </div>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold font-mono mt-1 block">
                        Activates Membership ✓
                      </span>
                    </div>
                  </div>
                ) : (
                  /* 2-Stage: 50% / 50% */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className={`border rounded-xl p-3.5 ${
                      isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <span className={`text-[10px] font-mono uppercase block ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        Initial Payment — 50%
                      </span>
                      <div className={`text-lg font-black font-mono mt-1 ${
                        isDark ? 'text-white' : 'text-navy'
                      }`}>
                        R{bd2.initialPayment.toFixed(2)}
                      </div>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">
                        Due Today (Onboarding)
                      </span>
                    </div>

                    <div className={`border rounded-xl p-3.5 ${
                      isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <span className={`text-[10px] font-mono uppercase block ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        2nd Payment — 50%
                      </span>
                      <div className={`text-lg font-black font-mono mt-1 ${
                        isDark ? 'text-white' : 'text-navy'
                      }`}>
                        R{bd2.secondPayment.toFixed(2)}
                      </div>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold font-mono mt-1 block">
                        Activates Membership ✓
                      </span>
                    </div>
                  </div>
                )}

                {/* Total & Activation Milestone Warning */}
                <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-3.5 rounded-xl border gap-2 ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <span className={`font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Activation Payments: </span>
                    <span className={`font-mono font-bold text-sm ${isDark ? 'text-white' : 'text-navy'}`}>
                      R{plan.monthlyPrice.toLocaleString()}
                    </span>
                    <span className={`text-[10px] font-mono ml-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      ({!is2Stage ? '20% + 40% + 40% = 100%' : '50% + 50% = 100%'})
                    </span>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md border ${
                    isDark ? 'text-amber-300 bg-amber-500/10 border-amber-500/20' : 'text-amber-800 bg-amber-50 border-amber-200'
                  }`}>
                    Activation Status: {!is2Stage ? 'Active After 3rd Payment' : 'Active After 2nd Payment'}
                  </span>
                </div>

                {/* Explicit Requirement Callout */}
                <div className={`border rounded-xl p-4 flex items-start gap-3 text-xs ${
                  isDark ? 'bg-red-500/10 border-red-500/30 text-red-200' : 'bg-red-50 border-red-200 text-red-950'
                }`}>
                  <AlertCircle className="w-5 h-5 text-red shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className={`font-bold block uppercase tracking-wider text-[11px] ${
                      isDark ? 'text-white' : 'text-red-900'
                    }`}>
                      Crucial Membership Activation Notice:
                    </span>
                    <p className={`leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      “Your membership activation depends on your selected payment arrangement. Under 50% / 50%, activation follows the second successful payment; under 20% / 40% / 40%, activation follows the third successful payment, subject to the agreed membership terms.”
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Benefits Included */}
          <div className="space-y-2">
            <h4 className={`text-[11px] font-mono font-bold uppercase tracking-wider ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Benefits Included:
            </h4>
            <div className="space-y-2 text-xs">
              {plan.benefits.map((benefit, i) => (
                <div key={i} className={`flex items-start gap-2 ${
                  isDark ? 'text-slate-200' : 'text-slate-700'
                }`}>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* What You Receive */}
          <div className={`space-y-2 pt-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <h4 className={`text-[11px] font-mono font-bold uppercase tracking-wider ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              What You Receive:
            </h4>
            <div className={`space-y-1.5 text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {plan.whatYouReceive.map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red mt-1.5 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Explicit Confirmation Checkbox */}
          <div className={`pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <label className={`flex items-start gap-3 p-3.5 border rounded-xl cursor-pointer transition-all ${
              isDark 
                ? 'bg-slate-900/90 hover:bg-slate-900 border-slate-800' 
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
            }`}>
              <input
                type="checkbox"
                checked={confirmed}
                onChange={e => onToggleConfirm(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded bg-slate-800 border-slate-700 text-red focus:ring-0 cursor-pointer"
              />
              <div className={`text-xs leading-snug ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <span className={`font-bold block mb-0.5 ${isDark ? 'text-white' : 'text-navy'}`}>
                  I explicitly confirm that I understand this membership plan and payment schedule:
                </span>
                I acknowledge that the monthly subscription is{' '}
                <strong>R{plan.monthlyPrice.toLocaleString()}/month</strong>. Under my selected{' '}
                <strong>{arrangement === '50_50' ? '50% / 50%' : '20% / 40% / 40%'}</strong> payment arrangement,{' '}
                {arrangement === '50_50' ? (
                  <>initial onboarding payment is <strong>50% (R{(plan.monthlyPrice * 0.5).toFixed(2)})</strong>, followed by a second 50% payment, and my membership becomes <strong>ACTIVE after the second successful payment</strong>.</>
                ) : (
                  <>initial onboarding payment is <strong>20% (R{(plan.monthlyPrice * 0.2).toFixed(2)})</strong>, followed by two 40% billing cycles, and my membership becomes <strong>ACTIVE after the third successful payment (second scheduled billing)</strong>.</>
                )}
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
