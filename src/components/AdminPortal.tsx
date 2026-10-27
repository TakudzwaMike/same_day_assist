import React, { useState } from 'react';
import { 
  Shield, Clipboard, Activity, FileText, Users, LogOut, UserCheck, 
  FileCheck, ShieldCheck, ShieldAlert, Award, Receipt, Settings, 
  CheckCircle2, ClipboardCheck, Sun, Moon, Menu, ChevronLeft, ChevronRight,
  PanelLeftClose, PanelLeftOpen, Wallet
} from 'lucide-react';
import { useAppState } from '../contexts/AppStateContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import AdminDashboard from './admin/AdminDashboard';
import EnquiriesManager from './admin/EnquiriesManager';
import ContractorsMonitor from './admin/ContractorsMonitor';
import ReportsViewer from './admin/ReportsViewer';
import AuditLogViewer from './admin/AuditLogViewer';
import { AdminProfileRequests } from './admin/AdminProfileRequests';
import { AdminVettingQueue } from './admin/AdminVettingQueue';
import { AdminOnboardingCommand } from './admin/AdminOnboardingCommand';
import AdminClaimsManager from './admin/AdminClaimsManager';
import AdminInvoicesManager from './admin/AdminInvoicesManager';
import AdminMembershipsManager from './admin/AdminMembershipsManager';
import { AdminCompletedJobsViewer } from './admin/AdminCompletedJobsViewer';
import { AdminTechnicalAssessmentsViewer } from './admin/AdminTechnicalAssessmentsViewer';
import { AdminSettingsModal } from './admin/AdminSettingsModal';
import { DispatcherEarningsView } from './admin/DispatcherEarningsView';
import logoImg from '../assets/logo.png';

