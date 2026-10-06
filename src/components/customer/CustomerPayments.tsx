import React, { useState, useEffect } from 'react';
import {
  CreditCard, CheckCircle2, Clock, AlertTriangle, AlertCircle, RefreshCw,
  FileText, Download, Shield, Calendar, ArrowRight, Zap, Check, ChevronRight,
  Receipt, DollarSign, Printer
} from 'lucide-react';
import { useAppState } from '../../contexts/AppStateContext';
import { useAuth } from '../../contexts/AuthContext';
import { Payment, PaymentTimeline, ActivationTimelineStep } from '../../types';
import { formatZAR } from '../../utils/paymentStructure';

interface CustomerPaymentsProps {
  onNavigateTab?: (tab: string) => void;
}

export function CustomerPayments({ onNavigateTab }: CustomerPaymentsProps) {
  const { user } = useAuth();
  const { paymentTimeline, refreshPaymentTimeline, payActivationStage, retryPayment } = useAppState();
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    refreshPaymentTimeline();
  }, []);

  const timeline = paymentTimeline;
  const isPendingActivation = timeline?.membershipStatus === 'Pending Activation';
  const isActive = timeline?.membershipStatus === 'Active';

  const handlePayNextStage = async (stage: string) => {
    try {
      setIsProcessing(true);
      setActionMessage(null);
      await payActivationStage(stage);
      setActionMessage({ type: 'success', text: `Payment for ${stage} processed successfully!` });
      await refreshPaymentTimeline();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Payment processing failed' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = async (paymentId: string) => {
    try {
      setIsProcessing(true);
      setActionMessage(null);
      await retryPayment(paymentId);
      setActionMessage({ type: 'success', text: 'Payment retry initiated successfully!' });
      await refreshPaymentTimeline();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Retry failed' });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStageLabel = (stage?: string) => {
    switch (stage) {
      case 'INITIAL_20':
        return 'Initial 20%';
      case 'FIRST_BILLING_40':
        return 'First 40%';
      case 'SECOND_BILLING_40':
        return 'Second 40%';
      case 'RECURRING_MONTHLY':
        return 'Monthly Subscription';
      default:
        return stage || 'Membership Payment';
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'paid' || s === 'successful') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3" /> Paid
        </span>
      );
    }
    if (s === 'pending' || s === 'scheduled') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
          <Clock className="w-3 h-3" /> Scheduled
        </span>
      );
    }
    if (s === 'failed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-500/10 text-red-400 border border-red-500/30">
          <AlertTriangle className="w-3 h-3" /> Failed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Action Notification */}
      {actionMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-medium border ${
            actionMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* MEMBERSHIP HEADER CARD */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-red-500 uppercase">
                MEMBERSHIP BILLING & ACTIVATION
              </span>
              {isActive ? (
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                  ● ACTIVE
                </span>
              ) : (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                  ● PENDING ACTIVATION ({timeline?.activationPercentage || 20}%)
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2.5 mt-1">
              <h2 className="text-2xl font-black italic tracking-wide uppercase font-brand-header text-white">
                {timeline?.planName || 'Assist Plus'}
              </h2>
              <span className="text-xs font-mono text-slate-400">
                ({formatZAR(timeline?.monthlyPrice || 1499)} / month)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => refreshPaymentTimeline()}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* 3-STAGE ACTIVATION PROGRESS BAR */}
        {isPendingActivation && (
          <div className="mt-5 space-y-3 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                Activation Payment Progress
              </span>
              <span className="font-mono font-bold text-amber-300 text-sm">
                {timeline?.activationPercentage || 20}% Complete
              </span>
            </div>

            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500 rounded-full transition-all duration-700"
                style={{ width: `${timeline?.activationPercentage || 20}%` }}
              />
            </div>

            <div className="grid grid-cols-3 text-center text-[10px] font-mono pt-1">
              <div className={(timeline?.activationPercentage || 0) >= 20 ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                ✓ Initial 20% (Onboarding)
              </div>
              <div className={(timeline?.activationPercentage || 0) >= 60 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                {(timeline?.activationPercentage || 0) >= 60 ? '✓' : '○'} First 40% (Billing 1)
              </div>
              <div className={(timeline?.activationPercentage || 0) >= 100 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                {(timeline?.activationPercentage || 0) >= 100 ? '✓' : '○'} Second 40% (Active Status)
              </div>
            </div>

            <p className="text-[11px] text-amber-200/90 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 leading-relaxed">
              <strong>Notice:</strong> Your membership status is <strong>Pending Activation</strong>. Per Same Day Assist policy, full assistance benefits and claims unlock once 100% of the activation structure is collected (after the second 40% billing).
            </p>
          </div>
        )}

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Monthly Subscription</span>
            <span className="text-base font-black font-mono text-white mt-0.5 block">
              {formatZAR(timeline?.monthlyPrice || 1499)}
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Total Collected</span>
            <span className="text-base font-black font-mono text-emerald-400 mt-0.5 block">
              {formatZAR(timeline?.totalCollected || 0)}
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Billing Day</span>
            <span className="text-base font-black font-mono text-white mt-0.5 block">
              {timeline?.billingDayOfMonth ? `${timeline.billingDayOfMonth}th of month` : '25th of month'}
            </span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">
              {isActive ? 'Activated On' : 'Status'}
            </span>
            <span className={`text-base font-black font-mono mt-0.5 block ${isActive ? 'text-emerald-400' : 'text-amber-300'}`}>
              {isActive && timeline?.activationDate
                ? new Date(timeline.activationDate).toLocaleDateString('en-ZA')
                : 'Pending Activation'}
            </span>
          </div>
        </div>
      </div>

      {/* UPCOMING PAYMENT CARD (Specification Section 18) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase block">
              UPCOMING SCHEDULED PAYMENT
            </span>
            <h3 className="text-lg font-black text-white uppercase font-brand-header mt-0.5">
              {timeline?.nextPayment?.description || (isPendingActivation ? 'Next Activation Payment' : 'Monthly Membership')}
            </h3>
          </div>
          <span className="bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase">
            {timeline?.nextPayment?.status || 'Scheduled'}
          </span>
        </div>

        {timeline?.nextPayment ? (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-950 p-4 rounded-2xl border border-slate-800 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Calendar className="w-4 h-4 text-red-400" />
                <span>Scheduled Date: </span>
                <strong className="text-white font-mono">
                  {new Date(timeline.nextPayment.dueDate).toLocaleDateString('en-ZA', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </strong>
              </div>
              <div className="text-xs text-slate-400">
                Stage: <strong className="text-slate-200">{timeline.nextPayment.description}</strong>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
              <div className="text-right">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Amount Due</span>
                <span className="text-2xl font-black font-mono text-white">
                  {formatZAR(timeline.nextPayment.amount)}
                </span>
              </div>

              {isPendingActivation && (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handlePayNextStage(timeline.nextPayment!.stage)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold font-mono transition-all cursor-pointer shadow-md disabled:opacity-50 shrink-0"
                >
                  {isProcessing ? 'Processing...' : 'Pay Stage Now'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            No upcoming payments currently scheduled.
          </div>
        )}
      </div>

      {/* PAYMENT HISTORY TABLE (Specification Section 17 & 19) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-lg space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase block">
              TRANSACTION AUDIT LEDGER
            </span>
            <h3 className="text-lg font-black text-white uppercase font-brand-header mt-0.5">
              Payment History
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {timeline?.payments?.length || 0} Transactions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left min-w-[650px]">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase">
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Description</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Reference</th>
                <th className="py-3 px-3 text-right">Receipt / Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {timeline?.payments && timeline.payments.length > 0 ? (
                timeline.payments.map((p) => {
                  const dateStr = p.paidAt || p.dueDate || p.createdAt;
                  return (
                    <tr key={p.id} className="text-slate-300 hover:bg-slate-850/60 transition-colors">
                      <td className="py-3.5 px-3 font-mono text-slate-300">
                        {dateStr ? new Date(dateStr).toLocaleDateString('en-ZA', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        }) : '—'}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-white">
                          {p.description || getStageLabel(p.paymentStage)}
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">
                          {getStageLabel(p.paymentStage)}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-white text-sm">
                        {formatZAR(p.amount)}
                      </td>
                      <td className="py-3.5 px-3">
                        {getStatusBadge(p.status)}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-slate-400 text-[11px]">
                        {p.transactionRef || p.id.slice(0, 12)}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        {p.status.toLowerCase() === 'failed' ? (
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleRetry(p.id)}
                            className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 rounded-lg text-xs font-bold cursor-pointer transition-all"
                          >
                            Retry
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedReceipt(p)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-all"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-400" />
                            <span>Receipt</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-mono">
                    No payment transactions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECEIPT / INVOICE MODAL (Specification Section 19) */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative animate-scaleUp text-white space-y-6">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-red-500 uppercase tracking-widest block">
                  OFFICIAL PAYMENT RECEIPT
                </span>
                <h3 className="text-xl font-black uppercase font-brand-header mt-0.5">
                  Same Day Assist
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Receipt Summary Grid */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-3 text-xs">
              <div className="flex justify-between items-center border-b border-slate-850 pb-2.5">
                <span className="text-slate-400">Payment Reference:</span>
                <span className="font-mono font-bold text-white">
                  {selectedReceipt.transactionRef || selectedReceipt.id}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-850 pb-2.5">
                <span className="text-slate-400">Customer:</span>
                <span className="font-bold text-white">{user?.name || user?.email}</span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-850 pb-2.5">
                <span className="text-slate-400">Plan:</span>
                <span className="font-bold text-white">{timeline?.planName || 'Assist Plus'}</span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-850 pb-2.5">
                <span className="text-slate-400">Payment Stage:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {getStageLabel(selectedReceipt.paymentStage)}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-850 pb-2.5">
                <span className="text-slate-400">Date:</span>
                <span className="font-mono text-white">
                  {selectedReceipt.paidAt
                    ? new Date(selectedReceipt.paidAt).toLocaleDateString('en-ZA', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : selectedReceipt.dueDate
                    ? new Date(selectedReceipt.dueDate).toLocaleDateString('en-ZA')
                    : '—'}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-850 pb-2.5">
                <span className="text-slate-400">Payment Method:</span>
                <span className="font-mono text-slate-300">
                  {selectedReceipt.paymentMethod || 'Credit / Debit Card (PayFast)'}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-850 pb-2.5">
                <span className="text-slate-400">Status:</span>
                <span>{getStatusBadge(selectedReceipt.status)}</span>
              </div>

              {selectedReceipt.invoiceId && (
                <div className="flex justify-between items-center border-b border-slate-850 pb-2.5">
                  <span className="text-slate-400">Related Invoice:</span>
                  <span className="font-mono text-blue-400">{selectedReceipt.invoiceId}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <span className="text-sm font-bold text-white uppercase">Amount Paid:</span>
                <span className="text-xl font-black font-mono text-emerald-400">
                  {formatZAR(selectedReceipt.amount)}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
