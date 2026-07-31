import React, { useState, useEffect } from 'react';
import { Wallet as WalletIcon, CreditCard, ArrowUpRight, ArrowDownLeft, Plus, RefreshCw, CheckCircle2, Shield } from 'lucide-react';
import { api } from '../../services/api';

export function CustomerWalletView() {
  const [wallet, setWallet] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [topUpAmount, setTopUpAmount] = useState('500');
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchWallet = async () => {
    setLoading(true);
    try {
      const data = await api.getWalletBalance();
      setWallet(data);
    } catch (err) {
      console.error('Failed to load wallet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount <= 0) return alert('Enter valid amount');

    setTopUpLoading(true);
    try {
      const res = await api.topUpWallet(amount, 'Instant Card / EFT Wallet Credit Top-Up');
      setWallet(res.wallet);
      setSuccessMsg(`Successfully credited ZAR ${amount.toLocaleString()} to your digital wallet!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert('Top-up failed.');
    } finally {
      setTopUpLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-400 font-mono text-xs gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-red" />
        <span>Loading Digital Wallet Ledger...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* WALLET BANNER CARD */}
      <div className="bg-gradient-to-r from-navy via-slate-900 to-navy text-white p-6 md:p-8 rounded-3xl border border-navy-light shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red/10 border border-red/20 flex items-center justify-center">
              <WalletIcon className="w-4 h-4 text-red" />
            </div>
            <span className="text-xs font-mono uppercase tracking-widest text-red font-bold">SAME DAY ASSIST WALLET</span>
          </div>
          <h2 className="text-3xl font-brand-header tracking-wide font-extrabold text-white">
            R {(wallet?.balance || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Available ZAR balance for emergency dispatch co-pays, subscriptions, and instant service bookings
          </p>
        </div>

        {/* TOP-UP CARD */}
        <form onSubmit={handleTopUp} className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl w-full md:w-80 space-y-3 z-10">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">
            Instant Wallet Top-Up
          </span>
          <div className="flex gap-2">
            {['250', '500', '1000'].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => setTopUpAmount(val)}
                className={`px-3 py-1.5 text-xs font-mono rounded-lg border transition-all cursor-pointer ${
                  topUpAmount === val ? 'bg-red text-white border-red' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                +R{val}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              min={50}
              required
              value={topUpAmount}
              onChange={e => setTopUpAmount(e.target.value)}
              className="flex-1 p-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:ring-1 focus:ring-red"
            />
            <button
              type="submit"
              disabled={topUpLoading}
              className="px-4 py-2 bg-red text-white text-xs font-bold uppercase rounded-xl hover:bg-red/90 transition-all flex items-center gap-1 cursor-pointer shadow-md"
            >
              <Plus className="w-3.5 h-3.5" /> Top Up
            </button>
          </div>
        </form>
      </div>

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs p-4 rounded-2xl flex items-center gap-2 font-mono animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* TRANSACTION HISTORY LEDGER */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-navy uppercase font-brand-header tracking-wide">
              Wallet Transaction Ledger
            </h3>
            <p className="text-xs text-slate-500">Real-time audit log of credits, top-ups, refunds, and service payments</p>
          </div>
          <button onClick={fetchWallet} className="text-xs text-slate-400 font-mono hover:text-navy">
            Refresh Ledger
          </button>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {wallet?.transactions?.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-mono">No transaction history recorded yet.</div>
          ) : (
            wallet?.transactions?.map((tx: any) => {
              const isCredit = tx.type === 'TopUp' || tx.type === 'Bonus Reward' || tx.type === 'Refund';
              return (
                <div key={tx.id} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      isCredit ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
                    }`}>
                      {isCredit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block">{tx.description}</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(tx.createdAt).toLocaleString()} • Type: {tx.type}
                      </span>
                    </div>
                  </div>

                  <span className={`font-mono font-bold text-sm ${isCredit ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isCredit ? '+' : '-'} R {tx.amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
