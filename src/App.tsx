import React, { useState, useEffect } from 'react';
import { 
  Shield, User, Users, Wrench, Terminal, Database, Play, 
  HelpCircle, ChevronRight, Activity, CheckCircle, RefreshCw, Info, AlertCircle,
  Lock, Eye, EyeOff, Mail, Key, LogOut
} from 'lucide-react';
import { AppState, JourneyStep, UserRole, Enquiry, Customer, Job, AuditLog, Payment, Assessment, ServiceCategory } from './types';
import { 
  INITIAL_CONTRACTORS, INITIAL_ENQUIRIES, INITIAL_CUSTOMERS, INITIAL_AUDIT_LOGS 
} from './data/mockData';

// Sub-components
import CustomerApp from './components/CustomerApp';
import ContractorApp from './components/ContractorApp';
import AdminPortal from './components/AdminPortal';
import DevConsole from './components/DevConsole';

// Journey categories for clean collapsed UI
const JOURNEY_GROUPS = [
  {
    name: "1. Apply",
    steps: [
      { id: "PROSPECT", label: "Prospective Client", desc: "Browsing marketing & packages" },
      { id: "INTERESTED", label: "I'm Interested", desc: "Enquiry submitted" },
      { id: "ENQUIRY_RECEIVED", label: "Enquiry Logged", desc: "Admin reviews enquiry" }
    ]
  },
  {
    name: "2. Survey",
    steps: [
      { id: "ASSESSMENT_SCHEDULED", label: "Survey Scheduled", desc: "Dispatched surveyor" },
      { id: "CONTRACTOR_ASSESSING", label: "Survey Active", desc: "Surveyor auditing property" },
      { id: "ASSESSMENT_UPLOADED", label: "Survey Uploaded", desc: "Compliance defects listed" }
    ]
  },
  {
    name: "3. Quote & Repair",
    steps: [
      { id: "QUOTE_GENERATED", label: "Quote Sent", desc: "Admin sends repair quote" },
      { id: "CUSTOMER_APPROVED", label: "Quote Approved", desc: "Client approves repairs" },
      { id: "REPAIRS_COMPLETED", label: "Repairs Done", desc: "Compliance achieved" }
    ]
  },
  {
    name: "4. Activate",
    steps: [
      { id: "MEMBERSHIP_ACTIVATED", label: "Paid & Active", desc: "Membership billing active" },
      { id: "CUSTOMER_LOGIN", label: "Client Logged In", desc: "Client enters member portal" }
    ]
  },
  {
    name: "5. Panic Dispatch",
    steps: [
      { id: "REQUEST_ASSISTANCE", label: "Panic Triggered", desc: "Emergency panic pressed" },
      { id: "JOB_CARD_CREATED", label: "Job Card Opened", desc: "System creates job card" },
      { id: "CONTRACTOR_ASSIGNED", label: "Officer En Route", desc: "Cruiser dispatched" }
    ]
  },
  {
    name: "6. Resolution",
    steps: [
      { id: "LIVE_JOB_UPDATES", label: "Officer Arrived", desc: "Officer on-site resolving" },
      { id: "COMPLETION_REPORT", label: "Job Completed", desc: "Officer uploads resolution signature" },
      { id: "CUSTOMER_RATING", label: "Client Rated", desc: "Client leaves star feedback" },
      { id: "JOB_CLOSED", label: "Job Closed", desc: "Admin closes ticket" }
    ]
  }
];

