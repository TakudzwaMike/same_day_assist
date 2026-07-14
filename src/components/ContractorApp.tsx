import React, { useState, useRef } from 'react';
import { 
  Wrench, MapPin, Navigation, Camera, CheckSquare, Clock, Shield, 
  ThumbsUp, User, Phone, CheckCircle, Upload, AlertCircle, RefreshCw, Key
} from 'lucide-react';
import { AppState, Job, Assessment, ServiceCategory } from '../types';

interface ContractorAppProps {
  state: AppState;
  updateState: (newState: Partial<AppState>) => void;
  addAuditLog: (action: string, details: string) => void;
}

export default function ContractorApp({ state, updateState, addAuditLog }: ContractorAppProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [assessmentNotes, setAssessmentNotes] = useState('');
  const [assessmentDefects, setAssessmentDefects] = useState<string[]>([
    'Gate automation limit-switches exposed to rain (Safety risk)',
    'Main breaker lacks functional overload leakage module (SABS Non-compliant)'
  ]);
  const [newDefectText, setNewDefectText] = useState('');
  const [estimatedCost, setEstimatedCost] = useState(1500);
  const [assessmentPhoto, setAssessmentPhoto] = useState<string | null>(null);

  // Resolution States
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [signatureText, setSignatureText] = useState('');
  const [completionPhoto, setCompletionPhoto] = useState<string | null>(null);
  const [isSignatureTyped, setIsSignatureTyped] = useState(true);

  // Helper: Find current active contractor (using Sarah or Sipho context)
  const activeContractor = state.contractors[0]; // Sipho Ndlovu is our default agent

  // Helper: Find assigned assessment or active job card
  const pendingAssessment = state.currentStep === 'ASSESSMENT_SCHEDULED' || state.currentStep === 'CONTRACTOR_ASSESSING';
  const activeJob = state.jobs.find(j => j.status !== 'Closed' && j.status !== 'Rated');

  // Trigger: start assessing the customer property
  const handleStartAssessing = () => {
    updateState({ currentStep: 'CONTRACTOR_ASSESSING' });
    addAuditLog('Compliance Survey Started', `Contractor ${activeContractor.name} arrived at property and commenced the safety compliance assessment.`);
  };

  // Trigger: Upload compliance assessment
  const handleUploadAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create actual Assessment record in database
    const matchingEnquiry = state.enquiries.find(enq => enq.status === 'Pending' || enq.status === 'Scheduled') || state.enquiries[0];
    
    const newAssessment: Assessment = {
      id: `ass-${Date.now().toString().slice(-3)}`,
      enquiryId: matchingEnquiry?.id || 'ENQ-MOCK',
      contractorId: activeContractor.id,
      scheduledAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      issuesFound: assessmentDefects,
      photoUrl: assessmentPhoto || undefined,
      estimatedCost: estimatedCost,
      status: 'Uploaded',
      contractorNotes: assessmentNotes
    };

    // Auto-generate the corresponding pre-compliance Quotation for approval
    const newQuote = {
      id: `qte-${Date.now().toString().slice(-3)}`,
      enquiryId: matchingEnquiry?.id || 'ENQ-MOCK',
      amount: estimatedCost,
      lineItems: assessmentDefects.map((def, idx) => ({
        id: `li-${idx}`,
        description: def,
        cost: Math.round(estimatedCost / assessmentDefects.length)
      })),
      status: 'Pending' as const,
      createdAt: new Date().toISOString()
    };

    updateState({
      assessments: [newAssessment, ...state.assessments],
      quotations: [newQuote, ...state.quotations],
      currentStep: 'ASSESSMENT_UPLOADED'
    });

    addAuditLog('Compliance Survey Uploaded', `Contractor ${activeContractor.name} completed assessment and uploaded ${assessmentDefects.length} defects requiring ZAR R${estimatedCost} in pre-membership repairs.`);
  };

  // Add assessment defect helper
  const handleAddDefect = () => {
    if (newDefectText) {
      setAssessmentDefects([...assessmentDefects, newDefectText]);
      setNewDefectText('');
    }
  };

  // Complete pre-compliance repairs helper
  const handleCompletePreRepairs = () => {
    updateState({ currentStep: 'REPAIRS_COMPLETED' });
    addAuditLog('Pre-Compliance Repairs Completed', `Contractor completed gate & breaker compliance upgrades on premises. Safe to activate membership!`);
  };

  // Live Dispatch Tracker state changes
  const handleUpdateJobStatus = (status: 'InRoute' | 'Arrived') => {
    if (!activeJob) return;

    const progress = status === 'InRoute' ? 50 : 80;
    const updatedJobs = state.jobs.map(j => 
      j.id === activeJob.id ? { ...j, status, trackerProgress: progress } : j
    );

    updateState({
      jobs: updatedJobs,
      currentStep: 'LIVE_JOB_UPDATES'
    });

    addAuditLog('Dispatch State Shift', `Contractor ${activeContractor.name} shifted tracking state to: ${status.toUpperCase()} for Customer ${activeJob.customerName}.`);
  };

  // Submit completion report
  const handleCompleteJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeJob) return;

    if (!signatureText) {
      alert('Please sign the completion report.');
      return;
    }

    const updatedJobs = state.jobs.map(j => 
      j.id === activeJob.id ? { 
        ...j, 
        status: 'Completed' as const, 
        trackerProgress: 100,
        completedAt: new Date().toISOString(),
        contractorNotes: resolutionNotes,
        contractorSignature: signatureText,
        completionPhoto: completionPhoto || undefined
      } : j
    );

    updateState({
      jobs: updatedJobs,
      currentStep: 'COMPLETION_REPORT'
    });

    addAuditLog('Job Completed', `Contractor ${activeContractor.name} resolved Job Card ${activeJob.id}. Resolution notes uploaded, digital signature logged.`);
    setResolutionNotes('');
    setSignatureText('');
    setCompletionPhoto(null);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full bg-zinc-950 border border-zinc-800 rounded-3xl shadow-lg flex flex-col overflow-hidden animate-fadeIn text-zinc-100">
      {/* Field App Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-red p-2 rounded-xl text-white">
            <Wrench className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black italic text-white leading-none uppercase">Same Day Assist</h1>
            <p className="text-[10px] font-mono tracking-wider text-red font-bold uppercase font-brand-sub">Contractor Service Pro • Field Terminal</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-zinc-400 uppercase">Status:</span>
            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${isOnline ? 'bg-green-950 text-green-400 border border-green-800' : 'bg-red-950 text-red-400'}`}>
              {isOnline ? 'ONLINE & DISPATCHABLE' : 'OFFLINE'}
            </span>
          </div>
          <button 
            type="button"
            onClick={() => setIsOnline(!isOnline)} 
            className="text-[10px] bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-xl text-zinc-300 font-mono transition-colors"
          >
            Toggle Mode
          </button>
        </div>
      </div>

      <div className="p-6 md:p-8 flex-1 bg-zinc-900/40">
        <div className="max-w-4xl mx-auto flex flex-col gap-6">

            {/* Contractor Welcome Bar */}
            <div className="bg-zinc-800 p-3 rounded-xl flex items-center justify-between shadow">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-red text-white flex items-center justify-center font-brand-header text-sm">
                  SN
                </div>
                <div>
                  <p className="text-xs font-bold">{activeContractor.name}</p>
                  <p className="text-[9px] font-mono text-zinc-400">{activeContractor.specialty} Specialist • ★ {activeContractor.rating}</p>
                </div>
              </div>
            </div>

            {/* CASE 1: PRE-MEMBERSHIP ASSESSMENT SCHEDULED */}
            {pendingAssessment && (
              <div className="flex flex-col gap-3 animate-fadeIn">
                <div className="bg-amber-950/40 border border-amber-900 text-amber-300 p-3 rounded-xl flex items-start gap-2 text-xs">
                  <Clock className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold uppercase font-brand-header text-xs">Pre-Compliance Survey</span>
                    <p className="text-[10px] text-zinc-300 mt-1">
                      You are assigned to assess the premises for compliance before active service onboarding.
                    </p>
                  </div>
                </div>

                {state.currentStep === 'ASSESSMENT_SCHEDULED' ? (
                  <div className="bg-zinc-800 p-4 rounded-xl border border-zinc-700 text-center">
                    <p className="text-xs font-mono text-zinc-300 mb-3">Arrived at Western Sandton address?</p>
                    <button
                      onClick={handleStartAssessing}
                      className="w-full bg-red hover:bg-red/90 text-white font-brand-header text-xs py-2.5 rounded-lg shadow"
                    >
                      BEGIN PHYSICAL COMPLIANCE SURVEY
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleUploadAssessment} className="bg-zinc-800 p-3.5 rounded-xl border border-zinc-700 flex flex-col gap-3 text-xs text-zinc-300">
                    <div className="border-b border-zinc-700 pb-1.5 flex justify-between items-center">
                      <span className="font-bold text-red tracking-wider uppercase font-brand-header">compliance log</span>
                      <span className="text-[8px] font-mono bg-zinc-700 px-1.5 py-0.5 rounded text-zinc-300">STAGE 1</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-zinc-400 uppercase font-bold">Identified Property Defects (Must Resolve)</label>
                        <div className="space-y-1.5">
                          {assessmentDefects.map((def, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 bg-zinc-900 p-1.5 rounded border border-zinc-800 text-[10px] text-zinc-200">
                              <span className="text-red font-bold">[{idx + 1}]</span>
                              <p className="flex-1 leading-tight">{def}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Add Defect */}
                      <div className="flex gap-1">
                        <input 
                          type="text" 
                          placeholder="Log custom gate/wiring defect..."
                          value={newDefectText}
                          onChange={e => setNewDefectText(e.target.value)}
                          className="flex-1 text-[10px] p-1.5 bg-zinc-900 border border-zinc-700 rounded-md focus:outline-none focus:border-red"
                        />
                        <button 
                          type="button" 
                          onClick={handleAddDefect}
                          className="bg-zinc-700 text-white px-2 py-1.5 rounded-md font-bold hover:bg-zinc-600 text-[10px]"
                        >
                          + Log
                        </button>
                      </div>

                      {/* Cost estimate */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] text-zinc-400 uppercase font-bold">Estimated Cost (Subsidized Price, ZAR)</label>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-zinc-500">R</span>
                          <input 
                            type="number"
                            value={estimatedCost}
                            onChange={e => setEstimatedCost(Number(e.target.value))}
                            className="w-full text-xs p-1.5 bg-zinc-900 border border-zinc-700 rounded-md focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Survey Notes */}
                      <textarea
                        placeholder="General condition: Breaker load switches are deteriorating..."
                        value={assessmentNotes}
                        onChange={e => setAssessmentNotes(e.target.value)}
                        className="text-[10px] p-2 bg-zinc-900 border border-zinc-700 rounded-md h-12 w-full resize-none focus:outline-none"
                      />

                      {/* Survey Photo Simulator */}
                      <div className="border border-dashed border-zinc-600 rounded-lg p-2 text-center bg-zinc-900 relative">
                        {assessmentPhoto ? (
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-green-400 font-bold flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> Defect Photo Logged
                            </span>
                            <button type="button" onClick={() => setAssessmentPhoto(null)} className="text-red font-bold hover:underline">Clear</button>
                          </div>
                        ) : (
                          <label className="cursor-pointer flex flex-col items-center py-1">
                            <Camera className="w-4.5 h-4.5 text-zinc-400 mb-1" />
                            <span className="text-[9px] font-bold text-zinc-400">Attach compliance defect photo</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={e => handlePhotoUpload(e, setAssessmentPhoto)}
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-red hover:bg-red/90 text-white font-brand-header text-xs py-2 rounded-lg mt-1"
                    >
                      UPLOAD COMPLIANCE ASSESSMENT
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* CASE 2: PRE-COMPLIANCE REPAIRS UNDERWAY */}
            {state.currentStep === 'CUSTOMER_APPROVED' && (
              <div className="bg-zinc-800 p-4 rounded-xl border border-zinc-700 text-center animate-fadeIn flex flex-col gap-3">
                <Wrench className="w-8 h-8 text-red mx-auto animate-bounce" />
                <h3 className="text-xs font-brand-header text-white">REPAIRS APPROVED BY CLIENT</h3>
                <p className="text-[10px] text-zinc-300 leading-relaxed px-2">
                  Client has approved the quotation! Carry out structural gate/wiring compliance upgrades and complete job card.
                </p>
                <button
                  onClick={handleCompletePreRepairs}
                  className="w-full bg-red hover:bg-red/90 text-white font-brand-header text-xs py-2 rounded-lg"
                >
                  UPGRADE COMPLIANCE & MARK COMPLETE
                </button>
              </div>
            )}

            {/* CASE 3: ACTIVE DISPATCH WORKFLOW */}
            {activeJob && (state.currentStep === 'REQUEST_ASSISTANCE' || state.currentStep === 'JOB_CARD_CREATED' || state.currentStep === 'LIVE_JOB_UPDATES' || state.currentStep === 'COMPLETION_REPORT') && (
              <div className="flex flex-col gap-3 animate-fadeIn">
                <div className="bg-red-950/40 border border-red-900 text-red-300 p-3 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-red animate-pulse" />
                    <div>
                      <p className="text-xs font-brand-header">EMERGENCY JOB ACTIVE</p>
                      <p className="text-[8px] font-mono text-zinc-400">ID: {activeJob.id}</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono bg-red text-white px-1.5 py-0.5 rounded font-bold">ZAR RESPONSE</span>
                </div>

                {/* Patient / Client details Card */}
                <div className="bg-zinc-800 p-3 rounded-xl border border-zinc-700 text-xs flex flex-col gap-1.5 text-zinc-300">
                  <div className="flex justify-between border-b border-zinc-700 pb-1">
                    <span className="font-bold text-zinc-100">Client: {activeJob.customerName}</span>
                    <a href={`tel:${activeJob.customerPhone}`} className="text-red font-bold flex items-center gap-0.5">
                      <Phone className="w-3 h-3" /> Call
                    </a>
                  </div>
                  <p className="text-[11px]"><strong>Address:</strong> {activeJob.customerAddress}</p>
                  <p className="text-[11px]"><strong>Details:</strong> "{activeJob.description}"</p>
                </div>

                {/* DISPATCH PROGRESS ACTIONS */}
                {activeJob.status === 'Requested' && (
                  <div className="bg-zinc-800 p-4 rounded-xl border border-zinc-700 text-center space-y-2">
                    <p className="text-[11px] text-zinc-300">Acknowledge dispatch and begin route navigation</p>
                    <button
                      onClick={() => handleUpdateJobStatus('InRoute')}
                      className="w-full bg-red hover:bg-red/90 text-white font-brand-header text-xs py-2.5 rounded-lg shadow"
                    >
                      START EMERGENCY ROUTE DISPATCH
                    </button>
                  </div>
                )}

                {activeJob.status === 'InRoute' && (
                  <div className="bg-zinc-800 p-4 rounded-xl border border-zinc-700 text-center space-y-2">
                    <p className="text-[11px] text-zinc-300">Updating client with GPS arrival status</p>
                    <button
                      onClick={() => handleUpdateJobStatus('Arrived')}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white font-brand-header text-xs py-2.5 rounded-lg shadow"
                    >
                      MARK AS ARRIVED ON PREMISES
                    </button>
                  </div>
                )}

                {/* FINAL WORK RESOLUTION FORM */}
                {(activeJob.status === 'Arrived' || activeJob.status === 'Completed') && (
                  <form onSubmit={handleCompleteJob} className="bg-zinc-800 p-3.5 rounded-xl border border-zinc-700 flex flex-col gap-3 text-xs text-zinc-300">
                    <div className="border-b border-zinc-700 pb-1.5">
                      <h4 className="text-xs font-brand-header text-red">SUBMIT RESOLUTION REPORT</h4>
                      <p className="text-[9px] text-zinc-400">Verify completion signature to close dispatch</p>
                    </div>

                    <div className="space-y-2">
                      <textarea
                        placeholder="Explain works carried out (e.g. Secured electric gate lock pin, reset trip switch...)"
                        required
                        value={resolutionNotes}
                        onChange={e => setResolutionNotes(e.target.value)}
                        className="text-[10px] p-2 bg-zinc-900 border border-zinc-700 rounded-md h-14 w-full resize-none focus:outline-none"
                      />

                      {/* Work Photo Capture */}
                      <div className="border border-dashed border-zinc-600 rounded-lg p-2 text-center bg-zinc-900 relative">
                        {completionPhoto ? (
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-green-400 font-bold flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> Resolution Photo Captured
                            </span>
                            <button type="button" onClick={() => setCompletionPhoto(null)} className="text-red font-bold hover:underline">Clear</button>
                          </div>
                        ) : (
                          <label className="cursor-pointer flex flex-col items-center py-1">
                            <Camera className="w-4 h-4 text-zinc-400 mb-0.5" />
                            <span className="text-[9px] font-bold text-zinc-400">Capture Proof of Completion</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={e => handlePhotoUpload(e, setCompletionPhoto)}
                            />
                          </label>
                        )}
                      </div>

                      {/* SIGNATURE PAD (TYPE-IN CURSIVE MODEL AS SPECIFIED FOR IFRAME COMPATIBILITY) */}
                      <div className="bg-zinc-900 p-2.5 rounded-lg border border-zinc-700">
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[9px] text-zinc-400 uppercase font-bold">CLIENT/CONTRACTOR SIGNATURE</label>
                          <span className="text-[8px] font-mono text-zinc-500">SECURE LOG</span>
                        </div>
                        
                        <input 
                          type="text" 
                          placeholder="Type responder name to sign digitally"
                          required
                          value={signatureText}
                          onChange={e => setSignatureText(e.target.value)}
                          className="w-full text-xs p-1.5 bg-zinc-950 border border-zinc-800 rounded focus:outline-none text-zinc-200"
                        />
                        
                        {signatureText && (
                          <div className="mt-2 p-2 bg-zinc-950 border border-zinc-800 rounded text-center">
                            <span className="font-serif italic text-base text-red tracking-wider font-bold">
                              {signatureText}
                            </span>
                            <p className="text-[8px] text-zinc-500 font-mono mt-0.5">SHA256 DIGITAL COMPLIANT SIGNATURE</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={activeJob.status === 'Completed'}
                      className={`w-full text-white font-brand-header text-xs py-2 rounded-lg ${
                        activeJob.status === 'Completed' 
                          ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed' 
                          : 'bg-red hover:bg-red/90'
                      }`}
                    >
                      {activeJob.status === 'Completed' ? 'SUBMITTED (WAITING ON RATING)' : 'SUBMIT RESOLUTION & SIGNATURE'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* DEFAULT VIEW - NO ACTIVE JOBS */}
            {!pendingAssessment && !activeJob && (
              <div className="bg-zinc-800/50 p-6 rounded-xl border border-zinc-800 text-center py-10 animate-fadeIn space-y-3">
                <Shield className="w-10 h-10 text-zinc-600 mx-auto" />
                <div>
                  <h3 className="text-xs font-brand-header text-zinc-300">NO ASSIGNED DISPATCH CARDS</h3>
                  <p className="text-[10px] text-zinc-500 max-w-xs mx-auto leading-normal mt-1">
                    Your response cruiser is active in Sandton core sector. Emergency dispatch triggers will update this terminal instantly.
                  </p>
                </div>
              </div>
            )}

        </div>
      </div>
    </div>
  );
}
