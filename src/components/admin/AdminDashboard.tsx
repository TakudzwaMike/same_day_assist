import React, { useState } from 'react';
import { Activity, Shield, Users, DollarSign, Volume2, AlertTriangle, Play, Database, Server, RefreshCw, Key } from 'lucide-react';
import { useAppState } from '../../contexts/AppStateContext';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

export default function AdminDashboard() {
  const { state, addAuditLogLocal } = useAppState();
  const { user } = useAuth();
  
  // Reseed states
  const [showReseedModal, setShowReseedModal] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [reseedLoading, setReseedLoading] = useState(false);
  const [reseedMessage, setReseedMessage] = useState('');
  const [reseedError, setReseedError] = useState('');

  // Stats
  const activeMembers = state.customers.filter(c => c.status === 'Active').length;
  const pendingEnquiries = state.enquiries.filter(e => e.status === 'Pending').length;
  const criticalAlarms = state.jobs.filter(j => j.status === 'Requested').length;
  const totalRevenue = state.payments.reduce((sum, p) => p.status === 'Paid' ? sum + p.amount : sum, 0);

  const broadcastRadioDispatch = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const activeAlarm = state.jobs.find(j => j.status === 'Requested');
      let text = 'Attention all cruisers: Same Day Assist control rooms reports status normal. Standby for rapid response dispatches.';
      if (activeAlarm) {
        text = `Attention Sandton units, emergency dispatch triggered. Armed response officer requested for client ${activeAlarm.customerName} at ${activeAlarm.customerAddress}. Repeat, armed response requested immediately. Code 4.`;
      }
      const speech = new SpeechSynthesisUtterance(text);
      speech.rate = 1.05;
      speech.pitch = 0.95;
      window.speechSynthesis.speak(speech);
      addAuditLogLocal('Radio Broadcast', `Dispatched audio alert: "${text.slice(0, 50)}..."`);
    } else {
      alert('Speech synthesis not supported in this browser.');
    }
  };

  const handleReseedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmPassword) return;

    setReseedLoading(true);
    setReseedMessage('');
    setReseedError('');
    try {
      const res = await api.systemReseed(confirmPassword);
      setReseedMessage(res.message || 'System re-seed triggered successfully. The database will reset shortly.');
      addAuditLogLocal('Database Reset', 'Super Administrator triggered system database re-seed.');
      setConfirmPassword('');
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (err: any) {
      setReseedError(err.message || 'Failed to trigger reseed. Verify password and access permissions.');
    } finally {
      setReseedLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6 animate-fadeIn">
      {/* METRIC BENTO CARDS */}
      <div className="col-span-12 sm:col-span-6 md:col-span-3 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs hover:shadow-sm transition-shadow">
        <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Active Members</span>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-3xl font-brand-header text-navy font-bold">{activeMembers}</span>
          <span className="text-green-500 font-bold text-xs">↑ 14%</span>
        </div>
        <p className="text-[9px] text-slate-400 mt-2 font-mono">ZAR active recurring premiums</p>
      </div>

      <div className="col-span-12 sm:col-span-6 md:col-span-3 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs hover:shadow-sm transition-shadow">
        <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Critical Alarms</span>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-3xl font-brand-header text-red font-bold">{criticalAlarms}</span>
          <span className={`text-xs font-bold ${criticalAlarms > 0 ? 'text-red animate-pulse' : 'text-slate-400'}`}>
            {criticalAlarms > 0 ? 'PANICS ACTIVE' : 'NO ACTIVE ALARMS'}
          </span>
        </div>
        <p className="text-[9px] text-slate-400 mt-2 font-mono">Immediate rapid dispatch queue</p>
      </div>

      <div className="col-span-12 sm:col-span-6 md:col-span-3 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs hover:shadow-sm transition-shadow">
        <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Pending Surveys</span>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-3xl font-brand-header text-navy font-bold">{pendingEnquiries}</span>
          <span className="text-amber-500 font-bold text-xs">{pendingEnquiries} awaiting scheduling</span>
        </div>
        <p className="text-[9px] text-slate-400 mt-2 font-mono">Onboarding compliance checks</p>
      </div>

      <div className="col-span-12 sm:col-span-6 md:col-span-3 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs hover:shadow-sm transition-shadow">
        <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Total Monthly Invoiced</span>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-3xl font-brand-header text-navy font-bold">R{totalRevenue}</span>
          <span className="text-emerald-500 font-bold text-xs">100% Paid</span>
        </div>
        <p className="text-[9px] text-slate-400 mt-2 font-mono">Onboarding co-pays + premiums</p>
      </div>

      {/* OPERATIONS CENTER CARD */}
      <div className="col-span-12 md:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col gap-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-navy uppercase tracking-wide">Operations Broadcast Console</h3>
            <p className="text-[10px] text-slate-400">Trigger audio alerts or review active system statuses</p>
          </div>
          <span className="h-2 w-2 rounded-full bg-green-500 animate-ping"></span>
        </div>
        
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red/10 text-red rounded-xl shrink-0">
              <Volume2 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 uppercase tracking-wide">Audio Patrol Dispatcher</p>
              <p className="text-[10px] text-slate-500">Synthesize audio dispatch warnings directly to responders on-site</p>
            </div>
          </div>
          <button
            type="button"
            onClick={broadcastRadioDispatch}
            className="px-5 py-2.5 bg-red hover:bg-red/90 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>BROADCAST ALL PATROLS</span>
          </button>
        </div>

        <div className="mt-2 space-y-2">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active System Checks</h4>
          <div className="grid grid-cols-2 gap-3 text-[10px] font-mono">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center justify-between">
              <span className="text-slate-500 font-bold">API GATEWAY:</span>
              <span className="text-emerald-600 font-bold">HEALTHY</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center justify-between">
              <span className="text-slate-500 font-bold">DISPATCH WEBSOCKET:</span>
              <span className="text-emerald-600 font-bold">CONNECTED</span>
            </div>
          </div>
        </div>
      </div>

      {/* DISPATCH CENTER SYSTEM METRIC */}
      <div className="col-span-12 md:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
        <div>
          <div className="border-b border-slate-100 pb-2 mb-3">
            <h3 className="text-sm font-bold text-navy uppercase tracking-wide">Live Dispatch Summary</h3>
            <p className="text-[10px] text-slate-400">Response performance logs</p>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center text-[10px] text-slate-500 mb-1">
                <span>SECURITY SLA RESOLUTIONS (99.4%)</span>
                <span className="font-bold text-navy">15m target</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-red w-[99.4%]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center text-[10px] text-slate-500 mb-1">
                <span>ELECTRICAL RESPONSE SLA (96.8%)</span>
                <span className="font-bold text-navy">30m target</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 w-[96.8%]"></div>
              </div>
            </div>
          </div>
        </div>
        <p className="text-[9px] text-slate-400 mt-4 text-center border-t border-slate-50 pt-2 font-mono">
          Last metrics compilation: Just now
        </p>
      </div>

      {/* SUPER ADMINISTRATOR DEVELOPER CONTROL CARD */}
      {user?.role === 'Super Administrator' && (
        <div className="col-span-12 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100 flex flex-col gap-6 mt-4 font-sans">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Database className="w-5 h-5 text-red animate-pulse" />
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Super Administrator Controls</h3>
                <p className="text-[10px] text-slate-400">Manage developer tools, settings, configuration and SQLite seed status</p>
              </div>
            </div>
            <span className="text-[9px] font-mono font-bold bg-red/10 text-red px-2 py-0.5 rounded border border-red/20 uppercase tracking-widest">Root Privilege</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* System Health Diagnostics */}
            <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                <Server className="w-3.5 h-3.5 text-red" />
                <span>Diagnostics & Health</span>
              </h4>
              <div className="space-y-2 text-[10px] font-mono text-slate-400">
                <div className="flex justify-between">
                  <span>JHB NODE LOAD:</span>
                  <span className="text-emerald-400 font-bold">14% ACTIVE</span>
                </div>
                <div className="flex justify-between">
                  <span>MEMORY FOOTPRINT:</span>
                  <span className="text-emerald-400 font-bold">188MB / 1024MB</span>
                </div>
                <div className="flex justify-between">
                  <span>DATABASE SCHEMAS:</span>
                  <span className="text-emerald-400 font-bold">SQLITE CONNECTED</span>
                </div>
                <div className="flex justify-between">
                  <span>ACTIVE SOCKET NODES:</span>
                  <span className="text-red font-bold">3 VEHICLES</span>
                </div>
              </div>
            </div>

            {/* Platform Settings & Configuration Toggles */}
            <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                <Key className="w-3.5 h-3.5 text-red" />
                <span>Routing Configurations</span>
              </h4>
              <div className="space-y-2 text-[10px] text-slate-400 font-mono">
                <div className="flex justify-between items-center">
                  <span>MAINTENANCE MODE:</span>
                  <button className="bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded text-white text-[9px] font-bold border border-slate-700">DISABLED</button>
                </div>
                <div className="flex justify-between items-center">
                  <span>SMTP GATEWAY:</span>
                  <span className="text-emerald-400 font-bold uppercase">AWS_SES_ACTIVE</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>PAYMENT API WEBHOOK:</span>
                  <span className="text-emerald-400 font-bold uppercase">PAYFAST_GATEWAY_ACTIVE</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>RATE LIMITING GATEWAY:</span>
                  <span className="text-slate-400 font-bold">100 req/min</span>
                </div>
              </div>
            </div>

            {/* Database Reseed Actions */}
            <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                  <Database className="w-3.5 h-3.5 text-red" />
                  <span>Reseed Maintenance</span>
                </h4>
                <p className="text-[9.5px] leading-relaxed text-slate-400 mt-2">
                  Triggers programmatic SQLite seed execution, recreating schema tables and resetting default user accounts.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReseedModal(true)}
                className="w-full mt-2 py-2 bg-red hover:bg-red/90 text-white font-bold text-xs uppercase rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>TRIGGER SYSTEM RESEED</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION RESEED DIALOG MODAL */}
      {showReseedModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-[999] animate-fadeIn">
          <form 
            onSubmit={handleReseedSubmit} 
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full text-slate-100 flex flex-col gap-5 shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-2 bg-red/10 rounded-xl border border-red/20 shrink-0 text-red">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">Trigger Database Reseed</h3>
                <p className="text-[10px] text-slate-400">Developer Operation • Action Required</p>
              </div>
            </div>

            <div className="bg-red/10 border border-red/20 p-3 rounded-xl text-red-400 text-[10.5px] leading-relaxed space-y-1">
              <p className="font-bold">⚠️ CRITICAL WARNING:</p>
              <p>This action will completely delete all active transactions, clear survey enquiries, drop current jobs, and populate default accounts. All custom entries will be permanently lost.</p>
            </div>

            {reseedError && (
              <div className="bg-red/10 border border-red/30 text-red text-xs p-2.5 rounded-lg font-mono">
                {reseedError}
              </div>
            )}

            {reseedMessage && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-xs p-2.5 rounded-lg font-mono">
                {reseedMessage}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Re-enter Admin Security Password</label>
              <input 
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-red/60"
              />
            </div>

            <div className="flex gap-3 justify-end mt-2 font-sans">
              <button
                type="button"
                onClick={() => {
                  setShowReseedModal(false);
                  setConfirmPassword('');
                  setReseedError('');
                  setReseedMessage('');
                }}
                disabled={reseedLoading}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-800 bg-slate-950 text-slate-400 hover:text-white cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={reseedLoading || !confirmPassword}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-red hover:bg-red/90 text-white cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {reseedLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'EXECUTE RESEED'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
