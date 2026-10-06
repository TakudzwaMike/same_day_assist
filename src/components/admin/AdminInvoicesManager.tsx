import React, { useState } from 'react';
import {
  FileText, Search, Filter, Download, Eye, Plus, CheckCircle,
  CreditCard, Shield, AlertTriangle, User, Calendar, X, Check,
  RefreshCw, DollarSign, Clock
} from 'lucide-react';
import { useAppState } from '../../contexts/AppStateContext';
import { api } from '../../services/api';
import { Invoice } from '../../types';
import EmptyState from '../shared/EmptyState';

export default function AdminInvoicesManager() {
  const { state, refreshData, addAuditLogLocal } = useAppState();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [planFilter, setPlanFilter] = useState<string>('ALL');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // New Invoice Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createCustomerId, setCreateCustomerId] = useState('');
  const [createServiceType, setCreateServiceType] = useState('Security Assistance');
  const [createDescription, setCreateDescription] = useState('');
  const [createLabour, setCreateLabour] = useState(1200);
  const [createParts, setCreateParts] = useState(800);
  const [createOther, setCreateOther] = useState(0);
  const [createContractorName, setCreateContractorName] = useState('Alpha 1 Rapid Response');
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  const invoices = state.invoices || [];

  // Filtered invoices
  const filteredInvoices = invoices.filter(inv => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      inv.invoiceNumber?.toLowerCase().includes(term) ||
      inv.customerName?.toLowerCase().includes(term) ||
      inv.customerId?.toLowerCase().includes(term) ||
      inv.claimId?.toLowerCase().includes(term) ||
      inv.jobId?.toLowerCase().includes(term) ||
      inv.contractorName?.toLowerCase().includes(term) ||
      inv.membershipPlan?.toLowerCase().includes(term);

    const matchesStatus = statusFilter === 'ALL' || inv.paymentStatus === statusFilter;
    const matchesPlan = planFilter === 'ALL' || inv.membershipPlan === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  const fmt = (num?: number) => `R${(num || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Totals
  const totalBilled = invoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
  const totalBenefitAbsorbed = invoices.reduce((sum, i) => sum + (i.amountCoveredByBenefit || 0), 0);
  const totalCustomerPayable = invoices.reduce((sum, i) => sum + (i.amountPayableByCustomer || 0), 0);
  const totalPaid = invoices
    .filter(i => i.paymentStatus === 'PAID')
    .reduce((sum, i) => sum + (i.amountPayableByCustomer || 0), 0);

  const handleDownloadPDF = (id: string) => {
    const url = api.getPDFUrl('invoice', id);
    window.open(url, '_blank');
    addAuditLogLocal('Invoice PDF Downloaded', `Admin downloaded PDF invoice ${id}`);
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createCustomerId || !createDescription) {
      alert('Please specify customer and service description');
      return;
    }
    setIsSubmittingCreate(true);
    try {
      const created = await api.createInvoice({
        customerId: createCustomerId,
        serviceType: createServiceType,
        serviceDescription: createDescription,
        labourCost: Number(createLabour),
        partsCost: Number(createParts),
        otherCharges: Number(createOther),
        contractorName: createContractorName,
      });

      addAuditLogLocal('Invoice Created', `Admin generated new tax invoice ${created.invoiceNumber} for customer ${createCustomerId}`);
      await refreshData();
      setIsCreateModalOpen(false);
      alert(`Invoice ${created.invoiceNumber} created successfully! Benefit coverage and payable amounts calculated.`);
    } catch (err: any) {
      alert(err.message || 'Failed to create invoice');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-black italic tracking-wide uppercase font-brand-header text-navy">
            Invoice & Billing Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit tax invoices for every member, tracking Annual Assistance Benefit absorption and customer settlements
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refreshData()}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-navy text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setCreateCustomerId(state.customers[0]?.id || '');
              setIsCreateModalOpen(true);
            }}
            className="px-4 py-2 bg-navy hover:bg-navy-light text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Generate New Invoice</span>
          </button>
        </div>
      </div>

      {/* FINANCIAL AGGREGATIONS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Billed Services</span>
          <span className="text-2xl font-black font-brand-header text-navy mt-1 block">
            {fmt(totalBilled)}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">Across {invoices.length} invoices</span>
        </div>

        <div className="bg-emerald-50/70 p-4 sm:p-5 rounded-2xl border border-emerald-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block">Covered By Benefit</span>
          <span className="text-2xl font-black font-brand-header text-emerald-700 mt-1 block">
            {fmt(totalBenefitAbsorbed)}
          </span>
          <span className="text-[10px] text-emerald-700 font-medium mt-1 block">Deducted from member limits</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Customer Payable</span>
          <span className="text-2xl font-black font-brand-header text-navy mt-1 block">
            {fmt(totalCustomerPayable)}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">Member responsibility</span>
        </div>

        <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Settled By Customers</span>
          <span className="text-2xl font-black font-brand-header text-emerald-400 mt-1 block">
            {fmt(totalPaid)}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">Paid in full</span>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search invoice #, customer, claim, job..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-navy text-slate-800 font-medium"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Payment:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-navy focus:outline-none"
            >
              <option value="ALL">All Payment Statuses</option>
              <option value="PAID">PAID</option>
              <option value="UNPAID">UNPAID</option>
              <option value="PARTIALLY_PAID">PARTIALLY_PAID</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Plan:</span>
            <select
              value={planFilter}
              onChange={e => setPlanFilter(e.target.value)}
              className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-navy focus:outline-none"
            >
              <option value="ALL">All Plans</option>
              <option value="Assist">Assist (R799)</option>
              <option value="Assist Plus">Assist Plus (R1,499)</option>
              <option value="Assist Pro">Assist Pro (R2,999)</option>
              <option value="Assist Elite">Assist Elite (R3,499)</option>
              <option value="Residential Advanced">Residential Advanced (R4,999)</option>
              <option value="Business Advanced">Business Advanced (R8,999)</option>
            </select>
          </div>
        </div>
      </div>

      {/* INVOICES TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="p-8 text-center">
            <EmptyState
              icon={FileText}
              title="No Invoices Found"
              description="No tax invoices match your search or filter criteria."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100/80 text-slate-600 font-mono text-[10px] uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Invoice #</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Customer & Plan</th>
                  <th className="p-3.5">Related Job / Claim</th>
                  <th className="p-3.5 text-right">Total</th>
                  <th className="p-3.5 text-right">Benefit Covered</th>
                  <th className="p-3.5 text-right">Customer Payable</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map(invoice => {
                  const isPaid = invoice.paymentStatus === 'PAID';
                  const hasPayable = (invoice.amountPayableByCustomer || 0) > 0;

                  return (
                    <tr key={invoice.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-navy whitespace-nowrap">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="p-3.5 text-slate-500 font-mono whitespace-nowrap">
                        {invoice.issueDate || invoice.date ? new Date(invoice.issueDate || invoice.date || '').toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-slate-800 block">{invoice.customerName}</span>
                        <span className="text-[10px] font-mono text-red-600 font-bold block">{invoice.membershipPlan}</span>
                      </td>
                      <td className="p-3.5 font-mono text-[10px] text-slate-500">
                        {invoice.claimId && <span className="block text-navy font-bold">Claim: {invoice.claimId}</span>}
                        {invoice.jobId && <span className="block text-slate-500">Job: {invoice.jobId}</span>}
                        {invoice.serviceType && <span className="block text-slate-700 font-sans mt-0.5">{invoice.serviceType}</span>}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-800">
                        {fmt(invoice.totalAmount)}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-emerald-600">
                        {invoice.amountCoveredByBenefit ? fmt(invoice.amountCoveredByBenefit) : 'R0.00'}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-red-600">
                        {fmt(invoice.amountPayableByCustomer)}
                      </td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <span className={`text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full font-mono tracking-wider ${
                          isPaid
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : hasPayable
                            ? 'bg-red-100 text-red-800 border border-red-300'
                            : 'bg-blue-100 text-blue-800 border border-blue-300'
                        }`}>
                          ● {invoice.paymentStatus}
                        </span>
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedInvoice(invoice)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-navy text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                            title="View Detailed Invoice"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadPDF(invoice.id)}
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-navy border border-slate-200 rounded-xl transition-all cursor-pointer"
                            title="Download PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* INVOICE DETAILS MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto animate-scaleUp">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex justify-between items-start bg-slate-50/50 rounded-t-3xl">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-red-600 tracking-wider block">
                  Same Day Assist • Official Tax Invoice Record
                </span>
                <h3 className="text-xl font-black font-brand-header text-navy mt-0.5">
                  {selectedInvoice.invoiceNumber}
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  Issued: {selectedInvoice.issueDate || selectedInvoice.date ? new Date(selectedInvoice.issueDate || selectedInvoice.date || '').toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Member & Plan Details */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Customer</span>
                  <span className="font-bold text-slate-800 block mt-0.5">{selectedInvoice.customerName}</span>
                  <span className="text-slate-500 block">{selectedInvoice.customerEmail}</span>
                  {selectedInvoice.customerAddress && (
                    <span className="text-slate-500 block text-[11px] mt-0.5">{selectedInvoice.customerAddress}</span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Membership Plan & Tech</span>
                  <span className="font-bold text-navy block mt-0.5">{selectedInvoice.membershipPlan}</span>
                  {selectedInvoice.contractorName && (
                    <span className="text-slate-600 block mt-0.5">Technician: {selectedInvoice.contractorName}</span>
                  )}
                  {selectedInvoice.serviceType && (
                    <span className="text-slate-600 block">Service: {selectedInvoice.serviceType}</span>
                  )}
                </div>
              </div>

              {/* Service Description */}
              {selectedInvoice.serviceDescription && (
                <div>
                  <h4 className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                    Service Scope & Findings
                  </h4>
                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                    {selectedInvoice.serviceDescription}
                  </p>
                </div>
              )}

              {/* Itemized Line Items Table */}
              <div>
                <h4 className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2">
                  Line Items & Charges
                </h4>
                <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                  <table className="w-full">
                    <thead className="bg-slate-100 text-slate-600 font-mono text-[10px] uppercase text-left">
                      <tr>
                        <th className="p-3">Item Description</th>
                        <th className="p-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-3">
                          <span className="font-bold text-slate-800 block">Labour & Fault Finding</span>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-700">
                          {fmt(selectedInvoice.labourCost)}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3">
                          <span className="font-bold text-slate-800 block">Replacement Parts & Hardware</span>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-700">
                          {fmt(selectedInvoice.partsCost)}
                        </td>
                      </tr>
                      {(selectedInvoice.otherCharges || 0) > 0 && (
                        <tr>
                          <td className="p-3">
                            <span className="font-bold text-slate-800 block">Consumables & Sundries</span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-700">
                            {fmt(selectedInvoice.otherCharges)}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Breakdown */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3">
                <div className="flex justify-between items-center text-xs text-slate-300">
                  <span>Subtotal:</span>
                  <span className="font-mono">{fmt(selectedInvoice.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-300">
                  <span>VAT (15% Included):</span>
                  <span className="font-mono">{fmt(selectedInvoice.taxAmount)}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold text-white pt-2 border-t border-slate-800">
                  <span>Total Amount:</span>
                  <span className="font-mono text-base">{fmt(selectedInvoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-emerald-400 pt-1">
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" /> Covered by Annual Assistance Benefit:
                  </span>
                  <span className="font-mono font-bold">-{fmt(selectedInvoice.amountCoveredByBenefit)}</span>
                </div>
                <div className="flex justify-between items-center text-base font-black text-white pt-3 border-t border-slate-800">
                  <span>Amount Payable by Customer:</span>
                  <span className={`font-mono text-lg ${
                    selectedInvoice.amountPayableByCustomer > 0 ? 'text-red-400' : 'text-emerald-400'
                  }`}>
                    {fmt(selectedInvoice.amountPayableByCustomer)}
                  </span>
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex justify-between items-center pt-2">
                <div className="text-xs">
                  <span className="text-slate-500">Payment Status: </span>
                  <span className={`font-bold font-mono uppercase ${
                    selectedInvoice.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {selectedInvoice.paymentStatus}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadPDF(selectedInvoice.id)}
                    className="px-4 py-2 bg-navy hover:bg-navy-light text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW INVOICE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-scaleUp">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-red-600 tracking-wider">
                  Billing Administrator
                </span>
                <h3 className="text-lg font-black font-brand-header text-navy mt-0.5">
                  Generate Manual Tax Invoice
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase block">Select Member / Customer</label>
                <select
                  value={createCustomerId}
                  onChange={e => setCreateCustomerId(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  {state.customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email}) — Plan: {(c as any).package || 'Active Member'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase block">Service Type</label>
                  <input
                    type="text"
                    required
                    value={createServiceType}
                    onChange={e => setCreateServiceType(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase block">Technician Name</label>
                  <input
                    type="text"
                    value={createContractorName}
                    onChange={e => setCreateContractorName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase block">Service Description</label>
                <textarea
                  rows={2}
                  required
                  value={createDescription}
                  onChange={e => setCreateDescription(e.target.value)}
                  placeholder="Detail work performed..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase block">Labour Cost (R)</label>
                  <input
                    type="number"
                    required
                    value={createLabour}
                    onChange={e => setCreateLabour(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase block">Parts Cost (R)</label>
                  <input
                    type="number"
                    required
                    value={createParts}
                    onChange={e => setCreateParts(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase block">Other (R)</label>
                  <input
                    type="number"
                    value={createOther}
                    onChange={e => setCreateOther(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600">
                💡 The system will automatically check the member's current Annual Assistance Benefit allowance and allocate covered vs payable amounts accordingly.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate}
                  className="px-5 py-2 bg-navy hover:bg-navy-light disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmittingCreate ? <span>Generating...</span> : <span>Generate Invoice</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
