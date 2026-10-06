import React from 'react';
import { X, History, TrendingDown, ArrowDownRight, ArrowUpRight, Shield, Calendar, FileText } from 'lucide-react';
import { BenefitSummary, BenefitTransaction } from '../../types';

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
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-slate-950 p-6 border-b border-slate-800 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-red-500 uppercase tracking-widest">
              <History className="w-4 h-4 text-red-500" />
              <span>ANNUAL BENEFIT TRANSACTION LEDGER</span>
            </div>
            <h3 className="text-xl font-black text-white mt-1">Benefit Usage & Credit History</h3>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Plan: {planName} • Annual Benefit: {isPartsBenefitZero ? 'R0 Parts Benefit' : fmt(annualBenefit)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance KPI Banner */}
        <div className="bg-slate-950/80 p-5 border-b border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-mono uppercase block">Annual Allocation</span>
            <span className="text-base font-black font-mono text-white mt-0.5 block">{fmt(annualBenefit)}</span>
          </div>
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-mono uppercase block">Total Used</span>
            <span className="text-base font-black font-mono text-red-400 mt-0.5 block">{fmt(totalUsed)}</span>
          </div>
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-mono uppercase block">Available Balance</span>
            <span className="text-base font-black font-mono text-emerald-400 mt-0.5 block">{fmt(totalRemaining)}</span>
          </div>
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-mono uppercase block">Benefit Period</span>
            <span className="text-[11px] font-bold font-mono text-slate-300 mt-0.5 block">
              Active Annual Cycle
            </span>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
              Auditable Transaction Records ({transactions.length})
            </h4>
            <span className="text-[10px] font-mono text-slate-500">
              Live Verified from Double-Entry Ledger
            </span>
          </div>

          {transactions.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs bg-slate-950/50 rounded-2xl border border-slate-800">
              No benefit transactions recorded yet for this membership period.
            </div>
          ) : (
            <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-x-auto shadow-inner">
              <table className="w-full text-xs text-left min-w-[620px]">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-3">Reference</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-3 text-right">Debit (Used)</th>
                    <th className="py-3 px-3 text-right">Credit (Allocated)</th>
                    <th className="py-3 px-4 text-right">Remaining Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {transactions.map(t => {
                    const isCredit = (t.credit || 0) > 0;
                    return (
                      <tr key={t.id} className="hover:bg-slate-900/60 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                          {t.date ? new Date(t.date).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-white whitespace-nowrap">
                          <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] border border-slate-700">
                            {t.reference}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-200">
                          <div className="font-medium">{t.description}</div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-red-400 font-semibold whitespace-nowrap">
                          {t.debit > 0 ? `- R${t.debit.toLocaleString('en-ZA')}` : '—'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-400 font-semibold whitespace-nowrap">
                          {t.credit > 0 ? `+ R${t.credit.toLocaleString('en-ZA')}` : '—'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-white whitespace-nowrap">
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
        <div className="bg-slate-950 p-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span className="text-[11px] font-mono">
            Every benefit deduction is linked directly to an authorized service request and tax invoice.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
