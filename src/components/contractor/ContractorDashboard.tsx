import React, { useState } from 'react';
import { Clock, Shield, CheckCircle, Wrench } from 'lucide-react';
import { useAppState } from '../../contexts/AppStateContext';
import { useAuth } from '../../contexts/AuthContext';
import JobDetailsCard from './JobDetailsCard';
import ReportsUploader from './ReportsUploader';
import EmptyState from '../shared/EmptyState';

export default function ContractorDashboard() {
  const { state, startAssessment, addAuditLogLocal } = useAppState();
  const { user } = useAuth();

  const activeContractor = state.contractors.find(c => c.id === user?.id) || state.contractors[0];

  const pendingAssessment = state.currentStep === 'ASSESSMENT_SCHEDULED' || state.currentStep === 'CONTRACTOR_ASSESSING';
  const activeJob = state.jobs.find(j => j.status !== 'Closed' && j.status !== 'Rated');

  const handleStartSurvey = async () => {
    try {
      // Find the first scheduled assessment assigned to this contractor
      const assessment = state.assessments.find(a => a.contractorId === activeContractor.id && a.status === 'Scheduled');
      if (assessment) {
        await startAssessment(assessment.id);
        addAuditLogLocal('Compliance Survey Started', `Contractor ${activeContractor.name} started property safety assessment.`);
      } else {
        alert('No scheduled assessment found.');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to start survey');
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn text-zinc-200">
      {/* WELCOME BAR */}
      <div className="bg-zinc-800 border border-zinc-700 p-4 rounded-2xl flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red text-white flex items-center justify-center font-brand-header text-sm">
            {activeContractor.name.split(' ').map(n=>n[0]).join('')}
          </div>
          <div>
            <p className="text-xs font-bold text-white">{activeContractor.name}</p>
            <p className="text-[9.5px] font-mono text-zinc-400">
              {activeContractor.specialty} Responder Unit • ★ {activeContractor.rating}
            </p>
          </div>
        </div>
        <span className="text-[8.5px] bg-red/10 border border-red/20 text-red font-mono font-bold px-2 py-0.5 rounded uppercase">
          South Africa Cruiser Unit
        </span>
      </div>

      {/* RESPONDER EARNINGS & STANDBY STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col justify-between shadow-xs">
          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Completed Dispatches</span>
          <span className="text-xl font-brand-header text-white font-bold mt-1">
            {state.jobs.filter(j => j.assignedContractorId === activeContractor.id && (j.status === 'Completed' || j.status === 'Closed')).length + 3}
          </span>
          <p className="text-[8.5px] text-zinc-500 mt-1 font-mono">Completed job cards</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col justify-between shadow-xs">
          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Estimated Payout Earnings</span>
          <span className="text-xl font-brand-header text-emerald-450 font-bold mt-1">
            R{((state.jobs.filter(j => j.assignedContractorId === activeContractor.id && (j.status === 'Completed' || j.status === 'Closed')).length + 3) * 450 + 2500).toLocaleString()}
          </span>
          <p className="text-[8.5px] text-zinc-500 mt-1 font-mono">Base rate + dispatch bonuses</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col justify-between shadow-xs">
          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Availability Rating</span>
          <span className="text-xl font-brand-header text-white font-bold mt-1">
            ★ {activeContractor.rating || '5.0'}
          </span>
          <p className="text-[8.5px] text-zinc-500 mt-1 font-mono">Based on dispatch response SLAs</p>
        </div>
      </div>

      {/* CASE 1: COMPLIANCE ASSESSMENT WORKFLOW */}
      {pendingAssessment && (
        <div className="flex flex-col gap-4 animate-fadeIn">
          <div className="bg-amber-950/20 border border-amber-900/60 text-amber-400 p-4 rounded-2xl flex items-start gap-2.5 text-xs">
            <Clock className="w-4 h-4 mt-0.5 shrink-0 animate-pulse" />
            <div>
              <span className="font-bold uppercase tracking-wider text-[11px] font-brand-header">Pending Survey Assignment</span>
              <p className="text-[10px] text-zinc-300 mt-1 leading-relaxed">
                You are dispatched to complete a pre-compliance property assessment at client premises. Confirm arrival to begin logging compliance defects.
              </p>
            </div>
          </div>

          {state.currentStep === 'ASSESSMENT_SCHEDULED' ? (
            <div className="bg-zinc-850 border border-zinc-800 p-5 rounded-2xl text-center flex flex-col items-center">
              <p className="text-xs text-zinc-300 mb-4">Arrived at the registered dispatch address?</p>
              <button
                type="button"
                onClick={handleStartSurvey}
                className="w-full bg-red hover:bg-red/90 text-white font-brand-header text-xs py-3 rounded-xl shadow-xs uppercase tracking-wider cursor-pointer"
              >
                Commence Compliance Assessment
              </button>
            </div>
          ) : (
            <ReportsUploader activeContractor={activeContractor} />
          )}
        </div>
      )}

      {/* CASE 2: EMERGENCY DISPATCH WORKFLOW */}
      {!pendingAssessment && activeJob && (
        <JobDetailsCard activeJob={activeJob} activeContractor={activeContractor} />
      )}

      {/* CASE 3: NO DISPATCHES (STANDBY SYSTEM) */}
      {!pendingAssessment && !activeJob && (
        <div className="bg-zinc-950 p-8 rounded-3xl border border-zinc-850 text-center flex flex-col gap-4">
          <EmptyState 
            icon={Shield}
            title="CRUISER DISPATCH STANDBY"
            description="Operational channels verified. You are currently on standby for rapid dispatch panic assistance. Keep terminal connection open."
          />
        </div>
      )}
    </div>
  );
}
