import React, { useState } from 'react';
import { 
  Shield, Users, Clipboard, DollarSign, Activity, FileText, CheckCircle, 
  MapPin, AlertTriangle, UserCheck, Star, Trash, Eye, Send, Search, Filter, 
  Clock, Plus, PlusCircle, Hammer, Zap, Droplet, Volume2
} from 'lucide-react';
import { AppState, Enquiry, Contractor, Customer, Job, ServiceCategory, Quotation, JourneyStep } from '../types';

interface AdminPortalProps {
  state: AppState;
  updateState: (newState: Partial<AppState>) => void;
  addAuditLog: (action: string, details: string) => void;
}

export default function AdminPortal({ state, updateState, addAuditLog }: AdminPortalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'enquiries' | 'jobs' | 'crm' | 'billing' | 'logs'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  
  // Custom manual scheduling states
  const [selectedEnqIdForAssess, setSelectedEnqIdForAssess] = useState<string | null>(null);
  const [targetContractorId, setTargetContractorId] = useState('');
  
  // Custom manual Quote generator states
  const [selectedEnqIdForQuote, setSelectedEnqIdForQuote] = useState<string | null>(null);
  const [quoteItems, setQuoteItems] = useState<{ desc: string, cost: number }[]>([
    { desc: 'Breaker board safety module upgrade', cost: 850 },
    { desc: 'Electronic gate sensor alignment & waterproofing', cost: 650 }
  ]);
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemCost, setNewItemCost] = useState(0);

  // Active Enquiries
  const enquiries = state.enquiries;
  const activeJobs = state.jobs;
  const customers = state.customers;
  const contractors = state.contractors;

  // Filter calculations
  const totalRevenue = state.payments.reduce((sum, p) => p.status === 'Paid' ? sum + p.amount : sum, 0);
  const activeMembers = customers.filter(c => c.status === 'Active').length;
  const pendingEnquiries = enquiries.filter(e => e.status === 'Pending').length;
  const criticalAlarms = activeJobs.filter(j => j.status === 'Requested').length;

  // Trigger: Schedule Property Assessment for Enquiry
  const handleScheduleAssessment = (enqId: string, contractorId: string) => {
    if (!contractorId) {
      alert('Please select a contractor to perform the survey.');
      return;
    }

    const updatedEnquiries = state.enquiries.map(enq => 
      enq.id === enqId ? { ...enq, status: 'Scheduled' as const } : enq
    );

    // Create a mock assessment schedule
    const newAss = {
      id: `ass-${Date.now().toString().slice(-3)}`,
      enquiryId: enqId,
      contractorId: contractorId,
      scheduledAt: new Date().toISOString(),
      issuesFound: [],
      estimatedCost: 0,
      status: 'Scheduled' as const
    };

    updateState({
      enquiries: updatedEnquiries,
      assessments: [newAss, ...state.assessments],
      currentStep: 'ASSESSMENT_SCHEDULED'
    });

    const targetC = state.contractors.find(c => c.id === contractorId);
    const targetE = state.enquiries.find(e => e.id === enqId);
    addAuditLog('Assessment Scheduled', `Administrator scheduled property survey for ${targetE?.customerName} with Surveyor ${targetC?.name}.`);
    setSelectedEnqIdForAssess(null);
  };

  // Trigger: Administrator sends finalized pre-compliance Quote to client
  const handleSendQuotation = (enqId: string) => {
    const totalQuoteAmt = quoteItems.reduce((sum, item) => sum + item.cost, 0);
    const newQuote: Quotation = {
      id: `qte-${Date.now().toString().slice(-3)}`,
      enquiryId: enqId,
      amount: totalQuoteAmt,
      lineItems: quoteItems.map((qi, idx) => ({ id: `li-${idx}`, description: qi.desc, cost: qi.cost })),
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    const updatedEnquiries = state.enquiries.map(enq => 
      enq.id === enqId ? { ...enq, status: 'Quoted' as const } : enq
    );

    updateState({
      quotations: [newQuote, ...state.quotations],
      enquiries: updatedEnquiries,
      currentStep: 'QUOTE_GENERATED'
    });

    const targetE = state.enquiries.find(e => e.id === enqId);
    addAuditLog('Quotation Dispatched', `Administrator finalized pre-compliance quote of ZAR R${totalQuoteAmt} and dispatched to customer ${targetE?.customerName}.`);
    setSelectedEnqIdForQuote(null);
  };

  // Trigger: Assign Contractor to incoming emergency/assistance request
  const handleAssignContractorToJob = (jobId: string, contractorId: string) => {
    if (!contractorId) return;

    const updatedJobs = state.jobs.map(j => 
      j.id === jobId ? { 
        ...j, 
        assignedContractorId: contractorId, 
        status: 'Assigned' as const,
        trackerProgress: 30,
        assignedAt: new Date().toISOString() 
      } : j
    );

    updateState({
      jobs: updatedJobs,
      currentStep: 'CONTRACTOR_ASSIGNED'
    });

    const targetJob = state.jobs.find(j => j.id === jobId);
    const targetC = state.contractors.find(c => c.id === contractorId);
    addAuditLog('Contractor Assigned to Job', `Administrator dispatched ${targetC?.name} to emergency Job ${jobId} for customer ${targetJob?.customerName}.`);
  };

  // Trigger: Close completed job
  const handleCloseJob = (jobId: string) => {
    const updatedJobs = state.jobs.map(j => 
      j.id === jobId ? { ...j, status: 'Closed' as const, closedAt: new Date().toISOString() } : j
    );

    updateState({
      jobs: updatedJobs,
      currentStep: 'JOB_CLOSED'
    });

    addAuditLog('Job Closed', `Administrator officially audited and closed Job Card ${jobId}. Record moved to historic archive.`);
  };

  const handleAddQuoteItem = () => {
    if (newItemDesc && newItemCost > 0) {
      setQuoteItems([...quoteItems, { desc: newItemDesc, cost: newItemCost }]);
      setNewItemDesc('');
      setNewItemCost(0);
    }
  };

  const handleRemoveQuoteItem = (idx: number) => {
    setQuoteItems(quoteItems.filter((_, i) => i !== idx));
  };

  const broadcastRadioDispatch = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // clear previous speech queue
      const activeAlarm = activeJobs.find(j => j.status === 'Requested');
      let text = 'Attention all cruisers: Same Day Assist control rooms reports status normal. Standby for rapid response dispatches.';
      if (activeAlarm) {
        text = `Attention Sandton units, emergency dispatch triggered. Armed response officer requested for client ${activeAlarm.customerName} at ${activeAlarm.customerAddress}. Repeat, armed response requested immediately. Code 4.`;
      }
      const speech = new SpeechSynthesisUtterance(text);
      speech.rate = 1.05;
      speech.pitch = 0.95; // slightly deeper radio dispatcher tone
      window.speechSynthesis.speak(speech);
      addAuditLog('Radio Broadcast', `Dispatched audio alert: "${text.slice(0, 50)}..."`);
    } else {
      alert('Speech synthesis not supported in this browser environment.');
    }
  };

  return (
    <div className="w-full min-h-[600px] bg-slate-50 border border-slate-200 rounded-3xl shadow-lg flex flex-col overflow-hidden animate-fadeIn">
      
      {/* Widescreen Admin Header banner */}
      <div className="bg-navy text-white px-8 py-5 flex justify-between items-center border-b border-navy-light relative">
        <div className="flex items-center gap-3">
          <div className="bg-red p-2.5 rounded-xl text-white shadow-md">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-brand-header tracking-wide">SAME DAY ASSIST</h1>
            <p className="text-[10px] font-brand-sub text-red font-bold uppercase tracking-widest">Administrator Operations Command Center</p>
          </div>
        </div>
        
        {/* Statistics tray */}
        <div className="flex gap-6 text-right">
          <div>
            <span className="text-[9px] text-slate-400 uppercase font-mono block">System Ingress</span>
            <span className="text-xs font-bold text-green-400">● SECURE CLOUD RUN</span>
          </div>
          <div>
            <span className="text-[9px] text-slate-400 uppercase font-mono block">ZAR Total Billing</span>
            <span className="text-xs font-bold text-white">R{totalRevenue.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-[9px] text-slate-400 uppercase font-mono block">Active SLAs</span>
            <span className="text-xs font-bold text-red">99.4% ON-TIME</span>
          </div>
        </div>
      </div>

      {/* Primary Dashboard Navigation tabs */}
      <div className="bg-white border-b border-slate-200 px-8 flex justify-between items-center text-sm">
        <div className="flex gap-1">
          {[
            { id: 'overview', label: 'Command Overview', icon: Activity },
            { id: 'enquiries', label: 'Surveys & Quotes', icon: FileText, badge: pendingEnquiries },
            { id: 'jobs', label: 'Live Emergency Dispatch', icon: Shield, badge: criticalAlarms },
            { id: 'crm', label: 'Customer & Contractor CRM', icon: Users },
            { id: 'logs', label: 'Audit Security Trail', icon: Clipboard }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-4 flex items-center gap-2 border-b-2 font-medium transition-all ${
                activeTab === tab.id 
                  ? 'border-red text-red font-bold bg-slate-50/50' 
                  : 'border-transparent text-slate-600 hover:text-navy hover:border-slate-200'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge && tab.badge > 0 ? (
                <span className="bg-red text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full leading-none">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400 font-mono">ROLE: ROOT_SUPER_ADMIN</span>
      </div>

      {/* Main Panel Content */}
      <div className="flex-1 p-8 overflow-y-auto">

        {/* ----------------- TAB: OVERVIEW ----------------- */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-12 gap-6">
            
            {/* Metric 1: Active Members (Bento Card 1) */}
            <div className="col-span-12 md:col-span-3 bg-white rounded-2xl border border-slate-150 p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
              <span className="text-slate-400 font-bold italic uppercase text-[10px] tracking-widest block">Active Members</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-4xl font-black italic text-[#091C3E]">{activeMembers}</span>
                <span className="text-green-500 font-bold text-xs">↑ 14%</span>
              </div>
              <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden mt-3">
                <div className="h-full bg-[#CC322C] w-[85%]"></div>
              </div>
            </div>

            {/* Metric 2: Property Survey Backlog (Bento Card 2) */}
            <div className="col-span-12 md:col-span-3 bg-white rounded-2xl border border-slate-150 p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
              <span className="text-slate-400 font-bold italic uppercase text-[10px] tracking-widest block">Property Survey Backlog</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-4xl font-black italic text-[#091C3E]">{pendingEnquiries}</span>
                <span className="text-amber-500 font-bold text-xs">Needs Scheduling</span>
              </div>
              <div className="flex gap-1 mt-3">
                <div className="h-1 flex-1 bg-slate-200 rounded"></div>
                <div className={`h-1 flex-1 rounded ${pendingEnquiries > 0 ? 'bg-[#CC322C]' : 'bg-slate-200'}`}></div>
                <div className="h-1 flex-1 bg-[#091C3E] rounded"></div>
              </div>
            </div>

            {/* Map / Tracking (Large Bento Card 3) */}
            <div className="col-span-12 md:col-span-6 md:row-span-2 bg-[#091C3E] rounded-2xl p-1 relative overflow-hidden shadow-2xl min-h-[340px]">
              {/* HIGH FIDELITY SVG METROPOLITAN MAP CONTAINER */}
              <div className="relative w-full h-full min-h-[330px] bg-slate-950 rounded-2xl overflow-hidden">
                {/* Grid overlay */}
                <div className="absolute inset-0 bg-slate-900 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-40"></div>
                
                {/* Metro zones labels */}
                <span className="absolute top-8 left-16 text-[9px] text-slate-600 font-bold uppercase font-mono tracking-widest">RANDBURG ZONE</span>
                <span className="absolute top-12 right-24 text-[9px] text-slate-600 font-bold uppercase font-mono tracking-widest">MIDRAND SECURE HUB</span>
                <span className="absolute bottom-16 left-32 text-[9px] text-slate-600 font-bold uppercase font-mono tracking-widest">SOWETO WEST CORRIDOR</span>
                <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs text-slate-500 font-bold font-brand-header italic tracking-widest opacity-35">SANDTON HQ ZONE</span>

                {/* Customer house vectors */}
                {state.customers.map(cust => (
                  <div 
                    key={cust.id}
                    className="absolute flex flex-col items-center group cursor-pointer z-10"
                    style={{ 
                      top: cust.name === 'Thabo Mokoena' ? '45%' : '65%', 
                      left: cust.name === 'Thabo Mokoena' ? '55%' : '25%' 
                    }}
                  >
                    <MapPin className="w-5 h-5 text-[#CC322C] filter drop-shadow-[0_2px_4px_rgba(204,50,44,0.5)] animate-pulse" />
                    <span className="bg-slate-950/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow mt-1 whitespace-nowrap opacity-90 border border-slate-800">
                      {cust.name}
                    </span>
                  </div>
                ))}

                {/* Active Contractor vectors */}
                {state.contractors.map(c => (
                  <div 
                    key={c.id}
                    className="absolute flex flex-col items-center group cursor-pointer z-20"
                    style={{ top: `${c.location.lat}%`, left: `${c.location.lng}%` }}
                  >
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-ping absolute"></div>
                    <Shield className="w-5 h-5 text-green-400 relative filter drop-shadow-[0_2px_8px_rgba(34,197,94,0.6)]" />
                    <span className="bg-slate-950 text-green-400 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow mt-1 whitespace-nowrap opacity-95 border border-green-900">
                      Officer: {c.name.split(' ')[0]}
                    </span>
                  </div>
                ))}

                {/* Interactive Route lines */}
                {activeJobs.filter(j => j.status !== 'Closed' && j.status !== 'Rated').map(j => (
                  <svg key={j.id} className="absolute inset-0 w-full h-full pointer-events-none">
                    <path 
                      d="M 120 200 Q 200 150 280 250" 
                      stroke="#CC322C" 
                      strokeWidth="2.5" 
                      fill="none" 
                      strokeDasharray="6 4" 
                      className="animate-[dash_3s_linear_infinite]"
                    />
                  </svg>
                ))}

                {/* Map Floating HUD */}
                <div className="absolute top-6 left-6 z-30">
                  <div className="bg-white/90 backdrop-blur rounded-lg p-3.5 shadow-xl border border-white/20">
                    <p className="text-[10px] font-black italic text-[#091C3E] uppercase tracking-widest">Active Responders</p>
                    <p className="text-2xl font-black italic text-[#091C3E]">{state.contractors.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Job Queue / Dispatch Queue (Bento Card 4) */}
            <div className="col-span-12 md:col-span-6 bg-white rounded-2xl border border-slate-150 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black italic text-[#091C3E] uppercase text-sm tracking-tight font-brand-header">Dispatch Queue</h3>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">Incoming Alarms</span>
                </div>
                
                <div className="space-y-3 overflow-y-auto max-h-[300px] pr-1">
                  {activeJobs.filter(j => j.status === 'Requested').map(job => (
                    <div key={job.id} className="bg-[#CC322C]/5 p-3.5 rounded-xl border border-[#CC322C]/10 flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="bg-[#CC322C] text-white text-[8px] font-black italic uppercase px-1.5 py-0.5 rounded">CRITICAL EMERGENCY</span>
                          <h4 className="text-xs font-black italic text-[#091C3E] uppercase mt-1.5">{job.customerName}</h4>
                          <p className="text-[10px] text-slate-500">{job.customerAddress}</p>
                        </div>
                        <span className="text-[10px] font-mono text-[#CC322C] font-bold">R_DISPATCH</span>
                      </div>
                      <p className="text-[11px] text-slate-700 bg-white p-2.5 rounded-lg border border-slate-100">
                        "{job.description}"
                      </p>

                      <div className="flex flex-col gap-1.5 mt-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Dispatch Closest Security Officer</label>
                        <select 
                          onChange={(e) => handleAssignContractorToJob(job.id, e.target.value)}
                          className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-red"
                          defaultValue=""
                        >
                          <option value="" disabled>Select responder...</option>
                          {contractors.filter(c => c.isAvailable && c.specialty === job.serviceType).map(c => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.location.address})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}

                  {activeJobs.filter(j => j.status === 'Requested').length === 0 && (
                    <div className="text-center py-16 text-slate-400">
                      <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      <p className="text-xs font-black italic text-[#091C3E] uppercase">All Alarms Dispatched</p>
                      <p className="text-[10px] text-slate-400 mt-1 font-mono">Live monitoring response lines secured</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Alerts / Recent Activity (Bento Card 5) */}
            <div className="col-span-12 md:col-span-3 bg-[#CC322C] rounded-2xl p-6 shadow-xl flex flex-col justify-between min-h-[180px] text-white">
              <div className="flex items-center justify-between">
                <span className="text-white font-black italic uppercase text-[10px] tracking-widest">System Alerts</span>
                <div className="w-2.5 h-2.5 bg-white rounded-full animate-ping"></div>
              </div>
              <div className="my-3">
                <p className="text-white text-xl font-black italic leading-none uppercase mb-1">Panic Trigger</p>
                <p className="text-white/80 text-[10px] leading-snug">
                  {criticalAlarms > 0 
                    ? `Active threats logged: ${criticalAlarms}. Immediate patrol dispatch required!`
                    : "No active panic triggers detected. Station lines operational."
                  }
                </p>
              </div>
              <div className="flex flex-col gap-1.5 w-full">
                <button 
                  onClick={broadcastRadioDispatch}
                  className="w-full py-2 bg-[#091C3E] text-white hover:bg-[#091C3E]/85 text-[9px] font-black italic uppercase tracking-widest rounded shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer border border-[#091C3E]/20"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>🎙️ Radio Dispatch</span>
                </button>
                <button 
                  onClick={() => setActiveTab('enquiries')}
                  className="w-full py-2 bg-white text-[#CC322C] font-black italic uppercase text-[9px] tracking-widest rounded shadow-md hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Open Compliance Suite
                </button>
              </div>
            </div>

            {/* Assessment Stats / Capacity (Bento Card 6) */}
            <div className="col-span-12 md:col-span-3 bg-white rounded-2xl border border-slate-150 p-6 flex flex-col justify-between shadow-xs">
              <span className="text-slate-400 font-bold italic uppercase text-[10px] tracking-widest mb-2 block">Daily Capacity</span>
              <div className="flex items-center gap-4 flex-1">
                <div className="relative w-16 h-16 shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-100" />
                    <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray="176" strokeDashoffset={criticalAlarms > 0 ? "88" : "44"} className="text-[#091C3E]" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black italic">
                    {criticalAlarms > 0 ? "50%" : "75%"}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black italic text-[#091C3E] uppercase leading-none mb-1">Total ZAR Recs</p>
                  <p className="text-base font-black text-[#091C3E] leading-none mb-1">R{totalRevenue.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-tighter font-bold">Secure Collections</p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ----------------- TAB: ENQUIRIES & COMPLIANCE SURVEYS ----------------- */}
        {activeTab === 'enquiries' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
              <div>
                <h3 className="text-sm font-brand-header text-navy">ONBOARDING SURVEYS & MANAGE ENQUIRIES</h3>
                <p className="text-xs text-slate-400">Schedule compliance surveyor inspections and compile pre-compliance quotations</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              
              {/* Enquiry list table */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3">
                <h4 className="text-xs font-brand-header text-navy border-b border-slate-100 pb-2">PROSPECTIVE ENQUIRIES</h4>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {enquiries.map(enq => (
                    <div key={enq.id} className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col gap-2 text-xs">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{enq.customerName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">ID: {enq.id} • Created {new Date(enq.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          enq.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                          enq.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {enq.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="space-y-1 bg-white p-2.5 rounded-xl border border-slate-100 text-[11px] text-slate-600">
                        <p><strong>Phone:</strong> {enq.phone}</p>
                        <p><strong>Address:</strong> {enq.address}</p>
                        <p><strong>Notes:</strong> "{enq.notes}"</p>
                      </div>

                      {enq.status === 'Pending' && (
                        <div className="pt-1">
                          {selectedEnqIdForAssess === enq.id ? (
                            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                              <label className="text-[9px] font-bold text-slate-500 uppercase block">Assign Surveyor</label>
                              <select 
                                value={targetContractorId}
                                onChange={(e) => setTargetContractorId(e.target.value)}
                                className="w-full text-xs p-1.5 border border-slate-200 rounded-lg focus:outline-none"
                              >
                                <option value="">Select surveyor...</option>
                                {contractors.map(c => (
                                  <option key={c.id} value={c.id}>{c.name} ({c.specialty})</option>
                                ))}
                              </select>
                              <div className="flex gap-2 justify-end">
                                <button 
                                  onClick={() => setSelectedEnqIdForAssess(null)}
                                  className="px-2 py-1 text-[10px] text-slate-400 hover:bg-slate-50 rounded"
                                >
                                  Cancel
                                </button>
                                <button 
                                  onClick={() => handleScheduleAssessment(enq.id, targetContractorId)}
                                  className="bg-navy text-white px-3 py-1 rounded text-[10px] font-brand-header"
                                >
                                  Schedule
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setSelectedEnqIdForAssess(enq.id); setTargetContractorId(contractors[0]?.id || ''); }}
                              className="w-full bg-navy text-white font-brand-header text-[10px] py-1.5 rounded-xl hover:bg-navy-light shadow-2xs"
                            >
                              SCHEDULE PROPERTY COMPLIANCE ASSESSMENT
                            </button>
                          )}
                        </div>
                      )}

                      {enq.status === 'Assessed' && (
                        <button
                          onClick={() => { setSelectedEnqIdForQuote(enq.id); }}
                          className="w-full bg-red text-white font-brand-header text-[10px] py-1.5 rounded-xl hover:bg-red/90 shadow-2xs"
                        >
                          BUILD PRE-COMPLIANCE QUOTATION
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Quotation builder panel */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3">
                <h4 className="text-xs font-brand-header text-navy border-b border-slate-100 pb-2">PRE-COMPLIANCE QUOTE BUILDER</h4>
                
                {selectedEnqIdForQuote ? (
                  <div className="space-y-3 text-xs">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <p className="font-bold">Building Quote for Enquiry: {selectedEnqIdForQuote}</p>
                      <p className="text-[10px] text-slate-500">Provide subsidized repair line-items to establish full compliance.</p>
                    </div>

                    {/* Line Items Builder */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Quotation Items</label>
                      <div className="space-y-1.5">
                        {quoteItems.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-150">
                            <span className="font-mono text-[11px]">{idx + 1}. {item.desc}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-navy">R{item.cost}</span>
                              <button type="button" onClick={() => handleRemoveQuoteItem(idx)} className="text-red font-bold hover:underline">Remove</button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add new item */}
                      <div className="flex gap-1 pt-1">
                        <input 
                          type="text" 
                          placeholder="Description (e.g. alignment check...)" 
                          value={newItemDesc}
                          onChange={e => setNewItemDesc(e.target.value)}
                          className="flex-1 text-xs p-1.5 border border-slate-200 rounded-lg focus:outline-none"
                        />
                        <input 
                          type="number" 
                          placeholder="ZAR Cost" 
                          value={newItemCost || ''}
                          onChange={e => setNewItemCost(Number(e.target.value))}
                          className="w-20 text-xs p-1.5 border border-slate-200 rounded-lg focus:outline-none"
                        />
                        <button 
                          type="button" 
                          onClick={handleAddQuoteItem}
                          className="bg-navy text-white px-2.5 rounded-lg text-xs"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    <div className="bg-navy text-white p-3 rounded-xl flex justify-between items-center">
                      <span className="font-bold">Estimated Quote Total:</span>
                      <span className="text-base font-brand-header text-red">R{quoteItems.reduce((s,i)=>s+i.cost, 0)}</span>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleSendQuotation(selectedEnqIdForQuote)}
                        className="flex-1 bg-red text-white py-2 rounded-xl font-brand-header text-xs hover:bg-red/90"
                      >
                        SEND SUBSIDIZED QUOTE TO CUSTOMER
                      </button>
                      <button
                        onClick={() => setSelectedEnqIdForQuote(null)}
                        className="px-3 border border-slate-200 hover:bg-slate-50 text-slate-400 rounded-xl"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20 text-slate-400">
                    <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold uppercase">No Active Quote Build Session</p>
                    <p className="text-[10px] text-slate-400 mt-1">Select an assessed enquiry to build a customized pre-compliance repairs quota.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ----------------- TAB: LIVE DISPATCH CARDS ----------------- */}
        {activeTab === 'jobs' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex justify-between items-center">
              <div>
                <h3 className="text-sm font-brand-header text-navy">JOB DISPATCH CARD REGISTER</h3>
                <p className="text-xs text-slate-400">Review all active alarms, dispatched security cruisers, and sign resolution files</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400 uppercase font-bold font-mono">
                    <th className="p-4">Job ID</th>
                    <th className="p-4">Customer Details</th>
                    <th className="p-4">Assigned Officer</th>
                    <th className="p-4">Status & Tracker</th>
                    <th className="p-4">Created Time</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {activeJobs.map(job => {
                    const officer = state.contractors.find(c => c.id === job.assignedContractorId);
                    return (
                      <tr key={job.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-mono font-bold text-slate-500">{job.id}</td>
                        <td className="p-4">
                          <p className="font-bold text-slate-800">{job.customerName}</p>
                          <p className="text-[10px] text-slate-400">{job.customerAddress}</p>
                          <span className="inline-block mt-1 text-[9px] font-bold bg-slate-100 px-1.5 py-0.2 rounded">
                            {job.serviceType} Assist
                          </span>
                        </td>
                        <td className="p-4">
                          {officer ? (
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                              <div>
                                <p className="font-bold text-slate-700">{officer.name}</p>
                                <p className="text-[9px] text-slate-400">{officer.phone}</p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-red font-bold uppercase text-[9px]">⚠️ NO RESPONDER</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              job.status === 'Requested' ? 'bg-red text-white animate-pulse' :
                              job.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {job.status.toUpperCase()}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold">({job.trackerProgress}%)</span>
                          </div>
                          
                          {/* Progress micro bar */}
                          <div className="w-24 bg-slate-100 h-1 rounded-full mt-1.5 overflow-hidden">
                            <div className="bg-navy h-full" style={{ width: `${job.trackerProgress}%` }}></div>
                          </div>
                        </td>
                        <td className="p-4 text-[11px] text-slate-400 font-mono">
                          {new Date(job.createdAt).toLocaleTimeString()}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex gap-1.5 justify-end">
                            {job.status === 'Requested' && (
                              <div className="flex gap-1">
                                <select 
                                  onChange={(e) => handleAssignContractorToJob(job.id, e.target.value)}
                                  className="text-[10px] p-1 border border-slate-200 rounded"
                                  defaultValue=""
                                >
                                  <option value="" disabled>Dispatch responder...</option>
                                  {contractors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                              </div>
                            )}

                            {job.status === 'Completed' && (
                              <span className="text-amber-500 text-[9px] font-bold block uppercase py-1">
                                Client Rating Pending
                              </span>
                            )}

                            {job.status === 'Rated' && (
                              <button
                                onClick={() => handleCloseJob(job.id)}
                                className="bg-navy text-white text-[10px] font-brand-header px-2.5 py-1 rounded hover:bg-navy-light"
                              >
                                CLOSE JOB
                              </button>
                            )}

                            {job.status === 'Closed' && (
                              <span className="text-green-600 font-bold text-[10px] flex items-center gap-0.5">
                                <CheckCircle className="w-3.5 h-3.5" /> CLOSED
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {activeJobs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-slate-400">
                        No active job card dispatch files recorded in database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ----------------- TAB: CRM (CUSTOMERS & CONTRACTORS) ----------------- */}
        {activeTab === 'crm' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              
              {/* Customer CRM panel */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-brand-header text-navy">REGISTERED CLIENT CRM</h4>
                  <span className="text-[10px] bg-navy text-white px-2 py-0.5 rounded font-bold font-mono">
                    {customers.length} RECORDS
                  </span>
                </div>

                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {customers.map(c => (
                    <div key={c.id} className="p-3 rounded-2xl border border-slate-100 bg-slate-50/50 text-xs flex justify-between items-start">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{c.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">UUID: {c.id}</p>
                        <p className="text-[11px] text-slate-500 mt-1"><strong>Phone:</strong> {c.phone}</p>
                        <p className="text-[11px] text-slate-500"><strong>Cover:</strong> {c.package} Assist • Paid R{c.totalPaid}</p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1.5">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          c.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {c.status.toUpperCase()}
                        </span>
                        {c.memberSince && <span className="text-[9px] font-mono text-slate-400">Member: {c.memberSince}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contractor CRM panel */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-brand-header text-navy">RESPONSE CRU CONTRACTORS CRM</h4>
                  <span className="text-[10px] bg-red text-white px-2 py-0.5 rounded font-bold font-mono">
                    {contractors.length} ACTIVE
                  </span>
                </div>

                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {contractors.map(c => (
                    <div key={c.id} className="p-3 rounded-2xl border border-slate-100 bg-slate-50/50 text-xs flex justify-between items-start">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{c.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">UUID: {c.id} • Rated {c.rating} ★</p>
                        <p className="text-[11px] text-slate-500 mt-1"><strong>Specialty:</strong> {c.specialty} Emergencies</p>
                        <p className="text-[11px] text-slate-500"><strong>GPS Zone:</strong> {c.location.address}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          c.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {c.isAvailable ? 'AVAILABLE' : 'DISPATCHED'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ----------------- TAB: AUDIT Trail ----------------- */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
              <h3 className="text-sm font-brand-header text-navy">SECURITY AUDIT LEDGER</h3>
              <p className="text-xs text-slate-400">Normalized audit log detailing state mutations, client action hashes, and compliance checks</p>
            </div>

            <div className="bg-slate-900 text-slate-100 rounded-3xl overflow-hidden border border-slate-800 shadow-md">
              <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center text-xs font-mono">
                <span className="text-red font-bold">SEC_AUDIT_LOG_STREAM</span>
                <span className="text-slate-500">SHA256 SECURED LEDGER</span>
              </div>
              <div className="p-4 font-mono text-[10.5px] space-y-2.5 max-h-96 overflow-y-auto">
                {state.auditLogs.map((log, idx) => (
                  <div key={log.id || idx} className="border-b border-slate-800 pb-2.5 flex items-start gap-4">
                    <span className="text-slate-500 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <span className={`px-1.5 py-0.2 rounded font-bold shrink-0 text-[9px] ${
                      log.userType === 'Customer' ? 'bg-blue-950 text-blue-400' :
                      log.userType === 'Contractor' ? 'bg-amber-950 text-amber-400' : 'bg-red-950 text-red-400'
                    }`}>
                      {log.userType.toUpperCase()}
                    </span>
                    <div className="flex-1">
                      <p className="font-bold text-slate-200">{log.action}</p>
                      <p className="text-slate-400 text-[10px] mt-0.5 leading-relaxed">{log.details}</p>
                    </div>
                  </div>
                ))}
                {state.auditLogs.length === 0 && (
                  <p className="text-slate-500 text-center py-6">No audit records stream generated yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
