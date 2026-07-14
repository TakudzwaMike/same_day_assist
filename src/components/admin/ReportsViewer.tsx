import React, { useState, useEffect } from 'react';
import { FileText, DollarSign, Users, ShieldAlert, Download } from 'lucide-react';
import { useAppState } from '../../contexts/AppStateContext';
import { api } from '../../services/api';
import Loader from '../shared/Loader';

export default function ReportsViewer() {
  const { state } = useAppState();
  const [reportType, setReportType] = useState<'assessment' | 'quotation' | 'completion' | 'membership' | 'compliance' | 'revenue'>('membership');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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

  const handleDownloadPDF = (type: 'quotation' | 'invoice' | 'completion', id: string) => {
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
                        <th className="p-3">Survey ID</th>
                        <th className="p-3">Enquiry ID</th>
                        <th className="p-3">Assigned Inspector</th>
                        <th className="p-3">Defects Audited</th>
                        <th className="p-3">Estimated ZAR Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {state.assessments.map(a => {
                        const inspector = state.contractors.find(c => c.id === a.contractorId);
                        return (
                          <tr key={a.id}>
                            <td className="p-3 font-mono">{a.id}</td>
                            <td className="p-3 font-mono">{a.enquiryId}</td>
                            <td className="p-3 font-bold">{inspector?.name || 'Surveyor'}</td>
                            <td className="p-3 text-slate-500">{a.issuesFound.length} Issues</td>
                            <td className="p-3 font-bold">R{a.estimatedCost}</td>
                          </tr>
                        );
                      })}
                      {state.assessments.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-slate-400 font-mono">No safety assessments uploaded yet.</td>
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
                        <th className="p-3">Client Name</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Completed At</th>
                        <th className="p-3 text-right">PDF Certificate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {state.jobs.filter(j => j.status === 'Completed' || j.status === 'Closed' || j.status === 'Rated').map(job => (
                        <tr key={job.id}>
                          <td className="p-3 font-mono">{job.id}</td>
                          <td className="p-3 font-bold">{job.customerName}</td>
                          <td className="p-3 uppercase text-[10px]">{job.serviceType}</td>
                          <td className="p-3 text-slate-400 font-mono">{job.completedAt ? new Date(job.completedAt).toLocaleDateString() : 'N/A'}</td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleDownloadPDF('completion', job.id)}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-slate-500"
                              title="Download PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {state.jobs.filter(j => j.status === 'Completed' || j.status === 'Closed' || j.status === 'Rated').length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-slate-400 font-mono">No resolved emergency tickets found.</td>
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
    </div>
  );
}
