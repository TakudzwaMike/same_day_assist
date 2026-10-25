import React, { useState } from 'react';
import { 
  Bell, BookOpen, FileText, Video, CheckCircle2, AlertCircle, 
  Download, Eye, Award, Clock, ChevronRight, ShieldCheck, 
  ExternalLink, Search, Check, FileCheck, ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAppState } from '../../contexts/AppStateContext';

export function TechnicalTeamHub() {
  const { user } = useAuth();
  const { addAuditLogLocal } = useAppState();

  const [activeTab, setActiveTab] = useState<'announcements' | 'training' | 'compliance' | 'records'>('announcements');
  const [selectedTrainingModal, setSelectedTrainingModal] = useState<any | null>(null);

  // 1. Company Announcements & Operational Updates
  const [announcements, setAnnouncements] = useState([
    {
      id: 'ANN-2026-042',
      title: 'Severe Highveld Thunderstorm & Surge Protection Incident Protocols',
      category: 'Operational Directive',
      date: '24 Oct 2026, 08:30 AM',
      author: 'Operations Director (Sandton Command)',
      summary: 'With predicted afternoon lightning storms across Johannesburg North and Midrand, all responders must prioritize secondary earth spike integrity and surge arrestor replacements on gate motors and alarm power supplies.',
      acknowledged: true,
      acknowledgedAt: '2026-10-24 09:12',
    },
    {
      id: 'ANN-2026-039',
      title: 'Customer 5-Star Rating Incentive Credit System Launched',
      category: 'Rewards & Incentives',
      date: '21 Oct 2026, 14:00 PM',
      author: 'Managing Director & Operations Oversight',
      summary: 'Every completed dispatch receiving an independent 5-star customer feedback rating automatically generates a +R100 incentive credit to your annual retention pool (e.g. 30 jobs = R3,000/mo, R36,000/year). Maintain outstanding client professionalism!',
      acknowledged: true,
      acknowledgedAt: '2026-10-21 15:45',
    },
    {
      id: 'ANN-2026-037',
      title: 'Mandatory Centurion D5 Smart FW 2.1 Firmware Update SOP',
      category: 'Technical Bulletin',
      date: '16 Oct 2026, 10:15 AM',
      author: 'Technical Support Head',
      summary: 'Centurion Systems has released critical firmware 2.1 addressing anti-crush inductive encoder false triggers. Review the attached SOP PDF before performing gate controller replacements.',
      acknowledged: false,
    },
  ]);

  // 2. Training PDFs, Reference Documents & Video Modules
  const [trainingModules, setTrainingModules] = useState([
    {
      id: 'TRN-01',
      title: 'Centurion Smart Gate Automation Diagnostics & SANS Compliance',
      type: 'PDF Document',
      duration: '15 min read',
      category: 'Gate Automation',
      description: 'Step-by-step diagnostic tree for D5/D10 Smart controllers, inductive safety beams, encoder calibration, and mechanical torque limits.',
      completed: true,
      pdfUrl: '#',
    },
    {
      id: 'TRN-02',
      title: 'Nemtek 8kV Electric Fence Safety & Earth Return Troubleshooting',
      type: 'PDF Document',
      duration: '20 min read',
      category: 'Perimeter Security',
      description: 'SANS 10222-3 installation rules, loop resistance calculations, high-voltage isolator checks, and lightning surge ground bonding.',
      completed: true,
      pdfUrl: '#',
    },
    {
      id: 'TRN-03',
      title: 'Hikvision & Dahua NVR IP Camera Network Diagnostics',
      type: 'Video Training Module',
      duration: '18 min video',
      category: 'CCTV Systems',
      description: 'PoE power budgeting, subnet addressing, motion-detection tripwire configuration, and cloud P2P mobile app pairing.',
      completed: false,
      videoLength: '18:24',
    },
    {
      id: 'TRN-04',
      title: 'Same Day Assist 5-Star Customer Protocol & Service Etiquette',
      type: 'Video Training Module',
      duration: '12 min video',
      category: 'Customer Excellence',
      description: 'On-site arrival greetings, neat tool handling, customer walkthrough explanations, and clean job card handovers.',
      completed: true,
      videoLength: '12:15',
    },
  ]);

  // 3. Document Acknowledgement & Training History
  const [historyRecords] = useState([
    {
      date: '24 Oct 2026',
      document: 'Highveld Lightning Incident Protocol (ANN-042)',
      type: 'Notice Acknowledged',
      status: 'Verified ✓',
    },
    {
      date: '21 Oct 2026',
      document: 'Customer 5★ Rating Incentive System (ANN-039)',
      type: 'Notice Acknowledged',
      status: 'Verified ✓',
    },
    {
      date: '18 Oct 2026',
      document: 'Centurion Smart Gate Diagnostics Module',
      type: 'Training Completed',
      status: 'Passed (100%)',
    },
    {
      date: '12 Oct 2026',
      document: 'Nemtek Electric Fence SANS 10222-3 Safety Audit',
      type: 'Training Completed',
      status: 'Passed (100%)',
    },
  ]);

  const handleAcknowledgeAnnouncement = (id: string) => {
    setAnnouncements(prev => prev.map(a => {
      if (a.id === id) {
        return {
          ...a,
          acknowledged: true,
          acknowledgedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        };
      }
      return a;
    }));
    addAuditLogLocal('Notice Acknowledged', `Technician ${user?.name || 'Technician'} confirmed operational announcement ${id}.`);
  };

  const handleCompleteTraining = (id: string) => {
    setTrainingModules(prev => prev.map(m => {
      if (m.id === id) {
        return { ...m, completed: true };
      }
      return m;
    }));
    addAuditLogLocal('Training Completed', `Technician completed training module ${id}. Certificate recorded.`);
    alert('Training module completed successfully! Document history updated.');
  };

  return (
    <div className="flex flex-col gap-6 text-zinc-100 animate-fadeIn">
      {/* HEADER SECTION */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 uppercase">
            Internal Communications & Technical Academy • Item 18
          </span>
          <h2 className="text-xl font-black italic tracking-wide uppercase text-white font-brand-header">
            Technical Team Communication & Training Hub
          </h2>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            Access all company directives, SOP reference PDFs, training videos, and compliance records remotely.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#091C3E] border border-cyan-500/30 px-3.5 py-2 rounded-2xl">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold text-white">Technician Portal: Active</span>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 overflow-x-auto whitespace-nowrap">
        <button
          type="button"
          onClick={() => setActiveTab('announcements')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'announcements'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Operational Updates & Announcements</span>
          {announcements.filter(a => !a.acknowledged).length > 0 && (
            <span className="bg-amber-400 text-slate-950 font-bold px-1.5 py-0.2 rounded-full text-[10px]">
              {announcements.filter(a => !a.acknowledged).length} New
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('training')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'training'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Training PDFs & Video Modules</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('records')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'records'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>Acknowledgement & Training History</span>
        </button>
      </div>

      {/* TAB 1: ANNOUNCEMENTS */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className={`p-6 rounded-3xl border transition-all ${
                !ann.acknowledged
                  ? 'bg-zinc-900 border-amber-500/40 shadow-lg'
                  : 'bg-zinc-900/80 border-zinc-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 px-2.5 py-0.5 rounded-full">
                    {ann.category}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">Ref: {ann.id}</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-400">{ann.date}</span>
              </div>

              <h3 className="text-base font-bold text-white mb-2">{ann.title}</h3>
              <p className="text-xs text-zinc-300 leading-relaxed max-w-3xl mb-4">{ann.summary}</p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-zinc-800 pt-3 text-xs">
                <span className="text-[11px] font-mono text-zinc-400">Issued by: {ann.author}</span>

                {!ann.acknowledged ? (
                  <button
                    type="button"
                    onClick={() => handleAcknowledgeAnnouncement(ann.id)}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer uppercase tracking-wider font-mono shadow-md"
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirm Notice Receipt</span>
                  </button>
                ) : (
                  <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Acknowledged on {ann.acknowledgedAt}</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: TRAINING PDFS & VIDEOS */}
      {activeTab === 'training' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trainingModules.map((mod) => (
            <div
              key={mod.id}
              className="bg-zinc-900 border border-zinc-800 hover:border-cyan-500/40 rounded-3xl p-6 flex flex-col justify-between gap-4 transition-all shadow-lg"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-cyan-950 text-cyan-400 border border-cyan-800 rounded-xl">
                      {mod.type.includes('Video') ? <Video className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                    </span>
                    <span className="text-[10px] font-mono uppercase text-cyan-300 font-bold bg-zinc-800 px-2 py-0.5 rounded">
                      {mod.category}
                    </span>
                  </div>

                  {mod.completed ? (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 border border-emerald-800 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Certified
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-950 border border-amber-800 px-2.5 py-0.5 rounded-full font-bold">
                      Incomplete
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-bold text-white pt-1">{mod.title}</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">{mod.description}</p>
              </div>

              <div className="border-t border-zinc-800 pt-3 flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-500 text-[10px]">{mod.duration}</span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      alert(`Opening ${mod.title} resource viewer...`);
                    }}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl font-bold flex items-center gap-1 cursor-pointer transition-all text-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Resource</span>
                  </button>

                  {!mod.completed && (
                    <button
                      type="button"
                      onClick={() => handleCompleteTraining(mod.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1 cursor-pointer transition-all text-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Complete Module</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: RECORDS & COMPLIANCE HISTORY */}
      {activeTab === 'records' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white font-brand-header">
                Read, Acknowledgment & Training Completion Ledger
              </h3>
              <p className="text-[10px] text-zinc-400 font-mono">
                Permanent auditable log of signed directives and technical certifications.
              </p>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 border border-emerald-800 px-3 py-1 rounded-xl font-bold">
              100% Remote Compliance
            </span>
          </div>

          <div className="divide-y divide-zinc-800/80">
            {historyRecords.map((rec, i) => (
              <div key={i} className="p-4 hover:bg-zinc-950/50 transition-all flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-white font-bold block">{rec.document}</span>
                    <span className="text-zinc-500 text-[10px]">{rec.type} • {rec.date}</span>
                  </div>
                </div>
                <span className="text-emerald-400 font-bold text-xs bg-emerald-950/60 border border-emerald-800 px-2.5 py-0.5 rounded-full">
                  {rec.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
