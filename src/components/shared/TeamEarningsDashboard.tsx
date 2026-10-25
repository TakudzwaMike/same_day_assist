import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Wallet, Star, ShieldAlert, Award, FileText, 
  Calendar, CheckCircle2, Clock, AlertTriangle, ChevronRight, 
  X, Upload, Send, ArrowDownRight, ArrowUpRight, Check, Info, RefreshCw,
  Building, Phone, HelpCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAppState } from '../../contexts/AppStateContext';
import { useTheme } from '../../contexts/ThemeContext';
import { api } from '../../services/api';

interface TeamEarningsDashboardProps {
  variant?: 'contractor' | 'dispatcher';
}

export function TeamEarningsDashboard({ variant }: TeamEarningsDashboardProps) {
  const { user } = useAuth();
  const { addAuditLogLocal } = useAppState();
  const { isDark } = useTheme();

  const isDispatcher = variant === 'dispatcher' || user?.role === 'Dispatcher';

  const [activeTab, setActiveTab] = useState<'earnings' | 'bonuses' | 'penalties' | 'statement' | 'payouts'>('earnings');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [financialData, setFinancialData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Monthly Statement State
  const [selectedMonth, setSelectedMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const [monthlyStatement, setMonthlyStatement] = useState<any | null>(null);
  const [statementLoading, setStatementLoading] = useState(false);

  // Penalty / Case Notice Detail & Appeal State
  const [selectedPenalty, setSelectedPenalty] = useState<any | null>(null);
  const [appealNotes, setAppealNotes] = useState('');
  const [appealSubmitting, setAppealSubmitting] = useState(false);
  const [appealSuccessMsg, setAppealSuccessMsg] = useState<string | null>(null);

  // Payout Request State
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState<string | null>(null);

  // Fetch Full Financial Ledger on mount
  const fetchFinancials = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await api.getTeamFinancesLedger();
      if (res.data) {
        setFinancialData(res.data);
        if (res.data.availableMonths && res.data.availableMonths.length > 0) {
          if (!res.data.availableMonths.includes(selectedMonth)) {
            setSelectedMonth(res.data.availableMonths[0]);
          }
        }
      } else if (res.error) {
        setError(res.error);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to Same Day Assist financial ledger');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFinancials();
  }, [user?.id]);

  // Fetch Monthly Statement when selected month changes
  useEffect(() => {
    if (!selectedMonth) return;
    let isCancelled = false;

    const fetchStatement = async () => {
      setStatementLoading(true);
      try {
        const res = await api.getTeamMonthlyStatement(selectedMonth);
        if (!isCancelled && res.data) {
          setMonthlyStatement(res.data);
        }
      } catch (err) {
        console.error('Failed to load monthly statement:', err);
      } finally {
        if (!isCancelled) setStatementLoading(false);
      }
    };

    fetchStatement();
    return () => { isCancelled = true; };
  }, [selectedMonth]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFinancials(true);
  };

  // Penalty Acknowledgment
  const handleAcknowledgePenalty = async (penaltyId: string) => {
    try {
      const res = await api.acknowledgeTeamPenalty(penaltyId);
      if (res.data?.success) {
        addAuditLogLocal('Case Notice Acknowledged', `Acknowledged formal notice for penalty ${penaltyId}`);
        await fetchFinancials(true);
        if (selectedPenalty?.id === penaltyId) {
          setSelectedPenalty((prev: any) => prev ? { ...prev, acknowledged: true } : null);
        }
      } else if (res.error) {
        alert(res.error);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to acknowledge notice');
    }
  };

  // Submit Penalty Appeal
  const handleSubmitAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPenalty || !appealNotes.trim()) return;

    setAppealSubmitting(true);
    setAppealSuccessMsg(null);
    try {
      const res = await api.appealTeamPenalty(selectedPenalty.id, appealNotes.trim());
      if (res.data?.success) {
        setAppealSuccessMsg('Appeal lodged successfully! Case status updated to Under Administrative Review.');
        addAuditLogLocal('Case Finding Appealed', `Technician lodged appeal for case ${selectedPenalty.caseNumber}`);
        await fetchFinancials(true);
        setTimeout(() => {
          setAppealSuccessMsg(null);
          setSelectedPenalty(null);
          setAppealNotes('');
        }, 2200);
      } else if (res.error) {
        alert(res.error);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit appeal');
    } finally {
      setAppealSubmitting(false);
    }
  };

  // Request Payout
  const handleRequestPayout = async () => {
    if (!financialData || financialData.summary.availableBalance <= 0) return;
    setPayoutSubmitting(true);
    setPayoutSuccessMsg(null);

    try {
      const res = await api.requestTeamPayout();
      if (res.data?.success) {
        setPayoutSuccessMsg(res.data.message || 'Payout submitted successfully.');
        addAuditLogLocal('Payout Requested', `Submitted withdrawal request for R${financialData.summary.availableBalance.toFixed(2)}.`);
        await fetchFinancials(true);
        setTimeout(() => setPayoutSuccessMsg(null), 5000);
      } else if (res.error) {
        alert(res.error);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to request payout');
    } finally {
      setPayoutSubmitting(false);
    }
  };

  // Summary Metrics from Server (Confidential & Actual Only)
  const summary = financialData?.summary || {
    totalConfirmedEarnings: 0,
    totalConfirmedBonuses: 0,
    totalPendingBonuses: 0,
    totalConfirmedDeductions: 0,
    totalReversals: 0,
    totalDisputedPenalties: 0,
    totalDisbursedPayouts: 0,
    netLifetimeEarned: 0,
    availableBalance: 0,
    pendingActionPenaltiesCount: 0,
  };

  const annual100k = financialData?.annual100kStatus || {
    isEligible: false,
    isAwarded: false,
    currentCompletedJobs: 0,
    requiredJobs: 500,
    currentSlaRate: 99.4,
    requiredSlaRate: 99.0,
    confirmedPenaltiesCount: 0,
  };

  const earnings = financialData?.earnings || [];
  const bonuses = financialData?.bonuses || [];
  const penalties = financialData?.penalties || [];
  const payouts = financialData?.payouts || [];
  const availableMonths: string[] = financialData?.availableMonths || [new Date().toISOString().slice(0, 7)];

  const unacknowledgedPenalties = penalties.filter((p: any) => !p.acknowledged);

  const cardBgClass = isDark ? 'bg-[#091C3E] border-[#142D59]' : 'bg-white border-slate-200';
  const innerCardBgClass = isDark ? 'bg-[#050E20] border-[#142D59]' : 'bg-slate-50 border-slate-200';

  if (loading) {
    return (
      <div className="w-full min-h-[500px] flex flex-col items-center justify-center gap-3 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-red" />
        <span className="text-xs font-mono tracking-wider uppercase">Loading Confirmed Financial Ledger...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fadeIn pb-12">
      {/* 1. TOP HEADER & SETTLEMENT ACTION */}
      <div className={`p-6 rounded-3xl border shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${cardBgClass}`}>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold tracking-widest text-red uppercase bg-red/10 border border-red/20 px-2 py-0.5 rounded-full">
              CONFIDENTIAL • ACTUAL EARNED ONLY
            </span>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" /> SECURE LEDGER
            </span>
          </div>

          <h2 className="text-xl font-black italic tracking-wide uppercase font-brand-header text-navy dark:text-white mt-1">
            {isDispatcher ? 'Dispatcher Operations & Shift Earnings' : 'Technical Responder Earnings & Rewards'}
          </h2>

          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Team Member: <strong className="text-slate-200">{user?.name}</strong> • Role: <strong className="text-slate-200">{user?.role}</strong> • Employee/Provider ID: <strong className="text-slate-200">{user?.id ? user.id.slice(0, 8).toUpperCase() : 'SDA-EMP'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className={`p-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
            }`}
            title="Refresh Ledger from Database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-red' : ''}`} />
            <span className="hidden sm:inline font-mono">Sync</span>
          </button>

          <button
            type="button"
            onClick={handleRequestPayout}
            disabled={payoutSubmitting || summary.availableBalance <= 0}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-2xl font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center gap-2 uppercase tracking-wider font-mono"
          >
            <Wallet className="w-4 h-4" />
            <span>
              {payoutSubmitting ? 'Processing EFT...' : `Withdraw R${summary.availableBalance.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`}
            </span>
          </button>
        </div>
      </div>

      {/* SUCCESS MESSAGE BANNER */}
      {payoutSuccessMsg && (
        <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 p-4 rounded-2xl flex items-center gap-3 animate-fadeIn shadow-lg">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <p className="text-xs font-mono font-bold leading-relaxed">{payoutSuccessMsg}</p>
        </div>
      )}

      {/* ERROR MESSAGE BANNER */}
      {error && (
        <div className="bg-red/15 border border-red/40 text-red p-4 rounded-2xl flex items-center gap-3 animate-fadeIn shadow-lg">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p className="text-xs font-mono font-bold">{error}</p>
        </div>
      )}

      {/* UNACKNOWLEDGED CASE NOTICE ALERT BANNER */}
      {unacknowledgedPenalties.length > 0 && (
        <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg animate-pulse">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-amber-300 font-brand-header block">
                Pending Case Finding Acknowledgment ({unacknowledgedPenalties.length})
              </span>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                An investigated performance or compliance finding requires your formal receipt confirmation. You preserve full electronic appeal rights upon review.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedPenalty(unacknowledgedPenalties[0]);
              setActiveTab('penalties');
            }}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all whitespace-nowrap shrink-0 uppercase tracking-wider font-mono"
          >
            Review Case Notice
          </button>
        </div>
      )}

      {/* 2. 4-METRIC CONFIRMED SUMMARY CARDS (NO FORECASTS OR PROJECTED METRICS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Available Balance */}
        <div className={`p-5 rounded-3xl border shadow-lg relative overflow-hidden transition-all ${cardBgClass}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-emerald-400">
              Available For Withdrawal
            </span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono mt-2">
            R{summary.availableBalance.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] font-mono text-slate-400 mt-1">
            Settled earnings less previous payouts
          </p>
        </div>

        {/* Metric 2: Net Lifetime Confirmed Earned */}
        <div className={`p-5 rounded-3xl border shadow-lg relative overflow-hidden transition-all ${cardBgClass}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-blue-400">
              Net Confirmed Earned
            </span>
            <DollarSign className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono mt-2">
            R{summary.netLifetimeEarned.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] font-mono text-slate-400 mt-1">
            Actual confirmed work + bonuses - deductions
          </p>
        </div>

        {/* Metric 3: Approved Performance Bonuses */}
        <div className={`p-5 rounded-3xl border shadow-lg relative overflow-hidden transition-all ${cardBgClass}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-amber-400">
              Approved Performance Bonuses
            </span>
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono mt-2">
            +R{summary.totalConfirmedBonuses.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] font-mono text-slate-400 mt-1">
            Fast-response SLA + 5★ ratings ({bonuses.filter((b: any) => b.isConfirmed).length} awarded)
          </p>
        </div>

        {/* Metric 4: Confirmed Deductions */}
        <div className={`p-5 rounded-3xl border shadow-lg relative overflow-hidden transition-all ${cardBgClass}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-red">
              Confirmed Deductions
            </span>
            <ShieldAlert className="w-4 h-4 text-red" />
          </div>
          <div className="text-2xl font-black text-red font-mono mt-2">
            -R{summary.totalConfirmedDeductions.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] font-mono text-slate-400 mt-1">
            Substantiated cases ({penalties.filter((p: any) => p.status === 'CONFIRMED').length} active)
          </p>
        </div>
      </div>

      {/* 3. R100,000 ANNUAL EXCELLENCE & RETENTION BONUS STATUS CARD */}
      {/* Strict Rule: NEVER show as earned when conditions have not been met. Only show verified progress against requirements. */}
      <div className={`p-6 rounded-3xl border shadow-lg relative overflow-hidden ${
        annual100k.isAwarded 
          ? 'bg-gradient-to-r from-emerald-950/60 to-[#091C3E] border-emerald-500/40' 
          : 'bg-gradient-to-r from-[#091C3E] via-[#0b224c] to-[#091C3E] border-cyan-500/30'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300 bg-cyan-950 border border-cyan-700 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-cyan-400" />
                R100,000 Annual Excellence & Retention Reward Policy
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                annual100k.isAwarded
                  ? 'bg-emerald-900 text-emerald-300 border border-emerald-500'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}>
                {annual100k.isAwarded ? 'AWARDED & CONFIRMED ✓' : 'IN PROGRESS • CRITERIA TRACKING'}
              </span>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed">
              The R100,000 Annual Excellence Reward is officially awarded only upon meeting verified annual operational standards:
              <strong> 500 completed dispatches</strong>, maintaining a <strong>99.0%+ SLA on-time rate</strong>, and having <strong>zero confirmed disciplinary penalties</strong> during the operational cycle.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
              <div className={`p-2.5 rounded-xl border ${innerCardBgClass}`}>
                <span className="text-[9px] font-mono text-slate-400 block uppercase">1. Completed Dispatches</span>
                <span className="text-sm font-black font-mono text-white">
                  {annual100k.currentCompletedJobs} / {annual100k.requiredJobs}
                </span>
                <span className="text-[9px] font-mono text-slate-400 block">
                  {annual100k.currentCompletedJobs >= annual100k.requiredJobs ? '✓ Target Met' : `${annual100k.requiredJobs - annual100k.currentCompletedJobs} remaining`}
                </span>
              </div>

              <div className={`p-2.5 rounded-xl border ${innerCardBgClass}`}>
                <span className="text-[9px] font-mono text-slate-400 block uppercase">2. On-Time SLA Rate</span>
                <span className="text-sm font-black font-mono text-emerald-400">
                  {annual100k.currentSlaRate}%
                </span>
                <span className="text-[9px] font-mono text-slate-400 block">
                  {annual100k.currentSlaRate >= annual100k.requiredSlaRate ? '✓ Compliant (>99%)' : 'Below standard'}
                </span>
              </div>

              <div className={`p-2.5 rounded-xl border ${innerCardBgClass}`}>
                <span className="text-[9px] font-mono text-slate-400 block uppercase">3. Disciplinary Deductions</span>
                <span className={`text-sm font-black font-mono ${annual100k.confirmedPenaltiesCount === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {annual100k.confirmedPenaltiesCount} Recorded
                </span>
                <span className="text-[9px] font-mono text-slate-400 block">
                  {annual100k.confirmedPenaltiesCount === 0 ? '✓ Zero Complaints' : 'Review needed'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[#050E20] border border-[#142D59] p-4 rounded-2xl text-center shrink-0 w-full md:w-56">
            <span className="text-[9px] font-mono text-slate-400 uppercase block">Annual Bonus Amount</span>
            <span className="text-xl font-black text-cyan-400 font-mono">R100,000.00</span>
            <span className={`text-[9px] font-mono block mt-1 font-bold ${annual100k.isAwarded ? 'text-emerald-400' : 'text-slate-400'}`}>
              {annual100k.isAwarded ? 'Award Confirmed to Account' : 'Conditions In Progress'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. 5 REQUIRED DASHBOARD TABS */}
      <div className="flex items-center gap-2 border-b border-slate-700/60 pb-2 overflow-x-auto select-none">
        <button
          type="button"
          onClick={() => setActiveTab('earnings')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'earnings'
              ? 'bg-red text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>My Confirmed Earnings</span>
          <span className="bg-slate-900 text-white px-2 py-0.5 rounded-full text-[10px]">
            {earnings.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bonuses')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'bonuses'
              ? 'bg-red text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Star className="w-3.5 h-3.5 fill-current" />
          <span>Performance Bonuses</span>
          <span className="bg-slate-900 text-white px-2 py-0.5 rounded-full text-[10px]">
            {bonuses.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('penalties')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'penalties'
              ? 'bg-red text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Penalties & Case Findings</span>
          {unacknowledgedPenalties.length > 0 ? (
            <span className="bg-amber-400 text-slate-950 font-bold px-2 py-0.5 rounded-full text-[10px] animate-pulse">
              {unacknowledgedPenalties.length} Notice
            </span>
          ) : (
            <span className="bg-slate-900 text-white px-2 py-0.5 rounded-full text-[10px]">
              {penalties.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('statement')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'statement'
              ? 'bg-red text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Monthly Statement</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('payouts')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'payouts'
              ? 'bg-red text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>Disbursed Payouts</span>
          <span className="bg-slate-900 text-white px-2 py-0.5 rounded-full text-[10px]">
            {payouts.length}
          </span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* VIEW 1: MY CONFIRMED EARNINGS (ACTUAL WORK COMPLETED) */}
      {/* ============================================================== */}
      {activeTab === 'earnings' && (
        <div className={`rounded-3xl border shadow-xl overflow-hidden ${cardBgClass}`}>
          <div className="px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white font-brand-header">
                Confirmed Qualifying Work Records
              </h3>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                Earnings are recorded upon signed job card verification, shift sign-off, or supervisor property assessment approval.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-3 py-1 rounded-xl">
              Confirmed Total: R{summary.totalConfirmedEarnings.toFixed(2)}
            </span>
          </div>

          <div className="divide-y divide-slate-800/80">
            {earnings.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-mono">
                No confirmed earnings records found for this account.
              </div>
            ) : (
              earnings.map((earn: any) => (
                <div key={earn.id} className="p-5 hover:bg-white/5 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-2xl shrink-0 mt-0.5">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-mono">{earn.title}</span>
                        <span className="text-[9px] font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                          {earn.reference}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        {earn.description}
                      </p>
                      <div className="text-[10px] font-mono text-slate-400 mt-1">
                        Recorded: {new Date(earn.date).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })} • Status: <span className="text-emerald-400 font-bold">{earn.status}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-1 border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0 shrink-0">
                    <div className="text-base font-black text-emerald-400 font-mono">
                      +R{earn.amount.toFixed(2)}
                    </div>
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {earn.status === 'PAID' ? 'PAID OUT' : 'CONFIRMED EARNED'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 2: PERFORMANCE BONUSES & FAST-RESPONSE SLA REWARDS */}
      {/* ============================================================== */}
      {activeTab === 'bonuses' && (
        <div className={`rounded-3xl border shadow-xl overflow-hidden ${cardBgClass}`}>
          <div className="px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white font-brand-header">
                Awarded Performance & Fast-Response Rewards
              </h3>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                Automatically credited when qualifying SLA speeds (&lt;15m) or verified 5-star customer ratings are confirmed.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-800 px-3 py-1 rounded-xl">
              Approved Bonuses: +R{summary.totalConfirmedBonuses.toFixed(2)}
            </span>
          </div>

          <div className="divide-y divide-slate-800/80">
            {bonuses.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-mono">
                No performance bonuses recorded yet.
              </div>
            ) : (
              bonuses.map((bonus: any) => (
                <div key={bonus.id} className="p-5 hover:bg-white/5 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl shrink-0 mt-0.5">
                      <Star className="w-4 h-4 fill-amber-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-mono">{bonus.name}</span>
                        <span className="text-[9px] font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                          {bonus.bonusType}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 italic">
                        "{bonus.reason}"
                      </p>
                      {bonus.criteriaMet && (
                        <div className="text-[10px] font-mono text-amber-300/80 mt-1">
                          Criteria Verified: {bonus.criteriaMet}
                        </div>
                      )}
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        Awarded: {new Date(bonus.dateAwarded).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-1 border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0 shrink-0">
                    <div className="text-base font-black text-amber-400 font-mono">
                      +R{bonus.amount.toFixed(2)}
                    </div>
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      bonus.status === 'APPROVED' || bonus.status === 'PAID'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {bonus.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 3: PENALTIES & CASE FINDINGS */}
      {/* ============================================================== */}
      {activeTab === 'penalties' && (
        <div className={`rounded-3xl border shadow-xl overflow-hidden ${cardBgClass}`}>
          <div className="px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white font-brand-header">
                Investigated Case Findings & Legal Deductions
              </h3>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                Every deduction is substantiated by specific incident records and regulatory clauses. You preserve the legal right to electronic appeal.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-red bg-red/10 border border-red/30 px-3 py-1 rounded-xl">
              Confirmed Deductions: -R{summary.totalConfirmedDeductions.toFixed(2)}
            </span>
          </div>

          <div className="divide-y divide-slate-800/80">
            {penalties.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-mono">
                No penalty cases or deductions recorded on your account. Excellent compliance!
              </div>
            ) : (
              penalties.map((pen: any) => (
                <div key={pen.id} className="p-5 hover:bg-white/5 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-red/10 border border-red/30 text-red rounded-2xl shrink-0 mt-0.5">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-mono">{pen.reason}</span>
                        <span className="text-[9px] font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                          Case #{pen.caseNumber}
                        </span>
                        {!pen.acknowledged && (
                          <span className="bg-amber-400 text-slate-950 text-[9px] font-bold px-2 py-0.5 rounded-full font-mono">
                            UNCONFIRMED RECEIPT
                          </span>
                        )}
                        {pen.status === 'DISPUTED' && (
                          <span className="bg-blue-900 text-blue-200 text-[9px] font-bold px-2 py-0.5 rounded-full font-mono border border-blue-700">
                            APPEAL UNDER REVIEW
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {pen.explanation}
                      </p>

                      <div className="text-[10px] font-mono text-slate-400 mt-1">
                        Policy Rule: <strong className="text-slate-300">{pen.ruleOrIncident}</strong>
                      </div>

                      <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                        Applied: {new Date(pen.dateApplied).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })} • Balance Effect: R{pen.originalAmount.toFixed(2)} → R{pen.resultingBalance.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0 shrink-0">
                    <div className="text-base font-black text-red font-mono">
                      -R{pen.amount.toFixed(2)}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!pen.acknowledged && (
                        <button
                          type="button"
                          onClick={() => handleAcknowledgePenalty(pen.id)}
                          className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] rounded-lg font-mono cursor-pointer"
                        >
                          Confirm Receipt
                        </button>
                      )}

                      {pen.status !== 'DISPUTED' && pen.status !== 'REVERSED' && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPenalty(pen);
                            setAppealNotes('');
                          }}
                          className="px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-[10px] rounded-lg font-mono cursor-pointer"
                        >
                          Lodge Appeal
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* APPEAL MODAL */}
      {selectedPenalty && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className={`w-full max-w-xl p-6 rounded-3xl border shadow-2xl ${cardBgClass} space-y-4`}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-red uppercase">Official Formal Appeal</span>
                <h3 className="text-sm font-black uppercase text-white font-brand-header">
                  Case #{selectedPenalty.caseNumber}: {selectedPenalty.reason}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPenalty(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className={`p-3.5 rounded-2xl border ${innerCardBgClass} space-y-1`}>
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Investigation Finding Summary</span>
              <p className="text-xs text-slate-300 leading-relaxed">{selectedPenalty.explanation}</p>
              <div className="text-[10px] font-mono text-slate-400 pt-1">
                Deduction Amount: <strong className="text-red font-mono">-R{selectedPenalty.amount.toFixed(2)}</strong>
              </div>
            </div>

            <form onSubmit={handleSubmitAppeal} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 font-mono mb-1">
                  Appeal Explanation & Exculpatory Evidence
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detail why this deduction is incorrect. Reference job timestamps, client verification calls, or attach photos..."
                  value={appealNotes}
                  onChange={(e) => setAppealNotes(e.target.value)}
                  className={`w-full p-3 rounded-2xl border text-xs text-white focus:outline-none focus:border-red ${innerCardBgClass}`}
                />
              </div>

              {appealSuccessMsg && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500 text-emerald-300 text-xs rounded-xl font-mono">
                  {appealSuccessMsg}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedPenalty(null)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-mono font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={appealSubmitting || !appealNotes.trim()}
                  className="px-5 py-2 bg-red hover:bg-red/80 disabled:opacity-50 text-white rounded-xl text-xs font-mono font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{appealSubmitting ? 'Submitting...' : 'Submit Appeal to Management'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 4: MONTHLY STATEMENT */}
      {/* ============================================================== */}
      {activeTab === 'statement' && (
        <div className={`rounded-3xl border shadow-xl p-6 space-y-6 ${cardBgClass}`}>
          {/* Month Selector Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white font-brand-header">
                Monthly Earnings Statement & Audit Breakdown
              </h3>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                Itemized financial record of all qualifying earnings, awarded bonuses, confirmed deductions, and paid disbursements.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">Statement Period:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className={`px-3 py-2 rounded-xl border text-xs font-mono font-bold text-white focus:outline-none focus:border-red cursor-pointer ${innerCardBgClass}`}
              >
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {new Date(`${m}-01`).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })} ({m})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {statementLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs font-mono flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-red" />
              <span>Compiling Monthly Statement...</span>
            </div>
          ) : monthlyStatement ? (
            <div className="space-y-6">
              {/* Monthly Summary Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className={`p-4 rounded-2xl border ${innerCardBgClass}`}>
                  <span className="text-[9px] font-mono uppercase text-slate-400 block">Confirmed Work</span>
                  <span className="text-lg font-black font-mono text-emerald-400">
                    +R{monthlyStatement.confirmedEarnings.toFixed(2)}
                  </span>
                  <span className="text-[9px] font-mono text-slate-500 block">{monthlyStatement.earningsCount} items</span>
                </div>

                <div className={`p-4 rounded-2xl border ${innerCardBgClass}`}>
                  <span className="text-[9px] font-mono uppercase text-slate-400 block">Bonuses Awarded</span>
                  <span className="text-lg font-black font-mono text-amber-400">
                    +R{monthlyStatement.confirmedBonuses.toFixed(2)}
                  </span>
                  <span className="text-[9px] font-mono text-slate-500 block">{monthlyStatement.bonusesCount} rewards</span>
                </div>

                <div className={`p-4 rounded-2xl border ${innerCardBgClass}`}>
                  <span className="text-[9px] font-mono uppercase text-slate-400 block">Confirmed Deductions</span>
                  <span className="text-lg font-black font-mono text-red">
                    -R{monthlyStatement.confirmedPenalties.toFixed(2)}
                  </span>
                  <span className="text-[9px] font-mono text-slate-500 block">{monthlyStatement.penaltiesCount} cases</span>
                </div>

                <div className={`p-4 rounded-2xl border border-blue-500/40 ${innerCardBgClass}`}>
                  <span className="text-[9px] font-mono uppercase text-blue-300 block">Net Month Earnings</span>
                  <span className="text-lg font-black font-mono text-white">
                    R{monthlyStatement.netEarnings.toFixed(2)}
                  </span>
                  <span className="text-[9px] font-mono text-blue-400 block">
                    Paid Out: R{monthlyStatement.totalPaid.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Transaction Ledger Table */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-[10px] font-mono font-bold uppercase text-slate-400">
                  <span>Transaction Description</span>
                  <div className="flex items-center gap-8">
                    <span>Date</span>
                    <span className="w-24 text-right">Amount</span>
                  </div>
                </div>

                <div className="divide-y divide-slate-800/60">
                  {monthlyStatement.transactions.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-xs font-mono">
                      No financial transactions recorded in {selectedMonth}.
                    </div>
                  ) : (
                    monthlyStatement.transactions.map((tx: any) => (
                      <div key={tx.id} className="px-4 py-3 hover:bg-white/5 flex items-center justify-between text-xs font-mono transition-all">
                        <div className="flex items-center gap-2.5">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono ${
                            tx.type === 'EARNING' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                            tx.type === 'BONUS' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                            tx.type === 'PENALTY' ? 'bg-red/20 text-red border border-red/40' :
                            'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          }`}>
                            {tx.type}
                          </span>
                          <div>
                            <span className="text-white font-bold block">{tx.title}</span>
                            <span className="text-[10px] text-slate-400">{tx.description}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-8 shrink-0">
                          <span className="text-slate-400 text-[10px]">
                            {new Date(tx.date).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' })}
                          </span>
                          <span className={`w-24 text-right font-black ${
                            tx.signedAmount > 0 ? 'text-emerald-400' : tx.signedAmount < 0 ? 'text-red' : 'text-slate-400'
                          }`}>
                            {tx.signedAmount > 0 ? `+R${tx.amount.toFixed(2)}` : tx.signedAmount < 0 ? `-R${tx.amount.toFixed(2)}` : `R0.00 (Pending)`}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW 5: DISBURSED PAYOUTS (PAYMENT HISTORY) */}
      {/* ============================================================== */}
      {activeTab === 'payouts' && (
        <div className={`rounded-3xl border shadow-xl overflow-hidden ${cardBgClass}`}>
          <div className="px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white font-brand-header">
                EFT Bank Transfer & Payout History
              </h3>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                Official electronic bank disbursements credited to your designated South African banking account.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-3 py-1 rounded-xl">
              Lifetime Paid Out: R{summary.totalDisbursedPayouts.toFixed(2)}
            </span>
          </div>

          <div className="divide-y divide-slate-800/80">
            {payouts.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-mono">
                No bank disbursements recorded yet on this account.
              </div>
            ) : (
              payouts.map((pay: any) => (
                <div key={pay.id} className="p-5 hover:bg-white/5 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl shrink-0 mt-0.5">
                      <Building className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-mono">Disbursement Ref #{pay.payoutRef}</span>
                        <span className="text-[9px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded">
                          {pay.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 font-mono">
                        Bank Destination: {pay.bankAccount}
                      </p>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        Transferred: {new Date(pay.date).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-1 border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0 shrink-0">
                    <div className="text-base font-black text-emerald-400 font-mono">
                      R{pay.amount.toFixed(2)}
                    </div>
                    <span className="text-[9px] font-mono text-slate-400">
                      Cleared via EFT ✓
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamEarningsDashboard;
