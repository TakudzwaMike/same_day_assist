import React, { useState } from 'react';
import { 
  Shield, MapPin, Phone, Camera, Video, CheckSquare, Send, Clock, 
  Wrench, Package, Plus, Trash2, CheckCircle2, AlertCircle, FileCheck, 
  RotateCcw, Play, Check 
} from 'lucide-react';
import { useAppState } from '../../contexts/AppStateContext';
import { api } from '../../services/api';
import SignaturePad from './SignaturePad';
import MapPlaceholder from '../shared/MapPlaceholder';
import { ReplacedPart } from '../../types';

interface JobDetailsCardProps {
  activeJob: any;
  activeContractor: any;
}

const COMMON_PART_SUGGESTIONS = [
  'Gate Wheels (Pair 80mm)',
  '12V 7Ah Backup Battery',
  'Centurion D5 Drive Pinion',
  'Safety Anti-Crush Beams',
  'Nylon Gear Rack (1m)',
  'Limit Switch Assembly',
  'Remote Transmitter 433MHz',
  'Transformer / Power Pack',
  'Roller Bearings Set',
  'Electric Lock / Solenoid'
];

export default function JobDetailsCard({ activeJob, activeContractor }: JobDetailsCardProps) {
  const { updateJobStatus, completeJob, addAuditLogLocal } = useAppState();
  
  // Compulsory Form States
  const [resolutionNotes, setResolutionNotes] = useState(activeJob.contractorNotes || '');
  const [signatureText, setSignatureText] = useState(activeJob.contractorSignature || '');
  
  // Before Media (Photo or Video clip)
  const [photoBeforeUrl, setPhotoBeforeUrl] = useState<string | null>(activeJob.photoBeforeUrl || null);
  const [videoBeforeUrl, setVideoBeforeUrl] = useState<string | null>(activeJob.videoBeforeUrl || null);
  
  // After Media (Photo or Video clip)
  const [photoAfterUrl, setPhotoAfterUrl] = useState<string | null>(activeJob.photoAfterUrl || activeJob.completionPhoto || null);
  const [videoAfterUrl, setVideoAfterUrl] = useState<string | null>(activeJob.videoAfterUrl || null);

  // Exchanged / Replaced Parts
  const initialParts: ReplacedPart[] = (() => {
    if (activeJob.partsReplaced) {
      if (Array.isArray(activeJob.partsReplaced)) return activeJob.partsReplaced;
      try {
        const parsed = JSON.parse(activeJob.partsReplaced);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return [];
      }
    }
    return [];
  })();

  const [partsList, setPartsList] = useState<ReplacedPart[]>(initialParts);
  const [newPartName, setNewPartName] = useState('');
  const [newPartQty, setNewPartQty] = useState(1);
  const [newPartNotes, setNewPartNotes] = useState('');
  const [noPartsExchanged, setNoPartsExchanged] = useState(
    initialParts.length === 0 && (activeJob.partsReplaced === 'LABOUR_ONLY' || typeof activeJob.partsReplaced === 'string')
  );

  const [isUploadingBefore, setIsUploadingBefore] = useState(false);
  const [isUploadingAfter, setIsUploadingAfter] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isCompleted = activeJob.status === 'Completed' || activeJob.status === 'Work Completed' || activeJob.status === 'Service Completed';

  const handleStatusChange = async (status: 'InRoute' | 'Arrived') => {
    try {
      await updateJobStatus(activeJob.id, status);
      addAuditLogLocal('Dispatch State Shift', `Contractor updated tracking state to: ${status.toUpperCase()} for Job ${activeJob.id}.`);
    } catch (err: any) {
      alert(err.message || 'Failed to update job status');
    }
  };

  // Upload or read file (Supports both images and video clips)
  const handleMediaUpload = async (
    e: React.ChangeEvent<HTMLInputElement>, 
    target: 'before' | 'after'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const setLoading = target === 'before' ? setIsUploadingBefore : setIsUploadingAfter;

    setLoading(true);
    try {
      // Attempt backend upload first via multipart
      try {
        const res = await api.uploadFile(file, { jobId: activeJob.id });
        if (res?.url) {
          if (target === 'before') {
            if (isVideo) {
              setVideoBeforeUrl(res.url);
              setPhotoBeforeUrl(null);
            } else {
              setPhotoBeforeUrl(res.url);
              setVideoBeforeUrl(null);
            }
          } else {
            if (isVideo) {
              setVideoAfterUrl(res.url);
              setPhotoAfterUrl(null);
            } else {
              setPhotoAfterUrl(res.url);
              setVideoAfterUrl(null);
            }
          }
          return;
        }
      } catch (uploadErr) {
        console.warn('[JobDetailsCard] File upload API fallback to DataURL:', uploadErr);
      }

      // Fallback to FileReader dataURL (guaranteed client preview & persistence)
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        if (target === 'before') {
          if (isVideo) {
            setVideoBeforeUrl(dataUrl);
            setPhotoBeforeUrl(null);
          } else {
            setPhotoBeforeUrl(dataUrl);
            setVideoBeforeUrl(null);
          }
        } else {
          if (isVideo) {
            setVideoAfterUrl(dataUrl);
            setPhotoAfterUrl(null);
          } else {
            setPhotoAfterUrl(dataUrl);
            setVideoAfterUrl(null);
          }
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setLoading(false);
    }
  };

  // Parts List Management
  const handleAddPart = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newPartName.trim()) return;

    const newPart: ReplacedPart = {
      id: `part-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: newPartName.trim(),
      quantity: Math.max(1, Number(newPartQty) || 1),
      notes: newPartNotes.trim() || undefined,
    };

    setPartsList(prev => [...prev, newPart]);
    setNewPartName('');
    setNewPartQty(1);
    setNewPartNotes('');
    setNoPartsExchanged(false);
  };

  const handleRemovePart = (indexToRemove: number) => {
    setPartsList(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleQuickAddSuggestion = (suggestion: string) => {
    setNewPartName(suggestion);
  };

  // Compulsory Checklist Verification
  const hasBeforeEvidence = Boolean(photoBeforeUrl || videoBeforeUrl);
  const hasRepairsLog = Boolean(resolutionNotes.trim().length >= 10);
  const hasPartsLog = Boolean(partsList.length > 0 || noPartsExchanged);
  const hasAfterEvidence = Boolean(photoAfterUrl || videoAfterUrl);
  const hasSignature = Boolean(signatureText.trim().length > 0);

  const allCompulsoryMet = hasBeforeEvidence && hasRepairsLog && hasPartsLog && hasAfterEvidence && hasSignature;

  const handleCompletionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!hasBeforeEvidence) {
      setSubmitError('MANDATORY: Before photo or video clip showing what needed to be done is required.');
      return;
    }
    if (!hasRepairsLog) {
      setSubmitError('MANDATORY: Please log details and explanation of the repairs performed (at least 10 characters).');
      return;
    }
    if (!hasPartsLog) {
      setSubmitError('MANDATORY: Please log the parts exchanged/replaced or explicitly confirm Labour Only / No Parts.');
      return;
    }
    if (!hasAfterEvidence) {
      setSubmitError('MANDATORY: After photo or video clip showing the repaired/working state is required.');
      return;
    }
    if (!hasSignature) {
      setSubmitError('MANDATORY: Technician digital signature is required to sign off the job card.');
      return;
    }

    setIsSubmitting(true);
    try {
      const partsPayload = noPartsExchanged && partsList.length === 0 
        ? [{ name: 'LABOUR / SERVICING ONLY (No parts exchanged)', quantity: 1, notes: 'System tuned, lubricated or recalibrated without hardware replacement' }]
        : partsList;

      await completeJob(activeJob.id, {
        contractorNotes: resolutionNotes,
        contractorSignature: signatureText,
        photoBeforeUrl: photoBeforeUrl || undefined,
        videoBeforeUrl: videoBeforeUrl || undefined,
        photoAfterUrl: photoAfterUrl || undefined,
        videoAfterUrl: videoAfterUrl || undefined,
        completionPhoto: photoAfterUrl || undefined,
        partsReplaced: partsPayload,
      });

      addAuditLogLocal(
        'Job Completed & Verified',
        `Contractor completed Job ${activeJob.id}. Before evidence: ${videoBeforeUrl ? 'Video' : 'Photo'}, After evidence: ${videoAfterUrl ? 'Video' : 'Photo'}, Parts replaced: ${partsPayload.length}. Signature recorded.`
      );
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit completion report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-zinc-850 border border-zinc-800 rounded-3xl p-5 shadow-xl flex flex-col gap-4 animate-fadeIn text-zinc-300">
      {/* HEADER BAR */}
      <div className="border-b border-zinc-800 pb-3 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-red tracking-wider uppercase font-brand-header text-[10px]">
              Active Dispatch Card
            </span>
            <span className="bg-red/10 border border-red/30 text-red text-[8.5px] font-mono px-2 py-0.5 rounded-full font-bold uppercase">
              Mandatory Evidence Protocol
            </span>
          </div>
          <p className="text-[9px] text-zinc-400 font-mono mt-0.5">Job ID: {activeJob.id}</p>
        </div>
        <span className={`text-[8.5px] border font-bold px-2 py-0.5 rounded uppercase ${
          isCompleted 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
            : 'bg-red/10 border-red/20 text-red'
        }`}>
          {activeJob.status}
        </span>
      </div>

      {/* CUSTOMER & DISPATCH SUMMARY */}
      <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl text-xs space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-bold text-white text-[11px]">{activeJob.customerName}</p>
            <p className="text-[9px] text-zinc-400 font-mono mt-0.5">{activeJob.customerPhone}</p>
            <p className="text-[10px] text-zinc-300 leading-snug font-medium italic mt-2">
              "{activeJob.description}"
            </p>
          </div>
          <a 
            href={`tel:${activeJob.customerPhone}`} 
            className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white border border-zinc-700 shrink-0"
            title="Call Client"
          >
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
          className="w-full bg-red hover:bg-red/90 text-white font-brand-header text-xs py-3 rounded-xl shadow-xs uppercase tracking-wider cursor-pointer font-bold"
        >
          Confirm Departure (En Route)
        </button>
      )}

      {activeJob.status === 'InRoute' && (
        <button
          type="button"
          onClick={() => handleStatusChange('Arrived')}
          className="w-full bg-red hover:bg-red/90 text-white font-brand-header text-xs py-3 rounded-xl shadow-xs uppercase tracking-wider cursor-pointer font-bold"
        >
          Confirm Officer Arrival On Site
        </button>
      )}

      {/* COMPULSORY COMPLETION & HANDOVER WORKFLOW (VISIBLE ONCE ARRIVED OR COMPLETED) */}
      {(activeJob.status === 'Arrived' || isCompleted) && (
        <form onSubmit={handleCompletionSubmit} className="flex flex-col gap-4 border-t border-zinc-800 pt-4 animate-fadeIn">
          {/* PROTOCOL INSTRUCTION BANNER */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 bg-red text-white rounded-lg shrink-0 mt-0.5 shadow-sm">
                <FileCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[11px] font-bold text-white uppercase tracking-wider font-brand-header">
                  Compulsory Handover Protocol
                </h4>
                <p className="text-[9.5px] text-zinc-300 mt-1 leading-relaxed">
                  Before signing off this job, service providers <strong className="text-white">MUST</strong> record verifiable photographic/video evidence:
                </p>
                <div className="grid grid-cols-2 gap-1.5 mt-2 text-[9px] font-mono">
                  <div className="flex items-center gap-1.5 text-zinc-300">
                    <span className={`w-2 h-2 rounded-full ${hasBeforeEvidence ? 'bg-emerald-400' : 'bg-red'}`} />
                    <span>1. Before Picture or Video Clip</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-300">
                    <span className={`w-2 h-2 rounded-full ${hasRepairsLog ? 'bg-emerald-400' : 'bg-red'}`} />
                    <span>2. Repairs Explanation</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-300">
                    <span className={`w-2 h-2 rounded-full ${hasPartsLog ? 'bg-emerald-400' : 'bg-red'}`} />
                    <span>3. Exchanged Parts Log</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-300">
                    <span className={`w-2 h-2 rounded-full ${hasAfterEvidence ? 'bg-emerald-400' : 'bg-red'}`} />
                    <span>4. After Picture or Video Clip</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 1: BEFORE WORK EVIDENCE (PHOTO OR VIDEO CLIP) */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-red text-white flex items-center justify-center text-[10px] font-bold">1</span>
                <div>
                  <h5 className="text-[11px] font-bold text-white uppercase tracking-wider">
                    Before Repair Media <span className="text-red font-mono text-[9px]">(COMPULSORY)</span>
                  </h5>
                  <p className="text-[9px] text-zinc-400">
                    Record a small clip or picture showing the issue / gate not working before repair starts
                  </p>
                </div>
              </div>
              <span className={`text-[8.5px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                hasBeforeEvidence ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red/20 text-red border border-red/30'
              }`}>
                {hasBeforeEvidence ? '✓ Provided' : 'Required'}
              </span>
            </div>

            {/* Live Media Preview or Upload Box */}
            {hasBeforeEvidence ? (
              <div className="relative rounded-xl overflow-hidden border border-zinc-700 bg-black">
                {videoBeforeUrl ? (
                  <div className="space-y-1">
                    <video 
                      src={videoBeforeUrl} 
                      controls 
                      className="w-full max-h-52 object-contain bg-black" 
                    />
                    <div className="p-2 bg-zinc-950 flex items-center justify-between text-[10px]">
                      <span className="text-amber-400 font-mono font-bold flex items-center gap-1">
                        <Video className="w-3.5 h-3.5" /> Before Video Clip (Defect Logged)
                      </span>
                      {!isCompleted && (
                        <button 
                          type="button" 
                          onClick={() => setVideoBeforeUrl(null)} 
                          className="text-red hover:underline font-bold text-[9px] cursor-pointer"
                        >
                          Replace Video
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <img 
                      src={photoBeforeUrl!} 
                      alt="Before Repair Proof" 
                      className="w-full max-h-52 object-cover" 
                    />
                    <div className="p-2 bg-zinc-950 flex items-center justify-between text-[10px]">
                      <span className="text-amber-400 font-mono font-bold flex items-center gap-1">
                        <Camera className="w-3.5 h-3.5" /> Before Photo (Defect Logged)
                      </span>
                      {!isCompleted && (
                        <button 
                          type="button" 
                          onClick={() => setPhotoBeforeUrl(null)} 
                          className="text-red hover:underline font-bold text-[9px] cursor-pointer"
                        >
                          Replace Photo
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="border border-dashed border-zinc-700 hover:border-red rounded-xl p-4 text-center bg-zinc-950/60 transition-colors">
                {isUploadingBefore ? (
                  <div className="flex flex-col items-center justify-center py-3 gap-2">
                    <Clock className="w-5 h-5 text-red animate-spin" />
                    <span className="text-[10px] text-zinc-300 font-mono">Uploading Before Media...</span>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <label className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold border border-zinc-700 transition-colors">
                      <Camera className="w-4 h-4 text-red" />
                      <span>Take / Upload Photo</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        capture="environment"
                        onChange={e => handleMediaUpload(e, 'before')} 
                        disabled={isCompleted}
                      />
                    </label>

                    <label className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-red hover:bg-red/90 text-white rounded-xl text-xs font-bold shadow-md transition-colors">
                      <Video className="w-4 h-4 text-white" />
                      <span>Record / Upload Video Clip</span>
                      <input 
                        type="file" 
                        accept="video/*" 
                        className="hidden" 
                        capture="environment"
                        onChange={e => handleMediaUpload(e, 'before')} 
                        disabled={isCompleted}
                      />
                    </label>
                  </div>
                )}
                <p className="text-[9px] text-zinc-500 mt-2 font-mono">
                  Upload initial photo or 5-15 sec video clip of the defect (e.g. gate motor stalled, broken rack, off track)
                </p>
              </div>
            )}
          </div>

          {/* STEP 2: REPAIRS PERFORMED & WORK LOG */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-red text-white flex items-center justify-center text-[10px] font-bold">2</span>
                <div>
                  <h5 className="text-[11px] font-bold text-white uppercase tracking-wider">
                    Log Repairs Completed <span className="text-red font-mono text-[9px]">(COMPULSORY)</span>
                  </h5>
                  <p className="text-[9px] text-zinc-400">
                    Detailed summary of what needed to be done and the exact work performed
                  </p>
                </div>
              </div>
              <span className={`text-[8.5px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                hasRepairsLog ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red/20 text-red border border-red/30'
              }`}>
                {hasRepairsLog ? '✓ Logged' : 'Required'}
              </span>
            </div>

            <textarea
              placeholder="e.g., Gate motor stuck and making grinding noise. Disassembled housing, replaced stripped drive wheels and worn nylon rack. Re-aligned anti-crush safety beams, lubricated track, and conducted 5 full open/close cycle tests."
              required
              value={resolutionNotes}
              onChange={e => setResolutionNotes(e.target.value)}
              disabled={isCompleted}
              rows={3}
              className="w-full text-xs p-3 bg-zinc-950 border border-zinc-800 rounded-xl resize-none text-white focus:outline-none focus:border-red"
            />

            {/* Quick helper chips for common repair notes */}
            {!isCompleted && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[9px] text-zinc-500 self-center">Quick Add:</span>
                {[
                  'Gate wheels replaced & track lubricated',
                  '12V battery replaced & load tested',
                  'Safety sensors realigned',
                  'Controller limit switch calibrated'
                ].map(noteSnippet => (
                  <button
                    key={noteSnippet}
                    type="button"
                    onClick={() => setResolutionNotes(prev => prev ? `${prev}. ${noteSnippet}` : noteSnippet)}
                    className="text-[9px] px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded border border-zinc-700 cursor-pointer"
                  >
                    + {noteSnippet}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* STEP 3: EXCHANGED & REPLACED PARTS LOGGER */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-red text-white flex items-center justify-center text-[10px] font-bold">3</span>
                <div>
                  <h5 className="text-[11px] font-bold text-white uppercase tracking-wider">
                    Log Exchanged / Replaced Parts <span className="text-red font-mono text-[9px]">(COMPULSORY)</span>
                  </h5>
                  <p className="text-[9px] text-zinc-400">
                    Log all spare parts installed (e.g. gate wheels, batteries, pinion gear)
                  </p>
                </div>
              </div>
              <span className={`text-[8.5px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                hasPartsLog ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red/20 text-red border border-red/30'
              }`}>
                {hasPartsLog ? `${partsList.length} Item(s)` : 'Required'}
              </span>
            </div>

            {/* Existing Logged Parts List */}
            {partsList.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[9px] uppercase font-mono text-zinc-400 block font-bold">
                  Logged Replacement Parts:
                </span>
                <div className="divide-y divide-zinc-800 bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden">
                  {partsList.map((part, idx) => (
                    <div key={part.id || idx} className="p-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Package className="w-3.5 h-3.5 text-red shrink-0" />
                        <div>
                          <p className="font-bold text-white text-[11px]">
                            {part.name} <span className="text-red font-mono text-[10px] font-bold">× {part.quantity}</span>
                          </p>
                          {part.notes && <p className="text-[9px] text-zinc-400 font-mono">{part.notes}</p>}
                        </div>
                      </div>
                      {!isCompleted && (
                        <button
                          type="button"
                          onClick={() => handleRemovePart(idx)}
                          className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-red rounded cursor-pointer"
                          title="Remove part"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Input Form to Add Part */}
            {!isCompleted && (
              <div className="space-y-2 bg-zinc-950/70 p-3 rounded-xl border border-zinc-800">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-6">
                    <label className="text-[9px] text-zinc-400 block mb-1 font-mono uppercase">Part / Component Name</label>
                    <input 
                      type="text"
                      placeholder="e.g. Gate Wheels (Pair 80mm)"
                      value={newPartName}
                      onChange={e => setNewPartName(e.target.value)}
                      className="w-full text-xs p-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-red"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[9px] text-zinc-400 block mb-1 font-mono uppercase">Qty</label>
                    <input 
                      type="number"
                      min={1}
                      max={99}
                      value={newPartQty}
                      onChange={e => setNewPartQty(parseInt(e.target.value) || 1)}
                      className="w-full text-xs p-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-center focus:outline-none focus:border-red"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="text-[9px] text-zinc-400 block mb-1 font-mono uppercase">Reason / Notes</label>
                    <input 
                      type="text"
                      placeholder="e.g. Seized bearing"
                      value={newPartNotes}
                      onChange={e => setNewPartNotes(e.target.value)}
                      className="w-full text-xs p-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-red"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  {/* Common part shortcut suggestions */}
                  <div className="flex items-center gap-1 overflow-x-auto max-w-[70%] py-1">
                    <span className="text-[8.5px] text-zinc-500 shrink-0 font-mono">Suggestions:</span>
                    {COMMON_PART_SUGGESTIONS.slice(0, 4).map(suggestion => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => handleQuickAddSuggestion(suggestion)}
                        className="text-[8.5px] px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded border border-zinc-700 shrink-0 cursor-pointer"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddPart()}
                    disabled={!newPartName.trim()}
                    className="px-3 py-1.5 bg-red hover:bg-red/90 disabled:opacity-50 text-white text-[10px] font-bold rounded-lg uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Part
                  </button>
                </div>

                {/* Explicit Labour Only / No Parts Toggle */}
                <div className="pt-2 border-t border-zinc-800/80 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="noPartsExchanged"
                    checked={noPartsExchanged}
                    onChange={e => {
                      setNoPartsExchanged(e.target.checked);
                      if (e.target.checked) setPartsList([]);
                    }}
                    className="w-3.5 h-3.5 rounded bg-zinc-900 border-zinc-700 text-red focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="noPartsExchanged" className="text-[10px] text-zinc-300 cursor-pointer select-none">
                    No physical parts exchanged (labour, alignment, track cleaning, or electronic recalibration only)
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* STEP 4: AFTER WORK EVIDENCE (PHOTO OR VIDEO CLIP OF WORKING STATE) */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-red text-white flex items-center justify-center text-[10px] font-bold">4</span>
                <div>
                  <h5 className="text-[11px] font-bold text-white uppercase tracking-wider">
                    After Repair Media <span className="text-red font-mono text-[9px]">(COMPULSORY)</span>
                  </h5>
                  <p className="text-[9px] text-zinc-400">
                    Record a small clip or picture showing the repaired gate/system in full working condition
                  </p>
                </div>
              </div>
              <span className={`text-[8.5px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                hasAfterEvidence ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red/20 text-red border border-red/30'
              }`}>
                {hasAfterEvidence ? '✓ Provided' : 'Required'}
              </span>
            </div>

            {/* Live Media Preview or Upload Box */}
            {hasAfterEvidence ? (
              <div className="relative rounded-xl overflow-hidden border border-zinc-700 bg-black">
                {videoAfterUrl ? (
                  <div className="space-y-1">
                    <video 
                      src={videoAfterUrl} 
                      controls 
                      className="w-full max-h-52 object-contain bg-black" 
                    />
                    <div className="p-2 bg-zinc-950 flex items-center justify-between text-[10px]">
                      <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                        <Video className="w-3.5 h-3.5" /> After Video Clip (Operational Proof)
                      </span>
                      {!isCompleted && (
                        <button 
                          type="button" 
                          onClick={() => setVideoAfterUrl(null)} 
                          className="text-red hover:underline font-bold text-[9px] cursor-pointer"
                        >
                          Replace Video
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <img 
                      src={photoAfterUrl!} 
                      alt="After Repair Proof" 
                      className="w-full max-h-52 object-cover" 
                    />
                    <div className="p-2 bg-zinc-950 flex items-center justify-between text-[10px]">
                      <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                        <Camera className="w-3.5 h-3.5" /> After Photo (Repaired State)
                      </span>
                      {!isCompleted && (
                        <button 
                          type="button" 
                          onClick={() => setPhotoAfterUrl(null)} 
                          className="text-red hover:underline font-bold text-[9px] cursor-pointer"
                        >
                          Replace Photo
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="border border-dashed border-zinc-700 hover:border-red rounded-xl p-4 text-center bg-zinc-950/60 transition-colors">
                {isUploadingAfter ? (
                  <div className="flex flex-col items-center justify-center py-3 gap-2">
                    <Clock className="w-5 h-5 text-red animate-spin" />
                    <span className="text-[10px] text-zinc-300 font-mono">Uploading After Media...</span>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <label className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold border border-zinc-700 transition-colors">
                      <Camera className="w-4 h-4 text-emerald-400" />
                      <span>Take / Upload Working Photo</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        capture="environment"
                        onChange={e => handleMediaUpload(e, 'after')} 
                        disabled={isCompleted}
                      />
                    </label>

                    <label className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors">
                      <Video className="w-4 h-4 text-white" />
                      <span>Record / Upload Working Video</span>
                      <input 
                        type="file" 
                        accept="video/*" 
                        className="hidden" 
                        capture="environment"
                        onChange={e => handleMediaUpload(e, 'after')} 
                        disabled={isCompleted}
                      />
                    </label>
                  </div>
                )}
                <p className="text-[9px] text-zinc-500 mt-2 font-mono">
                  Upload photo or 5-15 sec video clip of the gate motor operating smoothly in both directions
                </p>
              </div>
            )}
          </div>

          {/* STEP 5: DIGITAL SIGNATURE PAD */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-red text-white flex items-center justify-center text-[10px] font-bold">5</span>
                <div>
                  <h5 className="text-[11px] font-bold text-white uppercase tracking-wider">
                    Officer / Technician Sign-Off <span className="text-red font-mono text-[9px]">(COMPULSORY)</span>
                  </h5>
                  <p className="text-[9px] text-zinc-400">
                    Sign digitally to certify repair work, parts exchanged, and verified test operation
                  </p>
                </div>
              </div>
              <span className={`text-[8.5px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                hasSignature ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red/20 text-red border border-red/30'
              }`}>
                {hasSignature ? '✓ Signed' : 'Required'}
              </span>
            </div>

            <SignaturePad 
              signatureText={signatureText}
              setSignatureText={setSignatureText}
            />
          </div>

          {/* ERROR ALERT IF SUBMISSION FAILS */}
          {submitError && (
            <div className="p-3 rounded-xl bg-red/10 border border-red/30 text-red flex items-start gap-2 text-xs">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* COMPULSORY REQUIREMENTS STATUS CARD */}
          {!isCompleted && (
            <div className={`p-3 rounded-xl border text-[10px] transition-colors ${
              allCompulsoryMet 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                : 'bg-zinc-900 border-zinc-800 text-zinc-400'
            }`}>
              <div className="flex items-center justify-between font-bold mb-1.5 font-mono uppercase">
                <span>Compulsory Sign-Off Readiness:</span>
                <span className={allCompulsoryMet ? 'text-emerald-400' : 'text-red'}>
                  {allCompulsoryMet ? '100% Ready' : 'Requirements Incomplete'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[9.5px]">
                <div className="flex items-center gap-1.5">
                  {hasBeforeEvidence ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <span className="w-3.5 h-3.5 text-red font-bold">✕</span>}
                  <span className={hasBeforeEvidence ? 'text-zinc-200' : 'text-zinc-500'}>1. Before Defect Media</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {hasRepairsLog ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <span className="w-3.5 h-3.5 text-red font-bold">✕</span>}
                  <span className={hasRepairsLog ? 'text-zinc-200' : 'text-zinc-500'}>2. Work Done Explanation</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {hasPartsLog ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <span className="w-3.5 h-3.5 text-red font-bold">✕</span>}
                  <span className={hasPartsLog ? 'text-zinc-200' : 'text-zinc-500'}>3. Exchanged Parts Log</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {hasAfterEvidence ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <span className="w-3.5 h-3.5 text-red font-bold">✕</span>}
                  <span className={hasAfterEvidence ? 'text-zinc-200' : 'text-zinc-500'}>4. After Working Media</span>
                </div>
                <div className="flex items-center gap-1.5 sm:col-span-2">
                  {hasSignature ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <span className="w-3.5 h-3.5 text-red font-bold">✕</span>}
                  <span className={hasSignature ? 'text-zinc-200' : 'text-zinc-500'}>5. Technician Digital Signature</span>
                </div>
              </div>
            </div>
          )}

          {/* FINAL SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={isCompleted || !allCompulsoryMet || isSubmitting}
            className={`w-full font-brand-header text-xs py-3.5 rounded-xl shadow-lg uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-2 ${
              isCompleted
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : allCompulsoryMet
                ? 'bg-gradient-to-r from-red to-red/90 hover:from-red/90 hover:to-red text-white cursor-pointer shadow-red/20'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-60'
            }`}
          >
            {isSubmitting ? (
              <>
                <Clock className="w-4 h-4 animate-spin" />
                <span>Verifying Evidence & Submitting Handover...</span>
              </>
            ) : isCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Handover Verified & Job Signed Off</span>
              </>
            ) : allCompulsoryMet ? (
              <>
                <FileCheck className="w-4 h-4" />
                <span>Submit Evidence & Complete Job Sign-Off</span>
              </>
            ) : (
              <span>Upload Before/After Media & Log Parts To Complete</span>
            )}
          </button>
        </form>
      )}
    </div>
  );
}

