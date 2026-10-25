import React, { useState } from 'react';
import { 
  DollarSign, CreditCard, ArrowUpRight, CheckCircle2, Clock, 
  ShieldCheck, Download, Wallet, AlertCircle, Star, Award, 
  FileText, ShieldAlert, ChevronRight, X, Upload, Check, AlertTriangle, Info
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAppState } from '../../contexts/AppStateContext';

interface CaseNotice {
  caseNumber: string;
  jobId: string;
  customerName: string;
  incidentDate: string;
  category: string;
  findingSummary: string;
  evidenceSummary: string;
  lawfulPolicyRef: string;
  amount: number; // -100
  acknowledged: boolean;
  acknowledgedAt?: string;
  appealStatus?: 'None' | 'Pending Review' | 'Upheld' | 'Dismissed';
  appealNotes?: string;
}

export function ContractorEarningsView() {
  const { user } = useAuth();
  const { addAuditLogLocal } = useAppState();

  const [activeLedgerTab, setActiveLedgerTab] = useState<'payouts' | 'rewards' | 'adjustments'>('rewards');
  const [payoutRequested, setPayoutRequested] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<CaseNotice | null>(null);
  const [appealText, setAppealText] = useState('');
  const [appealFileAttached, setAppealFileAttached] = useState(false);
  const [appealSubmitted, setAppealSubmitted] = useState(false);

  // Investigated Complaints & Lawful R100 Adjustments State
  const [caseNotices, setCaseNotices] = useState<CaseNotice[]>([
    {
      caseNumber: 'CMP-2026-0814',
      jobId: 'JOB-7742',
      customerName: 'Kempton Business Park',
      incidentDate: '18 Oct 2026',
      category: 'Incomplete Safety Earthing Verification',
      findingSummary: 'Investigation confirmed technician did not record secondary earth spike resistance test on gate automation enclosure prior to job completion sign-off.',
      evidenceSummary: 'Substantiated by client photographic audit and inspection re-test showing zero earthing tag.',
      lawfulPolicyRef: 'Technician Service Agreement Clause 8.3 & SANS 10142 Safety Standard Compliance.',
      amount: -100,
      acknowledged: true,
      acknowledgedAt: '2026-10-19 09:30',
      appealStatus: 'None',
    },
    {
      caseNumber: 'CMP-2026-0922',
      jobId: 'JOB-8109',
      customerName: 'Highland Ridge Estate',
      incidentDate: '23 Oct 2026',
      category: 'Arrival Notice Communication',
      findingSummary: 'Technician logged on-site status 35 minutes prior to actual physical entry through main estate security boom.',
      evidenceSummary: 'Boom gate ANPR log discrepancy verified with estate security supervisor.',
      lawfulPolicyRef: 'Same Day Assist Dispatch Code of Conduct § 4.1 (Accurate Location Timestamping).',
      amount: -100,
      acknowledged: false,
      appealStatus: 'None',
    },
  ]);

  // Positive Customer 5-Star Rating Rewards (+R100 per qualifying job)
  const ratingRewards = [
    {
      id: 'REW-901',
      jobId: 'JOB-8210',
      client: 'Dr. Vernon Adams (Sandhurst)',
      date: '24 Oct 2026, 16:30',
      rating: 5,
      feedback: 'Outstanding response speed! Sipho arrived within 25 minutes and diagnosed our Centurion gate controller flawlessly.',
      amount: 100,
      status: 'Accrued to Annual Pool',
    },
    {
      id: 'REW-902',
      jobId: 'JOB-8188',
      client: 'Lerato Molefe (Bryanston Estate)',
      date: '22 Oct 2026, 11:15',
      rating: 5,
      feedback: 'Very polite, professional security wiring repair. Left the intercom neat and tested everything twice.',
      amount: 100,
      status: 'Accrued to Annual Pool',
    },
    {
      id: 'REW-903',
      jobId: 'JOB-8145',
      client: 'Michael van Zyl (Fourways)',
      date: '20 Oct 2026, 14:00',
      rating: 5,
      feedback: 'Fast fault finding on perimeter electric fence false triggers. Highly recommended.',
      amount: 100,
      status: 'Accrued to Annual Pool',
    },
    {
      id: 'REW-904',
      jobId: 'JOB-8092',
      client: 'Annelize Botha (Rosebank)',
      date: '17 Oct 2026, 09:45',
      rating: 5,
      feedback: 'Fixed our CCTV infrared night-vision camera issue promptly. 5 stars well deserved.',
      amount: 100,
      status: 'Accrued to Annual Pool',
    },
    {
      id: 'REW-905',
      jobId: 'JOB-8012',
      client: 'Kagiso Khumalo (Midrand)',
      date: '14 Oct 2026, 15:20',
      rating: 5,
      feedback: 'Prompt arrival and high technical expertise on garage door safety sensors.',
      amount: 100,
      status: 'Accrued to Annual Pool',
    },
  ];

  // Standard Operational Dispatch Payout History
  const standardPayouts = [
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
      category: 'Property Assessments',
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

  // Computations
  const totalPositiveRewards = ratingRewards.reduce((sum, r) => sum + r.amount, 0); // R500 in sample
  const totalSubstantiatedDeductions = caseNotices
    .filter(c => c.appealStatus !== 'Upheld')
    .reduce((sum, c) => sum + Math.abs(c.amount), 0); // R200 in sample
  
  // Annual incentive accumulation: base year-to-date starting pool + rewards - deductions
  const baseAnnualPoolAccrued = 3200; // Accrued over previous months
  const netAnnualIncentiveBalance = baseAnnualPoolAccrued + totalPositiveRewards - totalSubstantiatedDeductions;
  
  const availableOperationalBalance: number = 4250;
  const pendingClearance: number = 1200;
  const lifetimeStandardEarned: number = 18450;

  const unacknowledgedCount = caseNotices.filter(c => !c.acknowledged).length;

  const handleRequestPayout = () => {
    setPayoutRequested(true);
    addAuditLogLocal('Payout Requested', `Contractor ${user?.name || 'Technician'} submitted payout request for R${availableOperationalBalance.toFixed(2)}.`);
    setTimeout(() => {
      alert(`Standard Payout request of R${availableOperationalBalance.toLocaleString('en-ZA', { minimumFractionDigits: 2 })} submitted successfully to FNB Account •••• 6892. Processing turnaround: 2 hours.`);
    }, 300);
  };

  const handleConfirmNoticeReceipt = (caseNumber: string) => {
    setCaseNotices(prev => prev.map(c => {
      if (c.caseNumber === caseNumber) {
        return {
          ...c,
          acknowledged: true,
          acknowledgedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        };
      }
      return c;
    }));
    addAuditLogLocal('Case Notice Acknowledged', `Technician ${user?.name || 'Technician'} confirmed receipt of Case Finding ${caseNumber}. Appeal rights preserved.`);
    if (selectedNotice?.caseNumber === caseNumber) {
      setSelectedNotice(prev => prev ? { ...prev, acknowledged: true } : null);
    }
  };

  const handleSubmitAppeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNotice || !appealText.trim()) return;

    setCaseNotices(prev => prev.map(c => {
      if (c.caseNumber === selectedNotice.caseNumber) {
        return {
          ...c,
          acknowledged: true,
          appealStatus: 'Pending Review',
          appealNotes: appealText,
        };
      }
      return c;
    }));

    addAuditLogLocal('Case Finding Appealed', `Technician lodged appeal for Case ${selectedNotice.caseNumber}. Notes: "${appealText.slice(0, 80)}...". Evidence attached: ${appealFileAttached ? 'Yes' : 'No'}.`);
    setAppealSubmitted(true);
    setTimeout(() => {
      setAppealSubmitted(false);
      setSelectedNotice(null);
      setAppealText('');
      setAppealFileAttached(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col gap-6 text-zinc-100 animate-fadeIn">
      {/* UNACKNOWLEDGED CASE NOTICE ALERT BANNER (Non-blocking but mandatory notice receipt) */}
      {unacknowledgedCount > 0 && (
        <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg animate-pulse">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-amber-300 font-brand-header block">
                Pending Case Finding Notice Acknowledgment ({unacknowledgedCount})
              </span>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                A substantiated investigation notice requires your formal receipt confirmation. You have the full right to appeal with evidence without visiting the office.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const pending = caseNotices.find(c => !c.acknowledged);
              if (pending) setSelectedNotice(pending);
              setActiveLedgerTab('adjustments');
            }}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all whitespace-nowrap shrink-0 uppercase tracking-wider"
          >
            Review Case Notice
          </button>
        </div>
      )}

      {/* HEADER SECTION (Item 14: Expanded "Team Earnings & Rewards") */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-red-500 uppercase">
            Platform Review Section D • Financial Ledger
          </span>
          <h2 className="text-xl font-black italic tracking-wide uppercase text-white font-brand-header">
            Team Earnings & Rewards
          </h2>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            Registered Provider: {user?.name || 'Sipho Ndlovu (Apex CCTV & Security)'} • Provider ID: {user?.id || 'PROV-4401'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRequestPayout}
            disabled={payoutRequested || availableOperationalBalance === 0}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-2xl font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center gap-2 uppercase tracking-wider font-mono"
          >
            <Wallet className="w-4 h-4" />
            <span>{payoutRequested ? 'Payout Submitted ✓' : `Withdraw R${availableOperationalBalance.toFixed(2)}`}</span>
          </button>
        </div>
      </div>

      {/* 5-METRIC SEPARATED LEDGER SUMMARY GRID (Items 14, 15, 16, 17) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. RUNNING OPERATIONAL BALANCE */}
        <div className="bg-zinc-900 border border-emerald-500/30 rounded-3xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-emerald-400">Available Operational Balance</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono mt-2">
            R{availableOperationalBalance.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] font-mono text-zinc-400 mt-1">
            Standard callouts + emergency bonuses
          </p>
        </div>

        {/* 2. ANNUAL INCENTIVE ACCUMULATION POOL (Item 15) */}
        <div className="bg-gradient-to-br from-zinc-900 to-indigo-950/60 border border-indigo-500/40 rounded-3xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/15 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-indigo-300">Annual Retention Incentive Pool</span>
            <Award className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-200 font-mono mt-2">
            R{netAnnualIncentiveBalance.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[10px] font-mono text-indigo-300/80">
            <span>Year-End Retention Policy</span>
            <span className="bg-indigo-900/60 px-1.5 py-0.2 rounded text-[9px]">Accruing</span>
          </div>
        </div>

        {/* 3. 5-STAR RATING INCENTIVE CREDITS (Item 16) */}
        <div className="bg-zinc-900 border border-amber-500/30 rounded-3xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-amber-400">Customer 5★ Rating Rewards</span>
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono mt-2">
            +R{totalPositiveRewards.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] font-mono text-zinc-400 mt-1">
            +R100 per 5★ rating ({ratingRewards.length} jobs credited)
          </p>
        </div>

        {/* 4. INVESTIGATED ADJUSTMENTS (Item 17) */}
        <div className="bg-zinc-900 border border-red-500/30 rounded-3xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-red-400">Authorised Case Deductions</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-300 font-mono mt-2">
            -R{totalSubstantiatedDeductions.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] font-mono text-zinc-400 mt-1">
            -R100 per investigated finding ({caseNotices.length} cases)
          </p>
        </div>
      </div>

      {/* ANNUAL INCENTIVE ACCUMULATION EXPLANATION BANNER (Item 15 & 16) */}
      <div className="bg-gradient-to-r from-[#091C3E] via-[#0b224c] to-[#091C3E] border border-cyan-500/30 rounded-3xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950 border border-cyan-800 px-2 py-0.5 rounded">
              Annual Incentive Accumulation & Retention Policy (Item 15 & 16)
            </span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed max-w-3xl">
            Incentives accrue continuously throughout the year (+R100 per qualifying 5-star customer rated job) and become available for year-end withdrawal under our agreed retention and company equipment return policy.
          </p>
          <p className="text-[11px] text-cyan-200/80 font-mono">
            <strong>Projection Illustration:</strong> 30 qualifying jobs/month = R3,000/month → <strong>R36,000 accrued</strong> over 12 months.
          </p>
        </div>
        <div className="bg-[#050E20] border border-[#142D59] p-3 rounded-2xl text-center shrink-0">
          <span className="text-[9px] font-mono text-slate-400 uppercase block">Projected Year-End Pool</span>
          <span className="text-lg font-black text-cyan-400 font-mono">R36,000.00</span>
          <span className="text-[9px] text-emerald-400 block font-mono">Based on 30 jobs/mo</span>
        </div>
      </div>

      {/* LEDGER NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveLedgerTab('rewards')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-2 ${
            activeLedgerTab === 'rewards'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
          }`}
        >
          <Star className="w-3.5 h-3.5 fill-current" />
          <span>Customer 5★ Rewards (+R100)</span>
          <span className="bg-slate-900 text-white px-2 py-0.5 rounded-full text-[10px]">
            {ratingRewards.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveLedgerTab('adjustments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-2 ${
            activeLedgerTab === 'adjustments'
              ? 'bg-red-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Case Findings & Deductions (-R100)</span>
          {unacknowledgedCount > 0 ? (
            <span className="bg-amber-400 text-slate-950 font-bold px-2 py-0.5 rounded-full text-[10px] animate-pulse">
              {unacknowledgedCount} Action
            </span>
          ) : (
            <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full text-[10px]">
              {caseNotices.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveLedgerTab('payouts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-2 ${
            activeLedgerTab === 'payouts'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Operational Callouts & Bank Payouts</span>
        </button>
      </div>

      {/* VIEW 1: CUSTOMER 5★ REWARDS LEDGER (Item 16) */}
      {activeLedgerTab === 'rewards' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white font-brand-header">
                Positive Customer Rating Reward Ledger (+R100 per Qualifying Job)
              </h3>
              <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                Automatically credited upon independent 5-star customer feedback in customer app. Maximum 1 reward per completed job.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-800 px-3 py-1 rounded-xl">
              Accrued Rewards: +R{totalPositiveRewards.toFixed(2)}
            </span>
          </div>

          <div className="divide-y divide-zinc-800/80">
            {ratingRewards.map((rew) => (
              <div key={rew.id} className="p-5 hover:bg-zinc-950/50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl shrink-0 mt-0.5">
                    <Star className="w-4 h-4 fill-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white font-mono">{rew.id}</span>
                      <span className="text-[9px] font-mono bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">
                        {rew.jobId}
                      </span>
                      <div className="flex items-center text-amber-400 text-xs">
                        {'★'.repeat(rew.rating)}
                      </div>
                    </div>
                    <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                      Client: {rew.client} • {rew.date}
                    </div>
                    <p className="text-xs text-zinc-300 italic mt-2 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/70 max-w-xl">
                      "{rew.feedback}"
                    </p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-1 border-t sm:border-t-0 border-zinc-800 pt-2 sm:pt-0 shrink-0">
                  <div className="text-base font-black text-amber-400 font-mono">
                    +R{rew.amount.toFixed(2)}
                  </div>
                  <span className="text-[9.5px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                    {rew.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 2: CASE FINDINGS, INVESTIGATED COMPLAINTS & APPEALS (Item 17) */}
      {activeLedgerTab === 'adjustments' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl space-y-0">
          <div className="px-6 py-4 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white font-brand-header">
                Investigated Complaints & Lawful R100 Adjustments
              </h3>
              <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                Every deduction requires complaints department investigation, formal notice, and an accessible appeal route.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-red-400 bg-red-950/60 border border-red-800 px-3 py-1 rounded-xl">
              Substantiated Adjustments: -R{totalSubstantiatedDeductions.toFixed(2)}
            </span>
          </div>

          <div className="divide-y divide-zinc-800/80">
            {caseNotices.map((c) => (
              <div key={c.caseNumber} className="p-5 hover:bg-zinc-950/50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-2xl shrink-0 mt-0.5 border ${
                    !c.acknowledged 
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse' 
                      : 'bg-red-500/10 text-red-400 border-red-500/30'
                  }`}>
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white font-mono">{c.caseNumber}</span>
                      <span className="text-[9px] font-mono bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">
                        {c.jobId}
                      </span>
                      <span className="text-[10px] font-bold text-slate-300">
                        {c.category}
                      </span>
                      {!c.acknowledged ? (
                        <span className="text-[9px] font-mono bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded-full">
                          Action Required: Confirm Receipt
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full">
                          Receipt Confirmed ({c.acknowledgedAt})
                        </span>
                      )}
                      {c.appealStatus === 'Pending Review' && (
                        <span className="text-[9px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded-full">
                          Appeal Pending Review
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] font-mono text-zinc-400 mt-1">
                      Client: {c.customerName} • Incident Date: {c.incidentDate}
                    </div>

                    <p className="text-xs text-zinc-300 mt-2 leading-relaxed max-w-2xl">
                      <strong>Finding:</strong> {c.findingSummary}
                    </p>

                    <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-500 mt-2">
                      <span>Policy: {c.lawfulPolicyRef}</span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 border-t sm:border-t-0 border-zinc-800 pt-2 sm:pt-0 shrink-0">
                  <div className="text-base font-black text-red-400 font-mono">
                    {c.amount < 0 ? `-R${Math.abs(c.amount).toFixed(2)}` : `R${c.amount.toFixed(2)}`}
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setSelectedNotice(c)}
                    className="px-3.5 py-1.5 bg-[#091C3E] hover:bg-[#142D59] border border-cyan-500/40 text-cyan-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Notice & Appeal</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: OPERATIONAL CALLOUTS & BANK PAYOUTS */}
      {activeLedgerTab === 'payouts' && (
        <div className="space-y-4">
          {/* BANK DETAILS */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <span className="text-zinc-400 font-bold block">Verified Payout Bank Account</span>
                <span className="text-white font-medium">First National Bank (FNB) — •••• 6892 (Apex Security)</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-3 py-1.5 rounded-xl font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>FICA & Banking Verified</span>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-white font-brand-header">
                Completed Job Earnings & Callout Breakdown
              </h3>
              <span className="text-[10px] font-mono text-zinc-400">Showing last 4 transactions</span>
            </div>

            <div className="divide-y divide-zinc-800/80">
              {standardPayouts.map((item) => (
                <div key={item.id} className="p-5 hover:bg-zinc-950/50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-2xl text-emerald-400 mt-0.5">
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
      )}

      {/* FORMAL CASE-FINDING PDF NOTICE & APPEAL MODAL (Item 17) */}
      {selectedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#050E20] border-2 border-red-500/40 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* NOTICE HEADER */}
            <div className="bg-[#091C3E] px-6 py-4 border-b border-[#142D59] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/40 text-red-400 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase font-brand-header tracking-wide">
                    Formal Investigation Finding Notice
                  </h3>
                  <p className="text-[10px] font-mono text-slate-400">
                    Case No: {selectedNotice.caseNumber} • Complaints & Compliance Division
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNotice(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* FORMAL NOTICE BODY */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              {/* Formal Letterhead Box */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 font-mono">
                <div className="flex justify-between items-start border-b border-slate-800 pb-2">
                  <div>
                    <span className="text-[10px] text-red-400 uppercase font-bold block">SAME DAY ASSIST (PTY) LTD</span>
                    <span className="text-[9px] text-slate-400">Operations Oversight & Complaints Board</span>
                  </div>
                  <span className="text-[10px] text-slate-300 font-bold">
                    DATE: {selectedNotice.incidentDate}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div><span className="text-slate-500">TECHNICIAN:</span> <span className="text-white font-bold">{user?.name || 'Sipho Ndlovu'}</span></div>
                  <div><span className="text-slate-500">RELATED JOB:</span> <span className="text-white font-bold">{selectedNotice.jobId}</span></div>
                  <div><span className="text-slate-500">CLIENT:</span> <span className="text-white font-bold">{selectedNotice.customerName}</span></div>
                  <div><span className="text-slate-500">ADJUSTMENT:</span> <span className="text-red-400 font-bold">-R100.00 (Incentive Pool)</span></div>
                </div>

                <div className="border-t border-slate-800 pt-2 space-y-1.5 text-[11px] leading-relaxed">
                  <span className="text-slate-400 block font-bold uppercase text-[10px]">Substantiated Finding Summary:</span>
                  <p className="text-slate-200">{selectedNotice.findingSummary}</p>
                </div>

                <div className="space-y-1 text-[11px] leading-relaxed">
                  <span className="text-slate-400 block font-bold uppercase text-[10px]">Evidence Summary:</span>
                  <p className="text-slate-300">{selectedNotice.evidenceSummary}</p>
                </div>

                <div className="space-y-1 text-[10px] text-slate-400">
                  <span className="font-bold block">Lawful & Policy Authority:</span>
                  <p>{selectedNotice.lawfulPolicyRef}</p>
                </div>
              </div>

              {/* LAWFUL SAFEGUARD NOTICE */}
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-3.5 flex items-start gap-2.5 text-[11px] text-cyan-200">
                <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Notice of Rights:</strong> Confirming receipt acknowledges delivery of this notice as required by platform procedures. It does <em>not</em> constitute agreement with the adverse finding or waiver of your appeal rights. You may lodge an appeal below with supporting documents without visiting the office.
                </p>
              </div>

              {/* 2 ACTIONS: CONFIRM RECEIPT & APPEAL (Item 17) */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row gap-3">
                  {!selectedNotice.acknowledged ? (
                    <button
                      type="button"
                      onClick={() => handleConfirmNoticeReceipt(selectedNotice.caseNumber)}
                      className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer font-mono"
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirm Receipt of Notice</span>
                    </button>
                  ) : (
                    <div className="flex-1 py-3 px-4 bg-emerald-950/60 border border-emerald-800 text-emerald-400 font-bold rounded-xl text-center font-mono">
                      ✓ Receipt Confirmed
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      // Trigger download of formal PDF notice
                      alert(`Downloading formal case finding notice PDF for ${selectedNotice.caseNumber}...`);
                    }}
                    className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer font-mono"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Formal PDF</span>
                  </button>
                </div>

                {/* APPEAL ACCORDION / FORM */}
                <div className="border border-slate-800 rounded-2xl p-4 bg-slate-900/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white uppercase tracking-wider text-xs">
                      Submit Appeal with Supporting Evidence
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400">Direct Remote Review</span>
                  </div>

                  {appealSubmitted ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center text-emerald-300 font-mono">
                      ✓ Appeal submitted successfully. Complaints Officer will review evidence within 48 hours.
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitAppeal} className="space-y-3">
                      <div>
                        <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                          Technician Appeal Statement & Defense *
                        </label>
                        <textarea
                          rows={3}
                          value={appealText}
                          onChange={e => setAppealText(e.target.value)}
                          required
                          placeholder="Provide details of your explanation, site condition facts, or reasons why this adjustment is contested..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-red"
                        />
                      </div>

                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setAppealFileAttached(!appealFileAttached)}
                          className={`py-2 px-3 rounded-xl border text-xs font-mono flex items-center gap-1.5 cursor-pointer ${
                            appealFileAttached
                              ? 'bg-cyan-950 border-cyan-700 text-cyan-300'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{appealFileAttached ? 'JobCard_PhotoEvidence.jpg (Attached)' : 'Attach Photo / Document Evidence'}</span>
                        </button>

                        <button
                          type="submit"
                          className="py-2.5 px-5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-md uppercase tracking-wider font-mono cursor-pointer transition-all"
                        >
                          Lodge Appeal
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
