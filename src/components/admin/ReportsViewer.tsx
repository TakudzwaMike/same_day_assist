import React, { useState, useEffect } from 'react';
import { FileText, DollarSign, Users, ShieldAlert, Download, Eye, Camera, Package, X, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAppState } from '../../contexts/AppStateContext';
import { api } from '../../services/api';
import Loader from '../shared/Loader';
import { MemberEquipmentRegisterView } from '../assessment/MemberEquipmentRegisterView';

export default function ReportsViewer() {
  const { state } = useAppState();
  const [reportType, setReportType] = useState<'assessment' | 'quotation' | 'completion' | 'membership' | 'compliance' | 'revenue'>('assessment');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAssessmentForModal, setSelectedAssessmentForModal] = useState<any | null>(null);
  const [selectedJobForModal, setSelectedJobForModal] = useState<any | null>(null);

  useEffect(() => {
    const fetchReportStats = async () => {
      setLoading(true);
      try {
        const data = await api.getDashboard();
        setStats(data);
      } catch (err) {
        console.warn('[Reports] Fetch dashboard stats warning:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReportStats();
  }, []);

  const handleDownloadPDF = (type: 'quotation' | 'invoice' | 'completion' | 'assessment', id: string) => {
    const url = api.getPDFUrl(type, id);
    window.open(url, '_blank');
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* HEADER SELECTOR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-3xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-navy uppercase tracking-wider">Operational Reports Suite</h3>
          <p className="text-[9px] text-slate-400">Select report category to render standard print templates</p>
        </div>
        <div className="flex flex-wrap gap-1.5 justify-end">
          {([
            { id: 'membership', label: 'Membership' },
            { id: 'assessment', label: 'Surveys' },
            { id: 'quotation', label: 'Quotations' },
            { id: 'completion', label: 'Job Completion' },
            { id: 'compliance', label: 'Compliance Audit' },
            { id: 'revenue', label: 'Revenue' }
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id)}
              className={`px-3 py-1.5 rounded-lg border text-[9.5px] font-bold cursor-pointer transition-all ${
                reportType === tab.id
                  ? 'bg-navy border-navy text-white shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Loader message="Loading dashboard aggregates..." />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs min-h-[300px] flex flex-col justify-between">
          <div>
            {/* 1. MEMBERSHIP REPORT */}
            {reportType === 'membership' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-2 mb-3">
                  <h4 className="text-xs font-bold text-navy uppercase">ZAR Membership Onboarding & Active Subscriptions</h4>
                  <p className="text-[9.5px] text-slate-400">Comprehensive customer lifecycle report</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Active Subscribers</span>
                    <p className="text-2xl font-brand-header text-navy font-bold">{stats?.totalCustomers || state.customers.filter(c => c.status === 'Active').length}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Onboarding Prospects</span>
                    <p className="text-2xl font-brand-header text-navy font-bold">{state.customers.filter(c => c.status === 'Onboarding').length}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Total ZAR Premiums</span>
                    <p className="text-2xl font-brand-header text-navy font-bold">R{stats?.revenueSummary?.totalRevenue || 3594}</p>
                  </div>
                </div>
                <div className="overflow-x-auto border border-slate-100 rounded-xl mt-4">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-100 font-mono text-[9px] font-bold">
                      <tr>
                        <th className="p-3">Customer ID</th>
                        <th className="p-3">Name</th>
                        <th className="p-3">Registered Address</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {state.customers.map(c => (
                        <tr key={c.id}>
                          <td className="p-3 font-mono">{c.id}</td>
                          <td className="p-3 font-bold">{c.name}</td>
                          <td className="p-3 text-slate-500 truncate max-w-xs">{c.address}</td>
                          <td className="p-3">
                            <span className={`px-1.5 py-0.2 rounded-sm text-[8px] font-bold uppercase ${c.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                              {c.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 2. ASSESSMENT SURVEYS REPORT */}
            {reportType === 'assessment' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-2 mb-3">
                  <h4 className="text-xs font-bold text-navy uppercase">Safety Compliance Survey Reports</h4>
                  <p className="text-[9.5px] text-slate-400">Logged audits and property assessments</p>
                </div>
                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-100 font-mono text-[9px] font-bold">
                      <tr>
                        <th className="p-3">Assessment ID</th>
                        <th className="p-3">Assigned Inspector</th>
                        <th className="p-3">Baseline Status</th>
                        <th className="p-3">Defects Audited</th>
                        <th className="p-3">Estimated ZAR</th>
                        <th className="p-3 text-right">A4 Register PDF</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {state.assessments.map(a => {
                        const inspector = state.contractors.find(c => c.id === a.contractorId);
                        return (
                          <tr key={a.id}>
                            <td className="p-3 font-mono font-bold text-navy">{a.id.slice(0, 12)}</td>
                            <td className="p-3 font-bold">{inspector?.name || 'Technical Inspector'}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                a.baselineLocked ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {a.baselineLocked ? 'Locked Baseline' : 'Pending Lock'}
                              </span>
                            </td>
                            <td className="p-3 text-slate-500">{a.issuesFound.length} Defects</td>
                            <td className="p-3 font-bold text-navy">R{a.estimatedCost}</td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    let struct = a.structuredData;
                                    if (typeof struct === 'string') {
                                      try { struct = JSON.parse(struct); } catch {}
                                    }
                                    setSelectedAssessmentForModal(struct || a);
                                  }}
                                  className="px-2.5 py-1 rounded bg-navy hover:bg-[#142D59] text-white text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                                  title="Inspect full device-by-device equipment register"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>Register</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadPDF('assessment', a.id)}
                                  className="px-2.5 py-1 rounded bg-[#CC322C] hover:bg-[#b02a25] text-white text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                                  title="Download A4 PDF Report"
                                >
                                  <FileText className="w-3 h-3" />
                                  <span>PDF</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {state.assessments.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-slate-400 font-mono">No safety assessments uploaded yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. QUOTATIONS REPORT */}
            {reportType === 'quotation' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-2 mb-3">
                  <h4 className="text-xs font-bold text-navy uppercase">Finalized Quotations & Compliance Invoices</h4>
                  <p className="text-[9.5px] text-slate-400">Pre-membership quotes and billing actions</p>
                </div>
                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-100 font-mono text-[9px] font-bold">
                      <tr>
                        <th className="p-3">Quotation ID</th>
                        <th className="p-3">ZAR Amount</th>
                        <th className="p-3">Created Date</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">PDF Document</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {state.quotations.map(q => (
                        <tr key={q.id}>
                          <td className="p-3 font-mono">{q.id}</td>
                          <td className="p-3 font-bold">R{q.amount}</td>
                          <td className="p-3 text-slate-400 font-mono">{new Date(q.createdAt).toLocaleDateString()}</td>
                          <td className="p-3">
                            <span className={`px-1.5 py-0.2 rounded-sm text-[8.5px] font-bold uppercase ${
                              q.status === 'Approved' ? 'bg-green-100 text-green-800' :
                              q.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {q.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleDownloadPDF('quotation', q.id)}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-slate-500"
                              title="Download PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. JOB COMPLETION REPORT */}
            {reportType === 'completion' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-2 mb-3">
                  <h4 className="text-xs font-bold text-navy uppercase">Emergency Assistance Resolution Records</h4>
                  <p className="text-[9.5px] text-slate-400">Completed jobs with surveyor digital signature</p>
                </div>
                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-100 font-mono text-[9px] font-bold">
                      <tr>
                        <th className="p-3">Job ID</th>
                        <th className="p-3">Client & Address</th>
                        <th className="p-3">Attending Responder</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Ground Evidence</th>
                        <th className="p-3">Completed At</th>
                        <th className="p-3 text-right">Handover & PDF</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {state.jobs.filter(j => j.status === 'Completed' || j.status === 'Service Completed' || j.status === 'Work Completed' || j.status === 'Closed' || j.status === 'Rated').map(job => {
                        const contractor = state.contractors.find(c => c.id === job.assignedContractorId);
                        const hasMedia = Boolean(job.photoBeforeUrl || job.photoAfterUrl || job.videoBeforeUrl || job.videoAfterUrl);
                        return (
                          <tr key={job.id} className="hover:bg-slate-50/50">
                            <td className="p-3 font-mono font-bold text-navy">#{job.id.slice(0, 8)}</td>
                            <td className="p-3">
                              <span className="font-bold block text-slate-800">{job.customerName}</span>
                              <span className="text-[10px] text-slate-400 truncate block max-w-xs">{job.customerAddress}</span>
                            </td>
                            <td className="p-3">
                              <span className="font-bold text-slate-700 block">{contractor?.name || 'Assigned Contractor'}</span>
                              <span className="text-[9.5px] text-slate-400 font-mono">{contractor?.phone || ''}</span>
                            </td>
                            <td className="p-3 uppercase text-[10px] font-mono font-bold text-navy">{job.serviceType}</td>
                            <td className="p-3">
                              <div className="flex flex-wrap items-center gap-1">
                                {job.photoBeforeUrl && <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[9px] font-bold">Before Pic</span>}
                                {job.photoAfterUrl && <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">After Pic</span>}
                                {job.partsReplaced && <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[9px] font-bold">Parts</span>}
                              </div>
                            </td>
                            <td className="p-3 text-slate-400 font-mono text-[10px]">
                              {job.completedAt ? new Date(job.completedAt).toLocaleDateString() : 'Recorded'}
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setSelectedJobForModal(job)}
                                  className="px-2 py-1 rounded bg-navy hover:bg-[#142D59] text-white text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                                  title="Inspect ground handover proof & replaced parts"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>Proof</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadPDF('completion', job.id)}
                                  className="p-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-slate-600 transition-all"
                                  title="Download PDF Certificate"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {state.jobs.filter(j => j.status === 'Completed' || j.status === 'Service Completed' || j.status === 'Work Completed' || j.status === 'Closed' || j.status === 'Rated').length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-4 text-center text-slate-400 font-mono">No resolved emergency tickets found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5. COMPLIANCE AUDIT REPORT */}
            {reportType === 'compliance' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-2 mb-3">
                  <h4 className="text-xs font-bold text-navy uppercase">Johannesburg SABS & PSIRA Compliance Audit</h4>
                  <p className="text-[9.5px] text-slate-400">Compliance scorecards based on surveys</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs flex flex-col gap-2">
                  <div className="flex justify-between items-center font-bold text-slate-700">
                    <span>Active Properties Audited</span>
                    <span>{state.customers.length} Properties</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Secured Compliance Defect Ratio</span>
                    <span>{(state.quotations.filter(q => q.status === 'Approved').length / Math.max(1, state.quotations.length) * 100).toFixed(0)}% Resolved</span>
                  </div>
                </div>
              </div>
            )}

            {/* 6. REVENUE REPORT */}
            {reportType === 'revenue' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-2 mb-3">
                  <h4 className="text-xs font-bold text-navy uppercase">Billing Revenue Breakdown</h4>
                  <p className="text-[9.5px] text-slate-400">Total premium deposits and onboarding co-pay receipts</p>
                </div>
                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-100 font-mono text-[9px] font-bold">
                      <tr>
                        <th className="p-3">Payment ID</th>
                        <th className="p-3">Client</th>
                        <th className="p-3">Payment Type</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3 text-right">PDF Invoice</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {state.payments.map(p => (
                        <tr key={p.id}>
                          <td className="p-3 font-mono">{p.id}</td>
                          <td className="p-3 font-bold">{p.customerName}</td>
                          <td className="p-3 text-slate-500">{p.type}</td>
                          <td className="p-3 font-brand-header text-navy font-bold">R{p.amount}</td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleDownloadPDF('invoice', p.id)}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-slate-500"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* INSPECT REGISTER MODAL */}
      {selectedAssessmentForModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-5xl w-full max-h-[92vh] overflow-y-auto p-6 relative shadow-2xl">
            <button
              onClick={() => setSelectedAssessmentForModal(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors z-10"
              title="Close equipment register"
            >
              <X className="w-5 h-5" />
            </button>
            <MemberEquipmentRegisterView
              assessment={selectedAssessmentForModal}
              assessmentId={selectedAssessmentForModal?.id}
            />
          </div>
        </div>
      )}

      {/* INSPECT HANDOVER PROOF MODAL */}
      {selectedJobForModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 relative shadow-2xl text-slate-100 space-y-5">
            <button
              onClick={() => setSelectedJobForModal(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors z-10"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-slate-800 pb-3">
              <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-wider">
                Ground Handover Evidence & Audit Log
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">
                Job #{selectedJobForModal.id} • {selectedJobForModal.customerName}
              </h3>
            </div>

            {/* Before & After Media */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1.5">
                <span className="text-xs font-bold text-amber-400 uppercase font-mono">Before Service</span>
                {selectedJobForModal.photoBeforeUrl ? (
                  <img src={selectedJobForModal.photoBeforeUrl} alt="Before" className="w-full aspect-video object-cover rounded-xl border border-slate-800" />
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-500">No before photo</div>
                )}
              </div>
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1.5">
                <span className="text-xs font-bold text-emerald-400 uppercase font-mono">After Handover</span>
                {selectedJobForModal.photoAfterUrl ? (
                  <img src={selectedJobForModal.photoAfterUrl} alt="After" className="w-full aspect-video object-cover rounded-xl border border-slate-800" />
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-500">No after photo</div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
              <span className="text-[10px] text-slate-400 font-mono uppercase block font-bold mb-1">Work Performed / Notes</span>
              <p className="text-slate-200 leading-relaxed font-medium">
                {selectedJobForModal.servicePerformed || selectedJobForModal.contractorNotes || selectedJobForModal.description}
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedJobForModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleDownloadPDF('completion', selectedJobForModal.id)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>PDF Certificate</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
