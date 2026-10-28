import React, { useState } from 'react';
import {
  Shield, CheckCircle, AlertTriangle, TrendingDown, Clock,
  FileText, History, ArrowRight, ExternalLink, Zap, Info
} from 'lucide-react';
import { BenefitSummary } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

interface BenefitBalanceCardProps {
  summary?: BenefitSummary;
  onViewClaims: () => void;
  onViewInvoices: () => void;
  onViewBenefitHistory: () => void;
  onChangePlan?: () => void;
}

export function BenefitBalanceCard({
  summary: rawSummary,
  onViewClaims,
  onViewInvoices,
  onViewBenefitHistory,
  onChangePlan,
}: BenefitBalanceCardProps) {
  const { isDark } = useTheme();
  const defaultSummary: BenefitSummary = {
    membershipId: 'mem-default',
    planId: 'assist_plus',
    planName: 'Assist Plus Membership',
    monthlyPrice: 389,
    annualBenefit: 10000,
    isPartsBenefitZero: false,
    partsBenefitDescription: 'Annual assistance and repair allowance',
    usedBenefit: 0,
    remainingBenefit: 10000,
    usagePercentage: 0,
    remainingPercentage: 100,
    benefitYearStart: `${new Date().getFullYear()}-01-01`,
    benefitYearEnd: `${new Date().getFullYear()}-12-31`,
    status: 'Active',
    isEligibleForBenefits: true,
    activationPercentage: 100,
    claimsCount: 0,
    invoicesCount: 0,
    transactions: [],
  };

  const summary = rawSummary || defaultSummary;

  const isAssistZero = summary.isPartsBenefitZero || summary.annualBenefit === 0;
  const usagePct = summary.usagePercentage;
  const remainingPct = summary.remainingPercentage;

  // Format currency in ZAR
  const fmt = (num: number) => `R${num.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div className={`rounded-3xl border shadow-xl p-6 sm:p-7 relative overflow-hidden transition-colors ${
      isDark 
        ? 'bg-[#091C3E] text-white border-[#142D59]' 
        : 'bg-white text-slate-900 border-slate-200 shadow-md'
    }`}>
      <div className="relative z-10 space-y-6">
        {/* Header with Plan and Monthly Price */}
        <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-5 border-b ${
          isDark ? 'border-slate-800' : 'border-slate-100'
        }`}>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-red uppercase">
                YOUR ASSISTANCE BENEFIT
              </span>
              {summary.isEligibleForBenefits !== false && summary.membershipStatus === 'Active' ? (
                <span className={`border text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono ${
                  isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                }`}>
                  ● ACTIVE
                </span>
              ) : (
                <span className={`border text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono ${
                  isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-amber-50 text-amber-900 border-amber-300'
                }`}>
                  ● PENDING ACTIVATION ({summary.activationPercentage ?? 20}%)
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2.5 mt-1">
              <h3 className={`text-2xl font-black italic tracking-wide uppercase font-brand-header ${
                isDark ? 'text-white' : 'text-navy'
              }`}>
                {summary.planName}
              </h3>
              <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                ({fmt(summary.monthlyPrice)} / month)
              </span>
            </div>
          </div>

          {onChangePlan && (
            <button
              type="button"
              onClick={onChangePlan}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 border ${
                isDark 
                  ? 'text-red-400 hover:text-white border-red-500/40 hover:bg-red/20 bg-slate-800'
                  : 'text-red hover:text-white border-red/40 hover:bg-red bg-white shadow-2xs'
              }`}
            >
              Change Plan
            </button>
          )}
        </div>

        {/* Pending Activation Notice (Section 26 Requirements) */}
        {(summary.isEligibleForBenefits === false || summary.membershipStatus === 'Pending Activation') && (
          <div className={`border rounded-2xl p-4 flex items-start gap-3 text-xs ${
            isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className={`font-bold block ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>
                Benefit Coverage Locked — Pending Membership Activation ({summary.activationPercentage ?? 20}% collected)
              </span>
              <p className={`leading-relaxed text-[11px] ${isDark ? 'text-slate-300' : 'text-amber-950'}`}>
                Your annual assistance benefit of <strong>{fmt(summary.annualBenefit)}</strong> will unlock automatically once your membership activation cycle reaches 100% (after completing the second 40% billing payment). Claims filed prior to activation are billed directly to member account.
              </p>
            </div>
          </div>
        )}

        {/* Core Benefit Allowance Numbers */}
        {isAssistZero ? (
          /* ASSIST PLAN (R0 PARTS BENEFIT) DISPLAY */
          <div className="space-y-4">
            <div className={`border rounded-2xl p-5 ${
              isDark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className={`text-xs font-mono font-bold uppercase ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>
                    Parts Benefit: R0 (Labour & Fault Finding Included)
                  </div>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-amber-950'}`}>
                    Your <strong>Assist</strong> membership covers certified technician labour and fault finding. It does not provide an annual monetary parts allowance. All hardware replacements and parts are billed directly to your member account.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className={`border rounded-2xl p-3.5 ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className={`text-[10px] font-mono uppercase block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Monthly Fee</span>
                <span className={`text-base font-black font-mono mt-0.5 block ${isDark ? 'text-white' : 'text-navy'}`}>{fmt(summary.monthlyPrice)}</span>
              </div>
              <div className={`border rounded-2xl p-3.5 ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className={`text-[10px] font-mono uppercase block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Parts Benefit</span>
                <span className="text-base font-black font-mono text-amber-500 mt-0.5 block">R0</span>
              </div>
              <div className={`border rounded-2xl p-3.5 ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className={`text-[10px] font-mono uppercase block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Claims Filed</span>
                <span className={`text-base font-black font-mono mt-0.5 block ${isDark ? 'text-white' : 'text-navy'}`}>{summary.claimsCount}</span>
              </div>
              <div className={`border rounded-2xl p-3.5 ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className={`text-[10px] font-mono uppercase block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Invoices</span>
                <span className={`text-base font-black font-mono mt-0.5 block ${isDark ? 'text-white' : 'text-navy'}`}>{summary.invoicesCount}</span>
              </div>
            </div>
          </div>
        ) : (
          /* STANDARD BENEFIT PLANS (ASSIST PLUS, PRO, ELITE, ADVANCED) */
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Total Annual Benefit */}
              <div className={`border rounded-2xl p-4 transition-colors ${
                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className={`text-[10px] font-mono uppercase tracking-wider block ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Annual Assistance Benefit
                </span>
                <div className={`text-2xl font-black font-mono mt-1 ${
                  isDark ? 'text-white' : 'text-navy'
                }`}>
                  {fmt(summary.annualBenefit)}
                </div>
                <span className={`text-[10px] block mt-0.5 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  12-month allowance
                </span>
              </div>

              {/* Used Amount */}
              <div className={`border rounded-2xl p-4 transition-colors ${
                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex justify-between items-center">
                  <span className={`text-[10px] font-mono uppercase tracking-wider ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    Used
                  </span>
                  <span className="text-[10px] font-mono font-bold text-red">
                    {usagePct}%
                  </span>
                </div>
                <div className="text-2xl font-black font-mono text-red mt-1">
                  {fmt(summary.usedBenefit)}
                </div>
                <span className={`text-[10px] block mt-0.5 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Deducted to date
                </span>
              </div>

              {/* Remaining Amount */}
              <div className={`border rounded-2xl p-4 transition-colors ${
                isDark ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-emerald-50 border-emerald-200'
              }`}>
                <div className="flex justify-between items-center">
                  <span className={`text-[10px] font-mono uppercase tracking-wider ${
                    isDark ? 'text-emerald-300' : 'text-emerald-800'
                  }`}>
                    Remaining
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {remainingPct}%
                  </span>
                </div>
                <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                  {fmt(summary.remainingBenefit)}
                </div>
                <span className={`text-[10px] block mt-0.5 ${
                  isDark ? 'text-slate-400' : 'text-emerald-700'
                }`}>
                  Available for new claims
                </span>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className={`flex justify-between text-[11px] font-mono ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                <span>Usage: <strong className={isDark ? 'text-white' : 'text-navy'}>{usagePct}%</strong> ({fmt(summary.usedBenefit)})</span>
                <span>Remaining: <strong className="text-emerald-600 dark:text-emerald-400">{remainingPct}%</strong> ({fmt(summary.remainingBenefit)})</span>
              </div>
              <div className={`w-full h-3 rounded-full overflow-hidden border p-0.5 ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
              }`}>
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, usagePct))}%` }}
                />
              </div>
            </div>

            {/* Benefit Period Meta */}
            <div className={`flex flex-wrap items-center justify-between text-[10px] font-mono pt-2 border-t ${
              isDark ? 'border-slate-800/80 text-slate-400' : 'border-slate-100 text-slate-500'
            }`}>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Benefit Period: {summary.benefitYearStart ? new Date(summary.benefitYearStart).toLocaleDateString('en-ZA') : 'Current'} – {summary.benefitYearEnd ? new Date(summary.benefitYearEnd).toLocaleDateString('en-ZA') : 'Ongoing'}</span>
              </div>
              <div className="flex items-center gap-3">
                <span>Claims Affecting Benefit: <strong className={isDark ? 'text-white' : 'text-navy'}>{summary.claimsCount}</strong></span>
                <span>Invoices: <strong className={isDark ? 'text-white' : 'text-navy'}>{summary.invoicesCount}</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Action Navigation Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
          <button
            type="button"
            onClick={onViewBenefitHistory}
            className={`py-2.5 px-4 rounded-xl border text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
              isDark 
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-navy'
            }`}
          >
            <History className="w-3.5 h-3.5 text-red" />
            <span>VIEW BENEFIT HISTORY</span>
          </button>

          <button
            type="button"
            onClick={onViewClaims}
            className={`py-2.5 px-4 rounded-xl border text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
              isDark 
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-navy'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>VIEW CLAIMS ({summary.claimsCount})</span>
          </button>

          <button
            type="button"
            onClick={onViewInvoices}
            className={`py-2.5 px-4 rounded-xl border text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
              isDark 
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-navy'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>VIEW INVOICES ({summary.invoicesCount})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
