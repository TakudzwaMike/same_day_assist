import React, { useState, useEffect } from 'react';
import {
  Shield, Search, Filter, TrendingDown, Eye, CheckCircle,
  AlertTriangle, User, Calendar, RefreshCw, ArrowUpRight
} from 'lucide-react';
import { useAppState } from '../../contexts/AppStateContext';
import { api } from '../../services/api';
import { Customer, BenefitSummary } from '../../types';
import AdminCustomerProfileModal from './AdminCustomerProfileModal';
import EmptyState from '../shared/EmptyState';

export default function AdminMembershipsManager() {
  const { state, refreshData } = useAppState();

  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState('ALL');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Cache for customer summaries
  const [summaries, setSummaries] = useState<Record<string, BenefitSummary>>({});
  const [isLoadingSummaries, setIsLoadingSummaries] = useState(false);

  const customers = state.customers || [];

  useEffect(() => {
    const loadSummaries = async () => {
      setIsLoadingSummaries(true);
      const newSummaries: Record<string, BenefitSummary> = {};
      for (const cust of customers) {
        try {
          const sum = await api.getCustomerBenefitSummary(cust.id);
          newSummaries[cust.id] = sum;
        } catch (e) {
          // fallback if not yet assigned
        }
      }
      setSummaries(newSummaries);
      setIsLoadingSummaries(false);
    };

    if (customers.length > 0) {
      loadSummaries();
    }
  }, [customers.length]);

  const fmt = (num?: number) => `R${(num || 0).toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const filteredCustomers = customers.filter(cust => {
    const term = searchTerm.toLowerCase();
    const summary = summaries[cust.id];
    const planName = summary?.planName || (cust as any).package || '';

    const matchesSearch = 
      cust.name?.toLowerCase().includes(term) ||
      cust.email?.toLowerCase().includes(term) ||
      cust.phone?.toLowerCase().includes(term) ||
      planName.toLowerCase().includes(term);

    const matchesPlan = planFilter === 'ALL' || planName.toLowerCase().includes(planFilter.toLowerCase());

    return matchesSearch && matchesPlan;
  });

  const handleOpenCustomer = (cust: Customer) => {
    setSelectedCustomer(cust);
    setIsProfileModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-black italic tracking-wide uppercase font-brand-header text-navy">
            Customer Memberships & Benefit Allowances
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Full administrative visibility into every member's active plan, monthly fees, annual assistance benefit, and usage percentages
          </p>
        </div>

        <button
          type="button"
          onClick={() => refreshData()}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-navy text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search member name, email, plan..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-navy text-slate-800 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Plan:</span>
          <select
            value={planFilter}
            onChange={e => setPlanFilter(e.target.value)}
            className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-navy focus:outline-none"
          >
            <option value="ALL">All Membership Plans</option>
            <option value="Assist">Assist (R799)</option>
            <option value="Assist Plus">Assist Plus (R1,499)</option>
            <option value="Assist Pro">Assist Pro (R2,999)</option>
            <option value="Assist Elite">Assist Elite (R3,499)</option>
            <option value="Residential Advanced">Residential Advanced (R4,999)</option>
            <option value="Business Advanced">Business Advanced (R8,999)</option>
          </select>
        </div>
      </div>

      {/* MEMBERS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="p-8 text-center">
            <EmptyState
              icon={Shield}
              title="No Members Found"
              description="No customers match your filter or search query."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100/80 text-slate-600 font-mono text-[10px] uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Membership Plan</th>
                  <th className="p-3.5 text-right">Monthly Fee</th>
                  <th className="p-3.5 text-right">Annual Benefit</th>
                  <th className="p-3.5 text-right">Used</th>
                  <th className="p-3.5 text-right">Remaining</th>
                  <th className="p-3.5 text-center">Benefit Usage %</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map(cust => {
                  const summary = summaries[cust.id];
                  const planName = summary?.planName || (cust as any).package || 'Assist Plus';
                  const monthlyPrice = summary?.monthlyPrice || 1499;
                  const annualBenefit = summary?.annualBenefit || 15000;
                  const used = summary?.usedBenefit || 0;
                  const remaining = summary?.remainingBenefit !== undefined ? summary.remainingBenefit : (annualBenefit - used);
                  const usagePct = summary?.usagePercentage || 0;
                  const isZeroParts = summary?.isPartsBenefitZero || annualBenefit === 0;

                  return (
                    <tr key={cust.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5">
                        <span className="font-bold text-slate-900 block">{cust.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono block">{cust.email}</span>
                      </td>

                      <td className="p-3.5">
                        <span className="font-bold text-navy block">{planName}</span>
                        <span className="text-[9.5px] text-slate-400 font-mono block">
                          {(cust as any).accountType || 'Residential'}
                        </span>
                      </td>

                      <td className="p-3.5 text-right font-mono font-bold text-slate-800">
                        {fmt(monthlyPrice)} / mo
                      </td>

                      <td className="p-3.5 text-right font-mono font-bold text-navy">
                        {isZeroParts ? (
                          <span className="text-amber-800 font-bold">R0 (Labour only)</span>
                        ) : (
                          fmt(annualBenefit)
                        )}
                      </td>

                      <td className="p-3.5 text-right font-mono font-bold text-red-600">
                        {fmt(used)}
                      </td>

                      <td className="p-3.5 text-right font-mono font-bold text-emerald-600">
                        {isZeroParts ? '-' : fmt(remaining)}
                      </td>

                      <td className="p-3.5 text-center">
                        {isZeroParts ? (
                          <span className="text-[9.5px] font-mono text-slate-400">N/A (R0 Parts)</span>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-mono font-bold text-[10px] text-slate-700">
                              {usagePct.toFixed(1)}%
                            </span>
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${Math.min(usagePct, 100)}%` }}
                                className="bg-red-500 h-full"
                              />
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="p-3.5 text-center whitespace-nowrap">
                        {summary?.membershipStatus === 'Pending Activation' ? (
                          <span className="text-[8.5px] font-extrabold uppercase px-2 py-0.5 rounded-full font-mono bg-amber-100 text-amber-800 border border-amber-300">
                            ● PENDING ({summary.activationPercentage ?? 20}%)
                          </span>
                        ) : (
                          <span className="text-[8.5px] font-extrabold uppercase px-2 py-0.5 rounded-full font-mono bg-emerald-100 text-emerald-800 border border-emerald-300">
                            ● {cust.status || 'Active'}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenCustomer(cust)}
                          className="px-3 py-1.5 bg-navy hover:bg-navy-light text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ml-auto cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Profile</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FULL 8-TAB CUSTOMER PROFILE MODAL */}
      {selectedCustomer && (
        <AdminCustomerProfileModal
          customer={selectedCustomer}
          isOpen={isProfileModalOpen}
          onClose={() => {
            setIsProfileModalOpen(false);
            setSelectedCustomer(null);
          }}
        />
      )}
    </div>
  );
}
