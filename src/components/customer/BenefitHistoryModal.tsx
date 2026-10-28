import React from 'react';
import { X, History, TrendingDown, ArrowDownRight, ArrowUpRight, Shield, Calendar, FileText } from 'lucide-react';
import { BenefitSummary, BenefitTransaction } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

interface BenefitHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary?: BenefitSummary;
  transactions?: BenefitTransaction[];
  planName?: string;
  annualBenefit?: number;
  totalRemaining?: number;
}

export function BenefitHistoryModal({
  isOpen,
  onClose,
  summary,
  transactions: propTx,
  planName: propPlanName,
  annualBenefit: propAnnualBenefit,
  totalRemaining: propTotalRemaining,
}: BenefitHistoryModalProps) {
  const { isDark } = useTheme();

  if (!isOpen) return null;

  const transactions = propTx || summary?.transactions || [];
  const planName = propPlanName || summary?.planName || 'Assist Plus';
  const annualBenefit = propAnnualBenefit !== undefined ? propAnnualBenefit : (summary?.annualBenefit || 0);
  const totalRemaining = propTotalRemaining !== undefined ? propTotalRemaining : (summary?.remainingBenefit || 0);
  const totalUsed = summary?.usedBenefit !== undefined ? summary.usedBenefit : (annualBenefit - totalRemaining);
  const isPartsBenefitZero = summary?.isPartsBenefitZero || annualBenefit === 0;

  const fmt = (num: number) => `R${num.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className={`border rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Modal Header */}
        <div className={`p-6 border-b flex justify-between items-center transition-colors ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-red uppercase tracking-widest">
              <History className="w-4 h-4 text-red" />
              <span>ANNUAL BENEFIT TRANSACTION LEDGER</span>
            </div>
            <h3 className={`text-xl font-black mt-1 ${isDark ? 'text-white' : 'text-navy'}`}>
              Benefit Usage & Credit History
            </h3>
            <p className={`text-xs mt-0.5 font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Plan: {planName} • Annual Benefit: {isPartsBenefitZero ? 'R0 Parts Benefit' : fmt(annualBenefit)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              isDark 
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white' 
                : 'bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance KPI Banner */}
        <div className={`p-5 border-b grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs transition-colors ${
          isDark ? 'bg-slate-950/80 border-slate-800/80' : 'bg-slate-50/60 border-slate-200'
        }`}>
          <div className={`p-3 rounded-xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
          }`}>
            <span className={`text-[10px] font-mono uppercase block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Annual Allocation</span>
            <span className={`text-base font-black font-mono mt-0.5 block ${isDark ? 'text-white' : 'text-navy'}`}>{fmt(annualBenefit)}</span>
          </div>
          <div className={`p-3 rounded-xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
          }`}>
            <span className={`text-[10px] font-mono uppercase block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Used</span>
            <span className="text-base font-black font-mono text-red mt-0.5 block">{fmt(totalUsed)}</span>
          </div>
          <div className={`p-3 rounded-xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
          }`}>
            <span className={`text-[10px] font-mono uppercase block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Available Balance</span>
            <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">{fmt(totalRemaining)}</span>
          </div>
          <div className={`p-3 rounded-xl border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
          }`}>
            <span className={`text-[10px] font-mono uppercase block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Benefit Period</span>
            <span className={`text-[11px] font-bold font-mono mt-0.5 block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Active Annual Cycle
            </span>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className={`text-xs font-mono font-bold uppercase tracking-wider ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Auditable Transaction Records ({transactions.length})
            </h4>
            <span className="text-[10px] font-mono text-slate-400">
              Live Verified from Double-Entry Ledger
            </span>
          </div>

          {transactions.length === 0 ? (
            <div className={`p-12 text-center text-xs rounded-2xl border ${
              isDark ? 'text-slate-500 bg-slate-950/50 border-slate-800' : 'text-slate-400 bg-slate-50 border-slate-200'
            }`}>
              No benefit transactions recorded yet for this membership period.
            </div>
          ) : (
            <div className={`rounded-2xl border overflow-x-auto shadow-inner ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <table className="w-full text-xs text-left min-w-[620px]">
                <thead>
                  <tr className={`border-b font-mono text-[10px] uppercase ${
                    isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
                  }`}>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-3">Reference</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-3 text-right">Debit (Used)</th>
                    <th className="py-3 px-3 text-right">Credit (Allocated)</th>
                    <th className="py-3 px-4 text-right">Remaining Balance</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                  {transactions.map(t => {
                    const isCredit = (t.credit || 0) > 0;
                    return (
                      <tr key={t.id} className={`transition-colors ${
                        isDark ? 'hover:bg-slate-900/60' : 'hover:bg-slate-50'
                      }`}>
                        <td className={`py-3 px-4 font-mono whitespace-nowrap ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          {t.date ? new Date(t.date).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[11px] border ${
                            isDark 
                              ? 'bg-slate-800 text-white border-slate-700' 
                              : 'bg-slate-100 text-slate-800 border-slate-200'
                          }`}>
                            {t.reference}
                          </span>
                        </td>
                        <td className={`py-3 px-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          <div className="font-medium">{t.description}</div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-red font-semibold whitespace-nowrap">
                          {t.debit > 0 ? `- R${t.debit.toLocaleString('en-ZA')}` : '—'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap">
                          {t.credit > 0 ? `+ R${t.credit.toLocaleString('en-ZA')}` : '—'}
                        </td>
                        <td className={`py-3 px-4 text-right font-mono font-bold whitespace-nowrap ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}>
                          R{t.balance.toLocaleString('en-ZA')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex justify-between items-center text-xs transition-colors ${
          isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}>
          <span className="text-[11px] font-mono">
            Every benefit deduction is linked directly to an authorized service request and tax invoice.
          </span>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 font-bold rounded-xl cursor-pointer ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
