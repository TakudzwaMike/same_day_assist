import React, { useState } from 'react';
import { Shield, Clipboard, Activity, FileText, Users } from 'lucide-react';
import { useAppState } from '../contexts/AppStateContext';
import AdminDashboard from './admin/AdminDashboard';
import EnquiriesManager from './admin/EnquiriesManager';
import ContractorsMonitor from './admin/ContractorsMonitor';
import ReportsViewer from './admin/ReportsViewer';
import AuditLogViewer from './admin/AuditLogViewer';

export default function AdminPortal() {
  const { state } = useAppState();
  const [activeTab, setActiveTab] = useState<'overview' | 'enquiries' | 'jobs' | 'reports' | 'logs'>('overview');

  const pendingEnquiries = state.enquiries.filter(e => e.status === 'Pending').length;
  const criticalAlarms = state.jobs.filter(j => j.status === 'Requested').length;
  const totalRevenue = state.payments.reduce((sum, p) => p.status === 'Paid' ? sum + p.amount : sum, 0);

  return (
    <div className="w-full min-h-[600px] bg-slate-50 border border-slate-200 rounded-3xl shadow-lg flex flex-col overflow-hidden animate-fadeIn">
      {/* ADMIN HEADER */}
      <div className="bg-navy text-white px-8 py-5 flex justify-between items-center border-b border-navy-light relative">
        <div className="flex items-center gap-3">
          <div className="bg-red p-2.5 rounded-xl text-white shadow-md">
            <Shield className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-brand-header tracking-wide uppercase">SAME DAY ASSIST</h1>
            <p className="text-[10px] font-brand-sub text-red font-bold uppercase tracking-widest">Administrator Command Hub</p>
          </div>
        </div>
        
        {/* STATS TRAY */}
        <div className="flex gap-6 text-right">
          <div className="hidden sm:block">
            <span className="text-[9px] text-slate-400 uppercase font-mono block">Node Link</span>
            <span className="text-xs font-bold text-green-400 font-mono">SECURE SSL CONNECTION</span>
          </div>
          <div>
            <span className="text-[9px] text-slate-400 uppercase font-mono block">ZAR Invoiced</span>
            <span className="text-xs font-bold text-white font-mono">R{totalRevenue.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-[9px] text-slate-400 uppercase font-mono block">SLA Standards</span>
            <span className="text-xs font-bold text-red font-mono">99.4% ON-TIME</span>
          </div>
        </div>
      </div>

      {/* DASHBOARD NAVIGATION */}
      <div className="bg-white border-b border-slate-200 px-8 flex justify-between items-center text-sm overflow-x-auto">
        <div className="flex gap-1 shrink-0">
          {[
            { id: 'overview', label: 'Command Overview', icon: Activity },
            { id: 'enquiries', label: 'Surveys & Quotes', icon: FileText, badge: pendingEnquiries },
            { id: 'jobs', label: 'Emergency dispatch', icon: Shield, badge: criticalAlarms },
            { id: 'reports', label: 'Analytics Suite', icon: Users },
            { id: 'logs', label: 'Audit trail', icon: Clipboard }
          ].map(tab => (
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
        <span className="text-xs text-slate-400 font-mono hidden md:block select-none">ROLE: ROOT_COMMAND_ADMIN</span>
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
