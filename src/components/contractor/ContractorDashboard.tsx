import React from 'react';
import { Clock, Shield, CheckCircle, Wrench, AlertCircle } from 'lucide-react';
import { useAppState } from '../../contexts/AppStateContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import JobDetailsCard from './JobDetailsCard';
import ReportsUploader from './ReportsUploader';
import EmptyState from '../shared/EmptyState';

export default function ContractorDashboard() {
  const { state, startAssessment, addAuditLogLocal } = useAppState();
  const { user } = useAuth();
  const { isDark } = useTheme();

  const activeContractor = state.contractors.find(c => c.id === user?.id) || state.contractors[0];

  const pendingAssessment = state.currentStep === 'ASSESSMENT_SCHEDULED' || state.currentStep === 'CONTRACTOR_ASSESSING';
  const activeJob = state.jobs.find(j => j.status !== 'Closed' && j.status !== 'Rated');

  const handleStartSurvey = async () => {
    try {
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

  const cardClass = isDark 
    ? 'bg-[#091C3E]/80 border-[#142D59] text-white shadow-md' 
    : 'bg-white border-slate-200 text-navy shadow-xs';

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* WELCOME BAR */}
      <div className={`p-4 rounded-2xl border flex items-center justify-between transition-colors ${cardClass}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red text-white flex items-center justify-center font-brand-header text-sm shadow-md shrink-0">
            {activeContractor?.name ? activeContractor.name.split(' ').map(n=>n[0]).join('') : 'CU'}
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-wide font-brand-header">
              {activeContractor?.name || 'Security Cruiser Unit'}
            </p>
            <p className="text-[10px] font-mono text-slate-400">
              {activeContractor?.specialty || 'Armed Patrol'} • ★ {activeContractor?.rating || '5.0'}
            </p>
          </div>
        </div>
        <span className="text-[9px] bg-red/10 border border-red/20 text-red font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
          South Africa Cruiser Unit
        </span>
      </div>

      {/* RESPONDER EARNINGS & STANDBY STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`p-5 rounded-2xl border flex flex-col justify-between transition-colors ${cardClass}`}>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">
            Completed Dispatches
          </span>
          <span className="text-2xl font-brand-header font-black mt-2">
            {state.jobs.filter(j => j.assignedContractorId === activeContractor?.id && (j.status === 'Completed' || j.status === 'Closed')).length + 3}
          </span>
          <p className="text-[10px] text-slate-400 mt-1 font-mono">Verified job cards</p>
        </div>

        <div className={`p-5 rounded-2xl border flex flex-col justify-between transition-colors ${cardClass}`}>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">
            Estimated Payout Earnings
          </span>
          <span className="text-2xl font-brand-header font-black text-emerald-400 mt-2">
            R{((state.jobs.filter(j => j.assignedContractorId === activeContractor?.id && (j.status === 'Completed' || j.status === 'Closed')).length + 3) * 450 + 2500).toLocaleString()}
          </span>
          <p className="text-[10px] text-slate-400 mt-1 font-mono">Base rate + dispatch bonuses</p>
        </div>

        <div className={`p-5 rounded-2xl border flex flex-col justify-between transition-colors ${cardClass}`}>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">
            Availability Rating
          </span>
          <span className="text-2xl font-brand-header font-black mt-2">
            ★ {activeContractor?.rating || '4.9'}
          </span>
          <p className="text-[10px] text-slate-400 mt-1 font-mono">Based on dispatch response SLAs</p>
        </div>
      </div>

      {/* CASE 1: COMPLIANCE ASSESSMENT WORKFLOW */}
      {pendingAssessment && (
        <div className="flex flex-col gap-4 animate-fadeIn">
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 p-4 rounded-2xl flex items-start gap-2.5 text-xs">
            <Clock className="w-4 h-4 mt-0.5 shrink-0 animate-pulse" />
            <div>
              <span className="font-bold uppercase tracking-wider text-[11px] font-brand-header text-amber-300">
                Pending Property Survey Assignment
              </span>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                You are dispatched to complete a pre-compliance property assessment at client premises. Confirm arrival to begin logging compliance defects.
              </p>
            </div>
          </div>

          {state.currentStep === 'ASSESSMENT_SCHEDULED' ? (
            <div className={`p-6 rounded-2xl border text-center flex flex-col items-center gap-3 ${cardClass}`}>
              <p className="text-xs text-slate-300">Arrived at the registered dispatch address?</p>
              <button
                type="button"
                onClick={handleStartSurvey}
                className="w-full max-w-sm bg-red hover:bg-red/90 text-white font-brand-header text-xs py-3 rounded-xl shadow-md uppercase tracking-wider cursor-pointer font-bold"
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
        <EmptyState 
          icon={Shield}
          title="CRUISER DISPATCH STANDBY"
          description="Operational channels verified. You are currently on standby for rapid dispatch panic assistance. Keep terminal connection open."
        />
      )}
    </div>
  );
}
