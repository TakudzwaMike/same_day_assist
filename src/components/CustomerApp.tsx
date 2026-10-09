import React, { useState } from 'react';
import { Shield, Phone, Bell, FileText, User, LogOut, MapPin, Users, Wallet, Car, ShieldAlert, CreditCard, Settings, Sun, Moon, Building2 } from 'lucide-react';
import { useAppState } from '../contexts/AppStateContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import CustomerHome from './customer/CustomerHome';
import CustomerSettings from './customer/CustomerSettings';
import CustomerInvoices from './customer/CustomerInvoices';
import CustomerClaims from './customer/CustomerClaims';
import CustomerActiveJob from './customer/CustomerActiveJob';
import { LiveServiceTracker } from './customer/LiveServiceTracker';
import { SavedLocationsManager } from './customer/SavedLocationsManager';
import { AuthorisedContactsManager } from './customer/AuthorisedContactsManager';
import { CustomerWalletView } from './customer/CustomerWalletView';
import { CustomerPayments } from './customer/CustomerPayments';
import OnboardingCommandCentre from './customer/OnboardingCommandCentre';
import logoImg from '../assets/logo.png';

export default function CustomerApp() {
  const { state } = useAppState();
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [activeDeviceTab, setActiveDeviceTab] = useState<'home' | 'settings' | 'invoices' | 'claims' | 'properties' | 'vehicles' | 'locations' | 'contacts' | 'wallet' | 'payments'>('home');

  // Find active customer record by matching user ID or email, or constructing dynamically from logged-in user
  const activeCustomer = 
    state.customers.find(c => c.id === user?.id || c.email?.toLowerCase() === user?.email?.toLowerCase()) ||
    (user ? {
      id: user.id || 'cust-dynamic',
      name: user.name || user.email?.split('@')[0] || 'Customer',
      email: user.email,
      phone: user.phone || '+27 82 555 1000',
      address: user.address || 'Sandton, Johannesburg',
      accountType: (user as any).accountType || 'Residential',
      status: (user as any).status || 'ACTIVE',
      onboardingStatus: (user as any).onboardingStatus || (user as any).status || 'ACTIVE',
      package: (user as any).package || 'Diamond',
      repairsCount: (user as any).repairsCount || 0,
      totalPaid: (user as any).totalPaid || 0,
    } as any : state.customers[0]);

  const isFullyActive = 
    activeCustomer?.status === 'ACTIVE' || 
    activeCustomer?.status === 'Active' || 
    activeCustomer?.onboardingStatus === 'ACTIVE';

  const activeJob = state.jobs.find(j => (j.customerId === activeCustomer?.id || j.customerId === user?.id) && j.status !== 'Closed' && j.status !== 'Rated');
  const assignedContractor = activeJob ? state.contractors.find(c => c.id === activeJob.assignedContractorId) : null;

  return (
    <div className={`w-full rounded-3xl shadow-xl flex flex-col overflow-hidden animate-fadeIn transition-colors duration-200 ${
      isDark 
        ? 'bg-[#091C3E] border border-[#142D59] text-slate-100' 
        : 'bg-white border border-slate-200 text-slate-900'
    }`}>
      {/* BRANDING HEADER */}
      <div className={`px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 border-b ${
        isDark ? 'bg-[#050E20]/90 border-[#142D59]' : 'bg-slate-50 border-slate-100'
      }`}>
        <div className="flex items-center gap-3">
          <img 
            src={logoImg} 
            alt="Same Day Assist Logo" 
            onClick={() => setActiveDeviceTab('home')}
            className="w-10 h-10 object-contain shrink-0 cursor-pointer rounded-full bg-white p-0.5 shadow-xs" 
          />
          <div>
            <h1 className={`text-lg font-black italic leading-none uppercase font-brand-header ${
              isDark ? 'text-white' : 'text-navy'
            }`}>
              Same Day Assist
            </h1>
            <p className="text-[10px] font-bold text-red tracking-wider uppercase font-mono">Consumer Portal • Johannesburg Dispatch</p>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className={`flex items-center gap-1.5 p-1 rounded-2xl border w-full md:w-auto overflow-x-auto ${
          isDark ? 'bg-[#050E20] border-[#142D59]' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            type="button"
            onClick={() => setActiveDeviceTab('home')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeDeviceTab === 'home'
                ? 'bg-red text-white shadow-xs'
                : isDark ? 'text-slate-400 hover:text-white hover:bg-[#142D59]' : 'text-slate-500 hover:text-navy hover:bg-slate-50'
            }`}
          >
            <Shield className="w-4 h-4 text-white" />
            <span>{isFullyActive ? 'Emergency Dispatch' : 'Onboarding'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveDeviceTab('wallet')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeDeviceTab === 'wallet'
                ? 'bg-red text-white shadow-xs'
                : isDark ? 'text-slate-400 hover:text-white hover:bg-[#142D59]' : 'text-slate-500 hover:text-navy hover:bg-slate-50'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Digital Wallet</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveDeviceTab('properties')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeDeviceTab === 'properties' || (activeDeviceTab as any) === 'vehicles' || (activeDeviceTab as any) === 'locations'
                ? 'bg-red text-white shadow-xs'
                : isDark ? 'text-slate-400 hover:text-white hover:bg-[#142D59]' : 'text-slate-500 hover:text-navy hover:bg-slate-50'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>My Properties</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveDeviceTab('contacts')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeDeviceTab === 'contacts'
                ? 'bg-red text-white shadow-xs'
                : isDark ? 'text-slate-400 hover:text-white hover:bg-[#142D59]' : 'text-slate-500 hover:text-navy hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Next of Kin</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveDeviceTab('claims')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeDeviceTab === 'claims'
                ? 'bg-red text-white shadow-xs'
                : isDark ? 'text-slate-400 hover:text-white hover:bg-[#142D59]' : 'text-slate-500 hover:text-navy hover:bg-slate-50'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Claims</span>
            {state.claims && state.claims.length > 0 && (
              <span className="bg-red text-white text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold">
                {state.claims.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveDeviceTab('invoices')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeDeviceTab === 'invoices'
                ? 'bg-red text-white shadow-xs'
                : isDark ? 'text-slate-400 hover:text-white hover:bg-[#142D59]' : 'text-slate-500 hover:text-navy hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Invoices</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveDeviceTab('payments')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeDeviceTab === 'payments'
                ? 'bg-red text-white shadow-xs'
                : isDark ? 'text-slate-400 hover:text-white hover:bg-[#142D59]' : 'text-slate-500 hover:text-navy hover:bg-slate-50'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Billing</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveDeviceTab('settings')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeDeviceTab === 'settings'
                ? 'bg-red text-white shadow-xs'
                : isDark ? 'text-slate-400 hover:text-white hover:bg-[#142D59]' : 'text-slate-500 hover:text-navy hover:bg-slate-50'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>

        {/* HEADER CONTROLS: THEME TOGGLE, HOTLINE, LOGOUT */}
        <div className="flex items-center gap-2">
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
            <span className="hidden sm:inline text-[10px]">{isDark ? 'Light Mode' : 'Navy Dark'}</span>
          </button>

          <a
            href="tel:+27115559111"
            className="flex items-center gap-1.5 px-3 py-2 bg-red/10 hover:bg-red/20 border border-red/20 text-red text-xs font-bold rounded-xl transition-all"
            title="Call 24/7 Operations Hotline"
          >
            <Phone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hotline</span>
          </a>

          <button
            type="button"
            onClick={() => setActiveDeviceTab('settings')}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              activeDeviceTab === 'settings'
                ? 'bg-red text-white border-red'
                : isDark ? 'bg-[#050E20] border-[#142D59] text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-navy'
            }`}
            title="Customer Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

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

      {/* PORTAL TAB VIEW */}
      <div className={`p-6 md:p-8 flex-1 transition-colors duration-200 ${
        isDark ? 'bg-[#050E20]/60' : 'bg-slate-50/50'
      }`}>
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
          {activeDeviceTab === 'home' && (
            !isFullyActive ? (
              <OnboardingCommandCentre customer={activeCustomer} />
            ) : activeJob ? (
              <LiveServiceTracker job={activeJob} />
            ) : (
              <CustomerHome 
                activeCustomer={activeCustomer} 
                activeJob={activeJob} 
                assignedContractor={assignedContractor}
                onNavigateTab={setActiveDeviceTab}
              />
            )
          )}
          {activeDeviceTab === 'wallet' && (
            <CustomerWalletView />
          )}
          {(activeDeviceTab === 'properties' || (activeDeviceTab as any) === 'vehicles' || (activeDeviceTab as any) === 'locations') && (
            <SavedLocationsManager />
          )}
          {activeDeviceTab === 'contacts' && (
            <AuthorisedContactsManager />
          )}
          {(activeDeviceTab === 'settings' || (activeDeviceTab as any) === 'profile') && (
            <CustomerSettings activeCustomer={activeCustomer} onNavigateTab={(tab: any) => setActiveDeviceTab(tab)} />
          )}
          {activeDeviceTab === 'claims' && (
            <CustomerClaims onNavigateTab={setActiveDeviceTab} />
          )}
          {activeDeviceTab === 'invoices' && (
            <CustomerInvoices activeCustomer={activeCustomer} onNavigateTab={setActiveDeviceTab} />
          )}
          {activeDeviceTab === 'payments' && (
            <CustomerPayments onNavigateTab={setActiveDeviceTab} />
          )}
        </div>
      </div>

    </div>
  );
}

