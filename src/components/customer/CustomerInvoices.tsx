import React, { useState } from 'react';
import {
  CreditCard, FileText, Download, CheckCircle, AlertTriangle,
  Eye, Shield, ArrowRight, X, Calendar, User, Wrench, Clock,
  DollarSign, Check, ExternalLink
} from 'lucide-react';
import { useAppState } from '../../contexts/AppStateContext';
import { api } from '../../services/api';
import { Invoice } from '../../types';
import EmptyState from '../shared/EmptyState';
import ConfirmDialog from '../shared/ConfirmDialog';

interface CustomerInvoicesProps {
  activeCustomer: any;
  onNavigateTab?: (tab: any) => void;
}

export default function CustomerInvoices({ activeCustomer, onNavigateTab }: CustomerInvoicesProps) {
  const { state, approveQuotation, declineQuotation, payInvoice, addAuditLogLocal } = useAppState();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'EFT' | 'OZOW'>('CARD');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Pre-compliance quotes
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmMode, setConfirmMode] = useState<'approve' | 'decline'>('approve');

  // Filter real invoices for current customer
  const realInvoices = state.invoices || [];
  const pendingQuotations = state.quotations.filter(q => q.status === 'Pending');
  const historicalQuotations = state.quotations.filter(q => q.status !== 'Pending');

  // Currency helper
  const fmt = (num?: number) => `R${(num || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Summary figures
  const totalInvoiced = realInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  const totalBenefitCovered = realInvoices.reduce((sum, inv) => sum + (inv.amountCoveredByBenefit || 0), 0);
  const totalCustomerPayable = realInvoices.reduce((sum, inv) => sum + (inv.amountPayableByCustomer || 0), 0);
  const totalCustomerPaid = realInvoices
    .filter(inv => inv.paymentStatus === 'PAID')
    .reduce((sum, inv) => sum + (inv.amountPayableByCustomer || 0), 0);
  const outstandingPayable = realInvoices
    .filter(inv => inv.paymentStatus === 'UNPAID' || inv.paymentStatus === 'PARTIALLY_PAID')
    .reduce((sum, inv) => sum + (inv.amountPayableByCustomer || 0), 0);

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
    const url = api.getPDFUrl(type, id);
    window.open(url, '_blank');
    addAuditLogLocal('PDF Downloaded', `Customer downloaded PDF for ${type}: ${id}`);
  };

  const handleOpenPay = (invoice: Invoice) => {
    setPayingInvoice(invoice);
    setIsPayModalOpen(true);
  };

  const handleExecutePayment = async () => {
    if (!payingInvoice) return;
    setIsProcessingPayment(true);
    try {
      await payInvoice(payingInvoice.id, paymentMethod);
      addAuditLogLocal('Invoice Paid', `Customer settled payable amount ${fmt(payingInvoice.amountPayableByCustomer)} for invoice ${payingInvoice.invoiceNumber}`);
      alert(`Payment of ${fmt(payingInvoice.amountPayableByCustomer)} successful! Invoice ${payingInvoice.invoiceNumber} is marked PAID.`);
      setIsPayModalOpen(false);
      setPayingInvoice(null);
      if (selectedInvoice?.id === payingInvoice.id) {
        setSelectedInvoice(prev => prev ? { ...prev, paymentStatus: 'PAID', invoiceStatus: 'PAID' } : null);
      }
    } catch (err: any) {
      alert(err.message || 'Payment processing failed');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-xl font-black italic tracking-wide uppercase font-brand-header text-navy">
            My Invoices & Billing
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent breakdown of services, Annual Assistance Benefit coverage, and customer-payable balances
          </p>
        </div>
        {state.benefitSummary && (
          <div className="bg-navy/5 border border-navy/10 px-3.5 py-1.5 rounded-xl flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-navy" />
            <span className="text-[11px] font-mono font-bold text-navy">
              Plan: {state.benefitSummary.planName}
            </span>
          </div>
        )}
      </div>

      {/* FINANCIAL SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Billed</span>
          <span className="text-xl sm:text-2xl font-black font-brand-header text-navy mt-1 block">
            {fmt(totalInvoiced)}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">Across {realInvoices.length} invoices</span>
        </div>

        <div className="bg-emerald-50/60 p-4 sm:p-5 rounded-2xl border border-emerald-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Covered By Benefit</span>
          <span className="text-xl sm:text-2xl font-black font-brand-header text-emerald-700 mt-1 block">
            {fmt(totalBenefitCovered)}
          </span>
          <span className="text-[10px] text-emerald-700 font-medium mt-1 block">Directly absorbed by plan</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Customer Settled</span>
          <span className="text-xl sm:text-2xl font-black font-brand-header text-navy mt-1 block">
            {fmt(totalCustomerPaid)}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">Excess/uncovered portions</span>
        </div>

        <div className={`p-4 sm:p-5 rounded-2xl border shadow-2xs ${
          outstandingPayable > 0 
            ? 'bg-red-50/70 border-red-200 text-red-900' 
            : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          <span className="text-[10px] font-bold uppercase tracking-wider block">Outstanding Due</span>
          <span className={`text-xl sm:text-2xl font-black font-brand-header mt-1 block ${
            outstandingPayable > 0 ? 'text-red-700' : 'text-slate-700'
          }`}>
            {fmt(outstandingPayable)}
          </span>
          <span className="text-[10px] font-medium mt-1 block">
            {outstandingPayable > 0 ? 'Action required' : 'All accounts settled'}
          </span>
        </div>
      </div>

      {/* REAL SERVICE INVOICES LIST */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-red" />
            <span>Official Tax Invoices</span>
          </h3>
          <span className="text-[10px] font-mono text-slate-400">
            {realInvoices.length} {realInvoices.length === 1 ? 'record' : 'records'}
          </span>
        </div>

        {realInvoices.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No Invoices Issued Yet"
            description="When a technician completes a dispatched service or repair, an itemized tax invoice will be generated and displayed here with benefit allocations."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {realInvoices.map(invoice => {
              const isPaid = invoice.paymentStatus === 'PAID';
              const hasPayable = (invoice.amountPayableByCustomer || 0) > 0;
              const hasBenefitCoverage = (invoice.amountCoveredByBenefit || 0) > 0;

              return (
                <div
                  key={invoice.id}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-xs transition-all p-4 sm:p-5 flex flex-col gap-4"
                >
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black font-brand-header text-navy">
                          {invoice.invoiceNumber}
                        </span>
                        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full font-mono tracking-wider ${
                          isPaid 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                            : hasPayable
                            ? 'bg-red-100 text-red-800 border border-red-300'
                            : 'bg-blue-100 text-blue-800 border border-blue-300'
                        }`}>
                          ● {invoice.paymentStatus}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono mt-1">
                        <span>Issued: {invoice.issueDate || invoice.date ? new Date(invoice.issueDate || invoice.date || '').toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
                        {invoice.serviceType && <span>• {invoice.serviceType}</span>}
                        {invoice.contractorName && <span>• Tech: {invoice.contractorName}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => setSelectedInvoice(invoice)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-navy text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadPDF('invoice', invoice.id)}
                        className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-navy border border-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                        title="Download Tax PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>
                    </div>
                  </div>

                  {/* Financial Breakdown Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-500 font-mono uppercase block">Total Service</span>
                      <span className="text-sm font-bold text-slate-800 font-mono mt-0.5 block">
                        {fmt(invoice.totalAmount)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-emerald-700 font-mono uppercase block">Benefit Covered</span>
                      <span className="text-sm font-bold text-emerald-600 font-mono mt-0.5 block">
                        {hasBenefitCoverage ? `-${fmt(invoice.amountCoveredByBenefit)}` : 'R0.00'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 font-mono uppercase block">Customer Payable</span>
                      <span className={`text-sm font-bold font-mono mt-0.5 block ${
                        hasPayable ? 'text-red-600' : 'text-slate-600'
                      }`}>
                        {fmt(invoice.amountPayableByCustomer)}
                      </span>
                    </div>

                    <div className="flex items-center justify-end">
                      {!isPaid && hasPayable ? (
                        <button
                          type="button"
                          onClick={() => handleOpenPay(invoice)}
                          className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Pay {fmt(invoice.amountPayableByCustomer)}</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          <span>Settled in Full</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Explanation Banner */}
                  <div className="text-[11px] text-slate-600 flex items-center justify-between">
                    <div>
                      {invoice.amountPayableByCustomer === 0 ? (
                        <span className="text-emerald-700 font-medium">
                          ✓ Fully covered under your <strong>{invoice.membershipPlan}</strong> Annual Assistance Benefit allowance. Customer responsibility is R0.00.
                        </span>
                      ) : invoice.amountCoveredByBenefit > 0 ? (
                        <span className="text-slate-600">
                          ℹ️ {fmt(invoice.amountCoveredByBenefit)} covered by your Annual Assistance Benefit. Remaining balance of {fmt(invoice.amountPayableByCustomer)} is payable by customer (exceeded allowance or parts exclusion).
                        </span>
                      ) : (
                        <span className="text-amber-800">
                          ℹ️ Billed to member account under <strong>{invoice.membershipPlan}</strong> plan terms.
                        </span>
                      )}
                    </div>
                    {invoice.claimId && (
                      <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-2">
                        Claim Ref: {invoice.claimId}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PENDING ONBOARDING QUOTATIONS (Preserved for existing flow) */}
      {pendingQuotations.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <h4 className="text-xs font-extrabold text-navy uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Awaiting Verification Approval (Onboarding Pre-Compliance)</span>
          </h4>
          <div className="flex flex-col gap-3">
            {pendingQuotations.map(quote => (
              <div key={quote.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-3">
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block">Pre-Compliance Repair Quote</span>
                    <span className="text-[9.5px] text-slate-500 font-mono">ID: {quote.id}</span>
                  </div>
                  <span className="font-brand-header text-red text-sm font-bold">R{quote.amount}</span>
                </div>
                <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {quote.lineItems.map(item => (
                    <div key={item.id} className="flex justify-between items-center text-[10px] text-slate-600">
                      <span>{item.description}</span>
                      <span className="font-bold">R{item.cost}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => handleActionClick(quote.id, 'decline')}
                    className="flex-1 py-2 text-xs font-bold text-slate-600 hover:text-red hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer"
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
          </div>
        </div>
      )}

      {/* ARCHIVED / HISTORICAL QUOTATIONS */}
      {historicalQuotations.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Archived Quotes</h4>
          <div className="flex flex-col gap-2">
            {historicalQuotations.map(quote => (
              <div key={quote.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-3xs flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-slate-700">Audit Quote: {quote.id}</p>
                  <p className="text-[9px] text-slate-400 font-mono">
                    Status: <span className={quote.status === 'Approved' ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>{quote.status}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-navy">R{quote.amount}</span>
                  <button
                    type="button"
                    onClick={() => handleDownloadPDF('quotation', quote.id)}
                    className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-400 hover:text-navy cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INVOICE DETAIL MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto animate-scaleUp">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 flex justify-between items-start bg-slate-50/50 rounded-t-3xl">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-red-600 tracking-wider block">
                  Same Day Assist • Tax Invoice
                </span>
                <h3 className="text-xl font-black font-brand-header text-navy mt-0.5">
                  {selectedInvoice.invoiceNumber}
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  Issued: {selectedInvoice.issueDate || selectedInvoice.date ? new Date(selectedInvoice.issueDate || selectedInvoice.date || '').toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="p-2 hover:bg-slate-200/80 rounded-full text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Customer & Plan Info */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Billed To</span>
                  <span className="font-bold text-slate-800 block mt-0.5">{selectedInvoice.customerName}</span>
                  <span className="text-slate-500 block">{selectedInvoice.customerEmail}</span>
                  {selectedInvoice.customerAddress && (
                    <span className="text-slate-500 block text-[11px] mt-0.5">{selectedInvoice.customerAddress}</span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Membership & Plan</span>
                  <span className="font-bold text-navy block mt-0.5">{selectedInvoice.membershipPlan}</span>
                  {selectedInvoice.serviceType && (
                    <span className="text-slate-600 block mt-0.5">Service: {selectedInvoice.serviceType}</span>
                  )}
                  {selectedInvoice.contractorName && (
                    <span className="text-slate-600 block">Technician: {selectedInvoice.contractorName}</span>
                  )}
                </div>
              </div>

              {/* Service description */}
              {selectedInvoice.serviceDescription && (
                <div>
                  <h4 className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                    Service Scope & Findings
                  </h4>
                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                    {selectedInvoice.serviceDescription}
                  </p>
                </div>
              )}

              {/* Itemized Cost Table */}
              <div>
                <h4 className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2">
                  Line Items & Charges
                </h4>
                <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                  <table className="w-full">
                    <thead className="bg-slate-100 text-slate-600 font-mono text-[10px] uppercase text-left">
                      <tr>
                        <th className="p-3">Item Description</th>
                        <th className="p-3 text-right">Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-3">
                          <span className="font-bold text-slate-800 block">Labour & Fault Finding</span>
                          <span className="text-[10px] text-slate-500">Certified technician labor and diagnostics</span>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-700">
                          {fmt(selectedInvoice.labourCost)}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3">
                          <span className="font-bold text-slate-800 block">Replacement Parts & Hardware</span>
                          <span className="text-[10px] text-slate-500">Hardware, sensors, batteries or components</span>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-700">
                          {fmt(selectedInvoice.partsCost)}
                        </td>
                      </tr>
                      {(selectedInvoice.otherCharges || 0) > 0 && (
                        <tr>
                          <td className="p-3">
                            <span className="font-bold text-slate-800 block">Consumables & Sundries</span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-700">
                            {fmt(selectedInvoice.otherCharges)}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Settlement Calculation */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3">
                <div className="flex justify-between items-center text-xs text-slate-300">
                  <span>Subtotal:</span>
                  <span className="font-mono">{fmt(selectedInvoice.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-300">
                  <span>VAT (15% Included):</span>
                  <span className="font-mono">{fmt(selectedInvoice.taxAmount)}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold text-white pt-2 border-t border-slate-800">
                  <span>Total Invoice Amount:</span>
                  <span className="font-mono text-base">{fmt(selectedInvoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-emerald-400 pt-1">
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" /> Covered by Annual Assistance Benefit:
                  </span>
                  <span className="font-mono font-bold">-{fmt(selectedInvoice.amountCoveredByBenefit)}</span>
                </div>
                <div className="flex justify-between items-center text-base font-black text-white pt-3 border-t border-slate-800">
                  <span>Amount Payable by Customer:</span>
                  <span className={`font-mono text-lg ${
                    selectedInvoice.amountPayableByCustomer > 0 ? 'text-red-400' : 'text-emerald-400'
                  }`}>
                    {fmt(selectedInvoice.amountPayableByCustomer)}
                  </span>
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
                <div className="text-xs">
                  <span className="text-slate-500">Payment Status: </span>
                  <span className={`font-bold font-mono uppercase ${
                    selectedInvoice.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {selectedInvoice.paymentStatus}
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handleDownloadPDF('invoice', selectedInvoice.id)}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </button>

                  {selectedInvoice.paymentStatus !== 'PAID' && selectedInvoice.amountPayableByCustomer > 0 && (
                    <button
                      type="button"
                      onClick={() => handleOpenPay(selectedInvoice)}
                      className="flex-1 sm:flex-none px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Pay Now</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUICK PAYMENT MODAL */}
      {isPayModalOpen && payingInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-5 animate-scaleUp">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-red-600 tracking-wider">
                  Secure Checkout
                </span>
                <h3 className="text-lg font-black font-brand-header text-navy mt-0.5">
                  Pay Customer Portion
                </h3>
                <p className="text-xs text-slate-500">
                  Invoice {payingInvoice.invoiceNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setIsPayModalOpen(false); setPayingInvoice(null); }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Total Invoice:</span>
                <span className="font-mono">{fmt(payingInvoice.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-xs text-emerald-700">
                <span>Covered by Benefit:</span>
                <span className="font-mono">-{fmt(payingInvoice.amountCoveredByBenefit)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-navy pt-2 border-t border-slate-200">
                <span>Amount Due:</span>
                <span className="font-mono text-base text-red-600">{fmt(payingInvoice.amountPayableByCustomer)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase text-slate-500 tracking-wider block">
                Select Payment Method:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['CARD', 'OZOW', 'EFT'] as const).map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      paymentMethod === method
                        ? 'bg-navy border-navy text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {method === 'CARD' ? '💳 Card' : method === 'OZOW' ? '⚡ Ozow' : '🏦 Instant EFT'}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              disabled={isProcessingPayment}
              onClick={handleExecutePayment}
              className="w-full py-3.5 bg-red-600 hover:bg-red-500 disabled:bg-slate-400 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessingPayment ? (
                <span>Processing Payment...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Confirm & Pay {fmt(payingInvoice.amountPayableByCustomer)}</span>
                </>
              )}
            </button>

            <p className="text-[10px] text-center text-slate-400 font-mono">
              🔒 256-Bit SSL Encrypted • Same Day Assist Billing Gateway
            </p>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG FOR QUOTES */}
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
