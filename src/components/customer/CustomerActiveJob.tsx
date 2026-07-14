import React, { useState } from 'react';
import { Phone, Star, CheckCircle, Clock } from 'lucide-react';
import { useAppState } from '../../contexts/AppStateContext';
import MapPlaceholder from '../shared/MapPlaceholder';

interface CustomerActiveJobProps {
  activeJob: any;
  assignedContractor: any;
}

export default function CustomerActiveJob({ activeJob, assignedContractor }: CustomerActiveJobProps) {
  const { rateJob, addAuditLogLocal } = useAppState();
  const [ratingVal, setRatingVal] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  const handleRateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await rateJob(activeJob.id, ratingVal, ratingComment);
      addAuditLogLocal('Job Rated', `Customer rated Job ${activeJob.id} with ${ratingVal} stars.`);
      setRatingComment('');
    } catch (err: any) {
      alert(err.message || 'Failed to submit rating');
    }
  };

  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col gap-4 animate-fadeIn">
      <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
        <div>
          <h3 className="text-xs font-bold text-red uppercase tracking-wider">Rapid Dispatch Engaged</h3>
          <p className="text-[9px] text-slate-400 font-mono">Job card: {activeJob.id}</p>
        </div>
        <span className="text-[9px] bg-red/10 text-red font-extrabold px-2 py-0.5 rounded-sm uppercase tracking-wide animate-pulse">
          {activeJob.status}
        </span>
      </div>

      {/* MAP PLACEHOLDER */}
      <MapPlaceholder 
        contractorName={assignedContractor?.name || 'Patrol Cruiser'}
        contractorRole={activeJob.serviceType}
        trackerProgress={activeJob.trackerProgress}
        status={activeJob.status}
        customerAddress={activeJob.customerAddress || 'Sandton, JHB'}
        heightClass="h-44"
      />

      {/* PROGRESS TRACKER BAR */}
      <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold px-1 uppercase tracking-tight">
        <span className={activeJob.trackerProgress >= 15 ? 'text-navy' : ''}>Requested</span>
        <span className={activeJob.trackerProgress >= 50 ? 'text-navy' : ''}>En Route</span>
        <span className={activeJob.trackerProgress >= 80 ? 'text-navy' : ''}>Arrived</span>
        <span className={activeJob.trackerProgress >= 100 ? 'text-navy' : ''}>Resolved</span>
      </div>
      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
        <div 
          className="bg-navy h-full transition-all duration-500" 
          style={{ width: `${activeJob.trackerProgress}%` }}
        ></div>
      </div>

      {/* CONTRACTOR DETAILS */}
      {assignedContractor ? (
        <div className="bg-slate-50 p-3 rounded-2xl flex items-center justify-between border border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-navy text-white flex items-center justify-center font-bold text-xs">
              {assignedContractor.name.split(' ').map((n: string)=>n[0]).join('')}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">{assignedContractor.name}</p>
              <p className="text-[9px] text-slate-400">{assignedContractor.specialty} Patrol Cruiser • ★ {assignedContractor.rating || 5.0}</p>
            </div>
          </div>
          <a href={`tel:${assignedContractor.phone}`} className="p-2 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer">
            <Phone className="w-4 h-4 text-navy" />
          </a>
        </div>
      ) : (
        <div className="bg-slate-50 p-3 rounded-2xl text-center text-xs text-slate-500 border border-slate-100 flex items-center justify-center gap-2">
          <Clock className="w-4 h-4 text-slate-400 animate-spin" />
          <span>Control room dispatcher is selecting the closest patrol cruiser...</span>
        </div>
      )}

      {/* JOB COMPLETION & REVIEW FORM */}
      {activeJob.status === 'Completed' && (
        <form onSubmit={handleRateSubmit} className="bg-red/5 p-4 rounded-2xl border border-red/25 flex flex-col gap-3 mt-1 animate-fadeIn">
          <div className="text-center border-b border-red/10 pb-1.5">
            <h4 className="text-xs font-bold text-navy uppercase tracking-wider">Rate Emergency Resolution</h4>
            <p className="text-[9px] text-slate-500">Provide star feedback and comments to close this job card</p>
          </div>
          
          <div className="flex justify-center gap-2 my-1">
            {[1, 2, 3, 4, 5].map(val => (
              <button 
                key={val} 
                type="button"
                onClick={() => setRatingVal(val)}
                className="focus:outline-none cursor-pointer"
              >
                <Star className={`w-6 h-6 transition-colors ${ratingVal >= val ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
              </button>
            ))}
          </div>

          <textarea 
            placeholder="Write details about the responder's efficiency (optional)..."
            value={ratingComment}
            onChange={e => setRatingComment(e.target.value)}
            className="text-xs p-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-navy h-16 resize-none"
          />

          <button 
            type="submit"
            className="w-full bg-navy text-white font-brand-header py-3 rounded-xl text-xs hover:bg-navy-light uppercase tracking-wider cursor-pointer"
          >
            Submit Feedback & Close Ticket
          </button>
        </form>
      )}
    </div>
  );
}
