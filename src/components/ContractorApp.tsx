import React, { useState } from 'react';
import { 
  Wrench, 
  LogOut, 
  FileCheck, 
  MessageSquare, 
  Wallet, 
  Settings, 
  Sun, 
  Moon, 
  BookOpen,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  Award
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAppState } from '../contexts/AppStateContext';
import ContractorDashboard from './contractor/ContractorDashboard';
import { ContractorVettingModal } from './contractor/ContractorVettingModal';
import { InspectorSurveyPortal } from './contractor/InspectorSurveyPortal';
import { ContractorChatCenter } from './contractor/ContractorChatCenter';
import { ContractorEarningsView } from './contractor/ContractorEarningsView';
import { ContractorSettingsModal } from './contractor/ContractorSettingsModal';
import { TechnicalTeamHub } from './contractor/TechnicalTeamHub';
import logoImg from '../assets/logo.png';

export default function ContractorApp() {
  const { user, logout, refreshUser } = useAuth();
  const { state } = useAppState();
  const { toggleTheme, isDark } = useTheme();
  const [isOnline, setIsOnline] = useState(true);
  const [showVettingModal, setShowVettingModal] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [contractorTab, setContractorTab] = useState<'jobs' | 'surveys' | 'chat' | 'earnings' | 'teamHub'>('jobs');

  const verificationStatus = user?.verificationStatus || 'Pending Review';

  // Active jobs assigned to this contractor
  const assignedJobsCount = state.jobs.filter(j => j.assignedContractorId === user?.id && j.status !== 'Closed' && j.status !== 'Completed').length;
  // Pending surveys assigned to this contractor
  const assignedSurveysCount = state.assessments.filter(a => a.contractorId === user?.id && a.status !== 'Completed').length;

  const tabs = [
    {
      id: 'jobs',
      label: 'Emergency Dispatches',
      icon: Wrench,
      badge: assignedJobsCount > 0 ? assignedJobsCount : undefined,
    },
    {
      id: 'surveys',
      label: 'Property Assessments',
      icon: FileCheck,
      badge: assignedSurveysCount > 0 ? assignedSurveysCount : undefined,
    },
    {
      id: 'teamHub',
      label: 'Team Hub & Training',
      icon: BookOpen,
    },
    {
      id: 'chat',
      label: 'Live Dispatch Chat',
      icon: MessageSquare,
    },
    {
      id: 'earnings',
      label: 'Earnings & Rewards',
      icon: Wallet,
    },
    {
      id: 'vetting',
      label: 'Compliance & Vetting',
      icon: ShieldCheck,
      badge: verificationStatus !== 'Approved' ? 'Verify' : undefined,
      onClick: () => setShowVettingModal(true),
    },
    {
      id: 'settings',
      label: 'Provider Settings',
      icon: Settings,
      onClick: () => setIsSettingsOpen(true),
    },
  ];

  return (
    <div className={`w-full min-h-[700px] border rounded-3xl shadow-xl flex flex-col overflow-hidden animate-fadeIn transition-colors duration-200 ${
      isDark 
        ? 'bg-[#050E20] border-[#142D59] text-slate-100' 
        : 'bg-slate-50 border-slate-200 text-slate-900'
    }`}>
      {/* BRANDING HEADER */}
      <div className={`px-6 py-4 flex flex-col lg:flex-row items-center justify-between gap-4 border-b relative ${
        isDark ? 'bg-[#091C3E] border-[#142D59] text-white' : 'bg-navy text-white border-navy-light'
      }`}>
        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start">
          <div className="flex items-center gap-3">
            {/* Sidebar toggle button */}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
              title={isSidebarCollapsed ? "Expand Navigation Menu" : "Collapse Navigation Menu"}
            >
              {isSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>

            <img 
              src={logoImg} 
              alt="Same Day Assist Logo" 
              onClick={() => setContractorTab('jobs')}
              className="w-10 h-10 object-contain shrink-0 cursor-pointer rounded-full bg-white p-0.5 shadow-md" 
            />
            <div>
              <h1 className="text-lg font-brand-header tracking-wide uppercase leading-tight">SAME DAY ASSIST</h1>
              <p className="text-[10px] font-brand-sub text-red font-bold uppercase tracking-widest">
                TECHNICAL RESPONDER TERMINAL • DISPATCH HUB
              </p>
            </div>
          </div>

          <span className="text-[10px] text-slate-300 font-mono lg:hidden">
            {user?.specialty || 'Certified Responder'}
          </span>
        </div>

        {/* STATS TRAY & QUICK CONTROLS */}
        <div className="flex items-center gap-4 flex-wrap lg:flex-nowrap justify-end w-full lg:w-auto">
          <div className="hidden sm:flex gap-4 text-right">
            <div>
              <span className="text-[9px] text-slate-300/80 uppercase font-mono block">Node Link</span>
              <span className="text-xs font-bold text-emerald-400 font-mono">SECURE SSL</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-300/80 uppercase font-mono block">Vetting Status</span>
              <button
                type="button"
                onClick={() => setShowVettingModal(true)}
                className={`text-xs font-bold font-mono cursor-pointer hover:underline ${
                  verificationStatus === 'Approved' ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {verificationStatus === 'Approved' ? 'VERIFIED' : 'PENDING REVIEW'}
              </button>
            </div>
            <div>
              <span className="text-[9px] text-slate-300/80 uppercase font-mono block">Availability</span>
              <button
                type="button"
                onClick={() => setIsOnline(!isOnline)}
                className={`text-xs font-bold font-mono cursor-pointer flex items-center gap-1 justify-end ${
                  isOnline ? 'text-emerald-400' : 'text-red'
                }`}
                title="Click to toggle availability"
              >
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red'}`} />
                {isOnline ? 'ONLINE & READY' : 'OFFLINE'}
              </button>
            </div>
            <div>
              <span className="text-[9px] text-slate-300/80 uppercase font-mono block">SLA Standards</span>
              <span className="text-xs font-bold text-red font-mono">99.4% ON-TIME</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 cursor-pointer text-white transition-all flex items-center gap-1.5 text-xs font-bold"
              title={`Switch to ${isDark ? 'Clean Light Theme' : 'Navy Dark Theme'}`}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-blue-300" />}
              <span className="hidden xl:inline text-[11px] font-mono">{isDark ? 'Light' : 'Dark'}</span>
            </button>

            {/* Provider Settings */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 cursor-pointer text-white transition-all flex items-center justify-center shrink-0"
              title="Provider Account Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Log Out */}
            <button
              type="button"
              onClick={() => logout()}
              className="p-2 rounded-xl bg-white/10 hover:bg-red/30 border border-white/20 cursor-pointer text-white transition-all flex items-center justify-center shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* TWO-COLUMN LAYOUT: VERTICAL NAVIGATION SIDEBAR + CONTENT VIEWS */}
      <div className="flex-1 flex overflow-hidden">
        {/* VERTICAL SIDEBAR MENU */}
        <aside
          className={`border-r transition-all duration-300 flex flex-col justify-between shrink-0 select-none ${
            isSidebarCollapsed ? 'w-18' : 'w-64'
          } ${
            isDark 
              ? 'bg-[#091C3E]/80 border-[#142D59]' 
              : 'bg-white border-slate-200'
          }`}
        >
          {/* Scrollable vertical navigation menu list */}
          <div className="p-3 overflow-y-auto space-y-1">
            {!isSidebarCollapsed && (
              <div className="px-3 py-1.5 mb-1 flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Navigation Menu
                </span>
                <span className="text-[9px] font-mono text-slate-500">
                  {tabs.length} Modules
                </span>
              </div>
            )}

            {tabs.map((tab) => {
              const isActive = contractorTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    if (tab.onClick) {
                      tab.onClick();
                    } else {
                      setContractorTab(tab.id as any);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer text-left relative group ${
                    isActive
                      ? 'bg-red text-white shadow-md'
                      : isDark
                        ? 'text-slate-300 hover:text-white hover:bg-[#142D59]'
                        : 'text-slate-600 hover:text-navy hover:bg-slate-100'
                  }`}
                  title={isSidebarCollapsed ? tab.label : undefined}
                >
                  <tab.icon className="w-4 h-4 shrink-0" />
                  
                  {!isSidebarCollapsed && (
                    <span className="truncate flex-1">{tab.label}</span>
                  )}

                  {tab.badge ? (
                    <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full shrink-0 font-mono ${
                      isActive 
                        ? 'bg-white text-red' 
                        : typeof tab.badge === 'string'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-red text-white animate-pulse'
                    }`}>
                      {tab.badge}
                    </span>
                  ) : null}

                  {/* Tooltip on collapsed state */}
                  {isSidebarCollapsed && (
                    <div className="absolute left-full ml-2 px-2.5 py-1 bg-slate-900 text-white text-[11px] rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                      {tab.label} {tab.badge ? `(${tab.badge})` : ''}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Sidebar bottom indicator */}
          {!isSidebarCollapsed && (
            <div className={`p-3 m-3 rounded-2xl border ${
              isDark ? 'bg-[#050E20] border-[#142D59]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red'}`} />
                <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
                  {isOnline ? 'Active On Duty' : 'Standby Mode'}
                </span>
              </div>
              <p className="text-[10.5px] font-bold truncate text-slate-300">
                {user?.name || 'Technical Responder'}
              </p>
              <span className="text-[9.5px] text-slate-500 font-mono truncate block">
                {user?.specialty || 'Certified Specialist'}
              </span>
            </div>
          )}
        </aside>

        {/* MAIN VIEW CONTENT CONTAINER */}
        <main className={`flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 transition-colors duration-200 ${
          isDark ? 'bg-[#050E20]/60' : 'bg-slate-50/50'
        }`}>
          <div className="max-w-5xl mx-auto flex flex-col gap-6">
            {contractorTab === 'jobs' && <ContractorDashboard />}
            {contractorTab === 'surveys' && <InspectorSurveyPortal />}
            {contractorTab === 'teamHub' && <TechnicalTeamHub />}
            {contractorTab === 'chat' && <ContractorChatCenter />}
            {contractorTab === 'earnings' && <ContractorEarningsView />}
          </div>
        </main>
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

      {/* CONTRACTOR SETTINGS MODAL */}
      <ContractorSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
