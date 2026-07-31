import React, { useState } from 'react';
import { Shield, FileCheck, Upload, AlertCircle, CheckCircle2, Award, Building, Lock } from 'lucide-react';
import { api } from '../../services/api';

interface ContractorVettingModalProps {
  user: any;
  onSuccess: () => void;
  onClose: () => void;
}

export function ContractorVettingModal({ user, onSuccess, onClose }: ContractorVettingModalProps) {
  const [yearsOfExperience, setYearsOfExperience] = useState(user?.yearsOfExperience || 3);
  const [businessLicenseUrl, setBusinessLicenseUrl] = useState(user?.businessLicenseUrl || '');
  const [taxClearanceUrl, setTaxClearanceUrl] = useState(user?.taxClearanceUrl || '');
  const [insuranceProofUrl, setInsuranceProofUrl] = useState(user?.insuranceProofUrl || '');
  const [policeClearanceUrl, setPoliceClearanceUrl] = useState(user?.policeClearanceUrl || '');
  const [tradeQualificationsUrl, setTradeQualificationsUrl] = useState(user?.tradeQualificationsUrl || '');
  const [suburbsCovered, setSuburbsCovered] = useState('Sandton, Randburg, Midrand, Rosebank, Fourways');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.applyVerification({
        yearsOfExperience,
        businessLicenseUrl: businessLicenseUrl || 'https://samedayassist.co.za/compliance/docs/bus_lic_sample.pdf',
        taxClearanceUrl: taxClearanceUrl || 'https://samedayassist.co.za/compliance/docs/tax_clearance_sample.pdf',
        insuranceProofUrl: insuranceProofUrl || 'https://samedayassist.co.za/compliance/docs/insurance_sample.pdf',
        policeClearanceUrl: policeClearanceUrl || 'https://samedayassist.co.za/compliance/docs/police_clearance_sample.pdf',
        tradeQualificationsUrl: tradeQualificationsUrl || 'https://samedayassist.co.za/compliance/docs/trade_cert_sample.pdf',
        coverageAreas: suburbsCovered.split(',').map(s => s.trim()),
      });

      setSubmitted(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit compliance documents.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 md:p-8 text-slate-100 shadow-2xl space-y-6">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red/10 border border-red/20 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-red" />
            </div>
            <div>
              <h2 className="text-lg font-brand-header uppercase tracking-wide text-white">
                Service Provider Compliance Vetting
              </h2>
              <p className="text-xs text-slate-400">
                Submit official credentials for Same Day Assist Administrator Verification
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xs font-mono">
            ESC ✕
          </button>
        </div>

        {submitted ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-2xl text-center space-y-3 font-mono">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h3 className="text-base font-bold text-white uppercase">Application Submitted Successfully</h3>
            <p className="text-xs text-slate-300">
              Your credentials are now under <b>Pending Review</b> by Same Day Assist Operations Administrators.
              You will be notified once verified!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red/10 border border-red/30 text-red text-xs p-3 rounded-xl flex items-center gap-2 font-mono">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300 uppercase tracking-wider text-[9.5px]">
                  Years of Industry Experience
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  required
                  value={yearsOfExperience}
                  onChange={e => setYearsOfExperience(parseInt(e.target.value, 10))}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-red font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 uppercase tracking-wider text-[9.5px]">
                  Service Coverage Suburbs (Comma-Separated)
                </label>
                <input
                  type="text"
                  required
                  value={suburbsCovered}
                  onChange={e => setSuburbsCovered(e.target.value)}
                  placeholder="e.g. Sandton, Randburg, Midrand"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-red"
                />
              </div>
            </div>

            {/* DOCUMENT UPLOAD PLACEHOLDERS */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-red block">
                Required Verification Certificates & Licences
              </span>

              {[
                { label: 'Company Registration / CIPC Certificate', state: businessLicenseUrl, setState: setBusinessLicenseUrl },
                { label: 'SARS Tax Clearance / PIN Certificate', state: taxClearanceUrl, setState: setTaxClearanceUrl },
                { label: 'Proof of Public Liability Insurance', state: insuranceProofUrl, setState: setInsuranceProofUrl },
                { label: 'Police Clearance Certificate (SAP 91a)', state: policeClearanceUrl, setState: setPoliceClearanceUrl },
                { label: 'Trade Qualifications / PSIRA Accreditation', state: tradeQualificationsUrl, setState: setTradeQualificationsUrl },
              ].map((doc, idx) => (
                <div key={idx} className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-white font-medium block">{doc.label}</span>
                      <span className="text-[9.5px] font-mono text-slate-500">
                        {doc.state ? 'URL attached' : 'Sample document will be generated upon submit'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => doc.setState(`https://samedayassist.co.za/docs/cert_${idx + 1}.pdf`)}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-700 hover:border-red text-[10px] font-mono rounded-lg text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
                  >
                    <Upload className="w-3 h-3" />
                    {doc.state ? 'Attached' : 'Attach PDF'}
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-red text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-red/90 transition-all flex items-center gap-2 cursor-pointer shadow-lg"
              >
                {loading ? 'Submitting...' : 'Submit Credentials for Verification'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
