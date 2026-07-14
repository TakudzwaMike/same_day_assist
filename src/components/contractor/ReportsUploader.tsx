import React, { useState } from 'react';
import { Camera, CheckSquare, Plus, Trash } from 'lucide-react';
import { useAppState } from '../../contexts/AppStateContext';

interface ReportsUploaderProps {
  activeContractor: any;
}

export default function ReportsUploader({ activeContractor }: ReportsUploaderProps) {
  const { state, uploadAssessment, addAuditLogLocal } = useAppState();

  const [assessmentNotes, setAssessmentNotes] = useState('');
  const [assessmentDefects, setAssessmentDefects] = useState<string[]>([
    'Gate automation limit-switches exposed to rain (Safety risk)',
    'Main breaker lacks functional overload leakage module (SABS Non-compliant)'
  ]);
  const [newDefectText, setNewDefectText] = useState('');
  const [estimatedCost, setEstimatedCost] = useState(1500);
  const [assessmentPhoto, setAssessmentPhoto] = useState<string | null>(null);

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

  const handleSurveySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Find active scheduled assessment assigned to this contractor
    const assessment = state.assessments.find(a => a.contractorId === activeContractor.id && a.status === 'Assessing');
    if (!assessment) {
      alert('No active assessment survey found.');
      return;
    }

    try {
      await uploadAssessment(assessment.id, {
        issuesFound: assessmentDefects,
        estimatedCost: estimatedCost,
        contractorNotes: assessmentNotes,
        photoUrl: assessmentPhoto || undefined
      });
      addAuditLogLocal('Compliance Survey Uploaded', `Surveyor uploaded safety audit for assessment ${assessment.id}.`);
    } catch (err: any) {
      alert(err.message || 'Failed to upload assessment');
    }
  };

  return (
    <form onSubmit={handleSurveySubmit} className="bg-zinc-850 p-5 rounded-3xl border border-zinc-800 flex flex-col gap-4 text-xs text-zinc-300 animate-fadeIn shadow-xs">
      <div className="border-b border-zinc-800 pb-2">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider font-brand-header">Property Defect Log</h4>
        <p className="text-[9px] text-zinc-400">Record all non-compliance issues found on premises</p>
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
  );
}
