import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, Shield, Phone, Car, MapPin, CheckCircle, 
  Clock, DollarSign, CreditCard, ChevronRight, ArrowLeft,
  FileText, Camera, Radio, Lock, RefreshCw, UserCheck
} from 'lucide-react';
import { api } from '../../services/api';
import { getSocket } from '../../services/socket';
import { ServiceCategory } from '../../types';
import logoImg from '../../assets/logo.png';

interface Props {
  onBackToLogin: () => void;
  initialJobId?: string | null;
}

export function EmergencyNonMemberPortal({ onBackToLogin, initialJobId }: Props) {
  const [viewMode, setViewMode] = useState<'create' | 'track'>(initialJobId ? 'track' : 'create');

  // Request Form States
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [serviceType, setServiceType] = useState<ServiceCategory>('Security Services');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  // Vehicle information states
  const [vehMake, setVehMake] = useState('');
  const [vehModel, setVehModel] = useState('');
  const [vehYear, setVehYear] = useState(String(new Date().getFullYear()));
  const [vehPlate, setVehPlate] = useState('');
  const [vehColor, setVehColor] = useState('');

  // Agreement confirmation
  const [agreedToPayFull, setAgreedToPayFull] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Active tracked job state
  const [trackedJob, setTrackedJob] = useState<any | null>(null);
  const [trackingLookupId, setTrackingLookupId] = useState(initialJobId || '');
  const [isFetchingJob, setIsFetchingJob] = useState(false);

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<'Card' | 'EFT' | 'Cash'>('Card');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('888');
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

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

  // Submit emergency request
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim() || !phone.trim() || !address.trim() || !description.trim()) {
      setErrorMessage('Please fill in your name, contact phone, incident address, and emergency description.');
      return;
    }
    if (!agreedToPayFull) {
      setErrorMessage('Please acknowledge the terms: this is a one-time emergency service paid upon completion.');
      return;
    }

    setSubmitting(true);
    try {
      const vehiclePayload = vehMake.trim() || vehPlate.trim() ? {
        make: vehMake.trim() || 'Unspecified',
        model: vehModel.trim() || 'Vehicle',
        year: vehYear || String(new Date().getFullYear()),
        licensePlate: vehPlate.trim().toUpperCase() || 'N/A',
        color: vehColor.trim() || 'Unspecified',
      } : undefined;

      const res = await api.createEmergencyNonMemberJob({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim(),
        serviceType,
        description: description.trim(),
        photoUrl: photoUrl || undefined,
        vehicle: vehiclePayload,
      });

      setTrackedJob(res.job);
      setViewMode('track');
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
      setViewMode('track');
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
      }
    };

    socket.on('job-updated', handleJobUpdated);
    return () => {
      socket.off('job-updated', handleJobUpdated);
    };
  }, [trackedJob?.id]);

  // Handle one-time full payment
  const handlePayFullAmount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackedJob) return;

    setIsPaying(true);
    setErrorMessage('');
    try {
      const res = await api.payEmergencyService(trackedJob.id, {
        paymentMethod: paymentMethod === 'Card' ? 'Credit Card (Visa/Mastercard)' : paymentMethod === 'EFT' ? 'Instant EFT' : 'Cash On Scene',
        cardLast4: paymentMethod === 'Card' ? cardNumber.slice(-4) : undefined,
      });

      setTrackedJob(res.job);
      setPaymentSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to process payment.');
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans relative overflow-x-hidden">
      {/* Background glow styling */}
      <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-red/10 rounded-full blur-[140px] pointer-events-none"></div>

      {/* HEADER */}
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md py-4 px-6 md:px-12 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="Same Day Assist" className="w-10 h-10 object-contain rounded-full bg-white p-0.5 shadow-md" />
          <div>
            <div className="flex items-baseline gap-1">
              <h1 className="text-sm font-black italic tracking-wide leading-none uppercase font-brand-header text-white">
                SAME DAY ASSIST
              </h1>
              <span className="text-[9px] font-bold text-red uppercase tracking-widest font-mono">EMERGENCY</span>
            </div>
            <p className="text-[8px] font-mono tracking-wider text-amber-400">
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
        {/* Toggle between Create & Track */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-2xl mb-6 shadow-md">
          <button
            type="button"
            onClick={() => setViewMode('create')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'create'
                ? 'bg-red text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🚨 Request Emergency Assistance
          </button>
          <button
            type="button"
            onClick={() => setViewMode('track')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'track'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📍 Track My Emergency Request
          </button>
        </div>

        {/* VIEW 1: CREATE EMERGENCY REQUEST */}
        {viewMode === 'create' && (
          <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 animate-fadeIn">
            {/* Clear Non-Member Banner with Prompt Requirements */}
            <div className="bg-gradient-to-r from-red/20 via-amber-500/10 to-red/10 border-2 border-red/40 rounded-2xl p-5 shadow-lg space-y-2">
              <div className="flex items-center gap-2 text-red font-black text-sm uppercase tracking-wide">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
                <span>NEED HELP NOW? NOT A SAME DAY ASSIST MEMBER? THAT'S OKAY.</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                Request emergency assistance immediately and pay for the service once the work is completed.
              </p>
              <div className="pt-2 border-t border-red/20 flex flex-wrap items-center gap-3 text-[10px] font-mono text-slate-300">
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                  ✓ NO MONTHLY MEMBERSHIP FEE
                </span>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                  ✓ ONE-TIME EMERGENCY SERVICE
                </span>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                  ✓ PAY APPLICABLE FULL RATE UPON COMPLETION
                </span>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red/10 border border-red/30 text-red text-xs font-mono rounded-xl flex items-center gap-2 animate-fadeIn">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmitRequest} className="space-y-6">
              {/* SECTION 1: CONTACT DETAILS */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span className="w-5 h-5 rounded-full bg-red text-white flex items-center justify-center text-[10px] font-mono">1</span>
                  <span>Customer Contact Details</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Thabo Ndlovu"
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
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Email Address (Optional for Invoice)</label>
                    <input
                      type="email"
                      placeholder="e.g. thabo@example.co.za"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-red"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: LOCATION */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span className="w-5 h-5 rounded-full bg-red text-white flex items-center justify-center text-[10px] font-mono">2</span>
                  <span>Incident Location</span>
                </h3>

                <div className="text-xs">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Exact Location / Address / Intersection *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Corner of Rivonia Rd & Sandton Dr, Sandton, Johannesburg"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-red"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: VEHICLE INFORMATION */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span className="w-5 h-5 rounded-full bg-red text-white flex items-center justify-center text-[10px] font-mono">3</span>
                  <span>Vehicle Information (If Applicable / Roadside / Security)</span>
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Make</label>
                    <input
                      type="text"
                      placeholder="e.g. Toyota"
                      value={vehMake}
                      onChange={e => setVehMake(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-red"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Model</label>
                    <input
                      type="text"
                      placeholder="e.g. Corolla / Hilux"
                      value={vehModel}
                      onChange={e => setVehModel(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-red"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">License Plate</label>
                    <input
                      type="text"
                      placeholder="e.g. ND 123-456 GP"
                      value={vehPlate}
                      onChange={e => setVehPlate(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white uppercase font-mono font-bold focus:outline-none focus:border-red"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Color</label>
                    <input
                      type="text"
                      placeholder="e.g. Silver / White"
                      value={vehColor}
                      onChange={e => setVehColor(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-red"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: EMERGENCY SERVICE & DESCRIPTION */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span className="w-5 h-5 rounded-full bg-red text-white flex items-center justify-center text-[10px] font-mono">4</span>
                  <span>Emergency Service & Problem Description</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Emergency Category *</label>
                    <select
                      value={serviceType}
                      onChange={e => setServiceType(e.target.value as ServiceCategory)}
                      className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-red"
                    >
                      <option value="Security Services">🚨 Security / Armed Response</option>
                      <option value="Roadside Assistance">🚗 Roadside Assistance</option>
                      <option value="Towing Services">🚛 Towing / Recovery</option>
                      <option value="Locksmith Services">🔑 Locksmith Assistance</option>
                      <option value="Electrical Services">⚡ Emergency Electrical Hazard</option>
                      <option value="Plumbing">💧 Emergency Plumbing Burst</option>
                      <option value="Medical Assistance">🚑 Medical Assistance</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Photo Upload (Optional)</label>
                    <label className="w-full p-2.5 bg-slate-950 border border-dashed border-slate-700 hover:border-slate-500 rounded-xl text-slate-400 hover:text-white flex items-center justify-center gap-2 cursor-pointer transition-colors">
                      <Camera className="w-4 h-4" />
                      <span>{photoUrl ? 'Photo Attached ✓' : 'Upload Scene Photo'}</span>
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="text-xs">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Describe The Emergency Incident *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe what happened, any immediate hazards, or specific assistance needed..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-red"
                  />
                </div>
              </div>

              {/* SECTION 5: ONE-TIME PAYMENT ACKNOWLEDGEMENT */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                <label className="flex items-start gap-3 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    required
                    checked={agreedToPayFull}
                    onChange={e => setAgreedToPayFull(e.target.checked)}
                    className="mt-0.5 rounded bg-slate-900 border-slate-700 text-red focus:ring-0"
                  />
                  <span className="text-slate-300 leading-relaxed">
                    I understand that I am requesting a <strong>one-time emergency dispatch</strong> as a non-member.
                    I agree to pay the <strong>full applicable service amount</strong> once the work is completed on scene.
                    I understand this will <strong>NOT</strong> enroll me into a monthly subscription or recurring membership.
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
                    <span>Transmitting Emergency Call to Operations...</span>
                  </>
                ) : (
                  <>
                    <Radio className="w-4 h-4 animate-pulse" />
                    <span>DISPATCH EMERGENCY ASSISTANCE NOW</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* VIEW 2: TRACK & PAY FOR EMERGENCY REQUEST */}
        {viewMode === 'track' && (
          <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 animate-fadeIn">
            {/* Lookup input if no tracked job loaded yet */}
            {!trackedJob ? (
              <div className="space-y-4 text-center max-w-md mx-auto py-8">
                <Radio className="w-10 h-10 text-amber-500 mx-auto animate-pulse" />
                <h3 className="text-base font-bold text-white uppercase">Track Active Emergency Request</h3>
                <p className="text-xs text-slate-400">
                  Enter your Emergency Job ID from your confirmation message to monitor live dispatch and complete your payment.
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
              /* LIVE TRACKER & PAYMENT VIEW FOR ACTIVE NON-MEMBER EMERGENCY */
              <div className="space-y-6">
                {/* Reference ID Banner */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-xs">
                  <div>
                    <span className="text-slate-500 uppercase text-[9px] block">Emergency Incident ID</span>
                    <span className="text-sm font-black text-amber-400">REF: #{trackedJob.id.slice(0, 8)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="text-slate-300">Live Satellite Dispatch Interconnect</span>
                  </div>
                </div>

                {/* 6-STAGE WORKFLOW PROGRESS STATUS */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Current Job Status</span>
                      <h4 className="text-base font-black text-white uppercase tracking-wide flex items-center gap-2 mt-0.5">
                        <Shield className="w-5 h-5 text-red animate-pulse" />
                        <span>{trackedJob.status}</span>
                      </h4>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase ${
                      trackedJob.paymentStatus === 'Paid' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      ['Work Completed', 'Payment Pending'].includes(trackedJob.status) ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-red/20 text-red border border-red/30'
                    }`}>
                      {trackedJob.paymentStatus === 'Paid' ? '✓ PAID & CLOSED' : '⚡ IN DISPATCH'}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-700 ${
                        trackedJob.paymentStatus === 'Paid' ? 'bg-emerald-500 w-full' :
                        trackedJob.status === 'Work Completed' ? 'bg-amber-500 w-[95%]' :
                        ['En Route', 'Dispatched', 'Arrived'].includes(trackedJob.status) ? 'bg-red w-[75%]' :
                        'bg-red w-[35%]'
                      }`}
                    ></div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] font-mono text-slate-400 pt-1">
                    <div className="text-white font-bold">1. Request Logged ✓</div>
                    <div className={trackedJob.assignedContractor ? 'text-white font-bold' : ''}>2. Unit Dispatched</div>
                    <div className={['Work Completed', 'Completed', 'Service Completed'].includes(trackedJob.status) ? 'text-white font-bold' : ''}>3. Work Completed</div>
                    <div className={trackedJob.paymentStatus === 'Paid' ? 'text-emerald-400 font-bold' : ''}>4. Payment & Close</div>
                  </div>
                </div>

                {/* Assigned Responder Details if Assigned */}
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
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-red" />
                      <span>{trackedJob.assignedContractor.phone}</span>
                    </a>
                  </div>
                )}

                {/* Summary of Incident & Vehicle on Scene */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">Incident Details</span>
                    <p className="text-white font-semibold">"{trackedJob.description}"</p>
                    <p className="text-[10px] text-slate-400 font-mono">📍 {trackedJob.customerAddress}</p>
                  </div>

                  {trackedJob.customerVehicle && (
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">Customer Vehicle</span>
                      <p className="text-white font-bold">
                        {trackedJob.customerVehicle.make} {trackedJob.customerVehicle.model} ({trackedJob.customerVehicle.year})
                      </p>
                      <p className="text-[10px] text-emerald-400 font-mono font-bold">
                        Plate: {trackedJob.customerVehicle.licensePlate} • Color: {trackedJob.customerVehicle.color}
                      </p>
                    </div>
                  )}
                </div>

                {/* ========================================================================= */}
                {/* PAYMENT SECTION: WHEN WORK IS COMPLETED OR AWAITING PAYMENT               */}
                {/* ========================================================================= */}
                {trackedJob.paymentStatus !== 'Paid' ? (
                  <div className="bg-gradient-to-b from-slate-950 to-slate-900 border-2 border-amber-500/40 rounded-2xl p-6 space-y-4 shadow-xl">
                    <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest block">
                          One-Time Emergency Service Invoice
                        </span>
                        <h4 className="text-base font-bold text-white uppercase mt-0.5">Pay For Completed Service</h4>
                        <p className="text-xs text-slate-400">
                          {trackedJob.servicePerformed || 'Emergency response & incident remediation rendered on-scene.'}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[9px] uppercase font-mono text-slate-400 block">Total Due</span>
                        <span className="text-2xl font-black text-amber-400 font-mono">
                          R{(trackedJob.finalAmount && trackedJob.finalAmount > 0 ? trackedJob.finalAmount : 850.00).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Breakdown */}
                    <div className="space-y-1.5 text-xs font-mono text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      <div className="flex justify-between">
                        <span>Emergency Assistance Dispatch & Labor:</span>
                        <span>R{(trackedJob.finalAmount && trackedJob.finalAmount > 0 ? trackedJob.finalAmount : 850.00).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Monthly Subscription Obligation:</span>
                        <span className="text-emerald-400 font-bold">R0.00 (No Subscription)</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-800 pt-1 text-white font-bold">
                        <span>Final Payable Total:</span>
                        <span className="text-amber-400">R{(trackedJob.finalAmount && trackedJob.finalAmount > 0 ? trackedJob.finalAmount : 850.00).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Payment Form */}
                    <form onSubmit={handlePayFullAmount} className="space-y-4 pt-2">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase text-slate-400">Select Payment Method</label>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          {(['Card', 'EFT', 'Cash'] as const).map(method => (
                            <button
                              key={method}
                              type="button"
                              onClick={() => setPaymentMethod(method)}
                              className={`py-2.5 rounded-xl border font-bold transition-all cursor-pointer ${
                                paymentMethod === method 
                                  ? 'bg-amber-600 border-amber-500 text-white shadow-xs' 
                                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              {method === 'Card' ? '💳 Credit/Debit' : method === 'EFT' ? '🏦 Instant EFT' : '💵 Cash/Terminal'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {paymentMethod === 'Card' && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                          <div className="col-span-2 md:col-span-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Card Number</label>
                            <input
                              type="text"
                              value={cardNumber}
                              onChange={e => setCardNumber(e.target.value)}
                              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Expiry Date</label>
                            <input
                              type="text"
                              value={cardExpiry}
                              onChange={e => setCardExpiry(e.target.value)}
                              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">CVV</label>
                            <input
                              type="password"
                              maxLength={4}
                              value={cardCvv}
                              onChange={e => setCardCvv(e.target.value)}
                              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isPaying}
                        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg cursor-pointer flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                      >
                        {isPaying ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Processing Secure One-Time Payment...</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4" />
                            <span>
                              PAY FULL AMOUNT (R{(trackedJob.finalAmount && trackedJob.finalAmount > 0 ? trackedJob.finalAmount : 850.00).toFixed(2)}) & CLOSE REQUEST
                            </span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                ) : (
                  /* PAYMENT CONFIRMED RECEIPT VIEW */
                  <div className="bg-emerald-950/30 border-2 border-emerald-500/50 rounded-2xl p-6 text-center space-y-3 shadow-xl animate-fadeIn">
                    <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="w-7 h-7" />
                    </div>
                    <h4 className="text-base font-bold text-white uppercase">Payment Confirmed • Request Completed</h4>
                    <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                      Thank you for choosing Same Day Assist. Your one-time emergency assistance has been completed and fully paid.
                    </p>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-400 inline-block">
                      Amount Paid: <strong className="text-emerald-400">R{(trackedJob.finalAmount || 850).toFixed(2)}</strong> • Status: <strong className="text-emerald-400">PAID & CLOSED</strong>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-[9px] font-mono text-slate-500 z-10">
        © 2026 SAME DAY ASSIST • RAPID PATROL & EMERGENCY RESPONSE NETWORK • 24/7 HOTLINE: +27 11 555 9111
      </footer>
    </div>
  );
}
