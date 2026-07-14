import React, { useState } from 'react';
import { Wrench, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ContractorDashboard from './contractor/ContractorDashboard';

export default function ContractorApp() {
  const { logout } = useAuth();
  const [isOnline, setIsOnline] = useState(true);

  return (
    <div className="w-full bg-zinc-950 border border-zinc-800 rounded-3xl shadow-lg flex flex-col overflow-hidden animate-fadeIn text-zinc-100">
      {/* BRANDING HEADER */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img 
            src="/logo.png" 
            alt="Same Day Assist Logo" 
            onClick={() => setIsOnline(true)}
            className="w-10 h-10 object-contain shrink-0 cursor-pointer" 
          />
          <div>
            <h1 className="text-lg font-black italic text-white leading-none uppercase">Same Day Assist</h1>
            <p className="text-[10px] font-mono tracking-wider text-red font-bold uppercase font-brand-sub">Contractor Responder Terminal</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-zinc-400 uppercase">Status:</span>
            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${isOnline ? 'bg-green-950 text-green-400 border border-green-800 animate-pulse' : 'bg-red-950 text-red-400'}`}>
              {isOnline ? 'ONLINE & READY' : 'OFFLINE'}
            </span>
          </div>
          <button 
            type="button"
            onClick={() => setIsOnline(!isOnline)} 
            className="text-[10px] bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-xl text-zinc-300 font-mono transition-all border border-zinc-700 cursor-pointer"
          >
            Toggle Duty
          </button>
          <button
            type="button"
            onClick={() => logout()}
            className="p-2 bg-zinc-800 hover:bg-red/10 border border-zinc-700 rounded-xl cursor-pointer text-zinc-400 hover:text-red transition-all"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PORTAL VIEW CONTAINER */}
      <div className="p-6 md:p-8 flex-1 bg-zinc-900/45">
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
          <ContractorDashboard />
        </div>
      </div>
    </div>
  );
}
