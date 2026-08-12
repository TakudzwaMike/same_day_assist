import React, { useState } from 'react';
import { Shield, User, Building2, MapPin, Wrench, Bell, Lock, CheckCircle2, ChevronRight, ChevronLeft, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { ServiceCategory } from '../../types';

interface OnboardingWizardProps {
  onComplete: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function OnboardingWizard({ onComplete, onCancel }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Password visibility controls
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Personal
    name: '',
    email: '',
    phone: '',
    secondaryPhone: '',
    idNumber: '',

    // Step 2: Account Type
    accountType: 'Individual' as 'Individual' | 'Business',
    companyName: '',
    companyRegNumber: '',
    vatNumber: '',
    industry: '',

    // Step 3: Address
    primaryAddress: '',
    primaryLabel: 'Main Residence',
    accessNotes: '',

    // Step 4: Preferred Services
    preferredServices: ['Security Systems Assistance'] as ServiceCategory[],

    // Step 5: Communication & Next of Kin Details
    preferredContactMethod: 'Email' as 'Email' | 'SMS' | 'WhatsApp' | 'Push',
    emergencyContactName: '',
    emergencyContactPhone: '',
    requestOnboardingSurvey: true,
    communicationPreferences: {
      marketing: false,
      smsAlerts: true,
      emailInvoices: true,
    },

    // Step 6: Security Verification
    password: '',
    confirmPassword: '',
    termsAccepted: false,
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleService = (service: ServiceCategory) => {
    setFormData(prev => {
      const exists = prev.preferredServices.includes(service);
      const updated = exists
        ? prev.preferredServices.filter(s => s !== service)
        : [...prev.preferredServices, service];
      return { ...prev, preferredServices: updated };
    });
  };

  const validateStep = (currentStep: number) => {
    setErrorMessage(null);
    if (currentStep === 1) {
      if (!formData.name.trim()) return 'Full Name is required';
      if (!formData.email.trim() || !formData.email.includes('@')) return 'A valid Email Address is required';
      if (!formData.phone.trim()) return 'Primary Phone Number is required';
    } else if (currentStep === 2) {
      if (formData.accountType === 'Business' && !formData.companyName.trim()) {
        return 'Company Name is required for Business accounts';
      }
    } else if (currentStep === 3) {
      if (!formData.primaryAddress.trim()) return 'Physical Address is required';
    } else if (currentStep === 4) {
      if (formData.preferredServices.length === 0) return 'Please select at least one preferred service category';
    } else if (currentStep === 6) {
      if (!formData.password || formData.password.length < 5) return 'Password must be at least 5 characters long';
      if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
      if (!formData.termsAccepted) return 'You must accept the terms of service to proceed';
    }
    return null;
  };

  const handleNext = () => {
    const error = validateStep(step);
    if (error) {
      setErrorMessage(error);
      return;
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setErrorMessage(null);
    setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    const error = validateStep(6);
    if (error) {
      setErrorMessage(error);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        secondaryPhone: formData.secondaryPhone || undefined,
        idNumber: formData.idNumber || undefined,
        accountType: formData.accountType,
        companyName: formData.accountType === 'Business' ? formData.companyName : undefined,
        companyRegNumber: formData.accountType === 'Business' ? formData.companyRegNumber : undefined,
        vatNumber: formData.accountType === 'Business' ? formData.vatNumber : undefined,
        industry: formData.accountType === 'Business' ? formData.industry : undefined,
        address: formData.primaryAddress,
        preferredContactMethod: formData.preferredContactMethod,
        emergencyContactName: formData.emergencyContactName || undefined,
        emergencyContactPhone: formData.emergencyContactPhone || undefined,
        requestOnboardingSurvey: formData.requestOnboardingSurvey,
        preferredServices: formData.preferredServices,
        communicationPreferences: formData.communicationPreferences,
        password: formData.password,
        savedLocations: [
          {
            label: formData.primaryLabel,
            address: formData.primaryAddress,
            lat: -26.2041,
            lng: 28.0473,
            accessNotes: formData.accessNotes,
          },
        ],
      };

      await onComplete(payload);
    } catch (err: any) {
      setErrorMessage(err.message || 'Onboarding submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepsList = [
    { num: 1, title: 'Personal', icon: User },
    { num: 2, title: 'Account Type', icon: Building2 },
    { num: 3, title: 'Address', icon: MapPin },
    { num: 4, title: 'Services', icon: Wrench },
    { num: 5, title: 'Preferences', icon: Bell },
    { num: 6, title: 'Security', icon: Lock },
    { num: 7, title: 'Review', icon: CheckCircle2 },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 max-w-4xl mx-auto shadow-2xl text-slate-100">
      {/* Header */}
      <div className="flex justify-between items-center pb-6 border-b border-slate-800 mb-6">
        <div>
          <div className="flex items-center gap-2.5 text-red-500 font-semibold tracking-wider text-xs uppercase mb-1">
            <img src="/logo.png" alt="Same Day Assist Logo" className="w-7 h-7 rounded-full object-contain bg-white p-0.5 shadow-md shrink-0" />
            <span>Enterprise Customer Onboarding</span>
          </div>
          <h2 className="text-2xl font-bold text-white">Complete Profile Generation</h2>
          <p className="text-sm text-slate-400">Step {step} of 7 — {stepsList[step - 1].title}</p>
        </div>
        <button
          onClick={onCancel}
          className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700"
        >
          Cancel
        </button>
      </div>

      {/* Progress Bar & Indicators */}
      <div className="flex items-center justify-between gap-1 sm:gap-3 mb-8 overflow-x-auto pb-2 scrollbar-none">
        {stepsList.map(item => {
          const Icon = item.icon;
          const isActive = item.num === step;
          const isDone = item.num < step;
          return (
            <div key={item.num} className="flex-1 min-w-[38px] sm:min-w-[50px] text-center shrink-0">
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 mx-auto rounded-xl flex items-center justify-center transition-all ${
                  isDone
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                    : isActive
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className={`text-[9px] sm:text-[10px] mt-1.5 block font-medium leading-tight text-center ${isActive ? 'text-white font-bold' : 'text-slate-500 hidden sm:block'}`}>
                {item.title}
              </span>
            </div>
          );
        })}
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* STEP CONTENT */}
      <div className="space-y-6 min-h-[320px]">
        {/* STEP 1: Personal Details */}
        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => handleChange('name', e.target.value)}
                placeholder="e.g. Takudzwa Mike"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Primary Email Address *</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => handleChange('email', e.target.value)}
                placeholder="mike@samedayassist.co.za"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Primary Phone Number *</label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => handleChange('phone', e.target.value)}
                placeholder="+27 82 555 1000"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Secondary / Landline Phone</label>
              <input
                type="text"
                value={formData.secondaryPhone}
                onChange={e => handleChange('secondaryPhone', e.target.value)}
                placeholder="+27 11 555 9111"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">ID or Passport Number</label>
              <input
                type="text"
                value={formData.idNumber}
                onChange={e => handleChange('idNumber', e.target.value)}
                placeholder="e.g. 9001015800088 / Passport A1234567"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 text-sm"
              />
              <p className="text-[11px] text-slate-500 mt-1">Required for verified emergency response dispatch authorization.</p>
            </div>
          </div>
        )}

        {/* STEP 2: Account Type */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Account Type *</label>
              <p className="text-xs text-slate-400 mb-3">Select the type of account you are creating for Same Day Assist:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleChange('accountType', 'Individual')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    formData.accountType === 'Individual'
                      ? 'border-red-500 bg-red-500/10 text-white shadow-lg shadow-red-500/10'
                      : 'border-slate-800 bg-slate-800/50 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <User className="w-6 h-6 mb-2 text-red-400" />
                  <div className="font-semibold text-sm text-white">Personal Account</div>
                  <p className="text-xs text-slate-400 mt-1">Personal security, residential emergency assistance & home maintenance.</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleChange('accountType', 'Business')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    formData.accountType === 'Business'
                      ? 'border-red-500 bg-red-500/10 text-white shadow-lg shadow-red-500/10'
                      : 'border-slate-800 bg-slate-800/50 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Building2 className="w-6 h-6 mb-2 text-red-400" />
                  <div className="font-semibold text-sm text-white">Business Account</div>
                  <p className="text-xs text-slate-400 mt-1">Commercial properties, multiple sites, enterprise dispatch & billing.</p>
                </button>
              </div>
            </div>

            {formData.accountType === 'Business' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Registered Company Name *</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={e => handleChange('companyName', e.target.value)}
                    placeholder="e.g. Same Day Assist Holdings (Pty) Ltd"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Company Registration Number</label>
                  <input
                    type="text"
                    value={formData.companyRegNumber}
                    onChange={e => handleChange('companyRegNumber', e.target.value)}
                    placeholder="2026/123456/07"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">VAT Registration Number</label>
                  <input
                    type="text"
                    value={formData.vatNumber}
                    onChange={e => handleChange('vatNumber', e.target.value)}
                    placeholder="4123456789"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Industry / Sector</label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={e => handleChange('industry', e.target.value)}
                    placeholder="e.g. Real Estate & Commercial Facilities"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Address */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Address *</label>
              <input
                type="text"
                value={formData.primaryAddress}
                onChange={e => handleChange('primaryAddress', e.target.value)}
                placeholder="e.g. 88 Grayston Drive, Sandton, Johannesburg"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Address Label</label>
                <select
                  value={formData.primaryLabel}
                  onChange={e => handleChange('primaryLabel', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 text-sm"
                >
                  <option value="Home">Home</option>
                  <option value="Office">Office</option>
                  <option value="Warehouse">Warehouse</option>
                  <option value="Factory">Factory</option>
                  <option value="Branch">Branch</option>
                  <option value="Construction Site">Construction Site</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Site Access Instructions / Gate Code</label>
                <input
                  type="text"
                  value={formData.accessNotes}
                  onChange={e => handleChange('accessNotes', e.target.value)}
                  placeholder="e.g. Gate code #4092, Guard house check-in required"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Services */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Services</h3>
              <p className="text-xs text-slate-400 mb-3">Select from our available service offerings below:</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Security Systems Assistance (Active & Selectable) */}
              <button
                type="button"
                onClick={() => toggleService('Security Systems Assistance')}
                className={`p-4 rounded-xl border text-left transition-all flex items-start justify-between cursor-pointer ${
                  formData.preferredServices.includes('Security Systems Assistance')
                    ? 'bg-red-600/20 border-red-500 text-white shadow-lg shadow-red-600/10'
                    : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">Security Systems Assistance</span>
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">Active</span>
                  </div>
                  <p className="text-xs text-slate-400">Security monitoring, dispatch, emergency response & system installations.</p>
                </div>
                {formData.preferredServices.includes('Security Systems Assistance') && (
                  <CheckCircle2 className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                )}
              </button>

              {/* 2. Solar Systems Assistance (Greyed out / unavailable) */}
              <div className="p-4 rounded-xl border border-slate-800/60 bg-slate-800/20 text-slate-500 opacity-60 cursor-not-allowed flex items-start justify-between select-none">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-400">Solar Systems Assistance</span>
                    <span className="bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Unavailable</span>
                  </div>
                  <p className="text-xs text-slate-500">Planned expansion offering — currently unavailable for selection.</p>
                </div>
                <span className="text-slate-600 text-xs font-mono">○</span>
              </div>

              {/* 3. Electrical Assistance (Greyed out / unavailable) */}
              <div className="p-4 rounded-xl border border-slate-800/60 bg-slate-800/20 text-slate-500 opacity-60 cursor-not-allowed flex items-start justify-between select-none">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-400">Electrical Assistance</span>
                    <span className="bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Unavailable</span>
                  </div>
                  <p className="text-xs text-slate-500">Planned expansion offering — currently unavailable for selection.</p>
                </div>
                <span className="text-slate-600 text-xs font-mono">○</span>
              </div>

              {/* 4. Plumbing Assistance (Greyed out / unavailable) */}
              <div className="p-4 rounded-xl border border-slate-800/60 bg-slate-800/20 text-slate-500 opacity-60 cursor-not-allowed flex items-start justify-between select-none">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-400">Plumbing Assistance</span>
                    <span className="bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Unavailable</span>
                  </div>
                  <p className="text-xs text-slate-500">Planned expansion offering — currently unavailable for selection.</p>
                </div>
                <span className="text-slate-600 text-xs font-mono">○</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Communication Preferences & Next of Kin Details */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Communication & Next of Kin Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Preferred Contact Method</label>
                  <select
                    value={formData.preferredContactMethod}
                    onChange={e => handleChange('preferredContactMethod', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 text-sm"
                  >
                    <option value="Email">Email</option>
                    <option value="SMS">SMS</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Push">App Push Notification</option>
                  </select>
                </div>
              </div>
            </div>

            {/* NEXT OF KIN DETAILS SECTION */}
            <div className="pt-4 border-t border-slate-800">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Next of Kin Details</h3>
              <p className="text-xs text-slate-400 mb-3">Provide primary contact information for your next of kin in case of emergency response.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Next of Kin Full Name</label>
                  <input
                    type="text"
                    value={formData.emergencyContactName}
                    onChange={e => handleChange('emergencyContactName', e.target.value)}
                    placeholder="e.g. Sarah Molefe (Spouse / Next of Kin)"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Next of Kin Phone Number</label>
                  <input
                    type="text"
                    value={formData.emergencyContactPhone}
                    onChange={e => handleChange('emergencyContactPhone', e.target.value)}
                    placeholder="+27 82 999 0000"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* REQUEST ONBOARDING SURVEY OPTION (HIGH VISIBILITY) */}
            <div className="pt-4 border-t border-slate-800">
              <div className="p-4 rounded-xl border-2 border-red-500/60 bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-900 shadow-xl transition-all hover:border-red-500">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.requestOnboardingSurvey}
                    onChange={e => handleChange('requestOnboardingSurvey', e.target.checked)}
                    className="mt-1 w-5 h-5 rounded bg-slate-950 border-slate-600 text-red-600 focus:ring-red-500 shrink-0 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white tracking-wide uppercase">Request Onboarding Survey</span>
                      <span className="bg-red-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">Recommended</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Dispatch a certified Same Day Assist inspector to perform an initial property safety & compliance assessment upon registration.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: Security Verification */}
        {step === 6 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Account Passcode / Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={e => handleChange('password', e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-4 pr-12 py-3 text-white focus:outline-none focus:border-red-500 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white transition-colors p-0.5 rounded-md hover:bg-slate-700/50 cursor-pointer"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Confirm Passcode *</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={e => handleChange('confirmPassword', e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-4 pr-12 py-3 text-white focus:outline-none focus:border-red-500 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white transition-colors p-0.5 rounded-md hover:bg-slate-700/50 cursor-pointer"
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.termsAccepted}
                  onChange={e => handleChange('termsAccepted', e.target.checked)}
                  className="mt-1 rounded bg-slate-800 border-slate-700 text-red-600 focus:ring-0 cursor-pointer"
                />
                <span className="text-xs text-slate-400">
                  I agree to Same Day Assist Service Terms, Emergency Dispatch Protocols, and 60-day profile data integrity policies.
                </span>
              </label>
            </div>
          </div>
        )}

        {/* STEP 7: Review & Submit */}
        {step === 7 && (
          <div className="space-y-4 bg-slate-950/50 p-4 md:p-6 rounded-xl border border-slate-800">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 pb-2 border-b border-slate-800">Onboarding Profile Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 text-xs">
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                <span className="text-slate-500 block font-mono text-[10px] uppercase mb-0.5">Name</span>
                <span className="font-semibold text-white break-words">{formData.name}</span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                <span className="text-slate-500 block font-mono text-[10px] uppercase mb-0.5">Email</span>
                <span className="font-semibold text-white break-all">{formData.email}</span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                <span className="text-slate-500 block font-mono text-[10px] uppercase mb-0.5">Phone</span>
                <span className="font-semibold text-white break-words">{formData.phone}</span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                <span className="text-slate-500 block font-mono text-[10px] uppercase mb-0.5">Account Type</span>
                <span className="font-semibold text-red-400 break-words">{formData.accountType === 'Business' ? 'Business Account' : 'Personal Account'}</span>
              </div>
              {formData.accountType === 'Business' && (
                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                  <span className="text-slate-500 block font-mono text-[10px] uppercase mb-0.5">Company</span>
                  <span className="font-semibold text-white break-words">{formData.companyName}</span>
                </div>
              )}
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 sm:col-span-2 md:col-span-1">
                <span className="text-slate-500 block font-mono text-[10px] uppercase mb-0.5">Address</span>
                <span className="font-semibold text-white break-words leading-relaxed">{formData.primaryAddress}</span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 col-span-1 sm:col-span-2">
                <span className="text-slate-500 block font-mono text-[10px] uppercase mb-0.5">Preferred Services ({formData.preferredServices.length})</span>
                <span className="font-semibold text-slate-300 break-words leading-relaxed">{formData.preferredServices.join(', ')}</span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                <span className="text-slate-500 block font-mono text-[10px] uppercase mb-0.5">Onboarding Survey</span>
                <span className={`font-semibold ${formData.requestOnboardingSurvey ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {formData.requestOnboardingSurvey ? 'Requested ✓' : 'Not Requested'}
                </span>
              </div>
              {formData.emergencyContactName && (
                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 col-span-1 sm:col-span-2 md:col-span-3">
                  <span className="text-slate-500 block font-mono text-[10px] uppercase mb-0.5">Next of Kin Details</span>
                  <span className="font-semibold text-white break-words">{formData.emergencyContactName} ({formData.emergencyContactPhone || 'No phone provided'})</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-6 border-t border-slate-800 mt-8">
        {step > 1 ? (
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        ) : <div />}

        {step < 7 ? (
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30"
          >
            Next Step <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 disabled:opacity-50"
          >
            {isSubmitting ? 'Generating Profile...' : 'Complete & Generate Profile'}
          </button>
        )}
      </div>
    </div>
  );
}
