import React, { useState } from 'react';
import {
  Shield, CheckCircle, AlertTriangle, TrendingDown, Clock,
  FileText, History, ArrowRight, ExternalLink, Zap, Info
} from 'lucide-react';
import { BenefitSummary } from '../../types';

interface BenefitBalanceCardProps {
  summary?: BenefitSummary;
  onViewClaims: () => void;
  onViewInvoices: () => void;
  onViewBenefitHistory: () => void;
  onChangePlan?: () => void;
}

export function BenefitBalanceCard({
  summary,
  onViewClaims,
  onViewInvoices,
  onViewBenefitHistory,
  onChangePlan,
}: BenefitBalanceCardProps) {
  if (!summary) {
    return (
      <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/3 mb-4"></div>
        <div className="h-12 bg-slate-800 rounded mb-4"></div>
        <div className="h-4 bg-slate-800 rounded w-1/2"></div>
      </div>
    );
  }

  const isAssistZero = summary.isPartsBenefitZero || summary.annualBenefit === 0;
  const usagePct = summary.usagePercentage;
  const remainingPct = summary.remainingPercentage;

  // Format currency in ZAR
  const fmt = (num: number) => `R${num.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white rounded-3xl border border-slate-800 shadow-xl p-6 sm:p-7 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-navy-light/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* Header with Plan and Monthly Price */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-red-500 uppercase">
                YOUR ASSISTANCE BENEFIT
              </span>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                ● ACTIVE
              </span>
            </div>
            <div className="flex items-baseline gap-2.5 mt-1">
              <h3 className="text-2xl font-black italic tracking-wide uppercase font-brand-header text-white">
                {summary.planName}
              </h3>
              <span className="text-xs font-mono text-slate-400">
                ({fmt(summary.monthlyPrice)} / month)
              </span>
            </div>
          </div>

          {onChangePlan && (
            <button
              type="button"
              onClick={onChangePlan}
              className="text-xs font-bold text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/60 bg-red-500/10 px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0"
            >
              Change Plan
            </button>
          )}
        </div>

        {/* Core Benefit Allowance Numbers */}
        {isAssistZero ? (
          /* ASSIST PLAN (R0 PARTS BENEFIT) DISPLAY */
          <div className="space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-xs font-mono font-bold uppercase text-amber-300">
                    Parts Benefit: R0 (Labour & Fault Finding Included)
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Your <strong>Assist</strong> membership covers certified technician labour and fault finding. It does not provide an annual monetary parts allowance. All hardware replacements and parts are billed directly to your member account.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Monthly Fee</span>
                <span className="text-base font-black font-mono text-white mt-0.5 block">{fmt(summary.monthlyPrice)}</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Parts Benefit</span>
                <span className="text-base font-black font-mono text-amber-400 mt-0.5 block">R0</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Claims Filed</span>
                <span className="text-base font-black font-mono text-white mt-0.5 block">{summary.claimsCount}</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Invoices</span>
                <span className="text-base font-black font-mono text-white mt-0.5 block">{summary.invoicesCount}</span>
              </div>
            </div>
          </div>
        ) : (
          /* STANDARD BENEFIT PLANS (ASSIST PLUS, PRO, ELITE, ADVANCED) */
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Total Annual Benefit */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  Annual Assistance Benefit
                </span>
                <div className="text-2xl font-black font-mono text-white mt-1">
                  {fmt(summary.annualBenefit)}
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  12-month allowance
                </span>
              </div>

              {/* Used Amount */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    Used
                  </span>
                  <span className="text-[10px] font-mono font-bold text-red-400">
                    {usagePct}%
                  </span>
                </div>
                <div className="text-2xl font-black font-mono text-red-400 mt-1">
                  {fmt(summary.usedBenefit)}
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Deducted to date
                </span>
              </div>

              {/* Remaining Amount */}
              <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-2xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-emerald-300 uppercase tracking-wider">
                    Remaining
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-400">
                    {remainingPct}%
                  </span>
                </div>
                <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
                  {fmt(summary.remainingBenefit)}
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Available for new claims
                </span>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>Usage: <strong className="text-white">{usagePct}%</strong> ({fmt(summary.usedBenefit)})</span>
                <span>Remaining: <strong className="text-emerald-400">{remainingPct}%</strong> ({fmt(summary.remainingBenefit)})</span>
              </div>
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, usagePct))}%` }}
                />
              </div>
            </div>

            {/* Benefit Period Meta */}
            <div className="flex flex-wrap items-center justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Benefit Period: {new Date(summary.benefitYearStart).toLocaleDateString('en-ZA')} – {new Date(summary.benefitYearEnd).toLocaleDateString('en-ZA')}</span>
              </div>
              <div className="flex items-center gap-3">
                <span>Claims Affecting Benefit: <strong className="text-white">{summary.claimsCount}</strong></span>
                <span>Invoices: <strong className="text-white">{summary.invoicesCount}</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Action Navigation Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
          <button
            type="button"
            onClick={onViewBenefitHistory}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono font-bold text-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <History className="w-3.5 h-3.5 text-red-400" />
            <span>VIEW BENEFIT HISTORY</span>
          </button>

          <button
            type="button"
            onClick={onViewClaims}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono font-bold text-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>VIEW CLAIMS ({summary.claimsCount})</span>
          </button>

          <button
            type="button"
            onClick={onViewInvoices}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono font-bold text-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>VIEW INVOICES ({summary.invoicesCount})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
