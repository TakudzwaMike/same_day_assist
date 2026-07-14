import React, { useState } from 'react';
import { 
  Shield, AlertTriangle, Phone, MapPin, CreditCard, FileText, Star, 
  Upload, CheckCircle, Bell, ChevronRight, Zap, Droplet, Hammer, 
  Info, Camera, Clock, Check, Send, AlertCircle, User
} from 'lucide-react';
import { AppState, ServiceCategory, ServicePackage, Enquiry, Quotation, Job } from '../types';
import { SERVICE_PACKAGES } from '../data/mockData';

interface CustomerAppProps {
  state: AppState;
  updateState: (newState: Partial<AppState>) => void;
  addAuditLog: (action: string, details: string) => void;
}

export default function CustomerApp({ state, updateState, addAuditLog }: CustomerAppProps) {
  const [enquiryName, setEnquiryName] = useState('');
  const [enquiryEmail, setEnquiryEmail] = useState('');
  const [enquiryPhone, setEnquiryPhone] = useState('');
  const [enquiryAddress, setEnquiryAddress] = useState('');
  const [enquiryCategory, setEnquiryCategory] = useState<ServiceCategory>('Security');
  const [enquiryNotes, setEnquiryNotes] = useState('');
  const [selectedPkgId, setSelectedPkgId] = useState('pkg-platinum');
  const [photoFile, setPhotoFile] = useState<string | null>(null);
  
  // Assistance Request states
  const [assistCategory, setAssistCategory] = useState<ServiceCategory>('Security');
  const [assistDesc, setAssistDesc] = useState('');
  const [assistPhoto, setAssistPhoto] = useState<string | null>(null);
  const [isEmergencyArmed, setIsEmergencyArmed] = useState(false);
  const [isTriggeringEmergency, setIsTriggeringEmergency] = useState(false);

  // Rating stars
  const [ratingVal, setRatingVal] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  // Active customer info
  const activeCustomer = state.customers.find(c => c.status === 'Active' || c.status === 'Onboarding') || state.customers[0];

  // Device viewports navigation
  const [activeDeviceTab, setActiveDeviceTab] = useState<'home' | 'profile' | 'invoices'>('home');

  // Edit profile local states
  const [profileName, setProfileName] = useState(activeCustomer?.name || '');
  const [profileEmail, setProfileEmail] = useState(activeCustomer?.email || '');
  const [profilePhone, setProfilePhone] = useState(activeCustomer?.phone || '');
  const [profileAddress, setProfileAddress] = useState(activeCustomer?.address || '');
  const [profileSavedMsg, setProfileSavedMsg] = useState(false);

  // Sync profile local state if activeCustomer changes
  React.useEffect(() => {
    if (activeCustomer) {
      setProfileName(activeCustomer.name);
      setProfileEmail(activeCustomer.email);
      setProfilePhone(activeCustomer.phone);
      setProfileAddress(activeCustomer.address);
    }
  }, [activeCustomer?.id]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName || !profileEmail || !profilePhone || !profileAddress) {
      alert('Please fill in all profile fields.');
      return;
    }
    const updatedCustomers = state.customers.map(c => 
      c.id === activeCustomer.id 
        ? { ...c, name: profileName, email: profileEmail, phone: profilePhone, address: profileAddress } 
        : c
    );
    updateState({ customers: updatedCustomers });
    addAuditLog('Profile Updated', `Customer ${profileName} updated their profile info: ${profilePhone}, ${profileAddress}`);
    setProfileSavedMsg(true);
    setTimeout(() => setProfileSavedMsg(false), 3000);
  };

  // Helper: Photo upload simulation
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

  // Submit enquiry ("I'm Interested")
  const handleSubmitEnquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enquiryName || !enquiryEmail || !enquiryPhone || !enquiryAddress) {
      alert('Please fill in all required fields.');
      return;
    }

    const newEnq: Enquiry = {
      id: `enq-${Date.now().toString().slice(-3)}`,
      customerName: enquiryName,
      email: enquiryEmail,
      phone: enquiryPhone,
      address: enquiryAddress,
      serviceCategory: enquiryCategory,
      notes: enquiryNotes,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    // Update global state
    const updatedEnquiries = [newEnq, ...state.enquiries];
    
    // Add corresponding onboarding customer record
    const newCust = {
      id: `cust-${Date.now().toString().slice(-3)}`,
      name: enquiryName,
      email: enquiryEmail,
      phone: enquiryPhone,
      address: enquiryAddress,
      status: 'Onboarding' as const,
      package: (selectedPkgId === 'pkg-gold' ? 'Gold' : selectedPkgId === 'pkg-platinum' ? 'Platinum' : 'Diamond') as 'Gold' | 'Platinum' | 'Diamond',
      repairsCount: 0,
      totalPaid: 0
    };

    const updatedCustomers = [...state.customers.filter(c => c.email !== enquiryEmail), newCust];

    updateState({
      enquiries: updatedEnquiries,
      customers: updatedCustomers,
      currentStep: 'INTERESTED'
    });

    addAuditLog('Enquiry Created', `Prospective customer ${enquiryName} submitted an onboarding interest form.`);
    
    // Reset form
    setEnquiryName('');
    setEnquiryEmail('');
    setEnquiryPhone('');
    setEnquiryAddress('');
    setEnquiryNotes('');
  };

  // Approve Quotation
  const handleApproveQuotation = (quoteId: string) => {
    const updatedQuotations = state.quotations.map(q => 
      q.id === quoteId ? { ...q, status: 'Approved' as const, approvedAt: new Date().toISOString() } : q
    );
    
    updateState({
      quotations: updatedQuotations,
      currentStep: 'CUSTOMER_APPROVED'
    });
    
    addAuditLog('Quotation Approved', `Customer approved onboarding quotation ${quoteId} for mandatory pre-membership repairs.`);
  };

  // Pay activation & Activate Membership
  const handlePayActivation = () => {
    // Generate Invoice/Payment entry
    const matchingCust = state.customers.find(c => c.status === 'Onboarding') || state.customers[0];
    const newPayment = {
      id: `pay-${Date.now().toString().slice(-3)}`,
      customerId: matchingCust.id,
      customerName: matchingCust.name,
      type: 'Onboarding Fee' as const,
      amount: 1500, // Onboarding repairs + premium co-pay
      status: 'Paid' as const,
      date: new Date().toISOString().slice(0, 10)
    };

    // Update customer status to Active
    const updatedCustomers = state.customers.map(c => 
      c.id === matchingCust.id ? { ...c, status: 'Active' as const, memberSince: new Date().toISOString().slice(0, 10), totalPaid: c.totalPaid + 1500 } : c
    );

    updateState({
      customers: updatedCustomers,
      payments: [newPayment, ...state.payments],
      currentStep: 'MEMBERSHIP_ACTIVATED'
    });

    addAuditLog('Membership Activated', `Customer ${matchingCust.name} completed payment. Membership is officially ACTIVE.`);
  };

  // Request regular assistance
  const handleRequestAssistance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assistDesc) {
      alert('Please describe your emergency.');
      return;
    }

    const newJob: Job = {
      id: `job-${Date.now().toString().slice(-3)}`,
      customerId: activeCustomer.id,
      customerName: activeCustomer.name,
      customerPhone: activeCustomer.phone,
      customerAddress: activeCustomer.address,
      serviceType: assistCategory,
      description: assistDesc,
      photoUrl: assistPhoto || undefined,
      status: 'Requested',
      trackerProgress: 10,
      createdAt: new Date().toISOString()
    };

    updateState({
      jobs: [newJob, ...state.jobs],
      currentStep: 'REQUEST_ASSISTANCE'
    });

    addAuditLog('Assistance Requested', `Customer ${activeCustomer.name} logged an assistance request for ${assistCategory}: "${assistDesc}".`);
    
    // Reset
    setAssistDesc('');
    setAssistPhoto(null);
  };

  // Immediate red panic button helper
  const handleTriggerPanicButton = () => {
    setIsTriggeringEmergency(true);
    setTimeout(() => {
      const newJob: Job = {
        id: `job-panic-${Date.now().toString().slice(-3)}`,
        customerId: activeCustomer.id,
        customerName: activeCustomer.name,
        customerPhone: activeCustomer.phone,
        customerAddress: activeCustomer.address,
        serviceType: 'Security',
        description: 'CRITICAL SECURITY THREAT: Panic Button Pressed in Mobile App',
        status: 'Requested',
        trackerProgress: 15,
        createdAt: new Date().toISOString()
      };

      updateState({
        jobs: [newJob, ...state.jobs],
        currentStep: 'REQUEST_ASSISTANCE'
      });

      addAuditLog('Emergency Panic Triggered', `Customer ${activeCustomer.name} triggered the CRITICAL RED EMERGENCY PANIC BUTTON! Dispatching armed response immediately.`);
      
      // Voice alert dispatcher simulation
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const speech = new SpeechSynthesisUtterance(`Warning. Emergency panic trigger received. Armed security response cruiser has been dispatched to ${activeCustomer.address}. Control room has confirmed. ETA 8 minutes.`);
        speech.rate = 1.0;
        speech.pitch = 1.05;
        window.speechSynthesis.speak(speech);
      }

      setIsTriggeringEmergency(false);
      setIsEmergencyArmed(false);
    }, 2500);
  };

  // Rate active job
  const handleRateJob = (jobId: string) => {
    const updatedJobs = state.jobs.map(j => 
      j.id === jobId ? { ...j, status: 'Rated' as const, rating: ratingVal, ratingComment: ratingComment, trackerProgress: 100 } : j
    );

    updateState({
      jobs: updatedJobs,
      currentStep: 'CUSTOMER_RATING'
    });

    addAuditLog('Job Rated', `Customer rated Job ${jobId} with ${ratingVal} stars. Comments: "${ratingComment}"`);
    setRatingComment('');
  };

  // Active Job helper
  const activeJob = state.jobs.find(j => j.customerId === activeCustomer.id && j.status !== 'Closed' && j.status !== 'Rated');
  const assignedContractor = activeJob ? state.contractors.find(c => c.id === activeJob.assignedContractorId) : null;

  return (
    <div className="w-full bg-white border border-slate-200 rounded-3xl shadow-lg flex flex-col overflow-hidden animate-fadeIn">
      {/* Same Day Assist Header */}
      <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-navy p-2 rounded-xl text-white">
            <Shield className="w-6 h-6 text-red" />
          </div>
          <div>
            <h1 className="text-lg font-black italic text-navy leading-none uppercase">Same Day Assist</h1>
            <p className="text-[10px] font-bold text-red tracking-wider uppercase">Consumer Portal • Sandton Dispatch Lines</p>
          </div>
        </div>

        {/* Web Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200 w-full md:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveDeviceTab('home')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeDeviceTab === 'home'
                ? 'bg-white text-navy shadow-xs'
                : 'text-slate-500 hover:text-navy hover:bg-slate-50'
            }`}
          >
            <Shield className="w-4 h-4 text-red" />
            <span>Emergency & Coverage</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveDeviceTab('invoices')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeDeviceTab === 'invoices'
                ? 'bg-white text-navy shadow-xs'
                : 'text-slate-500 hover:text-navy hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span>My Invoices</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveDeviceTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeDeviceTab === 'profile'
                ? 'bg-white text-navy shadow-xs'
                : 'text-slate-500 hover:text-navy hover:bg-slate-50'
            }`}
          >
            <User className="w-4 h-4 text-slate-500" />
            <span>Profile Settings</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="tel:+27115559111"
            className="flex items-center gap-2 px-3 py-1.5 bg-red/5 hover:bg-red/10 border border-red/10 text-red text-xs font-bold rounded-xl transition-all"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Hotline Support</span>
          </a>
          <div className="relative">
            <Bell className="w-5 h-5 text-slate-500 cursor-pointer hover:text-navy" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red rounded-full"></span>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 flex-1 bg-slate-50/50">
        <div className="max-w-4xl mx-auto flex flex-col gap-6">

          {activeDeviceTab === 'home' && (
            <>

            {/* STATUS CHANGER / ALERT IF ONBOARDING */}
            {state.currentStep !== 'MEMBERSHIP_ACTIVATED' && state.currentStep !== 'CUSTOMER_LOGIN' && !activeJob && (
              <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-r-xl text-xs flex flex-col gap-1 shadow-sm">
                <div className="flex items-center gap-1.5 font-bold text-amber-800">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>Onboarding Status Tracker</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">
                  Your onboarding process with Same Day Assist is currently in progress. 
                </p>
                
                {/* Micro Steps Visual */}
                <div className="grid grid-cols-4 gap-1 mt-2 text-[9px] text-center font-bold">
                  <div className={`p-1 rounded ${state.currentStep === 'PROSPECT' ? 'bg-navy text-white' : 'bg-slate-200 text-slate-500'}`}>Enquiry</div>
                  <div className={`p-1 rounded ${state.currentStep === 'ASSESSMENT_SCHEDULED' || state.currentStep === 'CONTRACTOR_ASSESSING' || state.currentStep === 'ASSESSMENT_UPLOADED' ? 'bg-navy text-white' : 'bg-slate-200 text-slate-500'}`}>Survey</div>
                  <div className={`p-1 rounded ${state.currentStep === 'QUOTE_GENERATED' ? 'bg-navy text-white' : 'bg-slate-200 text-slate-500'}`}>Quotation</div>
                  <div className={`p-1 rounded ${state.currentStep === 'CUSTOMER_APPROVED' ? 'bg-navy text-white' : 'bg-slate-200 text-slate-500'}`}>Activate</div>
                </div>
              </div>
            )}

            {/* ----------------- PHASE 1: PROSPECT / INITIAL LANDING ----------------- */}
            {state.currentStep === 'PROSPECT' && (
              <div className="flex flex-col gap-4 animate-fadeIn">
                <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-navy to-navy-light text-white p-5 shadow-lg relative">
                  <div className="absolute top-2 right-2 opacity-10">
                    <Shield className="w-24 h-24" />
                  </div>
                  <span className="text-[10px] font-bold bg-red text-white px-2 py-0.5 rounded-full tracking-wider uppercase">ZAR Premium Coverage</span>
                  <h2 className="text-xl font-brand-header tracking-tight mt-2 leading-tight">FAST RESPONSE. REAL SOLUTIONS. PEACE OF MIND.</h2>
                  <p className="text-slate-300 text-[11px] mt-1.5 leading-relaxed">
                    Soweto to Sandton, secure your property with instant access to on-demand Security, Plumbing, Electrical, & Construction emergencies.
                  </p>
                </div>

                {/* Benefits / Services Offered list */}
                <div>
                  <h3 className="text-xs font-bold text-navy uppercase tracking-wider mb-2">Our Services</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-100 flex items-center gap-2 shadow-2xs">
                      <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                      <div>
                        <p className="text-[11px] font-bold text-slate-800">Electrical</p>
                        <p className="text-[9px] text-slate-400">Emergency Trips</p>
                      </div>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-100 flex items-center gap-2 shadow-2xs">
                      <Droplet className="w-4 h-4 text-blue-500 shrink-0" />
                      <div>
                        <p className="text-[11px] font-bold text-slate-800">Plumbing</p>
                        <p className="text-[9px] text-slate-400">Burst Pipes & Geysers</p>
                      </div>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-100 flex items-center gap-2 shadow-2xs">
                      <Shield className="w-4 h-4 text-red shrink-0" />
                      <div>
                        <p className="text-[11px] font-bold text-slate-800">Security</p>
                        <p className="text-[9px] text-slate-400">Armed & Alarms</p>
                      </div>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-100 flex items-center gap-2 shadow-2xs">
                      <Hammer className="w-4 h-4 text-emerald-500 shrink-0" />
                      <div>
                        <p className="text-[11px] font-bold text-slate-800">Construction</p>
                        <p className="text-[9px] text-slate-400">Structural Failure</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Onboarding Interest Form */}
                <form onSubmit={handleSubmitEnquiry} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3">
                  <div className="border-b border-slate-100 pb-1.5">
                    <h3 className="text-xs font-brand-header text-navy">APPLY FOR MEMBERSHIP</h3>
                    <p className="text-[9px] text-slate-400">Submit details for a required home onboarding survey</p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <input 
                      type="text" 
                      placeholder="Full Name" 
                      required
                      value={enquiryName}
                      onChange={e => setEnquiryName(e.target.value)}
                      className="text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-navy"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="email" 
                        placeholder="Email Address" 
                        required
                        value={enquiryEmail}
                        onChange={e => setEnquiryEmail(e.target.value)}
                        className="text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-navy"
                      />
                      <input 
                        type="tel" 
                        placeholder="Mobile Number" 
                        required
                        value={enquiryPhone}
                        onChange={e => setEnquiryPhone(e.target.value)}
                        className="text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-navy"
                      />
                    </div>
                    <input 
                      type="text" 
                      placeholder="Street Address (e.g., Sandton)" 
                      required
                      value={enquiryAddress}
                      onChange={e => setEnquiryAddress(e.target.value)}
                      className="text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-navy"
                    />
                    
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Primary Service Interest</label>
                      <select 
                        value={enquiryCategory}
                        onChange={e => setEnquiryCategory(e.target.value as ServiceCategory)}
                        className="text-xs p-2 border border-slate-200 rounded-lg focus:outline-none"
                      >
                        <option value="Security">Security Coverage</option>
                        <option value="Electrical">Electrical Coverage</option>
                        <option value="Plumbing">Plumbing Coverage</option>
                        <option value="Construction">Construction Coverage</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Select Target Package</label>
                      <div className="grid grid-cols-3 gap-1">
                        {SERVICE_PACKAGES.map(pkg => (
                          <button
                            key={pkg.id}
                            type="button"
                            onClick={() => setSelectedPkgId(pkg.id)}
                            className={`p-1.5 rounded-lg border text-center transition-all flex flex-col items-center justify-between ${
                              selectedPkgId === pkg.id 
                                ? 'border-navy bg-navy/5 font-bold' 
                                : 'border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <span className="text-[8px] text-slate-500">{pkg.name.split(' ')[1]}</span>
                            <span className="text-[11px] text-navy font-bold">R{pkg.price}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <textarea 
                      placeholder="Special instructions or gate codes..."
                      value={enquiryNotes}
                      onChange={e => setEnquiryNotes(e.target.value)}
                      className="text-xs p-2 border border-slate-200 rounded-lg focus:outline-none h-12 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-red hover:bg-red/90 text-white text-xs font-brand-header py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>I'M INTERESTED</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}

            {/* ----------------- PHASE 2: INTERESTED (WAITING ON ADMIN) ----------------- */}
            {state.currentStep === 'INTERESTED' && (
              <div className="flex flex-col gap-4 text-center py-6 animate-fadeIn">
                <div className="mx-auto bg-navy/5 p-4 rounded-full text-navy">
                  <Shield className="w-12 h-12 text-red" />
                </div>
                <div>
                  <h3 className="text-base font-brand-header text-navy">APPLICATION QUEUED</h3>
                  <p className="text-xs text-slate-500 mt-1.5 px-3">
                    Thank you! Your interest has been logged. An administrator at Same Day Assist is reviewing your address to assign a contractor for your <strong>mandatory pre-compliance physical property survey</strong>.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs text-left text-xs flex flex-col gap-2">
                  <div className="flex justify-between font-mono text-[10px] text-slate-400">
                    <span>RECORD ID</span>
                    <span>STATUS</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-700">
                    <span>{state.customers[state.customers.length - 1]?.id || 'CUST-TEMP'}</span>
                    <span className="text-amber-500">PENDING ASSESSMENT</span>
                  </div>
                  <hr className="border-slate-100" />
                  <p className="text-[11px] text-slate-500">
                    <strong>Note:</strong> We assess every premises to document existing wiring, pipes, and security alarms prior to granting full 24/7 unlimited emergency dispatch coverage.
                  </p>
                </div>
                <div className="text-[10px] text-slate-400 mt-4 leading-normal">
                  You can speed up simulation by toggling to the <strong>Administrator Web Portal</strong> at the top to schedule the Property Assessment.
                </div>
              </div>
            )}

            {/* ----------------- PHASE 3: ASSESSMENT SCHEDULED ----------------- */}
            {(state.currentStep === 'ASSESSMENT_SCHEDULED' || state.currentStep === 'CONTRACTOR_ASSESSING') && (
              <div className="flex flex-col gap-4 animate-fadeIn">
                <div className="bg-navy text-white p-4 rounded-2xl shadow-md">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-red shrink-0" />
                    <div>
                      <h3 className="text-xs font-brand-header">ASSESSMENT SCHEDULED</h3>
                      <p className="text-[9px] text-slate-300">Property survey engineer dispatched</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase">Assigned Surveyor</h4>
                  <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center text-navy font-bold font-brand-header">SN</div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-800">Sipho Ndlovu</p>
                      <p className="text-[10px] text-slate-400">Specialist Surveyor • ★ 4.9</p>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Category:</span>
                      <span className="font-bold">Security & Gate Survey</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Scheduled Date:</span>
                      <span className="font-bold">Today, 10:00 AM</span>
                    </div>
                  </div>

                  {state.currentStep === 'CONTRACTOR_ASSESSING' && (
                    <div className="bg-red/5 p-2.5 rounded-xl border border-red/20 text-center animate-pulse">
                      <p className="text-[11px] font-bold text-red">
                        Surveyor is currently assessing your property.
                      </p>
                      <p className="text-[9px] text-slate-500">
                        They are checking Gate automation, alarms, and main electrical breaker compliance.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ----------------- PHASE 4: ASSESSMENT UPLOADED / QUOTE GENERATED ----------------- */}
            {(state.currentStep === 'ASSESSMENT_UPLOADED' || state.currentStep === 'QUOTE_GENERATED') && (
              <div className="flex flex-col gap-4 animate-fadeIn">
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-2xl flex items-start gap-2.5">
                  <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold">Compliance Assessment Uploaded!</h3>
                    <p className="text-[10px] text-emerald-700 mt-0.5 leading-relaxed">
                      Our contractor discovered 2 pre-compliance defects requiring repair before active membership can be granted.
                    </p>
                  </div>
                </div>

                {state.currentStep === 'ASSESSMENT_UPLOADED' && (
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center py-6">
                    <Clock className="w-8 h-8 text-amber-500 mx-auto mb-2 animate-spin" />
                    <h3 className="text-xs font-bold text-navy uppercase">COMPILING QUOTATION</h3>
                    <p className="text-[10px] text-slate-400 px-3 mt-1.5">
                      Same Day Assist engineers are generating a subsidized repair quotation. Switch to Admin Web Portal to finalize and send it.
                    </p>
                  </div>
                )}

                {state.currentStep === 'QUOTE_GENERATED' && state.quotations.length > 0 && (
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-md flex flex-col gap-3">
                    <div className="border-b border-slate-100 pb-2">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-brand-header text-navy">PRE-COMPLIANCE QUOTE</h3>
                        <span className="text-[9px] font-mono bg-red/10 text-red font-bold px-1.5 py-0.5 rounded">ZAR REQUIRED</span>
                      </div>
                      <p className="text-[9px] text-slate-400">Subsidized repairs to unlock lifetime assistance coverage</p>
                    </div>

                    <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                      {state.quotations[0].lineItems.map((item, idx) => (
                        <div key={item.id} className="flex justify-between text-[11px] text-slate-600 border-b border-slate-50 pb-1">
                          <span>{idx + 1}. {item.description}</span>
                          <span className="font-bold text-slate-800">R{item.cost}</span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-500">Subsidized Total:</span>
                      <span className="text-sm font-brand-header text-red">R{state.quotations[0].amount}</span>
                    </div>

                    <div className="flex gap-2 mt-1">
                      <button 
                        onClick={() => handleApproveQuotation(state.quotations[0].id)}
                        className="flex-1 bg-navy hover:bg-navy-light text-white text-[11px] font-brand-header py-2 rounded-xl transition-all shadow-sm"
                      >
                        APPROVE & REPAIR
                      </button>
                      <button 
                        onClick={() => alert('Declining repairs will halt onboarding.')}
                        className="px-3 border border-slate-200 text-slate-400 hover:bg-slate-50 rounded-xl text-[11px]"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ----------------- PHASE 5: CUSTOMER APPROVED (REPAIRS ACTIVE) ----------------- */}
            {state.currentStep === 'CUSTOMER_APPROVED' && (
              <div className="flex flex-col gap-4 text-center py-6 animate-fadeIn">
                <div className="w-12 h-12 bg-indigo-50 text-navy rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
                  <Hammer className="w-6 h-6 text-red" />
                </div>
                <div>
                  <h3 className="text-sm font-brand-header text-navy">REPAIRS IN PROGRESS</h3>
                  <p className="text-xs text-slate-500 mt-1.5 px-4 leading-relaxed">
                    Compliance works are approved! Same Day Assist contractors are currently upgrading your gate automation sensor compliance to meet the strict 24/7 priority response guarantee.
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-left text-[11px] text-slate-500">
                  <span className="font-bold text-slate-700">Next Action:</span> Switch to the <strong>Contractor Mobile App</strong> (or Administrator Web Portal) to complete pre-membership repairs.
                </div>
              </div>
            )}

            {/* ----------------- PHASE 6: REPAIRS COMPLETED (MEMBER PAY TO ACTIVATE) ----------------- */}
            {state.currentStep === 'REPAIRS_COMPLETED' && (
              <div className="flex flex-col gap-4 animate-fadeIn">
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-center">
                  <Check className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                  <h3 className="text-xs font-bold">Property Compliance Achieved!</h3>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    All safety repairs are successfully completed. Your property is ready to join the network.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-md flex flex-col gap-3">
                  <div className="border-b border-slate-100 pb-1.5">
                    <h3 className="text-xs font-brand-header text-navy text-center">ACTIVATE YOUR MEMBERSHIP</h3>
                    <p className="text-[9px] text-slate-400 text-center">Establish your billing coverage & emergency protection</p>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Package Selected:</span>
                      <span className="font-bold text-navy">Diamond Assist Infinite</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Initial Onboarding co-pay:</span>
                      <span className="font-bold">R1 500 (Subs. Repair)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monthly Recurring:</span>
                      <span className="font-bold">R999/month</span>
                    </div>
                  </div>

                  <hr className="border-slate-100" />

                  <button
                    onClick={handlePayActivation}
                    className="w-full bg-red hover:bg-red/90 text-white text-xs font-brand-header py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>PAY R1 500 & ACTIVATE NOW</span>
                  </button>
                </div>
              </div>
            )}


            {/* ----------------- MEMBERS PORTAL - FULL MEMBERSHIP ACTIVE ----------------- */}
            {(state.currentStep === 'MEMBERSHIP_ACTIVATED' || state.currentStep === 'CUSTOMER_LOGIN' || state.currentStep === 'REQUEST_ASSISTANCE' || state.currentStep === 'JOB_CARD_CREATED' || state.currentStep === 'CONTRACTOR_ASSIGNED' || state.currentStep === 'LIVE_JOB_UPDATES' || state.currentStep === 'COMPLETION_REPORT' || state.currentStep === 'CUSTOMER_RATING' || state.currentStep === 'JOB_CLOSED') && (
              <div className="flex flex-col gap-4 animate-fadeIn">
                
                {/* MEMBER PROFILE SHIELD */}
                <div className="bg-gradient-to-r from-navy to-navy-light text-white p-3.5 rounded-2xl shadow-md flex items-center justify-between relative overflow-hidden">
                  <div className="absolute right-2 -bottom-2 opacity-15">
                    <Shield className="w-16 h-16" />
                  </div>
                  <div>
                    <span className="text-[8px] font-bold bg-red text-white px-1.5 py-0.5 rounded uppercase tracking-wider">DIAMOND ASSIST INFINITE</span>
                    <h2 className="text-xs font-brand-header mt-1">{activeCustomer.name}</h2>
                    <p className="text-[9px] text-slate-300">Member Since: {activeCustomer.memberSince || 'Today'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] text-slate-300 uppercase">Coverage Status</p>
                    <span className="inline-block text-[10px] font-bold bg-green-500 text-white px-2 py-0.5 rounded-full animate-pulse mt-0.5">ACTIVE</span>
                  </div>
                </div>

                {/* ACTIVE TRACKER ENGINE - IF AN ACTIVE ASSIST REQUEST EXISTS */}
                {activeJob && (
                  <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-md flex flex-col gap-2 animate-fadeIn">
                    <div className="border-b border-slate-100 pb-1.5 flex justify-between items-center">
                      <div>
                        <h3 className="text-xs font-brand-header text-red">DISPATCH ENGAGED</h3>
                        <p className="text-[9px] text-slate-400 font-mono">ID: {activeJob.id}</p>
                      </div>
                      <span className="text-[9px] bg-red/10 text-red font-bold px-1.5 rounded uppercase">
                        {activeJob.status}
                      </span>
                    </div>

                    {/* LIVE VECTOR DISPATCH MAP SIMULATOR */}
                    <div className="relative w-full h-24 bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                      {/* Grid background */}
                      <div className="absolute inset-0 bg-slate-100 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:12px_12px] opacity-60"></div>
                      
                      {/* Landmarks */}
                      <span className="absolute top-2 left-4 text-[7px] text-slate-400 font-bold uppercase font-mono">Sandton</span>
                      <span className="absolute bottom-2 right-4 text-[7px] text-slate-400 font-bold uppercase font-mono">Rosebank</span>
                      
                      {/* Customer Pin */}
                      <div className="absolute top-1/2 left-[70%] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
                        <div className="w-2.5 h-2.5 bg-navy rounded-full animate-ping absolute"></div>
                        <MapPin className="w-5 h-5 text-navy relative" />
                        <span className="text-[7px] font-bold text-navy bg-white px-1 rounded shadow-2xs mt-0.5 whitespace-nowrap">My Home</span>
                      </div>

                      {/* Contractor vehicle moving based on status / progress */}
                      {activeJob.status !== 'Requested' && (
                        <div 
                          className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 z-20 flex flex-col items-center"
                          style={{
                            top: `${50 + (activeJob.status === 'InRoute' ? 25 : activeJob.status === 'Arrived' || activeJob.status === 'Completed' ? 0 : 40)}%`,
                            left: `${30 + (activeJob.status === 'InRoute' ? 20 : activeJob.status === 'Arrived' || activeJob.status === 'Completed' ? 40 : 0)}%`
                          }}
                        >
                          <div className="w-2 h-2 bg-red rounded-full animate-ping absolute"></div>
                          <Zap className="w-4 h-4 text-red relative" />
                          <span className="text-[7px] font-bold text-red bg-white px-1 rounded shadow-2xs mt-0.5 whitespace-nowrap">
                            {assignedContractor?.name || 'Sipho (Security)'}
                          </span>
                        </div>
                      )}

                      {/* Route Path Indicator Line */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        <line 
                          x1="30%" y1="90%" 
                          x2="70%" y2="50%" 
                          stroke="#CC322C" 
                          strokeWidth="1.5" 
                          strokeDasharray="4 2" 
                          className="animate-[dash_2s_linear_infinite]"
                        />
                      </svg>
                    </div>

                    {/* Progress Slider */}
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold px-1">
                      <span className={activeJob.trackerProgress >= 20 ? 'text-navy' : ''}>Assigned</span>
                      <span className={activeJob.trackerProgress >= 50 ? 'text-navy' : ''}>En Route</span>
                      <span className={activeJob.trackerProgress >= 80 ? 'text-navy' : ''}>Arrived</span>
                      <span className={activeJob.trackerProgress >= 100 ? 'text-navy' : ''}>Completed</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-navy h-full transition-all duration-500" 
                        style={{ width: `${activeJob.trackerProgress}%` }}
                      ></div>
                    </div>

                    {/* Contractor details panel */}
                    {assignedContractor ? (
                      <div className="bg-slate-50 p-2 rounded-xl flex items-center justify-between border border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center font-bold text-xs">
                            {assignedContractor.name.split(' ').map(n=>n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-800">{assignedContractor.name}</p>
                            <p className="text-[8px] text-slate-400">{assignedContractor.specialty} Specialist • ★ {assignedContractor.rating}</p>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <a href={`tel:${assignedContractor.phone}`} className="p-1.5 bg-white hover:bg-slate-100 rounded-lg border border-slate-200">
                            <Phone className="w-3.5 h-3.5 text-navy" />
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 p-2 rounded-xl text-center text-[10px] text-slate-500 border border-slate-100">
                        🛡️ Dispatch controller is auto-assigning closest patrol officer...
                      </div>
                    )}

                    {/* RATING TRIGGER - ONCE COMPLETED BUT NOT YET RATED */}
                    {activeJob.status === 'Completed' && (
                      <div className="bg-red/5 p-3 rounded-xl border border-red/20 flex flex-col gap-2 mt-1 animate-fadeIn">
                        <div className="text-center">
                          <h4 className="text-[11px] font-bold text-navy uppercase">RATE COMPLETED REPAIR</h4>
                          <p className="text-[9px] text-slate-500">Provide feedback to close job card</p>
                        </div>
                        
                        <div className="flex justify-center gap-1.5 my-1">
                          {[1, 2, 3, 4, 5].map(val => (
                            <button 
                              key={val} 
                              onClick={() => setRatingVal(val)}
                              className="focus:outline-none"
                            >
                              <Star className={`w-5 h-5 ${ratingVal >= val ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                            </button>
                          ))}
                        </div>

                        <input 
                          type="text"
                          placeholder="What did you think of the service?"
                          value={ratingComment}
                          onChange={e => setRatingComment(e.target.value)}
                          className="text-[11px] p-2 border border-slate-200 rounded-lg bg-white focus:outline-none"
                        />

                        <button 
                          onClick={() => handleRateJob(activeJob.id)}
                          className="w-full bg-navy text-white font-brand-header py-1.5 rounded-lg text-[10px] hover:bg-navy-light"
                        >
                          SUBMIT REVIEW & CLOSE
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* THE MASSIVE RED PANIC BUTTON SCREEN */}
                {!activeJob && (
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-md text-center flex flex-col items-center justify-center gap-3">
                    <h3 className="text-xs font-brand-header text-navy">EMERGENCY ASSIST</h3>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      Press and hold the button below to summon an armed security patrol or electrical dispatcher to your registered address instantly.
                    </p>

                    {/* RED BUTTON */}
                    <div className="relative my-4">
                      {isTriggeringEmergency ? (
                        <div className="w-28 h-28 rounded-full bg-red text-white flex items-center justify-center font-brand-header text-xs shadow-2xl animate-ping border-4 border-white">
                          SENDING...
                        </div>
                      ) : (
                        <button
                          onMouseDown={() => setIsEmergencyArmed(true)}
                          onMouseUp={() => { if (isEmergencyArmed) handleTriggerPanicButton(); }}
                          onMouseLeave={() => setIsEmergencyArmed(false)}
                          onTouchStart={() => setIsEmergencyArmed(true)}
                          onTouchEnd={() => { if (isEmergencyArmed) handleTriggerPanicButton(); }}
                          className={`w-28 h-28 rounded-full flex flex-col items-center justify-center text-white transition-all duration-200 border-[6px] border-slate-900 shadow-2xl ${
                            isEmergencyArmed 
                              ? 'bg-red-700 scale-95 shadow-inner' 
                              : 'bg-red hover:bg-red/95 animate-pulse'
                          }`}
                        >
                          <AlertTriangle className="w-7 h-7 mb-1" />
                          <span className="font-brand-header text-sm">PANIC</span>
                          <span className="text-[7px] uppercase font-mono tracking-widest text-white/70">HOLD 2s</span>
                        </button>
                      )}
                    </div>

                    <div className="text-[9px] text-slate-400 font-mono">
                      {isEmergencyArmed ? (
                        <span className="text-red font-bold animate-pulse">ARMED! RELEASE TO CONFIRM</span>
                      ) : (
                        <span>DISPATCH COORDINATOR: READY</span>
                      )}
                    </div>
                  </div>
                )}

                {/* REGULAR NON-EMERGENCY SERVICE REQUEST FORM */}
                {!activeJob && (
                  <form onSubmit={handleRequestAssistance} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3">
                    <div className="border-b border-slate-100 pb-1.5">
                      <h4 className="text-xs font-brand-header text-navy">LOG REPAIR REQUEST</h4>
                      <p className="text-[9px] text-slate-400">Regular maintenance or assistance dispatch</p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex gap-1">
                        {(['Security', 'Electrical', 'Plumbing', 'Construction'] as ServiceCategory[]).map(cat => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setAssistCategory(cat)}
                            className={`flex-1 py-1 rounded-lg border text-[9px] font-bold ${
                              assistCategory === cat 
                                ? 'bg-navy border-navy text-white' 
                                : 'bg-slate-50 border-slate-200 text-slate-600'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>

                      <textarea
                        placeholder="Explain the damage or security issue (e.g., Burst pipe, short circuit breaker...)"
                        required
                        value={assistDesc}
                        onChange={e => setAssistDesc(e.target.value)}
                        className="text-xs p-2 border border-slate-200 rounded-lg h-16 resize-none focus:outline-none"
                      />

                      {/* Photo Attachment simulator */}
                      <div className="border border-dashed border-slate-200 rounded-lg p-2 text-center relative bg-slate-50">
                        {assistPhoto ? (
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> Photo Attached
                            </span>
                            <button 
                              type="button" 
                              onClick={() => setAssistPhoto(null)} 
                              className="text-[9px] text-red font-bold hover:underline"
                            >
                              Clear
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer flex flex-col items-center justify-center py-1">
                            <Camera className="w-4 h-4 text-slate-400 mb-1" />
                            <span className="text-[9px] text-slate-500 font-bold">Attach Damage Photo</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={e => handlePhotoUpload(e, setAssistPhoto)}
                            />
                          </label>
                        )}
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-navy text-white py-2 rounded-xl text-xs font-brand-header tracking-wider shadow-sm hover:bg-navy-light flex items-center justify-center gap-1"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>DISPATCH TECHNICIAN</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* INVOICES & RECENT STATEMENTS TRAY */}
                <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm">
                  <h4 className="text-xs font-brand-header text-navy mb-2">RECENT PAYMENTS</h4>
                  <div className="space-y-1.5">
                    {state.payments.filter(p => p.customerId === activeCustomer.id).slice(0, 2).map(pay => (
                      <div key={pay.id} className="flex justify-between items-center text-[10px] border-b border-slate-50 pb-1.5">
                        <div className="flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                          <div>
                            <p className="font-bold text-slate-700">{pay.type}</p>
                            <p className="text-[8px] text-slate-400">{pay.date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-navy">R{pay.amount}</p>
                          <span className="text-[7px] bg-green-100 text-green-800 px-1 rounded-sm uppercase">PAID</span>
                        </div>
                      </div>
                    ))}
                    {state.payments.filter(p => p.customerId === activeCustomer.id).length === 0 && (
                      <p className="text-[10px] text-slate-400 text-center py-2">No billing transactions recorded.</p>
                    )}
                  </div>
                </div>

                {/* EMERGENCY CONTACT DETAILS */}
                <div className="bg-red/5 p-3 rounded-2xl border border-red/10 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-red animate-pulse" />
                  <div className="text-left">
                    <p className="text-[9px] font-bold text-red">DIRECT VOICE DISPATCH</p>
                    <p className="text-[11px] font-mono font-bold text-navy">+27 (11) 555-9111</p>
                  </div>
                </div>

              </div>
            )}

              </>
            )}

            {activeDeviceTab === 'profile' && (
              <div className="flex flex-col gap-4 animate-fadeIn">
                <div className="border-b border-slate-100 pb-1.5">
                  <h3 className="text-xs font-brand-header text-navy">MY ACCOUNT PROFILE</h3>
                  <p className="text-[9px] text-slate-400">Manage your contact details & registered address</p>
                </div>

                <form onSubmit={handleSaveProfile} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3">
                  {profileSavedMsg && (
                    <div className="bg-green-50 border border-green-200 text-green-800 text-[10px] p-2 rounded-lg text-center font-bold">
                      ✓ Profile details successfully updated!
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={profileName}
                        onChange={e => setProfileName(e.target.value)}
                        className="text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-navy animate-fadeIn"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Email Address</label>
                      <input 
                        type="email" 
                        required
                        value={profileEmail}
                        onChange={e => setProfileEmail(e.target.value)}
                        className="text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-navy"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Mobile Phone</label>
                      <input 
                        type="tel" 
                        required
                        value={profilePhone}
                        onChange={e => setProfilePhone(e.target.value)}
                        className="text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-navy"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Physical Dispatch Address</label>
                      <input 
                        type="text" 
                        required
                        value={profileAddress}
                        onChange={e => setProfileAddress(e.target.value)}
                        className="text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-navy"
                      />
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[10px] text-slate-500 space-y-1 animate-fadeIn">
                      <p className="font-bold text-navy uppercase text-[8px]">Active Coverage Package</p>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-700">{activeCustomer?.package || 'Platinum'} Assist</span>
                        <span className="text-[8px] bg-red text-white px-1.5 py-0.2 rounded font-bold uppercase">ZAR COVERED</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-navy text-white text-xs font-brand-header py-2 rounded-xl shadow-sm hover:bg-navy-light transition-all mt-2 cursor-pointer"
                  >
                    SAVE PROFILE DETAILS
                  </button>
                </form>
              </div>
            )}

            {activeDeviceTab === 'invoices' && (
              <div className="flex flex-col gap-4 animate-fadeIn">
                <div className="border-b border-slate-100 pb-1.5">
                  <h3 className="text-xs font-brand-header text-navy">BILLING STATEMENT</h3>
                  <p className="text-[9px] text-slate-400">View recent ZAR invoices & membership receipts</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500">Total Premium Paid:</span>
                    <span className="text-sm font-brand-header text-navy animate-fadeIn">R{activeCustomer?.totalPaid || 0}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red w-full"></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Statement History</h4>
                  <div className="flex flex-col gap-2">
                    {state.payments.filter(p => p.customerId === activeCustomer.id).map(pay => (
                      <div key={pay.id} className="bg-white p-3 rounded-xl border border-slate-100 flex flex-col gap-2 shadow-2xs hover:border-slate-300 transition-all animate-fadeIn">
                        <div className="flex justify-between items-start text-xs">
                          <div>
                            <p className="font-bold text-slate-800">{pay.type}</p>
                            <p className="text-[9px] text-slate-400 font-mono">Invoice ID: {pay.id}</p>
                            <p className="text-[9px] text-slate-400 font-mono">Date: {pay.date}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-navy text-sm">R{pay.amount}</p>
                            <span className="text-[8px] bg-green-100 text-green-800 px-1.5 py-0.2 rounded-sm font-bold uppercase">PAID</span>
                          </div>
                        </div>
                        <div className="flex gap-2 border-t border-slate-50 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              alert(`STATEMENT GENERATED:\n\nSame Day Assist (Pty) Ltd\nInvoice ID: ${pay.id}\nCustomer: ${pay.customerName}\nType: ${pay.type}\nAmount: R${pay.amount}\nStatus: PAID\nDate: ${pay.date}\n\nCompliance secured under ZAR membership.`);
                              addAuditLog('Statement Exported', `Customer downloaded billing receipt ${pay.id} for R${pay.amount}`);
                            }}
                            className="flex-1 py-1 bg-slate-50 hover:bg-slate-100 rounded text-[9px] font-bold text-slate-600 transition-colors border border-slate-100 cursor-pointer"
                          >
                            🖨️ View/Download Receipt
                          </button>
                        </div>
                      </div>
                    ))}
                    {state.payments.filter(p => p.customerId === activeCustomer.id).length === 0 && (
                      <div className="bg-white p-6 rounded-xl border border-slate-100 text-center text-[11px] text-slate-400">
                        No transactions recorded. Complete your pre-compliance repair co-pay to activate billing.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

        </div>
      </div>
    </div>
  );
}
