import React, { useState, useEffect } from 'react';
import { Wallet as WalletIcon, CreditCard, ArrowUpRight, ArrowDownLeft, Plus, RefreshCw, CheckCircle2, Shield } from 'lucide-react';
import { api } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';

export function CustomerWalletView() {
  const { isDark } = useTheme();
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
      <div className={`flex items-center justify-center py-12 font-mono text-xs gap-2 ${
        isDark ? 'text-slate-400' : 'text-slate-500'
      }`}>
        <RefreshCw className="w-4 h-4 animate-spin text-red" />
        <span>Loading Digital Wallet Ledger...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* WALLET BANNER CARD */}
      <div className={`p-6 md:p-8 rounded-3xl border shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 transition-colors ${
        isDark 
          ? 'bg-gradient-to-r from-navy via-slate-900 to-navy text-white border-navy-light' 
          : 'bg-white text-slate-900 border-slate-200'
      }`}>
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red/10 border border-red/20 flex items-center justify-center">
              <WalletIcon className="w-4 h-4 text-red" />
            </div>
            <span className="text-xs font-mono uppercase tracking-widest text-red font-bold">SAME DAY ASSIST WALLET</span>
          </div>
          <h2 className={`text-3xl font-brand-header tracking-wide font-extrabold ${
            isDark ? 'text-white' : 'text-navy'
          }`}>
            R {(wallet?.balance || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
          <p className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Available ZAR balance for emergency dispatch co-pays, subscriptions, and instant service bookings
          </p>
        </div>

        {/* TOP-UP CARD */}
        <form onSubmit={handleTopUp} className={`border p-4 rounded-2xl w-full md:w-80 space-y-3 z-10 transition-colors ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider block font-mono ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}>
            Instant Wallet Top-Up
          </span>
          <div className="flex gap-2">
            {['250', '500', '1000'].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => setTopUpAmount(val)}
                className={`px-3 py-1.5 text-xs font-mono rounded-lg border transition-all cursor-pointer ${
                  topUpAmount === val 
                    ? 'bg-red text-white border-red' 
                    : isDark 
                      ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white' 
                      : 'bg-white border-slate-300 text-slate-600 hover:text-navy'
                }`}
              >
                +R{val}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="number"
              min="10"
              value={topUpAmount}
              onChange={e => setTopUpAmount(e.target.value)}
              placeholder="Amount (ZAR)"
              className={`flex-1 p-2 text-xs rounded-xl border font-mono focus:outline-none focus:ring-1 focus:ring-red ${
                isDark 
                  ? 'bg-slate-950 border-slate-800 text-white' 
                  : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
            <button
              type="submit"
              disabled={topUpLoading}
              className="px-4 py-2 bg-red text-white text-xs font-bold uppercase rounded-xl hover:bg-red/90 transition-all flex items-center gap-1 cursor-pointer shadow-md disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" /> Top Up
            </button>
          </div>
        </form>
      </div>

      {successMsg && (
        <div className={`border text-xs p-4 rounded-2xl flex items-center gap-2 font-mono animate-fadeIn ${
          isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* TRANSACTION HISTORY LEDGER */}
      <div className={`rounded-2xl border shadow-2xs overflow-hidden transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className={`p-6 border-b flex justify-between items-center ${
          isDark ? 'border-slate-800' : 'border-slate-100'
        }`}>
          <div>
            <h3 className={`text-sm font-bold uppercase font-brand-header tracking-wide ${
              isDark ? 'text-white' : 'text-navy'
            }`}>
              Wallet Transaction Ledger
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Real-time audit log of credits, top-ups, refunds, and service payments
            </p>
          </div>
          <button 
            onClick={fetchWallet} 
            className={`text-xs font-mono transition-colors ${
              isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-navy'
            }`}
          >
            Refresh Ledger
          </button>
        </div>

        <div className={`divide-y text-xs ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
          {wallet?.transactions?.length === 0 ? (
            <div className={`p-8 text-center font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              No transaction history recorded yet.
            </div>
          ) : (
            wallet?.transactions?.map((tx: any) => {
              const isCredit = tx.type === 'TopUp' || tx.type === 'Bonus Reward' || tx.type === 'Refund';
              return (
                <div 
                  key={tx.id} 
                  className={`p-4 px-6 flex items-center justify-between transition-colors ${
                    isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      isCredit 
                        ? (isDark ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-600 border border-emerald-200')
                        : (isDark ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-rose-50 text-rose-600 border border-rose-200')
                    }`}>
                      {isCredit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className={`font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>{tx.description}</span>
                      <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {new Date(tx.createdAt).toLocaleString()} • Type: {tx.type}
                      </span>
                    </div>
                  </div>

                  <span className={`font-mono font-bold text-sm ${
                    isCredit 
                      ? (isDark ? 'text-emerald-400' : 'text-emerald-600') 
                      : (isDark ? 'text-rose-400' : 'text-rose-600')
                  }`}>
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
export default CustomerWalletView;