export default function AdminPortal() {
  const { state } = useAppState();
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const role = user?.role || 'Dispatcher';

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024;
    }
    return true;
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'completedJobs' | 'technicalAssessments' | 'onboarding' | 'memberships' | 'claims' | 'invoices' | 'enquiries' | 'jobs' | 'reports' | 'logs' | 'profileRequests' | 'vetting' | 'dispatcherEarnings'>(() => {
    return role === 'Dispatcher' ? 'jobs' : 'overview';
  });

  const pendingEnquiries = state.enquiries.filter(e => e.status === 'Pending').length;
  const onboardingRequestsCount = state.enquiries.filter(e => e.status === 'WAITING_FOR_SURVEY' || e.status === 'SURVEY_COMPLETED').length;
  const criticalAlarms = state.jobs.filter(j => j.status === 'Requested').length;
  const completedJobsCount = state.jobs.filter(j => ['Completed', 'Service Completed', 'Work Completed', 'Closed', 'Rated'].includes(j.status)).length;
  const assessmentsCount = state.assessments.length;
  const pendingClaimsCount = (state.claims || []).filter(c => c.status === 'Submitted' || c.status === 'Under Review').length;
  const unpaidInvoicesCount = (state.invoices || []).filter(i => i.paymentStatus === 'UNPAID' || i.paymentStatus === 'PARTIALLY_PAID').length;
  const totalRevenue = state.payments.reduce((sum, p) => p.status === 'Paid' ? sum + p.amount : sum, 0);

  // Dynamic tabs based on user role permissions (Item 10: Property Assessments label)
  const tabs = [];
  if (role === 'Dispatcher') {
    tabs.push({ id: 'onboarding', label: 'Onboarding Assessments', icon: ShieldCheck, badge: onboardingRequestsCount });
    tabs.push({ id: 'jobs', label: 'Emergency Dispatch', icon: Shield, badge: criticalAlarms });
    tabs.push({ id: 'completedJobs', label: 'Jobs Done & Records', icon: CheckCircle2, badge: completedJobsCount });
    tabs.push({ id: 'technicalAssessments', label: 'Technical Registers', icon: ClipboardCheck, badge: assessmentsCount });
    tabs.push({ id: 'claims', label: 'Service Claims', icon: ShieldAlert, badge: pendingClaimsCount });
    tabs.push({ id: 'vetting', label: 'Provider Vetting', icon: FileCheck });
    tabs.push({ id: 'enquiries', label: 'Assessments & Quotes', icon: FileText, badge: pendingEnquiries });
    tabs.push({ id: 'dispatcherEarnings', label: 'My Compensation & Earnings', icon: Wallet });
  } else if (role === 'Administrator') {
    tabs.push({ id: 'overview', label: 'Command Overview', icon: Activity });
    tabs.push({ id: 'completedJobs', label: 'Jobs Done & Safety Records', icon: CheckCircle2, badge: completedJobsCount });
    tabs.push({ id: 'technicalAssessments', label: 'Property Assessments', icon: ClipboardCheck, badge: assessmentsCount });
    tabs.push({ id: 'memberships', label: 'Customer Benefits', icon: Award });
    tabs.push({ id: 'claims', label: 'Claims Audit', icon: ShieldAlert, badge: pendingClaimsCount });
    tabs.push({ id: 'invoices', label: 'Tax Invoices', icon: FileText, badge: unpaidInvoicesCount });
    tabs.push({ id: 'onboarding', label: 'Onboarding Requests', icon: ShieldCheck, badge: onboardingRequestsCount });
    tabs.push({ id: 'vetting', label: 'Provider Vetting', icon: FileCheck });
    tabs.push({ id: 'enquiries', label: 'Assessments & Quotes', icon: FileText, badge: pendingEnquiries });
    tabs.push({ id: 'jobs', label: 'Emergency Dispatch', icon: Shield, badge: criticalAlarms });
    tabs.push({ id: 'profileRequests', label: 'Profile Approvals', icon: UserCheck });
    tabs.push({ id: 'reports', label: 'Analytics Suite', icon: Users });
  } else if (role === 'Super Administrator') {
    tabs.push({ id: 'overview', label: 'Command Overview', icon: Activity });
    tabs.push({ id: 'completedJobs', label: 'Jobs Done & Safety Records', icon: CheckCircle2, badge: completedJobsCount });
    tabs.push({ id: 'technicalAssessments', label: 'Property Assessments & Registers', icon: ClipboardCheck, badge: assessmentsCount });
    tabs.push({ id: 'memberships', label: 'Customer Benefits', icon: Award });
    tabs.push({ id: 'claims', label: 'Claims Audit', icon: ShieldAlert, badge: pendingClaimsCount });
    tabs.push({ id: 'invoices', label: 'Tax Invoices', icon: FileText, badge: unpaidInvoicesCount });
    tabs.push({ id: 'onboarding', label: 'Onboarding Requests', icon: ShieldCheck, badge: onboardingRequestsCount });
    tabs.push({ id: 'vetting', label: 'Provider Vetting', icon: FileCheck });
    tabs.push({ id: 'enquiries', label: 'Assessments & Quotes', icon: FileText, badge: pendingEnquiries });
    tabs.push({ id: 'jobs', label: 'Emergency Dispatch', icon: Shield, badge: criticalAlarms });
    tabs.push({ id: 'profileRequests', label: 'Profile Approvals', icon: UserCheck });
    tabs.push({ id: 'reports', label: 'Analytics Suite', icon: Users });
    tabs.push({ id: 'logs', label: 'Audit Trail', icon: Clipboard });
  }

  const getSubTitle = () => {
    if (role === 'Dispatcher') return 'Operations Dashboard';
    if (role === 'Administrator') return 'Administrator Command Hub';
    return 'Enterprise Command Hub';
  };

  const getRoleIndicator = () => {
    if (role === 'Dispatcher') return 'ROLE: DISPATCH_OPERATOR';
    if (role === 'Administrator') return 'ROLE: GENERAL_ADMINISTRATOR';
    return 'ROLE: SUPER_ADMINISTRATOR (ROOT)';
  };

  return (
    <div className={`w-full min-h-screen md:min-h-[700px] border-0 md:border rounded-none md:rounded-3xl shadow-none md:shadow-xl flex flex-col flex-1 overflow-hidden animate-fadeIn transition-colors duration-200 ${
      isDark 
        ? 'bg-[#050E20] border-[#142D59] text-slate-100' 
        : 'bg-slate-50 border-slate-200 text-slate-900'
    }`}>
      {/* ADMIN HEADER */}
      <div className={`px-3 py-2.5 sm:px-6 sm:py-4 flex flex-col lg:flex-row items-center justify-between gap-3 border-b relative shrink-0 ${
        isDark ? 'bg-[#091C3E] border-[#142D59] text-white' : 'bg-navy text-white border-navy-light'
      }`}>
        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Sidebar toggle button (Item 11) */}
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
              className="w-10 h-10 object-contain shrink-0 rounded-full bg-white p-0.5 shadow-md" 
            />
            <div>
              <h1 className="text-lg font-brand-header tracking-wide uppercase leading-tight">SAME DAY ASSIST</h1>
              <p className="text-[10px] font-brand-sub text-red font-bold uppercase tracking-widest">{getSubTitle()}</p>
            </div>
          </div>

          <span className="text-[10px] text-slate-300 font-mono lg:hidden">{getRoleIndicator()}</span>
        </div>
        
        {/* STATS TRAY, THEME TOGGLE (Item 13), SETTINGS & LOGOUT */}
        <div className="flex items-center gap-4 flex-wrap lg:flex-nowrap justify-end w-full lg:w-auto">
          <div className="hidden sm:flex gap-4 text-right">
            {role === 'Dispatcher' ? (
              <div>
                <span className="text-[9px] text-slate-300/80 uppercase font-medium block">Active Enquiries</span>
                <span className="text-xs font-bold text-white font-mono">{state.enquiries.length}</span>
              </div>
            ) : (
              <div>
                <span className="text-[9px] text-slate-300/80 uppercase font-medium block">ZAR Invoiced</span>
                <span className="text-xs font-bold text-white font-mono">R{totalRevenue.toLocaleString()}</span>
              </div>
            )}
            <div>
              <span className="text-[9px] text-slate-300/80 uppercase font-medium block">Active Jobs</span>
              <span className="text-xs font-bold text-emerald-400 font-mono">
                {state.jobs.filter(j => j.status !== 'Completed' && j.status !== 'Cancelled').length} Live
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle Button (Item 13) */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 cursor-pointer text-white transition-all flex items-center gap-1.5 text-xs font-bold"
              title={`Switch to ${isDark ? 'Clean Light Theme' : 'Navy Dark Theme'}`}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-300" />}
              <span className="hidden md:inline text-[11px]">{isDark ? 'Light' : 'Dark'}</span>
            </button>
            
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 cursor-pointer text-white transition-all flex items-center justify-center shrink-0"
              title="System & Account Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => logout()}
              className="p-2 rounded-xl bg-white/10 hover:bg-red/30 border border-white/20 cursor-pointer text-white transition-all flex items-center justify-center shrink-0"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* TWO-COLUMN LAYOUT: VERTICAL NAVIGATION SIDEBAR (Item 11) + CONTENT VIEWS */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Backdrop Overlay when sidebar is open */}
        {!isSidebarCollapsed && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden animate-fadeIn"
            onClick={() => setIsSidebarCollapsed(true)}
          />
        )}

        {/* VERTICAL SIDEBAR MENU (Item 11) */}
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
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id as any);
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

                  {tab.badge && tab.badge > 0 ? (
                    <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full shrink-0 font-mono ${
                      isActive 
                        ? 'bg-white text-red' 
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
          <div className={`p-3 border-t text-center ${
            isDark ? 'border-[#142D59] bg-[#050E20]/50' : 'border-slate-100 bg-slate-50'
          }`}>
            {!isSidebarCollapsed ? (
              <span className="text-[9.5px] font-mono text-slate-400 block truncate">
                {getRoleIndicator()}
              </span>
            ) : (
              <div className="w-2 h-2 rounded-full bg-emerald-500 mx-auto" title={getRoleIndicator()} />
            )}
          </div>
        </aside>

        {/* MAIN RENDER VIEWS (Item 13: Persistent Theme Styling) */}
        <main className={`flex-1 p-2.5 sm:p-5 md:p-6 lg:p-8 overflow-y-auto transition-colors duration-200 ${
          isDark ? 'bg-[#061229]/60 text-slate-100' : 'bg-slate-50/70 text-slate-900'
        }`}>
          {activeTab === 'overview' && <AdminDashboard />}
          {activeTab === 'completedJobs' && <AdminCompletedJobsViewer />}
          {activeTab === 'technicalAssessments' && <AdminTechnicalAssessmentsViewer />}
          {activeTab === 'memberships' && <AdminMembershipsManager />}
          {activeTab === 'claims' && <AdminClaimsManager />}
          {activeTab === 'invoices' && <AdminInvoicesManager />}
          {activeTab === 'onboarding' && <AdminOnboardingCommand />}
          {activeTab === 'vetting' && <AdminVettingQueue />}
          {activeTab === 'enquiries' && <EnquiriesManager />}
          {activeTab === 'jobs' && <ContractorsMonitor />}
          {activeTab === 'profileRequests' && <AdminProfileRequests />}
          {activeTab === 'reports' && <ReportsViewer />}
          {activeTab === 'logs' && <AuditLogViewer />}
          {activeTab === 'dispatcherEarnings' && <DispatcherEarningsView />}
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className={`md:hidden border-t px-2 py-1.5 flex items-center justify-around z-30 shrink-0 select-none ${
        isDark ? 'bg-[#091C3E] border-[#142D59]' : 'bg-white border-slate-200'
      }`}>
        {[
          tabs.find(t => t.id === 'overview' || t.id === 'jobs'),
          tabs.find(t => t.id === 'technicalAssessments'),
          tabs.find(t => t.id === 'claims'),
          tabs.find(t => t.id === 'enquiries'),
          tabs.find(t => t.id === 'reports' || t.id === 'dispatcherEarnings'),
        ].filter(Boolean).map((tab: any) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all relative ${
                isActive 
                  ? 'text-red font-bold' 
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-navy'
              }`}
            >
              <div className="relative">
                <tab.icon className="w-5 h-5" />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 bg-red text-white text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                    {tab.badge}
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

      {/* ADMIN SETTINGS MODAL */}
      <AdminSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
