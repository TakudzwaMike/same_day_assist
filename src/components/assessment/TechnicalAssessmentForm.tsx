import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck, MapPin, AlertTriangle, CheckCircle2, Save, Send,
  Camera, Plus, Trash2, ChevronRight, ChevronLeft, Eye, RefreshCw,
  Clock, Info, FileText, CheckSquare, XCircle, Wrench, Shield, Video,
  Radio, Zap, Layers, Car, Check, AlertCircle, FileCheck
} from 'lucide-react';
import {
  TechnicalAssessmentReport,
  AssessmentSystemStatus,
  ConditionalFault,
  AssessmentOutcome,
  FaultUrgency,
  TestResultOutcome
} from '../../types/technicalAssessment';
import {
  createDefaultTechnicalAssessment,
  PROPERTY_TYPES,
  PROVINCES_ZA,
  SYSTEM_PRESENCE_OPTIONS,
  ALARM_PANEL_BRANDS,
  CCTV_BRANDS,
  CCTV_CABLE_TYPES,
  ACCESS_CONTROL_BRANDS,
  INTERCOM_BRANDS,
  GARAGE_MOTOR_BRANDS,
  GATE_MOTOR_BRANDS,
  ELECTRIC_FENCE_BRANDS,
  BOOM_GATE_BRANDS,
  TURNSTILE_BRANDS,
  UNTESTED_REASONS
} from '../../data/defaultAssessmentData';
import { AssessmentPdfModal } from './AssessmentPdfModal';

interface TechnicalAssessmentFormProps {
  enquiry?: any;
  assessmentRecord?: any;
  contractorUser?: any;
  onSave: (report: TechnicalAssessmentReport) => Promise<void>;
  onCancel: () => void;
}

type TabKey =
  | 'location'
  | 'alarm'
  | 'cctv'
  | 'accessControl'
  | 'intercom'
  | 'garageDoors'
  | 'gateMotors'
  | 'electricFence'
  | 'boomGates'
  | 'turnstiles'
  | 'faults'
  | 'signoff';

