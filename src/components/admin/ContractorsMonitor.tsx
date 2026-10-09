import React, { useState } from 'react';
import { Shield, Phone, CheckCircle, AlertTriangle, CreditCard, DollarSign, Clock, UserCheck } from 'lucide-react';
import { useAppState } from '../../contexts/AppStateContext';
import { api } from '../../services/api';
import EmptyState from '../shared/EmptyState';

export default function ContractorsMonitor() {
  const { state, refreshData, assignContractor, updateJobStatus, closeJob, addAuditLogLocal } = useAppState();
  const [selectedJobIdForAssign, setSelectedJobIdForAssign] = useState<string | null>(null);
  const [assignContractorId, setAssignContractorId] = useState('');
  const [customerFilter, setCustomerFilter] = useState<'ALL' | 'NON_MEMBER' | 'MEMBER'>('ALL');

  // Complete / Set Final Amount modal states
  const [amountModalJob, setAmountModalJob] = useState<any | null>(null);
  const [finalAmountInput, setFinalAmountInput] = useState('');
  const [servicePerformedInput, setServicePerformedInput] = useState('');
  const [isSubmittingAmount, setIsSubmittingAmount] = useState(false);

  const activeJobs = state.jobs;
  const contractors = state.contractors;

  const filteredJobs = activeJobs.filter(j => {
    if (customerFilter === 'NON_MEMBER') return j.customerType === 'NON_MEMBER_EMERGENCY';
    if (customerFilter === 'MEMBER') return j.customerType !== 'NON_MEMBER_EMERGENCY';
    return true;
  });

  const nonMemberCount = activeJobs.filter(j => j.customerType === 'NON_MEMBER_EMERGENCY').length;
  const memberCount = activeJobs.filter(j => j.customerType !== 'NON_MEMBER_EMERGENCY').length;

  const handleAssignClick = (jobId: string) => {
    setSelectedJobIdForAssign(jobId);
    const job = state.jobs.find(j => j.id === jobId);
    const defaultC = state.contractors.find(c => c.specialty === job?.serviceType);
    setAssignContractorId(defaultC?.id || state.contractors[0]?.id || '');
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobIdForAssign || !assignContractorId) return;

    try {
      await assignContractor(selectedJobIdForAssign, assignContractorId);
      const contractor = state.contractors.find(c => c.id === assignContractorId);
      addAuditLogLocal('Contractor Assigned to Job', `Administrator dispatched ${contractor?.name} to emergency Job ${selectedJobIdForAssign}.`);
      setSelectedJobIdForAssign(null);
    } catch (err: any) {
      alert(err.message || 'Failed to assign contractor');
    }
  };

  const handleOpenAmountModal = (job: any) => {
    setAmountModalJob(job);
    setFinalAmountInput(job.finalAmount && job.finalAmount > 0 ? String(job.finalAmount) : '850.00');
    setServicePerformedInput(job.servicePerformed || `${job.serviceType} Emergency Assistance Completed`);
  };

  const handleFinalAmountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountModalJob || !finalAmountInput) return;

    const parsed = parseFloat(finalAmountInput);
    if (isNaN(parsed) || parsed <= 0) {
      alert('Please enter a valid amount greater than 0.');
      return;
    }

    setIsSubmittingAmount(true);
    try {
      await api.setJobServiceAmount(amountModalJob.id, {
        finalAmount: parsed,
        servicePerformed: servicePerformedInput,
        status: 'Work Completed',
      });
      await refreshData();
      addAuditLogLocal('Service Amount Set', `Set final amount of R${parsed.toFixed(2)} for Job ${amountModalJob.id}`);
      setAmountModalJob(null);
    } catch (err: any) {
      alert(err.message || 'Failed to set service amount');
    } finally {
      setIsSubmittingAmount(false);
    }
  };

  const handleRecordPayment = async (job: any) => {
    if (!confirm(`Confirm that payment of R${job.finalAmount || 850} has been received for ${job.customerName}?`)) return;

    try {
      await api.payEmergencyService(job.id, {
        paymentMethod: 'Cash / Card Terminal On-Scene',
      });
      await refreshData();
      addAuditLogLocal('Emergency Payment Recorded', `Recorded full payment of R${job.finalAmount || 850} for Job ${job.id}`);
      alert('Payment confirmed and request marked as completed!');
    } catch (err: any) {
      alert(err.message || 'Failed to confirm payment');
    }
  };

  const handleQuickStatusChange = async (jobId: string, status: string) => {
    try {
      await updateJobStatus(jobId, status);
      await refreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleCloseClick = async (jobId: string) => {
    try {
      await closeJob(jobId);
      addAuditLogLocal('Job Closed', `Administrator audited and closed Job Card ${jobId}.`);
    } catch (err: any) {
      alert(err.message || 'Failed to close job card');
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6 animate-fadeIn">
      {/* LEFT COLUMN: ACTIVE DISPATCH EMERGENCY PANICS */}
      <div className="col-span-12 md:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs font-bold text-navy uppercase tracking-wider">Live Assistance Dispatch Queue</h3>
            <p className="text-[9px] text-slate-400">Emergency panics and logged repair dispatches</p>
          </div>

          {/* FILTER BUTTONS */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setCustomerFilter('ALL')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                customerFilter === 'ALL' ? 'bg-white text-navy shadow-xs' : 'text-slate-500 hover:text-navy'
              }`}
            >
              All ({activeJobs.length})
            </button>
            <button
              type="button"
              onClick={() => setCustomerFilter('NON_MEMBER')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                customerFilter === 'NON_MEMBER' ? 'bg-red text-white shadow-xs' : 'text-red hover:bg-red/5'
              }`}
            >
              <span>🚨 Non-Member</span>
              <span className="text-[10px] bg-red-100 text-red-900 px-1.5 py-0.2 rounded-full font-mono">{nonMemberCount}</span>
            </button>
            <button
              type="button"
              onClick={() => setCustomerFilter('MEMBER')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                customerFilter === 'MEMBER' ? 'bg-navy text-white shadow-xs' : 'text-slate-500 hover:text-navy'
              }`}
            >
              <span>🛡️ Members</span>
              <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-mono">{memberCount}</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {filteredJobs.map(job => {
            const assignedC = contractors.find(c => c.id === job.assignedContractorId);
            const isNonMember = job.customerType === 'NON_MEMBER_EMERGENCY';

            return (
              <div 
                key={job.id} 
                className={`p-5 rounded-2xl border transition-all flex flex-col gap-3.5 ${
                  isNonMember 
                    ? 'border-amber-400 bg-amber-50/20 shadow-xs' 
                    : job.status === 'Requested' 
                      ? 'border-red-400 bg-red-50/20' 
                      : 'border-slate-200 bg-white'
                }`}
              >
                {/* Header & Badges */}
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full font-extrabold text-[9px] uppercase tracking-wider font-mono ${
                        isNonMember 
                          ? 'bg-amber-500 text-white' 
                          : 'bg-navy text-white'
                      }`}>
                        {isNonMember ? '🚨 NON-MEMBER EMERGENCY (ONE-OFF)' : '🛡️ MEMBER REQUEST'}
                      </span>
                      <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded font-mono">
                        {job.serviceType}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">ID: #{job.id.slice(0, 8)}</span>
                    </div>

                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-2 mt-1">
                      <span>{job.customerName || 'Customer'}</span>
                      <a href={`tel:${job.customerPhone}`} className="text-red hover:underline text-xs font-mono font-bold flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {job.customerPhone || 'No Phone'}
                      </a>
                    </h4>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`px-2.5 py-1 rounded-lg font-black text-[9px] uppercase tracking-wider font-mono ${
                      job.status === 'Requested' ? 'bg-red-600 text-white animate-pulse' :
                      ['Service Completed', 'Completed', 'Closed'].includes(job.status) ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                      ['Work Completed', 'Payment Pending'].includes(job.status) ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                      'bg-navy/10 text-navy font-bold'
                    }`}>
                      {job.status}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono block mt-1">
                      {new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Problem Description */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs">
                  <p className="font-semibold text-slate-900 leading-relaxed italic">"{job.description}"</p>
                  <p className="text-[10px] text-slate-600 mt-1.5 flex items-center gap-1">
                    <span className="font-bold text-slate-800">📍 Incident Address:</span> {job.customerAddress}
                  </p>
                </div>

                {/* Non-Member Financial & Payment Status */}
                {isNonMember && (
                  <div className="bg-slate-950 text-white p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono border border-slate-800">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-amber-400" />
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase block">Emergency Call-Out Fee</span>
                        <span className="text-sm font-black text-amber-400">
                          R650.00 (Fixed Call-Out Fee)
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase block">Payment Status</span>
                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-wide uppercase ${
                        job.paymentStatus === 'Paid' 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                          : 'bg-red-500/20 text-red-300 border border-red-500/40'
                      }`}>
                        {job.paymentStatus === 'Paid' ? '✓ PAYMENT CONFIRMED (R650 PAID)' : '⏳ PAYMENT REQUIRED (R650 DUE)'}
                      </span>
                    </div>
                    <div className="w-full pt-1.5 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-400">
                      <span>Dispatch Eligibility:</span>
                      <span className={`font-bold ${job.paymentStatus === 'Paid' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {job.paymentStatus === 'Paid' 
                          ? 'Eligible for Dispatch (Awaiting Unit Assignment)' 
                          : 'LOCKED: Dispatch prohibited until R650 is verified'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Assigned Contractor Tracking progress */}
                {assignedC && (
                  <div className="space-y-1.5 border-t border-slate-100 pt-2 text-xs">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-navy flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-navy" />
                        <span>Assigned Unit: {assignedC.name} ({assignedC.phone})</span>
                      </span>
                      <span className="font-mono text-slate-500 font-bold">{job.trackerProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-navy h-full transition-all duration-500" 
                        style={{ width: `${job.trackerProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-3">
                  {/* Status update quick buttons */}
                  {!['Completed', 'Service Completed', 'Closed'].includes(job.status) && (
                    <select
                      value={job.status}
                      disabled={isNonMember && job.paymentStatus !== 'Paid'}
                      onChange={e => handleQuickStatusChange(job.id, e.target.value)}
                      className="text-xs p-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-bold disabled:opacity-50"
                    >
                      {isNonMember && job.paymentStatus !== 'Paid' ? (
                        <option value="Payment Required">Payment Required (Dispatch Locked)</option>
                      ) : (
                        <>
                          {isNonMember && <option value="Awaiting Dispatch">Awaiting Dispatch</option>}
                          <option value="Requested">Requested</option>
                          <option value="Request Under Review">Request Under Review</option>
                          <option value="Service Provider Assigned">Service Provider Assigned</option>
                          <option value="Dispatched">Dispatched</option>
                          <option value="Team En Route">Team En Route</option>
                          <option value="En Route">En Route</option>
                          <option value="Arrived">Arrived</option>
                          <option value="Assistance In Progress">Assistance In Progress</option>
                          <option value="Service In Progress">Service In Progress</option>
                          <option value="Work Completed">Work Completed</option>
                          <option value="Completed">Completed</option>
                        </>
                      )}
                    </select>
                  )}

                  {/* Assign responder button — strictly enabled for non-members ONLY AFTER payment is confirmed */}
                  {(!job.assignedContractorId && ['Requested', 'Awaiting Dispatch', 'Payment Confirmed'].includes(job.status)) && (
                    <button
                      type="button"
                      disabled={isNonMember && job.paymentStatus !== 'Paid'}
                      onClick={() => handleAssignClick(job.id)}
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-xl shadow-xs cursor-pointer uppercase tracking-wider ${
                        isNonMember && job.paymentStatus !== 'Paid'
                          ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                          : 'bg-red hover:bg-red/90 text-white'
                      }`}
                      title={isNonMember && job.paymentStatus !== 'Paid' ? 'Dispatch locked until R650 Call-Out fee is paid' : 'Assign response unit'}
                    >
                      {isNonMember && job.paymentStatus !== 'Paid' ? '🔒 Dispatch Locked (Awaiting R650)' : 'Assign Unit'}
                    </button>
                  )}

                  {/* Record payment for non-member if pending */}
                  {isNonMember && job.paymentStatus !== 'Paid' && (
                    <button
                      type="button"
                      onClick={() => handleRecordPayment(job)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 uppercase tracking-wider"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Verify & Confirm R650 Payment</span>
                    </button>
                  )}

                  {/* Close job */}
                  {(['Completed', 'Service Completed', 'Work Completed'].includes(job.status) || job.paymentStatus === 'Paid') && job.status !== 'Closed' && (
                    <button
                      type="button"
                      onClick={() => handleCloseClick(job.id)}
                      className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer uppercase tracking-wider"
                    >
                      Close Job Card
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filteredJobs.length === 0 && (
            <EmptyState 
              icon={CheckCircle}
              title="No Requests in this Filter"
              description="No active emergency panic triggers or repair assistance calls matching the selected filter."
            />
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: CONTRACTORS STATUS MONITOR */}
      <div className="col-span-12 md:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col gap-4">
        <div className="border-b border-slate-100 pb-2">
          <h3 className="text-xs font-bold text-navy uppercase tracking-wider">Field Patrol Status</h3>
          <p className="text-[9px] text-slate-400">Availability and coordinates of rapid response cruisers</p>
        </div>

        <div className="space-y-3">
          {contractors.map(c => (
            <div key={c.id} className="p-3 bg-slate-50/50 rounded-2xl border border-slate-150 flex items-center justify-between gap-3 hover:border-slate-350 transition-all">
              <div className="flex items-center gap-2.5">
                <div className="w-8.5 h-8.5 bg-navy text-white rounded-xl flex items-center justify-center font-bold text-xs">
                  {c.name.split(' ').map(n=>n[0]).join('')}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">{c.name}</p>
                  <p className="text-[9.5px] text-slate-400 font-mono">Specialty: {c.specialty} • rating: ★ {c.rating}</p>
                  <p className="text-[9px] text-slate-500 mt-0.5 truncate max-w-[160px]">Area: {c.location?.address || 'Johannesburg'}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className={`px-2 py-0.5 rounded-sm font-bold text-[8.5px] uppercase ${
                  c.isAvailable ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-600'
                }`}>
                  {c.isAvailable ? 'Available' : 'Busy'}
                </span>
                <a href={`tel:${c.phone}`} className="p-1 border border-slate-200 rounded-lg bg-white mt-1.5 flex items-center justify-center hover:bg-slate-50 transition-all">
                  <Phone className="w-3.5 h-3.5 text-navy" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: ASSIGN CONTRACTOR */}
      {selectedJobIdForAssign && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <form onSubmit={handleAssignSubmit} className="bg-white border border-slate-200 w-full max-w-sm rounded-3xl p-6 shadow-xl flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-bold text-navy uppercase tracking-wide">Assign Emergency Responder</h3>
              <p className="text-[9.5px] text-slate-400">Select a rapid responder to dispatch to the customer address immediately</p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Patrol Cruiser Units</label>
              <select
                value={assignContractorId}
                onChange={e => setAssignContractorId(e.target.value)}
                className="text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-navy bg-white"
              >
                {contractors.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.specialty}) • Available: {c.isAvailable ? 'YES' : 'NO'}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 justify-end mt-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setSelectedJobIdForAssign(null)}
                className="px-3.5 py-2 text-xs font-bold text-slate-500 hover:text-navy rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red hover:bg-red/90 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer uppercase tracking-wider"
              >
                Dispatch Cruiser
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: SET FINAL AMOUNT FOR NON-MEMBER EMERGENCY */}
      {amountModalJob && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <form onSubmit={handleFinalAmountSubmit} className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
            <div>
              <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-mono font-bold uppercase">
                One-Time Non-Member Billing
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1 uppercase">Determine Final Service Amount</h3>
              <p className="text-xs text-slate-500">
                Customer: <strong>{amountModalJob.customerName}</strong> ({amountModalJob.customerPhone})
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                  Final Applicable Amount (ZAR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-500">R</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={finalAmountInput}
                    onChange={e => setFinalAmountInput(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm font-bold border-2 border-slate-300 rounded-xl focus:outline-none focus:border-navy bg-white text-slate-900"
                    placeholder="e.g. 850.00"
                  />
                </div>
                <p className="text-[9.5px] text-slate-500 mt-1">
                  This is the total amount the customer will pay upon completion. This customer will NOT be enrolled into monthly billing.
                </p>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                  Service / Work Performed Summary
                </label>
                <textarea
                  rows={3}
                  required
                  value={servicePerformedInput}
                  onChange={e => setServicePerformedInput(e.target.value)}
                  className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-navy bg-white text-slate-900"
                  placeholder="Describe the services rendered on scene..."
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setAmountModalJob(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-navy rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingAmount}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer uppercase tracking-wider disabled:opacity-50"
              >
                {isSubmittingAmount ? 'Saving...' : 'Set Amount & Mark Work Completed'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
