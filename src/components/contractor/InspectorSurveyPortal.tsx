import React, { useState } from 'react';
import { 
  FileCheck, ShieldCheck, MapPin, Clock, Calendar, CheckCircle2, 
  AlertCircle, Camera, Send, User, ChevronRight, CheckSquare
} from 'lucide-react';
import { useAppState } from '../../contexts/AppStateContext';
import { useAuth } from '../../contexts/AuthContext';
import { SurveyReport } from '../../types';

export function InspectorSurveyPortal() {
  const { state, updateSurveyProgress, submitSurveyReport } = useAppState();
  const { user } = useAuth();

  const currentInspectorId = user?.id || 'c1';
  const currentInspectorName = user?.name || 'Certified Inspector';

  // Find assigned survey requests for this inspector or all pending surveys
  const assignedSurveys = state.enquiries.filter(e => 
    e.surveyInspectorId === currentInspectorId || 
    ['WAITING_FOR_SURVEY', 'SURVEY_ASSIGNED', 'SURVEY_SCHEDULED', 'SURVEY_IN_PROGRESS', 'SURVEY_COMPLETED'].includes(e.status)
  );

  const [activeEnquiryId, setActiveEnquiryId] = useState<string | null>(null);

  // Survey Form State
  const [propertyAssessment, setPropertyAssessment] = useState('Property structure is well-maintained with clear perimeter access and compliant entry points.');
  const [safetyObservations, setSafetyObservations] = useState('Perimeter fence is active and functional. Front gate automation module operational.');
  const [complianceObservations, setComplianceObservations] = useState('Access control points and safety panic modules conform to 2026 Same Day Assist standards.');
  const [existingSystems, setExistingSystems] = useState('Alarm panel module, CCTV cameras, electric gate sensor, solar backup battery.');
  const [risksIdentified, setRisksIdentified] = useState('Overgrown tree branches near south boundary fence line.');
  const [recommendedActions, setRecommendedActions] = useState('Trim south boundary branches within 30 days of service activation.');
  const [photoUrl, setPhotoUrl] = useState('https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=600&auto=format&fit=crop&q=60');
  const [recommendation, setRecommendation] = useState<'RECOMMEND_APPROVAL' | 'RECOMMEND_REVISION' | 'RECOMMEND_REJECT'>('RECOMMEND_APPROVAL');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStartSurvey = async (enquiryId: string) => {
    try {
      await updateSurveyProgress(enquiryId, 'SURVEY_IN_PROGRESS');
      setActiveEnquiryId(enquiryId);
    } catch (err: any) {
      alert(err.message || 'Failed to update survey progress');
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEnquiryId) return;

    setIsSubmitting(true);
    try {
      await submitSurveyReport(activeEnquiryId, {
        inspectorId: currentInspectorId,
        inspectorName: currentInspectorName,
        propertyAssessment,
        safetyObservations,
        complianceObservations,
        existingSystems,
        risksIdentified,
        recommendedActions,
        photos: [photoUrl],
        recommendation,
      });

      alert('Survey Compliance Report submitted successfully to Administrator for review!');
      setActiveEnquiryId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to submit survey report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* HEADER BANNER */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl text-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-red-500 font-mono text-xs font-bold uppercase tracking-widest mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Certified Inspector Workspace</span>
          </div>
          <h2 className="text-2xl font-black italic tracking-wide text-white">Onboarding Property Safety & Compliance Surveys</h2>
          <p className="text-xs text-zinc-400 mt-1">Conduct physical site assessments, record observations, attach photographic evidence, and submit reports to Admin.</p>
        </div>

        <div className="bg-zinc-800 p-3 rounded-2xl border border-zinc-700 font-mono text-xs text-right">
          <span className="text-zinc-400 block mb-0.5">Assigned Surveys</span>
          <span className="font-bold text-white text-base">{assignedSurveys.length}</span>
        </div>
      </div>

      {/* ASSIGNED SURVEYS LIST */}
      <div className="space-y-4">
        {assignedSurveys.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center text-zinc-500 text-xs">
            No property survey assignments currently assigned to your team.
          </div>
        ) : (
          assignedSurveys.map(enq => {
            const isSelected = activeEnquiryId === enq.id;
            const isCompleted = enq.status === 'SURVEY_COMPLETED' || enq.status === 'ADMIN_REVIEW' || enq.status === 'PAYMENT_REQUIRED' || enq.status === 'ACTIVE';

            return (
              <div key={enq.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-lg text-zinc-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">{enq.customerName}</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {enq.accountType || 'Individual'} Account
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400 mt-1 font-mono flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <span>{enq.address}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      isCompleted 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                        : enq.status === 'SURVEY_IN_PROGRESS'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    }`}>
                      {enq.status.replace(/_/g, ' ')}
                    </span>

                    {!isCompleted && !isSelected && (
                      <button
                        type="button"
                        onClick={() => handleStartSurvey(enq.id)}
                        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-600/20 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <span>Start Safety Audit</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* SURVEY REPORT FORM IF SELECTED */}
                {isSelected && (
                  <form onSubmit={handleSubmitReport} className="pt-4 border-t border-zinc-800 space-y-4 text-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-red-500" />
                        <span>Property Safety & Compliance Audit Form</span>
                      </h4>
                      <button type="button" onClick={() => setActiveEnquiryId(null)} className="text-zinc-400 hover:text-white text-xs">Cancel</button>
                    </div>

                    {/* SECURITY SYSTEMS ASSISTANCE AUDIT */}
                    <div className="p-4 rounded-xl bg-zinc-800/80 border border-zinc-700 space-y-2">
                      <label className="block text-xs font-extrabold text-red-400 uppercase tracking-wider">
                        Security Systems Assistance Inspection Checklist
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {[
                          'Garage & Gate Automation',
                          'Audio & Video Intercoms',
                          'Access Control',
                          'Electric Fence',
                          'Alarm',
                          'CCTV',
                        ].map((sys) => (
                          <label key={sys} className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900/60 border border-zinc-700/60 text-[11px] text-zinc-300">
                            <input type="checkbox" defaultChecked className="rounded bg-zinc-800 border-zinc-600 text-red-600 focus:ring-0" />
                            <span>{sys}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-zinc-400 font-semibold mb-1">Property Structural Assessment *</label>
                        <textarea
                          rows={2}
                          value={propertyAssessment}
                          onChange={e => setPropertyAssessment(e.target.value)}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-red-500"
                        />
                      </div>

                      <div>
                        <label className="block text-zinc-400 font-semibold mb-1">Safety & Perimeter Observations *</label>
                        <textarea
                          rows={2}
                          value={safetyObservations}
                          onChange={e => setSafetyObservations(e.target.value)}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-red-500"
                        />
                      </div>

                      <div>
                        <label className="block text-zinc-400 font-semibold mb-1">Compliance Guidelines Check *</label>
                        <textarea
                          rows={2}
                          value={complianceObservations}
                          onChange={e => setComplianceObservations(e.target.value)}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-red-500"
                        />
                      </div>

                      <div>
                        <label className="block text-zinc-400 font-semibold mb-1">Existing Systems & Infrastructure *</label>
                        <textarea
                          rows={2}
                          value={existingSystems}
                          onChange={e => setExistingSystems(e.target.value)}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-red-500"
                        />
                      </div>

                      <div>
                        <label className="block text-zinc-400 font-semibold mb-1">Risks Identified</label>
                        <input
                          type="text"
                          value={risksIdentified}
                          onChange={e => setRisksIdentified(e.target.value)}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-red-500"
                        />
                      </div>

                      <div>
                        <label className="block text-zinc-400 font-semibold mb-1">Recommended Actions</label>
                        <input
                          type="text"
                          value={recommendedActions}
                          onChange={e => setRecommendedActions(e.target.value)}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:outline-none focus:border-red-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-zinc-400 font-semibold mb-1">Inspection Evidence Photo URL</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={photoUrl}
                          onChange={e => setPhotoUrl(e.target.value)}
                          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
                        />
                        <img src={photoUrl} alt="Inspection Photo Preview" className="w-10 h-10 object-cover rounded-xl border border-zinc-700 shrink-0" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-zinc-400 font-semibold mb-2">Final Inspector Recommendation *</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => setRecommendation('RECOMMEND_APPROVAL')}
                          className={`p-3 rounded-xl border text-center transition-all ${
                            recommendation === 'RECOMMEND_APPROVAL' 
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 font-bold' 
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                          }`}
                        >
                          Recommend Approval
                        </button>
                        <button
                          type="button"
                          onClick={() => setRecommendation('RECOMMEND_REVISION')}
                          className={`p-3 rounded-xl border text-center transition-all ${
                            recommendation === 'RECOMMEND_REVISION' 
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500 font-bold' 
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                          }`}
                        >
                          Recommend Revision
                        </button>
                        <button
                          type="button"
                          onClick={() => setRecommendation('RECOMMEND_REJECT')}
                          className={`p-3 rounded-xl border text-center transition-all ${
                            recommendation === 'RECOMMEND_REJECT' 
                              ? 'bg-red-500/20 text-red-300 border-red-500 font-bold' 
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                          }`}
                        >
                          Recommend Rejection
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-red-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>Submit Survey Report to Administrator</span>
                    </button>
                  </form>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
