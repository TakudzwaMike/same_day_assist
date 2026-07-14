import React, { useState } from 'react';
import { Shield, Lock, Eye, EyeOff, Mail, Key, AlertCircle, RefreshCw, Terminal } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { useAppState } from './contexts/AppStateContext';
import CustomerApp from './components/CustomerApp';
import ContractorApp from './components/ContractorApp';
import AdminPortal from './components/AdminPortal';
import DevConsole from './components/DevConsole';

export default function App() {
  const { user, isAuthenticated, login, register, error: authError, clearError } = useAuth();
  const { state, createEnquiry, clearError: clearStateError, addAuditLogLocal } = useAppState();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Registration States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!loginEmail || !loginPassword) return;

    setLoginLoading(true);
    try {
      await login(loginEmail, loginPassword);
    } catch (err) {
      // Handled by AuthContext error
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!regName || !regEmail || !regPhone || !regAddress) return;

    setLoginLoading(true);
    try {
      await register({
        name: regName,
        email: regEmail,
        phone: regPhone,
        address: regAddress,
        password: 'demo-passcode', // Default demo credentials
      });
      // Automatically triggers login after success in AuthContext
      setIsRegistering(false);
    } catch (err) {
      // Handled by AuthContext
    } finally {
      setLoginLoading(false);
    }
  };

  const handleQuickAccessLogin = (email: string) => {
    setLoginEmail(email);
    setLoginPassword('demo-passcode');
    clearError();
    login(email, 'demo-passcode');
  };

  const handleClearDb = () => {
    localStorage.removeItem('sda_app_state');
    localStorage.removeItem('sda_auth_user');
    localStorage.removeItem('sda_auth_token');
    window.location.reload();
  };

  // Render Login page if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between relative overflow-x-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-red/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-12 right-1/4 w-[400px] h-[400px] bg-navy/25 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Premium Brand Header */}
        <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md py-4 px-6 md:px-12 flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            <div className="bg-red p-2 rounded-xl text-white">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <h1 className="text-lg font-black italic tracking-wide leading-none text-white uppercase font-brand-header">SAME DAY ASSIST</h1>
                <span className="text-[10px] font-bold text-red uppercase tracking-widest font-mono">SA</span>
              </div>
              <p className="text-[9px] text-slate-400 font-mono tracking-wider">EMERGENCY ASSIST NETWORK</p>
            </div>
          </div>
          <div>
            <span className="text-[10px] bg-red/15 text-red border border-red/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider font-mono">
              Control Room Gateway
            </span>
          </div>
        </header>

        {/* Main Card Grid */}
        <main className="flex-1 flex flex-col items-center justify-center p-6 z-10 my-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative flex flex-col gap-6">
            
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-red/10 rounded-full flex items-center justify-center mb-2">
                <Lock className="w-5 h-5 text-red animate-pulse" />
              </div>
              <h2 className="text-lg md:text-xl font-brand-header text-white tracking-wide uppercase">
                {isRegistering ? 'Apply For Coverage' : 'Secure Terminal Entrance'}
              </h2>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                {isRegistering 
                  ? 'Request pre-compliance property survey and armed response panic activation' 
                  : 'Submit verified credentials or activate demo accounts below'}
              </p>
            </div>

            {/* Error Indicators */}
            {authError && (
              <div className="bg-red/10 border border-red/30 text-red-400 text-xs p-3 rounded-xl flex items-start gap-2 animate-fadeIn font-mono">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            {isRegistering ? (
              /* REGISTRATION FORM */
              <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-3.5 animate-fadeIn">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Lerato Molefe"
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs p-2.5 rounded-xl text-white focus:outline-none focus:border-red transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                  <input 
                    type="email" 
                    required
                    placeholder="name@domain.co.za"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs p-2.5 rounded-xl text-white focus:outline-none focus:border-red transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Mobile Number</label>
                  <input 
                    type="tel" 
                    required
                    placeholder="+27 71 555 1234"
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs p-2.5 rounded-xl text-white focus:outline-none focus:border-red transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Physical Street Address (JHB)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="12 Baker Street, Rosebank"
                    value={regAddress}
                    onChange={e => setRegAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs p-2.5 rounded-xl text-white focus:outline-none focus:border-red transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full bg-red hover:bg-red/90 disabled:opacity-50 text-white font-brand-header py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  {loginLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'SUBMIT MEMBERSHIP APPLICATION'}
                </button>

                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="text-xs text-slate-400 hover:text-white transition-colors text-center cursor-pointer mt-1"
                >
                  ← Back to secure login
                </button>
              </form>
            ) : (
              /* LOGIN FORM */
              <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input 
                      type="email" 
                      required
                      placeholder="e.g. name@domain.co.za"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-xs p-2.5 pl-10 rounded-xl text-white focus:outline-none focus:border-red transition-all"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Security Passcode</label>
                  </div>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-xs p-2.5 pl-10 pr-10 rounded-xl text-white focus:outline-none focus:border-red transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-500 hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full bg-red hover:bg-red/90 disabled:opacity-50 text-white font-brand-header py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 mt-1"
                >
                  {loginLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'SECURE AUTHENTICATION'}
                </button>

                <div className="flex justify-between items-center text-[10.5px] text-slate-400 mt-2 px-1">
                  <button
                    type="button"
                    onClick={() => setIsRegistering(true)}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Create Member Account
                  </button>
                  <button
                    type="button"
                    onClick={() => alert('Demo Passcode: "demo-passcode" (pre-seeded for all accounts)')}
                    className="hover:text-white transition-colors cursor-pointer text-right"
                  >
                    Forgot passcode?
                  </button>
                </div>
              </form>
            )}

            {/* DEMO QUICK ACCESS CARDS */}
            <div className="border-t border-slate-800/80 pt-5">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block text-center mb-3">
                Sandbox Instant Quick-Login
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleQuickAccessLogin('lerato@molefefamily.co.za')}
                  className="flex flex-col p-2.5 bg-slate-950 border border-slate-850 hover:border-slate-750 hover:bg-slate-900 rounded-xl text-left cursor-pointer transition-all"
                >
                  <span className="text-[10px] font-bold text-white leading-none">Client Member</span>
                  <span className="text-[8px] text-slate-500 mt-1 truncate">Lerato Molefe</span>
                </button>
                <button
                  onClick={() => handleQuickAccessLogin('sipho.ndlovu@samedayassist.co.za')}
                  className="flex flex-col p-2.5 bg-slate-950 border border-slate-850 hover:border-slate-750 hover:bg-slate-900 rounded-xl text-left cursor-pointer transition-all"
                >
                  <span className="text-[10px] font-bold text-white leading-none">Patrol Cruiser</span>
                  <span className="text-[8px] text-slate-500 mt-1 truncate">Sipho Ndlovu</span>
                </button>
                <button
                  onClick={() => handleQuickAccessLogin('controlroom@samedayassist.co.za')}
                  className="flex flex-col p-2.5 bg-slate-950 border border-slate-850 hover:border-slate-750 hover:bg-slate-900 rounded-xl text-left cursor-pointer transition-all col-span-2"
                >
                  <span className="text-[10px] font-bold text-white leading-none">Dispatcher Operator Command</span>
                  <span className="text-[8px] text-slate-500 mt-1 truncate">controlroom@samedayassist.co.za</span>
                </button>
              </div>
            </div>

          </div>
        </main>

        <footer className="border-t border-slate-800 py-3 text-center text-[10px] text-slate-500 font-mono select-none">
          SECURE PROTOCOL RUNNING • SAME DAY ASSIST (PTY) LTD
        </footer>
      </div>
    );
  }

  // Render Portal if Authenticated
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 md:p-8 font-sans gap-8">
      {/* Dynamic Active Portal */}
      <div className="flex-1 flex flex-col justify-center">
        {user?.role === 'Customer' && <CustomerApp />}
        {user?.role === 'Contractor' && <ContractorApp />}
        {(user?.role === 'Administrator' || user?.role === 'Super Administrator') && <AdminPortal />}
      </div>

      {/* Developer SQLite regex sandbox tool */}
      <DevConsole clearLocalStorage={handleClearDb} />
    </div>
  );
}
