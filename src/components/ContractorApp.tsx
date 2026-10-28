import React, { useState } from 'react';
import { 
  Wrench, 
  LogOut, 
  FileCheck, 
  MessageSquare, 
  Wallet, 
  Settings, 
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
  const { isDark } = useTheme();
  const [isOnline, setIsOnline] = useState(true);
  const [showVettingModal, setShowVettingModal] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024;
    }
    return true;
  });
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
    <div className={`w-full min-h-screen md:min-h-[700px] border-0 md:border rounded-none md:rounded-3xl shadow-none md:shadow-xl flex flex-col flex-1 overflow-hidden animate-fadeIn transition-colors duration-200 ${
      isDark 
        ? 'bg-[#050E20] border-[#142D59] text-slate-100' 
        : 'bg-white border-slate-200 text-slate-900'
    }`}>
      {/* BRANDING HEADER */}
      <div className={`px-3 py-2.5 sm:px-6 sm:py-4 flex flex-col lg:flex-row items-center justify-between gap-3 border-b relative shrink-0 transition-colors ${
        isDark 
          ? 'bg-[#091C3E] border-[#142D59] text-white' 
          : 'bg-white border-slate-200 text-navy shadow-2xs'
      }`}>
        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Sidebar toggle button */}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isDark 
                  ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white' 
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
              }`}
              title={isSidebarCollapsed ? "Expand Navigation Menu" : "Collapse Navigation Menu"}
            >
              {isSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>

            <img 
              src={logoImg} 
              alt="Same Day Assist Logo" 
              onClick={() => setContractorTab('jobs')}
              className="w-10 h-10 object-contain shrink-0 cursor-pointer rounded-full bg-white p-0.5 shadow-md border border-slate-200" 
            />
            <div>
              <h1 className={`text-lg font-brand-header tracking-wide uppercase leading-tight ${
                isDark ? 'text-white' : 'text-navy'
              }`}>
                SAME DAY ASSIST
              </h1>
              <p className="text-[10px] font-brand-sub text-red font-bold uppercase tracking-widest">
                Contractor & Responder Portal
              </p>
            </div>
          </div>

          <span className={`text-[10px] font-medium lg:hidden ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}>
            {user?.specialty || 'Certified Responder'}
          </span>
        </div>

        {/* STATS TRAY & QUICK CONTROLS */}
        <div className="flex items-center gap-4 flex-wrap lg:flex-nowrap justify-end w-full lg:w-auto">
          <div className="hidden sm:flex gap-4 text-right">
            <div>
              <span className={`text-[9px] uppercase font-medium block ${
                isDark ? 'text-slate-300/80' : 'text-slate-500'
              }`}>
                Vetting Status
              </span>
              <button
                type="button"
                onClick={() => setShowVettingModal(true)}
                className={`text-xs font-bold cursor-pointer hover:underline ${
                  verificationStatus === 'Approved' ? 'text-emerald-500' : 'text-amber-500'
                }`}
              >
                {verificationStatus === 'Approved' ? 'VERIFIED' : 'PENDING REVIEW'}
              </button>
            </div>
            <div>
              <span className={`text-[9px] uppercase font-medium block ${
                isDark ? 'text-slate-300/80' : 'text-slate-500'
              }`}>
                Availability
              </span>
              <button
                type="button"
                onClick={() => setIsOnline(!isOnline)}
                className={`text-xs font-bold cursor-pointer flex items-center gap-1 justify-end ${
                  isOnline ? 'text-emerald-500' : 'text-red'
                }`}
                title="Click to toggle availability"
              >
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-red'}`} />
                {isOnline ? 'ONLINE & READY' : 'OFFLINE'}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Provider Settings */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className={`p-2 rounded-xl border cursor-pointer transition-all flex items-center justify-center shrink-0 ${
                isDark 
                  ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white' 
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800 shadow-2xs'
              }`}
              title="Provider Account Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Log Out */}
            <button
              type="button"
              onClick={() => logout()}
              className={`p-2 rounded-xl border cursor-pointer transition-all flex items-center justify-center shrink-0 ${
                isDark 
                  ? 'bg-white/10 hover:bg-red/30 border-white/20 text-white' 
                  : 'bg-slate-100 hover:bg-red/10 hover:text-red border-slate-200 text-slate-700'
              }`}
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* TWO-COLUMN LAYOUT: VERTICAL NAVIGATION SIDEBAR + CONTENT VIEWS */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Backdrop Overlay when sidebar is open */}
        {!isSidebarCollapsed && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden animate-fadeIn"
            onClick={() => setIsSidebarCollapsed(true)}
          />
        )}

        {/* VERTICAL SIDEBAR MENU */}
        <aside
          className={`border-r transition-all duration-300 flex flex-col justify-between shrink-0 select-none z-50 ${
            isSidebarCollapsed 
              ? 'hidden md:flex md:w-18' 
              : 'fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl md:shadow-none md:relative md:w-64'
          } ${
            isDark 
              ? 'bg-[#091C3E] border-[#142D59]' 
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
                    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                      setIsSidebarCollapsed(true);
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
        <main className={`flex-1 overflow-y-auto p-2.5 sm:p-5 md:p-6 lg:p-8 transition-colors duration-200 ${
          isDark ? 'bg-[#050E20]/60' : 'bg-slate-50/50'
        }`}>
          <div className="max-w-5xl mx-auto flex flex-col gap-6 w-full">
            {contractorTab === 'jobs' && <ContractorDashboard />}
            {contractorTab === 'surveys' && <InspectorSurveyPortal />}
            {contractorTab === 'teamHub' && <TechnicalTeamHub />}
            {contractorTab === 'chat' && <ContractorChatCenter />}
            {contractorTab === 'earnings' && <ContractorEarningsView />}
          </div>
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className={`md:hidden border-t px-2 py-1.5 flex items-center justify-around z-30 shrink-0 select-none ${
        isDark ? 'bg-[#091C3E] border-[#142D59]' : 'bg-white border-slate-200'
      }`}>
        {tabs.filter(t => t.id !== 'settings').map((tab) => {
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
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all relative ${
                isActive 
                  ? 'text-red font-bold' 
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-navy'
              }`}
            >
              <div className="relative">
                <tab.icon className="w-5 h-5" />
                {tab.badge ? (
                  <span className="absolute -top-1 -right-2 bg-red text-white text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                    {typeof tab.badge === 'number' ? tab.badge : '!'}
                  </span>
                ) : null}
              </div>
              <span className="text-[9px] mt-0.5 tracking-tight truncate max-w-[68px]">
                {tab.label.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </nav>

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