export function TechnicalAssessmentForm({
  enquiry,
  assessmentRecord,
  contractorUser,
  onSave,
  onCancel,
}: TechnicalAssessmentFormProps) {
  // Initialize report from existing structuredData, draft in localStorage, or new factory baseline
  const draftKey = `sda_assessment_draft_${assessmentRecord?.id || enquiry?.id || 'new'}`;
  
  const [report, setReport] = useState<TechnicalAssessmentReport>(() => {
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        return JSON.parse(savedDraft);
      } catch (e) {
        // ignore fallback
      }
    }

    if (assessmentRecord?.technicalAssessment) {
      return assessmentRecord.technicalAssessment;
    }
    if (assessmentRecord?.structuredData) {
      try {
        return JSON.parse(assessmentRecord.structuredData);
      } catch (e) {
        // ignore fallback
      }
    }

    return createDefaultTechnicalAssessment(enquiry, contractorUser);
  });

  const [activeTab, setActiveTab] = useState<TabKey>('location');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [signatureMode, setSignatureMode] = useState<'draw' | 'refusal'>('draw');

  // Auto-save draft locally on change
  useEffect(() => {
    try {
      localStorage.setItem(draftKey, JSON.stringify(report));
      setLastSavedTime(new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e) {
      // storage quota or private mode
    }
  }, [report, draftKey]);

  // Recalculate consolidated faults & repair totals
  useEffect(() => {
    const allFaults: ConditionalFault[] = [];

    // Gather from all systems
    const sys = report.systems;
    if (sys.alarm?.faults) allFaults.push(...sys.alarm.faults);
    if (sys.cctv?.faults) allFaults.push(...sys.cctv.faults);
    if (sys.accessControl?.faults) allFaults.push(...sys.accessControl.faults);
    if (sys.intercom?.faults) allFaults.push(...sys.intercom.faults);
    if (sys.garageDoors?.faults) allFaults.push(...sys.garageDoors.faults);
    if (sys.gateMotors?.faults) allFaults.push(...sys.gateMotors.faults);
    if (sys.electricFence?.faults) allFaults.push(...sys.electricFence.faults);
    if (sys.boomGates?.faults) allFaults.push(...sys.boomGates.faults);
    if (sys.turnstiles?.faults) allFaults.push(...sys.turnstiles.faults);

    const totalZar = allFaults.reduce((sum, f) => sum + (Number(f.estimatedCost) || 0), 0);

    setReport(prev => ({
      ...prev,
      consolidatedFaults: allFaults,
      totalPreMembershipRepairsZar: totalZar,
      outcome: allFaults.length > 0 ? (prev.outcome === 'All good' ? 'Repairs required' : prev.outcome) : 'All good'
    }));
  }, [
    report.systems.alarm?.faults,
    report.systems.cctv?.faults,
    report.systems.accessControl?.faults,
    report.systems.intercom?.faults,
    report.systems.garageDoors?.faults,
    report.systems.gateMotors?.faults,
    report.systems.electricFence?.faults,
    report.systems.boomGates?.faults,
    report.systems.turnstiles?.faults,
  ]);

  // Validate according to acceptance criteria
  const validateAssessment = (): boolean => {
    const errors: string[] = [];
    const addr = report.addressInfo;

    // 1. Mandatory Structured Address Check (Acceptance criteria 13)
    if (!addr.streetName?.trim()) {
      errors.push('Mandatory Address: Street name is required.');
    }
    if (!addr.suburb?.trim()) {
      errors.push('Mandatory Address: Suburb is required.');
    }
    if (!addr.city?.trim()) {
      errors.push('Mandatory Address: Town/City is required.');
    }
    if (!addr.hasNoStreetNumberException && !addr.streetNumber?.trim() && !addr.unitOrStandNumber?.trim()) {
      errors.push('Mandatory Address: Street number is required unless a documented exception is confirmed.');
    }
    if (addr.hasNoStreetNumberException && !addr.noStreetNumberReason?.trim()) {
      errors.push('Address Exception: Documented explanation is required for properties without street numbers.');
    }

    // 2. Check that any partially functional, faulty, or unable to test system has conditional explanation
    const systemsMap: Record<string, { presence: AssessmentSystemStatus; faults: ConditionalFault[] }> = {
      'Alarm System': { presence: report.systems.alarm.presence, faults: report.systems.alarm.faults || [] },
      'CCTV Surveillance': { presence: report.systems.cctv.presence, faults: report.systems.cctv.faults || [] },
      'Access Control': { presence: report.systems.accessControl.presence, faults: report.systems.accessControl.faults || [] },
      'Intercom System': { presence: report.systems.intercom.presence, faults: report.systems.intercom.faults || [] },
      'Garage Automation': { presence: report.systems.garageDoors.presence, faults: report.systems.garageDoors.faults || [] },
      'Gate Motor Automation': { presence: report.systems.gateMotors.presence, faults: report.systems.gateMotors.faults || [] },
      'Electric Fencing': { presence: report.systems.electricFence.presence, faults: report.systems.electricFence.faults || [] },
      'Boom Gate Systems': { presence: report.systems.boomGates.presence, faults: report.systems.boomGates.faults || [] },
      'Turnstile Systems': { presence: report.systems.turnstiles.presence, faults: report.systems.turnstiles.faults || [] },
    };

    Object.entries(systemsMap).forEach(([sysName, data]) => {
      const isDeficient = ['Installed and partially functional', 'Installed but not functional', 'Installed but unable to test'].includes(data.presence);
      if (isDeficient && data.faults.length === 0) {
        errors.push(`${sysName} is marked as '${data.presence}' but has no logged defect/untested explanation in the fault register.`);
      }
    });

    // 3. Member Acknowledgement Check
    if (!report.memberAcknowledgement.memberSigned && !report.memberAcknowledgement.memberRefusalRecorded) {
      errors.push('Member Sign-off: Member must either digitally acknowledge findings or have a documented refusal reason recorded.');
    }
    if (report.memberAcknowledgement.memberRefusalRecorded && !report.memberAcknowledgement.refusalReason?.trim()) {
      errors.push('Member Sign-off: Refusal reason must be documented.');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAssessment()) {
      alert('Please resolve mandatory validation requirements before submitting baseline.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(report);
      localStorage.removeItem(draftKey);
      alert('Technical Assessment & Baseline Equipment Register submitted successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to submit technical assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick fault creator helper
  const addFaultToSystem = (systemKey: keyof typeof report.systems, componentName: string, reasonUntested?: string) => {
    const newFault: ConditionalFault = {
      id: `fault-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      systemName: systemKey.toUpperCase(),
      componentOrDevice: componentName,
      exactSymptoms: reasonUntested ? 'Unable to complete functional walk-test' : 'Operational defect detected during functional test',
      reasonUntested: reasonUntested || '',
      recommendedWork: 'Technician repair / component replacement prior to full assistance coverage',
      urgency: 'Medium',
      estimatedCost: 850
    };

    setReport(prev => {
      const targetSystem = prev.systems[systemKey] as any;
      return {
        ...prev,
        systems: {
          ...prev.systems,
          [systemKey]: {
            ...targetSystem,
            presence: reasonUntested ? 'Installed but unable to test' : 'Installed and partially functional',
            faults: [...(targetSystem.faults || []), newFault]
          }
        }
      };
    });
  };

  const removeFaultFromSystem = (systemKey: keyof typeof report.systems, faultId: string) => {
    setReport(prev => {
      const targetSystem = prev.systems[systemKey] as any;
      const updatedFaults = (targetSystem.faults || []).filter((f: ConditionalFault) => f.id !== faultId);
      return {
        ...prev,
        systems: {
          ...prev.systems,
          [systemKey]: {
            ...targetSystem,
            presence: updatedFaults.length === 0 ? 'Installed and fully functional' : targetSystem.presence,
            faults: updatedFaults
          }
        }
      };
    });
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-fadeIn">
      {/* BRANDING TOP HEADER */}
      <div className="bg-[#091C3E] text-white p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#142D59]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#CC322C] flex items-center justify-center text-white font-black text-xl shadow-lg shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black uppercase tracking-wide font-brand-header text-white">
                Same Day Assist
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#CC322C] text-white font-mono uppercase">
                Register v2.0
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Technical Assessment & Member Equipment Register • Client: <span className="font-bold text-white">{report.customerName}</span> ({report.memberInfo.membershipId})
            </p>
          </div>
        </div>

        {/* TOP ACTIONS */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {lastSavedTime && (
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl flex items-center gap-1.5">
              <Check className="w-3 h-3" />
              <span>Draft Saved {lastSavedTime}</span>
            </span>
          )}

          <button
            type="button"
            onClick={() => setShowPdfModal(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4 text-[#CC322C]" />
            <span>A4 PDF Preview</span>
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* HORIZONTAL TAB NAVIGATION BAR */}
      <div className="bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none">
        {[
          { key: 'location', label: '1. Service Address & Profile', icon: MapPin },
          { key: 'alarm', label: '2. Alarm Systems', icon: Radio },
          { key: 'cctv', label: '3. CCTV Surveillance', icon: Video },
          { key: 'accessControl', label: '4. Access Control', icon: Shield },
          { key: 'intercom', label: '5. Intercom & Doorbells', icon: Layers },
          { key: 'garageDoors', label: '6. Garage Automation', icon: Car },
          { key: 'gateMotors', label: '7. Gate Automation', icon: Wrench },
          { key: 'electricFence', label: '8. Electric Fencing', icon: Zap },
          { key: 'boomGates', label: '9. Boom Gates (v2.0)', icon: Car },
          { key: 'turnstiles', label: '10. Turnstiles (v2.0)', icon: ShieldCheck },
          { key: 'faults', label: `11. Defect Register (${report.consolidatedFaults.length})`, icon: AlertTriangle, badge: report.consolidatedFaults.length > 0 ? report.consolidatedFaults.length : undefined },
          { key: 'signoff', label: '12. Sign-off & Baseline', icon: CheckSquare },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as TabKey)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#CC322C] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="w-4 h-4 rounded-full bg-white text-[#CC322C] font-mono text-[9px] font-black flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* VALIDATION BANNER IF ERRORS */}
      {validationErrors.length > 0 && (
        <div className="bg-red-500/10 border-b border-red-500/30 p-3 text-red-600 dark:text-red-400 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold uppercase tracking-wider text-[10px]">Validation Incomplete ({validationErrors.length} required fields remaining):</span>
            <ul className="list-disc pl-4 text-[11px] space-y-0.5">
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* FORM BODY CONTAINER */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-800 dark:text-slate-100">
        {/* ========================================================= */}
        {/* TAB 1: SERVICE LOCATION & PROFILE */}
        {/* ========================================================= */}
        {activeTab === 'location' && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-[#091C3E] dark:text-white uppercase font-brand-header">
                  1 | Member Profile & Verified Service Location
                </h3>
                <p className="text-xs text-slate-500">
                  Mandatory structured address fields and location verification with the member. Street numbers required unless an explicit documented exception is recorded.
                </p>
              </div>
              <span className="text-[10px] font-mono bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-1 rounded-lg">
                Mandatory Section 1
              </span>
            </div>

            {/* MEMBER APPOINTMENT INFO */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Member Identification & Technician Assignment
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Legal First Name *</label>
                  <input
                    type="text"
                    value={report.memberInfo.legalFirstName}
                    onChange={e => setReport(prev => ({
                      ...prev,
                      memberInfo: { ...prev.memberInfo, legalFirstName: e.target.value }
                    }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Legal Surname *</label>
                  <input
                    type="text"
                    value={report.memberInfo.legalLastName}
                    onChange={e => setReport(prev => ({
                      ...prev,
                      memberInfo: { ...prev.memberInfo, legalLastName: e.target.value }
                    }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">System Membership ID</label>
                  <input
                    type="text"
                    readOnly
                    value={report.memberInfo.membershipId}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 font-mono text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Package Tier *</label>
                  <select
                    value={report.memberInfo.selectedPackage}
                    onChange={e => setReport(prev => ({
                      ...prev,
                      memberInfo: { ...prev.memberInfo, selectedPackage: e.target.value }
                    }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="Gold Emergency Assist">Gold Emergency Assist</option>
                    <option value="Platinum Emergency Assist">Platinum Emergency Assist</option>
                    <option value="Diamond VIP Assist">Diamond VIP Assist</option>
                    <option value="Business Essential">Business Essential</option>
                    <option value="Business Elite">Business Elite</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Primary Telephone *</label>
                  <input
                    type="text"
                    value={report.memberInfo.primaryPhone}
                    onChange={e => setReport(prev => ({
                      ...prev,
                      memberInfo: { ...prev.memberInfo, primaryPhone: e.target.value }
                    }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Alternate Telephone</label>
                  <input
                    type="text"
                    placeholder="Optional backup phone"
                    value={report.memberInfo.alternatePhone || ''}
                    onChange={e => setReport(prev => ({
                      ...prev,
                      memberInfo: { ...prev.memberInfo, alternatePhone: e.target.value }
                    }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Member Email *</label>
                  <input
                    type="email"
                    value={report.memberInfo.email}
                    onChange={e => setReport(prev => ({
                      ...prev,
                      memberInfo: { ...prev.memberInfo, email: e.target.value }
                    }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Technician Employee ID</label>
                  <input
                    type="text"
                    value={report.memberInfo.assignedTechnicianEmployeeId}
                    onChange={e => setReport(prev => ({
                      ...prev,
                      memberInfo: { ...prev.memberInfo, assignedTechnicianEmployeeId: e.target.value }
                    }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* MANDATORY STRUCTURED PROPERTY ADDRESS */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Mandatory Structured Address & GPS
                </h4>
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={report.addressInfo.addressVerifiedWithMember}
                    onChange={e => setReport(prev => ({
                      ...prev,
                      addressInfo: { ...prev.addressInfo, addressVerifiedWithMember: e.target.checked }
                    }))}
                    className="rounded text-[#CC322C]"
                  />
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Physically Verified With Member</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Property Type *</label>
                  <select
                    value={report.addressInfo.propertyType}
                    onChange={e => setReport(prev => ({
                      ...prev,
                      addressInfo: { ...prev.addressInfo, propertyType: e.target.value as any }
                    }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    {PROPERTY_TYPES.map(pt => (
                      <option key={pt} value={pt}>{pt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Estate or Complex Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Amberfield Valley Estate"
                    value={report.addressInfo.estateOrComplexName || ''}
                    onChange={e => setReport(prev => ({
                      ...prev,
                      addressInfo: { ...prev.addressInfo, estateOrComplexName: e.target.value }
                    }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Unit / Flat / Stand #</label>
                  <input
                    type="text"
                    placeholder="e.g. Unit 42 or Stand 109"
                    value={report.addressInfo.unitOrStandNumber}
                    onChange={e => setReport(prev => ({
                      ...prev,
                      addressInfo: { ...prev.addressInfo, unitOrStandNumber: e.target.value }
                    }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">
                    Street Number {report.addressInfo.hasNoStreetNumberException ? '(Exception)' : '*'}
                  </label>
                  <input
                    type="text"
                    disabled={report.addressInfo.hasNoStreetNumberException}
                    placeholder={report.addressInfo.hasNoStreetNumberException ? 'Exception Approved' : 'e.g. 124'}
                    value={report.addressInfo.streetNumber}
                    onChange={e => setReport(prev => ({
                      ...prev,
                      addressInfo: { ...prev.addressInfo, streetNumber: e.target.value }
                    }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-50"
                  />
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Street Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Market Street"
                    value={report.addressInfo.streetName}
                    onChange={e => setReport(prev => ({
                      ...prev,
                      addressInfo: { ...prev.addressInfo, streetName: e.target.value }
                    }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Suburb *</label>
                  <input
                    type="text"
                    placeholder="e.g. Fairview"
                    value={report.addressInfo.suburb}
                    onChange={e => setReport(prev => ({
                      ...prev,
                      addressInfo: { ...prev.addressInfo, suburb: e.target.value }
                    }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Town / City *</label>
                  <input
                    type="text"
                    placeholder="e.g. Johannesburg"
                    value={report.addressInfo.city}
                    onChange={e => setReport(prev => ({
                      ...prev,
                      addressInfo: { ...prev.addressInfo, city: e.target.value }
                    }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Province *</label>
                  <select
                    value={report.addressInfo.province}
                    onChange={e => setReport(prev => ({
                      ...prev,
                      addressInfo: { ...prev.addressInfo, province: e.target.value }
                    }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    {PROVINCES_ZA.map(prov => (
                      <option key={prov} value={prov}>{prov}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Postal Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. 2094"
                    value={report.addressInfo.postalCode}
                    onChange={e => setReport(prev => ({
                      ...prev,
                      addressInfo: { ...prev.addressInfo, postalCode: e.target.value }
                    }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">GPS Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={report.addressInfo.gpsCoordinates.lat}
                    onChange={e => setReport(prev => ({
                      ...prev,
                      addressInfo: {
                        ...prev.addressInfo,
                        gpsCoordinates: { ...prev.addressInfo.gpsCoordinates, lat: parseFloat(e.target.value) || 0 }
                      }
                    }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">GPS Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={report.addressInfo.gpsCoordinates.lng}
                    onChange={e => setReport(prev => ({
                      ...prev,
                      addressInfo: {
                        ...prev.addressInfo,
                        gpsCoordinates: { ...prev.addressInfo.gpsCoordinates, lng: parseFloat(e.target.value) || 0 }
                      }
                    }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                  />
                </div>
              </div>

              {/* DOCUMENTED EXCEPTION FOR ADDRESSES WITHOUT STREET NUMBER */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs">
                  <input
                    type="checkbox"
                    checked={report.addressInfo.hasNoStreetNumberException}
                    onChange={e => setReport(prev => ({
                      ...prev,
                      addressInfo: { ...prev.addressInfo, hasNoStreetNumberException: e.target.checked }
                    }))}
                    className="rounded text-amber-600"
                  />
                  <span>Documented Exception: Legitimate address without an official street number (Plot / Farm / Stand / Rural)</span>
                </label>

                {report.addressInfo.hasNoStreetNumberException && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-1">Exception Justification & Stand Reference *</label>
                    <input
                      type="text"
                      placeholder="e.g. Agricultural Holding Plot 48, identified by boundary marker and farm name."
                      value={report.addressInfo.noStreetNumberReason || ''}
                      onChange={e => setReport(prev => ({
                        ...prev,
                        addressInfo: { ...prev.addressInfo, noStreetNumberReason: e.target.value }
                      }))}
                      className="w-full p-2 rounded-lg border border-amber-400 dark:border-amber-600 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                )}
              </div>

              {/* ENTRANCE & ACCESS NOTES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Entrance / Gate to Use *</label>
                  <input
                    type="text"
                    placeholder="e.g. Main entrance sliding gate (Lane 1)"
                    value={report.addressInfo.entranceGateToUse}
                    onChange={e => setReport(prev => ({
                      ...prev,
                      addressInfo: { ...prev.addressInfo, entranceGateToUse: e.target.value }
                    }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Gate & Security Access Instructions *</label>
                  <input
                    type="text"
                    placeholder="e.g. Dial intercom 104 or flash headlights at guardhouse"
                    value={report.addressInfo.gateAccessInstructions}
                    onChange={e => setReport(prev => ({
                      ...prev,
                      addressInfo: { ...prev.addressInfo, gateAccessInstructions: e.target.value }
                    }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: ALARM SYSTEMS */}
        {/* ========================================================= */}
        {activeTab === 'alarm' && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-[#091C3E] dark:text-white uppercase font-brand-header">
                  3 | Intruder Alarm Systems Assessment
                </h3>
                <p className="text-xs text-slate-500">
                  Main panel, PCB enclosure, expanders, power/charging readings, keypads, individually numbered detection devices, walk test & zone schedule.
                </p>
              </div>
              <select
                value={report.systems.alarm.presence}
                onChange={e => setReport(prev => ({
                  ...prev,
                  systems: { ...prev.systems, alarm: { ...prev.systems.alarm, presence: e.target.value as any } }
                }))}
                className="p-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                {SYSTEM_PRESENCE_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {report.systems.alarm.presence !== 'Not installed' && (
              <div className="space-y-6">
                {/* PANEL IDENTITY & CONFIG */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Panel Identity, Configuration & Expanders
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Panel Brand *</label>
                      <select
                        value={report.systems.alarm.panelBrand}
                        onChange={e => setReport(prev => ({
                          ...prev,
                          systems: { ...prev.systems, alarm: { ...prev.systems.alarm, panelBrand: e.target.value } }
                        }))}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                      >
                        {ALARM_PANEL_BRANDS.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Model & Series</label>
                      <input
                        type="text"
                        value={report.systems.alarm.panelModel}
                        onChange={e => setReport(prev => ({
                          ...prev,
                          systems: { ...prev.systems, alarm: { ...prev.systems.alarm, panelModel: e.target.value } }
                        }))}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Serial Number *</label>
                      <input
                        type="text"
                        value={report.systems.alarm.panelSerialNumber}
                        onChange={e => setReport(prev => ({
                          ...prev,
                          systems: { ...prev.systems, alarm: { ...prev.systems.alarm, panelSerialNumber: e.target.value } }
                        }))}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">System Configuration *</label>
                      <select
                        value={report.systems.alarm.systemConfiguration}
                        onChange={e => setReport(prev => ({
                          ...prev,
                          systems: { ...prev.systems, alarm: { ...prev.systems.alarm, systemConfiguration: e.target.value as any } }
                        }))}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                      >
                        <option value="Fully wired">Fully wired</option>
                        <option value="Semi-wireless (hybrid)">Semi-wireless (hybrid)</option>
                        <option value="Fully wireless">Fully wireless</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Mains VAC Reading (V)</label>
                      <input
                        type="number"
                        value={report.systems.alarm.mainsVoltageVAC || 228}
                        onChange={e => setReport(prev => ({
                          ...prev,
                          systems: { ...prev.systems, alarm: { ...prev.systems.alarm, mainsVoltageVAC: parseFloat(e.target.value) || 0 } }
                        }))}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Charging VDC Reading (V)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={report.systems.alarm.chargingVoltageVDC || 13.8}
                        onChange={e => setReport(prev => ({
                          ...prev,
                          systems: { ...prev.systems, alarm: { ...prev.systems.alarm, chargingVoltageVDC: parseFloat(e.target.value) || 0 } }
                        }))}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Battery Condition *</label>
                      <select
                        value={report.systems.alarm.batteryCondition}
                        onChange={e => setReport(prev => ({
                          ...prev,
                          systems: { ...prev.systems, alarm: { ...prev.systems.alarm, batteryCondition: e.target.value as any } }
                        }))}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                      >
                        <option value="Good">Good (Full Capacity)</option>
                        <option value="Weak">Weak (Needs Replacement)</option>
                        <option value="Dead">Dead (0V / Faulty)</option>
                        <option value="Untested">Untested</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Monitoring Signal Path *</label>
                      <select
                        value={report.systems.alarm.monitoringSignalPath}
                        onChange={e => setReport(prev => ({
                          ...prev,
                          systems: { ...prev.systems, alarm: { ...prev.systems.alarm, monitoringSignalPath: e.target.value as any } }
                        }))}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                      >
                        <option value="GSM-LTE">GSM-LTE 4G</option>
                        <option value="Radio">VHF / UHF Radio Transmitter</option>
                        <option value="IP">IP / Fiber Ethernet</option>
                        <option value="Telephone">Telephone Line</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* INDIVIDUALLY NUMBERED DETECTION DEVICES (REPEATABLE CHILD ROWS) */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Individually Numbered Detection Devices ({report.systems.alarm.detectors.length})
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Every detector is a separate child record with descriptive name, location, type, photo and operational test outcome.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newId = `det-${Date.now()}`;
                        const nextZone = report.systems.alarm.detectors.length + 1;
                        setReport(prev => ({
                          ...prev,
                          systems: {
                            ...prev.systems,
                            alarm: {
                              ...prev.systems.alarm,
                              detectors: [
                                ...prev.systems.alarm.detectors,
                                {
                                  id: newId,
                                  zoneNumber: nextZone,
                                  descriptiveName: `Zone ${nextZone} Detector`,
                                  location: 'Room / Perimeter',
                                  type: 'PIR/pet-friendly PIR',
                                  brandModel: 'Standard PIR',
                                  connection: 'Wired',
                                  testResult: 'Pass'
                                }
                              ]
                            }
                          }
                        }));
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#091C3E] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#142D59] cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Detector</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {report.systems.alarm.detectors.map((det, index) => (
                      <div key={det.id} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-6 gap-2 text-xs items-center">
                        <div className="sm:col-span-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Zone #</label>
                          <input
                            type="number"
                            value={det.zoneNumber}
                            onChange={e => {
                              const val = parseInt(e.target.value) || 1;
                              const updated = [...report.systems.alarm.detectors];
                              updated[index].zoneNumber = val;
                              setReport(prev => ({
                                ...prev,
                                systems: { ...prev.systems, alarm: { ...prev.systems.alarm, detectors: updated } }
                              }));
                            }}
                            className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-xs"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Descriptive Name & Location</label>
                          <input
                            type="text"
                            placeholder="e.g. Front Door or Lounge PIR"
                            value={det.descriptiveName}
                            onChange={e => {
                              const updated = [...report.systems.alarm.detectors];
                              updated[index].descriptiveName = e.target.value;
                              setReport(prev => ({
                                ...prev,
                                systems: { ...prev.systems, alarm: { ...prev.systems.alarm, detectors: updated } }
                              }));
                            }}
                            className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
                          />
                        </div>

                        <div className="sm:col-span-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Device Type</label>
                          <select
                            value={det.type}
                            onChange={e => {
                              const updated = [...report.systems.alarm.detectors];
                              updated[index].type = e.target.value as any;
                              setReport(prev => ({
                                ...prev,
                                systems: { ...prev.systems, alarm: { ...prev.systems.alarm, detectors: updated } }
                              }));
                            }}
                            className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
                          >
                            <option value="Door/window contacts">Door/window contacts</option>
                            <option value="PIR/pet-friendly PIR">PIR / Pet-friendly</option>
                            <option value="Indoor/outdoor/roof beams">Outdoor/Roof Beams</option>
                            <option value="Trapdoor contacts">Trapdoor contacts</option>
                            <option value="Ceiling/roof-space sensors">Ceiling sensors</option>
                            <option value="Glass-break">Glass-break</option>
                            <option value="Vibration/shock">Vibration / Shock</option>
                            <option value="Panic buttons">Panic buttons</option>
                            <option value="Smoke/heat detectors">Smoke / Heat</option>
                            <option value="Perimeter detector">Perimeter detector</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div className="sm:col-span-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Walk Test</label>
                          <select
                            value={det.testResult}
                            onChange={e => {
                              const updated = [...report.systems.alarm.detectors];
                              const newRes = e.target.value as TestResultOutcome;
                              updated[index].testResult = newRes;
                              setReport(prev => ({
                                ...prev,
                                systems: { ...prev.systems, alarm: { ...prev.systems.alarm, detectors: updated } }
                              }));
                              if (newRes !== 'Pass') {
                                addFaultToSystem('alarm', `Zone ${det.zoneNumber} - ${det.descriptiveName}`, newRes === 'Untested' ? 'Untested during walk test' : undefined);
                              }
                            }}
                            className={`w-full p-1.5 rounded-lg border font-bold text-xs ${
                              det.testResult === 'Pass' ? 'border-emerald-500 text-emerald-600 bg-emerald-50/50' : 'border-red-500 text-red-600 bg-red-50/50'
                            }`}
                          >
                            <option value="Pass">Pass</option>
                            <option value="Fail">Fail</option>
                            <option value="Untested">Untested</option>
                          </select>
                        </div>

                        <div className="sm:col-span-1 flex items-end justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = report.systems.alarm.detectors.filter((_, i) => i !== index);
                              setReport(prev => ({
                                ...prev,
                                systems: { ...prev.systems, alarm: { ...prev.systems.alarm, detectors: updated } }
                              }));
                            }}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                            title="Remove detector"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ZONE LIST VERIFICATION (WALK TEST) */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Client Zone List Verification Schedule
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Client Existing Zone List</label>
                      <select
                        value={report.systems.alarm.existingZoneListAvailable}
                        onChange={e => setReport(prev => ({
                          ...prev,
                          systems: { ...prev.systems, alarm: { ...prev.systems.alarm, existingZoneListAvailable: e.target.value as any } }
                        }))}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                      >
                        <option value="Available">Available (Compared during walk-test)</option>
                        <option value="Unavailable">Unavailable (Created verified schedule)</option>
                        <option value="Supplied later">Supplied later</option>
                      </select>
                    </div>

                    <div className="col-span-2 flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={report.systems.alarm.functionalTests.walkTestPassed}
                          onChange={e => setReport(prev => ({
                            ...prev,
                            systems: {
                              ...prev.systems,
                              alarm: {
                                ...prev.systems.alarm,
                                functionalTests: { ...prev.systems.alarm.functionalTests, walkTestPassed: e.target.checked }
                              }
                            }
                          }))}
                          className="rounded text-[#CC322C]"
                        />
                        <span className="font-bold">Full Physical Walk Test Completed</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={report.systems.alarm.functionalTests.sirensStrobesFunctional}
                          onChange={e => setReport(prev => ({
                            ...prev,
                            systems: {
                              ...prev.systems,
                              alarm: {
                                ...prev.systems.alarm,
                                functionalTests: { ...prev.systems.alarm.functionalTests, sirensStrobesFunctional: e.target.checked }
                              }
                            }
                          }))}
                          className="rounded text-[#CC322C]"
                        />
                        <span className="font-bold">Sirens & Strobes Functional</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: CCTV SURVEILLANCE */}
        {/* ========================================================= */}
        {activeTab === 'cctv' && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-[#091C3E] dark:text-white uppercase font-brand-header">
                  4 | CCTV Surveillance Systems Assessment
                </h3>
                <p className="text-xs text-slate-500">
                  NVR/DVR recording, retention days, camera-by-camera register, RG59 coaxial option, multi-way PSU, and mandatory app verification for THIS property.
                </p>
              </div>
              <select
                value={report.systems.cctv.presence}
                onChange={e => setReport(prev => ({
                  ...prev,
                  systems: { ...prev.systems, cctv: { ...prev.systems.cctv, presence: e.target.value as any } }
                }))}
                className="p-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                {SYSTEM_PRESENCE_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {report.systems.cctv.presence !== 'Not installed' && (
              <div className="space-y-6">
                {/* RECORDER IDENTITY & RETENTION */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Recorder Specifications & Storage
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Recorder Brand *</label>
                      <select
                        value={report.systems.cctv.brand}
                        onChange={e => setReport(prev => ({
                          ...prev,
                          systems: { ...prev.systems, cctv: { ...prev.systems.cctv, brand: e.target.value } }
                        }))}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                      >
                        {CCTV_BRANDS.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Recorder Type *</label>
                      <select
                        value={report.systems.cctv.recorderType}
                        onChange={e => setReport(prev => ({
                          ...prev,
                          systems: { ...prev.systems, cctv: { ...prev.systems.cctv, recorderType: e.target.value as any } }
                        }))}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                      >
                        <option value="NVR">NVR (Network Video Recorder)</option>
                        <option value="DVR">DVR (Digital Video Recorder)</option>
                        <option value="Hybrid">Hybrid (Analogue + IP)</option>
                        <option value="Cloud">Cloud Gateway</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Serial Number *</label>
                      <input
                        type="text"
                        value={report.systems.cctv.serialNumber}
                        onChange={e => setReport(prev => ({
                          ...prev,
                          systems: { ...prev.systems, cctv: { ...prev.systems.cctv, serialNumber: e.target.value } }
                        }))}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Channel Capacity</label>
                      <select
                        value={report.systems.cctv.channelCapacity}
                        onChange={e => setReport(prev => ({
                          ...prev,
                          systems: { ...prev.systems, cctv: { ...prev.systems.cctv, channelCapacity: parseInt(e.target.value) || 8 } }
                        }))}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                      >
                        <option value="4">4 Channels</option>
                        <option value="8">8 Channels</option>
                        <option value="16">16 Channels</option>
                        <option value="32">32 Channels</option>
                        <option value="64">64 Channels</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Total Storage (TB)</label>
                      <input
                        type="number"
                        value={report.systems.cctv.totalStorageTB}
                        onChange={e => setReport(prev => ({
                          ...prev,
                          systems: { ...prev.systems, cctv: { ...prev.systems.cctv, totalStorageTB: parseInt(e.target.value) || 1 } }
                        }))}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Verified Retention (Days)</label>
                      <input
                        type="number"
                        value={report.systems.cctv.verifiedRetentionDays}
                        onChange={e => setReport(prev => ({
                          ...prev,
                          systems: { ...prev.systems, cctv: { ...prev.systems.cctv, verifiedRetentionDays: parseInt(e.target.value) || 14 } }
                        }))}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Cabling Infrastructure *</label>
                      <select
                        value={report.systems.cctv.cablingType}
                        onChange={e => setReport(prev => ({
                          ...prev,
                          systems: { ...prev.systems, cctv: { ...prev.systems.cctv, cablingType: e.target.value as any } }
                        }))}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                      >
                        {CCTV_CABLE_TYPES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Drive Health</label>
                      <select
                        value={report.systems.cctv.driveHealth}
                        onChange={e => setReport(prev => ({
                          ...prev,
                          systems: { ...prev.systems, cctv: { ...prev.systems.cctv, driveHealth: e.target.value as any } }
                        }))}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                      >
                        <option value="Good">Good (S.M.A.R.T. Clean)</option>
                        <option value="Warning">Warning (Bad sectors)</option>
                        <option value="Failing">Failing (Replace Drive)</option>
                      </select>
                    </div>
                  </div>

                  {/* MANDATORY MOBILE APP VERIFICATION (THIS PROPERTY CHECK) */}
                  <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-300 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold block uppercase text-[10px] tracking-wider">
                        Remote Viewing Verification Check (Section 4.C Acceptance Criterion)
                      </span>
                      <p className="text-[11px] mt-0.5">
                        Verify on customer's phone that the mobile app stream actually displays <span className="font-bold">THIS</span> physical premises and not a previous site.
                      </p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer font-bold shrink-0">
                      <input
                        type="checkbox"
                        checked={report.systems.cctv.mobileAppDisplaysThisPropertyVerified}
                        onChange={e => setReport(prev => ({
                          ...prev,
                          systems: { ...prev.systems, cctv: { ...prev.systems.cctv, mobileAppDisplaysThisPropertyVerified: e.target.checked } }
                        }))}
                        className="rounded text-blue-600"
                      />
                      <span>Confirmed Matches Property</span>
                    </label>
                  </div>
                </div>

                {/* CAMERA-BY-CAMERA REGISTER (REPEATABLE ROWS) */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Camera-by-Camera Register ({report.systems.cctv.cameras.length})
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Capture resolution, form factor, lens, night tech, license plate recognition (LPR/ANPR), and operational test.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newId = `cam-${Date.now()}`;
                        const nextNum = report.systems.cctv.cameras.length + 1;
                        setReport(prev => ({
                          ...prev,
                          systems: {
                            ...prev.systems,
                            cctv: {
                              ...prev.systems.cctv,
                              cameras: [
                                ...prev.systems.cctv.cameras,
                                {
                                  id: newId,
                                  cameraNumber: nextNum,
                                  descriptiveName: `Camera ${nextNum}`,
                                  location: 'Perimeter / Entrance',
                                  brand: 'Hikvision',
                                  model: '4MP Turret',
                                  signalType: 'IP',
                                  formFactor: 'Turret',
                                  resolutionMp: '4MP',
                                  lensMm: '2.8mm Wide',
                                  nightVisionTech: 'Full-colour (ColorVu/etc)',
                                  fixedOrVarifocal: 'Fixed',
                                  audioSupport: 'None',
                                  weatherRating: 'IP67',
                                  powerType: 'PoE standard',
                                  dayNightQualityPass: true,
                                  testResult: 'Pass',
                                  isVehicleLprAnpr: false
                                }
                              ]
                            }
                          }
                        }));
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#091C3E] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#142D59] cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Camera</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {report.systems.cctv.cameras.map((cam, idx) => (
                      <div key={cam.id} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-6 gap-2 text-xs items-center">
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Cam #</label>
                          <input
                            type="number"
                            value={cam.cameraNumber}
                            onChange={e => {
                              const val = parseInt(e.target.value) || 1;
                              const updated = [...report.systems.cctv.cameras];
                              updated[idx].cameraNumber = val;
                              setReport(prev => ({
                                ...prev,
                                systems: { ...prev.systems, cctv: { ...prev.systems.cctv, cameras: updated } }
                              }));
                            }}
                            className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-xs"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Camera Name & Location</label>
                          <input
                            type="text"
                            placeholder="e.g. Front Gate Approach"
                            value={cam.descriptiveName}
                            onChange={e => {
                              const updated = [...report.systems.cctv.cameras];
                              updated[idx].descriptiveName = e.target.value;
                              setReport(prev => ({
                                ...prev,
                                systems: { ...prev.systems, cctv: { ...prev.systems.cctv, cameras: updated } }
                              }));
                            }}
                            className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Form / Resolution</label>
                          <select
                            value={cam.formFactor}
                            onChange={e => {
                              const updated = [...report.systems.cctv.cameras];
                              updated[idx].formFactor = e.target.value as any;
                              setReport(prev => ({
                                ...prev,
                                systems: { ...prev.systems, cctv: { ...prev.systems.cctv, cameras: updated } }
                              }));
                            }}
                            className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
                          >
                            <option value="Turret">Turret</option>
                            <option value="Bullet">Bullet</option>
                            <option value="Dome">Dome</option>
                            <option value="Covert">Covert / Pin-hole</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Operational Test</label>
                          <select
                            value={cam.testResult}
                            onChange={e => {
                              const updated = [...report.systems.cctv.cameras];
                              const newRes = e.target.value as TestResultOutcome;
                              updated[idx].testResult = newRes;
                              setReport(prev => ({
                                ...prev,
                                systems: { ...prev.systems, cctv: { ...prev.systems.cctv, cameras: updated } }
                              }));
                              if (newRes !== 'Pass') {
                                addFaultToSystem('cctv', `Camera ${cam.cameraNumber} - ${cam.descriptiveName}`, newRes === 'Untested' ? 'Image feed unreachable' : undefined);
                              }
                            }}
                            className={`w-full p-1.5 rounded-lg border font-bold text-xs ${
                              cam.testResult === 'Pass' ? 'border-emerald-500 text-emerald-600 bg-emerald-50/50' : 'border-red-500 text-red-600 bg-red-50/50'
                            }`}
                          >
                            <option value="Pass">Pass</option>
                            <option value="Fail">Fail</option>
                            <option value="Untested">Untested</option>
                          </select>
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-1 text-[10px] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={cam.isVehicleLprAnpr}
                              onChange={e => {
                                const updated = [...report.systems.cctv.cameras];
                                updated[idx].isVehicleLprAnpr = e.target.checked;
                                setReport(prev => ({
                                  ...prev,
                                  systems: { ...prev.systems, cctv: { ...prev.systems.cctv, cameras: updated } }
                                }));
                              }}
                              className="rounded text-[#CC322C]"
                            />
                            <span>LPR/ANPR</span>
                          </label>

                          <button
                            type="button"
                            onClick={() => {
                              const updated = report.systems.cctv.cameras.filter((_, i) => i !== idx);
                              setReport(prev => ({
                                ...prev,
                                systems: { ...prev.systems, cctv: { ...prev.systems.cctv, cameras: updated } }
                              }));
                            }}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: ACCESS CONTROL */}
        {/* ========================================================= */}
        {activeTab === 'accessControl' && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-[#091C3E] dark:text-white uppercase font-brand-header">
                  5 | Access Control & Electronic Locks
                </h3>
                <p className="text-xs text-slate-500">
                  Main controller board, biometric/card readers, electric locks (maglocks with holding force rating), and emergency break-glass release tests.
                </p>
              </div>
              <select
                value={report.systems.accessControl.presence}
                onChange={e => setReport(prev => ({
                  ...prev,
                  systems: { ...prev.systems, accessControl: { ...prev.systems.accessControl, presence: e.target.value as any } }
                }))}
                className="p-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                {SYSTEM_PRESENCE_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {report.systems.accessControl.presence !== 'Not installed' && (
              <div className="space-y-6">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Access Controller Hardware
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Controller Brand *</label>
                      <select
                        value={report.systems.accessControl.controllerBrand}
                        onChange={e => setReport(prev => ({
                          ...prev,
                          systems: { ...prev.systems, accessControl: { ...prev.systems.accessControl, controllerBrand: e.target.value } }
                        }))}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                      >
                        {ACCESS_CONTROL_BRANDS.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Controller Model</label>
                      <input
                        type="text"
                        value={report.systems.accessControl.controllerModel}
                        onChange={e => setReport(prev => ({
                          ...prev,
                          systems: { ...prev.systems, accessControl: { ...prev.systems.accessControl, controllerModel: e.target.value } }
                        }))}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Serial Number *</label>
                      <input
                        type="text"
                        value={report.systems.accessControl.serialNumber}
                        onChange={e => setReport(prev => ({
                          ...prev,
                          systems: { ...prev.systems, accessControl: { ...prev.systems.accessControl, serialNumber: e.target.value } }
                        }))}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Architecture *</label>
                      <select
                        value={report.systems.accessControl.topology}
                        onChange={e => setReport(prev => ({
                          ...prev,
                          systems: { ...prev.systems, accessControl: { ...prev.systems.accessControl, topology: e.target.value as any } }
                        }))}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                      >
                        <option value="Standalone">Standalone (Local DB)</option>
                        <option value="Networked">Networked (TCP/IP)</option>
                        <option value="Web-based">Web-based Controller</option>
                        <option value="Cloud">Cloud Managed</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* READERS & LOCKS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Readers Register
                    </h4>
                    <div className="space-y-2">
                      {report.systems.accessControl.readers.map((rdr, idx) => (
                        <div key={rdr.id} className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">{rdr.type} - {rdr.doorLocation}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{rdr.makeModel}</span>
                          </div>
                          <select
                            value={rdr.testResult}
                            onChange={e => {
                              const updated = [...report.systems.accessControl.readers];
                              updated[idx].testResult = e.target.value as any;
                              setReport(prev => ({
                                ...prev,
                                systems: { ...prev.systems, accessControl: { ...prev.systems.accessControl, readers: updated } }
                              }));
                            }}
                            className="p-1 rounded-lg border text-xs font-bold"
                          >
                            <option value="Pass">Pass</option>
                            <option value="Fail">Fail</option>
                            <option value="Untested">Untested</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Locks & Hardware Register
                    </h4>
                    <div className="space-y-2">
                      {report.systems.accessControl.locks.map((lck, idx) => (
                        <div key={lck.id} className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">{lck.type} - {lck.doorLocation}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{lck.holdingForceOrRating}</span>
                          </div>
                          <select
                            value={lck.testResult}
                            onChange={e => {
                              const updated = [...report.systems.accessControl.locks];
                              updated[idx].testResult = e.target.value as any;
                              setReport(prev => ({
                                ...prev,
                                systems: { ...prev.systems, accessControl: { ...prev.systems.accessControl, locks: updated } }
                              }));
                            }}
                            className="p-1 rounded-lg border text-xs font-bold"
                          >
                            <option value="Pass">Pass</option>
                            <option value="Fail">Fail</option>
                            <option value="Untested">Untested</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: INTERCOM SYSTEMS & VIDEO DOORBELLS */}
        {/* ========================================================= */}
        {activeTab === 'intercom' && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-[#091C3E] dark:text-white uppercase font-brand-header">
                  6 | Intercom Systems & Video Doorbells
                </h3>
                <p className="text-xs text-slate-500">
                  Single or multi-unit, video monitors vs audio handsets, separate testing of triggered outputs (pedestrian gate, driveway gate, electric lock).
                </p>
              </div>
              <select
                value={report.systems.intercom.presence}
                onChange={e => setReport(prev => ({
                  ...prev,
                  systems: { ...prev.systems, intercom: { ...prev.systems.intercom, presence: e.target.value as any } }
                }))}
                className="p-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                {SYSTEM_PRESENCE_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {report.systems.intercom.presence !== 'Not installed' && (
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Brand *</label>
                    <select
                      value={report.systems.intercom.brand}
                      onChange={e => setReport(prev => ({
                        ...prev,
                        systems: { ...prev.systems, intercom: { ...prev.systems.intercom, brand: e.target.value } }
                      }))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    >
                      {INTERCOM_BRANDS.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">System Type *</label>
                    <select
                      value={report.systems.intercom.systemType}
                      onChange={e => setReport(prev => ({
                        ...prev,
                        systems: { ...prev.systems, intercom: { ...prev.systems.intercom, systemType: e.target.value as any } }
                      }))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                    >
                      <option value="Video">Video Intercom</option>
                      <option value="Audio-only">Audio-only Handset</option>
                      <option value="Mixed">Mixed Audio & Video</option>
                      <option value="Video Doorbell">Video Doorbell (Smart)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Connection Medium *</label>
                    <select
                      value={report.systems.intercom.connectionType}
                      onChange={e => setReport(prev => ({
                        ...prev,
                        systems: { ...prev.systems, intercom: { ...prev.systems.intercom, connectionType: e.target.value as any } }
                      }))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    >
                      <option value="IP">IP / Networked (PoE)</option>
                      <option value="Wi-Fi">Wi-Fi Wireless</option>
                      <option value="Wired">2-Wire / 4-Wire Traditional</option>
                      <option value="Wireless">GSM 4G Wireless</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Monitors vs Handsets</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Video monitors"
                        value={report.systems.intercom.videoMonitorsCount}
                        onChange={e => setReport(prev => ({
                          ...prev,
                          systems: { ...prev.systems, intercom: { ...prev.systems.intercom, videoMonitorsCount: parseInt(e.target.value) || 0 } }
                        }))}
                        className="w-1/2 p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono"
                      />
                      <input
                        type="number"
                        placeholder="Audio handsets"
                        value={report.systems.intercom.audioHandsetsCount}
                        onChange={e => setReport(prev => ({
                          ...prev,
                          systems: { ...prev.systems, intercom: { ...prev.systems.intercom, audioHandsetsCount: parseInt(e.target.value) || 0 } }
                        }))}
                        className="w-1/2 p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* TRIGGERED OUTPUTS CHECKLIST */}
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="font-bold text-[10px] uppercase text-slate-500 block">
                    Triggered Outputs (Test Each Release Separately - Section 6 Criterion)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {report.systems.intercom.triggeredOutputs.map((trig, idx) => (
                      <div key={trig.outputType} className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <span className="font-bold">{trig.outputType}</span>
                        <select
                          value={trig.testResult}
                          onChange={e => {
                            const updated = [...report.systems.intercom.triggeredOutputs];
                            updated[idx].testResult = e.target.value as any;
                            setReport(prev => ({
                              ...prev,
                              systems: { ...prev.systems, intercom: { ...prev.systems.intercom, triggeredOutputs: updated } }
                            }));
                          }}
                          className="p-1 rounded text-[10px] font-bold border"
                        >
                          <option value="Pass">Pass</option>
                          <option value="Fail">Fail</option>
                          <option value="Untested">Untested</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: GARAGE DOOR AUTOMATION */}
        {/* ========================================================= */}
        {activeTab === 'garageDoors' && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-[#091C3E] dark:text-white uppercase font-brand-header">
                  7 | Garage Door Automation Assessment
                </h3>
                <p className="text-xs text-slate-500">
                  Door mechanics (springs/balance), motor electronics, battery backup, safety obstruction reversal. Separate mechanical faults from motor faults!
                </p>
              </div>
              <select
                value={report.systems.garageDoors.presence}
                onChange={e => setReport(prev => ({
                  ...prev,
                  systems: { ...prev.systems, garageDoors: { ...prev.systems.garageDoors, presence: e.target.value as any } }
                }))}
                className="p-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                {SYSTEM_PRESENCE_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {report.systems.garageDoors.presence !== 'Not installed' && (
              <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Motor Brand *</label>
                    <select
                      value={report.systems.garageDoors.motorBrand}
                      onChange={e => setReport(prev => ({
                        ...prev,
                        systems: { ...prev.systems, garageDoors: { ...prev.systems.garageDoors, motorBrand: e.target.value } }
                      }))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    >
                      {GARAGE_MOTOR_BRANDS.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Door Mechanism Type *</label>
                    <select
                      value={report.systems.garageDoors.mechanicalType}
                      onChange={e => setReport(prev => ({
                        ...prev,
                        systems: { ...prev.systems, garageDoors: { ...prev.systems.garageDoors, mechanicalType: e.target.value as any } }
                      }))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    >
                      <option value="Sectional">Sectional Overhead</option>
                      <option value="Roll-up">Roll-up Steel</option>
                      <option value="Tip-up">Tip-up Canopy</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Door Material *</label>
                    <select
                      value={report.systems.garageDoors.doorMaterial}
                      onChange={e => setReport(prev => ({
                        ...prev,
                        systems: { ...prev.systems, garageDoors: { ...prev.systems.garageDoors, doorMaterial: e.target.value as any } }
                      }))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    >
                      <option value="Aluminium">Aluminium</option>
                      <option value="Steel">Steel</option>
                      <option value="Wooden">Wooden</option>
                      <option value="Zinc">Zinc / Chromadek</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Drive Mechanism</label>
                    <select
                      value={report.systems.garageDoors.driveMechanism}
                      onChange={e => setReport(prev => ({
                        ...prev,
                        systems: { ...prev.systems, garageDoors: { ...prev.systems.garageDoors, driveMechanism: e.target.value as any } }
                      }))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    >
                      <option value="Belt drive">Belt drive (Quiet)</option>
                      <option value="Chain drive">Chain drive</option>
                      <option value="Shaft / Pole drive">Shaft / Pole drive</option>
                    </select>
                  </div>
                </div>

                {/* CRITICAL SAFETY & FUNCTIONAL TESTS */}
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer font-bold">
                    <input
                      type="checkbox"
                      checked={report.systems.garageDoors.manualMovementBalanceTestPass}
                      onChange={e => setReport(prev => ({
                        ...prev,
                        systems: {
                          ...prev.systems,
                          garageDoors: { ...prev.systems.garageDoors, manualMovementBalanceTestPass: e.target.checked }
                        }
                      }))}
                      className="rounded text-[#CC322C]"
                    />
                    <span>Manual Balance Test Passed</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold">
                    <input
                      type="checkbox"
                      checked={report.systems.garageDoors.functionalTests.obstructionReversalPassed}
                      onChange={e => setReport(prev => ({
                        ...prev,
                        systems: {
                          ...prev.systems,
                          garageDoors: {
                            ...prev.systems.garageDoors,
                            functionalTests: { ...prev.systems.garageDoors.functionalTests, obstructionReversalPassed: e.target.checked }
                          }
                        }
                      }))}
                      className="rounded text-[#CC322C]"
                    />
                    <span>Obstruction Reversal Operational</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold">
                    <input
                      type="checkbox"
                      checked={report.systems.garageDoors.functionalTests.mechanicalFaultSeparatedFromMotor}
                      onChange={e => setReport(prev => ({
                        ...prev,
                        systems: {
                          ...prev.systems,
                          garageDoors: {
                            ...prev.systems.garageDoors,
                            functionalTests: { ...prev.systems.garageDoors.functionalTests, mechanicalFaultSeparatedFromMotor: e.target.checked }
                          }
                        }
                      }))}
                      className="rounded text-[#CC322C]"
                    />
                    <span>Mechanical vs Motor Fault Separated</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 7: GATE MOTOR AUTOMATION */}
        {/* ========================================================= */}
        {activeTab === 'gateMotors' && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-[#091C3E] dark:text-white uppercase font-brand-header">
                  8 | Gate Motor Automation Assessment
                </h3>
                <p className="text-xs text-slate-500">
                  Sliding or swing mechanics, ground track & rack (steel/nylon), motor electronics, backup battery, safety beams, and manual override release.
                </p>
              </div>
              <select
                value={report.systems.gateMotors.presence}
                onChange={e => setReport(prev => ({
                  ...prev,
                  systems: { ...prev.systems, gateMotors: { ...prev.systems.gateMotors, presence: e.target.value as any } }
                }))}
                className="p-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                {SYSTEM_PRESENCE_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {report.systems.gateMotors.presence !== 'Not installed' && (
              <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Gate Type *</label>
                    <select
                      value={report.systems.gateMotors.gateType}
                      onChange={e => setReport(prev => ({
                        ...prev,
                        systems: { ...prev.systems, gateMotors: { ...prev.systems.gateMotors, gateType: e.target.value as any } }
                      }))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                    >
                      <option value="Sliding">Sliding Gate</option>
                      <option value="Swing">Swing Gate (Single/Double)</option>
                      <option value="Telescopic">Telescopic Sliding Gate</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Motor Brand *</label>
                    <select
                      value={report.systems.gateMotors.motorBrand}
                      onChange={e => setReport(prev => ({
                        ...prev,
                        systems: { ...prev.systems, gateMotors: { ...prev.systems.gateMotors, motorBrand: e.target.value } }
                      }))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                    >
                      {GATE_MOTOR_BRANDS.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Rack Type</label>
                    <select
                      value={report.systems.gateMotors.rackType}
                      onChange={e => setReport(prev => ({
                        ...prev,
                        systems: { ...prev.systems, gateMotors: { ...prev.systems.gateMotors, rackType: e.target.value as any } }
                      }))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    >
                      <option value="Steel">Steel Angle / Tooth Rack</option>
                      <option value="Nylon">Nylon / Polymer Reinforced</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Safety Beams Type</label>
                    <select
                      value={report.systems.gateMotors.gateBeamsType}
                      onChange={e => setReport(prev => ({
                        ...prev,
                        systems: { ...prev.systems, gateMotors: { ...prev.systems.gateMotors, gateBeamsType: e.target.value as any } }
                      }))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    >
                      <option value="Wireless">Wireless Beams (Photon/etc)</option>
                      <option value="Wired">Hardwired Safety Beams</option>
                      <option value="None">None (Defect Hazard)</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer font-bold">
                    <input
                      type="checkbox"
                      checked={report.systems.gateMotors.gateBeamsOperational}
                      onChange={e => setReport(prev => ({
                        ...prev,
                        systems: { ...prev.systems, gateMotors: { ...prev.systems.gateMotors, gateBeamsOperational: e.target.checked } }
                      }))}
                      className="rounded text-[#CC322C]"
                    />
                    <span>Beams Reverse Gate</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold">
                    <input
                      type="checkbox"
                      checked={report.systems.gateMotors.functionalTests.manualKeyReleasePassed}
                      onChange={e => setReport(prev => ({
                        ...prev,
                        systems: {
                          ...prev.systems,
                          gateMotors: {
                            ...prev.systems.gateMotors,
                            functionalTests: { ...prev.systems.gateMotors.functionalTests, manualKeyReleasePassed: e.target.checked }
                          }
                        }
                      }))}
                      className="rounded text-[#CC322C]"
                    />
                    <span>Manual Override Key Ok</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold">
                    <input
                      type="checkbox"
                      checked={report.systems.gateMotors.pedestrianOpeningFunctional}
                      onChange={e => setReport(prev => ({
                        ...prev,
                        systems: { ...prev.systems, gateMotors: { ...prev.systems.gateMotors, pedestrianOpeningFunctional: e.target.checked } }
                      }))}
                      className="rounded text-[#CC322C]"
                    />
                    <span>Pedestrian Opening Mode</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold">
                    <input
                      type="checkbox"
                      checked={report.systems.gateMotors.autoCloseFunctional}
                      onChange={e => setReport(prev => ({
                        ...prev,
                        systems: { ...prev.systems, gateMotors: { ...prev.systems.gateMotors, autoCloseFunctional: e.target.checked } }
                      }))}
                      className="rounded text-[#CC322C]"
                    />
                    <span>Auto-close Functional</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 8: ELECTRIC FENCING & COC */}
        {/* ========================================================= */}
        {activeTab === 'electricFence' && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-[#091C3E] dark:text-white uppercase font-brand-header">
                  9 | Electric Fencing & EFSCOC Compliance
                </h3>
                <p className="text-xs text-slate-500">
                  Energizer brand/serial, measured fence kV & earth return voltage, strand construction, warning signs, and Electric Fence System Certificate of Compliance.
                </p>
              </div>
              <select
                value={report.systems.electricFence.presence}
                onChange={e => setReport(prev => ({
                  ...prev,
                  systems: { ...prev.systems, electricFence: { ...prev.systems.electricFence, presence: e.target.value as any } }
                }))}
                className="p-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                {SYSTEM_PRESENCE_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {report.systems.electricFence.presence !== 'Not installed' && (
              <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Energizer Brand *</label>
                    <select
                      value={report.systems.electricFence.energizerBrand}
                      onChange={e => setReport(prev => ({
                        ...prev,
                        systems: { ...prev.systems, electricFence: { ...prev.systems.electricFence, energizerBrand: e.target.value } }
                      }))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                    >
                      {ELECTRIC_FENCE_BRANDS.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Measured Fence Voltage (kV) *</label>
                    <input
                      type="number"
                      step="0.1"
                      value={report.systems.electricFence.measuredFenceVoltageKv}
                      onChange={e => setReport(prev => ({
                        ...prev,
                        systems: { ...prev.systems, electricFence: { ...prev.systems.electricFence, measuredFenceVoltageKv: parseFloat(e.target.value) || 0 } }
                      }))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold text-[#CC322C]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Earth Voltage (kV) *</label>
                    <input
                      type="number"
                      step="0.05"
                      value={report.systems.electricFence.measuredEarthVoltageKv}
                      onChange={e => setReport(prev => ({
                        ...prev,
                        systems: { ...prev.systems, electricFence: { ...prev.systems.electricFence, measuredEarthVoltageKv: parseFloat(e.target.value) || 0 } }
                      }))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 text-[10px] font-bold uppercase mb-1">EFSCOC Certificate Available *</label>
                    <select
                      value={report.systems.electricFence.efscocCertificateAvailable}
                      onChange={e => setReport(prev => ({
                        ...prev,
                        systems: { ...prev.systems, electricFence: { ...prev.systems.electricFence, efscocCertificateAvailable: e.target.value as any } }
                      }))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                    >
                      <option value="Yes">Yes (Certificate Inspected)</option>
                      <option value="No">No (Uncertified / Non-compliant)</option>
                      <option value="Not provided">Not provided by Member</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer font-bold">
                    <input
                      type="checkbox"
                      checked={report.systems.electricFence.warningSignsEvery10mPass}
                      onChange={e => setReport(prev => ({
                        ...prev,
                        systems: { ...prev.systems, electricFence: { ...prev.systems.electricFence, warningSignsEvery10mPass: e.target.checked } }
                      }))}
                      className="rounded text-[#CC322C]"
                    />
                    <span>Warning Signs Every 10m & Gates</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold">
                    <input
                      type="checkbox"
                      checked={report.systems.electricFence.vegetationClearanceCompliant}
                      onChange={e => setReport(prev => ({
                        ...prev,
                        systems: { ...prev.systems, electricFence: { ...prev.systems.electricFence, vegetationClearanceCompliant: e.target.checked } }
                      }))}
                      className="rounded text-[#CC322C]"
                    />
                    <span>Vegetation Clearance Adequate</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold">
                    <input
                      type="checkbox"
                      checked={report.systems.electricFence.alarmsSirenKeypadAppFunctional}
                      onChange={e => setReport(prev => ({
                        ...prev,
                        systems: { ...prev.systems, electricFence: { ...prev.systems.electricFence, alarmsSirenKeypadAppFunctional: e.target.checked } }
                      }))}
                      className="rounded text-[#CC322C]"
                    />
                    <span>Fence Siren & Tamper Alarm Ok</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 9: BOOM GATE SYSTEMS (V2.0 ADDENDUM 14) */}
        {/* ========================================================= */}
        {activeTab === 'boomGates' && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-[#091C3E] dark:text-white uppercase font-brand-header">
                    14 | Boom Gate Systems – Full Dedicated Assessment
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#CC322C] text-white">v2.0 Mandatory</span>
                </div>
                <p className="text-xs text-slate-500">
                  Entrance lane, arm length/type, loop detectors, safety beams/photocells, breakaway arm, access control/LPR integration, and raise/lower limits.
                </p>
              </div>
              <select
                value={report.systems.boomGates.presence}
                onChange={e => setReport(prev => ({
                  ...prev,
                  systems: { ...prev.systems, boomGates: { ...prev.systems.boomGates, presence: e.target.value as any } }
                }))}
                className="p-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                {SYSTEM_PRESENCE_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {report.systems.boomGates.presence !== 'Not installed' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Boom Gate Units Installed ({report.systems.boomGates.units.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const nextNum = report.systems.boomGates.units.length + 1;
                      setReport(prev => ({
                        ...prev,
                        systems: {
                          ...prev.systems,
                          boomGates: {
                            ...prev.systems.boomGates,
                            units: [
                              ...prev.systems.boomGates.units,
                              {
                                id: `bg-${Date.now()}`,
                                entranceLaneName: `Lane ${nextNum} Boom`,
                                direction: 'Inbound',
                                location: 'Guardhouse Entrance',
                                manufacturer: 'Centurion Sector 3m / 4.5m / 6m',
                                model: 'Sector 4.5m',
                                controllerPcb: 'Standard Controller',
                                serialNumber: `BG-SN-${Date.now().toString().slice(-5)}`,
                                motorRatingDutyCycle: '24V DC 100% Continuous',
                                boomArmLengthMeters: 4.5,
                                boomArmMaterial: 'Aluminium',
                                boomArmType: 'Straight',
                                boomArmCondition: 'Good',
                                balancingSpringCounterweightCondition: 'Balanced',
                                pivotGearboxCabinetFixingPass: true,
                                mainSupplyPsuUpsPass: true,
                                batteryBackupSpec: '2x 12V 7Ah SLA',
                                powerFailureOperationPass: true,
                                vehicleLoopDetectorsPass: true,
                                safetyPhotocellsBeamsPass: true,
                                safetyEdgesPass: true,
                                warningLightsSirenPass: true,
                                emergencyStopButtonPass: true,
                                manualOverrideReleasePass: true,
                                breakawayArmFitted: true,
                                accessControlReaderTriggerPass: true,
                                intercomTriggerPass: true,
                                remotesPushButtonsPass: true,
                                licensePlateRecognitionLprPass: true,
                                raiseLowerCyclesLimitsPass: true,
                                operatingSpeedNormal: true,
                                photos: [],
                                testResult: 'Pass'
                              }
                            ]
                          }
                        }
                      }));
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#091C3E] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#142D59] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Boom Gate Unit</span>
                  </button>
                </div>

                {report.systems.boomGates.units.map((unit, idx) => (
                  <div key={unit.id} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                      <span className="font-bold text-sm text-[#091C3E] dark:text-white">
                        Boom Unit #{idx + 1}: {unit.entranceLaneName}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = report.systems.boomGates.units.filter((_, i) => i !== idx);
                          setReport(prev => ({
                            ...prev,
                            systems: { ...prev.systems, boomGates: { ...prev.systems.boomGates, units: updated } }
                          }));
                        }}
                        className="text-red-500 hover:text-red-700 text-xs font-bold"
                      >
                        Remove Unit
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Lane / Location</label>
                        <input
                          type="text"
                          value={unit.entranceLaneName}
                          onChange={e => {
                            const updated = [...report.systems.boomGates.units];
                            updated[idx].entranceLaneName = e.target.value;
                            setReport(prev => ({
                              ...prev,
                              systems: { ...prev.systems, boomGates: { ...prev.systems.boomGates, units: updated } }
                            }));
                          }}
                          className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Manufacturer *</label>
                        <select
                          value={unit.manufacturer}
                          onChange={e => {
                            const updated = [...report.systems.boomGates.units];
                            updated[idx].manufacturer = e.target.value;
                            setReport(prev => ({
                              ...prev,
                              systems: { ...prev.systems, boomGates: { ...prev.systems.boomGates, units: updated } }
                            }));
                          }}
                          className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                        >
                          {BOOM_GATE_BRANDS.map(b => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Arm Length (Meters)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={unit.boomArmLengthMeters}
                          onChange={e => {
                            const updated = [...report.systems.boomGates.units];
                            updated[idx].boomArmLengthMeters = parseFloat(e.target.value) || 3;
                            setReport(prev => ({
                              ...prev,
                              systems: { ...prev.systems, boomGates: { ...prev.systems.boomGates, units: updated } }
                            }));
                          }}
                          className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Arm Type</label>
                        <select
                          value={unit.boomArmType}
                          onChange={e => {
                            const updated = [...report.systems.boomGates.units];
                            updated[idx].boomArmType = e.target.value as any;
                            setReport(prev => ({
                              ...prev,
                              systems: { ...prev.systems, boomGates: { ...prev.systems.boomGates, units: updated } }
                            }));
                          }}
                          className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                        >
                          <option value="Straight">Straight Boom Arm</option>
                          <option value="Articulated (folding)">Articulated (Low Clearance)</option>
                          <option value="Fence-skirt / curtain">Fence-skirt / Curtain Curtain</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={unit.vehicleLoopDetectorsPass}
                          onChange={e => {
                            const updated = [...report.systems.boomGates.units];
                            updated[idx].vehicleLoopDetectorsPass = e.target.checked;
                            setReport(prev => ({
                              ...prev,
                              systems: { ...prev.systems, boomGates: { ...prev.systems.boomGates, units: updated } }
                            }));
                          }}
                          className="rounded text-[#CC322C]"
                        />
                        <span>Loop Detectors Pass</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={unit.safetyPhotocellsBeamsPass}
                          onChange={e => {
                            const updated = [...report.systems.boomGates.units];
                            updated[idx].safetyPhotocellsBeamsPass = e.target.checked;
                            setReport(prev => ({
                              ...prev,
                              systems: { ...prev.systems, boomGates: { ...prev.systems.boomGates, units: updated } }
                            }));
                          }}
                          className="rounded text-[#CC322C]"
                        />
                        <span>Safety Photocells Pass</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={unit.breakawayArmFitted}
                          onChange={e => {
                            const updated = [...report.systems.boomGates.units];
                            updated[idx].breakawayArmFitted = e.target.checked;
                            setReport(prev => ({
                              ...prev,
                              systems: { ...prev.systems, boomGates: { ...prev.systems.boomGates, units: updated } }
                            }));
                          }}
                          className="rounded text-[#CC322C]"
                        />
                        <span>Breakaway Arm Fitted</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={unit.licensePlateRecognitionLprPass}
                          onChange={e => {
                            const updated = [...report.systems.boomGates.units];
                            updated[idx].licensePlateRecognitionLprPass = e.target.checked;
                            setReport(prev => ({
                              ...prev,
                              systems: { ...prev.systems, boomGates: { ...prev.systems.boomGates, units: updated } }
                            }));
                          }}
                          className="rounded text-[#CC322C]"
                        />
                        <span>LPR Camera Trigger Pass</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 10: TURNSTILE SYSTEMS (V2.0 ADDENDUM 15) */}
        {/* ========================================================= */}
        {activeTab === 'turnstiles' && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-[#091C3E] dark:text-white uppercase font-brand-header">
                    15 | Turnstile Systems – Full Dedicated Assessment
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#CC322C] text-white">v2.0 Mandatory</span>
                </div>
                <p className="text-xs text-slate-500">
                  Full-height, waist-high or speed gate barriers, readers integration, anti-tailgating, and mandatory fire-alarm emergency evacuation release.
                </p>
              </div>
              <select
                value={report.systems.turnstiles.presence}
                onChange={e => setReport(prev => ({
                  ...prev,
                  systems: { ...prev.systems, turnstiles: { ...prev.systems.turnstiles, presence: e.target.value as any } }
                }))}
                className="p-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                {SYSTEM_PRESENCE_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {report.systems.turnstiles.presence !== 'Not installed' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Turnstile Units Installed ({report.systems.turnstiles.units.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const nextNum = report.systems.turnstiles.units.length + 1;
                      setReport(prev => ({
                        ...prev,
                        systems: {
                          ...prev.systems,
                          turnstiles: {
                            ...prev.systems.turnstiles,
                            units: [
                              ...prev.systems.turnstiles.units,
                              {
                                id: `turn-${Date.now()}`,
                                entryLocation: `Pedestrian Turnstile ${nextNum}`,
                                passageDirection: 'Bi-directional',
                                turnstileType: 'Full-height (single)',
                                manufacturer: 'Turnstar Trident / Tribune',
                                model: 'Titan Full-height',
                                controllerPcb: 'Rotalok Logic',
                                serialNumber: `TS-${Date.now().toString().slice(-5)}`,
                                indoorOutdoorUse: 'Outdoor sheltered',
                                operationType: 'Electromechanical',
                                mechanicsCondition: 'Smooth',
                                readersIntegrationType: 'Biometric & Card Reader',
                                antiTailgatingOperational: true,
                                countingLoggingOperational: true,
                                fireAlarmEmergencyEvacuationReleasePass: true,
                                powerFailureFreeExitPass: true,
                                entryExitAuthorizedPass: true,
                                entryDeniedAlarmPass: true,
                                passageSensorsResponsePass: true,
                                photos: [],
                                testResult: 'Pass'
                              }
                            ]
                          }
                        }
                      }));
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#091C3E] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#142D59] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Turnstile Unit</span>
                  </button>
                </div>

                {report.systems.turnstiles.units.map((unit, idx) => (
                  <div key={unit.id} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                      <span className="font-bold text-sm text-[#091C3E] dark:text-white">
                        Turnstile #{idx + 1}: {unit.entryLocation}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = report.systems.turnstiles.units.filter((_, i) => i !== idx);
                          setReport(prev => ({
                            ...prev,
                            systems: { ...prev.systems, turnstiles: { ...prev.systems.turnstiles, units: updated } }
                          }));
                        }}
                        className="text-red-500 hover:text-red-700 text-xs font-bold"
                      >
                        Remove Unit
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Entry Location</label>
                        <input
                          type="text"
                          value={unit.entryLocation}
                          onChange={e => {
                            const updated = [...report.systems.turnstiles.units];
                            updated[idx].entryLocation = e.target.value;
                            setReport(prev => ({
                              ...prev,
                              systems: { ...prev.systems, turnstiles: { ...prev.systems.turnstiles, units: updated } }
                            }));
                          }}
                          className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Barrier Type *</label>
                        <select
                          value={unit.turnstileType}
                          onChange={e => {
                            const updated = [...report.systems.turnstiles.units];
                            updated[idx].turnstileType = e.target.value as any;
                            setReport(prev => ({
                              ...prev,
                              systems: { ...prev.systems, turnstiles: { ...prev.systems.turnstiles, units: updated } }
                            }));
                          }}
                          className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                        >
                          <option value="Tripod">Tripod Turnstile (Waist-high)</option>
                          <option value="Full-height (single)">Full-height Single Rotor</option>
                          <option value="Full-height (double)">Full-height Double Rotor</option>
                          <option value="Speed gate (glass)">Speed Gate (Glass Wings)</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Manufacturer</label>
                        <select
                          value={unit.manufacturer}
                          onChange={e => {
                            const updated = [...report.systems.turnstiles.units];
                            updated[idx].manufacturer = e.target.value;
                            setReport(prev => ({
                              ...prev,
                              systems: { ...prev.systems, turnstiles: { ...prev.systems.turnstiles, units: updated } }
                            }));
                          }}
                          className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                        >
                          {TURNSTILE_BRANDS.map(b => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Passage Direction</label>
                        <select
                          value={unit.passageDirection}
                          onChange={e => {
                            const updated = [...report.systems.turnstiles.units];
                            updated[idx].passageDirection = e.target.value as any;
                            setReport(prev => ({
                              ...prev,
                              systems: { ...prev.systems, turnstiles: { ...prev.systems.turnstiles, units: updated } }
                            }));
                          }}
                          className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                        >
                          <option value="Bi-directional">Bi-directional (Entry & Exit)</option>
                          <option value="Single">Single Direction Only</option>
                        </select>
                      </div>
                    </div>

                    {/* MANDATORY FIRE ALARM & SAFETY TESTS */}
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <label className="flex items-center gap-1.5 cursor-pointer font-bold text-red-600">
                        <input
                          type="checkbox"
                          checked={unit.fireAlarmEmergencyEvacuationReleasePass}
                          onChange={e => {
                            const updated = [...report.systems.turnstiles.units];
                            updated[idx].fireAlarmEmergencyEvacuationReleasePass = e.target.checked;
                            setReport(prev => ({
                              ...prev,
                              systems: { ...prev.systems, turnstiles: { ...prev.systems.turnstiles, units: updated } }
                            }));
                          }}
                          className="rounded text-red-600"
                        />
                        <span>Fire Evac Release Pass</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                        <input
                          type="checkbox"
                          checked={unit.powerFailureFreeExitPass}
                          onChange={e => {
                            const updated = [...report.systems.turnstiles.units];
                            updated[idx].powerFailureFreeExitPass = e.target.checked;
                            setReport(prev => ({
                              ...prev,
                              systems: { ...prev.systems, turnstiles: { ...prev.systems.turnstiles, units: updated } }
                            }));
                          }}
                          className="rounded text-[#CC322C]"
                        />
                        <span>Power Failure Free Exit</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                        <input
                          type="checkbox"
                          checked={unit.antiTailgatingOperational}
                          onChange={e => {
                            const updated = [...report.systems.turnstiles.units];
                            updated[idx].antiTailgatingOperational = e.target.checked;
                            setReport(prev => ({
                              ...prev,
                              systems: { ...prev.systems, turnstiles: { ...prev.systems.turnstiles, units: updated } }
                            }));
                          }}
                          className="rounded text-[#CC322C]"
                        />
                        <span>Anti-tailgating Sensors</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                        <input
                          type="checkbox"
                          checked={unit.entryDeniedAlarmPass}
                          onChange={e => {
                            const updated = [...report.systems.turnstiles.units];
                            updated[idx].entryDeniedAlarmPass = e.target.checked;
                            setReport(prev => ({
                              ...prev,
                              systems: { ...prev.systems, turnstiles: { ...prev.systems.turnstiles, units: updated } }
                            }));
                          }}
                          className="rounded text-[#CC322C]"
                        />
                        <span>Unauthorized Alarm Pass</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 11: DEFECT REGISTER & CONDITIONAL FAULTS */}
        {/* ========================================================= */}
        {activeTab === 'faults' && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-[#091C3E] dark:text-white uppercase font-brand-header">
                  11 | Consolidated Defect & Pre-Existing Fault Register
                </h3>
                <p className="text-xs text-slate-500">
                  Detailed conditional fault entries for every non-working or untested component. Includes exact symptoms, test evidence, reason untested, recommended work, urgency and ZAR estimates.
                </p>
              </div>

              <button
                type="button"
                onClick={() => addFaultToSystem('alarm', 'New Inspected Component')}
                className="px-3.5 py-2 rounded-xl bg-[#CC322C] hover:bg-[#b02a25] text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Defect Entry</span>
              </button>
            </div>

            {report.consolidatedFaults.length === 0 ? (
              <div className="p-8 text-center bg-emerald-500/10 border border-emerald-500/20 rounded-3xl space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <h4 className="font-bold text-sm text-emerald-600 dark:text-emerald-400">Zero Pre-Existing Defects Logged</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  All inspected essential security equipment is recorded as fully functional. If any component is faulty or untested, use the "Add Defect Entry" button to record symptoms and required work.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {report.consolidatedFaults.map(fault => (
                  <div key={fault.id} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-red-200 dark:border-red-900/40 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
                          {fault.systemName}
                        </span>
                        <input
                          type="text"
                          value={fault.componentOrDevice}
                          onChange={e => {
                            const updated = report.consolidatedFaults.map(f => f.id === fault.id ? { ...f, componentOrDevice: e.target.value } : f);
                            setReport(prev => ({ ...prev, consolidatedFaults: updated }));
                          }}
                          className="font-bold p-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <select
                          value={fault.urgency}
                          onChange={e => {
                            const updated = report.consolidatedFaults.map(f => f.id === fault.id ? { ...f, urgency: e.target.value as FaultUrgency } : f);
                            setReport(prev => ({ ...prev, consolidatedFaults: updated }));
                          }}
                          className="p-1 rounded text-xs font-bold border border-slate-300 dark:border-slate-700"
                        >
                          <option value="Low">Low Urgency</option>
                          <option value="Medium">Medium Urgency</option>
                          <option value="High">High Urgency</option>
                          <option value="Critical">Critical Urgency</option>
                        </select>

                        <div className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">
                          <span>R</span>
                          <input
                            type="number"
                            value={fault.estimatedCost}
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 0;
                              const updated = report.consolidatedFaults.map(f => f.id === fault.id ? { ...f, estimatedCost: val } : f);
                              setReport(prev => ({ ...prev, consolidatedFaults: updated }));
                            }}
                            className="w-24 p-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const updated = report.consolidatedFaults.filter(f => f.id !== fault.id);
                            setReport(prev => ({ ...prev, consolidatedFaults: updated }));
                          }}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                          title="Delete defect"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Exact Symptoms Found *</label>
                        <textarea
                          rows={2}
                          value={fault.exactSymptoms}
                          onChange={e => {
                            const updated = report.consolidatedFaults.map(f => f.id === fault.id ? { ...f, exactSymptoms: e.target.value } : f);
                            setReport(prev => ({ ...prev, consolidatedFaults: updated }));
                          }}
                          className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Recommended Remedial Work *</label>
                        <textarea
                          rows={2}
                          value={fault.recommendedWork}
                          onChange={e => {
                            const updated = report.consolidatedFaults.map(f => f.id === fault.id ? { ...f, recommendedWork: e.target.value } : f);
                            setReport(prev => ({ ...prev, consolidatedFaults: updated }));
                          }}
                          className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Reason Untested (If Untested / Unsafe)</label>
                        <select
                          value={fault.reasonUntested || ''}
                          onChange={e => {
                            const updated = report.consolidatedFaults.map(f => f.id === fault.id ? { ...f, reasonUntested: e.target.value } : f);
                            setReport(prev => ({ ...prev, consolidatedFaults: updated }));
                          }}
                          className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                        >
                          <option value="">N/A - Functional Test Attempted & Failed</option>
                          {UNTESTED_REASONS.map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}

                {/* TOTAL COST SUMMARY */}
                <div className="p-4 rounded-2xl bg-[#091C3E] text-white flex items-center justify-between font-bold">
                  <div>
                    <span className="text-xs text-slate-300 block">Pre-Membership Repair Obligation</span>
                    <span className="text-lg text-white">Estimated Rectification Total</span>
                  </div>
                  <span className="text-2xl text-amber-300 font-mono">
                    R{Number(report.totalPreMembershipRepairsZar).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 12: SIGNOFF & BASELINE */}
        {/* ========================================================= */}
        {activeTab === 'signoff' && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-[#091C3E] dark:text-white uppercase font-brand-header">
                  12 | Review, Member Acknowledgement & Baseline Lock
                </h3>
                <p className="text-xs text-slate-500">
                  Technician overall verdict, member signature or recorded refusal option, and locked historical baseline creation.
                </p>
              </div>
              <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-1 rounded-lg">
                Final Step
              </span>
            </div>

            {/* OVERALL VERDICT OUTCOME SELECTOR */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Overall Technical Assessment Outcome *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                {(['All good', 'Repairs required', 'Further assessment required', 'Declined pending correction'] as AssessmentOutcome[]).map(out => (
                  <button
                    key={out}
                    type="button"
                    onClick={() => setReport(prev => ({ ...prev, outcome: out }))}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                      report.outcome === out
                        ? out === 'All good'
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500'
                          : 'bg-[#CC322C]/20 text-[#CC322C] border-[#CC322C]'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {out}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Technician Observations & Findings *</label>
                <textarea
                  rows={3}
                  value={report.technicianObservations}
                  onChange={e => setReport(prev => ({ ...prev, technicianObservations: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Optional Upgrades Recommended</label>
                <input
                  type="text"
                  placeholder="e.g. Recommend solar battery inverter backup for gate motor during loadshedding"
                  value={report.optionalUpgradesRecommended || ''}
                  onChange={e => setReport(prev => ({ ...prev, optionalUpgradesRecommended: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                />
              </div>
            </div>

            {/* MEMBER ACKNOWLEDGEMENT OR REFUSAL */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Member Acknowledgement & Digital Sign-off
                </h4>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setSignatureMode('draw');
                      setReport(prev => ({
                        ...prev,
                        memberAcknowledgement: {
                          ...prev.memberAcknowledgement,
                          memberSigned: true,
                          memberRefusalRecorded: false,
                          refusalReason: ''
                        }
                      }));
                    }}
                    className={`px-3 py-1 rounded-lg font-bold cursor-pointer ${
                      signatureMode === 'draw' ? 'bg-[#091C3E] text-white' : 'text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    Member Signed
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSignatureMode('refusal');
                      setReport(prev => ({
                        ...prev,
                        memberAcknowledgement: {
                          ...prev.memberAcknowledgement,
                          memberSigned: false,
                          memberRefusalRecorded: true
                        }
                      }));
                    }}
                    className={`px-3 py-1 rounded-lg font-bold cursor-pointer ${
                      signatureMode === 'refusal' ? 'bg-[#CC322C] text-white' : 'text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    Record Refusal
                  </button>
                </div>
              </div>

              {signatureMode === 'draw' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Signatory Name *</label>
                    <input
                      type="text"
                      value={report.memberAcknowledgement.signatoryName}
                      onChange={e => setReport(prev => ({
                        ...prev,
                        memberAcknowledgement: { ...prev.memberAcknowledgement, signatoryName: e.target.value }
                      }))}
                      className="w-full max-w-md p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                    />
                  </div>

                  <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-center space-y-1">
                    <span className="font-serif italic text-xl font-bold text-[#091C3E] dark:text-blue-300 block">
                      {report.memberAcknowledgement.signatoryName || 'Member Digital Signature'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      Digitally logged on {new Date().toLocaleString('en-ZA')}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl space-y-2 text-xs">
                  <span className="font-bold text-red-600 block">
                    Recorded Member Refusal to Sign (Auditable Exception)
                  </span>
                  <input
                    type="text"
                    placeholder="Document explicit reason for member refusal (e.g. Disputed beam alignment findings)..."
                    value={report.memberAcknowledgement.refusalReason || ''}
                    onChange={e => setReport(prev => ({
                      ...prev,
                      memberAcknowledgement: {
                        ...prev.memberAcknowledgement,
                        memberRefusalRecorded: true,
                        refusalReason: e.target.value
                      }
                    }))}
                    className="w-full p-2.5 rounded-xl border border-red-300 dark:border-red-800 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
              )}
            </div>

            {/* BASELINE LOCK NOTICE */}
            <div className="p-4 rounded-2xl bg-[#091C3E] text-white flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-[#CC322C] shrink-0" />
              <div className="text-xs">
                <span className="font-bold uppercase tracking-wider block text-amber-300 text-[10px]">
                  Historical Baseline Integrity (Section 11 & 12 Criteria)
                </span>
                <p className="text-slate-300 mt-0.5">
                  Submitting this assessment establishes the member's immutable baseline register. Future repairs, replacements, or additions will create dated history entries without overwriting this initial record.
                </p>
              </div>
            </div>

            {/* FINAL SUBMIT BUTTON */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleFinalSubmit}
              className="w-full py-4 rounded-2xl bg-[#CC322C] hover:bg-[#b02a25] text-white font-extrabold text-sm uppercase tracking-wider shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting Technical Baseline...' : 'Submit Completed Assessment & Lock Baseline'}</span>
            </button>
          </div>
        )}
      </div>

      {/* FOOTER CONTROLS */}
      <div className="bg-slate-100 dark:bg-slate-950 p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={() => {
            const tabs: TabKey[] = ['location', 'alarm', 'cctv', 'accessControl', 'intercom', 'garageDoors', 'gateMotors', 'electricFence', 'boomGates', 'turnstiles', 'faults', 'signoff'];
            const curIdx = tabs.indexOf(activeTab);
            if (curIdx > 0) setActiveTab(tabs[curIdx - 1]);
          }}
          disabled={activeTab === 'location'}
          className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <span className="font-mono text-[11px] text-slate-400">
          Same Day Assist • Version 2.0 Complete Architecture
        </span>

        <button
          type="button"
          onClick={() => {
            const tabs: TabKey[] = ['location', 'alarm', 'cctv', 'accessControl', 'intercom', 'garageDoors', 'gateMotors', 'electricFence', 'boomGates', 'turnstiles', 'faults', 'signoff'];
            const curIdx = tabs.indexOf(activeTab);
            if (curIdx < tabs.length - 1) setActiveTab(tabs[curIdx + 1]);
          }}
          disabled={activeTab === 'signoff'}
          className="px-4 py-2 rounded-xl bg-[#091C3E] text-white font-bold disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
        >
          <span>Next Section</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* PDF MODAL */}
      {showPdfModal && (
        <AssessmentPdfModal
          assessment={report}
          assessmentId={report.assessmentId || report.id}
          onClose={() => setShowPdfModal(false)}
        />
      )}
    </div>
  );
}
