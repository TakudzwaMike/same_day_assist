import React, { useState } from 'react';
import { CreditCard, FileText, Download, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAppState } from '../../contexts/AppStateContext';
import { api } from '../../services/api';
import EmptyState from '../shared/EmptyState';
import ConfirmDialog from '../shared/ConfirmDialog';

interface CustomerInvoicesProps {
  activeCustomer: any;
}

export default function CustomerInvoices({ activeCustomer }: CustomerInvoicesProps) {
  const { state, approveQuotation, declineQuotation, addAuditLogLocal } = useAppState();
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmMode, setConfirmMode] = useState<'approve' | 'decline'>('approve');

  const payments = state.payments.filter(p => p.customerId === activeCustomer.id);
  const pendingQuotations = state.quotations.filter(q => q.status === 'Pending');
  const historicalQuotations = state.quotations.filter(q => q.status !== 'Pending');

  const totalPaid = payments.reduce((sum, p) => p.status === 'Paid' ? sum + p.amount : sum, 0);

  const handleActionClick = (quoteId: string, mode: 'approve' | 'decline') => {
    setSelectedQuoteId(quoteId);
    setConfirmMode(mode);
    setIsConfirmOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedQuoteId) return;
    try {
      if (confirmMode === 'approve') {
        await approveQuotation(selectedQuoteId);
        addAuditLogLocal('Quotation Approved', `Customer approved pre-membership quotation: ${selectedQuoteId}`);
      } else {
        await declineQuotation(selectedQuoteId);
        addAuditLogLocal('Quotation Declined', `Customer declined quotation: ${selectedQuoteId}`);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update quotation');
    }
  };

  const handleDownloadPDF = (type: 'invoice' | 'quotation', id: string) => {
    // Open the PDF download in a new tab
    const url = api.getPDFUrl(type, id);
    window.open(url, '_blank');
    addAuditLogLocal('PDF Downloaded', `Customer downloaded PDF for ${type}: ${id}`);
  };

  return (
    <div className="flex flex-col gap-5 animate-fadeIn">
      <div className="border-b border-slate-100 pb-1.5">
        <h3 className="text-xs font-bold text-navy uppercase tracking-wider">Billing Statements & Quotations</h3>
        <p className="text-[9px] text-slate-600">Review pending pre-compliance quotations and download tax invoices</p>
      </div>

      {/* SUMMARY CARD */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Total Fees Contributed</span>
          <span className="text-xl font-brand-header text-navy font-bold">R{totalPaid}</span>
        </div>
        <div className="bg-navy/5 px-3 py-1.5 rounded-xl border border-navy/10 text-[9.5px] text-navy font-medium font-mono leading-none">
          MEMBERSHIP BILLING: ACTIVE
        </div>
      </div>

      {/* PENDING QUOTATIONS */}
      <div className="space-y-2">
        <h4 className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">Awaiting Verification Approval</h4>
        <div className="flex flex-col gap-3">
          {pendingQuotations.map(quote => (
            <div key={quote.id} className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col gap-3">
              <div className="flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-slate-700 block">Pre-Compliance Repair Quote</span>
                  <span className="text-[9.5px] text-slate-600 font-mono">ID: {quote.id}</span>
                </div>
                <span className="font-brand-header text-red text-sm font-bold">R{quote.amount}</span>
              </div>
              <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                {quote.lineItems.map(item => (
                  <div key={item.id} className="flex justify-between items-center text-[10px] text-slate-500">
                    <span>{item.description}</span>
                    <span className="font-bold">R{item.cost}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => handleActionClick(quote.id, 'decline')}
                  className="flex-1 py-2 text-xs font-bold text-slate-500 hover:text-red hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer"
                >
                  Decline
                </button>
                <button
                  type="button"
                  onClick={() => handleActionClick(quote.id, 'approve')}
                  className="flex-1 py-2 bg-navy text-white text-xs font-bold rounded-xl hover:bg-navy-light shadow-xs transition-all cursor-pointer"
                >
                  Approve Quotation
                </button>
              </div>
            </div>
          ))}
          {pendingQuotations.length === 0 && (
            <EmptyState 
              icon={CheckCircle}
              title="No Pending Quotations"
              description="Your property is currently in full safety compliance."
            />
          )}
        </div>
      </div>

      {/* BILLING HISTORY */}
      <div className="space-y-2">
        <h4 className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">Statement History</h4>
        <div className="flex flex-col gap-2">
          {payments.map(pay => (
            <div key={pay.id} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all flex justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-100 rounded-xl text-slate-500">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">{pay.type}</p>
                  <p className="text-[9px] text-slate-600 font-mono">Invoice: {pay.id} • Date: {pay.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <p className="text-xs font-brand-header text-navy font-bold">R{pay.amount}</p>
                  <span className="text-[7.5px] bg-emerald-100 text-emerald-800 font-extrabold px-1 rounded-sm uppercase tracking-wide">PAID</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDownloadPDF('invoice', pay.id)}
                  className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-500 hover:text-navy cursor-pointer transition-colors"
                  title="Download Tax PDF Invoice"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {payments.length === 0 && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/85 text-center text-xs text-slate-400">
              No transactions recorded yet. Complete onboarding pre-compliance repairs to initialize billing.
            </div>
          )}
        </div>
      </div>

      {/* HISTORICAL QUOTATIONS */}
      {historicalQuotations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Archived Quotes</h4>
          <div className="flex flex-col gap-2">
            {historicalQuotations.map(quote => (
              <div key={quote.id} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-3xs flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-slate-700">Audit Quote: {quote.id}</p>
                  <p className="text-[9px] text-slate-400 font-mono">Status: <span className={quote.status === 'Approved' ? 'text-green-600' : 'text-red-500'}>{quote.status}</span></p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-navy">R{quote.amount}</span>
                  <button
                    type="button"
                    onClick={() => handleDownloadPDF('quotation', quote.id)}
                    className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-400 hover:text-navy"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG */}
      <ConfirmDialog 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmAction}
        title={confirmMode === 'approve' ? 'Approve Quotation?' : 'Decline Quotation?'}
        message={
          confirmMode === 'approve' 
            ? 'Are you sure you want to approve this quotation? This will confirm your willingness to pay the pre-compliance repair costs.'
            : 'Are you sure you want to decline this quotation? Declining compliance repairs will halt your onboarding progress.'
        }
        confirmText={confirmMode === 'approve' ? 'Approve' : 'Decline'}
        isDestructive={confirmMode === 'decline'}
      />
    </div>
  );
}
