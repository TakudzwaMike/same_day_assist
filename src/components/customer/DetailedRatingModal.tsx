import React, { useState } from 'react';
import { Star, Camera, CheckCircle2, AlertCircle, X, Shield } from 'lucide-react';
import { api } from '../../services/api';

interface DetailedRatingModalProps {
  job: any;
  onSuccess: () => void;
  onClose: () => void;
}

export function DetailedRatingModal({ job, onSuccess, onClose }: DetailedRatingModalProps) {
  const [professionalism, setProfessionalism] = useState(5);
  const [punctuality, setPunctuality] = useState(5);
  const [responseTime, setResponseTime] = useState(5);
  const [communication, setCommunication] = useState(5);
  const [qualityOfWork, setQualityOfWork] = useState(5);
  const [friendliness, setFriendliness] = useState(5);
  const [problemResolution, setProblemResolution] = useState(5);
  const [overallSatisfaction, setOverallSatisfaction] = useState(5);
  
  const [writtenFeedback, setWrittenFeedback] = useState('');
  const [photoBeforeUrl, setPhotoBeforeUrl] = useState('');
  const [photoAfterUrl, setPhotoAfterUrl] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.submitJobRating(job.id, {
        professionalism,
        punctuality,
        responseTime,
        communication,
        qualityOfWork,
        friendliness,
        problemResolution,
        overallSatisfaction,
        writtenFeedback,
        photoBeforeUrl,
        photoAfterUrl,
      });

      setSubmitted(true);
      setTimeout(() => {
        onSuccess();
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Failed to submit rating feedback.');
    } finally {
      setLoading(false);
    }
  };

  const renderStarPicker = (label: string, value: number, setValue: (val: number) => void) => (
    <div className="flex justify-between items-center bg-slate-950 p-2.5 px-3.5 rounded-xl border border-slate-800 text-xs">
      <span className="font-semibold text-slate-300">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setValue(star)}
            className="p-1 text-slate-600 hover:text-amber-400 cursor-pointer transition-colors"
          >
            <Star
              className={`w-4 h-4 ${
                star <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 md:p-8 text-slate-100 shadow-2xl space-y-5">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-brand-header uppercase tracking-wide text-white">
                Multi-Dimensional Service Rating
              </h2>
              <p className="text-xs text-slate-400">
                Rate your experience for job <span className="font-mono text-white">#{job.id.substring(0, 8)}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xs font-mono">
            ESC ✕
          </button>
        </div>

        {submitted ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-2xl text-center space-y-2 font-mono">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h3 className="text-base font-bold text-white uppercase">Rating Recorded Successfully</h3>
            <p className="text-xs text-slate-300">
              Thank you! Your feedback updates the responder's overall CSAT performance score.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red/10 border border-red/30 text-red text-xs p-3 rounded-xl flex items-center gap-2 font-mono">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block font-mono">
                8-Dimensional Performance Metrics
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {renderStarPicker('Professionalism', professionalism, setProfessionalism)}
                {renderStarPicker('Punctuality & ETA', punctuality, setPunctuality)}
                {renderStarPicker('Response Time', responseTime, setResponseTime)}
                {renderStarPicker('Communication', communication, setCommunication)}
                {renderStarPicker('Quality of Work', qualityOfWork, setQualityOfWork)}
                {renderStarPicker('Friendliness', friendliness, setFriendliness)}
                {renderStarPicker('Problem Resolution', problemResolution, setProblemResolution)}
                {renderStarPicker('Overall Satisfaction', overallSatisfaction, setOverallSatisfaction)}
              </div>
            </div>

            {/* WRITTEN COMMENTS & PHOTO MILESTONES */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Written Feedback & Observations
              </label>
              <textarea
                rows={3}
                placeholder="Share details about the service delivery..."
                value={writtenFeedback}
                onChange={e => setWrittenFeedback(e.target.value)}
                className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-amber-400 font-sans"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 block">Before Photo (Optional)</label>
                <input
                  type="text"
                  placeholder="Paste photo URL"
                  value={photoBeforeUrl}
                  onChange={e => setPhotoBeforeUrl(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 block">After Photo (Optional)</label>
                <input
                  type="text"
                  placeholder="Paste photo URL"
                  value={photoAfterUrl}
                  onChange={e => setPhotoAfterUrl(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-slate-800">
              <button type="button" onClick={onClose} className="text-xs font-mono text-slate-400 hover:text-white">
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-amber-500 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-amber-400 transition-all flex items-center gap-1.5 cursor-pointer shadow-lg"
              >
                Submit Performance Rating
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
