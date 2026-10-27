import React, { useState, useEffect } from 'react';
import { Shield, Lock, Eye, EyeOff, Mail, Key, AlertCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { useAppState } from './contexts/AppStateContext';
import { useTheme } from './contexts/ThemeContext';
import CustomerApp from './components/CustomerApp';
import ContractorApp from './components/ContractorApp';
import AdminPortal from './components/AdminPortal';
import { OnboardingWizard } from './components/auth/OnboardingWizard';
import { EmergencyNonMemberPortal } from './components/emergency/EmergencyNonMemberPortal';
import logoImg from './assets/logo.png';

export default function App() {
  const { user, isAuthenticated, login, register, onboarding, error: authError, clearError } = useAuth();
  const { state, createEnquiry } = useAppState();
  const { theme, isDark } = useTheme();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showEmergencyPortal, setShowEmergencyPortal] = useState(false);
  const [emergencyTrackId, setEmergencyTrackId] = useState<string | null>(null);

  // Authentication & Session Preferences
  const [portalType, setPortalType] = useState<'customer' | 'operations'>(() => {
    return (localStorage.getItem('sda_preferred_portal') as 'customer' | 'operations') || 'customer';
  });
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('sda_remember_me') === 'true';
  });

  // Account Lockout State
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState(0);

  // Registration States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regPassword, setRegPassword] = useState('demo-passcode');
  const [regRole, setRegRole] = useState<'Customer' | 'Contractor' | 'Dispatcher' | 'Administrator' | 'Super Administrator'>('Customer');
  const [regAdminSecret, setRegAdminSecret] = useState('');
  const [regServiceCategory, setRegServiceCategory] = useState<'Security' | 'Electrical' | 'Plumbing' | 'Construction'>('Security');
  const [regNotes, setRegNotes] = useState('');
  const [regStep, setRegStep] = useState<1 | 2>(1);

  // Resilience: network offline tracking
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-fill remembered email
  useEffect(() => {
    if (rememberMe) {
      const savedEmail = localStorage.getItem('sda_remembered_email');
      if (savedEmail) setLoginEmail(savedEmail);
    }
  }, [rememberMe]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutTimeLeft <= 0) {
      if (isLocked) {
        setIsLocked(false);
        setFailedAttempts(0);
      }
      return;
    }
    const timer = setTimeout(() => {
      setLockoutTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [lockoutTimeLeft, isLocked]);

  const handlePortalSwitch = (type: 'customer' | 'operations') => {
    setPortalType(type);
    localStorage.setItem('sda_preferred_portal', type);
    clearError();
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (isLocked) {
      alert(`Account locked. Please wait ${lockoutTimeLeft} seconds before trying again.`);
      return;
    }

    if (!loginEmail || !loginPassword) return;

    setLoginLoading(true);
    try {
      await login(loginEmail, loginPassword);
      setFailedAttempts(0);
      if (rememberMe) {
        localStorage.setItem('sda_remembered_email', loginEmail);
        localStorage.setItem('sda_remember_me', 'true');
      } else {
        localStorage.removeItem('sda_remembered_email');
        localStorage.setItem('sda_remember_me', 'false');
      }
    } catch (err) {
      const attempts = failedAttempts + 1;
      setFailedAttempts(attempts);
      if (attempts >= 5) {
        setIsLocked(true);
        setLockoutTimeLeft(60); // 60 second lockout
        alert('Too many consecutive failed attempts. Please try again in 60 seconds.');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleDemoLogin = async (email: string, pass: string) => {
    if (loginLoading || isLocked) return;
    setLoginEmail(email);
    setLoginPassword(pass);
    setLoginLoading(true);
    clearError();
    try {
      await login(email, pass);
      setFailedAttempts(0);
    } catch (err: any) {
      console.warn('Demo login completed or error handled:', err);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!regName || !regEmail || !regPhone || !regAddress || !regPassword) return;

    setLoginLoading(true);
    try {
      await register({
        name: regName,
        email: regEmail,
        phone: regPhone,
        address: regAddress,
        serviceCategory: regServiceCategory,
        notes: regNotes,
        password: regPassword,
        role: regRole,
        adminSecret: regAdminSecret,
      });
      setIsRegistering(false);
      setRegStep(1);
    } catch (err) {
      // Handled by AuthContext
    } finally {
      setLoginLoading(false);
    }
  };


  const handlePasswordHelp = () => {
    alert('Please contact Same Day Assist support or your administrator to reset your password.');
  };

  // Render Emergency Non-Member Portal if activated
  if (showEmergencyPortal) {
    return (
      <EmergencyNonMemberPortal 
        onBackToLogin={() => {
          setShowEmergencyPortal(false);
          setEmergencyTrackId(null);
        }}
        initialJobId={emergencyTrackId}
      />
    );
  }

  // 1. RENDER LOGIN GATES IF NOT AUTHENTICATED
  if (!isAuthenticated) {
    const isCustomerTheme = portalType === 'customer';

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 transition-colors duration-300 font-sans flex flex-col justify-between relative overflow-x-hidden">
        {!isOnline && (
          <div className="bg-red text-white text-xs font-semibold py-2 px-4 text-center select-none flex items-center justify-center gap-2 z-[999] shadow-md">
            <AlertCircle className="w-4 h-4" />
            <span>Offline Mode: No internet connection detected.</span>
          </div>
        )}
        {/* Subtle Navy Ambient Light */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-slate-900/60 rounded-full blur-[140px] pointer-events-none"></div>

        {/* Dynamic Header */}
        <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md py-3 px-4 md:px-12 flex flex-col sm:flex-row justify-between items-center gap-3 z-10">
          <div className="flex items-center gap-3">
            <img 
              src={logoImg} 
              alt="Same Day Assist Logo" 
              className="w-10 h-10 object-contain shrink-0 rounded-full bg-white p-0.5 shadow-md" 
            />
            <div>
              <div className="flex items-baseline gap-1">
                <h1 className="text-sm font-black italic tracking-wide leading-none uppercase font-brand-header text-white">
                  SAME DAY ASSIST
                </h1>
                <span className="text-[9px] font-bold text-red uppercase tracking-widest font-mono">SA</span>
              </div>
              <p className="text-[9px] tracking-wider text-slate-400">
                24/7 Emergency Assist Network
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setEmergencyTrackId(null);
                setShowEmergencyPortal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-red hover:bg-red/90 text-white text-[10px] font-bold tracking-wide uppercase rounded-xl shadow-md cursor-pointer transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Non-Member Emergency</span>
            </button>

            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => handlePortalSwitch('customer')}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                  isCustomerTheme 
                    ? 'bg-red text-white shadow-xs' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Member Portal
              </button>
              <button
                type="button"
                onClick={() => handlePortalSwitch('operations')}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                  !isCustomerTheme 
                    ? 'bg-red text-white shadow-xs' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Staff Portal
              </button>
            </div>
          </div>
        </header>

        {/* Login/Register Card Container */}
        <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 z-10 my-4">
          {isRegistering ? (
            <div className="w-full max-w-4xl">
              <OnboardingWizard
                onComplete={async (data) => {
                  await onboarding(data);
                  setIsRegistering(false);
                }}
                onCancel={() => setIsRegistering(false)}
              />
            </div>
          ) : (
            <>
              {/* PROMINENT NON-MEMBER EMERGENCY ASSISTANCE HERO CARD - CLEAN BRAND NAVY & TRUE RED */}
              <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-5 shadow-xl relative overflow-hidden">
                <div className="flex items-start gap-3.5">
                  <div className="p-3 bg-red rounded-xl text-white shadow-md shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-red px-2.5 py-0.5 rounded-md shadow-xs">
                        Emergency Assist
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">No Membership Required</span>
                    </div>
                    <h3 className="text-base font-bold uppercase tracking-wide text-white mt-2">
                      Need Emergency Help?
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Not a Same Day Assist member? Request immediate emergency assistance and pay for the service once the work is completed.
                    </p>
                    
                    <div className="mt-4 flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEmergencyTrackId(null);
                          setShowEmergencyPortal(true);
                        }}
                        className="flex-1 py-3 px-4 bg-red hover:bg-red/90 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Request Emergency Assistance</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const entered = prompt('Enter your 6-digit Emergency PIN or Reference ID:');
                          if (entered && entered.trim()) {
                            setEmergencyTrackId(entered.trim());
                            setShowEmergencyPortal(true);
                          }
                        }}
                        className="py-3 px-4 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 font-bold text-xs uppercase rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>Track Request</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full max-w-md border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col gap-5 bg-slate-900 shadow-xl text-slate-100">
                <div className="text-center space-y-1.5">
                  <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-2 bg-white p-1 shadow-md border border-slate-700">
                    <img src={logoImg} alt="Same Day Assist Logo" className="w-full h-full object-contain rounded-full" />
                  </div>
                  <h2 className="text-lg font-brand-header tracking-wide uppercase text-white">
                    {isCustomerTheme ? 'Sign In To Account' : 'Staff & Contractor Portal'}
                  </h2>
                  <p className="text-xs max-w-sm mx-auto leading-relaxed text-slate-400">
                    {isCustomerTheme 
                      ? 'Access your active membership profile, dispatches, and billing details.'
                      : 'Sign in with your authorized staff or responder credentials.'}
                  </p>
                </div>

                {/* Error notifications */}
                {authError && (
                  <div className="bg-red text-white text-xs p-3 rounded-xl flex items-start gap-2 shadow-sm font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{authError}</span>
                  </div>
                )}

                {isLocked && (
                  <div className="bg-amber-600 text-white text-xs p-3 rounded-xl flex items-start gap-2 shadow-sm font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Too many failed attempts. Try again in {lockoutTimeLeft}s</span>
                  </div>
                )}

                {/* SECURE LOGIN FORM */}
                <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input 
                        type="email" 
                        required
                        placeholder="e.g. name@domain.co.za"
                        value={loginEmail}
                        onChange={e => setLoginEmail(e.target.value)}
                        className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl transition-all bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Password</label>
                    <div className="relative">
                      <Key className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input 
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        className="w-full text-xs pl-10 pr-10 py-2.5 rounded-xl transition-all bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-400">
                      <input 
                        type="checkbox" 
                        checked={rememberMe}
                        onChange={e => setRememberMe(e.target.checked)}
                        className="rounded bg-slate-950 border-slate-800 text-red focus:ring-0" 
                      />
                      <span>Remember Me</span>
                    </label>
                    <button 
                      type="button" 
                      onClick={handlePasswordHelp}
                      className="text-[10px] font-bold transition-colors cursor-pointer text-slate-400 hover:text-white"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loginLoading || isLocked}
                    className="w-full font-brand-header py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 mt-1.5 bg-red text-white hover:bg-red/90 disabled:opacity-50"
                  >
                    {loginLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'SIGN IN'}
                  </button>

                  {/* QUICK DEMO ACCOUNTS */}
                  <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Demo Accounts
                      </span>
                      <span className="text-[9px] text-slate-400">
                        {loginLoading ? 'Signing in...' : 'Tap to sign in'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10px]">
                      <button
                        type="button"
                        disabled={loginLoading || isLocked}
                        onClick={() => handleDemoLogin('bright@samedayassist.co.za', '12345')}
                        className="px-2.5 py-2 bg-slate-950 hover:bg-slate-800 disabled:opacity-50 border border-slate-800 rounded-lg text-left text-slate-200 transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <span className="truncate font-medium">👤 Bright (Customer)</span>
                        <span className="text-[8px] font-mono text-slate-500">12345</span>
                      </button>

                      <button
                        type="button"
                        disabled={loginLoading || isLocked}
                        onClick={() => handleDemoLogin('lerato@molefefamily.co.za', 'demo-passcode')}
                        className="px-2.5 py-2 bg-slate-950 hover:bg-slate-800 disabled:opacity-50 border border-slate-800 rounded-lg text-left text-slate-200 transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <span className="truncate font-medium">👤 Lerato (Customer)</span>
                        <span className="text-[8px] font-mono text-slate-500">demo</span>
                      </button>

                      <button
                        type="button"
                        disabled={loginLoading || isLocked}
                        onClick={() => handleDemoLogin('sipho.ndlovu@samedayassist.co.za', 'demo-passcode')}
                        className="px-2.5 py-2 bg-slate-950 hover:bg-slate-800 disabled:opacity-50 border border-slate-800 rounded-lg text-left text-slate-200 transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <span className="truncate font-medium">🛠️ Sipho (Security)</span>
                        <span className="text-[8px] font-mono text-slate-500">demo</span>
                      </button>

                      <button
                        type="button"
                        disabled={loginLoading || isLocked}
                        onClick={() => handleDemoLogin('jan.deklerk@samedayassist.co.za', 'demo-passcode')}
                        className="px-2.5 py-2 bg-slate-950 hover:bg-slate-800 disabled:opacity-50 border border-slate-800 rounded-lg text-left text-slate-200 transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <span className="truncate font-medium">🛠️ Jan (Electrical)</span>
                        <span className="text-[8px] font-mono text-slate-500">demo</span>
                      </button>

                      <button
                        type="button"
                        disabled={loginLoading || isLocked}
                        onClick={() => handleDemoLogin('controlroom@samedayassist.co.za', 'demo-passcode')}
                        className="px-2.5 py-2 bg-slate-950 hover:bg-slate-800 disabled:opacity-50 border border-slate-800 rounded-lg text-left text-slate-200 transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <span className="truncate font-medium">🛡️ Control Room</span>
                        <span className="text-[8px] font-mono text-slate-500">demo</span>
                      </button>

                      <button
                        type="button"
                        disabled={loginLoading || isLocked}
                        onClick={() => handleDemoLogin('mike@samedayassist.co.za', '12345')}
                        className="px-2.5 py-2 bg-slate-950 hover:bg-slate-800 disabled:opacity-50 border border-slate-800 rounded-lg text-left text-slate-200 transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <span className="truncate font-medium">⚡ Mike (Super Admin)</span>
                        <span className="text-[8px] font-mono text-slate-500">12345</span>
                      </button>
                    </div>
                  </div>

                  <div className="text-center text-[10.5px] text-slate-400 mt-2">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegistering(true);
                      }}
                      className="text-red font-bold hover:underline cursor-pointer"
                    >
                      Register New Account
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </main>

        <footer className="border-t py-4 text-center text-[9px] font-mono select-none flex flex-col gap-1 border-slate-900 bg-slate-950 text-slate-500">
          <div>
            VERSION 1.4.0-PROD • © 2026 SAME DAY ASSIST (PTY) LTD. ALL RIGHTS RESERVED.
          </div>
          <div className="flex justify-center gap-3">
            <span className="cursor-pointer hover:underline">Privacy Policy</span>
            <span>•</span>
            <span className="cursor-pointer hover:underline">Terms of Service</span>
          </div>
        </footer>
      </div>
    );
  }

  // 2. RENDER THE CORRESPONDING ACTIVE PORTAL IF AUTHENTICATED
  return (
    <div className={`min-h-screen flex flex-col justify-between font-sans gap-0 md:gap-8 transition-colors duration-200 ${
      theme === 'light' ? 'bg-[#F1F5F9] text-navy' : 'bg-slate-950 text-slate-100'
    }`}>
      {!isOnline && (
        <div className="bg-red text-white text-xs font-semibold py-2 px-4 text-center select-none flex items-center justify-center gap-2 z-[999] shadow-md">
          <AlertCircle className="w-4 h-4" />
          <span>Offline Mode: No internet connection detected.</span>
        </div>
      )}
      {/* Dynamic Active Portal - Edge to edge full screen on mobile */}
      <div className="flex-1 flex flex-col justify-start md:justify-center p-0 md:p-6 lg:p-8 w-full">
        {user?.role === 'Customer' && (
          <div className="w-full flex-1 flex flex-col">
            <CustomerApp />
          </div>
        )}
        {user?.role === 'Contractor' && (
          <div className="w-full flex-1 flex flex-col">
            <ContractorApp />
          </div>
        )}
        {(user?.role === 'Dispatcher' || user?.role === 'Administrator' || user?.role === 'Super Administrator') && (
          <div className="w-full flex-1 flex flex-col text-slate-900">
            <AdminPortal />
          </div>
        )}
      </div>
    </div>
  );
}
