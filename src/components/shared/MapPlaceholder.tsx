import React from 'react';
import { MapPin, Zap } from 'lucide-react';

interface MapPlaceholderProps {
  contractorName?: string;
  contractorRole?: string;
  trackerProgress?: number;
  status?: string;
  customerAddress?: string;
  heightClass?: string;
}

export default function MapPlaceholder({
  contractorName = 'Officer Sipho',
  contractorRole = 'Security',
  trackerProgress = 0,
  status = 'Requested',
  customerAddress = 'Sandton, JHB',
  heightClass = 'h-36',
}: MapPlaceholderProps) {
  // Simple CSS calculations matching original animation path
  const showVehicle = status !== 'Requested' && status !== 'Closed' && status !== 'Completed';
  
  // Calculate vehicle coordinates along path
  // Start: bottom-left (15%, 85%), End: top-right (75%, 35%)
  const startX = 15;
  const startY = 85;
  const endX = 75;
  const endY = 35;
  
  // Interpolated progress
  const progressRatio = Math.min(100, Math.max(0, trackerProgress)) / 100;
  const vehicleX = startX + (endX - startX) * progressRatio;
  const vehicleY = startY + (endY - startY) * progressRatio;

  return (
    <div className={`relative w-full ${heightClass} bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-inner`}>
      {/* Grid background representing street mapping */}
      <div className="absolute inset-0 bg-slate-100 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:16px_16px] opacity-60"></div>
      
      {/* City Landmarks */}
      <span className="absolute top-2.5 left-4 text-[8px] font-bold text-slate-400 font-mono tracking-wider uppercase">Sandton HQ Dispatch Area</span>
      <span className="absolute bottom-2.5 right-4 text-[8px] font-bold text-slate-400 font-mono tracking-wider uppercase">Rosebank Depot</span>
      <span className="absolute top-1/2 left-4 text-[8px] font-bold text-slate-300 font-mono tracking-wider uppercase">M1 Freeway</span>
      
      {/* Customer / Dispatch Destination Pin */}
      <div className="absolute top-[35%] left-[75%] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 animate-pulse">
        <div className="w-3.5 h-3.5 bg-navy/15 rounded-full animate-ping absolute"></div>
        <MapPin className="w-5 h-5 text-navy relative" />
        <span className="text-[7.5px] font-bold text-navy bg-white border border-slate-200 px-1 rounded shadow-xs mt-0.5 whitespace-nowrap">
          {customerAddress.split(',')[0] || 'My Home'}
        </span>
      </div>

      {/* Dispatch Route Line */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <line 
          x1={`${startX}%`} y1={`${startY}%`} 
          x2={`${endX}%`} y2={`${endY}%`} 
          stroke="#CC322C" 
          strokeWidth="1.75" 
          strokeDasharray="5 3" 
          className="animate-[dash_2.5s_linear_infinite]"
        />
        <style>{`
          @keyframes dash {
            to {
              stroke-dashoffset: -20;
            }
          }
        `}</style>
      </svg>

      {/* Contractor patrol vehicle cruiser */}
      {showVehicle && (
        <div 
          className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 z-20 flex flex-col items-center"
          style={{
            top: `${vehicleY}%`,
            left: `${vehicleX}%`
          }}
        >
          <div className="w-3.5 h-3.5 bg-red/20 rounded-full animate-ping absolute"></div>
          <Zap className="w-4 h-4 text-red fill-white relative filter drop-shadow-xs" />
          <span className="text-[7.5px] font-bold text-red bg-white border border-red/10 px-1.5 py-0.5 rounded shadow-xs mt-0.5 whitespace-nowrap">
            {contractorName} ({contractorRole})
          </span>
        </div>
      )}

      {/* Future API Hookup indicator (SABS GPS verification overlay) */}
      <div className="absolute bottom-2 left-3 bg-navy/85 backdrop-blur-xs px-2 py-0.5 rounded border border-navy-light text-[7px] text-slate-300 font-mono tracking-tight flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
        <span>GPS SIM LINK ACTIVE</span>
      </div>
    </div>
  );
}
