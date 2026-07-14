import React, { useState } from 'react';
import { Shield, Zap, Wrench, Phone, Activity, Clock, CheckCircle } from 'lucide-react';
import { useAppState } from '../../contexts/AppStateContext';
import MapPlaceholder from '../shared/MapPlaceholder';
import EmptyState from '../shared/EmptyState';

export default function ContractorsMonitor() {
  const { state, assignContractor, closeJob, addAuditLogLocal } = useAppState();
  const [selectedJobIdForAssign, setSelectedJobIdForAssign] = useState<string | null>(null);
  const [assignContractorId, setAssignContractorId] = useState('');

  const activeJobs = state.jobs;
  const contractors = state.contractors;

  const handleAssignClick = (jobId: string) => {
    setSelectedJobIdForAssign(jobId);
    // Auto-select first contractor matching job specialty
    const job = state.jobs.find(j => j.id === jobId);
    const defaultC = state.contractors.find(c => c.specialty === job?.serviceType);
    setAssignContractorId(defaultC?.id || '');
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobIdForAssign || !assignContractorId) return;

    try {
      await assignContractor(selectedJobIdForAssign, assignContractorId);
      const contractor = state.contractors.find(c => c.id === assignContractorId);
      addAuditLogLocal('Contractor Assigned to Job', `Administrator dispatched ${contractor?.name} to emergency Job ${selectedJobIdForAssign}.`);
      setSelectedJobIdForAssign(null);
    } catch (err: any) {
      alert(err.message || 'Failed to assign contractor');
    }
  };

  const handleCloseClick = async (jobId: string) => {
    try {
      await closeJob(jobId);
      addAuditLogLocal('Job Closed', `Administrator audited and closed Job Card ${jobId}.`);
    } catch (err: any) {
      alert(err.message || 'Failed to close job card');
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6 animate-fadeIn">
      {/* LEFT COLUMN: ACTIVE DISPATCH EMERGENCY PANICS */}
      <div className="col-span-12 md:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col gap-4">
        <div className="border-b border-slate-100 pb-2">
          <h3 className="text-xs font-bold text-navy uppercase tracking-wider">Live Assistance Dispatch Queue</h3>
          <p className="text-[9px] text-slate-400">Emergency panics and logged repair dispatches</p>
        </div>

        <div className="space-y-3">
          {activeJobs.map(job => {
            const assignedC = contractors.find(c => c.id === job.assignedContractorId);
            return (
              <div 
                key={job.id} 
                className={`p-4 rounded-2xl border transition-all flex flex-col gap-3 ${
                  job.status === 'Requested' 
                    ? 'border-red bg-red/5' 
                    : 'border-slate-100 bg-white'
                }`}
              >
                <div className="flex justify-between items-start text-xs">
                  <div>
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Shield className={`w-4 h-4 shrink-0 ${job.status === 'Requested' ? 'text-red animate-pulse' : 'text-slate-400'}`} />
                      {job.customerName}
                    </span>
                    <p className="text-[9px] text-slate-400 font-mono mt-0.5">Address: {job.customerAddress}</p>
                    <p className="text-[10px] text-slate-500 font-medium italic mt-1 leading-snug">"{job.description}"</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`px-2 py-0.5 rounded-sm font-bold text-[8.5px] uppercase ${
                      job.status === 'Requested' ? 'bg-red text-white animate-pulse' :
                      job.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {job.status}
                    </span>
                    <span className="text-[8px] text-slate-400 font-mono block mt-1">SLA: {job.serviceType}</span>
                  </div>
                </div>

                {/* Tracking indicator */}
                {job.status !== 'Requested' && job.status !== 'Closed' && (
                  <div className="space-y-1.5 border-t border-slate-50 pt-2">
                    <div className="flex justify-between text-[8.5px] font-bold text-slate-400 font-mono uppercase leading-none">
                      <span>Officer Tracking: {assignedC?.name || 'Patrol Officer'}</span>
                      <span>Progress: {job.trackerProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                      <div 
                        className="bg-navy h-full transition-all duration-500" 
                        style={{ width: `${job.trackerProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Dispatch / Close Action Buttons */}
                <div className="flex justify-end gap-2 border-t border-slate-50 pt-2.5">
                  {job.status === 'Requested' && (
                    <button
                      type="button"
                      onClick={() => handleAssignClick(job.id)}
                      className="px-4 py-1.5 bg-red hover:bg-red/90 text-white text-[10px] font-bold rounded-xl shadow-xs cursor-pointer uppercase tracking-wider"
                    >
                      Assign Patrol Officer
                    </button>
                  )}
                  {job.status === 'Completed' && (
                    <button
                      type="button"
                      onClick={() => handleCloseClick(job.id)}
                      className="px-4 py-1.5 bg-navy hover:bg-navy-light text-white text-[10px] font-bold rounded-xl shadow-xs cursor-pointer uppercase tracking-wider"
                    >
                      Close Job Card
                    </button>
                  )}
                  {job.status !== 'Requested' && job.status !== 'Completed' && job.status !== 'Closed' && (
                    <span className="text-[10px] text-slate-400 font-mono">Responder en route or resolving...</span>
                  )}
                </div>
              </div>
            );
          })}
          {activeJobs.length === 0 && (
            <EmptyState 
              icon={CheckCircle}
              title="Dispatch Queue Clean"
              description="No active emergency panic triggers or repair assistance calls at this time."
            />
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: CONTRACTORS STATUS MONITOR */}
      <div className="col-span-12 md:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col gap-4">
        <div className="border-b border-slate-100 pb-2">
          <h3 className="text-xs font-bold text-navy uppercase tracking-wider">Field Patrol Status</h3>
          <p className="text-[9px] text-slate-400">Availability and coordinates of rapid response cruisers</p>
        </div>

        <div className="space-y-3">
          {contractors.map(c => (
            <div key={c.id} className="p-3 bg-slate-50/50 rounded-2xl border border-slate-150 flex items-center justify-between gap-3 hover:border-slate-350 transition-all">
              <div className="flex items-center gap-2.5">
                <div className="w-8.5 h-8.5 bg-navy text-white rounded-xl flex items-center justify-center font-bold text-xs">
                  {c.name.split(' ').map(n=>n[0]).join('')}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">{c.name}</p>
                  <p className="text-[9.5px] text-slate-400 font-mono">Specialty: {c.specialty} • rating: ★ {c.rating}</p>
                  <p className="text-[9px] text-slate-500 mt-0.5 truncate max-w-[160px]">Area: {c.location.address}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className={`px-2 py-0.5 rounded-sm font-bold text-[8.5px] uppercase ${
                  c.isAvailable ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-600'
                }`}>
                  {c.isAvailable ? 'Available' : 'Busy'}
                </span>
                <a href={`tel:${c.phone}`} className="p-1 border border-slate-200 rounded-lg bg-white mt-1.5 flex items-center justify-center hover:bg-slate-50 transition-all">
                  <Phone className="w-3.5 h-3.5 text-navy" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: CHOOSE CONTRACTOR */}
      {selectedJobIdForAssign && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <form onSubmit={handleAssignSubmit} className="bg-white border border-slate-200 w-full max-w-sm rounded-3xl p-6 shadow-xl flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-bold text-navy uppercase tracking-wide">Assign Emergency Responder</h3>
              <p className="text-[9.5px] text-slate-400">Select a rapid responder to dispatch to the customer address immediately</p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Patrol Cruiser Units</label>
              <select
                value={assignContractorId}
                onChange={e => setAssignContractorId(e.target.value)}
                className="text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-navy bg-white"
              >
                {contractors.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.specialty}) • Available: {c.isAvailable ? 'YES' : 'NO'}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 justify-end mt-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setSelectedJobIdForAssign(null)}
                className="px-3.5 py-2 text-xs font-bold text-slate-500 hover:text-navy rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red hover:bg-red/90 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer uppercase tracking-wider"
              >
                Dispatch Cruiser
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
