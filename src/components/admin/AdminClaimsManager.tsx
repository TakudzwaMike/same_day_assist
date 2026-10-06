import React, { useState } from 'react';
import {
  ShieldAlert, Search, Filter, CheckCircle, XCircle, Clock,
  Eye, FileText, Download, Shield, AlertTriangle, User, Calendar,
  ArrowRight, Wrench, Check, X, RefreshCw
} from 'lucide-react';
import { useAppState } from '../../contexts/AppStateContext';
import { api } from '../../services/api';
import { Claim, Invoice } from '../../types';
import EmptyState from '../shared/EmptyState';

export default function AdminClaimsManager() {
  const { state, refreshData, addAuditLogLocal } = useAppState();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [planFilter, setPlanFilter] = useState<string>('ALL');
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Review action form state
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT' | 'IN_PROGRESS'>('APPROVE');
  const [approvedAmount, setApprovedAmount] = useState<number>(0);
  const [deductFromBenefit, setDeductFromBenefit] = useState<number>(0);
  const [customerPayable, setCustomerPayable] = useState<number>(0);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isOverride, setIsOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const claims = state.claims || [];

  // Filtered claims
  const filteredClaims = claims.filter(c => {
    const matchesSearch = 
      c.claimNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.serviceType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contractorName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesPlan = planFilter === 'ALL' || c.membershipPlan === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  // Aggregations
  const totalClaims = claims.length;
  const pendingCount = claims.filter(c => c.status === 'Submitted' || c.status === 'Under Review').length;
  const approvedCount = claims.filter(c => c.status === 'Approved' || c.status === 'Completed').length;
  const totalBenefitDeducted = claims
    .filter(c => c.status === 'Approved' || c.status === 'Completed')
    .reduce((sum, c) => sum + (c.amountDeductedFromBenefit || 0), 0);

  const fmt = (num?: number) => `R${(num || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleOpenReview = (claim: Claim) => {
    setSelectedClaim(claim);
    const claimed = claim.amountClaimed || 0;
    setApprovedAmount(claimed);
    setDeductFromBenefit(claim.amountDeductedFromBenefit || claimed);
    setCustomerPayable(claimed > (claim.amountDeductedFromBenefit || 0) ? claimed - (claim.amountDeductedFromBenefit || 0) : 0);
    setAdminNotes(claim.adminNotes || '');
    setRejectionReason(claim.rejectionReason || '');
    setIsOverride(false);
    setOverrideReason('');
    setReviewAction('APPROVE');
    setIsReviewModalOpen(true);
  };

  const handleCalculateCoverage = async (claim: Claim, amount: number) => {
    try {
      const res = await api.calculateCoverage({
        userId: claim.customerId,
        amount,
        serviceType: claim.serviceType,
      });
      setDeductFromBenefit(res.coveredAmount);
      setCustomerPayable(res.customerPayable);
      if (res.exceededBy > 0) {
        setIsOverride(true);
        setOverrideReason(`Requested R${amount} exceeds remaining benefit allowance of R${res.availableBenefit}. Exceeded by R${res.exceededBy}.`);
      } else {
        setIsOverride(false);
        setOverrideReason('');
      }
    } catch (err: any) {
      console.warn('Auto coverage calculation failed, using fallback', err);
    }
  };

  const handleSubmitReview = async () => {
    if (!selectedClaim) return;
    setIsSubmittingReview(true);
    try {
      let finalStatus: Claim['status'] = 'Approved';
      if (reviewAction === 'REJECT') finalStatus = 'Rejected';
      else if (reviewAction === 'IN_PROGRESS') finalStatus = 'In Progress';

      await api.reviewClaim(selectedClaim.id, {
        status: finalStatus,
        approvedAmount: reviewAction === 'APPROVE' ? approvedAmount : 0,
        amountDeductedFromBenefit: reviewAction === 'APPROVE' ? deductFromBenefit : 0,
        adminNotes,
        rejectionReason: reviewAction === 'REJECT' ? rejectionReason : undefined,
        isOverride: reviewAction === 'APPROVE' && isOverride,
        overrideReason: reviewAction === 'APPROVE' && isOverride ? overrideReason : undefined,
      });

      addAuditLogLocal(
        'Claim Reviewed',
        `Admin reviewed claim ${selectedClaim.claimNumber}: Marked ${finalStatus}. Benefit deducted: ${fmt(deductFromBenefit)}.`
      );

      await refreshData();
      setIsReviewModalOpen(false);
      setSelectedClaim(null);
      alert(`Claim ${selectedClaim.claimNumber} successfully updated to status: ${finalStatus}`);
    } catch (err: any) {
      alert(err.message || 'Failed to submit claim review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-black italic tracking-wide uppercase font-brand-header text-navy">
            Annual Benefit Claims Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit, review, and approve customer service claims with automated benefit ledger deduction and admin overrides
          </p>
        </div>
        <button
          type="button"
          onClick={() => refreshData()}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-navy text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Claims</span>
        </button>
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Claims</span>
          <span className="text-2xl font-black font-brand-header text-navy mt-1 block">
            {totalClaims}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">Platform-wide lifetime claims</span>
        </div>

        <div className="bg-amber-50/70 p-4 sm:p-5 rounded-2xl border border-amber-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">Pending Review</span>
          <span className="text-2xl font-black font-brand-header text-amber-800 mt-1 block">
            {pendingCount}
          </span>
          <span className="text-[10px] text-amber-700 font-medium mt-1 block">Requires admin action</span>
        </div>

        <div className="bg-emerald-50/70 p-4 sm:p-5 rounded-2xl border border-emerald-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block">Approved / Completed</span>
          <span className="text-2xl font-black font-brand-header text-emerald-700 mt-1 block">
            {approvedCount}
          </span>
          <span className="text-[10px] text-emerald-700 font-medium mt-1 block">Processed successfully</span>
        </div>

        <div className="bg-navy/5 p-4 sm:p-5 rounded-2xl border border-navy/15 shadow-2xs">
          <span className="text-[10px] font-bold text-navy uppercase tracking-wider block">Annual Benefits Absorbed</span>
          <span className="text-2xl font-black font-brand-header text-navy mt-1 block">
            {fmt(totalBenefitDeducted)}
          </span>
          <span className="text-[10px] text-navy/70 font-medium mt-1 block">Total ledger debits</span>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search claim #, customer, tech, service..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-navy text-slate-800 font-medium"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-navy focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Review">Under Review</option>
              <option value="In Progress">In Progress</option>
              <option value="Approved">Approved</option>
              <option value="Completed">Completed</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Plan:</span>
            <select
              value={planFilter}
              onChange={e => setPlanFilter(e.target.value)}
              className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-navy focus:outline-none"
            >
              <option value="ALL">All Plans</option>
              <option value="Assist">Assist (R799)</option>
              <option value="Assist Plus">Assist Plus (R1,499)</option>
              <option value="Assist Pro">Assist Pro (R2,999)</option>
              <option value="Assist Elite">Assist Elite (R3,499)</option>
              <option value="Residential Advanced">Residential Advanced (R4,999)</option>
              <option value="Business Advanced">Business Advanced (R8,999)</option>
            </select>
          </div>
        </div>
      </div>

      {/* CLAIMS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {filteredClaims.length === 0 ? (
          <div className="p-8 text-center">
            <EmptyState
              icon={ShieldAlert}
              title="No Claims Found"
              description="No service claims match your active search and filter parameters."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100/80 text-slate-600 font-mono text-[10px] uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Claim Ref</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Customer & Plan</th>
                  <th className="p-3.5">Service Details</th>
                  <th className="p-3.5 text-right">Claimed</th>
                  <th className="p-3.5 text-right">Benefit Deducted</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClaims.map(claim => {
                  const isPending = claim.status === 'Submitted' || claim.status === 'Under Review';
                  const isApproved = claim.status === 'Approved' || claim.status === 'Completed';

                  return (
                    <tr key={claim.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-navy whitespace-nowrap">
                        {claim.claimNumber}
                      </td>
                      <td className="p-3.5 text-slate-500 font-mono whitespace-nowrap">
                        {claim.createdAt ? new Date(claim.createdAt).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-slate-800 block">{claim.customerName}</span>
                        <span className="text-[10px] font-mono text-red-600 font-bold block">{claim.membershipPlan}</span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-slate-700 block">{claim.serviceType}</span>
                        <span className="text-[10px] text-slate-500 line-clamp-1 max-w-xs">{claim.description}</span>
                        {claim.contractorName && (
                          <span className="text-[9.5px] font-mono text-slate-400 block">Tech: {claim.contractorName}</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-800">
                        {fmt(claim.amountClaimed)}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-emerald-600">
                        {claim.amountDeductedFromBenefit ? fmt(claim.amountDeductedFromBenefit) : '-'}
                      </td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <span className={`text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full font-mono tracking-wider ${
                          isApproved
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : isPending
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : claim.status === 'Rejected'
                            ? 'bg-red-100 text-red-800 border border-red-300'
                            : 'bg-blue-100 text-blue-800 border border-blue-300'
                        }`}>
                          ● {claim.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenReview(claim)}
                            className="px-3 py-1.5 bg-navy hover:bg-navy-light text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{isPending ? 'Review' : 'View'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CLAIM REVIEW & AUDIT MODAL */}
      {isReviewModalOpen && selectedClaim && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto animate-scaleUp">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex justify-between items-start bg-slate-50/50 rounded-t-3xl">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-red-600 tracking-wider block">
                  Admin Claim Audit & Benefit Deductions
                </span>
                <h3 className="text-xl font-black font-brand-header text-navy mt-0.5">
                  Review Claim: {selectedClaim.claimNumber}
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  Logged {selectedClaim.createdAt ? new Date(selectedClaim.createdAt).toLocaleString('en-ZA') : '—'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => { setIsReviewModalOpen(false); setSelectedClaim(null); }}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Member & Plan Info */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Member</span>
                  <span className="font-bold text-slate-800 block mt-0.5">{selectedClaim.customerName}</span>
                  <span className="text-slate-500 block">{selectedClaim.customerEmail}</span>
                  {selectedClaim.propertyAddress && (
                    <span className="text-slate-500 block mt-0.5">{selectedClaim.propertyAddress}</span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Plan & Vehicle</span>
                  <span className="font-bold text-navy block mt-0.5">{selectedClaim.membershipPlan}</span>
                  {selectedClaim.vehicleDetails && (
                    <span className="text-slate-600 block mt-0.5">Asset: {selectedClaim.vehicleDetails}</span>
                  )}
                  {selectedClaim.contractorName && (
                    <span className="text-slate-600 block">Assigned Tech: {selectedClaim.contractorName}</span>
                  )}
                </div>
              </div>

              {/* Service Description */}
              <div>
                <h4 className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                  Incident / Repair Scope
                </h4>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs text-slate-800 leading-relaxed">
                  <div className="font-bold text-navy mb-1">{selectedClaim.serviceType}</div>
                  <p>{selectedClaim.description}</p>
                </div>
              </div>

              {/* Cost Claimed Breakdown */}
              <div className="grid grid-cols-3 gap-3 bg-slate-900 text-white p-4 rounded-2xl">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Labour Cost</span>
                  <span className="text-base font-bold font-mono mt-0.5 block">{fmt(selectedClaim.labourCost)}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Parts Cost</span>
                  <span className="text-base font-bold font-mono mt-0.5 block">{fmt(selectedClaim.partsCost)}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Total Claimed</span>
                  <span className="text-base font-black font-mono text-red-400 mt-0.5 block">{fmt(selectedClaim.amountClaimed)}</span>
                </div>
              </div>

              {/* Review Decision Controls */}
              <div className="space-y-4 pt-2 border-t border-slate-200">
                <h4 className="text-xs font-bold text-navy uppercase tracking-wider">
                  Select Audit Action:
                </h4>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewAction('APPROVE')}
                    className={`py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      reviewAction === 'APPROVE'
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    ✓ Approve & Deduct
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewAction('IN_PROGRESS')}
                    className={`py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      reviewAction === 'IN_PROGRESS'
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    ● Set In Progress
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewAction('REJECT')}
                    className={`py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      reviewAction === 'REJECT'
                        ? 'bg-red-600 border-red-600 text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    ✕ Reject Claim
                  </button>
                </div>

                {reviewAction === 'APPROVE' && (
                  <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-navy uppercase text-[10px]">Benefit Deduction Allocation</span>
                      <button
                        type="button"
                        onClick={() => handleCalculateCoverage(selectedClaim, approvedAmount)}
                        className="text-[10px] font-bold text-red-600 hover:underline cursor-pointer"
                      >
                        Auto-Calculate Limits
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Approved Total</label>
                        <input
                          type="number"
                          value={approvedAmount}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            setApprovedAmount(val);
                            handleCalculateCoverage(selectedClaim, val);
                          }}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-emerald-700 uppercase block mb-1">Deduct From Benefit</label>
                        <input
                          type="number"
                          value={deductFromBenefit}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            setDeductFromBenefit(val);
                            setCustomerPayable(approvedAmount > val ? approvedAmount - val : 0);
                          }}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-emerald-700"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Customer Payable</label>
                        <input
                          type="number"
                          value={customerPayable}
                          onChange={e => setCustomerPayable(parseFloat(e.target.value) || 0)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                        />
                      </div>
                    </div>

                    {/* Admin Override Checkbox */}
                    <div className="pt-2 border-t border-slate-200">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isOverride}
                          onChange={e => setIsOverride(e.target.checked)}
                          className="w-4 h-4 rounded text-navy focus:ring-navy cursor-pointer"
                        />
                        <span className="font-bold text-red-600 text-xs">
                          Authorise Administrative Benefit Limit Override
                        </span>
                      </label>

                      {isOverride && (
                        <div className="mt-2 space-y-1 animate-fadeIn">
                          <label className="text-[10px] font-mono text-slate-500 uppercase block">
                            Mandatory Override Reason (Audited in Benefit Ledger):
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Special executive waiver granted by director"
                            value={overrideReason}
                            onChange={e => setOverrideReason(e.target.value)}
                            className="w-full p-2 bg-white border border-red-300 rounded-lg text-xs"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {reviewAction === 'REJECT' && (
                  <div className="space-y-1.5 animate-fadeIn">
                    <label className="text-[10px] font-bold text-slate-600 uppercase block">
                      Rejection Reason (Sent to Customer):
                    </label>
                    <textarea
                      rows={3}
                      placeholder="State reason for rejecting claim..."
                      value={rejectionReason}
                      onChange={e => setRejectionReason(e.target.value)}
                      className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-red-500"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-600 uppercase block">
                    Internal Admin Audit Notes (Optional):
                  </label>
                  <input
                    type="text"
                    placeholder="Internal reference notes..."
                    value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmittingReview || (reviewAction === 'APPROVE' && isOverride && !overrideReason.trim())}
                  onClick={handleSubmitReview}
                  className="px-6 py-2.5 bg-navy hover:bg-navy-light disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  {isSubmittingReview ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Review...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Commit Review Decision</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
