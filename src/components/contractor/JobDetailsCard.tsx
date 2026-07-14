import React, { useState } from 'react';
import { Shield, MapPin, Phone, Camera, CheckSquare, Send, Clock, Key } from 'lucide-react';
import { useAppState } from '../../contexts/AppStateContext';
import SignaturePad from './SignaturePad';
import MapPlaceholder from '../shared/MapPlaceholder';

interface JobDetailsCardProps {
  activeJob: any;
  activeContractor: any;
}

export default function JobDetailsCard({ activeJob, activeContractor }: JobDetailsCardProps) {
  const { updateJobStatus, completeJob, addAuditLogLocal } = useAppState();
  
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [signatureText, setSignatureText] = useState('');
  const [completionPhoto, setCompletionPhoto] = useState<string | null>(null);

  const handleStatusChange = async (status: 'InRoute' | 'Arrived') => {
    try {
      await updateJobStatus(activeJob.id, status);
      addAuditLogLocal('Dispatch State Shift', `Contractor updated tracking state to: ${status.toUpperCase()} for Job ${activeJob.id}.`);
    } catch (err: any) {
      alert(err.message || 'Failed to update job status');
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompletionPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCompletionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signatureText) {
      alert('Digital signature is required to complete this job card.');
      return;
    }

    try {
      await completeJob(activeJob.id, {
        contractorNotes: resolutionNotes,
        contractorSignature: signatureText,
        completionPhoto: completionPhoto || undefined,
      });
      addAuditLogLocal('Job Completed', `Contractor resolved Job Card ${activeJob.id}. Signature logged.`);
      setResolutionNotes('');
      setSignatureText('');
      setCompletionPhoto(null);
    } catch (err: any) {
      alert(err.message || 'Failed to submit completion report');
    }
  };

  return (
    <div className="bg-zinc-850 border border-zinc-800 rounded-3xl p-5 shadow-xs flex flex-col gap-4 animate-fadeIn text-zinc-300">
      <div className="border-b border-zinc-800 pb-2 flex justify-between items-center">
        <div>
          <span className="font-bold text-red tracking-wider uppercase font-brand-header text-[10px]">Active Dispatch Card</span>
          <p className="text-[9px] text-zinc-400 font-mono">Job ID: {activeJob.id}</p>
        </div>
        <span className="text-[8.5px] bg-red/10 border border-red/20 text-red font-bold px-2 py-0.5 rounded uppercase">
          {activeJob.status}
        </span>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl text-xs space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-bold text-white text-[11px]">{activeJob.customerName}</p>
            <p className="text-[9px] text-zinc-400 font-mono mt-0.5">{activeJob.customerPhone}</p>
            <p className="text-[10px] text-zinc-300 leading-snug font-medium italic mt-2">"{activeJob.description}"</p>
          </div>
          <a href={`tel:${activeJob.customerPhone}`} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white border border-zinc-700 shrink-0">
            <Phone className="w-3.5 h-3.5" />
          </a>
        </div>
        <div className="flex items-center gap-1 text-[9px] text-zinc-400 pt-2 border-t border-zinc-800">
          <MapPin className="w-3 h-3 text-red shrink-0" />
          <span className="truncate">{activeJob.customerAddress}</span>
        </div>
      </div>

      {/* MAP STATUS */}
      <MapPlaceholder 
        contractorName={activeContractor.name}
        contractorRole={activeJob.serviceType}
        trackerProgress={activeJob.trackerProgress}
        status={activeJob.status}
        customerAddress={activeJob.customerAddress}
        heightClass="h-32"
      />

      {/* TRACKING PROGRESS WORKFLOW CONTROL BUTTONS */}
      {activeJob.status === 'Assigned' && (
        <button
          type="button"
          onClick={() => handleStatusChange('InRoute')}
          className="w-full bg-red hover:bg-red/90 text-white font-brand-header text-xs py-3 rounded-xl shadow-xs uppercase tracking-wider cursor-pointer"
        >
          Confirm Departure (En Route)
        </button>
      )}

      {activeJob.status === 'InRoute' && (
        <button
          type="button"
          onClick={() => handleStatusChange('Arrived')}
          className="w-full bg-red hover:bg-red/90 text-white font-brand-header text-xs py-3 rounded-xl shadow-xs uppercase tracking-wider cursor-pointer"
        >
          Confirm Officer Arrival
        </button>
      )}

      {/* COMPLETION FORM (VISIBLE ONCE ARRIVED) */}
      {(activeJob.status === 'Arrived' || activeJob.status === 'Completed') && (
        <form onSubmit={handleCompletionSubmit} className="flex flex-col gap-3.5 border-t border-zinc-800 pt-4 animate-fadeIn">
          <div>
            <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">Assistance Completion Report</h4>
            <p className="text-[9px] text-zinc-400">Describe repairs completed and collect client/officer signature</p>
          </div>

          <textarea
            placeholder="Log details of assistance provided (e.g., re-aligned gate sensors, replaced circuit breaker module...)"
            required
            value={resolutionNotes}
            onChange={e => setResolutionNotes(e.target.value)}
            disabled={activeJob.status === 'Completed'}
            className="text-xs p-3 bg-zinc-950 border border-zinc-800 rounded-xl h-20 resize-none text-white focus:outline-none focus:border-red"
          />

          <div className="border border-dashed border-zinc-800 rounded-xl p-3 text-center relative bg-zinc-900/50 hover:bg-zinc-900 transition-colors">
            {completionPhoto ? (
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4" /> Completion Photo Logged
                </span>
                {activeJob.status !== 'Completed' && (
                  <button 
                    type="button" 
                    onClick={() => setCompletionPhoto(null)} 
                    className="text-[10px] text-red font-bold hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center justify-center py-2">
                <Camera className="w-5 h-5 text-zinc-500 mb-1" />
                <span className="text-[10px] text-zinc-400 font-bold">Attach Resolution Photo (Optional)</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handlePhotoUpload}
                  disabled={activeJob.status === 'Completed'}
                />
              </label>
            )}
          </div>

          {/* SIGNATURE PAD */}
          <SignaturePad 
            signatureText={signatureText}
            setSignatureText={setSignatureText}
          />

          <button
            type="submit"
            disabled={activeJob.status === 'Completed' || !signatureText}
            className="w-full bg-red hover:bg-red/90 disabled:opacity-50 text-white font-brand-header text-xs py-3 rounded-xl shadow-xs uppercase tracking-wider cursor-pointer"
          >
            {activeJob.status === 'Completed' ? 'REPORT DISPATCHED (AWAITING CLOSE)' : 'Dispatched Report & Sign Off'}
          </button>
        </form>
      )}
    </div>
  );
}
