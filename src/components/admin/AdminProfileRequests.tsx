import React, { useEffect, useState } from 'react';
import { ShieldAlert, CheckCircle, XCircle, Clock, UserCheck, Lock, Unlock } from 'lucide-react';
import { ProfileUpdateRequest } from '../../types';
import { api } from '../../services/api';

export function AdminProfileRequests() {
  const [requests, setRequests] = useState<ProfileUpdateRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [overrideUserId, setOverrideUserId] = useState('');

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const data = await api.getProfileRequests();
      setRequests(data);
    } catch (e) {
      console.error('Failed to load profile requests', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleApprove = async (id: string) => {
    if (!window.confirm('Approve this sensitive profile modification request?')) return;
    try {
      await api.approveProfileRequest(id);
      loadRequests();
    } catch (e) {
      alert('Failed to approve request');
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Enter rejection reason:');
    if (reason === null) return;
    try {
      await api.rejectProfileRequest(id, reason);
      loadRequests();
    } catch (e) {
      alert('Failed to reject request');
    }
  };

  const handleOverrideLock = async () => {
    if (!overrideUserId.trim()) return;
    try {
      const res = await api.overrideProfileLock(overrideUserId.trim());
      alert(res.message);
      setOverrideUserId('');
      loadRequests();
    } catch (e: any) {
      alert(e.message || 'Failed to override lock');
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500" /> Pending Profile Update Approvals
          </h3>
          <p className="text-xs text-slate-400 mt-1">Review sensitive customer identity/company data changes or bypass 60-day profile locks.</p>
        </div>

        {/* Override Lock Form */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 w-full md:w-auto">
          <input
            type="text"
            placeholder="User ID or Email"
            value={overrideUserId}
            onChange={e => setOverrideUserId(e.target.value)}
            className="bg-transparent text-xs text-white px-3 py-1.5 focus:outline-none w-44"
          />
          <button
            onClick={handleOverrideLock}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all"
          >
            <Unlock className="w-3.5 h-3.5" /> Override 60-Day Lock
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-xs text-slate-500">Loading profile approval requests...</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
          <UserCheck className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-400">No Pending Profile Requests</p>
          <p className="text-xs text-slate-500 mt-1">All customer profile updates are up to date and verified.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(r => (
            <div key={r.id} className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{r.userName || 'Customer'}</span>
                    <span className="text-xs text-slate-500">({r.userEmail})</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${
                        r.status === 'Pending'
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : r.status === 'Approved'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-red-500/20 text-red-400 border-red-500/30'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Requested: {new Date(r.requestedAt).toLocaleString()}
                  </span>
                </div>

                {r.status === 'Pending' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(r.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => handleReject(r.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                )}
              </div>

              {/* Snapshot of proposed changes */}
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs font-mono text-slate-300">
                <span className="text-slate-500 block mb-1 font-sans text-[11px] uppercase tracking-wider font-semibold">Proposed Changes Snapshot:</span>
                <pre className="whitespace-pre-wrap">{JSON.stringify(r.proposedChanges, null, 2)}</pre>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
