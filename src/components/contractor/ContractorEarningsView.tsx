import React, { useState } from 'react';
import { DollarSign, CreditCard, ArrowUpRight, CheckCircle2, Clock, ShieldCheck, Download, Wallet, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function ContractorEarningsView() {
  const { user } = useAuth();
  const [payoutRequested, setPayoutRequested] = useState(false);

  const earningsSummary = {
    totalEarned: 18450,
    availableBalance: 4250,
    pendingClearance: 1200,
    completedJobsCount: 24,
    averageRating: 4.9,
    bankName: 'First National Bank (FNB)',
    accountNumber: '•••• 6892 (Apex Security)',
  };

  const payoutHistory = [
    {
      id: 'DISP-9921',
      title: 'CCTV IP Camera Sensor & NVR Diagnostics',
      client: 'Bright (Sandton Core Client)',
      category: 'CCTV & Security',
      date: 'Today, 11:45 AM',
      calloutFee: 650,
      slaBonus: 350,
      totalAmount: 1000,
      status: 'Pending Clearance',
    },
    {
      id: 'DISP-9884',
      title: 'Perimeter Solar Infrared Beam & Alarm Service',
      client: 'Lerato Molefe (Bryanston Estate)',
      category: 'CCTV & Security',
      date: '12 Aug 2026',
      calloutFee: 950,
      slaBonus: 500,
      totalAmount: 1450,
      status: 'Paid',
    },
    {
      id: 'SURV-102',
      title: 'Commercial Property CCTV Risk & Audit Report',
      client: 'Kempton Commercial Hub',
      category: 'Property Safety Survey',
      date: '10 Aug 2026',
      calloutFee: 1800,
      slaBonus: 0,
      totalAmount: 1800,
      status: 'Paid',
    },
    {
      id: 'DISP-9740',
      title: 'Security Access Control Gate Battery Swap',
      client: 'Thabo Mokoena (Midrand)',
      category: 'Gate & Power Systems',
      date: '08 Aug 2026',
      calloutFee: 650,
      slaBonus: 300,
      totalAmount: 950,
      status: 'Paid',
    },
  ];

  const handleRequestPayout = () => {
    setPayoutRequested(true);
    setTimeout(() => {
      alert('Payout request of R4,250.00 submitted successfully to FNB Account •••• 6892. Processing turnaround: 2 hours.');
    }, 300);
  };

  return (
    <div className="flex flex-col gap-6 text-zinc-100 animate-fadeIn">
      {/* HEADER SECTION */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-red-500 uppercase">
            Financial Dashboard & Payout Ledger
          </span>
          <h2 className="text-xl font-black italic tracking-wide uppercase text-white font-brand-header">
            Contractor Balances & Payouts
          </h2>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            Registered Provider: {user?.name || 'Sipho Ndlovu (Apex CCTV & Security)'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRequestPayout}
            disabled={payoutRequested || earningsSummary.availableBalance === 0}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-2xl font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center gap-2 uppercase tracking-wider font-mono"
          >
            <Wallet className="w-4 h-4" />
            <span>{payoutRequested ? 'Payout Requested ✓' : 'Withdraw R4,250.00'}</span>
          </button>
        </div>
      </div>

      {/* STAT CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* AVAILABLE BALANCE */}
        <div className="bg-zinc-900 border border-emerald-500/30 rounded-3xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-emerald-400">Available Balance</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono mt-2">
            R{earningsSummary.availableBalance.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] font-mono text-zinc-400 mt-1">
            Ready for instant bank transfer to FNB
          </p>
        </div>

        {/* PENDING CLEARANCE */}
        <div className="bg-zinc-900 border border-amber-500/30 rounded-3xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-amber-400">Pending Clearance</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono mt-2">
            R{earningsSummary.pendingClearance.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] font-mono text-zinc-400 mt-1">
            Awaiting client sign-off clearance
          </p>
        </div>

        {/* TOTAL LIFETIME EARNED */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-zinc-400">Lifetime Earnings</span>
            <DollarSign className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-3xl font-black text-white font-mono mt-2">
            R{earningsSummary.totalEarned.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] font-mono text-zinc-400 mt-1">
            Across {earningsSummary.completedJobsCount} completed dispatches (Rating {earningsSummary.averageRating}★)
          </p>
        </div>
      </div>

      {/* BANK & PAYMENT DETAILS BANNER */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <span className="text-zinc-400 font-bold block">Verified Payout Bank Account</span>
            <span className="text-white font-medium">{earningsSummary.bankName} — {earningsSummary.accountNumber}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-3 py-1.5 rounded-xl font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>FICA & Banking Verified</span>
        </div>
      </div>

      {/* DETAILED EARNINGS LEDGER TABLE */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-white font-brand-header">
            Completed Job Earnings & Callout Breakdown
          </h3>
          <span className="text-[10px] font-mono text-zinc-400">Showing last 4 transactions</span>
        </div>

        <div className="divide-y divide-zinc-800/80">
          {payoutHistory.map((item) => (
            <div key={item.id} className="p-5 hover:bg-zinc-950/50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-2xl text-red-500 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{item.title}</span>
                    <span className="text-[9px] font-mono bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">
                      {item.id}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                    Client: {item.client} • {item.date}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-500 mt-1">
                    <span>Base Callout: R{item.calloutFee}</span>
                    {item.slaBonus > 0 && (
                      <span className="text-emerald-400 font-bold">+ Emergency SLA Bonus: R{item.slaBonus}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-1 border-t sm:border-t-0 border-zinc-800 pt-2 sm:pt-0">
                <div className="text-base font-black text-white font-mono">
                  +R{item.totalAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                </div>
                <span
                  className={`text-[9.5px] font-mono font-bold px-2.5 py-0.5 rounded-full ${item.status === 'Paid'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-amber-950 text-amber-400 border border-amber-800 animate-pulse'
                    }`}
                >
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
