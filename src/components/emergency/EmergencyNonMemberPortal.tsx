import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, Shield, Phone, MapPin, CheckCircle, 
  Clock, DollarSign, CreditCard, ChevronRight, ArrowLeft,
  FileText, Camera, Radio, Lock, RefreshCw, UserCheck,
  Zap, DoorClosed, ShieldAlert, KeyRound, Power, Droplets,
  AlertCircle, Download, ExternalLink, HelpCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { getSocket } from '../../services/socket';
import { EMERGENCY_SERVICES, EMERGENCY_CALL_OUT_FEE } from '../../config/emergencyServices';
import logoImg from '../../assets/logo.png';

interface Props {
  onBackToLogin: () => void;
  initialJobId?: string | null;
}

const LOCAL_STORAGE_KEY = 'sda_emergency_job_id';

export function EmergencyNonMemberPortal({ onBackToLogin, initialJobId }: Props) {
  // Check local storage or initialJobId for existing emergency request
  const storedJobId = initialJobId || localStorage.getItem(LOCAL_STORAGE_KEY) || '';

  const [viewMode, setViewMode] = useState<'create' | 'pay' | 'track'>(storedJobId ? 'track' : 'create');

  // Request Form States
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [serviceType, setServiceType] = useState<string>(EMERGENCY_SERVICES[0].name);
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState('Immediate Emergency (Rapid Dispatch)');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [consentAgreed, setConsentAgreed] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Active tracked job state
  const [trackedJob, setTrackedJob] = useState<any | null>(null);
  const [trackingLookupId, setTrackingLookupId] = useState(storedJobId);
  const [isFetchingJob, setIsFetchingJob] = useState(false);

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<'Card' | 'EFT'>('Card');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('888');
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Auto-fetch stored job on initial mount
  useEffect(() => {
    if (storedJobId) {
      handleFetchJob(storedJobId);
    }
  }, []);

  // Photo upload handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit emergency request (Step 1 -> Transitions to Step 2: Payment)
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim() || !phone.trim() || !address.trim() || !description.trim()) {
      setErrorMessage('Please fill in your full name, contact phone, incident address, and emergency description.');
      return;
    }
    if (!consentAgreed) {
      setErrorMessage('Please confirm agreement to the R650 Call-Out fee terms before proceeding.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createEmergencyNonMemberJob({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim(),
        serviceType,
        description: description.trim(),
        urgency,
        additionalNotes: additionalNotes.trim() || undefined,
        consentAgreed: true,
        photoUrl: photoUrl || undefined,
      });

      setTrackedJob(res.job);
      localStorage.setItem(LOCAL_STORAGE_KEY, res.job.id);
      setTrackingLookupId(res.job.id);

      // If already paid (rare duplicate recovery), go to track; otherwise go to upfront payment
      if (res.job.paymentStatus === 'Paid') {
        setViewMode('track');
      } else {
        setViewMode('pay');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit emergency assistance request.');
    } finally {
      setSubmitting(false);
    }
  };

  // Lookup existing emergency request
  const handleFetchJob = async (jobIdToFetch?: string) => {
    const id = jobIdToFetch || trackingLookupId;
    if (!id.trim()) return;

    setIsFetchingJob(true);
    setErrorMessage('');
    try {
      const job = await api.getEmergencyNonMemberJob(id.trim());
      setTrackedJob(job);
      localStorage.setItem(LOCAL_STORAGE_KEY, job.id);

      if (job.paymentStatus === 'Paid') {
        setViewMode('track');
      } else {
        setViewMode('pay');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not find an active emergency request with this ID.');
    } finally {
      setIsFetchingJob(false);
    }
  };

  // Real-time socket listener for tracked job updates
  useEffect(() => {
    if (!trackedJob?.id) return;

    const socket = getSocket();
    if (!socket) return;

    const handleJobUpdated = (updatedJob: any) => {
      if (updatedJob.id === trackedJob.id) {
        setTrackedJob(updatedJob);
        if (updatedJob.paymentStatus === 'Paid' && viewMode === 'pay') {
          setViewMode('track');
        }
      }
    };

    socket.on('job-updated', handleJobUpdated);
    return () => {
      socket.off('job-updated', handleJobUpdated);
    };
  }, [trackedJob?.id, viewMode]);

  // Handle R650 Call-Out fee payment
  const handlePayCallOutFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackedJob) return;

    setIsPaying(true);
    setPaymentError('');
    try {
      const res = await api.payEmergencyService(trackedJob.id, {
        paymentMethod: paymentMethod === 'Card' ? 'Credit Card (Visa/Mastercard)' : 'Instant EFT',
        cardLast4: paymentMethod === 'Card' ? cardNumber.slice(-4) : undefined,
        simulateFailure,
      });

      setTrackedJob(res.job);
      setViewMode('track');
    } catch (err: any) {
      setPaymentError(err.message || 'Failed to verify payment. Call-out fee remains unpaid.');
    } finally {
      setIsPaying(false);
    }
  };

  // Clear current active tracking to allow new request
  const handleStartNewRequest = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setTrackedJob(null);
    setTrackingLookupId('');
    setViewMode('create');
  };

  const selectedServiceObj = EMERGENCY_SERVICES.find(s => s.name === serviceType) || EMERGENCY_SERVICES[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans relative overflow-x-hidden">
      {/* Background glow styling */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-red/10 rounded-full blur-[140px] pointer-events-none"></div>

      {/* HEADER */}
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md py-4 px-6 md:px-12 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="Same Day Assist" className="w-10 h-10 object-contain rounded-full bg-white p-0.5 shadow-md" />
          <div>
            <div className="flex items-baseline gap-1.5">
              <h1 className="text-sm font-black italic tracking-wide leading-none uppercase font-brand-header text-white">
                SAME DAY ASSIST
              </h1>
              <span className="text-[9px] font-bold text-red uppercase tracking-widest font-mono">EMERGENCY</span>
            </div>
            <p className="text-[9px] font-mono tracking-wider text-amber-400">
              NON-MEMBER DISPATCH GATEWAY
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBackToLogin}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Member Login</span>
        </button>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 z-10 max-w-4xl mx-auto w-full">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 w-full mb-6">
          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-2xl shadow-md">
            <button
              type="button"
              onClick={() => setViewMode('create')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'create'
                  ? 'bg-red text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🚨 1. Request Emergency Assistance
            </button>
            <button
              type="button"
              onClick={() => {
                if (trackedJob) {
                  setViewMode(trackedJob.paymentStatus === 'Paid' ? 'track' : 'pay');
                } else {
                  setViewMode('track');
                }
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                ['pay', 'track'].includes(viewMode)
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              📍 2. Pay Call-Out & Track Dispatch
            </button>
          </div>

          {trackedJob && (
            <button
              type="button"
              onClick={handleStartNewRequest}
              className="text-xs text-slate-400 hover:text-amber-400 underline font-mono flex items-center gap-1 cursor-pointer"
            >
              <span>+ New Emergency Request</span>
            </button>
          )}
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: CREATE EMERGENCY REQUEST                                          */}
        {/* ========================================================================= */}
        {viewMode === 'create' && (
          <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 animate-fadeIn">
            {/* Clear Non-Member Banner with Prompt Requirements */}
            <div className="bg-gradient-to-r from-red/20 via-amber-500/10 to-red/10 border-2 border-red/40 rounded-2xl p-5 shadow-lg space-y-3">
              <div className="flex items-center gap-2 text-red font-black text-sm uppercase tracking-wide">
                <AlertTriangle className="w-5 h-5 animate-pulse shrink-0" />
                <span>EMERGENCY ASSISTANCE FOR NON-MEMBERS</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                Not a Same Day Assist monthly member? You can request immediate emergency assistance for our certified property and security services.
                A certified technician/response team will be dispatched immediately once the fixed call-out fee is confirmed.
              </p>
              
              {/* Call-Out Fee Badge */}
              <div className="bg-slate-950/80 border border-amber-500/40 rounded-xl p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block font-bold">
                    MANDATORY NON-MEMBER CALL-OUT FEE
                  </span>
                  <span className="text-base font-black text-white font-mono">
                    Emergency Assistance Call-Out Fee: R650
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Fixed call-out fee. Payment must happen before technician dispatch. No monthly membership created.
                  </p>
                </div>
                <div className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-lg text-xs font-mono font-bold shrink-0">
                  FIXED R650
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3.5 bg-red/15 border border-red/40 text-red text-xs font-mono rounded-xl flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmitRequest} className="space-y-6">
              {/* SECTION 1: CUSTOMER DETAILS */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span className="w-5 h-5 rounded-full bg-red text-white flex items-center justify-center text-[10px] font-mono">1</span>
                  <span>Contact Information</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sipho Sithole"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-red"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Mobile Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +27 82 555 1234"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-red"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Email Address (For R650 Invoice & Tracking Link)
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. sipho@example.co.za"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-red"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: INCIDENT LOCATION */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span className="w-5 h-5 rounded-full bg-red text-white flex items-center justify-center text-[10px] font-mono">2</span>
                  <span>Incident Location</span>
                </h3>

                <div className="text-xs">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Emergency Location / Physical Address *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. 45 Sandton Drive, Morningside, Sandton, Johannesburg"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-red"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: SERVICE SELECTION (EXISTING SAME DAY ASSIST SERVICES ONLY) */}
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-red text-white flex items-center justify-center text-[10px] font-mono">3</span>
                    <span>Service Required (Same Day Assist Official Catalog)</span>
                  </h3>
                  <span className="text-[9px] text-amber-400 font-mono">Fixed R650 Call-Out</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {EMERGENCY_SERVICES.map(srv => {
                    const isSelected = serviceType === srv.name;
                    return (
                      <button
                        key={srv.id}
                        type="button"
                        onClick={() => setServiceType(srv.name)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-red/15 border-red text-white shadow-md shadow-red/10'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-xs font-bold leading-tight">{srv.name}</span>
                          <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                            isSelected ? 'bg-red text-white' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {srv.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                          {srv.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 4: PROBLEM DESCRIPTION & URGENCY */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span className="w-5 h-5 rounded-full bg-red text-white flex items-center justify-center text-[10px] font-mono">4</span>
                  <span>Problem Description & Urgency</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Urgency Level *</label>
                    <select
                      value={urgency}
                      onChange={e => setUrgency(e.target.value)}
                      className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-red"
                    >
                      <option value="Immediate Emergency (Rapid Dispatch)">⚡ Immediate Emergency (Rapid Dispatch within 30-45 mins)</option>
                      <option value="Urgent Priority (Within 2 Hours)">⏱️ Urgent Priority (Within 2 Hours)</option>
                      <option value="Same Day Needed">📅 Same Day Priority</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Photo Upload (Optional)</label>
                    <label className="w-full p-2.5 bg-slate-950 border border-dashed border-slate-700 hover:border-slate-500 rounded-xl text-slate-400 hover:text-white flex items-center justify-center gap-2 cursor-pointer transition-colors">
                      <Camera className="w-4 h-4 text-red" />
                      <span>{photoUrl ? 'Photo Attached ✓' : 'Upload Scene Photo'}</span>
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="text-xs">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Describe The Problem In Detail *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe what is broken, what occurred, or any immediate security/safety risks..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-red"
                  />
                </div>

                <div className="text-xs">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Additional Information / Gate Code / Access Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Buzz unit 4B at gate, beware of dog in garden, main DB box in garage"
                    value={additionalNotes}
                    onChange={e => setAdditionalNotes(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-red"
                  />
                </div>
              </div>

              {/* SECTION 5: CALL-OUT FEE CONSENT & CONFIRMATION */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4.5 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Emergency Call-Out Fee:</span>
                  <span className="text-base font-black text-amber-400">R650.00</span>
                </div>

                <label className="flex items-start gap-3 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    required
                    checked={consentAgreed}
                    onChange={e => setConsentAgreed(e.target.checked)}
                    className="mt-0.5 rounded bg-slate-900 border-slate-700 text-red focus:ring-0"
                  />
                  <span className="text-slate-300 leading-relaxed text-[11px]">
                    I confirm that I am requesting a <strong>one-time emergency assistance call-out</strong> as a non-member.
                    I agree to pay the mandatory <strong>fixed Call-Out Fee of R650</strong> prior to technician dispatch.
                    I understand this does <strong>NOT</strong> enroll me into a monthly plan or recurring subscription.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-red hover:bg-red/90 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-red/20 cursor-pointer flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Registering Emergency Request...</span>
                  </>
                ) : (
                  <>
                    <Radio className="w-4 h-4 animate-pulse" />
                    <span>PROCEED TO PAYMENT (R650 CALL-OUT FEE)</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: UPFRONT PAYMENT (R650 CALL-OUT FEE REQUIRED BEFORE DISPATCH)       */}
        {/* ========================================================================= */}
        {viewMode === 'pay' && trackedJob && (
          <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 animate-fadeIn">
            {/* Payment Header */}
            <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest block">
                  STEP 2 OF 3: CONFIRM CALL-OUT PAYMENT
                </span>
                <h3 className="text-lg font-black text-white uppercase mt-0.5">Pay Emergency Call-Out Fee</h3>
                <p className="text-xs text-slate-400">
                  Payment of R650 is required before the Same Day Assist team can be dispatched.
                </p>
              </div>

              <div className="text-right bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[9px] uppercase font-mono text-slate-400 block">Incident Reference</span>
                <span className="text-sm font-black text-amber-400 font-mono">REF: #{trackedJob.id.slice(0, 8)}</span>
              </div>
            </div>

            {/* Locked Dispatch Notice */}
            <div className="bg-red/10 border-2 border-red/40 rounded-2xl p-4 flex items-start gap-3 text-xs">
              <AlertTriangle className="w-5 h-5 text-red shrink-0 mt-0.5 animate-pulse" />
              <div>
                <h5 className="font-bold text-red uppercase text-xs">Dispatch Status: Payment Required</h5>
                <p className="text-slate-300 mt-1 leading-relaxed">
                  Our operations team has received your incident request for <strong>{trackedJob.serviceType}</strong> at <strong>{trackedJob.customerAddress}</strong>.
                  Per Same Day Assist safety protocol, the response unit is staged and ready, but <strong>will NOT be dispatched until the R650 call-out fee is verified</strong>.
                </p>
              </div>
            </div>

            {/* Fee Breakdown Box */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Service Category:</span>
                <span className="text-white font-bold">{trackedJob.serviceType}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Customer Type:</span>
                <span className="text-amber-400 font-bold">One-Time Non-Member Emergency</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Emergency Call-Out Fee:</span>
                <span className="text-white font-bold">R650.00</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Monthly Membership Fee:</span>
                <span className="text-emerald-400 font-bold">R0.00 (No Membership)</span>
              </div>
              <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-sm font-black text-white">
                <span>Total Amount Due Now:</span>
                <span className="text-xl text-amber-400">R650.00</span>
              </div>
            </div>

            {paymentError && (
              <div className="p-3.5 bg-red/15 border border-red/40 text-red text-xs font-mono rounded-xl flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{paymentError}</span>
              </div>
            )}

            {/* Payment Method Selector & Form */}
            <form onSubmit={handlePayCallOutFee} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400">Select Payment Method</label>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Card')}
                    className={`p-3 rounded-xl border font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      paymentMethod === 'Card'
                        ? 'bg-amber-600 border-amber-500 text-white shadow-xs'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Credit / Debit Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('EFT')}
                    className={`p-3 rounded-xl border font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      paymentMethod === 'EFT'
                        ? 'bg-amber-600 border-amber-500 text-white shadow-xs'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    <span>Instant EFT (Ozow / Capitec)</span>
                  </button>
                </div>
              </div>

              {paymentMethod === 'Card' && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={e => setCardNumber(e.target.value)}
                      className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Expiry (MM/YY)</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={e => setCardExpiry(e.target.value)}
                      className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">CVV Security Code</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={cardCvv}
                      onChange={e => setCardCvv(e.target.value)}
                      className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              {/* Simulation test toggle for Negative Testing (declined payment) */}
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between text-[11px]">
                <span className="text-slate-400">
                  Test Gateway Decline (Negative Testing):
                </span>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-mono">
                  <input
                    type="checkbox"
                    checked={simulateFailure}
                    onChange={e => setSimulateFailure(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-red focus:ring-0"
                  />
                  <span className={simulateFailure ? 'text-red font-bold' : 'text-slate-400'}>
                    {simulateFailure ? 'SIMULATE DECLINE' : 'NORMAL SUCCESS'}
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isPaying}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-xl cursor-pointer flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isPaying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying R650 Call-Out Payment with Bank Gateway...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>PAY R650 CALL-OUT FEE & UNLOCK DISPATCH</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: LIVE TRACKER & DISPATCH STATUS (PAYMENT CONFIRMED)                 */}
        {/* ========================================================================= */}
        {viewMode === 'track' && (
          <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 animate-fadeIn">
            {!trackedJob ? (
              /* Lookup Box if no active job loaded */
              <div className="space-y-4 text-center max-w-md mx-auto py-8">
                <Radio className="w-10 h-10 text-amber-500 mx-auto animate-pulse" />
                <h3 className="text-base font-bold text-white uppercase">Track Non-Member Emergency Request</h3>
                <p className="text-xs text-slate-400">
                  Enter your Emergency Job ID from your confirmation message to monitor live dispatch updates.
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Emergency Reference ID"
                    value={trackingLookupId}
                    onChange={e => setTrackingLookupId(e.target.value)}
                    className="flex-1 p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleFetchJob()}
                    disabled={isFetchingJob}
                    className="px-5 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase rounded-xl cursor-pointer"
                  >
                    {isFetchingJob ? 'Loading...' : 'Track'}
                  </button>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-red/10 border border-red/30 text-red text-xs rounded-xl">
                    {errorMessage}
                  </div>
                )}
              </div>
            ) : (
              /* ACTIVE TRACKING PIPELINE */
              <div className="space-y-6">
                {/* Reference ID Banner */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-xs">
                  <div>
                    <span className="text-slate-500 uppercase text-[9px] block">Emergency Request Reference</span>
                    <span className="text-sm font-black text-amber-400">REF: #{trackedJob.id.slice(0, 8)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="text-slate-300">Live Satellite Dispatch Stream</span>
                  </div>
                </div>

                {/* PAYMENT STATUS CALLOUT */}
                <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs ${
                  trackedJob.paymentStatus === 'Paid'
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-red-950/40 border-red-500/40 text-red-300'
                }`}>
                  <div className="flex items-center gap-3">
                    {trackedJob.paymentStatus === 'Paid' ? (
                      <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red shrink-0 animate-pulse" />
                    )}
                    <div>
                      <span className="font-black uppercase tracking-wider block">
                        {trackedJob.paymentStatus === 'Paid' ? 'PAYMENT CONFIRMED — R650 PAID' : 'PAYMENT REQUIRED — R650 CALL-OUT FEE'}
                      </span>
                      <p className="text-[10px] opacity-90 mt-0.5">
                        {trackedJob.paymentStatus === 'Paid'
                          ? 'Call-out fee successfully verified. Dispatch unlocked.'
                          : 'Technician dispatch remains locked until call-out fee is paid.'}
                      </p>
                    </div>
                  </div>

                  {trackedJob.paymentStatus !== 'Paid' && (
                    <button
                      type="button"
                      onClick={() => setViewMode('pay')}
                      className="px-4 py-2 bg-red hover:bg-red/90 text-white font-bold rounded-xl text-xs uppercase cursor-pointer"
                    >
                      Pay R650 Now
                    </button>
                  )}
                </div>

                {/* 7-STAGE DISPATCH PIPELINE STEPPER */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Current Dispatch Status</span>
                      <h4 className="text-base font-black text-white uppercase tracking-wide flex items-center gap-2 mt-0.5">
                        <Shield className="w-5 h-5 text-red animate-pulse" />
                        <span>{trackedJob.status}</span>
                      </h4>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase ${
                      ['Completed', 'Service Completed'].includes(trackedJob.status)
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : trackedJob.paymentStatus === 'Paid'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-red/20 text-red border border-red/30'
                    }`}>
                      {trackedJob.status}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-700 ${
                        ['Completed', 'Service Completed'].includes(trackedJob.status) ? 'bg-emerald-500 w-full' :
                        ['Assistance In Progress', 'Service In Progress', 'In Progress'].includes(trackedJob.status) ? 'bg-blue-500 w-[85%]' :
                        ['Team En Route', 'En Route', 'Arrived'].includes(trackedJob.status) ? 'bg-indigo-500 w-[65%]' :
                        ['Dispatched', 'Team Dispatched', 'Service Provider Assigned'].includes(trackedJob.status) ? 'bg-amber-500 w-[50%]' :
                        trackedJob.paymentStatus === 'Paid' ? 'bg-amber-600 w-[25%]' :
                        'bg-red w-[10%]'
                      }`}
                    ></div>
                  </div>

                  {/* Visual 7-Step Labels */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5 text-[9px] font-mono text-slate-400 pt-2 border-t border-slate-900">
                    <div className="text-white font-bold">1. Request Received ✓</div>
                    <div className={trackedJob.paymentStatus === 'Paid' ? 'text-emerald-400 font-bold' : 'text-slate-600'}>
                      2. Payment Confirmed {trackedJob.paymentStatus === 'Paid' ? '✓' : ''}
                    </div>
                    <div className={['Awaiting Dispatch', 'Dispatched', 'Team Dispatched', 'Service Provider Assigned', 'En Route', 'Team En Route', 'In Progress', 'Assistance In Progress', 'Completed'].includes(trackedJob.status) ? 'text-white font-bold' : ''}>
                      3. Awaiting Dispatch
                    </div>
                    <div className={['Dispatched', 'Team Dispatched', 'Service Provider Assigned', 'En Route', 'Team En Route', 'In Progress', 'Assistance In Progress', 'Completed'].includes(trackedJob.status) ? 'text-white font-bold' : ''}>
                      4. Team Dispatched
                    </div>
                    <div className={['Team En Route', 'En Route', 'Arrived', 'In Progress', 'Assistance In Progress', 'Completed'].includes(trackedJob.status) ? 'text-white font-bold' : ''}>
                      5. Team En Route
                    </div>
                    <div className={['Assistance In Progress', 'Service In Progress', 'In Progress', 'Work Completed', 'Completed'].includes(trackedJob.status) ? 'text-white font-bold' : ''}>
                      6. Assistance In Progress
                    </div>
                    <div className={['Completed', 'Service Completed', 'Work Completed'].includes(trackedJob.status) ? 'text-emerald-400 font-bold' : ''}>
                      7. Completed
                    </div>
                  </div>
                </div>

                {/* Assigned Responder Details if Dispatched */}
                {trackedJob.assignedContractor && (
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center font-bold text-white text-sm">
                        <UserCheck className="w-5 h-5 text-red" />
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-mono text-slate-400 block">Assigned Response Specialist</span>
                        <h5 className="font-bold text-white text-sm">{trackedJob.assignedContractor.name}</h5>
                        <p className="text-[10px] text-slate-400 font-mono">Specialty: {trackedJob.assignedContractor.specialty || trackedJob.serviceType}</p>
                      </div>
                    </div>

                    <a
                      href={`tel:${trackedJob.assignedContractor.phone}`}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5 text-red" />
                      <span>{trackedJob.assignedContractor.phone}</span>
                    </a>
                  </div>
                )}

                {/* Summary of Incident & Financial Record */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">Incident Details</span>
                    <p className="text-white font-semibold">"{trackedJob.description}"</p>
                    <p className="text-[10px] text-slate-400 font-mono">📍 {trackedJob.customerAddress}</p>
                    <p className="text-[10px] text-amber-400 font-mono font-bold">Service: {trackedJob.serviceType}</p>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1.5 font-mono">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Payment & Receipt Record</span>
                    <p className="text-white font-bold">
                      Emergency Assistance Call-Out Fee: <span className="text-amber-400">R650.00</span>
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Customer Type: <span className="text-slate-200">Non-Member Emergency</span>
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Payment Status: <span className={trackedJob.paymentStatus === 'Paid' ? 'text-emerald-400 font-bold' : 'text-red font-bold'}>
                        {trackedJob.paymentStatus === 'Paid' ? 'Paid (R650)' : 'Unpaid (R650 Required)'}
                      </span>
                    </p>
                    {trackedJob.payments?.[0] && (
                      <p className="text-[9px] text-slate-500 truncate">
                        Ref: {trackedJob.payments[0].gatewayReference || trackedJob.payments[0].transactionRef}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-[9px] font-mono text-slate-500 z-10">
        © 2026 SAME DAY ASSIST • EMERGENCY ASSISTANCE GATEWAY • 24/7 HOTLINE: +27 11 555 9111
      </footer>
    </div>
  );
}