export default function App() {
  // Global State Loader / localStorage Engine
  const [state, setState] = useState<AppState>(() => {
    const cached = localStorage.getItem('sda_app_state');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        // Fallback to fresh setup
      }
    }
    return {
      currentStep: 'PROSPECT',
      enquiries: INITIAL_ENQUIRIES,
      assessments: [],
      quotations: [],
      customers: INITIAL_CUSTOMERS,
      contractors: INITIAL_CONTRACTORS,
      jobs: [],
      payments: [],
      auditLogs: INITIAL_AUDIT_LOGS,
      selectedRole: 'Customer',
      currentUserId: 'cust-201'
    };
  });

  // Sync state changes to Local Storage
  useEffect(() => {
    localStorage.setItem('sda_app_state', JSON.stringify(state));
  }, [state]);

  // Login & Onboarding Registration local states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // New onboarding client registration
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regCategory, setRegCategory] = useState<ServiceCategory>('Security');
  const [regNotes, setRegNotes] = useState('');

  // Helper: Clear local storage and reset to pristine state
  const clearLocalStorage = () => {
    localStorage.removeItem('sda_app_state');
    window.location.reload();
  };

  // State update proxy
  const updateState = (newState: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...newState }));
  };

  // Helper: Append Security Audit Log
  const addAuditLog = (action: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now().toString().slice(-3)}`,
      timestamp: new Date().toISOString(),
      userType: state.selectedRole,
      action,
      details
    };
    setState(prev => ({
      ...prev,
      auditLogs: [newLog, ...prev.auditLogs]
    }));
  };

  // Login handler
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginEmail || !loginPassword) {
      setLoginError('Please enter both your email address and security passcode.');
      return;
    }
    setLoginLoading(true);

    setTimeout(() => {
      const emailLower = loginEmail.trim().toLowerCase();

      // Developer mode
      if (emailLower === 'developer@samedayassist.co.za') {
        updateState({
          selectedRole: 'Super Administrator',
          isLoggedIn: true,
          currentUserId: 'dev-001'
        });
        addAuditLog('System Login', 'System developer authenticated into Terminal');
        setLoginLoading(false);
        return;
      }

      // Control Room Administrator
      if (emailLower === 'controlroom@samedayassist.co.za' || emailLower === 'admin@samedayassist.co.za') {
        updateState({
          selectedRole: 'Administrator',
          isLoggedIn: true,
          currentUserId: 'admin-001'
        });
        addAuditLog('System Login', 'Control room operator logged into Hub');
        setLoginLoading(false);
        return;
      }

      // Contractor / Field Pro
      const contractor = state.contractors.find(c => c.email.toLowerCase() === emailLower);
      if (contractor) {
        updateState({
          selectedRole: 'Contractor',
          isLoggedIn: true,
          currentUserId: contractor.id
        });
        addAuditLog('System Login', `Field responder ${contractor.name} logged in`);
        setLoginLoading(false);
        return;
      }

      // Customer / Client Member
      const customer = state.customers.find(c => c.email.toLowerCase() === emailLower);
      if (customer) {
        updateState({
          selectedRole: 'Customer',
          isLoggedIn: true,
          currentUserId: customer.id
        });
        addAuditLog('Customer Login', `Customer ${customer.name} logged in`);
        setLoginLoading(false);
        return;
      }

      // If no customer but match in pending enquiries
      const enquiry = state.enquiries.find(enq => enq.email.toLowerCase() === emailLower);
      if (enquiry) {
        const newCust: Customer = {
          id: `cust-${Date.now().toString().slice(-3)}`,
          name: enquiry.customerName,
          email: enquiry.email,
          phone: enquiry.phone,
          address: enquiry.address,
          status: 'Onboarding',
          package: 'Platinum',
          repairsCount: 0,
          totalPaid: 0
        };
        updateState({
          customers: [...state.customers, newCust],
          selectedRole: 'Customer',
          isLoggedIn: true,
          currentUserId: newCust.id,
          currentStep: 'ENQUIRY_RECEIVED'
        });
        addAuditLog('Customer Login', `Customer ${newCust.name} linked from existing enquiry & logged in`);
        setLoginLoading(false);
        return;
      }

      setLoginError('Invalid South African operator or client credentials. Use the Demo Quick Access buttons to instantly log in.');
      setLoginLoading(false);
    }, 600);
  };

  // Register / Onboarding Application Submit
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPhone || !regAddress) {
      setLoginError('Please fill in all mandatory onboarding fields.');
      return;
    }
    setLoginLoading(true);

    setTimeout(() => {
      const newEnqId = `enq-${Date.now().toString().slice(-3)}`;
      const newEnquiry: Enquiry = {
        id: newEnqId,
        customerName: regName,
        email: regEmail,
        phone: regPhone,
        address: regAddress,
        serviceCategory: regCategory,
        notes: regNotes || 'Interested in emergency assist plan',
        status: 'Pending',
        createdAt: new Date().toISOString()
      };

      const newCustId = `cust-${Date.now().toString().slice(-3)}`;
      const newCustomer: Customer = {
        id: newCustId,
        name: regName,
        email: regEmail,
        phone: regPhone,
        address: regAddress,
        status: 'Onboarding',
        package: regCategory === 'Construction' || regCategory === 'Security' ? 'Diamond' : 'Platinum',
        repairsCount: 0,
        totalPaid: 0
      };

      updateState({
        enquiries: [...state.enquiries, newEnquiry],
        customers: [...state.customers, newCustomer],
        selectedRole: 'Customer',
        isLoggedIn: true,
        currentUserId: newCustId,
        currentStep: 'INTERESTED'
      });

      addAuditLog('Portal Onboarding', `New customer ${regName} registered online & submitted initial enquiry`);
      
      // Reset
      setIsRegistering(false);
      setRegName('');
      setRegEmail('');
      setRegPhone('');
      setRegAddress('');
      setRegNotes('');
      setLoginLoading(false);
    }, 800);
  };

  // Password reset submit
  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setLoginLoading(true);
    setTimeout(() => {
      setResetSuccess(true);
      setLoginLoading(false);
      addAuditLog('Passcode Reset Request', `Temporary security passcode link requested for ${resetEmail}`);
    }, 600);
  };

  // Instant Login function when clicking demo card
  const handleQuickAccessLogin = (email: string) => {
    setLoginEmail(email);
    setLoginPassword('demo-passcode');
    setLoginError('');
    setLoginLoading(true);

    setTimeout(() => {
      const emailLower = email.trim().toLowerCase();

      // Developer mode
      if (emailLower === 'developer@samedayassist.co.za') {
        updateState({
          selectedRole: 'Super Administrator',
          isLoggedIn: true,
          currentUserId: 'dev-001'
        });
        addAuditLog('System Login', 'System developer authenticated into Terminal via Quick Access');
        setLoginLoading(false);
        return;
      }

      // Control Room Administrator
      if (emailLower === 'controlroom@samedayassist.co.za') {
        updateState({
          selectedRole: 'Administrator',
          isLoggedIn: true,
          currentUserId: 'admin-001'
        });
        addAuditLog('System Login', 'Control room operator logged into Hub via Quick Access');
        setLoginLoading(false);
        return;
      }

      // Contractor / Field Pro
      const contractor = state.contractors.find(c => c.email.toLowerCase() === emailLower);
      if (contractor) {
        updateState({
          selectedRole: 'Contractor',
          isLoggedIn: true,
          currentUserId: contractor.id
        });
        addAuditLog('System Login', `Field responder ${contractor.name} logged in via Quick Access`);
        setLoginLoading(false);
        return;
      }

      // Customer / Client Member
      const customer = state.customers.find(c => c.email.toLowerCase() === emailLower);
      if (customer) {
        updateState({
          selectedRole: 'Customer',
          isLoggedIn: true,
          currentUserId: customer.id
        });
        addAuditLog('Customer Login', `Customer ${customer.name} logged in via Quick Access`);
        setLoginLoading(false);
        return;
      }
      setLoginLoading(false);
    }, 400);
  };

  if (!state.isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between relative overflow-x-hidden">
        
        {/* Ambient top glowing circles */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-red/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-12 right-1/4 w-[400px] h-[400px] bg-navy/20 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Premium SAME DAY ASSIST Brand Header */}
        <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md py-4 px-6 md:px-12 flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            <div className="bg-red p-2 rounded-xl text-white">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <h1 className="text-lg font-black italic tracking-wide leading-none text-white">SAME DAY ASSIST</h1>
                <span className="text-[10px] font-bold text-red uppercase tracking-widest">S.A.</span>
              </div>
              <p className="text-[9px] text-slate-400 font-mono">EMERGENCY ASSIST NETWORK</p>
            </div>
          </div>
          <div className="hidden sm:block">
            <span className="text-[10px] bg-red/15 text-red border border-red/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wide">
              Control Room & Responder Dispatch
            </span>
          </div>
        </header>

        {/* Main Authentication Card */}
        <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 z-10 my-6">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col gap-6">
            
            {/* Form Headers */}
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-red/10 rounded-full flex items-center justify-center mb-2">
                <Lock className="w-6 h-6 text-red" />
              </div>
              <h2 className="text-xl md:text-2xl font-brand-header text-white tracking-wide uppercase">
                {forgotPasswordMode 
                  ? 'Reset Security PIN' 
                  : isRegistering 
                    ? 'Apply For Membership' 
                    : 'Secure Portal Access'}
              </h2>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                {forgotPasswordMode 
                  ? 'Request a temporary 6-digit access code' 
                  : isRegistering 
                    ? 'Get 24/7 priority response, compliance assessments & subsided repairs' 
                    : 'Enter registered details or utilize quick-access demo credentials below'}
              </p>
            </div>

            {/* Error Indicator */}
            {loginError && (
              <div className="bg-red/10 border border-red/35 text-red-400 text-xs p-3 rounded-xl flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red" />
                <p className="leading-relaxed">{loginError}</p>
              </div>
            )}

            {/* Password Reset Sent Banner */}
            {resetSuccess && forgotPasswordMode && (
              <div className="bg-emerald-950/40 border border-emerald-500/35 text-emerald-400 text-xs p-3 rounded-xl flex items-start gap-2.5 animate-fadeIn">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <p className="leading-relaxed">
                  Passcode link sent! Check <strong className="text-white">{resetEmail}</strong> for your temporary recovery PIN.
                </p>
              </div>
            )}

            {/* Forgot Password PIN Mode */}
            {forgotPasswordMode && (
              <form onSubmit={handleForgotPasswordSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registered Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input 
                      type="email" 
                      required
                      placeholder="e.g. name@domain.co.za"
                      value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-xs p-2.5 pl-10 rounded-xl text-white focus:outline-none focus:border-red transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full bg-red hover:bg-red-light disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  {loginLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'SEND RESET PASSCODE'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setForgotPasswordMode(false);
                    setResetSuccess(false);
                  }}
                  className="text-xs text-slate-400 hover:text-white transition-colors text-center cursor-pointer"
                >
                  ← Back to Login
                </button>
              </form>
            )}

            {/* Registration Mode (Application / Onboarding) */}
            {isRegistering && !forgotPasswordMode && (
              <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Lerato Molefe"
                      value={regName}
                      onChange={e => setRegName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-xs p-2.5 rounded-xl text-white focus:outline-none focus:border-red transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                    <input 
                      type="email" 
                      required
                      placeholder="lerato@domain.co.za"
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-xs p-2.5 rounded-xl text-white focus:outline-none focus:border-red transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mobile Number</label>
                    <input 
                      type="tel" 
                      required
                      placeholder="+27 82 555 1234"
                      value={regPhone}
                      onChange={e => setRegPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-xs p-2.5 rounded-xl text-white focus:outline-none focus:border-red transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Plan Coverage</label>
                    <select
                      value={regCategory}
                      onChange={e => setRegCategory(e.target.value as ServiceCategory)}
                      className="w-full bg-slate-950 border border-slate-800 text-xs p-2.5 rounded-xl text-white focus:outline-none focus:border-red font-bold transition-all"
                    >
                      <option value="Security">🛡️ Security Elite Guard</option>
                      <option value="Electrical">⚡ Electrical Shield</option>
                      <option value="Plumbing">💧 Plumbing Shield</option>
                      <option value="Construction">🔨 Full Infrastructure Plan</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Physical Dispatch Address</label>
                  <input 
                    type="text" 
                    required
                    placeholder="12 West Street, Sandton, Johannesburg"
                    value={regAddress}
                    onChange={e => setRegAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs p-2.5 rounded-xl text-white focus:outline-none focus:border-red transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Property Details (Optional)</label>
                  <textarea 
                    placeholder="Describe electric fence state, automated gates, or specific emergency notes..."
                    value={regNotes}
                    onChange={e => setRegNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs p-2.5 rounded-xl text-white h-16 resize-none focus:outline-none focus:border-red transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full bg-red hover:bg-red-light disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 mt-1"
                >
                  {loginLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'SUBMIT PORTAL APPLICATION'}
                </button>

                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="text-xs text-slate-400 hover:text-white transition-colors text-center cursor-pointer"
                >
                  ← Already registered? Secure Log In
                </button>
              </form>
            )}

            {/* Standard Login Form Mode */}
            {!forgotPasswordMode && !isRegistering && (
              <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4 animate-fadeIn">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input 
                      type="email" 
                      required
                      placeholder="name@domain.co.za or name@samedayassist.co.za"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-xs p-2.5 pl-10 rounded-xl text-white focus:outline-none focus:border-red transition-all"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Security PIN (Passcode)</label>
                    <button
                      type="button"
                      onClick={() => setForgotPasswordMode(true)}
                      className="text-[10px] text-red hover:text-red-light transition-colors cursor-pointer font-bold"
                    >
                      Forgot Pin?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-xs p-2.5 pl-10 rounded-xl text-white focus:outline-none focus:border-red transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-white cursor-pointer transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full bg-red hover:bg-red-light disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 mt-1"
                >
                  {loginLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'SECURE PORTAL LOGIN'}
                </button>

                <div className="text-center mt-1">
                  <span className="text-xs text-slate-500">Need immediate emergency dispatch? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegistering(true);
                      setLoginError('');
                    }}
                    className="text-xs text-red hover:text-red-light font-bold transition-colors cursor-pointer"
                  >
                    Apply Now
                  </button>
                </div>
              </form>
            )}

            {/* Seamless Demo Quick Access Panel */}
            {!forgotPasswordMode && !isRegistering && (
              <div className="border-t border-slate-800/60 pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Demo Quick Access Accounts</span>
                  <span className="text-[9px] bg-red/10 text-red border border-red/20 px-2 py-0.5 rounded font-mono font-bold animate-pulse">ONE-CLICK BYPASS</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { 
                      label: "Lerato (Onboarding Client)", 
                      email: "lerato@molefefamily.co.za", 
                      desc: "Apply & Survey Workflow",
                      icon: User
                    },
                    { 
                      label: "Thabo (Active Client)", 
                      email: "thabo@mokoenaholdings.com", 
                      desc: "Emergency Panic & Active Member",
                      icon: User
                    },
                    { 
                      label: "Sipho (Security Responder)", 
                      email: "sipho.ndlovu@samedayassist.co.za", 
                      desc: "Field Responder Terminal",
                      icon: Wrench
                    },
                    { 
                      label: "Jan (Electrical Responder)", 
                      email: "jan.deklerk@samedayassist.co.za", 
                      desc: "Surveyor Field Assessment",
                      icon: Wrench
                    },
                    { 
                      label: "Control Room Operator", 
                      email: "controlroom@samedayassist.co.za", 
                      desc: "Operations Center Dispatch CRM",
                      icon: Users
                    },
                    { 
                      label: "System Developer", 
                      email: "developer@samedayassist.co.za", 
                      desc: "SQL Inspector & Dev Fast-Forward",
                      icon: Terminal
                    }
                  ].map(acc => (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => handleQuickAccessLogin(acc.email)}
                      disabled={loginLoading}
                      className="text-left p-2 bg-slate-950/60 hover:bg-slate-950 border border-slate-800 hover:border-red/40 transition-all rounded-xl flex flex-col gap-0.5 cursor-pointer disabled:opacity-50"
                    >
                      <div className="flex items-center gap-1">
                        <acc.icon className="w-3.5 h-3.5 text-red shrink-0" />
                        <span className="text-[10px] font-bold text-white truncate">{acc.label}</span>
                      </div>
                      <span className="text-[8px] text-slate-400 truncate font-mono">{acc.email}</span>
                      <span className="text-[8px] text-slate-500 leading-none truncate mt-0.5">{acc.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        </main>

        <footer className="border-t border-slate-900 bg-slate-950/90 py-4 text-center text-[10px] text-slate-500">
          <p>© 2026 Same Day Assist (Pty) Ltd. All rights reserved. Soweto, Johannesburg, South Africa • SABS & PSIRA Assured</p>
        </footer>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-between">
      
      {/* Premium Same Day Assist Brand Banner */}
      <header className="bg-navy border-b-[5px] border-red text-white py-4 px-6 md:px-12 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-red p-2 rounded-xl text-white">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <h1 className="text-xl md:text-2xl font-brand-header tracking-wide leading-none text-white">SAME DAY</h1>
              <span className="text-xs font-brand-sub text-red font-bold">ASSIST</span>
            </div>
            <p className="text-[10px] md:text-xs text-slate-300 font-medium tracking-tight mt-0.5">
              Fast Response. Real Solutions. Peace of Mind.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-[10px] text-slate-400 font-mono">Logged in as: <span className="font-bold text-white uppercase">{state.selectedRole}</span></p>
            <span className="inline-block text-[9px] bg-red text-white px-2 py-0.5 rounded font-bold uppercase mt-1">
              ZAR SOUTH AFRICA OPERATIONAL SUITE
            </span>
          </div>
          <button
            onClick={() => {
              addAuditLog('User Sign Out', `${state.selectedRole} signed out of the portal`);
              updateState({ isLoggedIn: false });
            }}
            className="bg-red hover:bg-red/80 px-4 py-2 rounded-xl text-xs font-bold transition-all text-white cursor-pointer shadow-sm"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* CORE FRAME LAYOUT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col gap-6">
        
        {state.selectedRole === 'Customer' && (
          <CustomerApp state={state} updateState={updateState} addAuditLog={addAuditLog} />
        )}

        {state.selectedRole === 'Contractor' && (
          <ContractorApp state={state} updateState={updateState} addAuditLog={addAuditLog} />
        )}

        {state.selectedRole === 'Administrator' && (
          <AdminPortal state={state} updateState={updateState} addAuditLog={addAuditLog} />
        )}

        {state.selectedRole === 'Super Administrator' && (
          <DevConsole 
            state={state} 
            updateState={updateState} 
            addAuditLog={addAuditLog} 
            clearLocalStorage={clearLocalStorage} 
          />
        )}

      </main>

      {/* Shared Footer copyrights */}
      <footer className="bg-navy border-t border-navy-light text-slate-400 py-6 px-12 text-center text-xs flex flex-col md:flex-row justify-between items-center gap-4 mt-8">
        <div>
          <p>© 2026 Same Day Assist (Pty) Ltd. All rights reserved. Private and Confidential.</p>
          <p className="text-[10px] text-slate-500 mt-1">Soweto, Johannesburg, South Africa • SABS & PSIRA Compliance Assured</p>
        </div>
        <div className="flex gap-4 font-mono text-[10px]">
          <span className="text-slate-500">Security Certificate: ISO27001</span>
          <span className="text-slate-500">Node Environment: Production</span>
        </div>
      </footer>

    </div>
  );
}
