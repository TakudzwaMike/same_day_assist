import React, { useState } from 'react';
import {
  ShieldCheck, FileText, CheckCircle2, AlertTriangle, Download,
  ExternalLink, Search, Clock, MapPin, Radio, Video, Layers,
  Car, Wrench, Zap, Check, Lock, ChevronDown, ChevronUp
} from 'lucide-react';
import { TechnicalAssessmentReport } from '../../types/technicalAssessment';
import { api } from '../../services/api';
import { AssessmentPdfModal } from './AssessmentPdfModal';

interface MemberEquipmentRegisterViewProps {
  assessment: TechnicalAssessmentReport | any;
  assessmentId?: string;
  isSupervisor?: boolean;
  onSupervisorAction?: (action: 'APPROVE' | 'RETURN_FOR_CORRECTION', notes: string) => Promise<void>;
}

export function MemberEquipmentRegisterView({
  assessment,
  assessmentId,
  isSupervisor = false,
  onSupervisorAction,
}: MemberEquipmentRegisterViewProps) {
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedSystem, setSelectedSystem] = useState<string>('ALL');
  const [supervisorNotes, setSupervisorNotes] = useState('');
  const [isProcessingSupervisor, setIsProcessingSupervisor] = useState(false);

  const reportId = assessment?.id || assessmentId || 'BASE-REG-01';
  const downloadUrl = api.getPDFUrl('assessment', reportId);

  const systems = assessment?.systems || {};
  const faults = assessment?.consolidatedFaults || [];
  const member = assessment?.memberInfo || {};
  const addr = assessment?.addressInfo || {};

  const systemCards = [
    { key: 'alarm', name: 'Intruder Alarm System', data: systems.alarm, icon: Radio },
    { key: 'cctv', name: 'CCTV Surveillance', data: systems.cctv, icon: Video },
    { key: 'accessControl', name: 'Access Control', data: systems.accessControl, icon: ShieldCheck },
    { key: 'intercom', name: 'Intercom & Doorbells', data: systems.intercom, icon: Layers },
    { key: 'garageDoors', name: 'Garage Automation', data: systems.garageDoors, icon: Car },
    { key: 'gateMotors', name: 'Gate Automation', data: systems.gateMotors, icon: Wrench },
    { key: 'electricFence', name: 'Electric Fencing', data: systems.electricFence, icon: Zap },
    { key: 'boomGates', name: 'Boom Gate Systems (v2.0)', data: systems.boomGates, icon: Car },
    { key: 'turnstiles', name: 'Turnstile Systems (v2.0)', data: systems.turnstiles, icon: ShieldCheck },
  ].filter(s => s.data && s.data.presence !== 'Not installed');

  const handleSupervisorSubmit = async (action: 'APPROVE' | 'RETURN_FOR_CORRECTION') => {
    if (!onSupervisorAction) return;
    setIsProcessingSupervisor(true);
    try {
      await onSupervisorAction(action, supervisorNotes);
      alert(`Supervisor decision (${action}) recorded successfully.`);
    } catch (err: any) {
      alert(err.message || 'Failed to record supervisor action');
    } finally {
      setIsProcessingSupervisor(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-800 dark:text-slate-100">
      {/* HEADER CARD */}
      <div className="bg-[#091C3E] text-white rounded-3xl p-6 shadow-xl border border-[#142D59] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#CC322C] font-mono text-xs font-bold uppercase tracking-widest mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Verified Baseline Security Equipment Register</span>
          </div>
          <h2 className="text-2xl font-black italic tracking-wide text-white uppercase font-brand-header">
            Same Day Assist Asset Registry
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Device-level audited baseline for <span className="font-bold text-white">{assessment?.customerName || member.legalFirstName || 'Registered Property'}</span>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowPdfModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#CC322C] hover:bg-[#b02a25] text-white text-xs font-bold shadow-lg transition-all cursor-pointer flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            <span>View A4 PDF Report</span>
          </button>

          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-all cursor-pointer flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </a>
        </div>
      </div>

      {/* METRIC PILLS & STATUS BANNER */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Assessed Systems</span>
          <span className="text-xl font-black block text-[#091C3E] dark:text-blue-300">
            {systemCards.length} Active
          </span>
          <span className="text-[10px] text-emerald-600 font-medium">All Walk-tested</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Pre-Existing Defects</span>
          <span className={`text-xl font-black block ${faults.length > 0 ? 'text-[#CC322C]' : 'text-emerald-600'}`}>
            {faults.length} Logged
          </span>
          <span className="text-[10px] text-slate-500">Documented Baseline</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Baseline Lock</span>
          <span className="text-xl font-black block text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-emerald-500" />
            <span>{assessment?.baselineLocked ? 'LOCKED' : 'PENDING'}</span>
          </span>
          <span className="text-[10px] text-slate-500">Immutable Audit Trail</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Technical Verdict</span>
          <span className="text-sm font-black block text-[#091C3E] dark:text-amber-300 uppercase mt-1">
            {assessment?.outcome || (faults.length > 0 ? 'Repairs required' : 'All good')}
          </span>
          <span className="text-[10px] text-slate-500">Version 2.0 Audited</span>
        </div>
      </div>

      {/* SUPERVISOR APPROVAL BAR (IF SUPERVISOR) */}
      {isSupervisor && !assessment?.baselineLocked && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-5 rounded-3xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Supervisor Technical Review Queue</span>
            </span>
            <span className="text-[10px] font-mono text-amber-600">Pending Review</span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300">
            Review the equipment baseline and pre-existing defect register. Approving this submission locks the historical baseline and enables member assistance activation.
          </p>

          <input
            type="text"
            placeholder="Add supervisor notes or required correction remarks..."
            value={supervisorNotes}
            onChange={e => setSupervisorNotes(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-xs"
          />

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              disabled={isProcessingSupervisor}
              onClick={() => handleSupervisorSubmit('APPROVE')}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Approve & Lock Historical Baseline</span>
            </button>

            <button
              type="button"
              disabled={isProcessingSupervisor}
              onClick={() => handleSupervisorSubmit('RETURN_FOR_CORRECTION')}
              className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-red-600 font-bold text-xs hover:bg-slate-300 cursor-pointer transition-all"
            >
              Return to Technician for Correction
            </button>
          </div>
        </div>
      )}

      {/* SEARCH & FILTER CONTROLS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search installed devices, serials, zones..."
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['ALL', 'alarm', 'cctv', 'accessControl', 'gateMotors', 'boomGates', 'turnstiles'].map(k => (
            <button
              key={k}
              type="button"
              onClick={() => setSelectedSystem(k)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedSystem === k
                  ? 'bg-[#091C3E] text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {k.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* SYSTEMS BREAKDOWN LIST */}
      <div className="space-y-4">
        {systemCards
          .filter(sc => selectedSystem === 'ALL' || sc.key === selectedSystem)
          .map(card => {
            const Icon = card.icon;
            const data = card.data;

            return (
              <div key={card.key} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[#CC322C]">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#091C3E] dark:text-white uppercase font-brand-header">
                        {card.name}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {data.presence}
                      </p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    data.presence.includes('fully') ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    {data.presence}
                  </span>
                </div>

                {/* DEVICE LEVEL REGISTER DETAILS */}
                <div className="text-xs space-y-2">
                  {/* ALARM DETECTORS */}
                  {card.key === 'alarm' && data.detectors && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {data.detectors.map((d: any) => (
                        <div key={d.id} className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                          <div>
                            <span className="font-bold block text-slate-800 dark:text-slate-200">Zone {d.zoneNumber}: {d.descriptiveName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{d.type} • {d.location}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            d.testResult === 'Pass' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {d.testResult || 'Pass'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* CCTV CAMERAS */}
                  {card.key === 'cctv' && data.cameras && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {data.cameras.map((c: any) => (
                        <div key={c.id} className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                          <div>
                            <span className="font-bold block text-slate-800 dark:text-slate-200">Cam {c.cameraNumber}: {c.descriptiveName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{c.formFactor} • {c.resolutionMp} • {c.nightVisionTech}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.testResult === 'Pass' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {c.testResult || 'Pass'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* BOOM GATES */}
                  {card.key === 'boomGates' && data.units && (
                    <div className="space-y-2">
                      {data.units.map((u: any, idx: number) => (
                        <div key={u.id || idx} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                          <div>
                            <span className="font-bold block text-slate-800 dark:text-slate-200">Boom #{idx + 1}: {u.entranceLaneName} ({u.direction})</span>
                            <span className="text-[10px] text-slate-400 font-mono">Mfr: {u.manufacturer} • Arm: {u.boomArmLengthMeters}m ({u.boomArmType}) • S/N: {u.serialNumber}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {u.testResult || 'Pass'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* TURNSTILES */}
                  {card.key === 'turnstiles' && data.units && (
                    <div className="space-y-2">
                      {data.units.map((t: any, idx: number) => (
                        <div key={t.id || idx} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                          <div>
                            <span className="font-bold block text-slate-800 dark:text-slate-200">Turnstile #{idx + 1}: {t.entryLocation} ({t.turnstileType})</span>
                            <span className="text-[10px] text-slate-400 font-mono">Mfr: {t.manufacturer} • Fire Evac Release: {t.fireAlarmEmergencyEvacuationReleasePass ? 'PASS' : 'FAIL'} • {t.passageDirection}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {t.testResult || 'Pass'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {/* PDF VIEWER MODAL */}
      {showPdfModal && (
        <AssessmentPdfModal
          assessment={assessment}
          assessmentId={reportId}
          onClose={() => setShowPdfModal(false)}
        />
      )}
    </div>
  );
}
