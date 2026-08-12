import React, { useState, useEffect } from 'react';
import { Shield, Lock, Eye, EyeOff, Mail, Key, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { useAppState } from './contexts/AppStateContext';
import CustomerApp from './components/CustomerApp';
import ContractorApp from './components/ContractorApp';
import AdminPortal from './components/AdminPortal';
import { OnboardingWizard } from './components/auth/OnboardingWizard';
import logoImg from './assets/logo.png';

export default function App() {
  const { user, isAuthenticated, login, register, onboarding, error: authError, clearError } = useAuth();
  const { state, createEnquiry } = useAppState();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

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
        alert('Too many consecutive failed attempts. Terminal access is locked for 60 seconds.');
      }
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
    alert('Please contact operations administration to reset your security passcode.');
  };

  // 1. RENDER LOGIN GATES IF NOT AUTHENTICATED
  if (!isAuthenticated) {
    const isCustomerTheme = portalType === 'customer';

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 transition-colors duration-300 font-sans flex flex-col justify-between relative overflow-x-hidden">
        {!isOnline && (
          <div className="bg-red text-white text-[11px] font-bold py-2 px-4 text-center animate-fadeIn select-none flex items-center justify-center gap-2 z-[999] shadow-md border-b border-red/20 font-mono tracking-wider">
            <AlertCircle className="w-3.5 h-3.5 animate-pulse" />
            <span>TERMINAL CONNECTION LOST • OPERATING OFFLINE</span>
          </div>
        )}
        {/* Glow Effects */}
        <>
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-red/5 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-12 right-1/4 w-[400px] h-[400px] bg-navy/25 rounded-full blur-[100px] pointer-events-none"></div>
        </>

        {/* Dynamic Header */}
        <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md py-3 px-4 md:px-12 flex flex-col sm:flex-row justify-between items-center gap-3 z-10">
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
              <p className="text-[8px] font-mono tracking-wider text-slate-400">
                EMERGENCY ASSIST NETWORK
              </p>
            </div>
          </div>
          
          <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => handlePortalSwitch('customer')}
              className={`px-3 py-1.5 text-[8px] font-extrabold rounded transition-all cursor-pointer ${
                isCustomerTheme 
                  ? 'bg-red text-white shadow-2xs' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              CLIENT PORTAL
            </button>
            <button
              type="button"
              onClick={() => handlePortalSwitch('operations')}
              className={`px-3 py-1.5 text-[8px] font-extrabold rounded transition-all cursor-pointer ${
                !isCustomerTheme 
                  ? 'bg-red text-white shadow-2xs' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              STAFF GATEWAY
            </button>
          </div>
        </header>

        {/* Login/Register Card Container */}
        <main className="flex-1 flex flex-col items-center justify-center p-6 z-10 my-4">
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
            <div className="w-full max-w-md border transition-all duration-300 rounded-3xl p-6 md:p-8 flex flex-col gap-5 bg-slate-900 border-slate-800 shadow-2xl text-slate-100">
              <div className="text-center space-y-1.5">
                <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-2 bg-white p-1 shadow-xl border border-slate-700">
                  <img src={logoImg} alt="Same Day Assist Logo" className="w-full h-full object-contain rounded-full" />
                </div>
                <h2 className="text-lg font-brand-header tracking-wide uppercase text-white">
                  {isCustomerTheme ? 'Sign In To Account' : 'Secure Operator Entrance'}
                </h2>
                <p className="text-xs max-w-sm mx-auto leading-relaxed text-slate-400">
                  {isCustomerTheme 
                    ? 'Access your active membership profile, dispatches, and billing details.'
                    : 'Submit operator/cruiser credentials to access terminal systems.'}
                </p>
              </div>

              {/* Error notifications */}
              {authError && (
                <div className="bg-red/10 border border-red/30 text-red-600 dark:text-red-400 text-xs p-3 rounded-xl flex items-start gap-2 animate-fadeIn font-mono">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              {isLocked && (
                <div className="bg-amber-500/10 border border-amber-500/30 text-amber-600 text-xs p-3 rounded-xl flex items-start gap-2 animate-fadeIn font-mono">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 animate-pulse" />
                  <span>Security Lockout: Try again in {lockoutTimeLeft}s</span>
                </div>
              )}

              {/* SECURE LOGIN FORM */}
              <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input 
                      type="email" 
                      required
                      placeholder="e.g. name@domain.co.za"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl transition-all bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red/60"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Security Passcode</label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      className="w-full text-xs pl-10 pr-10 py-2.5 rounded-xl transition-all bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red/60"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
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
                    Forgot passcode?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading || isLocked}
                  className="w-full font-brand-header py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 mt-1.5 bg-red text-white hover:bg-red/90 disabled:opacity-50"
                >
                  {loginLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'SECURE LOGIN'}
                </button>

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans gap-8">
      {!isOnline && (
        <div className="bg-red text-white text-[11px] font-bold py-2 px-4 text-center animate-fadeIn select-none flex items-center justify-center gap-2 z-[999] shadow-md border-b border-red/20 font-mono tracking-wider">
          <AlertCircle className="w-3.5 h-3.5 animate-pulse" />
          <span>TERMINAL CONNECTION LOST • OPERATING OFFLINE</span>
        </div>
      )}
      {/* Dynamic Active Portal */}
      <div className="flex-1 flex flex-col justify-center p-4 md:p-8">
        {user?.role === 'Customer' && <CustomerApp />}
        {user?.role === 'Contractor' && <ContractorApp />}
        {(user?.role === 'Dispatcher' || user?.role === 'Administrator' || user?.role === 'Super Administrator') && <AdminPortal />}
      </div>
    </div>
  );
}
