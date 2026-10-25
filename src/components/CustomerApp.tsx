import React, { useState } from 'react';
import { 
  Shield, 
  Phone, 
  FileText, 
  LogOut, 
  Users, 
  Wallet, 
  ShieldAlert, 
  CreditCard, 
  Settings, 
  Sun, 
  Moon, 
  Building2, 
  Headphones,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Award
} from 'lucide-react';
import { useAppState } from '../contexts/AppStateContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import CustomerHome from './customer/CustomerHome';
import CustomerSettings from './customer/CustomerSettings';
import CustomerInvoices from './customer/CustomerInvoices';
import CustomerClaims from './customer/CustomerClaims';
import { LiveServiceTracker } from './customer/LiveServiceTracker';
import { SavedLocationsManager } from './customer/SavedLocationsManager';
import { CustomerWalletView } from './customer/CustomerWalletView';
import { CustomerPayments } from './customer/CustomerPayments';
import { CustomerContactModal } from './customer/CustomerContactModal';
import OnboardingCommandCentre from './customer/OnboardingCommandCentre';
import logoImg from '../assets/logo.png';

export default function CustomerApp() {
  const { state } = useAppState();
  const { user, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const [activeDeviceTab, setActiveDeviceTab] = useState<'home' | 'settings' | 'invoices' | 'claims' | 'properties' | 'locations' | 'contacts' | 'wallet' | 'payments'>('home');
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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

  const unpaidInvoicesCount = state.invoices?.filter(i => (i.userId === user?.id || i.userId === activeCustomer?.id) && i.paymentStatus !== 'Paid').length || 0;
  const customerClaimsCount = state.claims?.filter(c => c.userId === user?.id || c.userId === activeCustomer?.id).length || state.claims?.length || 0;

  const tabs = [
    {
      id: 'home',
      label: isFullyActive ? 'Emergency Dispatch' : 'Onboarding Hub',
      icon: Shield,
      badge: activeJob ? 1 : undefined,
    },
    {
      id: 'wallet',
      label: 'Digital Wallet',
      icon: Wallet,
    },
    {
      id: 'properties',
      label: 'My Properties',
      icon: Building2,
    },
    {
      id: 'claims',
      label: 'Service Claims',
      icon: ShieldAlert,
      badge: customerClaimsCount > 0 ? customerClaimsCount : undefined,
    },
    {
      id: 'invoices',
      label: 'Tax Invoices',
      icon: FileText,
      badge: unpaidInvoicesCount > 0 ? unpaidInvoicesCount : undefined,
    },
    {
      id: 'payments',
      label: 'Plan Billing',
      icon: CreditCard,
    },
    {
      id: 'contacts',
      label: 'Authorised Contacts',
      icon: Users,
    },
    {
      id: 'settings',
      label: 'Account & Security',
      icon: Settings,
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
              onClick={() => setActiveDeviceTab('home')}
              className="w-10 h-10 object-contain shrink-0 cursor-pointer rounded-full bg-white p-0.5 shadow-md" 
            />
            <div>
              <h1 className="text-lg font-brand-header tracking-wide uppercase leading-tight">SAME DAY ASSIST</h1>
              <p className="text-[10px] font-brand-sub text-red font-bold uppercase tracking-widest">
                CONSUMER COMMAND PORTAL • JOHANNESBURG DISPATCH
              </p>
            </div>
          </div>

          <span className="text-[10px] text-slate-300 font-mono lg:hidden">
            {activeCustomer?.package || 'Diamond'} Tier
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
              <span className="text-[9px] text-slate-300/80 uppercase font-mono block">Membership Tier</span>
              <span className="text-xs font-bold text-white font-mono flex items-center gap-1 justify-end">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                {activeCustomer?.package || 'Diamond'}
              </span>
            </div>
            <div>
              <span className="text-[9px] text-slate-300/80 uppercase font-mono block">Account Status</span>
              <span className={`text-xs font-bold font-mono ${isFullyActive ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isFullyActive ? 'ACTIVE MEMBER' : 'PENDING ACTIVATION'}
              </span>
            </div>
            <div>
              <span className="text-[9px] text-slate-300/80 uppercase font-mono block">SLA Standards</span>
              <span className="text-xs font-bold text-red font-mono">24/7 RAPID DISPATCH</span>
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

            {/* Support & Contact Modal Button */}
            <button
              type="button"
              onClick={() => setIsContactModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              title="Customer Support, Callback & Enquiries"
            >
              <Headphones className="w-3.5 h-3.5 text-red" />
              <span className="hidden sm:inline">Support</span>
            </button>

            {/* Emergency 24/7 Hotline Button */}
            <a
              href="tel:+27115559111"
              className="flex items-center gap-1.5 px-3 py-2 bg-red hover:bg-red-hover text-white text-xs font-bold rounded-xl transition-all shadow-md"
              title="Call 24/7 Operations Hotline"
            >
              <Phone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hotline</span>
            </a>

            {/* Log Out */}
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
              const isActive = 
                activeDeviceTab === tab.id || 
                (tab.id === 'properties' && (activeDeviceTab as any) === 'locations') ||
                (tab.id === 'contacts' && (activeDeviceTab as any) === 'contacts');

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveDeviceTab(tab.id as any)}
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
          {!isSidebarCollapsed && (
            <div className={`p-3 m-3 rounded-2xl border ${
              isDark ? 'bg-[#050E20] border-[#142D59]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
                  Dispatch Connected
                </span>
              </div>
              <p className="text-[10.5px] font-bold truncate text-slate-300">
                {activeCustomer?.name || 'Customer Account'}
              </p>
              <span className="text-[9.5px] text-slate-500 font-mono truncate block">
                {activeCustomer?.email || user?.email}
              </span>
            </div>
          )}
        </aside>

        {/* MAIN VIEW CONTENT CONTAINER */}
        <main className={`flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 transition-colors duration-200 ${
          isDark ? 'bg-[#050E20]/60' : 'bg-slate-50/50'
        }`}>
          <div className="max-w-5xl mx-auto flex flex-col gap-6">
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
            {(activeDeviceTab === 'properties' || (activeDeviceTab as any) === 'locations') && (
              <SavedLocationsManager />
            )}
            {(activeDeviceTab === 'settings' || (activeDeviceTab as any) === 'profile' || activeDeviceTab === 'contacts') && (
              <CustomerSettings 
                activeCustomer={activeCustomer} 
                initialSubTab={activeDeviceTab === 'contacts' ? 'contacts' : undefined}
                onNavigateTab={(tab: any) => setActiveDeviceTab(tab)} 
              />
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
        </main>
      </div>

      {/* CUSTOMER COMMUNICATION & CONTACT MODAL */}
      <CustomerContactModal 
        isOpen={isContactModalOpen} 
        onClose={() => setIsContactModalOpen(false)} 
      />
    </div>
  );
}
