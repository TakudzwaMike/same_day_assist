import React, { useState } from 'react';
import { Search, Filter, Clock, Calendar, CheckSquare, Plus, Trash } from 'lucide-react';
import { useAppState } from '../../contexts/AppStateContext';

export default function EnquiriesManager() {
  const { state, scheduleAssessment, createQuotation, addAuditLogLocal } = useAppState();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

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

  // Filter list
  const filteredEnquiries = state.enquiries.filter(e => {
    const matchesSearch = e.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          e.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = filterCategory === 'All' || e.serviceCategory === filterCategory;
    return matchesSearch && matchesCat;
  });

  const handleScheduleClick = (enqId: string) => {
    setSelectedEnqIdForAssess(enqId);
    // Find default contractor with matching specialty if possible
    const enq = state.enquiries.find(e => e.id === enqId);
    const defaultContractor = state.contractors.find(c => c.specialty === enq?.serviceCategory);
    setTargetContractorId(defaultContractor?.id || '');
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
      {/* FILTER CONTROLS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-3xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search enquiries by name or address..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="text-xs w-full p-2.5 pl-10 border border-slate-200 rounded-xl focus:outline-none focus:border-navy bg-slate-50/50"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="text-xs p-2 border border-slate-200 rounded-xl focus:outline-none focus:border-navy font-bold bg-white cursor-pointer"
          >
            <option value="All">All Specialties</option>
            <option value="Security">Security</option>
            <option value="Electrical">Electrical</option>
            <option value="Plumbing">Plumbing</option>
            <option value="Construction">Construction</option>
          </select>
        </div>
      </div>

      {/* TABLE/LIST GRID */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 font-bold uppercase tracking-wider text-slate-500 font-mono">
              <th className="p-4 pl-6">Client Name</th>
              <th className="p-4">Specialty</th>
              <th className="p-4">Street Address</th>
              <th className="p-4">Status</th>
              <th className="p-4 pr-6 text-right">Dispatch Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredEnquiries.map(enq => (
              <tr key={enq.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 pl-6">
                  <p className="font-bold text-slate-800">{enq.customerName}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{enq.email} • {enq.phone}</p>
                </td>
                <td className="p-4">
                  <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded uppercase text-[10px]">
                    {enq.serviceCategory}
                  </span>
                </td>
                <td className="p-4 text-slate-500 max-w-xs truncate">{enq.address}</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded-sm font-bold text-[9px] uppercase ${
                    enq.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                    enq.status === 'Approved' ? 'bg-green-100 text-green-800' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {enq.status}
                  </span>
                </td>
                <td className="p-4 pr-6 text-right">
                  {enq.status === 'Pending' && (
                    <button
                      type="button"
                      onClick={() => handleScheduleClick(enq.id)}
                      className="px-3.5 py-1.5 bg-navy hover:bg-navy-light text-white text-[10px] font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      Schedule Survey
                    </button>
                  )}
                  {enq.status === 'Scheduled' && (
                    <span className="text-[10px] text-slate-400 font-mono">Survey Scheduled</span>
                  )}
                  {enq.status === 'Assessed' && (
                    <button
                      type="button"
                      onClick={() => setSelectedEnqIdForQuote(enq.id)}
                      className="px-3.5 py-1.5 bg-red hover:bg-red/90 text-white text-[10px] font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      Create Quote
                    </button>
                  )}
                  {enq.status === 'Quoted' && (
                    <span className="text-[10px] text-slate-400 font-mono">Quote Dispatched</span>
                  )}
                  {enq.status === 'Approved' && (
                    <span className="text-[10px] text-emerald-600 font-bold">Approved & Done</span>
                  )}
                </td>
              </tr>
            ))}
            {filteredEnquiries.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400 font-mono text-xs">
                  No property enquiries match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL: SCHEDULE SURVEYOR */}
      {selectedEnqIdForAssess && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <form onSubmit={handleScheduleSubmit} className="bg-white border border-slate-200 w-full max-w-sm rounded-3xl p-6 shadow-xl flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-bold text-navy uppercase tracking-wide">Schedule Compliance Survey</h3>
              <p className="text-[9.5px] text-slate-400">Select a certified local surveyor patrol officer to inspect premises</p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Available Responders</label>
              <select
                value={targetContractorId}
                onChange={e => setTargetContractorId(e.target.value)}
                className="text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-navy bg-white"
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
                className="px-4 py-2 bg-navy hover:bg-navy-light text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Dispatch Surveyor
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: CREATE PRE-COMPLIANCE QUOTE */}
      {selectedEnqIdForQuote && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <form onSubmit={handleQuoteSubmit} className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 shadow-xl flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-bold text-navy uppercase tracking-wide">Finalize Pre-Compliance Quote</h3>
              <p className="text-[9.5px] text-slate-400">Enter pricing for SABS compliance upgrades required on customer premises</p>
            </div>

            {/* Line Items Editor */}
            <div className="border border-slate-100 rounded-xl p-3 bg-slate-50 space-y-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Line Items</span>
              <div className="space-y-1">
                {quoteItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[10px] bg-white p-2 rounded-lg border border-slate-200/50">
                    <span className="text-slate-600 font-medium">{item.desc}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-navy">R{item.cost}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveQuoteItem(idx)}
                        className="text-red hover:underline font-bold text-[9px]"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Line Item Row */}
              <div className="flex gap-2 border-t border-slate-200/60 pt-2.5 mt-2">
                <input
                  type="text"
                  placeholder="Upgrade description..."
                  value={newItemDesc}
                  onChange={e => setNewItemDesc(e.target.value)}
                  className="text-[10px] p-2 bg-white border border-slate-200 rounded-lg focus:outline-none flex-1"
                />
                <input
                  type="number"
                  placeholder="Cost (ZAR)"
                  value={newItemCost || ''}
                  onChange={e => setNewItemCost(Number(e.target.value))}
                  className="text-[10px] p-2 bg-white border border-slate-200 rounded-lg focus:outline-none w-20"
                />
                <button
                  type="button"
                  onClick={handleAddQuoteItem}
                  className="px-3 bg-navy text-white text-[10px] font-bold rounded-lg hover:bg-navy-light cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs px-1">
              <span className="font-bold text-slate-500 uppercase text-[9px]">Calculated Invoice Total:</span>
              <span className="text-sm font-brand-header text-red font-bold">R{quoteItems.reduce((sum, item) => sum + item.cost, 0)}</span>
            </div>

            <div className="flex gap-2 justify-end mt-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setSelectedEnqIdForQuote(null)}
                className="px-3.5 py-2 text-xs font-bold text-slate-500 hover:text-navy rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={quoteItems.length === 0}
                className="px-4 py-2 bg-red hover:bg-red/90 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Dispatch Quote to Customer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
