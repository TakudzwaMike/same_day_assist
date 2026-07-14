import React, { useState } from 'react';
import { Shield, Phone, Bell, FileText, User, LogOut } from 'lucide-react';
import { useAppState } from '../contexts/AppStateContext';
import { useAuth } from '../contexts/AuthContext';
import CustomerHome from './customer/CustomerHome';
import CustomerProfile from './customer/CustomerProfile';
import CustomerInvoices from './customer/CustomerInvoices';
import CustomerActiveJob from './customer/CustomerActiveJob';

export default function CustomerApp() {
  const { state } = useAppState();
  const { user, logout } = useAuth();
  const [activeDeviceTab, setActiveDeviceTab] = useState<'home' | 'profile' | 'invoices'>('home');

  // Find active customer record
  const activeCustomer = state.customers.find(c => c.id === user?.id) || state.customers[0];
  const activeJob = state.jobs.find(j => j.customerId === activeCustomer?.id && j.status !== 'Closed' && j.status !== 'Rated');
  const assignedContractor = activeJob ? state.contractors.find(c => c.id === activeJob.assignedContractorId) : null;

  return (
    <div className="w-full bg-white border border-slate-200 rounded-3xl shadow-lg flex flex-col overflow-hidden animate-fadeIn">
      {/* BRANDING HEADER */}
      <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img 
            src="/logo.png" 
            alt="Same Day Assist Logo" 
            onClick={() => setActiveDeviceTab('home')}
            className="w-10 h-10 object-contain shrink-0 cursor-pointer" 
          />
          <div>
            <h1 className="text-lg font-black italic text-navy leading-none uppercase">Same Day Assist</h1>
            <p className="text-[10px] font-bold text-red tracking-wider uppercase">Consumer Portal • Johannesburg Dispatch</p>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200 w-full md:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveDeviceTab('home')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeDeviceTab === 'home'
                ? 'bg-white text-navy shadow-xs border border-slate-200/50'
                : 'text-slate-500 hover:text-navy hover:bg-slate-50'
            }`}
          >
            <Shield className="w-4 h-4 text-red" />
            <span>Emergency Dispatch</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveDeviceTab('invoices')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeDeviceTab === 'invoices'
                ? 'bg-white text-navy shadow-xs border border-slate-200/50'
                : 'text-slate-500 hover:text-navy hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span>Invoices & Quotes</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveDeviceTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeDeviceTab === 'profile'
                ? 'bg-white text-navy shadow-xs border border-slate-200/50'
                : 'text-slate-500 hover:text-navy hover:bg-slate-50'
            }`}
          >
            <User className="w-4 h-4 text-slate-500" />
            <span>Profile Settings</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="tel:+27115559111"
            className="flex items-center gap-2 px-3 py-2 bg-red/5 hover:bg-red/10 border border-red/10 text-red text-xs font-bold rounded-xl transition-all"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Hotline Support</span>
          </a>
          <button
            type="button"
            onClick={() => logout()}
            className="p-2 bg-slate-100 hover:bg-red/10 text-slate-500 hover:text-red border border-slate-200 rounded-xl cursor-pointer transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PORTAL TAB VIEW */}
      <div className="p-6 md:p-8 flex-1 bg-slate-50/50">
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
          {activeDeviceTab === 'home' && (
            activeJob ? (
              <CustomerActiveJob activeJob={activeJob} assignedContractor={assignedContractor} />
            ) : (
              <CustomerHome 
                activeCustomer={activeCustomer} 
                activeJob={activeJob} 
                assignedContractor={assignedContractor}
                onNavigateTab={setActiveDeviceTab}
              />
            )
          )}
          {activeDeviceTab === 'profile' && (
            <CustomerProfile activeCustomer={activeCustomer} />
          )}
          {activeDeviceTab === 'invoices' && (
            <CustomerInvoices activeCustomer={activeCustomer} />
          )}
        </div>
      </div>
    </div>
  );
}
