import React, { useState, useMemo } from 'react';
import {
  CheckCircle2, ShieldCheck, FileText, Camera, Video, Package, Download,
  AlertTriangle, Search, Filter, Clock, User, MapPin, Phone, ExternalLink,
  Eye, Star, X, ChevronRight, FileCheck, ShieldAlert, Award, Calendar,
  Wrench, ThumbsUp, AlertCircle, Flag, Info
} from 'lucide-react';
import { useAppState } from '../../contexts/AppStateContext';
import { useAuth } from '../../contexts/AuthContext';
import { Job, ReplacedPart } from '../../types';
import { api } from '../../services/api';

export function AdminCompletedJobsViewer() {
  const { state, addAuditLogLocal } = useAppState();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'Super Administrator';

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [contractorFilter, setContractorFilter] = useState('ALL');
  const [flagFilter, setFlagFilter] = useState<'ALL' | 'FLAGGED' | 'VERIFIED'>('ALL');
  const [selectedJobForModal, setSelectedJobForModal] = useState<Job | any | null>(null);

  // Safety & dispute internal flags state (persisted locally for audit)
  const [flaggedJobs, setFlaggedJobs] = useState<Record<string, { reason: string; flaggedAt: string; flaggedBy: string }>>(() => {
    try {
      const saved = localStorage.getItem('sda_flagged_jobs_safety');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [flagInputModal, setFlagInputModal] = useState<string | null>(null);
  const [flagReasonText, setFlagReasonText] = useState('');

  // Filter completed jobs
  const completedJobs = useMemo(() => {
    return state.jobs.filter(j => 
      ['Completed', 'Service Completed', 'Work Completed', 'Closed', 'Rated'].includes(j.status) ||
      Boolean(j.completedAt) ||
      Boolean(j.photoAfterUrl || j.contractorNotes)
    );
  }, [state.jobs]);

  const filteredJobs = useMemo(() => {
    return completedJobs.filter(job => {
      const matchesSearch = 
        (job.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (job.customerAddress || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (job.serviceType || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (job.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (job.contractorNotes || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = categoryFilter === 'ALL' || job.serviceType === categoryFilter;
      const matchesContractor = contractorFilter === 'ALL' || job.assignedContractorId === contractorFilter;
      
      const isFlagged = Boolean(flaggedJobs[job.id]);
      const matchesFlag = 
        flagFilter === 'ALL' ? true :
        flagFilter === 'FLAGGED' ? isFlagged : !isFlagged;

      return matchesSearch && matchesCategory && matchesContractor && matchesFlag;
    });
  }, [completedJobs, searchQuery, categoryFilter, contractorFilter, flagFilter, flaggedJobs]);

  // Unique categories & contractors for filters
  const categories = useMemo(() => {
    const set = new Set<string>();
    completedJobs.forEach(j => { if (j.serviceType) set.add(j.serviceType); });
    return Array.from(set);
  }, [completedJobs]);

  const toggleSafetyFlag = (jobId: string) => {
    if (flaggedJobs[jobId]) {
      const updated = { ...flaggedJobs };
      delete updated[jobId];
      setFlaggedJobs(updated);
      localStorage.setItem('sda_flagged_jobs_safety', JSON.stringify(updated));
      addAuditLogLocal('Safety Flag Removed', `Admin ${user?.name || user?.email} removed safety dispute flag from Job ${jobId}`);
    } else {
      setFlagInputModal(jobId);
      setFlagReasonText('');
    }
  };

  const handleConfirmSafetyFlag = () => {
    if (!flagInputModal) return;
    const updated = {
      ...flaggedJobs,
      [flagInputModal]: {
        reason: flagReasonText || 'Safety inspection review required / Customer concern noted',
        flaggedAt: new Date().toISOString(),
        flaggedBy: user?.name || user?.email || 'Super Administrator'
      }
    };
    setFlaggedJobs(updated);
    localStorage.setItem('sda_flagged_jobs_safety', JSON.stringify(updated));
    addAuditLogLocal('Safety Dispute Flagged', `Job ${flagInputModal} flagged for safety review: "${flagReasonText || 'Safety audit required'}"`);
    setFlagInputModal(null);
    setFlagReasonText('');
  };

  const handleDownloadCertificate = (jobId: string) => {
    const url = api.getPDFUrl('completion', jobId);
    window.open(url, '_blank');
  };

  // Helper to parse parts
  const parseParts = (partsReplaced: any): ReplacedPart[] => {
    if (!partsReplaced) return [];
    if (Array.isArray(partsReplaced)) return partsReplaced;
    if (typeof partsReplaced === 'string') {
      try {
        const parsed = JSON.parse(partsReplaced);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return [{ name: partsReplaced, quantity: 1 }];
      }
    }
    return [];
  };

  const totalCompletedCount = completedJobs.length;
  const verifiedProofCount = completedJobs.filter(j => j.photoBeforeUrl || j.photoAfterUrl || j.videoBeforeUrl || j.videoAfterUrl).length;
  const partsReplacedCount = completedJobs.filter(j => j.partsReplaced && parseParts(j.partsReplaced).length > 0).length;
  const flaggedCount = Object.keys(flaggedJobs).length;

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* HEADER HERO */}
      <div className="bg-gradient-to-r from-slate-900 via-[#091C3E] to-slate-900 p-6 rounded-3xl border border-slate-800 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Contractor Records
            </span>
            {isSuperAdmin && (
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-mono font-bold uppercase">
                Super Admin Master Log
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold font-brand-header tracking-wide">Completed Jobs & Safety Records</h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Audit ground contractor resolutions, verify on-site before/after media evidence, monitor replaced parts, and preserve timestamped safety records for client and company liability protection.
          </p>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
            <span className="text-[9px] uppercase font-mono text-slate-400 block">Total Jobs Done</span>
            <span className="text-xl font-bold font-brand-header text-white">{totalCompletedCount}</span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
            <span className="text-[9px] uppercase font-mono text-slate-400 block">Verified Proof</span>
            <span className="text-xl font-bold font-brand-header text-emerald-400">
              {totalCompletedCount > 0 ? Math.round((verifiedProofCount / totalCompletedCount) * 100) : 100}%
            </span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
            <span className="text-[9px] uppercase font-mono text-slate-400 block">Parts Exchanged</span>
            <span className="text-xl font-bold font-brand-header text-blue-400">{partsReplacedCount}</span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
            <span className="text-[9px] uppercase font-mono text-slate-400 block">Safety Flags</span>
            <span className={`text-xl font-bold font-brand-header ${flaggedCount > 0 ? 'text-red-400' : 'text-slate-400'}`}>
              {flaggedCount}
            </span>
          </div>
        </div>
      </div>

      {/* SEARCH & FILTERS TRAY */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by customer name, address, job ID, notes, parts..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-navy"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Categories ({completedJobs.length})</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Contractor Filter */}
          <select
            value={contractorFilter}
            onChange={e => setContractorFilter(e.target.value)}
            className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Responders ({state.contractors.length})</option>
            {state.contractors.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Flagged Filter */}
          <select
            value={flagFilter}
            onChange={e => setFlagFilter(e.target.value as any)}
            className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Records</option>
            <option value="FLAGGED">⚠️ Flagged Safety Issues ({flaggedCount})</option>
            <option value="VERIFIED">✓ Fully Cleared Records</option>
          </select>
        </div>
      </div>

      {/* JOBS COMPLETED LIST */}
      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center gap-3">
            <CheckCircle2 className="w-12 h-12 text-slate-300" />
            <h3 className="text-base font-bold text-slate-800">No Completed Jobs Found</h3>
            <p className="text-xs text-slate-500 max-w-md">
              No jobs matching your filter criteria were located in the completed work archives.
            </p>
          </div>
        ) : (
          filteredJobs.map(job => {
            const contractor = state.contractors.find(c => c.id === job.assignedContractorId);
            const isFlagged = Boolean(flaggedJobs[job.id]);
            const flagData = flaggedJobs[job.id];
            const parts = parseParts(job.partsReplaced);
            const hasMedia = Boolean(job.photoBeforeUrl || job.photoAfterUrl || job.videoBeforeUrl || job.videoAfterUrl);

            return (
              <div
                key={job.id}
                className={`bg-white rounded-2xl border transition-all p-5 shadow-xs flex flex-col gap-4 ${
                  isFlagged 
                    ? 'border-red-300 bg-red-50/20 shadow-md ring-1 ring-red-400' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* TOP BAR: BADGES, CUSTOMER & STATUS */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-navy bg-slate-100 px-2 py-0.5 rounded">
                        #{job.id.slice(0, 10)}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-navy text-white uppercase font-mono">
                        {job.serviceType || 'Emergency Assistance'}
                      </span>
                      {job.customerType === 'NON_MEMBER_EMERGENCY' ? (
                        <span className="px-2 py-0.5 rounded text-[9.5px] font-bold bg-amber-100 text-amber-900 border border-amber-300 font-mono">
                          NON-MEMBER CALLOUT
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[9.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono">
                          ACTIVE MEMBER
                        </span>
                      )}
                      {isFlagged && (
                        <span className="px-2 py-0.5 rounded text-[9.5px] font-bold bg-red-600 text-white flex items-center gap-1 animate-pulse">
                          <AlertTriangle className="w-3 h-3" />
                          SAFETY / DISPUTE FLAGGED
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mt-1">
                      <span>{job.customerName || 'Customer Property'}</span>
                      <span className="text-xs text-slate-500 font-normal flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {job.customerAddress || 'Sandton, Johannesburg'}
                      </span>
                    </h3>
                  </div>

                  {/* TIMESTAMPS & COMPLETION BADGE */}
                  <div className="text-left sm:text-right shrink-0">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{job.status}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono block mt-1">
                      Completed: {job.completedAt ? new Date(job.completedAt).toLocaleString() : new Date(job.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* MIDDLE ROW: CONTRACTOR INFO, WORK PERFORMED & REPLACED PARTS */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Contractor Box */}
                  <div className="md:col-span-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 flex flex-col justify-between">
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block font-mono">
                      Attending Responder
                    </span>
                    <div className="mt-1">
                      <p className="text-xs font-bold text-slate-900">{contractor?.name || 'Authorized Field Contractor'}</p>
                      <p className="text-[10px] text-slate-600 font-mono">{contractor?.specialty || job.serviceType}</p>
                      <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" /> {contractor?.phone || (job.assignedContractor as any)?.phone || '+27 11 555 0000'}
                      </p>
                    </div>

                    {/* Ground Rating */}
                    {job.rating && (
                      <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                        <span className="text-[10px] text-slate-500 font-medium">Customer Rating:</span>
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{job.rating} / 5</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Work Description & Notes */}
                  <div className="md:col-span-8 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider font-mono">
                          Work Resolution & Ground Notes
                        </span>
                        {job.finalAmount && job.finalAmount > 0 && (
                          <span className="text-xs font-bold text-navy font-mono">
                            ZAR Value: R{job.finalAmount.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-800 leading-relaxed font-medium">
                        {job.servicePerformed || job.contractorNotes || job.description || 'Ground work completed according to Same Day Assist standards.'}
                      </p>
                    </div>

                    {/* Evidence & Parts Badges Tray */}
                    <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-slate-200">
                      {job.photoBeforeUrl && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                          <Camera className="w-3 h-3" /> Before Photo
                        </span>
                      )}
                      {job.photoAfterUrl && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          <Camera className="w-3 h-3" /> After Photo
                        </span>
                      )}
                      {job.videoBeforeUrl && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">
                          <Video className="w-3 h-3" /> Before Video
                        </span>
                      )}
                      {job.videoAfterUrl && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                          <Video className="w-3 h-3" /> After Video
                        </span>
                      )}
                      {parts.length > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">
                          <Package className="w-3 h-3" /> {parts.length} Part{parts.length > 1 ? 's' : ''} Replaced
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">Labour Only / No Hardware Replaced</span>
                      )}
                      {job.contractorSignature && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-bold font-mono">
                          ✓ Signed by Tech
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* SAFETY FLAG NOTE IF FLAGGED */}
                {isFlagged && flagData && (
                  <div className="bg-red-100 border border-red-200 p-3 rounded-xl flex items-start gap-2 text-xs text-red-900">
                    <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="font-bold">Flagged by {flagData.flaggedBy} on {new Date(flagData.flaggedAt).toLocaleDateString()}:</span>
                      <p className="mt-0.5">{flagData.reason}</p>
                    </div>
                  </div>
                )}

                {/* ACTION BUTTONS */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleSafetyFlag(job.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isFlagged 
                          ? 'bg-red-600 hover:bg-red-700 text-white' 
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                      title={isFlagged ? 'Click to resolve safety flag' : 'Flag safety issue or client complaint'}
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span>{isFlagged ? 'Clear Safety Flag' : 'Flag for Safety Review'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedJobForModal(job)}
                      className="px-4 py-2 rounded-xl bg-navy hover:bg-[#142D59] text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect Handover Evidence & Parts</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadCertificate(job.id)}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200"
                      title="Download Official Job Completion Certificate (PDF)"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-600" />
                      <span>PDF Certificate</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: FULL EVIDENCE & SAFETY AUDIT INSPECTION */}
      {selectedJobForModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-6 relative shadow-2xl text-slate-100 space-y-6">
            <button
              onClick={() => setSelectedJobForModal(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors z-10"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest">
                  Verified Ground Audit & Liability Record
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">Job Completion & Handover Evidence</h3>
              <p className="text-xs text-slate-400">
                Job ID #{selectedJobForModal.id} • {selectedJobForModal.customerName} • {selectedJobForModal.customerAddress}
              </p>
            </div>

            {/* BEFORE & AFTER MEDIA GALLERY */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-brand-header flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-400" />
                <span>On-Site Media Proof (Before vs After)</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* BEFORE CONTAINER */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-amber-400 uppercase font-mono">Pre-Service Condition</span>
                    <span className="text-[10px] text-slate-500">Incident Capture</span>
                  </div>

                  {selectedJobForModal.photoBeforeUrl ? (
                    <div className="rounded-xl overflow-hidden border border-slate-800 bg-black aspect-video flex items-center justify-center">
                      <img
                        src={selectedJobForModal.photoBeforeUrl}
                        alt="Before Repair"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/50 p-8 text-center text-xs text-slate-500">
                      No before photo submitted
                    </div>
                  )}

                  {selectedJobForModal.videoBeforeUrl && (
                    <div className="pt-2">
                      <span className="text-[10px] text-slate-400 block mb-1 font-mono">Video Diagnostics:</span>
                      <video src={selectedJobForModal.videoBeforeUrl} controls className="w-full rounded-xl border border-slate-800" />
                    </div>
                  )}
                </div>

                {/* AFTER CONTAINER */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-emerald-400 uppercase font-mono">Resolved & Tested Handover</span>
                    <span className="text-[10px] text-slate-500">Completed Capture</span>
                  </div>

                  {selectedJobForModal.photoAfterUrl ? (
                    <div className="rounded-xl overflow-hidden border border-slate-800 bg-black aspect-video flex items-center justify-center">
                      <img
                        src={selectedJobForModal.photoAfterUrl}
                        alt="After Repair"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/50 p-8 text-center text-xs text-slate-500">
                      No after photo submitted
                    </div>
                  )}

                  {selectedJobForModal.videoAfterUrl && (
                    <div className="pt-2">
                      <span className="text-[10px] text-slate-400 block mb-1 font-mono">Operational Video:</span>
                      <video src={selectedJobForModal.videoAfterUrl} controls className="w-full rounded-xl border border-slate-800" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* REPLACED HARDWARE & COMPONENTS TABLE */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-brand-header flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-400" />
                <span>Installed Replacement Components & Hardware</span>
              </h4>

              {(() => {
                const parts = parseParts(selectedJobForModal.partsReplaced);
                if (parts.length === 0) {
                  return (
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-400 font-mono text-center">
                      No replacement hardware was invoiced for this service ticket (Labour / Reset only).
                    </div>
                  );
                }
                return (
                  <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-950">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-800/60 font-mono text-[9px] uppercase font-bold text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="p-3">Component / Part Description</th>
                          <th className="p-3">Part Code / Serial</th>
                          <th className="p-3 text-center">Qty</th>
                          <th className="p-3 text-right">ZAR Cost</th>
                          <th className="p-3">Warranty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {parts.map((p, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/40">
                            <td className="p-3 font-bold text-white">{p.name || 'Component'}</td>
                            <td className="p-3 font-mono text-slate-400">{p.id || `P-${1000 + idx}`}</td>
                            <td className="p-3 font-mono text-center">{p.quantity || 1}</td>
                            <td className="p-3 font-mono text-right text-emerald-400 font-bold">
                              R{(p.cost || 0).toLocaleString()}
                            </td>
                            <td className="p-3 text-slate-300">
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono">
                                12 Months
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>

            {/* CONTRACTOR & DIGITAL SIGNATURE AUDIT */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-brand-header flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span>On-Site Ground Sign-Off</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-mono block uppercase">Contractor Sign-off</span>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <p className="font-bold text-white">{selectedJobForModal.assignedContractorName || 'Technician'}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Timestamp: {selectedJobForModal.completedAt ? new Date(selectedJobForModal.completedAt).toLocaleString() : 'Recorded'}
                    </p>
                    {selectedJobForModal.contractorSignature ? (
                      <p className="mt-2 text-emerald-400 font-mono text-[10px]">
                        ✓ Cryptographically Stamped Signature
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-mono block uppercase">Customer Feedback & Acceptance</span>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <p className="font-bold text-white">{selectedJobForModal.customerName}</p>
                    <p className="text-[10px] text-slate-400 italic">
                      "{selectedJobForModal.ratingComment || 'Service verified and accepted on site.'}"
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedJobForModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Audit Record
              </button>

              <button
                type="button"
                onClick={() => handleDownloadCertificate(selectedJobForModal.id)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg"
              >
                <Download className="w-4 h-4" />
                <span>Export PDF Certificate</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: SAFETY DISPUTE REASON PROMPT */}
      {flagInputModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/40 rounded-3xl max-w-lg w-full p-6 space-y-4 text-slate-100 shadow-2xl">
            <div className="flex items-center gap-2 text-red-400">
              <ShieldAlert className="w-6 h-6 text-red-500" />
              <h3 className="text-base font-bold">Flag Job #{flagInputModal} for Safety Review</h3>
            </div>
            <p className="text-xs text-slate-300">
              Enter the safety concern, client complaint, or reason for administrative auditing. This notice will be pinned to this work ticket to preserve auditability.
            </p>
            <textarea
              value={flagReasonText}
              onChange={e => setFlagReasonText(e.target.value)}
              placeholder="e.g., Client called reporting that the gate safety beam is tripping periodically. Contractor to return for warranty inspection..."
              className="w-full h-28 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 resize-none"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFlagInputModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSafetyFlag}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md"
              >
                Apply Safety Flag
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
