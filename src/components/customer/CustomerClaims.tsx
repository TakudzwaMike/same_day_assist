import React, { useState } from 'react';
import {
  Shield, Plus, FileText, CheckCircle2, Clock, AlertTriangle,
  X, Download, Eye, ExternalLink, Calendar, MapPin, Wrench, Search, Filter
} from 'lucide-react';
import { Claim, BenefitSummary } from '../../types';
import { useAppState } from '../../contexts/AppStateContext';
import { useTheme } from '../../contexts/ThemeContext';
import { api } from '../../services/api';

interface CustomerClaimsProps {
  claims?: Claim[];
  benefitSummary?: BenefitSummary;
  onOpenInvoice?: (invoiceId: string) => void;
  onNavigateTab?: (tab: any) => void;
}

export function CustomerClaims({
  claims: propClaims,
  benefitSummary: propBenefitSummary,
  onOpenInvoice,
  onNavigateTab,
}: CustomerClaimsProps = {}) {
  const { state, createClaim } = useAppState();
  const { isDark } = useTheme();
  const claims = propClaims || state.claims || [];
  const benefitSummary = propBenefitSummary || state.benefitSummary;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);

  // New Claim Form State
  const [serviceType, setServiceType] = useState('Security Services');
  const [description, setDescription] = useState('');
  const [vehicleOrProperty, setVehicleOrProperty] = useState('');
  const [contractorName, setContractorName] = useState('');
  const [amountClaimed, setAmountClaimed] = useState('');
  const [partsAmount, setPartsAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coveragePreview, setCoveragePreview] = useState<any>(null);
  const [calculatingPreview, setCalculatingPreview] = useState(false);

  // Filtered claims
  const filteredClaims = claims.filter(c => {
    const matchesSearch =
      c.claimNumber.toLowerCase().includes(search.toLowerCase()) ||
      c.serviceType.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      (c.contractorName && c.contractorName.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || c.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const handleAmountChange = async (amount: string, parts: string) => {
    setAmountClaimed(amount);
    setPartsAmount(parts);
    const amtNum = parseFloat(amount);
    if (!isNaN(amtNum) && amtNum > 0) {
      setCalculatingPreview(true);
      try {
        const preview = await api.calculateCoverage({
          totalAmount: amtNum,
          partsAmount: parseFloat(parts || '0'),
        });
        setCoveragePreview(preview);
      } catch (e) {
        setCoveragePreview(null);
      } finally {
        setCalculatingPreview(false);
      }
    } else {
      setCoveragePreview(null);
    }
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceType || !description || !amountClaimed) {
      alert('Please fill in service type, description, and amount claimed.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createClaim({
        serviceType,
        description,
        vehicleOrProperty: vehicleOrProperty || undefined,
        contractorName: contractorName || undefined,
        amountClaimed: parseFloat(amountClaimed),
      });

      alert('Assistance claim submitted successfully! Our claims team is reviewing your claim against your annual assistance benefit.');
      setShowSubmitModal(false);
      setDescription('');
      setVehicleOrProperty('');
      setContractorName('');
      setAmountClaimed('');
      setPartsAmount('');
      setCoveragePreview(null);
    } catch (err: any) {
      alert(err.message || 'Failed to submit claim');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'completed':
        return <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase font-mono">Approved / Completed</span>;
      case 'submitted':
      case 'under review':
        return <span className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase font-mono">Under Review</span>;
      case 'in progress':
        return <span className="bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/40 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase font-mono">In Progress</span>;
      case 'rejected':
      case 'declined':
        return <span className="bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/40 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase font-mono">Rejected</span>;
      default:
        return <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase font-mono">{status}</span>;
    }
  };

  const fmt = (num?: number) => `R${(num || 0).toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header with Title and Submit Button */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-red" />
            <h3 className={`text-lg font-black uppercase font-brand-header tracking-wide ${
              isDark ? 'text-white' : 'text-navy'
            }`}>
              My Claims & Assistance History
            </h3>
          </div>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Track all repairs, services, and claims affecting your annual assistance benefit allowance.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowSubmitModal(true)}
          className="px-4 py-2.5 bg-red hover:bg-red/90 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Submit Assistance Claim</span>
        </button>
      </div>

      {/* Search and Status Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search claims by claim number, service, description..."
            className={`w-full border rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none transition-colors ${
              isDark 
                ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:border-red' 
                : 'bg-white border-slate-200 text-slate-900 focus:border-navy'
            }`}
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className={`border rounded-xl px-3 py-2 text-xs font-medium focus:outline-none transition-colors ${
              isDark 
                ? 'bg-slate-900 border-slate-800 text-slate-200 focus:border-red' 
                : 'bg-white border-slate-200 text-slate-700 focus:border-navy'
            }`}
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed / Approved</option>
            <option value="under review">Under Review</option>
            <option value="in progress">In Progress</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Claims List */}
      <div className="space-y-3">
        {filteredClaims.length === 0 ? (
          <div className={`p-12 text-center rounded-3xl border transition-colors ${
            isDark ? 'bg-slate-900/90 border-slate-800 text-slate-100' : 'bg-white border-slate-200 shadow-xs text-slate-700'
          }`}>
            <Shield className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>No Assistance Claims Found</p>
            <p className={`text-xs mt-1 max-w-sm mx-auto ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Any repair, emergency service, or hardware maintenance logged against your membership will be tracked here.
            </p>
          </div>
        ) : (
          filteredClaims.map(claim => (
            <div
              key={claim.id}
              className={`border rounded-2xl p-5 shadow-xs transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                isDark 
                  ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700' 
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Claim Details Left */}
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className={`font-mono font-black text-sm ${isDark ? 'text-red-400' : 'text-navy'}`}>
                    {claim.claimNumber}
                  </span>
                  {getStatusBadge(claim.status)}
                  <span className="text-[10px] text-slate-400 font-mono">
                    {claim.submittedAt || claim.createdAt ? new Date(claim.submittedAt || claim.createdAt || '').toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </span>
                </div>

                <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{claim.serviceType}</h4>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{claim.description}</p>

                <div className={`flex flex-wrap items-center gap-4 text-[11px] pt-1 font-mono ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  {claim.vehicleOrProperty && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{claim.vehicleOrProperty}</span>
                    </span>
                  )}
                  {claim.contractorName && (
                    <span className="flex items-center gap-1">
                      <Wrench className="w-3.5 h-3.5 text-slate-400" />
                      <span>{claim.contractorName}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Financial Deductions Right */}
              <div className={`flex md:flex-col items-end justify-between md:justify-center w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 gap-2 shrink-0 ${
                isDark ? 'border-slate-800' : 'border-slate-100'
              }`}>
                <div className="text-right">
                  <span className="text-[9.5px] font-mono text-slate-400 uppercase block">Total Claimed</span>
                  <span className={`text-sm font-bold font-mono ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{fmt(claim.amountClaimed)}</span>
                </div>

                <div className="text-right">
                  <span className="text-[9.5px] font-mono text-emerald-600 uppercase block font-bold">
                    Benefit Deducted
                  </span>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {fmt(claim.amountDeductedFromBenefit)}
                  </span>
                </div>

                {claim.customerResponsibility > 0 && (
                  <div className="text-right">
                    <span className="text-[9.5px] font-mono text-red uppercase block font-bold">
                      Customer Paid
                    </span>
                    <span className="text-xs font-bold text-red font-mono">
                      {fmt(claim.customerResponsibility)}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedClaim(claim)}
                    className={`p-1.5 rounded-lg text-xs font-bold border flex items-center gap-1 cursor-pointer transition-colors ${
                      isDark 
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Details</span>
                  </button>

                  {claim.invoice && onOpenInvoice && (
                    <button
                      type="button"
                      onClick={() => onOpenInvoice(claim.invoice!.id)}
                      className={`p-1.5 rounded-lg text-xs font-bold border flex items-center gap-1 cursor-pointer transition-colors ${
                        isDark 
                          ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border-blue-500/30' 
                          : 'bg-navy/5 hover:bg-navy/10 text-navy border-navy/20'
                      }`}
                      title="Open Linked Tax Invoice"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Invoice</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Claim Detail Modal */}
      {selectedClaim && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className={`rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border transition-colors ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className={`flex justify-between items-start border-b pb-3 ${
              isDark ? 'border-slate-800' : 'border-slate-100'
            }`}>
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                  Claim Reference Record
                </span>
                <h3 className={`text-lg font-black font-mono ${isDark ? 'text-white' : 'text-navy'}`}>{selectedClaim.claimNumber}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClaim(null)}
                className={`p-1 rounded-lg cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className={`flex justify-between items-center p-3 rounded-xl border ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'
              }`}>
                <span className={`font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Status</span>
                {getStatusBadge(selectedClaim.status)}
              </div>

              <div>
                <span className={`font-bold block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Service Requested</span>
                <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedClaim.serviceType}</span>
              </div>

              <div>
                <span className={`font-bold block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Description</span>
                <p className={`p-2.5 rounded-xl border leading-relaxed ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-700'
                }`}>
                  {selectedClaim.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className={`p-3 rounded-xl border ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'
                }`}>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Amount Claimed</span>
                  <span className={`text-sm font-bold font-mono ${isDark ? 'text-white' : 'text-slate-800'}`}>{fmt(selectedClaim.amountClaimed)}</span>
                </div>
                <div className={`p-3 rounded-xl border ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'
                }`}>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Amount Approved</span>
                  <span className={`text-sm font-bold font-mono ${isDark ? 'text-white' : 'text-slate-800'}`}>{fmt(selectedClaim.amountApproved)}</span>
                </div>
                <div className={`p-3 rounded-xl border ${
                  isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-100'
                }`}>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 uppercase block font-bold">Benefit Deducted</span>
                  <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">{fmt(selectedClaim.amountDeductedFromBenefit)}</span>
                </div>
                <div className={`p-3 rounded-xl border ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'
                }`}>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold">Customer Responsibility</span>
                  <span className={`text-base font-black font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{fmt(selectedClaim.customerResponsibility)}</span>
                </div>
              </div>

              {selectedClaim.rejectionReason && (
                <div className={`p-3 rounded-xl border text-xs ${
                  isDark ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                  <span className="font-bold block">Rejection Reason:</span>
                  {selectedClaim.rejectionReason}
                </div>
              )}
            </div>

            <div className={`pt-3 border-t flex justify-end ${
              isDark ? 'border-slate-800' : 'border-slate-100'
            }`}>
              <button
                type="button"
                onClick={() => setSelectedClaim(null)}
                className={`px-4 py-2 font-bold text-xs rounded-xl cursor-pointer ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit New Assistance Claim Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className={`border rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl space-y-5 transition-colors ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className={`flex justify-between items-start border-b pb-3 ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <div>
                <span className="text-[10px] font-mono font-bold text-red uppercase tracking-widest block">
                  NEW ASSISTANCE CLAIM
                </span>
                <h3 className={`text-xl font-black mt-0.5 ${isDark ? 'text-white' : 'text-navy'}`}>Submit Assistance Claim</h3>
                <p className={`text-xs font-mono mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Available Benefit: {benefitSummary ? fmt(benefitSummary.remainingBenefit) : 'Loading...'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className={`p-1.5 rounded-lg cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleClaimSubmit} className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Service Category *
                </label>
                <select
                  value={serviceType}
                  onChange={e => setServiceType(e.target.value)}
                  className={`w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none ${
                    isDark 
                      ? 'bg-slate-800 border-slate-700 text-white focus:border-red' 
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-navy'
                  }`}
                >
                  <option value="Intercom Systems">Intercom Systems (Audio & Video, Gate Stations)</option>
                  <option value="Security Services">Security Services (Gate, Fence, CCTV, Alarm)</option>
                  <option value="Garage & Gate Automation">Garage & Gate Automation</option>
                  <option value="Electric Fence">Electric Fence</option>
                  <option value="Electrical Assistance">Electrical Assistance</option>
                  <option value="Plumbing Assistance">Plumbing Assistance</option>
                  <option value="Maintenance Services">General Maintenance</option>
                </select>
              </div>

              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Property / Site Location Involved *
                </label>
                <input
                  type="text"
                  value={vehicleOrProperty}
                  onChange={e => setVehicleOrProperty(e.target.value)}
                  placeholder="e.g. Main Residence Front Gate / Office Perimeter"
                  className={`w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none ${
                    isDark 
                      ? 'bg-slate-800 border-slate-700 text-white focus:border-red' 
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-navy'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    Estimated / Claimed Service Amount (ZAR) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amountClaimed}
                    onChange={e => handleAmountChange(e.target.value, partsAmount)}
                    placeholder="e.g. 2500"
                    className={`w-full border rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none ${
                      isDark 
                        ? 'bg-slate-800 border-slate-700 text-white focus:border-red' 
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-navy'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    Hardware / Parts Portion (ZAR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={partsAmount}
                    onChange={e => handleAmountChange(amountClaimed, e.target.value)}
                    placeholder="e.g. 1500"
                    className={`w-full border rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none ${
                      isDark 
                        ? 'bg-slate-800 border-slate-700 text-white focus:border-red' 
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-navy'
                    }`}
                  />
                </div>
              </div>

              {/* Live Coverage Preview Calculation */}
              {coveragePreview && (
                <div className={`border rounded-2xl p-4 space-y-2 text-xs animate-fadeIn ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className={`flex justify-between items-center pb-2 border-b font-mono ${
                    isDark ? 'border-slate-800 text-slate-300' : 'border-slate-200 text-slate-700'
                  }`}>
                    <span className="font-bold">Live Benefit Coverage Preview:</span>
                    <span className="text-[10px] text-slate-400">Calculated Against Current Balance</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className={`p-2.5 rounded-lg border ${
                      isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                    }`}>
                      <span className={`block text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Covered by Plan:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                        {fmt(coveragePreview.amountCoveredByBenefit)}
                      </span>
                    </div>
                    <div className={`p-2.5 rounded-lg border ${
                      isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                    }`}>
                      <span className={`block text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Your Responsibility:</span>
                      <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-navy'}`}>
                        {fmt(coveragePreview.amountPayableByCustomer)}
                      </span>
                    </div>
                  </div>
                  <p className={`text-[11px] leading-snug pt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {coveragePreview.explanation}
                  </p>
                </div>
              )}

              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Detailed Fault / Incident Description *
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe the issue, work completed or required..."
                  className={`w-full border rounded-xl p-3 text-xs focus:outline-none leading-relaxed ${
                    isDark 
                      ? 'bg-slate-800 border-slate-700 text-white focus:border-red' 
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-navy'
                  }`}
                />
              </div>

              <div className={`pt-3 border-t flex justify-end gap-2 ${
                isDark ? 'border-slate-800' : 'border-slate-200'
              }`}>
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className={`px-4 py-2.5 text-xs font-bold rounded-xl cursor-pointer ${
                    isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-red hover:bg-red/90 text-white text-xs font-bold rounded-xl shadow-lg shadow-red/20 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerClaims;
