import React, { useState } from 'react';
import { 
  FileText, ShieldCheck, UserCheck, Calendar, Clock, CheckCircle2, 
  XCircle, AlertCircle, Eye, Search, Filter, ArrowRight, UserPlus, FileCheck, Building2
} from 'lucide-react';
import { useAppState } from '../../contexts/AppStateContext';
import { CustomerStatus, Enquiry, SurveyReport } from '../../types';

export function AdminOnboardingCommand() {
  const { state, assignSurveyInspector, adminReviewSurvey, activateCustomerAccount } = useAppState();

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'WAITING_SURVEY' | 'ASSIGNED' | 'AWAITING_REVIEW' | 'PAYMENT_PENDING' | 'WAITING_ACTIVATION' | 'ACTIVE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Inspector Assignment Modal State
  const [assignEnqId, setAssignEnqId] = useState<string | null>(null);
  const [selectedInspectorId, setSelectedInspectorId] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);

  // Review Report Modal State
  const [reviewEnqId, setReviewEnqId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  // Combine enquiries and customers for complete onboarding visibility
  const allApplications = state.enquiries.map(enq => {
    const cust = state.customers.find(c => c.email === enq.email || c.name === enq.customerName);
    const currentStatus: CustomerStatus = (cust?.status as CustomerStatus) || (enq.status as CustomerStatus) || 'WAITING_FOR_SURVEY';
    return {
      enquiryId: enq.id,
      customerId: cust?.id,
      customerName: enq.customerName || cust?.name || 'Customer',
      email: enq.email || cust?.email || '',
      phone: enq.phone || cust?.phone || '',
      address: enq.address || cust?.address || '',
      accountType: enq.accountType || cust?.accountType || 'Individual',
      serviceCategory: enq.serviceCategory,
      notes: enq.notes,
      status: currentStatus,
      surveyRequested: enq.surveyRequested ?? cust?.surveyRequested ?? true,
      surveyInspectorId: enq.surveyInspectorId || cust?.surveyInspectorId,
      surveyInspectorName: enq.surveyInspectorName || cust?.surveyInspectorName,
      surveyScheduledDate: enq.surveyScheduledDate || cust?.surveyScheduledDate,
      surveyReport: enq.surveyReport || cust?.surveyReport,
      adminReviewNotes: enq.adminReviewNotes || cust?.adminReviewNotes,
      initialPaymentAmount: cust?.initialPaymentAmount,
      activationScheduledDate: cust?.activationScheduledDate,
      createdAt: enq.createdAt,
    };
  });

  const filteredApps = allApplications.filter(app => {
    const matchesSearch = app.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          app.address.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'WAITING_SURVEY') return app.status === 'WAITING_FOR_SURVEY' || app.status === 'APPLICATION_SUBMITTED';
    if (activeFilter === 'ASSIGNED') return ['SURVEY_ASSIGNED', 'SURVEY_SCHEDULED', 'SURVEY_IN_PROGRESS'].includes(app.status);
    if (activeFilter === 'AWAITING_REVIEW') return app.status === 'SURVEY_COMPLETED' || app.status === 'ADMIN_REVIEW';
    if (activeFilter === 'PAYMENT_PENDING') return app.status === 'PAYMENT_REQUIRED' || app.status === 'APPLICATION_APPROVED';
    if (activeFilter === 'WAITING_ACTIVATION') return app.status === 'WAITING_FOR_ACTIVATION';
    if (activeFilter === 'ACTIVE') return app.status === 'ACTIVE';

    return true;
  });

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignEnqId || !selectedInspectorId) return;
    try {
      await assignSurveyInspector(assignEnqId, selectedInspectorId, scheduledDate);
      setAssignEnqId(null);
      setSelectedInspectorId('');
      alert('Survey Inspector assigned successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to assign inspector');
    }
  };

  const handleReviewSubmit = async (decision: 'APPROVE' | 'REQUEST_INFO' | 'REJECT') => {
    if (!reviewEnqId) return;
    try {
      await adminReviewSurvey(reviewEnqId, decision, reviewNotes);
      setReviewEnqId(null);
      setReviewNotes('');
      alert(`Survey decision (${decision}) applied successfully! Customer status updated.`);
    } catch (err: any) {
      alert(err.message || 'Failed to apply admin decision');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-white">
        <div>
          <div className="flex items-center gap-2 text-red-500 font-mono text-xs font-bold tracking-widest uppercase mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Administrator Control Hub</span>
          </div>
          <h2 className="text-2xl font-black italic tracking-wide">Onboarding Survey & Application Command Centre</h2>
          <p className="text-xs text-slate-400 mt-1">Audit, assign inspectors, review compliance survey reports, and approve initial payments.</p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-slate-300 bg-slate-800 p-2.5 rounded-2xl border border-slate-700">
          <span className="text-slate-400">Total Applications:</span>
          <span className="font-bold text-white text-sm">{allApplications.length}</span>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto text-xs">
        <button
          type="button"
          onClick={() => setActiveFilter('ALL')}
          className={`px-4 py-2 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
            activeFilter === 'ALL' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          All Applications ({allApplications.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('WAITING_SURVEY')}
          className={`px-4 py-2 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
            activeFilter === 'WAITING_SURVEY' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          Waiting Survey ({allApplications.filter(a => a.status === 'WAITING_FOR_SURVEY' || a.status === 'APPLICATION_SUBMITTED').length})
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('ASSIGNED')}
          className={`px-4 py-2 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
            activeFilter === 'ASSIGNED' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          Survey Assigned ({allApplications.filter(a => ['SURVEY_ASSIGNED', 'SURVEY_SCHEDULED', 'SURVEY_IN_PROGRESS'].includes(a.status)).length})
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('AWAITING_REVIEW')}
          className={`px-4 py-2 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
            activeFilter === 'AWAITING_REVIEW' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          Survey Completed — Review Required ({allApplications.filter(a => a.status === 'SURVEY_COMPLETED' || a.status === 'ADMIN_REVIEW').length})
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('PAYMENT_PENDING')}
          className={`px-4 py-2 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
            activeFilter === 'PAYMENT_PENDING' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          Payment Pending ({allApplications.filter(a => a.status === 'PAYMENT_REQUIRED' || a.status === 'APPLICATION_APPROVED').length})
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('WAITING_ACTIVATION')}
          className={`px-4 py-2 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
            activeFilter === 'WAITING_ACTIVATION' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          Waiting Activation ({allApplications.filter(a => a.status === 'WAITING_FOR_ACTIVATION').length})
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('ACTIVE')}
          className={`px-4 py-2 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
            activeFilter === 'ACTIVE' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          Active Customers ({allApplications.filter(a => a.status === 'ACTIVE').length})
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by customer name, email address, or property location..."
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-white text-xs focus:outline-none focus:border-red-500"
        />
      </div>

      {/* APPLICATIONS LIST */}
      <div className="space-y-4">
        {filteredApps.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500 text-xs">
            No onboarding applications found for this filter view.
          </div>
        ) : (
          filteredApps.map(app => (
            <div key={app.enquiryId} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-lg text-slate-100 hover:border-slate-700 transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{app.customerName}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {app.accountType} Account
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3 font-mono">
                    <span>{app.email}</span>
                    <span>•</span>
                    <span>{app.phone}</span>
                    <span>•</span>
                    <span>{app.address}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    app.status === 'ACTIVE'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : app.status === 'SURVEY_COMPLETED' || app.status === 'ADMIN_REVIEW'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      : app.status === 'PAYMENT_REQUIRED'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : app.status === 'WAITING_FOR_ACTIVATION'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    {app.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* DETAILS AND ACTIONS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-800">
                  <div className="text-slate-400 mb-0.5">Assigned Inspector</div>
                  <div className="font-semibold text-white">{app.surveyInspectorName || 'Unassigned'}</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-800">
                  <div className="text-slate-400 mb-0.5">Inspection Scheduled</div>
                  <div className="font-semibold text-white">{app.surveyScheduledDate || 'Not Scheduled'}</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-800">
                  <div className="text-slate-400 mb-0.5">Survey Report Status</div>
                  <div className="font-semibold text-white">{app.surveyReport ? 'Uploaded ✓' : 'Pending Upload'}</div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                {(app.status === 'WAITING_FOR_SURVEY' || app.status === 'APPLICATION_SUBMITTED' || !app.surveyInspectorId) && (
                  <button
                    type="button"
                    onClick={() => {
                      setAssignEnqId(app.enquiryId);
                      setSelectedInspectorId(state.contractors[0]?.id || '');
                    }}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-red-600/20"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Assign Survey Inspector</span>
                  </button>
                )}

                {(app.status === 'SURVEY_COMPLETED' || app.status === 'ADMIN_REVIEW' || app.surveyReport) && (
                  <button
                    type="button"
                    onClick={() => setReviewEnqId(app.enquiryId)}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-purple-600/20"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Review Survey Report & Decide</span>
                  </button>
                )}

                {app.status === 'WAITING_FOR_ACTIVATION' && app.customerId && (
                  <button
                    type="button"
                    onClick={async () => {
                      await activateCustomerAccount(app.customerId!);
                      alert(`Customer ${app.customerName} activated manually!`);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Activate Service Access Now</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ASSIGN INSPECTOR MODAL */}
      {assignEnqId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-lg w-full text-slate-100 shadow-2xl space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Assign Certified Survey Inspector</h3>
              <button onClick={() => setAssignEnqId(null)} className="text-slate-400 hover:text-white text-xs">Close</button>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-2">Select Certified Inspector</label>
                <select
                  value={selectedInspectorId}
                  onChange={e => setSelectedInspectorId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500"
                >
                  {state.contractors.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.specialty} ({c.rating} ★)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-2">Inspection Date</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={e => setScheduledDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold uppercase tracking-wider text-xs shadow-lg shadow-red-600/30 cursor-pointer"
              >
                Assign Inspector & Notify Customer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* REVIEW SURVEY REPORT MODAL */}
      {reviewEnqId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full text-slate-100 shadow-2xl space-y-6 my-8">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <div>
                <div className="text-xs text-purple-400 font-mono font-bold uppercase">Compliance Review</div>
                <h3 className="text-xl font-black text-white">Inspector Safety & Compliance Report</h3>
              </div>
              <button onClick={() => setReviewEnqId(null)} className="text-slate-400 hover:text-white text-xs">Close</button>
            </div>

            {(() => {
              const targetApp = allApplications.find(a => a.enquiryId === reviewEnqId);
              const report = targetApp?.surveyReport;

              return (
                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-slate-400 mb-1">Customer</div>
                      <div className="font-bold text-white text-sm">{targetApp?.customerName}</div>
                      <div className="text-slate-400">{targetApp?.address}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 mb-1">Inspector Recommendation</div>
                      <div className="font-bold text-emerald-400 text-sm">{report?.recommendation?.replace(/_/g, ' ') || 'RECOMMEND_APPROVAL'}</div>
                      <div className="text-slate-400">Inspector: {report?.inspectorName || targetApp?.surveyInspectorName || 'Certified Inspector'}</div>
                    </div>
                  </div>

                  <div className="space-y-3 p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
                    <div>
                      <span className="font-bold text-white block mb-0.5">Property Structural Assessment:</span>
                      <p className="text-slate-300">{report?.propertyAssessment || 'Property structurally sound with compliant entry points.'}</p>
                    </div>
                    <div>
                      <span className="font-bold text-white block mb-0.5">Safety & Perimeter Observations:</span>
                      <p className="text-slate-300">{report?.safetyObservations || 'Perimeter fence active. Intercom system verified.'}</p>
                    </div>
                    <div>
                      <span className="font-bold text-white block mb-0.5">Compliance Observations:</span>
                      <p className="text-slate-300">{report?.complianceObservations || 'Access control points meet Same Day Assist 2026 security guidelines.'}</p>
                    </div>
                  </div>

                  {/* ADMIN DECISION NOTES */}
                  <div>
                    <label className="block text-slate-400 font-semibold mb-2">Admin Review Notes / Directions</label>
                    <textarea
                      rows={3}
                      value={reviewNotes}
                      onChange={e => setReviewNotes(e.target.value)}
                      placeholder="Add official administrator review remarks or required revisions..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  {/* ADMIN DECISION BUTTONS */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleReviewSubmit('APPROVE')}
                      className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/30 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>APPROVE (50% Payment)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReviewSubmit('REQUEST_INFO')}
                      className="py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-600/30 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <AlertCircle className="w-4 h-4" />
                      <span>Request More Info</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReviewSubmit('REJECT')}
                      className="py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-red-600/30 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>REJECT Application</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
