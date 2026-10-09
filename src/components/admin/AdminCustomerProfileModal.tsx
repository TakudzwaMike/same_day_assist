import React, { useState, useEffect } from 'react';
import {
  X, User, Shield, FileText, CreditCard, Folder, History,
  TrendingDown, CheckCircle, CheckCircle2, AlertTriangle, Calendar, Clock,
  ArrowRight, Download, RefreshCw, PlusCircle, ShieldAlert, Zap, AlertCircle, Building2
} from 'lucide-react';
import { useAppState } from '../../contexts/AppStateContext';
import { api } from '../../services/api';
import { BenefitSummary, Claim, Invoice, Customer, PaymentTimeline } from '../../types';
import EmptyState from '../shared/EmptyState';

interface AdminCustomerProfileModalProps {
  customer: Customer;
  isOpen: boolean;
  onClose: () => void;
}

type ProfileTab = 'overview' | 'membership' | 'benefit' | 'claims' | 'invoices' | 'payments' | 'properties' | 'documents' | 'audit';

export default function AdminCustomerProfileModal({
  customer,
  isOpen,
  onClose,
}: AdminCustomerProfileModalProps) {
  const { state, refreshData, addAuditLogLocal } = useAppState();

  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [benefitSummary, setBenefitSummary] = useState<BenefitSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [timeline, setTimeline] = useState<PaymentTimeline | null>(null);
  const [isTriggeringBilling, setIsTriggeringBilling] = useState(false);
  const [customerLocations, setCustomerLocations] = useState<any[]>([]);

  // Override / Adjustment form state
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideAmount, setOverrideAmount] = useState(1000);
  const [overrideReason, setOverrideReason] = useState('');
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);

  // Period reset state
  const [isResetPeriodModalOpen, setIsResetPeriodModalOpen] = useState(false);
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);

  const fetchSummary = async () => {
    if (!customer?.id) return;
    setIsLoadingSummary(true);
    try {
      const summary = await api.getCustomerBenefitSummary(customer.id);
      setBenefitSummary(summary);
    } catch (err) {
      console.warn('Could not fetch customer benefit summary', err);
    }
    try {
      const tl = await api.getPaymentTimeline(customer.id);
      setTimeline(tl);
    } catch (err) {
      console.warn('Could not fetch customer payment timeline', err);
    }
    try {
      const locs = await api.getSavedLocations();
      setCustomerLocations(locs.filter((l: any) => l.userId === customer.id));
    } catch (err) {
      console.warn('Could not fetch customer saved locations', err);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const handleTriggerBilling = async () => {
    if (!customer?.id) return;
    setIsTriggeringBilling(true);
    try {
      const res = await api.triggerAdminBilling(customer.id);
      alert(`Billing triggered successfully: Stage ${res.stage}, Amount R${res.amount}, New Status: ${res.membershipStatus}`);
      await fetchSummary();
      await refreshData();
    } catch (err: any) {
      alert(err.message || 'Billing trigger failed');
    } finally {
      setIsTriggeringBilling(false);
    }
  };

  const handleRetryPayment = async (paymentId: string) => {
    try {
      await api.retryPayment(paymentId);
      alert('Payment retry processed successfully');
      await fetchSummary();
      await refreshData();
    } catch (err: any) {
      alert(err.message || 'Payment retry failed');
    }
  };

  useEffect(() => {
    if (isOpen && customer?.id) {
      fetchSummary();
    }
  }, [isOpen, customer?.id]);

  if (!isOpen || !customer) return null;

  const fmt = (num?: number) => `R${(num || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Related collections
  const customerClaims = (state.claims || []).filter(c => c.customerId === customer.id);
  const customerInvoices = (state.invoices || []).filter(i => i.customerId === customer.id);
  const customerPayments = (state.payments || []).filter(p => p.customerId === customer.id);
  const customerLogs = (state.auditLogs || []).filter(l => 
    l.details?.toLowerCase().includes(customer.name?.toLowerCase() || '') ||
    l.details?.toLowerCase().includes(customer.email?.toLowerCase() || '') ||
    l.user?.toLowerCase() === customer.name?.toLowerCase()
  );

  const handleAdminOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideReason.trim()) {
      alert('Override reason is strictly mandatory for audit compliance');
      return;
    }
    setIsSubmittingOverride(true);
    try {
      await api.overrideCustomerDeduction(customer.id, {
        amount: Number(overrideAmount),
        reason: overrideReason,
      });
      addAuditLogLocal('Benefit Override Authorized', `Admin applied manual benefit override of ${fmt(overrideAmount)} for customer ${customer.name}. Reason: ${overrideReason}`);
      await fetchSummary();
      await refreshData();
      setIsOverrideModalOpen(false);
      setOverrideReason('');
      alert(`Manual override of ${fmt(overrideAmount)} applied successfully.`);
    } catch (err: any) {
      alert(err.message || 'Failed to apply override');
    } finally {
      setIsSubmittingOverride(false);
    }
  };

  const handleResetPeriod = async () => {
    setIsSubmittingReset(true);
    try {
      await api.resetCustomerBenefitPeriod(customer.id);
      addAuditLogLocal('Benefit Period Reset', `Admin initiated new benefit allowance period for customer ${customer.name}`);
      await fetchSummary();
      await refreshData();
      setIsResetPeriodModalOpen(false);
      alert('New annual benefit period initialized successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to reset period');
    } finally {
      setIsSubmittingReset(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden animate-scaleUp">
        {/* MODAL HEADER */}
        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500 font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black font-brand-header text-white uppercase">
                  {customer.name}
                </h3>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase">
                  {benefitSummary?.planName || (customer as any).package || 'Active Member'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                ID: {customer.id} • {customer.email} • {customer.phone}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 8 DEDICATED ADMIN TABS (Requirement 18) */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 flex items-center gap-1 overflow-x-auto text-xs font-bold text-slate-600">
          {[
            { id: 'overview', label: 'Overview', icon: User },
            { id: 'membership', label: 'Membership', icon: Shield },
            { id: 'benefit', label: 'Benefit Usage', icon: TrendingDown, badge: benefitSummary ? `${benefitSummary.usagePercentage.toFixed(0)}%` : undefined },
            { id: 'claims', label: 'Claims', icon: ShieldAlert, badge: customerClaims.length },
            { id: 'invoices', label: 'Invoices', icon: FileText, badge: customerInvoices.length },
            { id: 'payments', label: 'Payments', icon: CreditCard, badge: customerPayments.length },
            { id: 'properties', label: 'Properties & Sites', icon: Building2, badge: customerLocations.length },
            { id: 'audit', label: 'Activity / Audit Log', icon: History, badge: customerLogs.length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ProfileTab)}
              className={`py-3 px-3.5 flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'border-navy text-navy font-black bg-white shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-navy'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* MODAL TAB CONTENT */}
        <div className="p-6 flex-1 overflow-y-auto text-xs bg-slate-50/50">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Account Type</span>
                  <span className="text-sm font-bold text-navy mt-1 block">{(customer as any).accountType || 'Residential'}</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Membership Status</span>
                  <span className="text-sm font-bold text-emerald-600 mt-1 block uppercase">● {customer.status || 'Active'}</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Repairs Count</span>
                  <span className="text-sm font-bold text-navy mt-1 block">{customer.repairsCount || customerClaims.length}</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Total Fees Settled</span>
                  <span className="text-sm font-bold font-mono text-navy mt-1 block">{fmt(customer.totalPaid)}</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-navy uppercase tracking-wider">Contact & Address Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Primary Street Address</span>
                    <span className="font-semibold text-slate-800">{customer.address || 'Sandton, Johannesburg'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Direct Phone</span>
                    <span className="font-semibold text-slate-800">{customer.phone || '+27 82 555 1000'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Email Address</span>
                    <span className="font-semibold text-slate-800">{customer.email}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Onboarding State</span>
                    <span className="font-mono font-bold text-navy">{(customer as any).onboardingStatus || 'ACTIVE'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MEMBERSHIP */}
          {activeTab === 'membership' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-red-500 uppercase tracking-widest block">
                      CURRENT SUBSCRIPTION PLAN
                    </span>
                    <h3 className="text-2xl font-black font-brand-header text-white mt-1">
                      {benefitSummary?.planName || 'Assist Plus'}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">Monthly Subscription</span>
                    <span className="text-xl font-black font-brand-header text-white">
                      {fmt(benefitSummary?.monthlyPrice || 1499)} <span className="text-xs font-normal text-slate-400">/ mo</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">Annual Benefit</span>
                    <span className="text-base font-bold font-mono text-emerald-400 mt-0.5 block">
                      {benefitSummary?.isPartsBenefitZero ? 'R0 Parts Benefit' : fmt(benefitSummary?.annualBenefit)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">Benefit Period Start</span>
                    <span className="font-mono text-slate-300 mt-0.5 block">
                      {benefitSummary?.periodStart ? new Date(benefitSummary.periodStart).toLocaleDateString('en-ZA') : 'Active'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">Benefit Period End</span>
                    <span className="font-mono text-slate-300 mt-0.5 block">
                      {benefitSummary?.periodEnd ? new Date(benefitSummary.periodEnd).toLocaleDateString('en-ZA') : 'Active'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsResetPeriodModalOpen(true)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Reset Annual Benefit Period
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: BENEFIT USAGE & LEDGER (Requirement 15, 18, 20) */}
          {activeTab === 'benefit' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Top Progress bar and summary */}
              {benefitSummary && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-400 block">Annual Assistance Benefit Status</span>
                      <span className="text-lg font-black font-brand-header text-navy">
                        {fmt(benefitSummary.remainingBenefit)} Remaining
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block">Usage Ratio</span>
                      <span className="font-mono font-bold text-navy">
                        {benefitSummary.usagePercentage.toFixed(1)}% Used • {benefitSummary.remainingPercentage.toFixed(1)}% Left
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${Math.min(benefitSummary.usagePercentage, 100)}%` }}
                      className="bg-red-500 h-full transition-all duration-500"
                    />
                    <div
                      style={{ width: `${Math.min(benefitSummary.remainingPercentage, 100)}%` }}
                      className="bg-emerald-500 h-full transition-all duration-500"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center pt-2">
                    <div className="p-2.5 bg-slate-50 rounded-xl">
                      <span className="text-[10px] text-slate-400 uppercase block">Annual Allowance</span>
                      <span className="font-mono font-bold text-slate-800">{fmt(benefitSummary.annualBenefit)}</span>
                    </div>
                    <div className="p-2.5 bg-red-50 rounded-xl">
                      <span className="text-[10px] text-red-700 uppercase block">Total Used</span>
                      <span className="font-mono font-bold text-red-600">{fmt(benefitSummary.usedBenefit)}</span>
                    </div>
                    <div className="p-2.5 bg-emerald-50 rounded-xl">
                      <span className="text-[10px] text-emerald-700 uppercase block">Available Remaining</span>
                      <span className="font-mono font-bold text-emerald-600">{fmt(benefitSummary.remainingBenefit)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-4 h-4 text-red" />
                  <span>Double-Entry Benefit Ledger (Auditable)</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setIsOverrideModalOpen(true)}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Manual Ledger Adjustment / Override</span>
                </button>
              </div>

              {/* TRANSACTION LEDGER TABLE */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 font-mono text-[10px] uppercase border-b border-slate-200">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Reference</th>
                      <th className="p-3">Description</th>
                      <th className="p-3 text-right">Debit</th>
                      <th className="p-3 text-right">Credit</th>
                      <th className="p-3 text-right">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(benefitSummary?.transactions || []).map(tx => (
                      <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3 font-mono text-slate-500 whitespace-nowrap">
                          {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td className="p-3 font-mono font-bold text-navy whitespace-nowrap">
                          {tx.reference}
                        </td>
                        <td className="p-3 text-slate-700">
                          {tx.description}
                          {tx.notes && (
                            <span className="text-[10px] text-slate-400 block italic">{tx.notes}</span>
                          )}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-red-600">
                          {tx.debit > 0 ? fmt(tx.debit) : '-'}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-600">
                          {tx.credit > 0 ? fmt(tx.credit) : '-'}
                        </td>
                        <td className="p-3 text-right font-mono font-black text-slate-900">
                          {fmt(tx.balance)}
                        </td>
                      </tr>
                    ))}
                    {(!benefitSummary?.transactions || benefitSummary.transactions.length === 0) && (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400 font-mono">
                          No benefit transactions recorded for this member.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: CLAIMS */}
          {activeTab === 'claims' && (
            <div className="space-y-3 animate-fadeIn">
              {customerClaims.length === 0 ? (
                <EmptyState
                  icon={ShieldAlert}
                  title="No Claims Logged"
                  description="This customer has not submitted any service claims."
                />
              ) : (
                <div className="flex flex-col gap-2.5">
                  {customerClaims.map(claim => (
                    <div key={claim.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-navy">{claim.claimNumber}</span>
                          <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {claim.status}
                          </span>
                        </div>
                        <p className="text-slate-600 mt-1">{claim.serviceType}: {claim.description}</p>
                        <span className="text-[10px] font-mono text-slate-400">
                          Logged: {claim.createdAt ? new Date(claim.createdAt).toLocaleDateString('en-ZA') : '—'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono text-slate-400 uppercase block">Claimed / Deducted</span>
                        <span className="font-mono font-bold text-navy block">{fmt(claim.amountClaimed)}</span>
                        <span className="font-mono text-emerald-600 text-[11px] block">
                          Benefit: -{fmt(claim.amountDeductedFromBenefit)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: INVOICES */}
          {activeTab === 'invoices' && (
            <div className="space-y-3 animate-fadeIn">
              {customerInvoices.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No Invoices Issued"
                  description="No billing invoices recorded for this customer."
                />
              ) : (
                <div className="flex flex-col gap-2.5">
                  {customerInvoices.map(inv => (
                    <div key={inv.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-navy">{inv.invoiceNumber}</span>
                          <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                            inv.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            ● {inv.paymentStatus}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 block mt-1">
                          Date: {inv.issueDate || inv.date ? new Date(inv.issueDate || inv.date || '').toLocaleDateString('en-ZA') : '—'} • Plan: {inv.membershipPlan}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="font-mono font-bold text-slate-800 block">{fmt(inv.totalAmount)}</span>
                          <span className="font-mono text-emerald-600 text-[10px] block">Covered: -{fmt(inv.amountCoveredByBenefit)}</span>
                          <span className="font-mono text-red-600 text-[11px] font-bold block">Payable: {fmt(inv.amountPayableByCustomer)}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const url = api.getPDFUrl('invoice', inv.id);
                            window.open(url, '_blank');
                          }}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-navy rounded-xl cursor-pointer"
                          title="Download PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: PAYMENTS & ACTIVATION LIFECYCLE (Specification Section 20 & 21) */}
          {activeTab === 'payments' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Controls Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-mono font-bold text-red-600 uppercase tracking-widest block">
                    PAYMENT LIFECYCLE AUDIT & TIMELINE
                  </span>
                  <h4 className="text-base font-black font-brand-header text-navy mt-0.5">
                    Membership Billing Structure: 20% + 40% + 40%
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isTriggeringBilling}
                    onClick={handleTriggerBilling}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold font-mono transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5 text-white" />
                    <span>{isTriggeringBilling ? 'Processing...' : 'Trigger Next Billing Cycle'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fetchSummary()}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer"
                    title="Refresh payment data"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* OVERVIEW METRICS GRID (Specification Section 20) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Plan & Subscription</span>
                  <span className="text-sm font-bold text-navy mt-1 block">
                    {timeline?.planName || (customer as any).package || 'Assist Plus'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {fmt(timeline?.monthlyPrice || 1499)} / month
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Membership Status</span>
                  <span className={`text-sm font-bold mt-1 block ${timeline?.membershipStatus === 'Active' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {timeline?.membershipStatus === 'Active' ? 'ACTIVE' : `PENDING ACTIVATION (${timeline?.activationPercentage || 20}%)`}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {timeline?.membershipStatus === 'Active'
                      ? `Activated: ${timeline?.activationDate ? new Date(timeline.activationDate).toLocaleDateString('en-ZA') : 'Yes'}`
                      : 'Benefits Locked'}
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Total Collected</span>
                  <span className="text-sm font-bold text-emerald-600 mt-1 block font-mono">
                    {fmt(timeline?.totalCollected || 0)}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Outstanding: {fmt(Math.max(0, (timeline?.monthlyPrice || 1499) - (timeline?.totalCollected || 0)))}
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Next Billing Due</span>
                  <span className="text-sm font-bold text-navy mt-1 block font-mono">
                    {timeline?.nextPayment?.dueDate
                      ? new Date(timeline.nextPayment.dueDate).toLocaleDateString('en-ZA')
                      : timeline?.nextBillingDate
                      ? new Date(timeline.nextBillingDate).toLocaleDateString('en-ZA')
                      : 'Scheduled Monthly'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Amount: {fmt(timeline?.nextPayment?.amount || timeline?.monthlyPrice)}
                  </span>
                </div>
              </div>

              {/* VISUAL PAYMENT TIMELINE (Specification Section 21) */}
              <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-widest">
                      OFFICIAL PAYMENT TIMELINE
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    Cycle: {timeline?.activationCycleComplete ? 'Activation Complete' : 'In Activation'}
                  </span>
                </div>

                {/* Timeline Visual Flow */}
                <div className="space-y-3 pt-2">
                  {timeline?.timelineSteps && timeline.timelineSteps.length > 0 ? (
                    timeline.timelineSteps.map((step, idx) => {
                      const isPaid = step.status.toLowerCase() === 'paid' || step.status.toLowerCase() === 'successful';
                      const isFailed = step.status.toLowerCase() === 'failed';
                      const isPending = step.status.toLowerCase() === 'pending' || step.status.toLowerCase() === 'scheduled';

                      return (
                        <React.Fragment key={step.stage}>
                          <div className={`p-4 rounded-2xl border transition-all ${
                            isPaid
                              ? 'bg-slate-950/80 border-emerald-500/40'
                              : isFailed
                              ? 'bg-red-950/30 border-red-500/40'
                              : 'bg-slate-950/40 border-slate-800'
                          }`}>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono font-bold text-slate-400 uppercase">
                                    {step.date ? new Date(step.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase() : 'SCHEDULED'}
                                  </span>
                                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                                    {step.description}
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-400">
                                    ({step.percentage}%)
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="text-sm font-black font-mono text-white">
                                  {fmt(step.amount)}
                                </span>
                                {isPaid && (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> PAID
                                  </span>
                                )}
                                {isFailed && (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/40 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> FAILED
                                  </span>
                                )}
                                {isPending && (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> SCHEDULED
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Arrow down connector between stages */}
                          {idx < (timeline.timelineSteps?.length || 0) - 1 && (
                            <div className="flex justify-center text-slate-600 font-bold text-sm">
                              ↓
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <div className="text-xs text-slate-400 font-mono text-center py-4">
                      Timeline data unavailable.
                    </div>
                  )}

                  {/* Final Activation Milestone Box */}
                  <div className="flex justify-center text-slate-600 font-bold text-sm">
                    ↓
                  </div>
                  <div className={`p-4 rounded-2xl border text-center ${
                    timeline?.membershipStatus === 'Active'
                      ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400'
                  }`}>
                    <div className="text-xs font-mono font-bold tracking-widest uppercase">
                      {timeline?.membershipStatus === 'Active' ? '✓ MEMBERSHIP ACTIVE' : '○ MEMBERSHIP ACTIVE (PENDING 100% PAYMENT)'}
                    </div>
                    <div className="text-xs font-mono text-slate-300 mt-1">
                      Total activation collected: <strong className="text-white">{fmt(timeline?.totalCollected || 0)}</strong> / {fmt(timeline?.monthlyPrice || 1499)} (100%)
                    </div>
                  </div>
                </div>
              </div>

              {/* DETAILED TRANSACTIONS TABLE */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                  <h5 className="font-bold text-navy text-xs uppercase tracking-wider">
                    All Payment Transactions ({timeline?.payments?.length || customerPayments.length})
                  </h5>
                  <span className="text-[10px] font-mono text-slate-400">
                    Real-time Database Records
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Stage / Description</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Reference</th>
                        <th className="py-2.5 px-3">Invoice</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {timeline?.payments && timeline.payments.length > 0 ? (
                        timeline.payments.map(p => (
                          <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-3 font-mono text-slate-600">
                              {p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-ZA') : p.dueDate ? new Date(p.dueDate).toLocaleDateString('en-ZA') : '—'}
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-bold text-navy block">{p.description || p.paymentStage}</span>
                              <span className="text-[9.5px] font-mono text-slate-400 uppercase">{p.paymentStage}</span>
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-navy">
                              {fmt(p.amount)}
                            </td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold uppercase ${
                                p.status.toLowerCase() === 'paid' || p.status.toLowerCase() === 'successful'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : p.status.toLowerCase() === 'failed'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-500 text-[10px]">
                              {p.transactionRef || p.id.slice(0, 10)}
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-500 text-[10px]">
                              {p.invoiceId || '—'}
                            </td>
                            <td className="py-3 px-3 text-right">
                              {p.status.toLowerCase() === 'failed' && (
                                <button
                                  type="button"
                                  onClick={() => handleRetryPayment(p.id)}
                                  className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-bold cursor-pointer"
                                >
                                  Retry
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-slate-400 font-mono">
                            No payment transactions recorded for this customer.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: PROPERTIES & SITES */}
          {activeTab === 'properties' && (
            <div className="space-y-3 animate-fadeIn">
              {customerLocations.length === 0 ? (
                <EmptyState
                  icon={Building2}
                  title="No Registered Properties"
                  description="Customer has not registered property or site locations."
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {customerLocations.map((loc: any) => (
                    <div key={loc.id} className="bg-white p-4 rounded-2xl border border-slate-200">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-navy text-sm">{loc.label}</span>
                        <span className="font-mono font-bold text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                          Site
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-2 space-y-0.5">
                        <p className="font-medium">{loc.address}</p>
                        {loc.accessNotes && <p className="text-slate-400 font-mono">Access: {loc.accessNotes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 8: AUDIT LOG */}
          {activeTab === 'audit' && (
            <div className="space-y-2 animate-fadeIn">
              {customerLogs.length === 0 ? (
                <EmptyState
                  icon={History}
                  title="No Specific Audit Logs"
                  description="No audit events associated with this customer profile."
                />
              ) : (
                <div className="flex flex-col gap-2">
                  {customerLogs.map(log => (
                    <div key={log.id} className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-navy block">{log.action}</span>
                        <span className="text-slate-600 block text-[11px]">{log.details}</span>
                        <span className="text-[10px] font-mono text-slate-400">By: {log.user || 'System'}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">
                        {log.timestamp}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-navy hover:bg-navy-light text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Close Profile
          </button>
        </div>
      </div>

      {/* OVERRIDE ADJUSTMENT SUB-MODAL */}
      {isOverrideModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4 animate-scaleUp">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono font-bold text-red-600 uppercase tracking-widest block">
                  ADMINISTRATIVE OVERRIDE
                </span>
                <h4 className="text-base font-black font-brand-header text-navy mt-0.5">
                  Record Manual Benefit Deduction
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsOverrideModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdminOverride} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase block">Override Deduction Amount (R)</label>
                <input
                  type="number"
                  required
                  value={overrideAmount}
                  onChange={e => setOverrideAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-navy"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase block">
                  Mandatory Audit Reason (Logged to Ledger) *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Special executive discretion applied by Operations Director for emergency repair..."
                  value={overrideReason}
                  onChange={e => setOverrideReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-red-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOverrideModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingOverride}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  {isSubmittingOverride ? <span>Applying...</span> : <span>Apply Override</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PERIOD SUB-MODAL */}
      {isResetPeriodModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4 animate-scaleUp">
            <h4 className="text-base font-black font-brand-header text-navy">
              Reset Annual Benefit Period?
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will close the current benefit period and establish a fresh annual allowance for <strong>{customer.name}</strong> according to their active plan. Historical ledger transactions will remain preserved.
            </p>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsResetPeriodModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingReset}
                onClick={handleResetPeriod}
                className="px-5 py-2 bg-navy hover:bg-navy-light disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                {isSubmittingReset ? <span>Resetting...</span> : <span>Confirm New Period</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
