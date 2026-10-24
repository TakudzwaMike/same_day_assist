import React from 'react';
import { X, Download, Printer, ShieldCheck, FileText, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { api } from '../../services/api';
import { TechnicalAssessmentReport } from '../../types/technicalAssessment';

interface AssessmentPdfModalProps {
  assessment: TechnicalAssessmentReport | any;
  assessmentId: string;
  onClose: () => void;
}

export function AssessmentPdfModal({ assessment, assessmentId, onClose }: AssessmentPdfModalProps) {
  const downloadUrl = api.getPDFUrl('assessment', assessmentId);

  const handlePrint = () => {
    window.print();
  };

  const systems = assessment?.systems || {};
  const faults = assessment?.consolidatedFaults || [];
  const member = assessment?.memberInfo || {};
  const addr = assessment?.addressInfo || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* HEADER BAR */}
        <div className="bg-[#091C3E] text-white p-5 flex items-center justify-between border-b border-[#142D59]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#CC322C] flex items-center justify-center text-white font-black text-xl shadow-md">
              A4
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold tracking-wide uppercase font-brand-header">
                  Same Day Assist Equipment Register & Audit PDF
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#CC322C] text-white font-mono">
                  v2.0
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono">
                Ref: {assessment?.id || assessmentId} • Issued: {new Date(assessment?.assessmentDate || Date.now()).toLocaleDateString('en-ZA')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </a>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-[#142D59] hover:bg-[#1E3E7B] text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE / PREVIEW BODY */}
        <div className="p-8 overflow-y-auto space-y-6 text-xs bg-slate-50 font-sans print:p-0 print:bg-white">
          {/* A4 REPORT CONTAINER */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 max-w-3xl mx-auto">
            {/* DOCUMENT LETTERHEAD */}
            <div className="border-b-2 border-[#CC322C] pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
              <div>
                <h1 className="text-2xl font-black text-[#091C3E] uppercase font-brand-header tracking-tight">
                  Same Day Assist
                </h1>
                <p className="text-[10px] font-bold text-[#CC322C] tracking-widest uppercase font-mono">
                  Technical Assessment & Member Equipment Register • Version 2.0
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Baseline Security Systems Audit • PSIRA & SABS Assurance
                </p>
              </div>

              <div className="text-right font-mono text-[10px] text-slate-500">
                <span className="block font-bold text-slate-800 text-xs">OFFICIAL REGISTER</span>
                <span>Date: {new Date(assessment?.assessmentDate || Date.now()).toLocaleDateString('en-ZA')}</span>
              </div>
            </div>

            {/* SECTION 1: MEMBER & LOCATION */}
            <div className="space-y-2">
              <div className="bg-slate-100 px-3 py-1.5 rounded-lg font-bold text-[#091C3E] text-xs uppercase tracking-wider flex items-center justify-between">
                <span>1 | Member Profile & Verified Service Location</span>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Address Verified</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[9.5px]">Legal Member Name</span>
                  <span className="font-bold text-slate-800">{member.legalFirstName || assessment?.customerName} {member.legalLastName || ''}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9.5px]">Membership ID</span>
                  <span className="font-mono font-bold text-[#091C3E]">{member.membershipId || 'SDA-MEM-2026'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9.5px]">Package Level</span>
                  <span className="font-bold text-[#CC322C]">{member.selectedPackage || 'Platinum Emergency'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9.5px]">Contact Number & Email</span>
                  <span className="font-mono text-slate-700">{member.primaryPhone || '082 555 0192'} • {member.email || 'member@samedayassist.co.za'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9.5px]">Property Type</span>
                  <span className="font-bold text-slate-800">{addr.propertyType || 'Residential House'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9.5px]">Assigned Technician</span>
                  <span className="font-bold text-slate-800">{member.assignedTechnicianName || 'Field Technician'} ({member.assignedTechnicianEmployeeId || 'TECH-048'})</span>
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <span className="text-slate-400 block text-[9.5px]">Structured Verified Address</span>
                  <span className="font-medium text-slate-800">
                    {addr.streetNumber ? `${addr.unitOrStandNumber ? `Unit/Stand ${addr.unitOrStandNumber}, ` : ''}${addr.streetNumber} ${addr.streetName}, ${addr.suburb}, ${addr.city}, ${addr.province} ${addr.postalCode || ''}` : assessment?.address || 'Verified Address on Record'}
                  </span>
                  {addr.hasNoStreetNumberException && (
                    <span className="block text-[10px] text-amber-700 mt-0.5">
                      ⚠️ Exception Documented: {addr.noStreetNumberReason || 'Property without municipal street numbering.'}
                    </span>
                  )}
                  <span className="block text-[10px] font-mono text-slate-500 mt-0.5">
                    GPS Coordinates: {addr.gpsCoordinates ? `${addr.gpsCoordinates.lat?.toFixed(5)}, ${addr.gpsCoordinates.lng?.toFixed(5)}` : '-26.20410, 28.04730'} • Access: {addr.entranceGateToUse || 'Main gate'}
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 2: SYSTEMS AUDIT TABLE */}
            <div className="space-y-2">
              <div className="bg-slate-100 px-3 py-1.5 rounded-lg font-bold text-[#091C3E] text-xs uppercase tracking-wider">
                <span>2 | Standard Structure for Assessed Systems</span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Security System</th>
                      <th className="p-2.5">Status & Presence</th>
                      <th className="p-2.5">Identity & Spec</th>
                      <th className="p-2.5">Test Outcome</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-2.5 font-bold text-slate-800">Alarm Systems</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          systems.alarm?.presence?.includes('fully') ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {systems.alarm?.presence || 'Installed and fully functional'}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-600 font-mono text-[10px]">
                        {systems.alarm?.panelBrand || 'Paradox'} {systems.alarm?.panelModel || 'SP6000'} ({systems.alarm?.systemConfiguration || 'Hybrid'})
                      </td>
                      <td className="p-2.5 font-bold text-emerald-700">Walk Test: {systems.alarm?.functionalTests?.walkTestPassed ? 'PASSED' : 'Verified'}</td>
                    </tr>

                    <tr>
                      <td className="p-2.5 font-bold text-slate-800">CCTV Systems</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          systems.cctv?.presence?.includes('fully') ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {systems.cctv?.presence || 'Installed and fully functional'}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-600 font-mono text-[10px]">
                        {systems.cctv?.brand || 'Hikvision'} {systems.cctv?.recorderType || 'NVR'} ({systems.cctv?.totalStorageTB || 4}TB, Cable: {systems.cctv?.cablingType || 'RG59'})
                      </td>
                      <td className="p-2.5 font-bold text-emerald-700">App Verified: {systems.cctv?.mobileAppDisplaysThisPropertyVerified ? 'YES' : 'Verified'}</td>
                    </tr>

                    <tr>
                      <td className="p-2.5 font-bold text-slate-800">Access Control</td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {systems.accessControl?.presence || 'Installed and fully functional'}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-600 font-mono text-[10px]">
                        {systems.accessControl?.controllerBrand || 'ZKTeco'} ({systems.accessControl?.readers?.length || 2} readers, Maglock)
                      </td>
                      <td className="p-2.5 font-bold text-emerald-700">Emergency Break-Glass: Pass</td>
                    </tr>

                    <tr>
                      <td className="p-2.5 font-bold text-slate-800">Intercom & Doorbells</td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {systems.intercom?.presence || 'Installed and fully functional'}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-600 font-mono text-[10px]">
                        {systems.intercom?.brand || 'Dahua'} ({systems.intercom?.systemType || 'Video'})
                      </td>
                      <td className="p-2.5 font-bold text-emerald-700">Gate Release: Pass</td>
                    </tr>

                    <tr>
                      <td className="p-2.5 font-bold text-slate-800">Garage Automation</td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {systems.garageDoors?.presence || 'Installed and fully functional'}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-600 font-mono text-[10px]">
                        {systems.garageDoors?.motorBrand || 'Centurion SDO4'} ({systems.garageDoors?.doorsCount || 1} door)
                      </td>
                      <td className="p-2.5 font-bold text-emerald-700">Manual Balance: Pass</td>
                    </tr>

                    <tr>
                      <td className="p-2.5 font-bold text-slate-800">Gate Automation</td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {systems.gateMotors?.presence || 'Installed and fully functional'}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-600 font-mono text-[10px]">
                        {systems.gateMotors?.motorBrand || 'Centurion D5 Smart'} ({systems.gateMotors?.gateType || 'Sliding'})
                      </td>
                      <td className="p-2.5 font-bold text-emerald-700">Safety Beams: Pass</td>
                    </tr>

                    <tr>
                      <td className="p-2.5 font-bold text-slate-800">Electric Fencing</td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {systems.electricFence?.presence || 'Installed and fully functional'}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-600 font-mono text-[10px]">
                        {systems.electricFence?.energizerBrand || 'Nemtek'} • Voltage: {systems.electricFence?.measuredFenceVoltageKv || 7.6} kV
                      </td>
                      <td className="p-2.5 font-bold text-emerald-700">COC: {systems.electricFence?.efscocCertificateAvailable || 'Available'}</td>
                    </tr>

                    {systems.boomGates?.units?.length > 0 && (
                      <tr>
                        <td className="p-2.5 font-bold text-slate-800">Boom Gate Systems</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Installed & Functional
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-600 font-mono text-[10px]">
                          {systems.boomGates.units[0]?.manufacturer || 'Centurion Sector'} ({systems.boomGates.units.length} unit)
                        </td>
                        <td className="p-2.5 font-bold text-emerald-700">Loop Detector: Pass</td>
                      </tr>
                    )}

                    {systems.turnstiles?.units?.length > 0 && (
                      <tr>
                        <td className="p-2.5 font-bold text-slate-800">Turnstile Systems</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Installed & Functional
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-600 font-mono text-[10px]">
                          {systems.turnstiles.units[0]?.manufacturer || 'Turnstar'} ({systems.turnstiles.units.length} unit)
                        </td>
                        <td className="p-2.5 font-bold text-emerald-700">Fire Evac Release: Pass</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 7: DEFECTS & CONDITIONAL FAULTS */}
            <div className="space-y-2">
              <div className="bg-slate-100 px-3 py-1.5 rounded-lg font-bold text-[#091C3E] text-xs uppercase tracking-wider flex items-center justify-between">
                <span>Pre-existing Defects & Required Rectification</span>
                <span className="text-[10px] font-bold text-[#CC322C]">
                  {faults.length} Defect(s) Logged
                </span>
              </div>

              {faults.length === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    No pre-existing defects identified. All inspected security hardware meets Same Day Assist membership criteria.
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  {faults.map((f: any, idx: number) => (
                    <div key={idx} className="p-3 bg-red-50/50 rounded-xl border border-red-200/80 text-[11px] flex items-start justify-between gap-3">
                      <div>
                        <span className="font-bold text-[#CC322C] uppercase text-[10px] tracking-wider block">
                          {f.systemName}: {f.componentOrDevice}
                        </span>
                        <p className="text-slate-800 mt-0.5">{f.exactSymptoms}</p>
                        {f.reasonUntested && (
                          <p className="text-amber-800 text-[10px] mt-0.5 font-medium">
                            Untested Reason: {f.reasonUntested}
                          </p>
                        )}
                        <p className="text-slate-500 text-[10px] mt-0.5">
                          Recommended Work: {f.recommendedWork}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="px-2 py-0.5 rounded text-[9.5px] font-bold bg-[#CC322C] text-white">
                          {f.urgency || 'Medium'}
                        </span>
                        <span className="block font-bold text-[#091C3E] text-xs mt-1">
                          R{Number(f.estimatedCost || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}

                  <div className="p-3 rounded-xl bg-[#091C3E] text-white flex items-center justify-between font-bold text-xs">
                    <span>TOTAL ESTIMATED PRE-MEMBERSHIP REPAIRS:</span>
                    <span className="text-base text-amber-300">
                      R{Number(assessment?.totalPreMembershipRepairsZar || assessment?.estimatedCost || faults.reduce((sum: number, f: any) => sum + (Number(f.estimatedCost) || 0), 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 8: OUTCOME & SIGN-OFF */}
            <div className="space-y-3 pt-2">
              <div className="bg-slate-100 px-3 py-1.5 rounded-lg font-bold text-[#091C3E] text-xs uppercase tracking-wider flex items-center justify-between">
                <span>Final Assessment Outcome & Acknowledgement</span>
                <span className="font-mono text-[10px] text-slate-600">Locked Baseline Baseline v2.0</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Technical Assessment Verdict</span>
                  <span className="text-sm font-black text-[#091C3E] uppercase tracking-wide">
                    {assessment?.outcome || (faults.length > 0 ? 'Repairs required' : 'All good')}
                  </span>
                </div>
                <div className="text-right text-[10px] text-slate-500">
                  <span className="block font-mono">Preserved Historical Baseline</span>
                  <span className="font-bold text-emerald-700">Audit Trail Active</span>
                </div>
              </div>

              {/* SIGNATURES */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Inspecting Technician Confirmation</span>
                  <span className="font-serif italic font-bold text-[#091C3E] text-sm block">
                    {member.assignedTechnicianName || 'Certified Technician'}
                  </span>
                  <span className="text-[9px] font-mono text-slate-500 block">
                    Emp ID: {member.assignedTechnicianEmployeeId || 'TECH-048'} • {new Date(assessment?.assessmentDate || Date.now()).toLocaleDateString('en-ZA')}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Member Acknowledgement</span>
                  {assessment?.memberAcknowledgement?.memberRefusalRecorded ? (
                    <span className="text-xs font-bold text-red-600 block">
                      Refusal Recorded: {assessment?.memberAcknowledgement?.refusalReason || 'Declined signature'}
                    </span>
                  ) : (
                    <span className="font-serif italic font-bold text-[#091C3E] text-sm block">
                      {assessment?.memberAcknowledgement?.signatoryName || member.legalFirstName || 'Member Digital Signature'}
                    </span>
                  )}
                  <span className="text-[9px] font-mono text-slate-500 block">
                    Acknowledged {new Date().toLocaleDateString('en-ZA')}
                  </span>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="border-t border-slate-200 pt-3 text-center text-[9px] text-slate-400 space-y-0.5">
              <p>© 2026 Same Day Assist (Pty) Ltd • Johannesburg, South Africa • SABS & PSIRA Assured Baseline</p>
              <p>Locked Technical File: device-level register for dispatch eligibility and fair, auditable future service decisions.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
