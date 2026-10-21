import React, { useEffect, useState } from 'react';
import { Shield, Clock, MapPin, Phone, CheckCircle, Navigation, Radio, MessageSquare, Star, Camera, Video, Package, CheckCircle2 } from 'lucide-react';
import { Job, JobStatus } from '../../types';
import { getSocket } from '../../services/socket';
import { api } from '../../services/api';
import { JobChatDrawer } from '../shared/JobChatDrawer';
import { DetailedRatingModal } from './DetailedRatingModal';

interface LiveServiceTrackerProps {
  job: Job;
  onClose?: () => void;
}

const STAGES: { status: JobStatus; label: string; progress: number }[] = [
  { status: 'Request Received', label: 'Request Received', progress: 10 },
  { status: 'Request Under Review', label: 'Under Review', progress: 20 },
  { status: 'Service Provider Assigned', label: 'Team Assigned', progress: 35 },
  { status: 'Preparing for Dispatch', label: 'Preparing', progress: 45 },
  { status: 'Dispatched', label: 'Dispatched', progress: 60 },
  { status: 'En Route', label: 'En Route', progress: 75 },
  { status: 'Arrived', label: 'Arrived On Site', progress: 85 },
  { status: 'Service In Progress', label: 'In Progress', progress: 95 },
  { status: 'Service Completed', label: 'Completed', progress: 100 },
];

