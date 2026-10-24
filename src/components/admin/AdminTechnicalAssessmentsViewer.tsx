import React, { useState, useMemo } from 'react';
import {
  FileCheck, ShieldCheck, Search, Filter, Download, Eye,
  Lock, AlertTriangle, CheckCircle2, Clock, MapPin, Building,
  Radio, Video, Layers, Car, Wrench, Zap, Check, ChevronRight,
  ExternalLink, User, X, RefreshCw
} from 'lucide-react';
import { useAppState } from '../../contexts/AppStateContext';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { MemberEquipmentRegisterView } from '../assessment/MemberEquipmentRegisterView';
import { AssessmentPdfModal } from '../assessment/AssessmentPdfModal';
import { TechnicalAssessmentReport } from '../../types/technicalAssessment';

export function AdminTechnicalAssessmentsViewer() {
  const { state, reviewAssessment, addAuditLogLocal } = useAppState();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'Super Administrator';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LOCKED' | 'PENDING' | 'REPAIRS_REQUIRED'>('ALL');
  const [selectedAssessmentForModal, setSelectedAssessmentForModal] = useState<any | null>(null);
  const [pdfReportId, setPdfReportId] = useState<string | null>(null);

  // Supervisor Review inline modal state
  const [reviewModalAssessment, setReviewModalAssessment] = useState<any | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Normalize assessments data
  const assessmentsList = useMemo(() => {
    return state.assessments.map(a => {
      let structured: TechnicalAssessmentReport | null = null;
      if (a.structuredData) {
        try {
          structured = typeof a.structuredData === 'string' ? JSON.parse(a.structuredData) : a.structuredData;
        } catch {
          structured = null;
        }
      }
      const inspector = state.contractors.find(c => c.id === a.contractorId);
      const enquiry = state.enquiries.find(e => e.id === a.enquiryId);
      const customer = state.customers.find(c => c.name === enquiry?.customerName || c.email === enquiry?.email);

      const customerName = structured?.memberInfo ? `${structured.memberInfo.legalFirstName} ${structured.memberInfo.legalLastName}` : enquiry?.customerName || customer?.name || 'Customer';
      const address = structured?.addressInfo ? 
        `${structured.addressInfo.streetNumber ? structured.addressInfo.streetNumber + ' ' : ''}${structured.addressInfo.streetName}, ${structured.addressInfo.suburb || ''}` :
        enquiry?.address || customer?.address || 'Johannesburg, Gauteng';

      return {
        ...a,
        structured,
        inspectorName: inspector?.name || 'Technical Inspector',
        customerName,
        address,
        propertyType: structured?.addressInfo?.propertyType || 'House / Business',
        outcomeVerdict: a.outcome || structured?.outcome || 'All good',
        faultsCount: structured?.consolidatedFaults?.length || a.issuesFound?.length || 0,
        estimatedCostZar: structured?.totalPreMembershipRepairsZar || a.estimatedCost || 0,
        isLocked: a.baselineLocked || structured?.baselineLocked || false,
      };
    });
  }, [state.assessments, state.contractors, state.enquiries, state.customers]);

  const filteredAssessments = useMemo(() => {
    return assessmentsList.filter(item => {
      const matchesSearch = 
        item.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.inspectorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = 
        statusFilter === 'ALL' ? true :
        statusFilter === 'LOCKED' ? item.isLocked :
        statusFilter === 'PENDING' ? !item.isLocked :
        statusFilter === 'REPAIRS_REQUIRED' ? item.outcomeVerdict === 'Repairs required' : true;

      return matchesSearch && matchesStatus;
    });
  }, [assessmentsList, searchQuery, statusFilter]);

  const handleDownloadPDF = (id: string) => {
    const url = api.getPDFUrl('assessment', id);
    window.open(url, '_blank');
  };

  const handleSupervisorSubmit = async (action: 'APPROVE' | 'RETURN_FOR_CORRECTION') => {
    if (!reviewModalAssessment) return;
    setIsSubmittingReview(true);
    try {
      await reviewAssessment(reviewModalAssessment.id, action, reviewNotes);
      addAuditLogLocal(
        `Technical Assessment ${action === 'APPROVE' ? 'Approved & Locked' : 'Returned for Correction'}`,
        `Supervisor ${user?.name || user?.email} reviewed assessment ${reviewModalAssessment.id}. Notes: ${reviewNotes || 'None'}`
      );
      alert(`Technical assessment ${action === 'APPROVE' ? 'Approved & Baseline Permanently Locked' : 'Returned for Correction'}.`);
      setReviewModalAssessment(null);
      setReviewNotes('');
    } catch (err: any) {
      alert(err.message || 'Failed to submit supervisor review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const totalAssessments = assessmentsList.length;
  const lockedCount = assessmentsList.filter(a => a.isLocked).length;
  const pendingReviewCount = assessmentsList.filter(a => !a.isLocked).length;
  const repairsRequiredCount = assessmentsList.filter(a => a.outcomeVerdict === 'Repairs required').length;

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* HEADER HERO */}
      <div className="bg-gradient-to-r from-[#091C3E] via-slate-900 to-[#142D59] p-6 rounded-3xl border border-slate-800 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#CC322C]/20 text-[#CC322C] border border-[#CC322C]/40 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
              <FileCheck className="w-3.5 h-3.5" />
              Same Day Assist Version 2.0 Standards
            </span>
            {isSuperAdmin && (
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-mono font-bold uppercase">
                Supervisor Authority
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold font-brand-header tracking-wide">Technical Assessments & Equipment Registers</h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Device-by-device verified baseline security registers for residential and commercial premises. Monitor pre-existing equipment conditions, cable types, walk tests, and manage supervisor baseline locking.
          </p>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
            <span className="text-[9px] uppercase font-mono text-slate-400 block">Total Assessed</span>
            <span className="text-xl font-bold font-brand-header text-white">{totalAssessments}</span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
            <span className="text-[9px] uppercase font-mono text-slate-400 block">Locked Baselines</span>
            <span className="text-xl font-bold font-brand-header text-emerald-400">{lockedCount}</span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
            <span className="text-[9px] uppercase font-mono text-slate-400 block">Pending Review</span>
            <span className="text-xl font-bold font-brand-header text-amber-400">{pendingReviewCount}</span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
            <span className="text-[9px] uppercase font-mono text-slate-400 block">Repairs Required</span>
            <span className="text-xl font-bold font-brand-header text-red-400">{repairsRequiredCount}</span>
          </div>
        </div>
      </div>

      {/* SEARCH & FILTERS TRAY */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by client name, address, inspector or assessment ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-navy"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'ALL' ? 'bg-navy text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Registers ({totalAssessments})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('LOCKED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'LOCKED' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-emerald-800 hover:bg-slate-200'
            }`}
          >
            <Lock className="w-3 h-3" />
            <span>Locked ({lockedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('PENDING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'PENDING' ? 'bg-amber-500 text-white shadow-xs' : 'bg-slate-100 text-amber-800 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>Pending Review ({pendingReviewCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('REPAIRS_REQUIRED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'REPAIRS_REQUIRED' ? 'bg-red text-white shadow-xs' : 'bg-slate-100 text-red hover:bg-slate-200'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Repairs ({repairsRequiredCount})</span>
          </button>
        </div>
      </div>

      {/* ASSESSMENTS LIST */}
      <div className="space-y-4">
        {filteredAssessments.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center gap-3">
            <FileCheck className="w-12 h-12 text-slate-300" />
            <h3 className="text-base font-bold text-slate-800">No Technical Assessments Located</h3>
            <p className="text-xs text-slate-500 max-w-md">
              No technical assessments matching the query were found. Assessments conducted by certified field inspectors will populate here automatically.
            </p>
          </div>
        ) : (
          filteredAssessments.map(item => {
            const systems = item.structured?.systems;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-all p-5 shadow-xs flex flex-col gap-4"
              >
                {/* TOP ROW: CLIENT, ADDRESS & LOCK STATUS */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-navy bg-slate-100 px-2 py-0.5 rounded">
                        #{item.id.slice(0, 10)}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-navy text-white uppercase font-mono">
                        {item.propertyType}
                      </span>
                      {item.isLocked ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 font-mono">
                          <Lock className="w-3 h-3 text-emerald-600" />
                          LOCKED BASELINE
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[9.5px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-amber-600" />
                          PENDING SUPERVISOR REVIEW
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold uppercase font-mono ${
                        item.outcomeVerdict === 'All good' ? 'bg-emerald-100 text-emerald-800' :
                        item.outcomeVerdict === 'Repairs required' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        Outcome: {item.outcomeVerdict}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mt-1">
                      <span>{item.customerName}</span>
                      <span className="text-xs text-slate-500 font-normal flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {item.address}
                      </span>
                    </h3>
                  </div>

                  {/* INSPECTOR & TIMESTAMPS */}
                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">
                      Certified Surveyor
                    </span>
                    <p className="text-xs font-bold text-slate-900">{item.inspectorName}</p>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                      {item.scheduledAt ? new Date(item.scheduledAt).toLocaleDateString() : 'Active Record'}
                    </span>
                  </div>
                </div>

                {/* MIDDLE ROW: 9-SYSTEM COVERAGE OVERVIEW */}
                <div className="space-y-2">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block font-mono">
                    Essential Security Systems Baseline Status
                  </span>

                  <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1.5 text-center">
                    {[
                      { name: 'Alarms', data: systems?.alarm, icon: Radio },
                      { name: 'CCTV', data: systems?.cctv, icon: Video },
                      { name: 'Access', data: systems?.accessControl, icon: ShieldCheck },
                      { name: 'Intercom', data: systems?.intercom, icon: Layers },
                      { name: 'Garage', data: systems?.garageDoors, icon: Car },
                      { name: 'Gates', data: systems?.gateMotors, icon: Wrench },
                      { name: 'Fence', data: systems?.electricFence, icon: Zap },
                      { name: 'Boom Gates', data: systems?.boomGates, icon: Car },
                      { name: 'Turnstiles', data: systems?.turnstiles, icon: ShieldCheck },
                    ].map((sys, idx) => {
                      const presence = sys.data?.presence || 'Not installed';
                      const isInstalled = presence.includes('Installed');
                      const isFaulty = presence.includes('partially') || presence.includes('not functional');

                      return (
                        <div
                          key={idx}
                          className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                            !isInstalled ? 'bg-slate-50 border-slate-200 text-slate-400' :
                            isFaulty ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold' :
                            'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                          }`}
                        >
                          <sys.icon className="w-3.5 h-3.5" />
                          <span className="text-[9px] truncate w-full">{sys.name}</span>
                          <span className="text-[8px] font-mono">
                            {!isInstalled ? 'None' : isFaulty ? 'Faulty' : 'Pass'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* DEFECTS & OBSERVATIONS FOOTER */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs">
                  <div className="md:col-span-8 space-y-1">
                    <span className="text-[9px] uppercase font-bold text-slate-500 font-mono">
                      Technician Observations & Pre-existing Faults
                    </span>
                    <p className="text-slate-800 text-[11px] leading-relaxed">
                      {item.structured?.technicianObservations || item.contractorNotes || (
                        item.faultsCount > 0 
                          ? `${item.faultsCount} pre-existing items logged for rectification.` 
                          : 'Full systems walk-test verified. Baseline conforms to Same Day Assist rules.'
                      )}
                    </p>
                  </div>

                  <div className="md:col-span-4 flex flex-col justify-between text-right md:border-l md:border-slate-200 md:pl-4">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 font-mono block">
                        Rectification Cost (ZAR)
                      </span>
                      <span className="text-base font-bold font-brand-header text-navy">
                        R{item.estimatedCostZar.toLocaleString()}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {item.faultsCount} Pre-existing Defects
                    </span>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    {/* Supervisor Review Action */}
                    <button
                      type="button"
                      onClick={() => {
                        setReviewModalAssessment(item);
                        setReviewNotes(item.structured?.supervisorReview?.supervisorNotes || '');
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>{item.isLocked ? 'Supervisor Audit & Notes' : 'Supervisor Review & Lock'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedAssessmentForModal(item.structured || item)}
                      className="px-4 py-2 rounded-xl bg-navy hover:bg-[#142D59] text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect Equipment Register</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadPDF(item.id)}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200"
                      title="Download Official A4 Technical Assessment Report"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Export A4 PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: INTERACTIVE EQUIPMENT REGISTER INSPECTION */}
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
              isSupervisor={true}
              onSupervisorAction={async (action, notes) => {
                await reviewAssessment(selectedAssessmentForModal.id, action, notes);
                setSelectedAssessmentForModal(null);
              }}
            />
          </div>
        </div>
      )}

      {/* MODAL 2: SUPERVISOR REVIEW & DECISION */}
      {reviewModalAssessment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/40 rounded-3xl max-w-lg w-full p-6 space-y-4 text-slate-100 shadow-2xl">
            <div className="flex items-center gap-2 text-purple-400">
              <FileCheck className="w-6 h-6 text-purple-400" />
              <h3 className="text-base font-bold">Supervisor Review — Assessment #{reviewModalAssessment.id}</h3>
            </div>
            <p className="text-xs text-slate-300">
              Approve this technical assessment to **permanently lock the baseline equipment register**. Once approved, this establishes the member's verified service baseline against which future claims and repairs are compared.
            </p>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase font-mono font-bold">
                Supervisor Audit Remarks
              </label>
              <textarea
                value={reviewNotes}
                onChange={e => setReviewNotes(e.target.value)}
                placeholder="e.g., Verified walk-test for alarm and CCTV RG59 wiring. Pre-existing gate battery issue confirmed with quote generated..."
                className="w-full h-24 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setReviewModalAssessment(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSubmittingReview}
                  onClick={() => handleSupervisorSubmit('RETURN_FOR_CORRECTION')}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all"
                >
                  Return for Correction
                </button>
                <button
                  type="button"
                  disabled={isSubmittingReview}
                  onClick={() => handleSupervisorSubmit('APPROVE')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg transition-all"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isSubmittingReview ? 'Locking Baseline...' : 'Approve & Lock Baseline'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
