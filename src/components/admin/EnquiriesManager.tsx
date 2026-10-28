import React, { useState } from 'react';
import { 
  Search, Filter, Clock, Calendar, CheckSquare, Plus, Trash,
  PhoneCall, Lightbulb, ShieldAlert, FileText, CheckCircle2,
  AlertCircle, MessageSquare, Phone, ChevronDown, ChevronUp, UserCheck
} from 'lucide-react';
import { useAppState } from '../../contexts/AppStateContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function EnquiriesManager() {
  const { state, scheduleAssessment, createQuotation, updateEnquiryStatus, addAuditLogLocal } = useAppState();
  const { isDark } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Callback' | 'Suggestion' | 'Complaint' | 'Assessment'>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Scheduling state
  const [selectedEnqIdForAssess, setSelectedEnqIdForAssess] = useState<string | null>(null);
  const [targetContractorId, setTargetContractorId] = useState('');

  // Quote Generation state
  const [selectedEnqIdForQuote, setSelectedEnqIdForQuote] = useState<string | null>(null);
  const [quoteItems, setQuoteItems] = useState<{ desc: string; cost: number }[]>([
    { desc: 'Breaker board safety module upgrade', cost: 850 },
    { desc: 'Electronic gate sensor alignment & waterproofing', cost: 650 }
  ]);
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemCost, setNewItemCost] = useState(0);

  // Helper to categorize enquiry
  const getEnquiryType = (enq: any): 'Callback' | 'Suggestion' | 'Complaint' | 'Assessment' => {
    const cat = (enq.serviceCategory || '').toLowerCase();
    const notes = (enq.notes || '').toLowerCase();

    if (cat.includes('callback') || notes.includes('[callback')) return 'Callback';
    if (cat.includes('suggestion') || notes.includes('[suggestion') || notes.includes('[customer suggestion')) return 'Suggestion';
    if (cat.includes('complaint') || notes.includes('[formal complaint') || notes.includes('[complaint')) return 'Complaint';
    return 'Assessment';
  };

  // Counts
  const counts = {
    all: state.enquiries.length,
    callbacks: state.enquiries.filter(e => getEnquiryType(e) === 'Callback' && e.status === 'Pending').length,
    suggestions: state.enquiries.filter(e => getEnquiryType(e) === 'Suggestion' && e.status === 'Pending').length,
    complaints: state.enquiries.filter(e => getEnquiryType(e) === 'Complaint' && e.status !== 'Resolved').length,
    assessments: state.enquiries.filter(e => getEnquiryType(e) === 'Assessment' && e.status === 'Pending').length,
  };

  // Filter list
  const filteredEnquiries = state.enquiries.filter(e => {
    const type = getEnquiryType(e);
    const matchesType = filterType === 'All' || type === filterType;

    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      (e.customerName || '').toLowerCase().includes(query) ||
      (e.phone || '').toLowerCase().includes(query) ||
      (e.email || '').toLowerCase().includes(query) ||
      (e.address || '').toLowerCase().includes(query) ||
      (e.notes || '').toLowerCase().includes(query) ||
      (e.serviceCategory || '').toLowerCase().includes(query);

    return matchesType && matchesSearch;
  });

  const handleStatusChange = async (enquiryId: string, newStatus: string, reason?: string) => {
    try {
      await updateEnquiryStatus(enquiryId, newStatus, reason);
      const enq = state.enquiries.find(e => e.id === enquiryId);
      addAuditLogLocal(
        'Support Status Updated',
        `Admin updated ${enq?.customerName}'s request (${enq?.serviceCategory}) status to: ${newStatus}`
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleScheduleClick = (enqId: string) => {
    setSelectedEnqIdForAssess(enqId);
    const enq = state.enquiries.find(e => e.id === enqId);
    const defaultContractor = state.contractors.find(c => c.specialty === enq?.serviceCategory);
    setTargetContractorId(defaultContractor?.id || state.contractors[0]?.id || '');
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnqIdForAssess || !targetContractorId) return;

    try {
      await scheduleAssessment(selectedEnqIdForAssess, targetContractorId);
      const enq = state.enquiries.find(item => item.id === selectedEnqIdForAssess);
      const contractor = state.contractors.find(c => c.id === targetContractorId);
      addAuditLogLocal('Assessment Scheduled', `Scheduled compliance survey for ${enq?.customerName} with Surveyor ${contractor?.name}.`);
      setSelectedEnqIdForAssess(null);
    } catch (err: any) {
      alert(err.message || 'Failed to schedule assessment');
    }
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

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnqIdForQuote || quoteItems.length === 0) return;

    try {
      await createQuotation({
        enquiryId: selectedEnqIdForQuote,
        lineItems: quoteItems.map(item => ({ description: item.desc, cost: item.cost })),
      });
      const enq = state.enquiries.find(item => item.id === selectedEnqIdForQuote);
      const totalAmount = quoteItems.reduce((sum, item) => sum + item.cost, 0);
      addAuditLogLocal('Quotation Dispatched', `Dispatched pre-compliance quote of R${totalAmount} to customer ${enq?.customerName}.`);
      setSelectedEnqIdForQuote(null);
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch quotation');
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* FILTER & TYPE NAVIGATION HEADER */}
      <div className={`p-4 rounded-3xl border shadow-xs flex flex-col gap-4 transition-colors ${
        isDark ? 'bg-[#091C3E] border-[#142D59]' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div>
            <h2 className={`text-base font-bold uppercase font-brand-header tracking-wide ${
              isDark ? 'text-white' : 'text-navy'
            }`}>
              Client Communications & Support Hub
            </h2>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Manage incoming callback requests, client suggestions, formal complaints, and property surveys.
            </p>
          </div>

          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by client, phone, topic or reason..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`text-xs w-full py-2.5 pl-10 pr-3.5 rounded-xl border focus:outline-none focus:border-red transition-colors ${
                isDark 
                  ? 'bg-[#050E20] border-[#142D59] text-white placeholder-slate-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>
        </div>

        {/* PILL NAVIGATION TABS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 border-t border-slate-200/50 dark:border-[#142D59]">
          <button
            type="button"
            onClick={() => setFilterType('All')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              filterType === 'All'
                ? 'bg-red text-white shadow-sm'
                : isDark
                  ? 'text-slate-300 hover:text-white hover:bg-[#050E20]'
                  : 'text-slate-600 hover:text-navy hover:bg-slate-100'
            }`}
          >
            <span>All Requests</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-black/20">{counts.all}</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterType('Callback')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              filterType === 'Callback'
                ? 'bg-red text-white shadow-sm'
                : isDark
                  ? 'text-slate-300 hover:text-white hover:bg-[#050E20]'
                  : 'text-slate-600 hover:text-navy hover:bg-slate-100'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Callbacks</span>
            {counts.callbacks > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-amber-500 text-white font-black animate-pulse">
                {counts.callbacks}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setFilterType('Suggestion')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              filterType === 'Suggestion'
                ? 'bg-red text-white shadow-sm'
                : isDark
                  ? 'text-slate-300 hover:text-white hover:bg-[#050E20]'
                  : 'text-slate-600 hover:text-navy hover:bg-slate-100'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Suggestions</span>
            {counts.suggestions > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-blue-500 text-white font-black">
                {counts.suggestions}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setFilterType('Complaint')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              filterType === 'Complaint'
                ? 'bg-red text-white shadow-sm'
                : isDark
                  ? 'text-slate-300 hover:text-white hover:bg-[#050E20]'
                  : 'text-slate-600 hover:text-navy hover:bg-slate-100'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Complaints</span>
            {counts.complaints > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-red text-white font-black animate-pulse">
                {counts.complaints}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setFilterType('Assessment')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              filterType === 'Assessment'
                ? 'bg-red text-white shadow-sm'
                : isDark
                  ? 'text-slate-300 hover:text-white hover:bg-[#050E20]'
                  : 'text-slate-600 hover:text-navy hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Property Surveys</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-black/20">{counts.assessments}</span>
          </button>
        </div>
      </div>

      {/* ITEMS LIST */}
      <div className={`rounded-3xl border shadow-xs overflow-hidden transition-colors ${
        isDark ? 'bg-[#091C3E] border-[#142D59]' : 'bg-white border-slate-200'
      }`}>
        <div className="divide-y divide-slate-100 dark:divide-[#142D59]">
          {filteredEnquiries.map(enq => {
            const type = getEnquiryType(enq);
            const isExpanded = expandedId === enq.id;

            return (
              <div
                key={enq.id}
                className={`p-4 sm:p-5 transition-colors ${
                  isDark ? 'hover:bg-[#0d2754]/40' : 'hover:bg-slate-50/70'
                }`}
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  {/* LEFT: ICON & DETAILS */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                      type === 'Callback' 
                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30' 
                        : type === 'Suggestion' 
                          ? 'bg-blue-500/10 text-blue-500 border border-blue-500/30' 
                          : type === 'Complaint' 
                            ? 'bg-red/10 text-red border border-red/30' 
                            : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                    }`}>
                      {type === 'Callback' && <PhoneCall className="w-5 h-5" />}
                      {type === 'Suggestion' && <Lightbulb className="w-5 h-5" />}
                      {type === 'Complaint' && <ShieldAlert className="w-5 h-5" />}
                      {type === 'Assessment' && <FileText className="w-5 h-5" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-bold uppercase tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {enq.customerName || 'Anonymous Customer'}
                        </span>

                        {/* BADGE */}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          type === 'Callback' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300/40' :
                          type === 'Suggestion' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-300/40' :
                          type === 'Complaint' ? 'bg-red/15 text-red dark:bg-red/20 dark:text-red border border-red/40' :
                          'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {type === 'Callback' ? 'Callback Request' :
                           type === 'Suggestion' ? 'Customer Suggestion' :
                           type === 'Complaint' ? 'Formal Complaint' :
                           enq.serviceCategory || 'Property Assessment'}
                        </span>

                        {/* STATUS BADGE */}
                        <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-mono font-bold uppercase ${
                          enq.status === 'Pending' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' :
                          enq.status === 'Contacted' ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300' :
                          enq.status === 'Under Review' || enq.status === 'Under Investigation' ? 'bg-purple-500/15 text-purple-600 dark:text-purple-300' :
                          enq.status === 'Resolved' || enq.status === 'Approved' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' :
                          'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {enq.status}
                        </span>
                      </div>

                      {/* CONTACT INFO & META */}
                      <div className={`mt-1 flex items-center gap-3 text-[11px] font-mono flex-wrap ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        {enq.phone && (
                          <a href={`tel:${enq.phone}`} className="hover:text-red hover:underline flex items-center gap-1 font-bold">
                            <Phone className="w-3 h-3" />
                            <span>{enq.phone}</span>
                          </a>
                        )}
                        {enq.email && <span>• {enq.email}</span>}
                        {enq.createdAt && (
                          <span>• {new Date(enq.createdAt).toLocaleDateString()}</span>
                        )}
                      </div>

                      {/* PREVIEW OF STATEMENT / REASON */}
                      {enq.notes && (
                        <p className={`mt-2 text-xs line-clamp-2 leading-relaxed ${
                          isDark ? 'text-slate-300' : 'text-slate-700'
                        }`}>
                          {enq.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* RIGHT: QUICK ADMIN ACTIONS */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : enq.id)}
                      className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        isDark 
                          ? 'border-[#142D59] bg-[#050E20] text-slate-300 hover:text-white' 
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>{isExpanded ? 'Hide Details' : 'View Full Details'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {/* CONTEXTUAL QUICK ACTION BUTTONS */}
                    {type === 'Callback' && (
                      <>
                        <a
                          href={`tel:${enq.phone}`}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>Call Client</span>
                        </a>
                        {enq.status === 'Pending' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(enq.id, 'Contacted', 'Admin phoned customer')}
                            className="px-3 py-1.5 bg-navy hover:bg-navy-light text-white text-[11px] font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                          >
                            Mark Contacted
                          </button>
                        )}
                        {enq.status !== 'Resolved' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(enq.id, 'Resolved', 'Callback completed')}
                            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                          >
                            Resolve
                          </button>
                        )}
                      </>
                    )}

                    {type === 'Suggestion' && (
                      <>
                        {enq.status === 'Pending' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(enq.id, 'Reviewed', 'Product team reviewed suggestion')}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                          >
                            Mark Reviewed
                          </button>
                        )}
                        {enq.status !== 'Resolved' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(enq.id, 'Resolved', 'Suggestion incorporated')}
                            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                          >
                            Archive
                          </button>
                        )}
                      </>
                    )}

                    {type === 'Complaint' && (
                      <>
                        {enq.status === 'Pending' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(enq.id, 'Under Investigation', 'Auditor assigned to review statement')}
                            className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                          >
                            Investigate
                          </button>
                        )}
                        {enq.status !== 'Resolved' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(enq.id, 'Resolved', 'Corrective action taken & customer notified')}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                          >
                            Mark Resolved
                          </button>
                        )}
                      </>
                    )}

                    {type === 'Assessment' && (
                      <>
                        {enq.status === 'Pending' && (
                          <button
                            type="button"
                            onClick={() => handleScheduleClick(enq.id)}
                            className="px-3.5 py-1.5 bg-navy hover:bg-navy-light text-white text-[11px] font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                          >
                            Schedule Survey
                          </button>
                        )}
                        {enq.status === 'Assessed' && (
                          <button
                            type="button"
                            onClick={() => setSelectedEnqIdForQuote(enq.id)}
                            className="px-3.5 py-1.5 bg-red hover:bg-red/90 text-white text-[11px] font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                          >
                            Create Quote
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* EXPANDED FULL DETAILS VIEW */}
                {isExpanded && (
                  <div className={`mt-4 pt-4 border-t space-y-3 animate-fadeIn text-xs ${
                    isDark ? 'border-[#142D59]' : 'border-slate-200'
                  }`}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className={`p-3 rounded-2xl border ${
                        isDark ? 'bg-[#050E20] border-[#142D59]' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <span className={`text-[10px] font-bold uppercase tracking-wider block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Customer Contact
                        </span>
                        <p className={`font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{enq.customerName}</p>
                        <p className="font-mono text-[11px] text-red font-bold mt-0.5">{enq.phone}</p>
                        <p className="font-mono text-[11px] text-slate-500">{enq.email}</p>
                      </div>

                      <div className={`p-3 rounded-2xl border ${
                        isDark ? 'bg-[#050E20] border-[#142D59]' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <span className={`text-[10px] font-bold uppercase tracking-wider block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Location / Address
                        </span>
                        <p className={`mt-1 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          {enq.address || 'Member Communications Hub'}
                        </p>
                      </div>

                      <div className={`p-3 rounded-2xl border ${
                        isDark ? 'bg-[#050E20] border-[#142D59]' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <span className={`text-[10px] font-bold uppercase tracking-wider block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          System Category & Reference
                        </span>
                        <p className={`font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {enq.serviceCategory}
                        </p>
                        <p className="font-mono text-[10px] text-slate-500 mt-0.5">ID: {enq.id}</p>
                      </div>
                    </div>

                    {/* COMPLETE REASON / NOTES STATEMENT */}
                    <div className={`p-4 rounded-2xl border ${
                      isDark ? 'bg-[#050E20] border-[#142D59]' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 ${
                        type === 'Callback' ? 'text-amber-500' :
                        type === 'Suggestion' ? 'text-blue-500' :
                        type === 'Complaint' ? 'text-red' :
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        {type === 'Callback' ? 'Client Reason for Callback & Request Details' :
                         type === 'Suggestion' ? 'Client Suggestion & Feedback' :
                         type === 'Complaint' ? 'Formal Complaint Statement & Incident Details' :
                         'Enquiry Statement & Notes'}
                      </span>
                      <pre className={`whitespace-pre-wrap font-sans text-xs leading-relaxed ${
                        isDark ? 'text-slate-200' : 'text-slate-800'
                      }`}>
                        {enq.notes || 'No additional statement provided.'}
                      </pre>
                    </div>

                    {/* STATUS UPDATE CONTROLS */}
                    <div className="flex items-center gap-2 pt-2 justify-end">
                      <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Set Request Status:
                      </span>
                      {['Pending', 'Contacted', 'Under Investigation', 'Resolved'].map(st => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => handleStatusChange(enq.id, st)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                            enq.status === st
                              ? 'bg-red text-white border-red'
                              : isDark
                                ? 'bg-[#050E20] border-[#142D59] text-slate-300 hover:text-white'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filteredEnquiries.length === 0 && (
            <div className="p-12 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-[#050E20] flex items-center justify-center mx-auto text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <p className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                No submissions found
              </p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                No callback requests, suggestions, complaints, or surveys match your current filter settings.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: SCHEDULE SURVEYOR */}
      {selectedEnqIdForAssess && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <form onSubmit={handleScheduleSubmit} className={`border w-full max-w-sm rounded-3xl p-6 shadow-xl flex flex-col gap-4 ${
            isDark ? 'bg-[#091C3E] border-[#142D59]' : 'bg-white border-slate-200'
          }`}>
            <div>
              <h3 className={`text-sm font-bold uppercase tracking-wide ${isDark ? 'text-white' : 'text-navy'}`}>
                Schedule Compliance Survey
              </h3>
              <p className="text-[9.5px] text-slate-400">Select a certified local surveyor patrol officer to inspect premises</p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Available Responders</label>
              <select
                value={targetContractorId}
                onChange={e => setTargetContractorId(e.target.value)}
                className={`text-xs p-2.5 border rounded-xl focus:outline-none focus:border-navy ${
                  isDark ? 'bg-[#050E20] border-[#142D59] text-white' : 'bg-white border-slate-200 text-slate-900'
                }`}
              >
                {state.contractors.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.specialty}) • ★ {c.rating}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 justify-end mt-2">
              <button
                type="button"
                onClick={() => setSelectedEnqIdForAssess(null)}
                className="px-3.5 py-2 text-xs font-bold text-slate-500 hover:text-navy rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-navy hover:bg-navy-light text-white rounded-xl shadow-sm cursor-pointer"
              >
                Confirm Dispatch
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: CREATE QUOTATION */}
      {selectedEnqIdForQuote && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <form onSubmit={handleQuoteSubmit} className={`border w-full max-w-md rounded-3xl p-6 shadow-xl flex flex-col gap-4 ${
            isDark ? 'bg-[#091C3E] border-[#142D59]' : 'bg-white border-slate-200'
          }`}>
            <div>
              <h3 className={`text-sm font-bold uppercase tracking-wide ${isDark ? 'text-white' : 'text-navy'}`}>
                Prepare Pre-Compliance Quote
              </h3>
              <p className="text-[9.5px] text-slate-400">Specify repair costs or hardware upgrades required before onboarding activation</p>
            </div>

            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {quoteItems.map((item, idx) => (
                <div key={idx} className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                  isDark ? 'bg-[#050E20] border-[#142D59]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className={`truncate flex-1 font-medium mr-2 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                    {item.desc}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-red">R{item.cost}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuoteItem(idx)}
                      className="text-slate-400 hover:text-red cursor-pointer"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Item / labor description..."
                value={newItemDesc}
                onChange={e => setNewItemDesc(e.target.value)}
                className={`text-xs p-2.5 border rounded-xl flex-1 focus:outline-none focus:border-navy ${
                  isDark ? 'bg-[#050E20] border-[#142D59] text-white' : 'bg-white border-slate-200 text-slate-900'
                }`}
              />
              <input
                type="number"
                placeholder="Cost (ZAR)"
                value={newItemCost || ''}
                onChange={e => setNewItemCost(Number(e.target.value))}
                className={`text-xs p-2.5 border rounded-xl w-24 font-mono focus:outline-none focus:border-navy ${
                  isDark ? 'bg-[#050E20] border-[#142D59] text-white' : 'bg-white border-slate-200 text-slate-900'
                }`}
              />
              <button
                type="button"
                onClick={handleAddQuoteItem}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
              isDark ? 'bg-[#050E20] border-[#142D59]' : 'bg-slate-100 border-slate-200'
            }`}>
              <span>Total Estimated Quote:</span>
              <span className="font-mono text-red text-sm">
                R{quoteItems.reduce((sum, item) => sum + item.cost, 0)}
              </span>
            </div>

            <div className="flex gap-2 justify-end mt-2">
              <button
                type="button"
                onClick={() => setSelectedEnqIdForQuote(null)}
                className="px-3.5 py-2 text-xs font-bold text-slate-500 hover:text-navy rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-red hover:bg-red/90 text-white rounded-xl shadow-sm cursor-pointer"
              >
                Dispatch to Customer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
