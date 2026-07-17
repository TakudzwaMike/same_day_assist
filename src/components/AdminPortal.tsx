import React, { useState } from 'react';
import { Shield, Clipboard, Activity, FileText, Users, LogOut } from 'lucide-react';
import { useAppState } from '../contexts/AppStateContext';
import { useAuth } from '../contexts/AuthContext';
import AdminDashboard from './admin/AdminDashboard';
import EnquiriesManager from './admin/EnquiriesManager';
import ContractorsMonitor from './admin/ContractorsMonitor';
import ReportsViewer from './admin/ReportsViewer';
import AuditLogViewer from './admin/AuditLogViewer';

export default function AdminPortal() {
  const { state } = useAppState();
  const { user, logout } = useAuth();
  const role = user?.role || 'Dispatcher';

  const [activeTab, setActiveTab] = useState<'overview' | 'enquiries' | 'jobs' | 'reports' | 'logs'>(() => {
    return role === 'Dispatcher' ? 'jobs' : 'overview';
  });

  const pendingEnquiries = state.enquiries.filter(e => e.status === 'Pending').length;
  const criticalAlarms = state.jobs.filter(j => j.status === 'Requested').length;
  const totalRevenue = state.payments.reduce((sum, p) => p.status === 'Paid' ? sum + p.amount : sum, 0);

  // Dynamic tabs based on user role permissions
  const tabs = [];
  if (role === 'Dispatcher') {
    tabs.push({ id: 'jobs', label: 'Emergency dispatch', icon: Shield, badge: criticalAlarms });
    tabs.push({ id: 'enquiries', label: 'Surveys & Quotes', icon: FileText, badge: pendingEnquiries });
  } else if (role === 'Administrator') {
    tabs.push({ id: 'overview', label: 'Command Overview', icon: Activity });
    tabs.push({ id: 'enquiries', label: 'Surveys & Quotes', icon: FileText, badge: pendingEnquiries });
    tabs.push({ id: 'jobs', label: 'Emergency dispatch', icon: Shield, badge: criticalAlarms });
    tabs.push({ id: 'reports', label: 'Analytics Suite', icon: Users });
  } else if (role === 'Super Administrator') {
    tabs.push({ id: 'overview', label: 'Command Overview', icon: Activity });
    tabs.push({ id: 'enquiries', label: 'Surveys & Quotes', icon: FileText, badge: pendingEnquiries });
    tabs.push({ id: 'jobs', label: 'Emergency dispatch', icon: Shield, badge: criticalAlarms });
    tabs.push({ id: 'reports', label: 'Analytics Suite', icon: Users });
    tabs.push({ id: 'logs', label: 'Audit trail', icon: Clipboard });
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
    <div className="w-full min-h-[600px] bg-slate-50 border border-slate-200 rounded-3xl shadow-lg flex flex-col overflow-hidden animate-fadeIn">
      {/* ADMIN HEADER */}
      <div className="bg-navy text-white px-8 py-5 flex justify-between items-center border-b border-navy-light relative">
        <div className="flex items-center gap-3">
          <div className="mx-auto w-10 h-10 rounded-full flex items-center justify-center bg-red/10 border border-red/20 shrink-0">
            <Shield className="w-5 h-5 text-red" />
          </div>
          <div>
            <h1 className="text-lg font-brand-header tracking-wide uppercase">SAME DAY ASSIST</h1>
            <p className="text-[10px] font-brand-sub text-red font-bold uppercase tracking-widest">{getSubTitle()}</p>
          </div>
        </div>
        
        {/* STATS TRAY & LOGOUT */}
        <div className="flex items-center gap-6">
          <div className="flex gap-6 text-right">
            <div className="hidden sm:block">
              <span className="text-[9px] text-slate-400 uppercase font-mono block">Node Link</span>
              <span className="text-xs font-bold text-green-400 font-mono">SECURE SSL CONNECTION</span>
            </div>
            {role === 'Dispatcher' ? (
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-mono block">Active Enquiries</span>
                <span className="text-xs font-bold text-white font-mono">{state.enquiries.length}</span>
              </div>
            ) : (
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-mono block">ZAR Invoiced</span>
                <span className="text-xs font-bold text-white font-mono">R{totalRevenue.toLocaleString()}</span>
              </div>
            )}
            <div>
              <span className="text-[9px] text-slate-400 uppercase font-mono block">SLA Standards</span>
              <span className="text-xs font-bold text-red font-mono">99.4% ON-TIME</span>
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => logout()}
            className="p-2.5 bg-slate-900/50 hover:bg-red/20 border border-slate-800 rounded-xl cursor-pointer text-slate-300 hover:text-white transition-all flex items-center justify-center shrink-0"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* DASHBOARD NAVIGATION */}
      <div className="bg-white border-b border-slate-200 px-8 flex justify-between items-center text-sm overflow-x-auto">
        <div className="flex gap-1 shrink-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-4 flex items-center gap-2 border-b-2 font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'border-red text-red font-bold bg-slate-50/50' 
                  : 'border-transparent text-slate-600 hover:text-navy hover:border-slate-200'
              }`}
            >
              <tab.icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
              {tab.badge && tab.badge > 0 ? (
                <span className="bg-red text-white text-[9.5px] font-bold px-1.5 py-0.2 rounded-full leading-none shrink-0 animate-pulse">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400 font-mono hidden md:block select-none">{getRoleIndicator()}</span>
      </div>

      {/* RENDER VIEWS */}
      <div className="flex-1 p-8 overflow-y-auto bg-slate-50/55">
        {activeTab === 'overview' && <AdminDashboard />}
        {activeTab === 'enquiries' && <EnquiriesManager />}
        {activeTab === 'jobs' && <ContractorsMonitor />}
        {activeTab === 'reports' && <ReportsViewer />}
        {activeTab === 'logs' && <AuditLogViewer />}
      </div>
    </div>
  );
}
