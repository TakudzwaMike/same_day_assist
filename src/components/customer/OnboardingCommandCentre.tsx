import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Clock, Calendar, CheckCircle2, AlertCircle, FileText, 
  CreditCard, ArrowRight, UserCheck, MapPin, Phone, Award, Lock, Sparkles, Building2
} from 'lucide-react';
import { useAppState } from '../../contexts/AppStateContext';
import { Customer, CustomerStatus } from '../../types';
import { SERVICE_PACKAGES } from '../../data/staticData';

interface OnboardingCommandCentreProps {
  customer: Customer;
}

export default function OnboardingCommandCentre({ customer }: OnboardingCommandCentreProps) {
  const { state, processInitialPayment, activateCustomerAccount } = useAppState();

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'eft' | 'snapscan'>('card');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Status mapping
  const status: CustomerStatus = (customer.status as CustomerStatus) || (customer.onboardingStatus as CustomerStatus) || 'WAITING_FOR_SURVEY';
  const pkg = SERVICE_PACKAGES.find(p => p.name === customer.package) || SERVICE_PACKAGES[1]; // Platinum default

  // Calculate 50% of first month fee dynamically based on selected package monthly price
  const initialFeeNum = (pkg.price || 349) * 0.50;
  const initialFee = initialFeeNum % 1 === 0 ? initialFeeNum.toString() : initialFeeNum.toFixed(2);

  // Automatic Month 2 activation when waiting period expires in production
  useEffect(() => {
    if (status === 'WAITING_FOR_ACTIVATION' && customer.activationScheduledDate) {
      const scheduledTime = new Date(customer.activationScheduledDate).getTime();
      if (Date.now() >= scheduledTime) {
        activateCustomerAccount(customer.id);
      }
    }
  }, [status, customer.activationScheduledDate, customer.id, activateCustomerAccount]);

  // Matching enquiry
  const enquiry = state.enquiries.find(e => e.email === customer.email || e.customerName === customer.name);
  const surveyReport = customer.surveyReport || enquiry?.surveyReport;

  // Stages
  const stages = [
    { key: 'SUBMITTED', title: 'Submitted', done: true },
    { key: 'SURVEY', title: 'ONBOARDING SITE ASSESSMENT (MANDATORY)', done: ['SURVEY_SCHEDULED', 'SURVEY_IN_PROGRESS', 'SURVEY_COMPLETED', 'ADMIN_REVIEW', 'PAYMENT_REQUIRED', 'PAYMENT_RECEIVED', 'WAITING_FOR_ACTIVATION', 'ACTIVE'].includes(status) },
    { key: 'COMPLETED', title: 'Survey Completed', done: ['SURVEY_COMPLETED', 'ADMIN_REVIEW', 'PAYMENT_REQUIRED', 'PAYMENT_RECEIVED', 'WAITING_FOR_ACTIVATION', 'ACTIVE'].includes(status) },
    { key: 'REVIEW', title: 'Admin Review', done: ['PAYMENT_REQUIRED', 'PAYMENT_RECEIVED', 'WAITING_FOR_ACTIVATION', 'ACTIVE'].includes(status) },
    { key: 'PAYMENT', title: '50% Initial Payment', done: ['PAYMENT_RECEIVED', 'WAITING_FOR_ACTIVATION', 'ACTIVE'].includes(status) },
    { key: 'ACTIVATION', title: 'Month 2 Service Activation', done: status === 'ACTIVE' },
  ];

  const handlePayInitialFee = async () => {
    setIsProcessingPayment(true);
    try {
      await new Promise(res => setTimeout(res, 1200));
      await processInitialPayment(customer.id, initialFeeNum, paymentMethod.toUpperCase());
      alert(`Initial payment of R${initialFee} received! Your account is now in the activation waiting period.`);
    } catch (err: any) {
      alert(err.message || 'Payment processing failed');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleSimulateActivation = async () => {
    try {
      await activateCustomerAccount(customer.id);
      alert('Congratulations! Your Month 2 waiting period has concluded. Full Same Day Assist service catalogue is now ACTIVE!');
    } catch (err: any) {
      alert(err.message || 'Failed to activate account');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* BRANDING HEADER / COMMAND HUB TITLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl text-white relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-red-500 text-xs font-mono font-bold tracking-widest uppercase">
              <ShieldCheck className="w-4 h-4 text-red-500" />
              <span>Onboarding Command Centre • Account Portal</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black italic tracking-wide">
              {customer.name || 'Member Account'}
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              {customer.address} • {customer.package || 'Platinum'} Assist Coverage Plan
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl px-5 py-3 text-right">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-0.5">Current Lifecycle Status</span>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              <Clock className="w-3.5 h-3.5 animate-spin" />
              <span>{status.replace(/_/g, ' ')}</span>
            </div>
          </div>
        </div>

        {/* PROGRESS LIFECYCLE BAR */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {stages.map((st, idx) => (
              <div 
                key={st.key} 
                className={`p-3 rounded-2xl border text-center transition-all ${
                  st.done 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                    : idx === 1 && status === 'WAITING_FOR_SURVEY'
                    ? 'bg-amber-500/10 border-amber-500/50 text-amber-300 ring-2 ring-amber-500/30'
                    : status === st.key
                    ? 'bg-red-500/10 border-red-500/50 text-red-400 ring-2 ring-red-500/30'
                    : 'bg-slate-800/40 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-center mb-1.5">
                  {st.done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-slate-600 text-[10px] font-mono flex items-center justify-center">
                      {idx + 1}
                    </span>
                  )}
                </div>
                <div className="text-[10px] font-extrabold leading-tight">{st.title}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* STAGE-SPECIFIC ACTION & EXPLANATION CARDS */}

      {/* STAGE 1: WAITING FOR SURVEY */}
      {(status === 'WAITING_FOR_SURVEY' || status === 'APPLICATION_SUBMITTED') && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 text-slate-100 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-400 uppercase tracking-widest">Stage 1 of 4 — Assessment Pending</div>
              <h2 className="text-xl font-bold text-white mt-0.5">Waiting For Property Safety & Compliance Survey</h2>
              <p className="text-sm text-slate-400 leading-relaxed mt-2">
                Your Same Day Assist application has been successfully submitted. Our certified surveying team will conduct an initial property safety and compliance assessment of your residence/business at <span className="text-white font-medium">{customer.address}</span> before full account approval.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800 text-xs">
            <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-800">
              <div className="text-slate-400 mb-1">Requested Services</div>
              <div className="font-semibold text-white">{customer.package || 'Platinum'} Package Assistance</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-800">
              <div className="text-slate-400 mb-1">Inspector Status</div>
              <div className="font-semibold text-amber-400">Awaiting Admin Inspector Assignment</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-800">
              <div className="text-slate-400 mb-1">Expected Turnaround</div>
              <div className="font-semibold text-white">24 - 48 Hours</div>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 2: SURVEY ASSIGNED / SCHEDULED / IN PROGRESS */}
      {['SURVEY_ASSIGNED', 'SURVEY_SCHEDULED', 'SURVEY_IN_PROGRESS'].includes(status) && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 text-slate-100 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-blue-400 uppercase tracking-widest">Stage 2 of 4 — Survey Scheduled</div>
              <h2 className="text-xl font-bold text-white mt-0.5">Certified Inspector Assigned</h2>
              <p className="text-sm text-slate-400 leading-relaxed mt-2">
                Inspector <span className="text-white font-semibold">{customer.surveyInspectorName || 'Certified Same Day Assist Inspector'}</span> has been assigned to inspect your property at <span className="text-white font-medium">{customer.address}</span>.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-blue-500/10 border border-blue-500/30 space-y-2 text-xs">
            <div className="flex items-center justify-between text-blue-300 font-bold">
              <span>Inspection Schedule</span>
              <span>{customer.surveyScheduledDate || 'Today / Tomorrow'}</span>
            </div>
            <p className="text-slate-400">
              Please ensure gate access instructions and Next of Kin contacts are up to date. The inspector will present official Same Day Assist ID credentials upon arrival.
            </p>
          </div>
        </div>
      )}

      {/* STAGE 3: SURVEY COMPLETED / ADMIN REVIEW */}
      {['SURVEY_COMPLETED', 'ADMIN_REVIEW'].includes(status) && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 text-slate-100 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-purple-400 uppercase tracking-widest">Stage 3 of 4 — Administrative Audit</div>
              <h2 className="text-xl font-bold text-white mt-0.5">Survey Completed — Under Admin Review</h2>
              <p className="text-sm text-slate-400 leading-relaxed mt-2">
                Your property safety inspection report has been uploaded by the inspector and is currently under review by our Operations Administrator.
              </p>
            </div>
          </div>

          {surveyReport && (
            <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Inspector Safety Summary</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {surveyReport.recommendation?.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-slate-300 italic">"{surveyReport.safetyObservations}"</p>
              <div className="text-[11px] text-slate-400">Inspector: {surveyReport.inspectorName} • Date: {surveyReport.inspectionDate}</div>
            </div>
          )}
        </div>
      )}

      {/* STAGE 4: PAYMENT REQUIRED (ADMIN APPROVED) */}
      {(status === 'PAYMENT_REQUIRED' || status === 'APPLICATION_APPROVED') && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 text-slate-100 shadow-2xl relative overflow-hidden">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Application Approved!</div>
              <h2 className="text-xl md:text-2xl font-black text-white mt-0.5">50% Initial Activation Fee Required</h2>
              <p className="text-sm text-slate-300 leading-relaxed mt-1">
                Your property compliance survey has been fully reviewed and <span className="text-emerald-400 font-bold">APPROVED</span> by Same Day Assist Operations. Please complete your 50% initial activation payment below to initiate your activation waiting period.
              </p>
            </div>
          </div>

          {/* FEE BREAKDOWN CARD */}
          <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 border-b md:border-b-0 md:border-r border-slate-700 pb-4 md:pb-0 md:pr-6">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Selected Assist Package</div>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-bold text-white">{pkg.name}</span>
                <span className="text-sm font-mono text-slate-400">R{pkg.price} / month</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {pkg.benefits.map((b, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Initial Activation Payment (50%)</div>
                <div className="text-3xl font-black text-red-500 font-mono">
                  R{initialFee} <span className="text-xs font-sans text-slate-400 font-normal">Once-off Initial Fee</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Covers initial admin processing, verified GPS beacon allocation, and property compliance certification.
                </p>
              </div>

              {/* PAYMENT METHOD SELECTOR */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Select Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === 'card' 
                        ? 'bg-red-600 text-white border-red-500 shadow-md' 
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Credit Card</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('eft')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === 'eft' 
                        ? 'bg-red-600 text-white border-red-500 shadow-md' 
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Instant EFT</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('snapscan')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === 'snapscan' 
                        ? 'bg-red-600 text-white border-red-500 shadow-md' 
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>SnapScan</span>
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePayInitialFee}
                disabled={isProcessingPayment}
                className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-sm uppercase tracking-wider shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isProcessingPayment ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <span>Pay Initial Fee (R{initialFee})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 5: WAITING FOR ACTIVATION (POST-PAYMENT) */}
      {status === 'WAITING_FOR_ACTIVATION' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 text-slate-100 shadow-2xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-400 uppercase tracking-widest">Initial Payment Received ✓</div>
              <h2 className="text-xl md:text-2xl font-black text-white mt-0.5">Account In Activation Waiting Period</h2>
              <p className="text-sm text-slate-300 leading-relaxed mt-1">
                Your initial payment of <span className="text-emerald-400 font-bold">R{customer.initialPaymentAmount || initialFee}</span> has cleared. Your Same Day Assist account is currently in the mandatory onboarding waiting period and will reach <span className="text-white font-bold">FULL SERVICE ACTIVATION</span> in Month 2.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Scheduled Full Service Activation Date</div>
              <div className="text-2xl font-black text-white font-mono">
                {customer.activationScheduledDate 
                  ? new Date(customer.activationScheduledDate).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })
                  : '30 Days From Today'}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Upon reaching Month 2, your account status will automatically switch to ACTIVE, enabling 24/7 priority emergency dispatch.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSimulateActivation}
              className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold uppercase tracking-wider shadow-lg shadow-emerald-600/20 transition-all shrink-0 cursor-pointer flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Simulate Month 2 Activation</span>
            </button>
          </div>
        </div>
      )}

      {/* STAGE 6: ACTIVE */}
      {status === 'ACTIVE' && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-6 md:p-8 space-y-4 text-emerald-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
            <div>
              <h2 className="text-xl font-bold text-white">Full Service Active</h2>
              <p className="text-xs text-emerald-300">Your Same Day Assist account is 100% active with 24/7 priority emergency response.</p>
            </div>
          </div>
        </div>
      )}

      {/* MORE INFORMATION REQUIRED */}
      {status === 'MORE_INFORMATION_REQUIRED' && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-6 md:p-8 text-amber-200 space-y-4 shadow-xl">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-7 h-7 text-amber-400 shrink-0" />
            <div>
              <h2 className="text-lg font-bold text-white">More Information Required for Onboarding Approval</h2>
              <p className="text-xs text-amber-300/80">Action required: Our Operations Administrator requested additional property details or safety revisions.</p>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs space-y-2">
            <div className="font-bold text-white uppercase tracking-wider text-[11px]">Administrator Revision Prompt:</div>
            <p className="text-slate-300 italic">"{customer.adminReviewNotes || 'Please provide updated site entry directions or secondary emergency contact numbers.'}"</p>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => alert('Please submit updated details to info@samedayassist.co.za or update your account profile.')}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
            >
              Submit Requested Information
            </button>
          </div>
        </div>
      )}

      {/* REJECTED */}
      {status === 'APPLICATION_REJECTED' && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-6 md:p-8 text-red-300 space-y-3 shadow-xl">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-7 h-7 text-red-400 shrink-0" />
            <h2 className="text-lg font-bold text-white">Application Unsuccessful</h2>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {customer.adminReviewNotes || 'Your property compliance survey did not meet the required safety threshold for automatic dispatch.'}
          </p>
          <div className="text-xs text-slate-400 pt-2 border-t border-red-500/20">
            Platform services remain locked. Contact <a href="mailto:compliance@samedayassist.co.za" className="text-red-400 underline font-semibold">compliance@samedayassist.co.za</a> for administrative appeal.
          </div>
        </div>
      )}
    </div>
  );
}
