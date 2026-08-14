import React, { useState } from 'react';
import { Wrench, LogOut, Shield, FileCheck, MessageSquare, Wallet } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ContractorDashboard from './contractor/ContractorDashboard';
import { ContractorVettingModal } from './contractor/ContractorVettingModal';
import { InspectorSurveyPortal } from './contractor/InspectorSurveyPortal';
import { ContractorChatCenter } from './contractor/ContractorChatCenter';
import { ContractorEarningsView } from './contractor/ContractorEarningsView';
import logoImg from '../assets/logo.png';

export default function ContractorApp() {
  const { user, logout, refreshUser } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [showVettingModal, setShowVettingModal] = useState(false);
  const [contractorTab, setContractorTab] = useState<'jobs' | 'surveys' | 'chat' | 'earnings'>('jobs');

  const verificationStatus = user?.verificationStatus || 'Pending Review';

  return (
    <div className="w-full bg-zinc-950 border border-zinc-800 rounded-3xl shadow-lg flex flex-col overflow-hidden animate-fadeIn text-zinc-100">
      {/* BRANDING HEADER */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex flex-col xl:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img 
            src={logoImg} 
            alt="Same Day Assist Logo" 
            onClick={() => setIsOnline(true)}
            className="w-10 h-10 object-contain shrink-0 cursor-pointer" 
          />
          <div>
            <h1 className="text-lg font-black italic text-white leading-none uppercase">Same Day Assist</h1>
            <p className="text-[10px] font-mono tracking-wider text-red font-bold uppercase font-brand-sub">Contractor Responder Terminal</p>
          </div>
        </div>

        {/* TAB BUTTONS */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800">
          <button
            type="button"
            onClick={() => setContractorTab('jobs')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              contractorTab === 'jobs' ? 'bg-red-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Emergency Dispatches</span>
          </button>

          <button
            type="button"
            onClick={() => setContractorTab('surveys')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              contractorTab === 'surveys' ? 'bg-red-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Property Safety Surveys</span>
          </button>

          <button
            type="button"
            onClick={() => setContractorTab('chat')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              contractorTab === 'chat' ? 'bg-red-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Live Chat (Client & Admin)</span>
          </button>

          <button
            type="button"
            onClick={() => setContractorTab('earnings')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              contractorTab === 'earnings' ? 'bg-red-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Balances & Payouts</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowVettingModal(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
              verificationStatus === 'Approved'
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : 'bg-amber-950 text-amber-400 border border-amber-800 animate-pulse'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Vetting: {verificationStatus}</span>
          </button>

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
            Toggle Availability
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

      {/* VETTING MODAL */}
      {showVettingModal && (
        <ContractorVettingModal
          user={user}
          onSuccess={() => {
            setShowVettingModal(false);
            refreshUser();
          }}
          onClose={() => setShowVettingModal(false)}
        />
      )}

      {/* PORTAL VIEW CONTAINER */}
      <div className="p-6 md:p-8 flex-1 bg-zinc-900/45">
        <div className="max-w-5xl mx-auto flex flex-col gap-6">
          {contractorTab === 'jobs' && <ContractorDashboard />}
          {contractorTab === 'surveys' && <InspectorSurveyPortal />}
          {contractorTab === 'chat' && <ContractorChatCenter />}
          {contractorTab === 'earnings' && <ContractorEarningsView />}
        </div>
      </div>
    </div>
  );
}

