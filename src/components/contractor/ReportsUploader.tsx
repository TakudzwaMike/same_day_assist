import React, { useState } from 'react';
import { Camera, CheckSquare, Plus, Trash, ClipboardCheck, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAppState } from '../../contexts/AppStateContext';
import { TechnicalAssessmentForm } from '../assessment/TechnicalAssessmentForm';
import { TechnicalAssessmentReport } from '../../types/technicalAssessment';

interface ReportsUploaderProps {
  activeContractor: any;
}

export default function ReportsUploader({ activeContractor }: ReportsUploaderProps) {
  const { state, uploadAssessment, addAuditLogLocal } = useAppState();

  const [isFullAssessmentOpen, setIsFullAssessmentOpen] = useState(false);
  const [assessmentNotes, setAssessmentNotes] = useState('');
  const [assessmentDefects, setAssessmentDefects] = useState<string[]>([
    'Gate automation limit-switches exposed to rain (Safety risk)',
    'Main breaker lacks functional overload leakage module (SABS Non-compliant)'
  ]);
  const [newDefectText, setNewDefectText] = useState('');
  const [estimatedCost, setEstimatedCost] = useState(1500);
  const [assessmentPhoto, setAssessmentPhoto] = useState<string | null>(null);

  const activeAssessment = state.assessments.find(
    a => (a.contractorId === activeContractor?.id || !a.contractorId) && (a.status === 'Assessing' || a.status === 'Scheduled')
  ) || state.assessments[0];

  const handleAddDefect = () => {
    if (newDefectText.trim()) {
      setAssessmentDefects([...assessmentDefects, newDefectText.trim()]);
      setNewDefectText('');
    }
  };

  const handleRemoveDefect = (idx: number) => {
    setAssessmentDefects(assessmentDefects.filter((_, i) => i !== idx));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAssessmentPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFullAssessmentComplete = async (report: TechnicalAssessmentReport) => {
    if (!activeAssessment) {
      alert('No active assessment survey record found to link this report to.');
      return;
    }
    const issues = report.consolidatedFaults.map(f => `${f.systemName} (${f.componentOrDevice}): ${f.exactSymptoms} [${f.urgency}]`);
    await uploadAssessment(activeAssessment.id, {
      issuesFound: issues,
      estimatedCost: report.totalPreMembershipRepairsZar,
      contractorNotes: report.technicianObservations,
      photoUrl: report.addressInfo?.propertyEntrancePhotoUrl,
      structuredData: report,
      outcome: report.outcome,
    });
    addAuditLogLocal('Full Technical Assessment Completed', `Technician completed V2.0 equipment register for assessment ${activeAssessment.id}.`);
    setIsFullAssessmentOpen(false);
    alert('Version 2.0 Technical Assessment & Equipment Register successfully recorded!');
  };

  const handleSurveySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAssessment) {
      alert('No active assessment survey found.');
      return;
    }

    try {
      await uploadAssessment(activeAssessment.id, {
        issuesFound: assessmentDefects,
        estimatedCost: estimatedCost,
        contractorNotes: assessmentNotes,
        photoUrl: assessmentPhoto || undefined
      });
      addAuditLogLocal('Compliance Survey Uploaded', `Surveyor uploaded safety audit for assessment ${activeAssessment.id}.`);
    } catch (err: any) {
      alert(err.message || 'Failed to upload assessment');
    }
  };

  if (isFullAssessmentOpen) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
        <div className="w-full max-w-6xl max-h-[96vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-3xl p-4 md:p-6 shadow-2xl">
          <TechnicalAssessmentForm
            enquiry={state.enquiries.find(e => e.id === activeAssessment?.enquiryId)}
            assessmentRecord={activeAssessment}
            contractorUser={activeContractor}
            onSave={handleFullAssessmentComplete}
            onCancel={() => setIsFullAssessmentOpen(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* V2.0 Assessment Banner */}
      <div className="bg-gradient-to-r from-[#091C3E] via-slate-900 to-[#142D59] p-5 rounded-3xl border border-[#CC322C]/40 shadow-lg text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#CC322C]" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#CC322C] font-bold">
                Same Day Assist | Version 2.0 Standard
              </span>
            </div>
            <h3 className="text-base font-bold text-white">Technical Assessment & Equipment Register</h3>
            <p className="text-xs text-slate-300 max-w-xl">
              Complete the verified baseline assessment across all 9 essential security systems (Alarms, CCTV, Access Control, Intercoms, Garage, Gate, Electric Fence, Boom Gates, Turnstiles) with RG59 verification, address checks, fault analysis, and member digital sign-off.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsFullAssessmentOpen(true)}
            className="px-5 py-3 rounded-2xl bg-[#CC322C] hover:bg-[#b02b26] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all shrink-0"
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Launch V2.0 Assessment</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <form onSubmit={handleSurveySubmit} className="bg-zinc-850 p-5 rounded-3xl border border-zinc-800 flex flex-col gap-4 text-xs text-zinc-300 animate-fadeIn shadow-xs">
        <div className="border-b border-zinc-800 pb-2 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-brand-header">Quick Property Defect Log</h4>
            <p className="text-[9px] text-zinc-400">Record standalone non-compliance defects or co-pay items</p>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">Quick Entry</span>
        </div>

        <div className="space-y-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] text-zinc-400 uppercase font-bold tracking-wide">Identified Property Defects</label>
          <div className="space-y-1.5">
            {assessmentDefects.map((def, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3 bg-zinc-900 p-2.5 rounded-lg border border-zinc-800 text-[10px] text-zinc-200">
                <span className="flex-1 leading-snug">{def}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveDefect(idx)}
                  className="text-red hover:underline font-bold text-[9px]"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-1.5">
            <input
              type="text"
              placeholder="Add new compliance defect (e.g., exposed wiring)..."
              value={newDefectText}
              onChange={e => setNewDefectText(e.target.value)}
              className="text-[10px] p-2 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:border-red flex-1 text-white"
            />
            <button
              type="button"
              onClick={handleAddDefect}
              className="px-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg cursor-pointer font-bold border border-zinc-700 flex items-center justify-center"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] text-zinc-400 uppercase font-bold tracking-wide">Estimated Co-Pay Cost (ZAR)</label>
            <input
              type="number"
              value={estimatedCost}
              onChange={e => setEstimatedCost(Number(e.target.value))}
              className="text-xs p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9px] text-zinc-400 uppercase font-bold tracking-wide">Audit Photo Attachment</label>
            <div className="border border-dashed border-zinc-800 rounded-lg p-2 text-center bg-zinc-900/50 hover:bg-zinc-900 transition-colors">
              {assessmentPhoto ? (
                <div className="flex items-center justify-between">
                  <span className="text-[9.5px] text-emerald-500 font-bold flex items-center gap-1">
                    <CheckSquare className="w-3.5 h-3.5" /> Photo Attached
                  </span>
                  <button type="button" onClick={() => setAssessmentPhoto(null)} className="text-[9px] text-red font-bold hover:underline">
                    Clear
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center justify-center py-1">
                  <Camera className="w-4 h-4 text-zinc-500 mb-0.5" />
                  <span className="text-[9px] text-zinc-400 font-bold">Attach Photo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[9px] text-zinc-400 uppercase font-bold tracking-wide">Inspector Survey Notes</label>
          <textarea
            placeholder="Add general surveyor notes on property security risk assessment..."
            value={assessmentNotes}
            onChange={e => setAssessmentNotes(e.target.value)}
            className="text-xs p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg h-16 resize-none text-white focus:outline-none focus:border-red"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={assessmentDefects.length === 0}
        className="w-full bg-red hover:bg-red/90 text-white font-brand-header py-3 rounded-xl shadow-xs uppercase tracking-wider cursor-pointer mt-1 disabled:opacity-50"
      >
        Upload Compliance Audit Log
      </button>
    </form>
  </div>
  );
}
