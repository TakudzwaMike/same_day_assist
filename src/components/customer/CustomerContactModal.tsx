import React, { useState } from 'react';
import { 
  X, PhoneCall, Lightbulb, ShieldAlert, Phone, Clock, 
  Send, CheckCircle2, AlertCircle, Headphones, Building2, 
  MessageSquare, ChevronRight, User, Mail
} from 'lucide-react';
import { useAppState } from '../../contexts/AppStateContext';
import { useAuth } from '../../contexts/AuthContext';

interface CustomerContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'callback' | 'suggestions' | 'complaints' | 'directory';
}

export function CustomerContactModal({ isOpen, onClose, defaultTab = 'directory' }: CustomerContactModalProps) {
  const { addAuditLogLocal } = useAppState();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'callback' | 'suggestions' | 'complaints' | 'directory'>(defaultTab);

  // Callback form
  const [cbName, setCbName] = useState(user?.name || '');
  const [cbPhone, setCbPhone] = useState(user?.phone || '');
  const [cbTime, setCbTime] = useState('Immediate (Next 15 Mins)');
  const [cbTopic, setCbTopic] = useState('Technical Support / Fault');
  const [cbSuccess, setCbSuccess] = useState<string | null>(null);

  // Suggestions form
  const [suggCategory, setSuggCategory] = useState('Mobile App & Features');
  const [suggText, setSuggText] = useState('');
  const [suggSuccess, setSuggSuccess] = useState(false);

  // Complaints form
  const [compIncidentDate, setCompIncidentDate] = useState(new Date().toISOString().split('T')[0]);
  const [compJobId, setCompJobId] = useState('');
  const [compCategory, setCompCategory] = useState('Technician Work Quality & Conduct');
  const [compStatement, setCompStatement] = useState('');
  const [compSuccessId, setCompSuccessId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCallbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cbPhone) {
      alert('Please provide a telephone number so our team can call you.');
      return;
    }
    const ref = `CB-${Math.floor(100000 + Math.random() * 900000)}`;
    addAuditLogLocal('Callback Requested', `Client ${cbName} (${cbPhone}) requested callback for [${cbTopic}] at ${cbTime}. Ref: ${ref}`);
    setCbSuccess(ref);
  };

  const handleSuggestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggText.trim()) return;
    addAuditLogLocal('Suggestion Submitted', `Client suggestion under [${suggCategory}]: "${suggText.slice(0, 80)}..."`);
    setSuggSuccess(true);
  };

  const handleComplaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!compStatement.trim()) {
      alert('Please describe the complaint details for our investigation team.');
      return;
    }
    const caseId = `CMP-${Math.floor(10000 + Math.random() * 90000)}`;
    addAuditLogLocal('Complaint Lodged', `Formal complaint ${caseId} lodged by ${user?.name || 'Customer'}. Category: ${compCategory}. Incident date: ${compIncidentDate}. Ref Job: ${compJobId || 'N/A'}`);
    setCompSuccessId(caseId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#050E20] border-2 border-[#142D59] w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* HEADER */}
        <div className="bg-[#091C3E] px-6 py-4 border-b border-[#142D59] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red/10 border border-red/30 text-red flex items-center justify-center">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white uppercase font-brand-header tracking-wide">
                Customer Communication Center
              </h2>
              <p className="text-[10px] font-mono text-slate-400">
                Same Day Assist • Assistance, Feedback & Inquiries
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4 NAVIGATION TABS (Item 05) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 bg-[#050E20] border-b border-[#142D59] p-2 gap-1.5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('callback')}
            className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'callback'
                ? 'bg-red text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-[#091C3E]'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Callback</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('suggestions')}
            className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'suggestions'
                ? 'bg-red text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-[#091C3E]'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Suggestions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('complaints')}
            className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'complaints'
                ? 'bg-red text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-[#091C3E]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Complaints</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('directory')}
            className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'directory'
                ? 'bg-red text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-[#091C3E]'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Contact Us</span>
          </button>
        </div>

        {/* TAB CONTENTS */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* 1. REQUEST A CALLBACK */}
          {activeTab === 'callback' && (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Request a Callback</h3>
                <p className="text-xs text-slate-400">
                  Submit a request and our dispatch coordinator will call you back on your preferred channel.
                </p>
              </div>

              {cbSuccess ? (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-white">Callback Request Confirmed</h4>
                  <p className="text-xs text-slate-300 max-w-md mx-auto">
                    We have received your callback request. A Same Day Assist coordinator will contact you at{' '}
                    <strong className="text-white font-mono">{cbPhone}</strong> ({cbTime}).
                  </p>
                  <div className="inline-block bg-[#091C3E] border border-[#142D59] px-3 py-1.5 rounded-lg text-xs font-mono text-cyan-300">
                    Reference ID: {cbSuccess}
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setCbSuccess(null)}
                      className="text-xs text-red hover:underline font-bold cursor-pointer"
                    >
                      Submit Another Callback Request
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCallbackSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px] tracking-wider">Your Name</label>
                    <input
                      type="text"
                      value={cbName}
                      onChange={e => setCbName(e.target.value)}
                      required
                      placeholder="e.g. Sipho Sithole"
                      className="w-full bg-[#091C3E] border border-[#142D59] rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px] tracking-wider">Contact Telephone Number *</label>
                    <input
                      type="tel"
                      value={cbPhone}
                      onChange={e => setCbPhone(e.target.value)}
                      required
                      placeholder="+27 82 000 0000"
                      className="w-full bg-[#091C3E] border border-[#142D59] rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-red font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px] tracking-wider">Preferred Call Window</label>
                      <select
                        value={cbTime}
                        onChange={e => setCbTime(e.target.value)}
                        className="w-full bg-[#091C3E] border border-[#142D59] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red"
                      >
                        <option>Immediate (Next 15 Mins)</option>
                        <option>Today Morning (08:00 - 12:00)</option>
                        <option>Today Afternoon (12:00 - 17:00)</option>
                        <option>Tomorrow Morning (08:00 - 12:00)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px] tracking-wider">Subject / Reason</label>
                      <select
                        value={cbTopic}
                        onChange={e => setCbTopic(e.target.value)}
                        className="w-full bg-[#091C3E] border border-[#142D59] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red"
                      >
                        <option>Technical Support / Fault</option>
                        <option>Property Assessment Follow-up</option>
                        <option>Plan Upgrade or Pricing Query</option>
                        <option>Billing & Payment Question</option>
                        <option>Other Operational Assistance</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-red hover:bg-red/90 text-white font-bold rounded-xl shadow-md transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Submit Request for Callback</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* 2. SUGGESTIONS */}
          {activeTab === 'suggestions' && (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Submit Ideas & Feedback</h3>
                <p className="text-xs text-slate-400">
                  We appreciate your feedback and ideas to improve Same Day Assist services and systems.
                </p>
              </div>

              {suggSuccess ? (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-white">Suggestion Recorded</h4>
                  <p className="text-xs text-slate-300 max-w-md mx-auto">
                    Thank you for helping us make Same Day Assist better. Your idea has been transmitted to our Product & Engineering management.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setSuggSuccess(false); setSuggText(''); }}
                    className="text-xs text-red hover:underline font-bold cursor-pointer pt-2"
                  >
                    Submit Another Suggestion
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSuggestionSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px] tracking-wider">Area of Suggestion</label>
                    <select
                      value={suggCategory}
                      onChange={e => setSuggCategory(e.target.value)}
                      className="w-full bg-[#091C3E] border border-[#142D59] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-red"
                    >
                      <option>Mobile App & Navigation</option>
                      <option>Contractor & Inspector Service Quality</option>
                      <option>Response Speed & Dispatch SLA</option>
                      <option>Membership Plans & Parts Benefits</option>
                      <option>Billing & Payment Features</option>
                      <option>New Security Hardware Support</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px] tracking-wider">Your Idea / Feedback *</label>
                    <textarea
                      rows={4}
                      value={suggText}
                      onChange={e => setSuggText(e.target.value)}
                      required
                      placeholder="Please share what you liked or how we can improve your Same Day Assist experience..."
                      className="w-full bg-[#091C3E] border border-[#142D59] rounded-xl p-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-red leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-red hover:bg-red/90 text-white font-bold rounded-xl shadow-md transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send Suggestion to Management</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* 3. COMPLAINTS (INVESTIGATION WORKFLOW) */}
          {activeTab === 'complaints' && (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Lodge a Formal Complaint</h3>
                  <span className="text-[10px] font-mono bg-red/10 text-red border border-red/20 px-2 py-0.5 rounded-full font-bold">
                    Independent Investigation
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Complaints undergo formal verification by our Complaints Department before findings or corrective actions are recorded.
                </p>
              </div>

              {compSuccessId ? (
                <div className="bg-red/10 border border-red/30 rounded-2xl p-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-red/20 text-red flex items-center justify-center mx-auto">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-white">Complaint Case Registered</h4>
                  <p className="text-xs text-slate-300 max-w-md mx-auto">
                    Your complaint has been logged and assigned to the independent Complaints Department for formal review. You can track this case with your reference number.
                  </p>
                  <div className="inline-block bg-[#091C3E] border border-red/40 px-4 py-2 rounded-xl text-sm font-mono font-bold text-red">
                    Case Number: {compSuccessId}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Our compliance officer will reach out within 24 business hours.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setCompSuccessId(null); setCompStatement(''); }}
                    className="text-xs text-slate-300 hover:text-white font-bold cursor-pointer pt-2 block mx-auto underline"
                  >
                    Lodge Another Inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleComplaintSubmit} className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px] tracking-wider">Date of Incident</label>
                      <input
                        type="date"
                        value={compIncidentDate}
                        onChange={e => setCompIncidentDate(e.target.value)}
                        className="w-full bg-[#091C3E] border border-[#142D59] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-red font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px] tracking-wider">Job / Assessment ID (Optional)</label>
                      <input
                        type="text"
                        value={compJobId}
                        onChange={e => setCompJobId(e.target.value)}
                        placeholder="e.g. JOB-8910 or leave blank"
                        className="w-full bg-[#091C3E] border border-[#142D59] rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-red font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px] tracking-wider">Nature of Complaint</label>
                    <select
                      value={compCategory}
                      onChange={e => setCompCategory(e.target.value)}
                      className="w-full bg-[#091C3E] border border-[#142D59] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-red"
                    >
                      <option>Technician Work Quality & Conduct</option>
                      <option>Response Time Delay / SLA Breach</option>
                      <option>Billing, Invoicing, or Co-Pay Dispute</option>
                      <option>Incomplete Safety Assessment</option>
                      <option>Property or Gate Automation Concern</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px] tracking-wider">Detailed Statement *</label>
                    <textarea
                      rows={4}
                      value={compStatement}
                      onChange={e => setCompStatement(e.target.value)}
                      required
                      placeholder="Please provide full details of what occurred, names of any personnel involved, and any supporting facts..."
                      className="w-full bg-[#091C3E] border border-[#142D59] rounded-xl p-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-red leading-relaxed"
                    />
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-[11px] text-amber-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                    <span>
                      Formal adjustments or penalties are only enforced after complete investigation and opportunity for technician appeal in compliance with relevant policies.
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-red hover:bg-red/90 text-white font-bold rounded-xl shadow-md transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>Lodge Formal Complaint for Investigation</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* 4. CONTACT US (DIRECT DEPARTMENT TELEPHONE DIRECTORY) */}
          {activeTab === 'directory' && (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Departmental Telephone Directory</h3>
                <p className="text-xs text-slate-400">
                  Prefer to call immediately? Reach our specialist teams directly during operating hours:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* TECHNICAL SUPPORT */}
                <a
                  href="tel:+27115559111"
                  className="bg-[#091C3E] hover:bg-[#0d2754] border border-[#142D59] hover:border-red rounded-2xl p-4 transition-all block cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono uppercase font-bold text-red">24/7 Assistance</span>
                    <span className="text-xs text-slate-400 group-hover:text-white">Call Now →</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">Technical Support</h4>
                  <p className="text-[11px] text-slate-300 mt-0.5 font-mono text-cyan-300 font-bold">
                    +27 11 555 9111
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                    Fault diagnostics, alarm offline issues & technical troubleshooting.
                  </p>
                </a>

                {/* SALES & MEMBERSHIP */}
                <a
                  href="tel:+27115559112"
                  className="bg-[#091C3E] hover:bg-[#0d2754] border border-[#142D59] hover:border-red rounded-2xl p-4 transition-all block cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Mon - Fri 08:00 - 17:00</span>
                    <span className="text-xs text-slate-400 group-hover:text-white">Call Now →</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">Sales & Upgrades</h4>
                  <p className="text-[11px] text-slate-300 mt-0.5 font-mono text-cyan-300 font-bold">
                    +27 11 555 9112
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                    New subscriptions, plan changes & custom business coverage.
                  </p>
                </a>

                {/* APP & MEMBER SUPPORT */}
                <a
                  href="tel:+27115559113"
                  className="bg-[#091C3E] hover:bg-[#0d2754] border border-[#142D59] hover:border-red rounded-2xl p-4 transition-all block cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono uppercase font-bold text-slate-400">Daily 07:00 - 19:00</span>
                    <span className="text-xs text-slate-400 group-hover:text-white">Call Now →</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">App & Member Support</h4>
                  <p className="text-[11px] text-slate-300 mt-0.5 font-mono text-cyan-300 font-bold">
                    +27 11 555 9113
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                    Account management, password resets & digital wallet inquiries.
                  </p>
                </a>

                {/* EMERGENCY DISPATCH */}
                <a
                  href="tel:0861000911"
                  className="bg-red/10 hover:bg-red/20 border border-red/40 rounded-2xl p-4 transition-all block cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono uppercase font-bold text-red">Priority Control Room</span>
                    <span className="text-xs text-red font-bold group-hover:text-white">Emergency Call →</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">Emergency Dispatch</h4>
                  <p className="text-[11px] text-red-200 mt-0.5 font-mono font-bold">
                    0861 000 911 / +27 11 555 0911
                  </p>
                  <p className="text-[10px] text-slate-300 mt-1 leading-snug">
                    Immediate armed patrol cruiser dispatch & active security breaches.
                  </p>
                </a>
              </div>

              {/* Direct email & address footer */}
              <div className="bg-[#091C3E]/60 border border-[#142D59] rounded-2xl p-3.5 text-xs text-slate-400 flex flex-col sm:flex-row justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>support@samedayassist.co.za</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span>Sandton Control Center, Johannesburg</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