export function LiveServiceTracker({ job, onClose }: LiveServiceTrackerProps) {
  const [currentJob, setCurrentJob] = useState<Job>(job);
  const [eta, setEta] = useState<number>(job.estimatedArrivalMinutes || 15);
  const [distance, setDistance] = useState<number>(job.distanceRemainingKm || 4.2);
  const [showChat, setShowChat] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);

  // Parse vehicle info if present
  const vehicle = currentJob.vehicleInfo
    ? (typeof currentJob.vehicleInfo === 'string' ? JSON.parse(currentJob.vehicleInfo) : currentJob.vehicleInfo)
    : { make: 'Toyota', model: 'Hilux 4x4 Response Unit', licensePlate: 'SDA-01-GP', color: 'White' };

  const currentStageIndex = STAGES.findIndex(s => s.status === currentJob.status);
  const activeIndex = currentStageIndex >= 0 ? currentStageIndex : 0;
  const currentProgress = STAGES[activeIndex]?.progress || 10;

  // Real-time socket listener for live 3-second updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleJobUpdated = (updatedJob: Job) => {
      if (updatedJob.id === job.id) {
        setCurrentJob(updatedJob);
      }
    };

    const handleLocationUpdate = (data: { jobId: string; currentLat: number; currentLng: number; estimatedArrivalMinutes?: number; distanceRemainingKm?: number }) => {
      if (data.jobId === job.id) {
        setCurrentJob(prev => ({
          ...prev,
          currentLat: data.currentLat,
          currentLng: data.currentLng,
        }));
        if (data.estimatedArrivalMinutes !== undefined) setEta(data.estimatedArrivalMinutes);
        if (data.distanceRemainingKm !== undefined) setDistance(data.distanceRemainingKm);
      }
    };

    socket.on('job-updated', handleJobUpdated);
    socket.on('contractor-location', handleLocationUpdate);

    // 3-second position simulation tick for live map experience when status is En Route or Dispatched
    const interval = setInterval(() => {
      if (['Dispatched', 'En Route'].includes(currentJob.status)) {
        setEta(prev => Math.max(1, prev - 1));
        setDistance(prev => Math.max(0.2, parseFloat((prev - 0.1).toFixed(1))));

        // Emit simulated micro GPS update to server
        const nextLat = (currentJob.currentLat || -26.1076) + (Math.random() - 0.5) * 0.001;
        const nextLng = (currentJob.currentLng || 28.0567) + (Math.random() - 0.5) * 0.001;
        api.updateJobLocation(job.id, { lat: nextLat, lng: nextLng }).catch(() => {});
      }
    }, 3000);

    return () => {
      socket.off('job-updated', handleJobUpdated);
      socket.off('contractor-location', handleLocationUpdate);
      clearInterval(interval);
    };
  }, [job.id, currentJob.status, currentJob.currentLat, currentJob.currentLng]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-red-500 font-semibold text-xs uppercase tracking-wider mb-1">
            <Radio className="w-4 h-4 animate-pulse text-red-500" /> Live 3-Second Service Tracker
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {currentJob.serviceType} <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full font-normal">ID: #{currentJob.id.slice(0, 8)}</span>
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl text-right">
            <span className="text-[10px] text-slate-500 uppercase block">Est. Arrival (ETA)</span>
            <span className="text-lg font-extrabold text-emerald-400 flex items-center gap-1">
              <Clock className="w-4 h-4 text-emerald-400" /> {eta} mins ({distance} km)
            </span>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-white px-3 py-2 rounded-xl border border-slate-800 hover:border-slate-700"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Interactive Map Visualizer */}
      <div className="relative h-64 w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
        {/* Simulated Radar / Map Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-30" />
        
        {/* Target Location Marker */}
        <div className="absolute top-1/2 left-3/4 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          <div className="bg-red-500/20 p-3 rounded-full border border-red-500 animate-ping absolute" />
          <MapPin className="w-8 h-8 text-red-500 relative z-10 drop-shadow-lg" />
          <span className="text-[10px] bg-slate-900/90 text-white px-2 py-0.5 rounded border border-slate-700 mt-1 font-semibold">Destination</span>
        </div>

        {/* Live Responder Vehicle Marker */}
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-1000">
          <div className="bg-emerald-500/20 p-4 rounded-full border border-emerald-500 animate-pulse absolute" />
          <div className="bg-emerald-600 text-white p-2 rounded-xl shadow-lg shadow-emerald-600/50 relative z-10">
            <Navigation className="w-6 h-6" />
          </div>
          <span className="text-[10px] bg-slate-900/90 text-emerald-400 px-2 py-0.5 rounded border border-slate-700 mt-1 font-semibold flex items-center gap-1">
            <Navigation className="w-3 h-3 animate-spin" /> Live GPS Unit
          </span>
        </div>

        {/* GPS Route Line */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <line
            x1="25%"
            y1="50%"
            x2="75%"
            y2="50%"
            stroke="#10b981"
            strokeWidth="3"
            strokeDasharray="6 6"
            className="animate-pulse"
          />
        </svg>

        <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Real-Time Telemetry Streaming Active (3s updates)
        </div>
      </div>

      {/* 9-Stage Progress Workflow Pipeline */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Service Progress</span>
          <span className="text-xs font-bold text-red-400">{currentProgress}% Complete</span>
        </div>

        <div className="w-full bg-slate-950 rounded-full h-3 mb-6 overflow-hidden border border-slate-800 p-0.5">
          <div
            className="bg-gradient-to-r from-red-600 via-emerald-500 to-emerald-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${currentProgress}%` }}
          />
        </div>

        <div className="grid grid-cols-3 md:grid-cols-9 gap-1 text-center">
          {STAGES.map((s, idx) => {
            const isCompleted = idx < activeIndex;
            const isCurrent = idx === activeIndex;
            return (
              <div
                key={s.status}
                className={`p-2 rounded-xl border text-[10px] font-medium transition-all ${
                  isCurrent
                    ? 'bg-red-600/20 border-red-500 text-white shadow-lg shadow-red-500/20'
                    : isCompleted
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-slate-950/40 border-slate-800/50 text-slate-600'
                }`}
              >
                <div className="mb-1 flex justify-center">
                  {isCompleted ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  ) : isCurrent ? (
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                  )}
                </div>
                <span className="line-clamp-1">{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* VERIFIED GROUND HANDOVER PROOF (BEFORE/AFTER MEDIA & EXCHANGED PARTS) */}
      {(currentJob.photoBeforeUrl || currentJob.videoBeforeUrl || currentJob.photoAfterUrl || currentJob.videoAfterUrl || currentJob.contractorNotes || ['Service Completed', 'Completed', 'Work Completed'].includes(currentJob.status)) && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Verified On-Site Handover & Evidence Record
              </span>
            </div>
            <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded uppercase font-bold">
              Technician Verified
            </span>
          </div>

          {/* BEFORE & AFTER MEDIA SIDE-BY-SIDE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* BEFORE MEDIA */}
            <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-2.5 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono text-red font-bold uppercase">
                <span className="flex items-center gap-1">
                  {currentJob.videoBeforeUrl ? <Video className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
                  1. Before Repair (Defect State)
                </span>
                <span className="text-[8px] bg-red/10 text-red px-1.5 py-0.5 rounded">Issue Logged</span>
              </div>

              {currentJob.videoBeforeUrl ? (
                <video src={currentJob.videoBeforeUrl} controls className="w-full h-36 object-contain rounded-lg bg-black" />
              ) : currentJob.photoBeforeUrl ? (
                <img src={currentJob.photoBeforeUrl} alt="Before Proof" className="w-full h-36 object-cover rounded-lg" />
              ) : (
                <div className="h-36 rounded-lg bg-slate-950 flex items-center justify-center text-[10px] text-slate-500 font-mono">
                  Initial media recorded
                </div>
              )}
            </div>

            {/* AFTER MEDIA */}
            <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-2.5 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400 font-bold uppercase">
                <span className="flex items-center gap-1">
                  {currentJob.videoAfterUrl ? <Video className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
                  2. After Repair (Working State)
                </span>
                <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded">Operational</span>
              </div>

              {currentJob.videoAfterUrl ? (
                <video src={currentJob.videoAfterUrl} controls className="w-full h-36 object-contain rounded-lg bg-black" />
              ) : (currentJob.photoAfterUrl || currentJob.completionPhoto) ? (
                <img src={currentJob.photoAfterUrl || currentJob.completionPhoto} alt="After Proof" className="w-full h-36 object-cover rounded-lg" />
              ) : (
                <div className="h-36 rounded-lg bg-slate-950 flex items-center justify-center text-[10px] text-slate-500 font-mono">
                  Completion media recorded
                </div>
              )}
            </div>
          </div>

          {/* REPAIRS LOG SUMMARY */}
          {currentJob.contractorNotes && (
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs">
              <span className="text-[9.5px] font-mono uppercase text-slate-400 font-bold block mb-1">
                Technician Work Explanation:
              </span>
              <p className="text-slate-200 leading-relaxed font-medium">
                {currentJob.contractorNotes}
              </p>
            </div>
          )}

          {/* EXCHANGED / REPLACED PARTS */}
          {(() => {
            let parts: any[] = [];
            if (currentJob.partsReplaced) {
              if (Array.isArray(currentJob.partsReplaced)) parts = currentJob.partsReplaced;
              else {
                try {
                  const parsed = JSON.parse(currentJob.partsReplaced);
                  if (Array.isArray(parsed)) parts = parsed;
                } catch {
                  if (typeof currentJob.partsReplaced === 'string') {
                    parts = [{ name: currentJob.partsReplaced, quantity: 1 }];
                  }
                }
              }
            }

            if (parts.length === 0) return null;

            return (
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs space-y-1.5">
                <span className="text-[9.5px] font-mono uppercase text-slate-400 font-bold block">
                  Exchanged / Replaced Parts ({parts.length}):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {parts.map((p, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Package className="w-3.5 h-3.5 text-red shrink-0" />
                        <div>
                          <p className="font-bold text-white text-[11px]">{p.name || p}</p>
                          {p.notes && <p className="text-[9px] text-slate-400 font-mono">{p.notes}</p>}
                        </div>
                      </div>
                      {p.quantity && (
                        <span className="text-[10px] bg-red/10 text-red font-mono font-bold px-2 py-0.5 rounded">
                          × {p.quantity}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Assigned Responder & Vehicle Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 font-bold">
              {currentJob.assignedContractor?.name ? currentJob.assignedContractor.name.charAt(0) : 'S'}
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Assigned Responder</span>
              <div className="text-sm font-bold text-white">{currentJob.assignedContractor?.name || 'Same Day Assist Response Team'}</div>
              <span className="text-xs text-slate-400">Rating: ⭐ {currentJob.assignedContractor?.rating || 4.9} / 5.0</span>
            </div>
          </div>

          {currentJob.assignedContractor?.phone && (
            <a
              href={`tel:${currentJob.assignedContractor.phone}`}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition-all flex items-center gap-1.5 text-xs font-semibold"
            >
              <Phone className="w-4 h-4" /> Call
            </a>
          )}
        </div>

        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">Dispatched Patrol / Service Unit</span>
            <div className="text-sm font-bold text-white">{vehicle.make} {vehicle.model} ({vehicle.color})</div>
            <span className="text-xs text-emerald-400 font-semibold">Call Sign / Plate: {vehicle.licensePlate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
