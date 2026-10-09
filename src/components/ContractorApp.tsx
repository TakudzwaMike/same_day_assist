import React, { useState } from 'react';
import { Wrench, LogOut, Shield, FileCheck, MessageSquare, Wallet, Settings, Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ContractorDashboard from './contractor/ContractorDashboard';
import { ContractorVettingModal } from './contractor/ContractorVettingModal';
import { InspectorSurveyPortal } from './contractor/InspectorSurveyPortal';
import { ContractorChatCenter } from './contractor/ContractorChatCenter';
import { ContractorEarningsView } from './contractor/ContractorEarningsView';
import { ContractorSettingsModal } from './contractor/ContractorSettingsModal';
import logoImg from '../assets/logo.png';

export default function ContractorApp() {
  const { user, logout, refreshUser } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [isOnline, setIsOnline] = useState(true);
  const [showVettingModal, setShowVettingModal] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [contractorTab, setContractorTab] = useState<'jobs' | 'surveys' | 'chat' | 'earnings'>('jobs');

  const verificationStatus = user?.verificationStatus || 'Pending Review';

  return (
    <div className={`w-full rounded-3xl shadow-xl flex flex-col overflow-hidden animate-fadeIn transition-colors duration-200 ${
      isDark 
        ? 'bg-[#091C3E] border border-[#142D59] text-slate-100' 
        : 'bg-white border border-slate-200 text-slate-900'
    }`}>
      {/* BRANDING HEADER */}
      <div className={`px-6 py-4 flex flex-col xl:flex-row items-center justify-between gap-4 border-b ${
        isDark ? 'bg-[#050E20]/90 border-[#142D59]' : 'bg-slate-50 border-slate-100'
      }`}>
        <div className="flex items-center gap-3">
          <img 
            src={logoImg} 
            alt="Same Day Assist Logo" 
            onClick={() => setContractorTab('jobs')}
            className="w-10 h-10 object-contain shrink-0 cursor-pointer rounded-full bg-white p-0.5 shadow-xs" 
          />
          <div>
            <h1 className={`text-lg font-black italic leading-none uppercase font-brand-header ${
              isDark ? 'text-white' : 'text-navy'
            }`}>
              Same Day Assist
            </h1>
            <p className="text-[10px] font-bold text-red tracking-wider uppercase font-mono">
              Contractor Responder Terminal • Johannesburg Dispatch
            </p>
          </div>
        </div>

        {/* NAVIGATION TABS (UNIFORM PILL CONTAINER) */}
        <div className={`flex items-center gap-1.5 p-1 rounded-2xl border w-full xl:w-auto overflow-x-auto whitespace-nowrap scrollbar-none ${
          isDark ? 'bg-[#050E20] border-[#142D59]' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            type="button"
            onClick={() => setContractorTab('jobs')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              contractorTab === 'jobs'
                ? 'bg-red text-white shadow-xs'
                : isDark ? 'text-slate-400 hover:text-white hover:bg-[#142D59]' : 'text-slate-500 hover:text-navy hover:bg-slate-50'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Emergency Dispatches</span>
          </button>

          <button
            type="button"
            onClick={() => setContractorTab('surveys')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              contractorTab === 'surveys'
                ? 'bg-red text-white shadow-xs'
                : isDark ? 'text-slate-400 hover:text-white hover:bg-[#142D59]' : 'text-slate-500 hover:text-navy hover:bg-slate-50'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Property Safety Surveys</span>
          </button>

          <button
            type="button"
            onClick={() => setContractorTab('chat')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              contractorTab === 'chat'
                ? 'bg-red text-white shadow-xs'
                : isDark ? 'text-slate-400 hover:text-white hover:bg-[#142D59]' : 'text-slate-500 hover:text-navy hover:bg-slate-50'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Live Chat (Client & Admin)</span>
          </button>

          <button
            type="button"
            onClick={() => setContractorTab('earnings')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              contractorTab === 'earnings'
                ? 'bg-red text-white shadow-xs'
                : isDark ? 'text-slate-400 hover:text-white hover:bg-[#142D59]' : 'text-slate-500 hover:text-navy hover:bg-slate-50'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Balances & Payouts</span>
          </button>
        </div>

        {/* HEADER CONTROLS */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={() => setShowVettingModal(true)}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
              verificationStatus === 'Approved'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse'
            }`}
            title="Click to view vetting credentials"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Vetting: {verificationStatus}</span>
          </button>

          <button 
            type="button"
            onClick={() => setIsOnline(!isOnline)} 
            className={`text-[10px] font-mono font-bold px-3 py-1.5 rounded-xl transition-all border cursor-pointer flex items-center gap-1.5 ${
              isOnline 
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                : 'bg-red/10 text-red border-red/30'
            }`}
            title="Click to toggle availability"
          >
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red'}`} />
            <span>{isOnline ? 'ONLINE & READY' : 'OFFLINE'}</span>
          </button>

          {/* Theme Quick Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1 text-xs font-bold ${
              isDark 
                ? 'bg-[#050E20] border-[#142D59] text-blue-300 hover:bg-[#142D59]' 
                : 'bg-white border-slate-200 text-amber-600 hover:bg-slate-100'
            }`}
            title={`Switch to ${isDark ? 'Clean Light Theme' : 'Navy Dark Theme'}`}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-500" />}
          </button>

          {/* Settings Button */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isSettingsOpen
                ? 'bg-red text-white border-red'
                : isDark ? 'bg-[#050E20] border-[#142D59] text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-navy'
            }`}
            title="Provider Account Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Log Out Button */}
          <button
            type="button"
            onClick={() => logout()}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isDark ? 'bg-[#050E20] border-[#142D59] text-slate-400 hover:text-red hover:bg-red/10' : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-red hover:bg-red/10'
            }`}
            title="Sign Out"
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
      <div className={`p-6 md:p-8 flex-1 transition-colors ${
        isDark ? 'bg-[#061229]/60' : 'bg-slate-50/70'
      }`}>
        <div className="max-w-5xl mx-auto flex flex-col gap-6">
          {contractorTab === 'jobs' && <ContractorDashboard />}
          {contractorTab === 'surveys' && <InspectorSurveyPortal />}
          {contractorTab === 'chat' && <ContractorChatCenter />}
          {contractorTab === 'earnings' && <ContractorEarningsView />}
        </div>
      </div>

      {/* CONTRACTOR SETTINGS MODAL */}
      <ContractorSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
