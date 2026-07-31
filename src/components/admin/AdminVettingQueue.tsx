import React, { useState, useEffect } from 'react';
import { Shield, FileCheck, CheckCircle2, XCircle, AlertCircle, Award, Eye, ExternalLink, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';

export function AdminVettingQueue() {
  const [contractors, setContractors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedContractor, setSelectedContractor] = useState<any | null>(null);
  
  const [actionNotes, setActionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [badgeTitle, setBadgeTitle] = useState('Top Performer of the Month');

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const data = await api.getVerificationApplications();
      setContractors(data);
    } catch (err: any) {
      setError('Failed to fetch contractor verification queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleApprove = async (contractorId: string) => {
    setActionLoading(true);
    try {
      await api.approveVerification(contractorId);
      await fetchApplications();
      setSelectedContractor(null);
    } catch (err) {
      alert('Failed to approve contractor');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestInfo = async (contractorId: string) => {
    if (!actionNotes) return alert('Please enter the information requested notes');
    setActionLoading(true);
    try {
      await api.requestVerificationInfo(contractorId, actionNotes);
      await fetchApplications();
      setSelectedContractor(null);
      setActionNotes('');
    } catch (err) {
      alert('Failed to send info request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (contractorId: string) => {
    if (!actionNotes) return alert('Please enter rejection reasons');
    setActionLoading(true);
    try {
      await api.rejectVerification(contractorId, actionNotes);
      await fetchApplications();
      setSelectedContractor(null);
      setActionNotes('');
    } catch (err) {
      alert('Failed to reject application');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAwardBadge = async (contractorId: string) => {
    setActionLoading(true);
    try {
      await api.awardProviderBadge(contractorId, {
        title: badgeTitle,
        category: 'Excellence Award',
        iconName: 'Award',
      });
      alert(`Awarded badge "${badgeTitle}" successfully!`);
      await fetchApplications();
    } catch (err) {
      alert('Failed to grant award badge');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-400 font-mono text-xs gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-red" />
        <span>Loading Service Provider Vetting Applications...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* SECTION HEADER */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-navy uppercase font-brand-header tracking-wide flex items-center gap-2">
            <Shield className="w-5 h-5 text-red" />
            Service Provider Vetting & Compliance Queue
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit compliance documentation, verify credentials, and manage provider achievement badges
          </p>
        </div>

        <button
          onClick={fetchApplications}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Queue
        </button>
      </div>

      {/* CONTRACTOR APPLICATIONS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-mono text-[10px]">
              <tr>
                <th className="px-6 py-3">Provider / Enterprise</th>
                <th className="px-6 py-3">Specialty & Experience</th>
                <th className="px-6 py-3">Vetting Status</th>
                <th className="px-6 py-3">Rating & Awards</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {contractors.map((c) => {
                const status = c.verificationStatus || 'Pending Review';
                return (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{c.name}</div>
                      <div className="text-[11px] font-mono text-slate-500">{c.email} • {c.phone}</div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-800">{c.specialty || 'General Service'}</span>
                      <span className="text-[11px] text-slate-500 block font-mono">{c.yearsOfExperience || 1} Yrs Experience</span>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono ${
                        status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                        status === 'Rejected' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                        status === 'Information Requested' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                        'bg-slate-100 text-slate-700 border border-slate-300'
                      }`}>
                        {status === 'Approved' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {status === 'Rejected' && <XCircle className="w-3 h-3 text-rose-600" />}
                        {status === 'Information Requested' && <AlertCircle className="w-3 h-3 text-amber-600" />}
                        {status}
                      </span>
                    </td>

                    <td className="px-6 py-4 font-mono">
                      <div className="flex items-center gap-1 font-bold text-slate-900">
                        <span>★ {c.rating ? c.rating.toFixed(1) : '5.0'}</span>
                        {c.isFeatured && (
                          <span className="bg-amber-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                            FEATURED
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {c.providerAwards?.length || 0} Badges Awarded
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedContractor(c)}
                        className="px-3.5 py-1.5 bg-navy text-white text-xs font-medium rounded-xl hover:bg-navy-light transition-all flex items-center gap-1.5 cursor-pointer ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" /> Inspect Docs
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* INSPECT MODAL */}
      {selectedContractor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-6 shadow-2xl text-slate-900 border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-base font-bold text-navy uppercase font-brand-header">
                  {selectedContractor.name} Compliance Audit
                </h3>
                <p className="text-xs text-slate-500 font-mono">{selectedContractor.email} • {selectedContractor.phone}</p>
              </div>
              <button onClick={() => setSelectedContractor(null)} className="text-slate-400 hover:text-slate-700 text-xs font-mono">
                ESC ✕
              </button>
            </div>

            {/* DOCUMENT LINKS */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Submitted Verification Documents
              </span>
              {[
                { name: 'CIPC Business Licence', url: selectedContractor.businessLicenseUrl },
                { name: 'SARS Tax Clearance Certificate', url: selectedContractor.taxClearanceUrl },
                { name: 'Public Liability Insurance', url: selectedContractor.insuranceProofUrl },
                { name: 'Police Clearance (SAP 91a)', url: selectedContractor.policeClearanceUrl },
                { name: 'Trade Qualifications / PSIRA Cert', url: selectedContractor.tradeQualificationsUrl },
              ].map((doc, idx) => (
                <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{doc.name}</span>
                  {doc.url ? (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-red font-bold text-[11px] font-mono hover:underline flex items-center gap-1"
                    >
                      <span>View PDF</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-mono">Not Uploaded</span>
                  )}
                </div>
              ))}
            </div>

            {/* AWARD BADGE TOOL */}
            <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-amber-800 uppercase flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-600" /> Award Achievement Badge & Boost Dispatch
              </span>
              <div className="flex gap-2">
                <select
                  value={badgeTitle}
                  onChange={e => setBadgeTitle(e.target.value)}
                  className="flex-1 p-2 text-xs rounded-xl bg-white border border-amber-300 text-slate-900 focus:outline-none"
                >
                  <option value="Top Performer of the Month">Top Performer of the Month</option>
                  <option value="Fastest Response Award">Fastest Response Award</option>
                  <option value="5-Star Customer Favourite">5-Star Customer Favourite</option>
                  <option value="Most Reliable Service Provider">Most Reliable Service Provider</option>
                  <option value="100+ Jobs Milestone">100+ Jobs Milestone</option>
                </select>
                <button
                  onClick={() => handleAwardBadge(selectedContractor.id)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-xl hover:bg-amber-700 transition-all shadow-2xs cursor-pointer"
                >
                  Grant Badge
                </button>
              </div>
            </div>

            {/* ADMIN ACTIONS */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <input
                type="text"
                placeholder="Optional notes or rejection reasons..."
                value={actionNotes}
                onChange={e => setActionNotes(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red"
              />

              <div className="flex justify-end gap-3 text-xs">
                <button
                  onClick={() => handleReject(selectedContractor.id)}
                  disabled={actionLoading}
                  className="px-4 py-2.5 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-all cursor-pointer"
                >
                  Reject Application
                </button>
                <button
                  onClick={() => handleRequestInfo(selectedContractor.id)}
                  disabled={actionLoading}
                  className="px-4 py-2.5 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 transition-all cursor-pointer"
                >
                  Request Info
                </button>
                <button
                  onClick={() => handleApprove(selectedContractor.id)}
                  disabled={actionLoading}
                  className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-md cursor-pointer"
                >
                  Approve Vetting
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
