import React from 'react';
import { Activity, Shield, Users, DollarSign, Volume2, AlertTriangle, Play } from 'lucide-react';
import { useAppState } from '../../contexts/AppStateContext';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminDashboard() {
  const { state, addAuditLogLocal } = useAppState();
  
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
    </div>
  );
}
