import React, { useState } from 'react';
import { 
  Shield, AlertTriangle, Phone, CreditCard, 
  Zap, Droplet, Hammer, Camera, Send, Info, CheckCircle,
  FileText, Edit3 
} from 'lucide-react';
import { useAppState } from '../../contexts/AppStateContext';
import { useAuth } from '../../contexts/AuthContext';
import { ServiceCategory } from '../../types';
import { SERVICE_PACKAGES } from '../../data/staticData';
import EmptyState from '../shared/EmptyState';
import ConfirmDialog from '../shared/ConfirmDialog';

interface CustomerHomeProps {
  activeCustomer: any;
  activeJob: any;
  assignedContractor: any;
  onNavigateTab: (tab: 'home' | 'profile' | 'invoices') => void;
}

export default function CustomerHome({
  activeCustomer,
  activeJob,
  assignedContractor,
  onNavigateTab,
}: CustomerHomeProps) {
  const { state, createEnquiry, createJob, initiatePayment, addAuditLogLocal } = useAppState();
  
  // Onboarding Form
  const [enquiryName, setEnquiryName] = useState(activeCustomer?.name || '');
  const [enquiryEmail, setEnquiryEmail] = useState(activeCustomer?.email || '');
  const [enquiryPhone, setEnquiryPhone] = useState(activeCustomer?.phone || '');
  const [enquiryAddress, setEnquiryAddress] = useState(activeCustomer?.address || '');
  const [enquiryCategory, setEnquiryCategory] = useState<ServiceCategory>('Security Services');
  const [enquiryNotes, setEnquiryNotes] = useState('');
  const [selectedPkgId, setSelectedPkgId] = useState('pkg-platinum');
  
  // Assistance Form
  const [assistCategory, setAssistCategory] = useState<ServiceCategory>('Security Services');

  const [assistDesc, setAssistDesc] = useState('');
  const [assistPhoto, setAssistPhoto] = useState<string | null>(null);
  
  // Panic Button States
  const [isEmergencyArmed, setIsEmergencyArmed] = useState(false);
  const [isTriggeringEmergency, setIsTriggeringEmergency] = useState(false);
  const [isConfirmPanicOpen, setIsConfirmPanicOpen] = useState(false);

  // Photo Attachment helper
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAssistPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enquiryName || !enquiryEmail || !enquiryPhone || !enquiryAddress) {
      alert('Please fill in all required onboarding fields.');
      return;
    }
    try {
      await createEnquiry({
        name: enquiryName,
        email: enquiryEmail,
        phone: enquiryPhone,
        address: enquiryAddress,
        serviceCategory: enquiryCategory,
        notes: enquiryNotes || 'Interested in emergency assist plan',
      });
      addAuditLogLocal('Enquiry Created', `Prospective customer ${enquiryName} submitted onboarding request.`);
      alert('Your Onboarding Survey Request has been submitted successfully! An inspector will contact you shortly to perform the safety compliance audit.');
    } catch (err: any) {
      alert(err.message || 'Failed to submit survey request');
    }
  };

  const handleAssistanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assistDesc) {
      alert('Please describe your emergency.');
      return;
    }
    try {
      await createJob({
        serviceType: assistCategory,
        description: assistDesc,
        photoUrl: assistPhoto || undefined,
      });
      setAssistDesc('');
      setAssistPhoto(null);
    } catch (err: any) {
      alert(err.message || 'Failed to request assistance');
    }
  };

  const triggerPanicEmergency = async () => {
    setIsTriggeringEmergency(true);
    setTimeout(async () => {
      try {
        await createJob({
          serviceType: 'Security',
          description: 'CRITICAL SECURITY THREAT: Assistance Button Pressed in Mobile App',
        });
        addAuditLogLocal('Emergency Assistance Triggered', `Customer ${activeCustomer?.name} triggered the emergency assistance button! Dispatching armed response.`);
        
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const speech = new SpeechSynthesisUtterance(`Warning. Emergency assistance trigger received. Armed security response cruiser has been dispatched. ETA 8 minutes.`);
          speech.rate = 1.05;
          speech.pitch = 1.0;
          window.speechSynthesis.speak(speech);
        }
      } catch (err: any) {
        alert(err.message || 'Failed to trigger panic');
      } finally {
        setIsTriggeringEmergency(false);
        setIsEmergencyArmed(false);
      }
    }, 2000);
  };

  const handleManualPayClick = async () => {
    try {
      await initiatePayment('Onboarding Fee', 1500);
      addAuditLogLocal('Membership Activated', `Customer paid R1500 onboarding activation fee.`);
    } catch (err: any) {
      alert(err.message || 'Failed to complete payment');
    }
  };

  // Check if active customer has active membership status or is a logged-in demo account
  const isApprovedCustomer = 
    activeCustomer?.status === 'ACTIVE' || 
    activeCustomer?.status === 'Active' || 
    activeCustomer?.onboardingStatus === 'ACTIVE' || 
    Boolean(activeCustomer);

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* ONBOARDING TRACKER FOR PROSPECTS/PENDING MEMBERS */}
      {!isApprovedCustomer && state.currentStep !== 'MEMBERSHIP_ACTIVATED' && state.currentStep !== 'CUSTOMER_LOGIN' && !activeJob && (
        <div className="bg-amber-50/80 border-l-4 border-amber-500 p-4 rounded-r-2xl text-xs flex flex-col gap-2 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-amber-800">
            <Info className="w-4 h-4 shrink-0" />
            <span className="uppercase tracking-wider">Membership Onboarding Process</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Same Day Assist requires a property audit and pre-compliance clearance check before activating priority panic response protocols.
          </p>
          <div className="grid grid-cols-4 gap-1.5 mt-2 text-[9.5px] font-bold text-center">
            <div className={`p-1.5 rounded-lg ${state.currentStep === 'PROSPECT' ? 'bg-navy text-white' : 'bg-slate-200 text-slate-500'}`}>Enquiry</div>
            <div className={`p-1.5 rounded-lg ${state.currentStep === 'ASSESSMENT_SCHEDULED' || state.currentStep === 'CONTRACTOR_ASSESSING' || state.currentStep === 'ASSESSMENT_UPLOADED' ? 'bg-navy text-white' : 'bg-slate-200 text-slate-500'}`}>Survey</div>
            <div className={`p-1.5 rounded-lg ${state.currentStep === 'QUOTE_GENERATED' ? 'bg-navy text-white' : 'bg-slate-200 text-slate-500'}`}>Quotation</div>
            <div className={`p-1.5 rounded-lg ${state.currentStep === 'CUSTOMER_APPROVED' ? 'bg-navy text-white' : 'bg-slate-200 text-slate-500'}`}>Activate</div>
          </div>
        </div>
      )}

      {/* 1. MARKETING / ENQUIRY STAGE */}
      {!isApprovedCustomer && state.currentStep === 'PROSPECT' && (
        <div className="flex flex-col gap-5 animate-fadeIn">
          <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-navy to-navy-light text-white p-6 shadow-md relative">
            <div className="absolute top-4 right-4 opacity-10">
              <Shield className="w-28 h-28" />
            </div>
            <span className="text-[9px] font-extrabold bg-red text-white px-2.5 py-0.5 rounded-full tracking-wider uppercase">SABS & PSIRA COVERED</span>
            <h2 className="text-xl font-brand-header tracking-tight mt-3 leading-tight uppercase">Soweto to Sandton Emergency Dispatch</h2>
            <p className="text-slate-300 text-[11px] mt-2 leading-relaxed">
              Subscribe to the most reliable rapid-response dispatch network in Johannesburg. Subsidized home repairs and instant 24/7 armed cruiser panic assistance.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold text-navy uppercase tracking-wider mb-2">Package Offerings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {SERVICE_PACKAGES.map(pkg => (
                <div 
                  key={pkg.id}
                  onClick={() => setSelectedPkgId(pkg.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    selectedPkgId === pkg.id 
                      ? 'bg-navy/5 border-navy shadow-xs' 
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-navy">{pkg.name}</span>
                      {selectedPkgId === pkg.id && <span className="w-2.5 h-2.5 bg-red rounded-full"></span>}
                    </div>
                    <p className="text-lg font-brand-header text-navy">R{pkg.price}<span className="text-[10px] text-slate-400 font-normal"> / month</span></p>
                    <ul className="text-[9px] text-slate-500 space-y-1 mt-3">
                      {pkg.benefits.slice(0, 3).map((b, i) => (
                        <li key={i} className="flex items-center gap-1">
                          <span className="text-red">✓</span> {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleEnquirySubmit} className="bg-slate-900 text-slate-100 p-6 rounded-3xl border-2 border-red-500/50 shadow-xl flex flex-col gap-4">
            <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Request Onboarding Survey</h3>
                  <span className="bg-red-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">Required</span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">Fill in details to set up a mandatory compliance & safety survey of your property</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <input 
                type="text" 
                placeholder="Full Name" 
                required
                value={enquiryName}
                onChange={e => setEnquiryName(e.target.value)}
                className="text-xs p-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:border-red-500 text-white placeholder-slate-400"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  required
                  value={enquiryEmail}
                  onChange={e => setEnquiryEmail(e.target.value)}
                  className="text-xs p-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:border-red-500 text-white placeholder-slate-400"
                />
                <input 
                  type="tel" 
                  placeholder="Mobile Phone" 
                  required
                  value={enquiryPhone}
                  onChange={e => setEnquiryPhone(e.target.value)}
                  className="text-xs p-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:border-red-500 text-white placeholder-slate-400"
                />
              </div>
              <input 
                type="text" 
                placeholder="Physical Street Address (Sandton, Johannesburg)" 
                required
                value={enquiryAddress}
                onChange={e => setEnquiryAddress(e.target.value)}
                className="text-xs p-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:border-red-500 text-white placeholder-slate-400"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-300 uppercase">Primary Assistance Needed</label>
                  <select
                    value={enquiryCategory}
                    onChange={e => setEnquiryCategory(e.target.value as ServiceCategory)}
                    className="text-xs p-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:border-red-500 text-white font-bold"
                  >
                    <option value="Security Systems Assistance">🛡️ Security Systems Assistance</option>
                    <option value="Solar Systems Assistance">☀️ Solar Systems Assistance</option>
                    <option value="Electrical Assistance">⚡ Electrical Assistance</option>
                    <option value="Plumbing Assistance">💧 Plumbing Assistance</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-300 uppercase">Onboarding Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="Electric fence details, gate code, dogs on property, etc."
                    value={enquiryNotes}
                    onChange={e => setEnquiryNotes(e.target.value)}
                    className="text-xs p-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:border-red-500 text-white placeholder-slate-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs py-3.5 rounded-xl tracking-wider shadow-lg shadow-red-600/30 uppercase cursor-pointer transition-all mt-1"
              >
                Submit Survey Request
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. INTERESTED / ENQUIRY RECEIVED (Awaiting Survey) */}
      {(state.currentStep === 'INTERESTED' || state.currentStep === 'ENQUIRY_RECEIVED' || state.currentStep === 'ASSESSMENT_SCHEDULED' || state.currentStep === 'CONTRACTOR_ASSESSING') && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center flex flex-col gap-4 animate-fadeIn">
          <EmptyState 
            icon={Shield}
            title="Survey Verification Scheduled"
            description="Our Operations Center is dispatching a surveyor to your physical property to run a compliance safety check. You will be notified as soon as the survey report has been generated."
          />
        </div>
      )}

      {/* 3. SURVEY UPLOADED (Awaiting Quote Generation / Approval) */}
      {state.currentStep === 'ASSESSMENT_UPLOADED' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 text-center flex flex-col gap-4 animate-fadeIn">
          <EmptyState 
            icon={Info}
            title="Survey Uploaded — Awaiting Quotation"
            description="Your property survey is complete. Our administrators are compiling a quotation for any mandatory compliance repairs."
          />
        </div>
      )}

      {/* 4. QUOTE GENERATED (Awaiting approval) */}
      {state.currentStep === 'QUOTE_GENERATED' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col gap-4 animate-fadeIn">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-navy uppercase tracking-wider">Onboarding Quotation Received</h3>
            <p className="text-[9px] text-slate-400">Pre-membership compliance repairs must be approved</p>
          </div>
          {state.quotations.filter(q => q.status === 'Pending').map(quote => (
            <div key={quote.id} className="border border-slate-100 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-600">Quotation ID: {quote.id}</span>
                <span className="font-brand-header text-red text-sm font-bold">R{quote.amount}</span>
              </div>
              <div className="space-y-1.5">
                {quote.lineItems.map(item => (
                  <div key={item.id} className="flex justify-between items-center text-[10px] text-slate-500 border-b border-slate-50 pb-1">
                    <span>{item.description}</span>
                    <span className="font-bold">R{item.cost}</span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('invoices')}
                className="w-full bg-navy text-white text-xs font-brand-header py-2.5 rounded-xl hover:bg-navy-light uppercase tracking-wider transition-all cursor-pointer mt-2"
              >
                Review & Approve Quotation
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 5. APPROVED (Awaiting Co-Pay Repair Activation) */}
      {state.currentStep === 'CUSTOMER_APPROVED' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col gap-4 text-center items-center animate-fadeIn">
          <div className="p-3 bg-red/10 rounded-full text-red mb-1">
            <CreditCard className="w-8 h-8 animate-pulse" />
          </div>
          <h3 className="text-xs font-bold text-navy uppercase tracking-wider">Payment Activation Required</h3>
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
            Your quotation has been approved. Complete the ZAR R1,500 onboarding co-payment to schedule compliance updates and activate your rapid panic response coverage.
          </p>
          <button
            type="button"
            onClick={handleManualPayClick}
            className="w-full max-w-xs bg-red hover:bg-red/90 text-white font-brand-header text-xs py-3 rounded-xl uppercase tracking-wider shadow-xs cursor-pointer mt-2"
          >
            Pay R1,500 Co-Pay Fee
          </button>
        </div>
      )}

      {/* 6. MEMBERSHIP ACTIVE: Panic Dispatch Panel & Active Customer Features */}
      {(isApprovedCustomer || state.currentStep === 'MEMBERSHIP_ACTIVATED' || state.currentStep === 'CUSTOMER_LOGIN') && !activeJob && (
        <div className="flex flex-col gap-5 animate-fadeIn">
          {/* ACTIVE MEMBERSHIP PROFILE CARD */}
          <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-red/20 border border-red/40 flex items-center justify-center text-red font-bold shrink-0">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold tracking-wide text-white">{activeCustomer?.name || 'Active Member'}</h3>
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    ● ACTIVE & COVERED
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activeCustomer?.package || 'Diamond Assist'} Plan • {activeCustomer?.accountType || 'Residential'} • {activeCustomer?.address || 'Sandton, JHB'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
              <Zap className="w-3.5 h-3.5 text-red animate-pulse" />
              <span>SLA: 15-MIN ARMED RESPONSE</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs text-center flex flex-col items-center justify-center gap-3">
            <h3 className="text-xs font-bold text-navy uppercase tracking-wider">EMERGENCY CRITICAL ASSISTANCE</h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
              Press and hold the assistance button below for 2 seconds to instantly summon armed security or responder cruisers to your address.
            </p>

            <div className="relative my-4">
              {isTriggeringEmergency ? (
                <div className="w-28 h-28 rounded-full bg-red text-white flex items-center justify-center font-brand-header text-xs shadow-2xl animate-ping border-4 border-white">
                  DISPATCHING...
                </div>
              ) : (
                <button
                  onMouseDown={() => setIsEmergencyArmed(true)}
                  onMouseUp={() => { if (isEmergencyArmed) triggerPanicEmergency(); }}
                  onMouseLeave={() => setIsEmergencyArmed(false)}
                  onTouchStart={() => setIsEmergencyArmed(true)}
                  onTouchEnd={() => { if (isEmergencyArmed) triggerPanicEmergency(); }}
                  className={`w-28 h-28 rounded-full flex flex-col items-center justify-center text-white transition-all duration-200 border-[6px] border-slate-950 shadow-2xl ${
                    isEmergencyArmed 
                      ? 'bg-red-700 scale-95 shadow-inner' 
                      : 'bg-red hover:bg-red/95 animate-pulse cursor-pointer'
                  }`}
                >
                  <AlertTriangle className="w-7 h-7 mb-1" />
                  <span className="font-brand-header text-xs">ASSISTANCE</span>
                  <span className="text-[7.5px] uppercase font-mono tracking-widest text-white/80">HOLD 2s</span>
                </button>
              )}
            </div>

            <div className="text-[9px] text-slate-400 font-mono uppercase tracking-tight">
              {isEmergencyArmed ? (
                <span className="text-red font-bold animate-pulse">ARMED! RELEASE TO CONFIRM</span>
              ) : (
                <span>DISPATCH INTERCONNECT: CONNECTED</span>
              )}
            </div>
          </div>

          {/* NORMAL ASSISTANCE REQUEST FORM */}
          <form onSubmit={handleAssistanceSubmit} className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-md flex flex-col gap-4">
            <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
              <div>
                <h4 className="text-sm font-bold text-navy uppercase tracking-wider flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-red" />
                  <span>Log Non-Emergency Repair</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">Request regular contractor maintenance assistance</p>
              </div>
              <span className="text-[10px] font-bold font-mono bg-slate-100 text-navy px-2.5 py-1 rounded-full border border-slate-200">
                CATEGORY: {assistCategory.toUpperCase()}
              </span>
            </div>

            <div className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Select Trade Specialty:
                </label>
                <div className="flex gap-1.5">
                  {(['Security', 'Electrical', 'Plumbing', 'Construction'] as ServiceCategory[]).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setAssistCategory(cat)}
                      className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        assistCategory === cat 
                          ? 'bg-navy border-navy text-white shadow-xs' 
                          : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* PROBLEM DESCRIPTION INPUT BOX */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-navy" />
                    <span>Describe Your Problem / Repair Request <span className="text-red font-bold">*</span></span>
                  </label>
                  <span className="text-[11px] font-mono text-slate-600 font-semibold">
                    {assistDesc.length > 0 ? `${assistDesc.length} characters typed` : 'Required'}
                  </span>
                </div>

                <div className="relative">
                  <textarea
                    placeholder="Type your problem here... (e.g. Electric fence sensor is tripping intermittently, gate motor battery needs replacement, or water leak under bathroom sink)"
                    required
                    value={assistDesc}
                    onChange={e => setAssistDesc(e.target.value)}
                    rows={4}
                    style={{ color: '#000000', backgroundColor: '#FFFFFF' }}
                    className="w-full text-sm p-4 bg-white border-2 border-slate-400 rounded-xl resize-none text-black font-semibold placeholder:text-slate-500 placeholder:font-normal placeholder:opacity-100 focus:bg-white focus:border-navy focus:ring-3 focus:ring-navy/20 focus:outline-none transition-all shadow-inner leading-relaxed"
                  />
                </div>
                
                <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium px-1">
                  <span>✍️ Type clear problem details above before clicking Submit.</span>
                  {assistDesc.trim() && (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Ready to dispatch
                    </span>
                  )}
                </div>

                {/* LIVE CONFIRMATION PREVIEW */}
                {assistDesc.trim().length > 0 && (
                  <div className="bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 animate-fadeIn">
                    <span className="font-bold text-[10px] text-slate-500 uppercase block mb-0.5">Live Description Preview:</span>
                    <p className="font-semibold text-black whitespace-pre-wrap leading-relaxed">{assistDesc}</p>
                  </div>
                )}
              </div>

              {/* PHOTO ATTACHMENT */}
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-3.5 text-center relative bg-slate-50 hover:bg-slate-100/80 transition-colors">
                {assistPhoto ? (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-emerald-700 font-bold flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" /> Incident Photo Attached
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setAssistPhoto(null)} 
                      className="text-xs text-red font-bold hover:underline cursor-pointer"
                    >
                      Remove Photo
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center justify-center py-2">
                    <Camera className="w-5 h-5 text-slate-500 mb-1" />
                    <span className="text-xs text-slate-700 font-bold">Upload Incident Photo (Optional)</span>
                    <span className="text-[10px] text-slate-500">Attach a photo of the repair issue for the responder</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handlePhotoUpload}
                    />
                  </label>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-navy hover:bg-navy/90 text-white py-3.5 rounded-xl text-xs font-brand-header tracking-wider shadow-md uppercase flex items-center justify-center gap-2 cursor-pointer mt-1 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Submit Repair Dispatch</span>
              </button>
            </div>
          </form>

          {/* EMERGENCY PHONE TRAY */}
          <div className="bg-red/5 p-4 rounded-3xl border border-red/10 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red/15 rounded-xl text-red">
                <Phone className="w-4 h-4 animate-pulse" />
              </div>
              <div className="text-left">
                <p className="text-[9px] font-bold text-red uppercase tracking-wider">Direct Voice Hotline</p>
                <p className="text-xs font-mono font-bold text-navy">+27 (11) 555-9111</p>
              </div>
            </div>
            <a href="tel:+27115559111" className="px-4 py-2 bg-red text-white text-[10px] font-bold rounded-xl hover:bg-red/90 transition-all shadow-xs">
              Call Dispatcher
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
