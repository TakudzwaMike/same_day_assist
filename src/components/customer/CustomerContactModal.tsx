import React, { useState, useEffect } from 'react';
import { 
  X, PhoneCall, Lightbulb, ShieldAlert, Phone, Clock, 
  Send, CheckCircle2, AlertCircle, Headphones, Building2, 
  MessageSquare, ChevronRight, User, Mail, MapPin, ExternalLink,
  MessageCircle, Loader2
} from 'lucide-react';
import { useAppState } from '../../contexts/AppStateContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface CustomerContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'callback' | 'suggestions' | 'complaints' | 'directory';
}

export function CustomerContactModal({ isOpen, onClose, defaultTab = 'directory' }: CustomerContactModalProps) {
  const { createEnquiry, addAuditLogLocal } = useAppState();
  const { user } = useAuth();
  const { isDark } = useTheme();

  const [activeTab, setActiveTab] = useState<'callback' | 'suggestions' | 'complaints' | 'directory'>(defaultTab);

  // Synchronize active tab whenever defaultTab or modal open state changes
  useEffect(() => {
    if (isOpen && defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab, isOpen]);

  // Callback form state
  const [cbName, setCbName] = useState(user?.name || '');
  const [cbPhone, setCbPhone] = useState(user?.phone || '');
  const [cbTime, setCbTime] = useState('Immediate (Next 15 Mins)');
  const [cbTopic, setCbTopic] = useState('Technical Support / Fault');
  const [cbReason, setCbReason] = useState('');
  const [cbLoading, setCbLoading] = useState(false);
  const [cbSuccess, setCbSuccess] = useState<string | null>(null);

  // Suggestions form state
  const [suggName, setSuggName] = useState(user?.name || '');
  const [suggEmail, setSuggEmail] = useState(user?.email || '');
  const [suggCategory, setSuggCategory] = useState('Mobile App & Navigation');
  const [suggTitle, setSuggTitle] = useState('');
  const [suggText, setSuggText] = useState('');
  const [suggLoading, setSuggLoading] = useState(false);
  const [suggSuccess, setSuggSuccess] = useState<string | null>(null);

  // Complaints form state
  const [compName, setCompName] = useState(user?.name || '');
  const [compPhone, setCompPhone] = useState(user?.phone || '');
  const [compIncidentDate, setCompIncidentDate] = useState(new Date().toISOString().split('T')[0]);
  const [compJobId, setCompJobId] = useState('');
  const [compCategory, setCompCategory] = useState('Technician Work Quality & Conduct');
  const [compStatement, setCompStatement] = useState('');
  const [compLoading, setCompLoading] = useState(false);
  const [compSuccessId, setCompSuccessId] = useState<string | null>(null);

  // Reset forms when opened with fresh user profile
  useEffect(() => {
    if (user) {
      if (!cbName) setCbName(user.name || '');
      if (!cbPhone) setCbPhone(user.phone || '');
      if (!suggName) setSuggName(user.name || '');
      if (!suggEmail) setSuggEmail(user.email || '');
      if (!compName) setCompName(user.name || '');
      if (!compPhone) setCompPhone(user.phone || '');
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleCallbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cbPhone.trim()) {
      alert('Please provide a contact phone number so our team can reach you.');
      return;
    }
    if (!cbReason.trim()) {
      alert('Please explain why you are requesting a callback so our team can prepare.');
      return;
    }

    setCbLoading(true);
    const ref = `CB-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      const notes = [
        `[CALLBACK REQUEST - Ref #${ref}]`,
        `Reason / Explanation: ${cbReason.trim()}`,
        `Topic: ${cbTopic}`,
        `Preferred Call Window: ${cbTime}`,
        `Client Contact: ${cbName} (${cbPhone})`,
      ].join('\n');

      await createEnquiry({
        name: cbName || user?.name || 'Customer',
        email: user?.email || 'customer@samedayassist.co.za',
        phone: cbPhone,
        address: user?.address || 'Member Communications Hub',
        serviceCategory: 'Callback Request',
        notes: notes,
      });

      addAuditLogLocal(
        'Callback Requested',
        `Client ${cbName} (${cbPhone}) requested callback for [${cbTopic}]. Reason: "${cbReason.slice(0, 80)}". Ref: ${ref}`
      );

      setCbSuccess(ref);
    } catch (err: any) {
      alert(err.message || 'Failed to submit callback request. Please try again.');
    } finally {
      setCbLoading(false);
    }
  };

  const handleSuggestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggText.trim()) {
      alert('Please enter your suggestion or feedback.');
      return;
    }

    setSuggLoading(true);
    const ref = `SUG-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      const notes = [
        `[CUSTOMER SUGGESTION - Ref #${ref}]`,
        `Category: ${suggCategory}`,
        suggTitle ? `Summary: ${suggTitle.trim()}` : null,
        `Details: ${suggText.trim()}`,
        `Submitted by: ${suggName || user?.name || 'Client'} (${suggEmail || user?.email || 'N/A'})`,
      ].filter(Boolean).join('\n');

      await createEnquiry({
        name: suggName || user?.name || 'Customer',
        email: suggEmail || user?.email || 'feedback@samedayassist.co.za',
        phone: user?.phone || 'N/A',
        address: user?.address || 'Member Communications Hub',
        serviceCategory: 'Customer Suggestion',
        notes: notes,
      });

      addAuditLogLocal(
        'Suggestion Submitted',
        `Client suggestion under [${suggCategory}]: "${suggText.slice(0, 80)}..." Ref: ${ref}`
      );

      setSuggSuccess(ref);
    } catch (err: any) {
      alert(err.message || 'Failed to submit suggestion. Please try again.');
    } finally {
      setSuggLoading(false);
    }
  };

  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compStatement.trim()) {
      alert('Please describe the complaint details for our investigation team.');
      return;
    }

    setCompLoading(true);
    const caseId = `CMP-${Math.floor(10000 + Math.random() * 90000)}`;

    try {
      const notes = [
        `[FORMAL COMPLAINT - Case #${caseId}]`,
        `Nature of Complaint: ${compCategory}`,
        `Date of Incident: ${compIncidentDate}`,
        compJobId ? `Job / Assessment Ref: ${compJobId.trim()}` : 'Job Ref: None Provided',
        `Complainant: ${compName || user?.name || 'Customer'} (${compPhone || user?.phone || 'N/A'})`,
        `Detailed Statement:\n${compStatement.trim()}`,
      ].join('\n');

      await createEnquiry({
        name: compName || user?.name || 'Customer',
        email: user?.email || 'complaints@samedayassist.co.za',
        phone: compPhone || user?.phone || 'N/A',
        address: user?.address || 'Member Communications Hub',
        serviceCategory: 'Formal Complaint',
        notes: notes,
      });

      addAuditLogLocal(
        'Complaint Lodged',
        `Formal complaint ${caseId} lodged by ${compName || user?.name || 'Customer'}. Category: ${compCategory}. Incident date: ${compIncidentDate}. Ref Job: ${compJobId || 'N/A'}`
      );

      setCompSuccessId(caseId);
    } catch (err: any) {
      alert(err.message || 'Failed to lodge complaint. Please try again.');
    } finally {
      setCompLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className={`w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-colors ${
        isDark ? 'bg-[#050E20] border-2 border-[#142D59]' : 'bg-white border border-slate-200'
      }`}>
        {/* MODAL HEADER */}
        <div className={`px-5 py-4 border-b flex items-center justify-between transition-colors ${
          isDark ? 'bg-[#091C3E] border-[#142D59]' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red/10 border border-red/30 text-red flex items-center justify-center shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-sm sm:text-base font-black uppercase font-brand-header tracking-wide ${
                isDark ? 'text-white' : 'text-[#091C3E]'
              }`}>
                Customer Communication Center
              </h2>
              <p className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Same Day Assist • Assistance, Feedback & Inquiries
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
              isDark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-200/70 text-slate-600 hover:text-slate-900'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4 NAVIGATION TABS */}
        <div className={`grid grid-cols-2 sm:grid-cols-4 border-b p-2 gap-1.5 text-xs font-bold transition-colors ${
          isDark ? 'bg-[#050E20] border-[#142D59]' : 'bg-slate-100/70 border-slate-200'
        }`}>
          <button
            type="button"
            onClick={() => setActiveTab('callback')}
            className={`py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'callback'
                ? 'bg-red text-white shadow-md'
                : isDark
                  ? 'text-slate-300 hover:text-white hover:bg-[#091C3E]'
                  : 'text-slate-700 hover:text-navy hover:bg-white shadow-2xs'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Callback</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('suggestions')}
            className={`py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'suggestions'
                ? 'bg-red text-white shadow-md'
                : isDark
                  ? 'text-slate-300 hover:text-white hover:bg-[#091C3E]'
                  : 'text-slate-700 hover:text-navy hover:bg-white shadow-2xs'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Suggestions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('complaints')}
            className={`py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'complaints'
                ? 'bg-red text-white shadow-md'
                : isDark
                  ? 'text-slate-300 hover:text-white hover:bg-[#091C3E]'
                  : 'text-slate-700 hover:text-navy hover:bg-white shadow-2xs'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Complaints</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('directory')}
            className={`py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'directory'
                ? 'bg-red text-white shadow-md'
                : isDark
                  ? 'text-slate-300 hover:text-white hover:bg-[#091C3E]'
                  : 'text-slate-700 hover:text-navy hover:bg-white shadow-2xs'
            }`}
          >
            <Phone className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Contact Us</span>
          </button>
        </div>

        {/* TAB CONTENTS */}
        <div className={`p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 ${isDark ? 'bg-[#050E20]' : 'bg-white'}`}>
          
          {/* ========================================================================= */}
          {/* 1. REQUEST A CALLBACK */}
          {/* ========================================================================= */}
          {activeTab === 'callback' && (
            <div className="space-y-4 animate-fadeIn">
              <div className={`border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-[#091C3E]'}`}>
                  Request a Call Back from Admin
                </h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Tell us why you are requesting a call back so our administration and dispatch team can review your file before calling you.
                </p>
              </div>

              {cbSuccess ? (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-3 animate-fadeIn">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#091C3E]'}`}>
                    Callback Request Dispatched to Admin
                  </h4>
                  <p className={`text-xs max-w-md mx-auto ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Your callback request has been logged in the admin command system. An administrator or dispatcher will phone you at{' '}
                    <strong className={`font-mono ${isDark ? 'text-white' : 'text-[#091C3E]'}`}>{cbPhone}</strong> during your requested window ({cbTime}).
                  </p>
                  <div className={`inline-block px-3 py-1.5 rounded-lg text-xs font-mono font-bold ${
                    isDark ? 'bg-[#091C3E] border border-[#142D59] text-cyan-300' : 'bg-slate-100 border border-slate-200 text-[#091C3E]'
                  }`}>
                    Reference Number: {cbSuccess}
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => { setCbSuccess(null); setCbReason(''); }}
                      className="text-xs text-red hover:underline font-bold cursor-pointer"
                    >
                      Submit Another Callback Request
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCallbackSubmit} className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={`block font-bold mb-1 uppercase text-[10px] tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        value={cbName}
                        onChange={e => setCbName(e.target.value)}
                        required
                        placeholder="e.g. Sipho Sithole"
                        className={`w-full rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-red transition-colors ${
                          isDark ? 'bg-[#091C3E] border border-[#142D59] text-white placeholder-slate-500' : 'bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block font-bold mb-1 uppercase text-[10px] tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        Contact Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={cbPhone}
                        onChange={e => setCbPhone(e.target.value)}
                        required
                        placeholder="+27 82 000 0000"
                        className={`w-full rounded-xl px-3.5 py-2.5 font-mono focus:outline-none focus:border-red transition-colors ${
                          isDark ? 'bg-[#091C3E] border border-[#142D59] text-white placeholder-slate-500' : 'bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={`block font-bold mb-1 uppercase text-[10px] tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        Subject / Topic Area
                      </label>
                      <select
                        value={cbTopic}
                        onChange={e => setCbTopic(e.target.value)}
                        className={`w-full rounded-xl px-3 py-2.5 focus:outline-none focus:border-red transition-colors ${
                          isDark ? 'bg-[#091C3E] border border-[#142D59] text-white' : 'bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white'
                        }`}
                      >
                        <option>Technical Support / Fault</option>
                        <option>Property Assessment Follow-up</option>
                        <option>Plan Upgrade or Pricing Query</option>
                        <option>Billing & Payment Question</option>
                        <option>Emergency Service Query</option>
                        <option>Other Operational Assistance</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block font-bold mb-1 uppercase text-[10px] tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        Preferred Call Window
                      </label>
                      <select
                        value={cbTime}
                        onChange={e => setCbTime(e.target.value)}
                        className={`w-full rounded-xl px-3 py-2.5 focus:outline-none focus:border-red transition-colors ${
                          isDark ? 'bg-[#091C3E] border border-[#142D59] text-white' : 'bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white'
                        }`}
                      >
                        <option>Immediate (Next 15 Mins)</option>
                        <option>Today Morning (08:00 - 12:00)</option>
                        <option>Today Afternoon (12:00 - 17:00)</option>
                        <option>Tomorrow Morning (08:00 - 12:00)</option>
                      </select>
                    </div>
                  </div>

                  {/* MANDATORY REASON FIELD */}
                  <div>
                    <label className={`block font-bold mb-1 uppercase text-[10px] tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Why are you requesting a callback? * (Mandatory)
                    </label>
                    <textarea
                      rows={3}
                      value={cbReason}
                      onChange={e => setCbReason(e.target.value)}
                      required
                      placeholder="Please explain in detail why you need a call back so admin/dispatch can review your situation before calling..."
                      className={`w-full rounded-xl p-3 focus:outline-none focus:border-red leading-relaxed transition-colors ${
                        isDark ? 'bg-[#091C3E] border border-[#142D59] text-white placeholder-slate-500' : 'bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white'
                      }`}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={cbLoading}
                    className="w-full py-3 bg-red hover:bg-red/90 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    {cbLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting to Admin...</span>
                      </>
                    ) : (
                      <>
                        <PhoneCall className="w-4 h-4" />
                        <span>Submit Request for Callback</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. SUGGESTIONS */}
          {/* ========================================================================= */}
          {activeTab === 'suggestions' && (
            <div className="space-y-4 animate-fadeIn">
              <div className={`border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-[#091C3E]'}`}>
                  Submit Suggestions & Ideas
                </h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Your suggestions are sent directly to the administration and management teams to help improve Same Day Assist services.
                </p>
              </div>

              {suggSuccess ? (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-3 animate-fadeIn">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#091C3E]'}`}>
                    Suggestion Received by Admin
                  </h4>
                  <p className={`text-xs max-w-md mx-auto ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Thank you for helping us improve! Your suggestion has been recorded in the admin management hub under Reference{' '}
                    <strong className="font-mono text-emerald-500">{suggSuccess}</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setSuggSuccess(null); setSuggText(''); setSuggTitle(''); }}
                    className="text-xs text-red hover:underline font-bold cursor-pointer pt-2"
                  >
                    Submit Another Suggestion
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSuggestionSubmit} className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={`block font-bold mb-1 uppercase text-[10px] tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        Area of Suggestion
                      </label>
                      <select
                        value={suggCategory}
                        onChange={e => setSuggCategory(e.target.value)}
                        className={`w-full rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-red transition-colors ${
                          isDark ? 'bg-[#091C3E] border border-[#142D59] text-white' : 'bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white'
                        }`}
                      >
                        <option>Mobile App & Navigation</option>
                        <option>Contractor & Inspector Service Quality</option>
                        <option>Response Speed & Dispatch SLA</option>
                        <option>Membership Plans & Benefits</option>
                        <option>Billing & Payment Features</option>
                        <option>New Security Hardware Support</option>
                        <option>Other General Improvements</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block font-bold mb-1 uppercase text-[10px] tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        Short Title / Topic (Optional)
                      </label>
                      <input
                        type="text"
                        value={suggTitle}
                        onChange={e => setSuggTitle(e.target.value)}
                        placeholder="e.g. Add instant push notification for dispatch"
                        className={`w-full rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-red transition-colors ${
                          isDark ? 'bg-[#091C3E] border border-[#142D59] text-white placeholder-slate-500' : 'bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block font-bold mb-1 uppercase text-[10px] tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Your Suggestion / Feedback Details *
                    </label>
                    <textarea
                      rows={4}
                      value={suggText}
                      onChange={e => setSuggText(e.target.value)}
                      required
                      placeholder="Please share what you liked or how we can improve your Same Day Assist experience..."
                      className={`w-full rounded-xl p-3.5 focus:outline-none focus:border-red leading-relaxed transition-colors ${
                        isDark ? 'bg-[#091C3E] border border-[#142D59] text-white placeholder-slate-500' : 'bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white'
                      }`}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={suggLoading}
                    className="w-full py-3 bg-red hover:bg-red/90 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    {suggLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending to Admin...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Suggestion to Admin</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. COMPLAINTS */}
          {/* ========================================================================= */}
          {activeTab === 'complaints' && (
            <div className="space-y-4 animate-fadeIn">
              <div className={`border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-[#091C3E]'}`}>
                    Lodge a Complaint
                  </h3>
                  <span className="text-[10px] font-mono bg-red/10 text-red border border-red/20 px-2 py-0.5 rounded-full font-bold">
                    Admin Review
                  </span>
                </div>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Complaints are logged directly into the Admin Portal for formal investigation and swift resolution.
                </p>
              </div>

              {compSuccessId ? (
                <div className="bg-red/10 border border-red/30 rounded-2xl p-6 text-center space-y-3 animate-fadeIn">
                  <div className="w-12 h-12 rounded-full bg-red/20 text-red flex items-center justify-center mx-auto">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <h4 className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#091C3E]'}`}>
                    Complaint Case Registered in Admin System
                  </h4>
                  <p className={`text-xs max-w-md mx-auto ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Your complaint has been delivered to Same Day Assist administration. A case officer will review the incident report and contact you.
                  </p>
                  <div className="inline-block bg-red/15 border border-red/40 px-4 py-2 rounded-xl text-sm font-mono font-bold text-red">
                    Case Number: {compSuccessId}
                  </div>
                  <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Our compliance officer will reach out within 24 business hours.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setCompSuccessId(null); setCompStatement(''); }}
                    className={`text-xs font-bold cursor-pointer pt-2 block mx-auto underline ${isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-navy'}`}
                  >
                    Lodge Another Inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleComplaintSubmit} className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={`block font-bold mb-1 uppercase text-[10px] tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        Date of Incident
                      </label>
                      <input
                        type="date"
                        value={compIncidentDate}
                        onChange={e => setCompIncidentDate(e.target.value)}
                        className={`w-full rounded-xl px-3.5 py-2.5 font-mono focus:outline-none focus:border-red transition-colors ${
                          isDark ? 'bg-[#091C3E] border border-[#142D59] text-white' : 'bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block font-bold mb-1 uppercase text-[10px] tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        Job / Assessment ID (Optional)
                      </label>
                      <input
                        type="text"
                        value={compJobId}
                        onChange={e => setCompJobId(e.target.value)}
                        placeholder="e.g. JOB-8910 or leave blank"
                        className={`w-full rounded-xl px-3.5 py-2.5 font-mono focus:outline-none focus:border-red transition-colors ${
                          isDark ? 'bg-[#091C3E] border border-[#142D59] text-white placeholder-slate-500' : 'bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block font-bold mb-1 uppercase text-[10px] tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Nature of Complaint
                    </label>
                    <select
                      value={compCategory}
                      onChange={e => setCompCategory(e.target.value)}
                      className={`w-full rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-red transition-colors ${
                        isDark ? 'bg-[#091C3E] border border-[#142D59] text-white' : 'bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white'
                      }`}
                    >
                      <option>Technician Work Quality & Conduct</option>
                      <option>Response Time Delay / SLA Breach</option>
                      <option>Billing, Invoicing, or Co-Pay Dispute</option>
                      <option>Incomplete Safety Assessment</option>
                      <option>Property or Gate Automation Concern</option>
                      <option>Other Service Dispute</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block font-bold mb-1 uppercase text-[10px] tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Detailed Statement *
                    </label>
                    <textarea
                      rows={4}
                      value={compStatement}
                      onChange={e => setCompStatement(e.target.value)}
                      required
                      placeholder="Please provide full details of what occurred, names of any personnel involved, and any supporting facts..."
                      className={`w-full rounded-xl p-3.5 focus:outline-none focus:border-red leading-relaxed transition-colors ${
                        isDark ? 'bg-[#091C3E] border border-[#142D59] text-white placeholder-slate-500' : 'bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white'
                      }`}
                    />
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-[11px] text-amber-500 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                    <span>
                      Complaints are reviewed by independent quality auditors to ensure fair resolution, correct billing, and appropriate corrective actions.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={compLoading}
                    className="w-full py-3 bg-red hover:bg-red/90 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    {compLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting to Admin...</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-4 h-4" />
                        <span>Lodge Complaint with Admin</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. CONTACT US (COMPANY CONTACT DIRECTORY & DETAILS) */}
          {/* ========================================================================= */}
          {activeTab === 'directory' && (
            <div className="space-y-4 animate-fadeIn">
              <div className={`border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-[#091C3E]'}`}>
                  Same Day Assist Company Directory
                </h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Get in touch with our team through our 24/7 emergency hotline, customer support desk, or physical office.
                </p>
              </div>

              {/* PRIMARY CONTACT CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 24/7 PRIORITY DISPATCH */}
                <a
                  href="tel:+27115559111"
                  className="bg-red/10 hover:bg-red/20 border border-red/40 rounded-2xl p-4 transition-all block cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono uppercase font-bold text-red">24/7 Emergency Line</span>
                    <span className="text-xs text-red font-bold group-hover:underline">Call Now →</span>
                  </div>
                  <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#091C3E]'}`}>
                    Emergency Dispatch Control Room
                  </h4>
                  <p className="text-[12px] text-red mt-0.5 font-mono font-bold">
                    +27 (11) 555-9111
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Toll-Free: 0861 000 911
                  </p>
                  <p className={`text-[10px] mt-1.5 leading-snug ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Immediate armed patrol cruiser dispatch, alarm breaches & critical security emergencies.
                  </p>
                </a>

                {/* WHATSAPP SUPPORT */}
                <a
                  href="https://wa.me/27825551234"
                  target="_blank"
                  rel="noreferrer"
                  className={`rounded-2xl p-4 transition-all block cursor-pointer group border ${
                    isDark
                      ? 'bg-emerald-950/20 hover:bg-emerald-900/30 border-emerald-500/30 hover:border-emerald-400'
                      : 'bg-emerald-50 hover:bg-emerald-100/70 border-emerald-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono uppercase font-bold text-emerald-500">Live WhatsApp Chat</span>
                    <span className="text-xs text-emerald-500 font-bold group-hover:underline">Chat Now →</span>
                  </div>
                  <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#091C3E]'}`}>
                    Instant WhatsApp Support Desk
                  </h4>
                  <p className="text-[12px] text-emerald-500 mt-0.5 font-mono font-bold">
                    +27 (82) 555-1234
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Available: 24/7 Instant Messaging
                  </p>
                  <p className={`text-[10px] mt-1.5 leading-snug ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Send photos, location pins, and quick queries directly to our operations room.
                  </p>
                </a>

                {/* MEMBER SUPPORT & BILLING */}
                <a
                  href="tel:+27115550190"
                  className={`rounded-2xl p-4 transition-all block cursor-pointer group border ${
                    isDark
                      ? 'bg-[#091C3E] hover:bg-[#0d2754] border-[#142D59] hover:border-red'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-red/50 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-mono uppercase font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Mon - Fri 08:00 - 17:00
                    </span>
                    <span className={`text-xs group-hover:text-red ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Call Now →</span>
                  </div>
                  <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#091C3E]'}`}>
                    Customer Care & Accounts Desk
                  </h4>
                  <p className={`text-[11px] mt-0.5 font-mono font-bold ${isDark ? 'text-cyan-300' : 'text-navy'}`}>
                    +27 (11) 555-0190
                  </p>
                  <p className={`text-[10px] mt-1.5 leading-snug ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Plan upgrades, billing inquiries, invoice receipts & account management.
                  </p>
                </a>

                {/* GENERAL & CORPORATE ENQUIRIES */}
                <a
                  href="mailto:info@samedayassist.co.za"
                  className={`rounded-2xl p-4 transition-all block cursor-pointer group border ${
                    isDark
                      ? 'bg-[#091C3E] hover:bg-[#0d2754] border-[#142D59] hover:border-red'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-red/50 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-mono uppercase font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Email Response &lt; 2h
                    </span>
                    <span className={`text-xs group-hover:text-red ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Email Us →</span>
                  </div>
                  <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#091C3E]'}`}>
                    Corporate & Inquiries Desk
                  </h4>
                  <p className={`text-[11px] mt-0.5 font-mono font-bold ${isDark ? 'text-cyan-300' : 'text-navy'}`}>
                    info@samedayassist.co.za
                  </p>
                  <p className={`text-[10px] mt-1.5 leading-snug ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Business contracts, commercial fleet security & corporate partnerships.
                  </p>
                </a>
              </div>

              {/* COMPANY PHYSICAL LOCATION & OPERATING HOURS */}
              <div className={`rounded-2xl p-4 border space-y-3 text-xs transition-colors ${
                isDark ? 'bg-[#091C3E]/70 border-[#142D59]' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-red/10 text-red flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h5 className={`font-bold uppercase tracking-wider text-[11px] ${isDark ? 'text-white' : 'text-[#091C3E]'}`}>
                      Physical Head Office & Control Centre
                    </h5>
                    <p className={`mt-0.5 text-[11px] leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Same Day Assist (Pty) Ltd<br />
                      Sandton City Office Tower, 5th Floor, 83 Rivonia Road<br />
                      Sandhurst, Sandton, Johannesburg, 2196, South Africa
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2 border-t border-slate-200/50 dark:border-[#142D59]">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h5 className={`font-bold uppercase tracking-wider text-[11px] ${isDark ? 'text-white' : 'text-[#091C3E]'}`}>
                      Operating & Dispatch Hours
                    </h5>
                    <div className={`mt-0.5 grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      <p>• <strong>Emergency Control Room:</strong> 24/7/365</p>
                      <p>• <strong>Armed Response Dispatch:</strong> 24/7/365</p>
                      <p>• <strong>Client Services & Support:</strong> Mon - Fri 08:00 - 17:00</p>
                      <p>• <strong>Saturday Member Desk:</strong> 08:00 - 13:00</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-[#142D59] text-[11px]">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                    Support Email: <a href="mailto:support@samedayassist.co.za" className="font-bold text-red hover:underline">support@samedayassist.co.za</a>
                  </span>
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                    Registration No: <span className="font-mono font-bold">2023/891044/07</span>
                  </span>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
