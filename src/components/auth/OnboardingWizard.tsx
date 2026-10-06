import React, { useState } from 'react';
import {
  Shield, User, Building2, MapPin, Wrench, Bell, Lock, CheckCircle2,
  ChevronRight, ChevronLeft, AlertCircle, Eye, EyeOff, Check, AlertTriangle
} from 'lucide-react';
import { ServiceCategory } from '../../types';
import logoImg from '../../assets/logo.png';
import { PlanSelectionStep } from './PlanSelectionStep';
import { PlanConfirmationStep } from './PlanConfirmationStep';
import { getPlan } from '../../data/plans';

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
    accountType: 'Residential' as 'Residential' | 'Individual' | 'Business',
    companyName: '',
    companyRegNumber: '',
    vatNumber: '',
    industry: '',

    // Step 3: Address
    primaryAddress: '',
    primaryLabel: 'Main Residence',
    accessNotes: '',

    // Step 4: Preferred Services
    preferredServices: [
      'Garage & Gate Automation',
      'Audio & Video Intercoms',
      'Access Control',
      'Electric Fence',
      'Alarm',
      'CCTV',
    ] as ServiceCategory[],

    // Step 5 & 6: Plan Selection & Confirmation
    selectedPlanId: 'assist_plus',
    planConfirmed: false,

    // Step 7: Communication & Next of Kin Details
    preferredContactMethod: 'Email' as 'Email' | 'SMS' | 'WhatsApp' | 'Push',
    emergencyContactName: '',
    emergencyContactPhone: '',
    requestOnboardingSurvey: true,
    communicationPreferences: {
      marketing: false,
      smsAlerts: true,
      emailInvoices: true,
    },

    // Step 8: Security Verification
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
      if (formData.preferredServices.length === 0) return 'Please select at least one service under Security Systems Assistance';
    } else if (currentStep === 5) {
      if (!formData.selectedPlanId) return 'Please select a membership plan to continue';
    } else if (currentStep === 6) {
      if (!formData.planConfirmed) {
        return 'Please confirm your understanding of the monthly membership price and annual assistance benefit by checking the confirmation box';
      }
    } else if (currentStep === 8) {
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
    const error = validateStep(8);
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
        selectedPlanId: formData.selectedPlanId,
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
    { num: 5, title: 'Plan Selection', icon: Shield },
    { num: 6, title: 'Plan Confirm', icon: CheckCircle2 },
    { num: 7, title: 'Preferences', icon: Bell },
    { num: 8, title: 'Security', icon: Lock },
    { num: 9, title: 'Review', icon: CheckCircle2 },
  ];

  const chosenPlan = getPlan(formData.selectedPlanId);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 max-w-5xl mx-auto shadow-2xl text-slate-100">
      {/* Header */}
      <div className="flex justify-between items-center pb-6 border-b border-slate-800 mb-6">
        <div>
          <div className="flex items-center gap-2.5 text-red-500 font-semibold tracking-wider text-xs uppercase mb-1">
            <img src={logoImg} alt="Same Day Assist Logo" className="w-7 h-7 rounded-full object-contain bg-white p-0.5 shadow-md shrink-0" />
            <span>Enterprise Customer Onboarding</span>
          </div>
          <h2 className="text-2xl font-bold text-white">Complete Profile Generation</h2>
          <p className="text-sm text-slate-400">Step {step} of 9 — {stepsList[step - 1].title}</p>
        </div>
        <button
          onClick={onCancel}
          className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 cursor-pointer"
        >
          Cancel
        </button>
      </div>

      {/* Progress Bar & Indicators */}
      <div className="flex items-center justify-between gap-1 sm:gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none">
        {stepsList.map(item => {
          const Icon = item.icon;
          const isActive = item.num === step;
          const isDone = item.num < step;
          return (
            <div key={item.num} className="flex-1 min-w-[36px] sm:min-w-[48px] text-center shrink-0">
              <div
                className={`w-8 h-8 sm:w-9 sm:h-9 mx-auto rounded-xl flex items-center justify-center transition-all ${
                  isDone
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                    : isActive
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <span className={`text-[8.5px] sm:text-[9.5px] mt-1.5 block font-medium leading-tight text-center ${isActive ? 'text-white font-bold' : 'text-slate-500 hidden sm:block'}`}>
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
                type="tel"
                value={formData.phone}
                onChange={e => handleChange('phone', e.target.value)}
                placeholder="+27 82 555 1234"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Secondary / Landline Phone</label>
              <input
                type="tel"
                value={formData.secondaryPhone}
                onChange={e => handleChange('secondaryPhone', e.target.value)}
                placeholder="+27 11 555 0192"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">National ID / Passport Number</label>
              <input
                type="text"
                value={formData.idNumber}
                onChange={e => handleChange('idNumber', e.target.value)}
                placeholder="e.g. 9001015009087"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 text-sm"
              />
            </div>
          </div>
        )}

        {/* STEP 2: Account Type */}
        {step === 2 && (
          <div className="space-y-4">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Account Classification *</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleChange('accountType', 'Residential')}
                className={`p-4 rounded-xl border text-left flex items-start gap-4 transition-all cursor-pointer ${
                  formData.accountType === 'Residential'
                    ? 'border-red-500 bg-red-600/10 text-white shadow-lg shadow-red-600/10'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                <User className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-sm text-white">Residential / Individual Account</div>
                  <p className="text-xs text-slate-400 mt-1">For single families, homeowners, tenants, and private residential properties.</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleChange('accountType', 'Business')}
                className={`p-4 rounded-xl border text-left flex items-start gap-4 transition-all cursor-pointer ${
                  formData.accountType === 'Business'
                    ? 'border-red-500 bg-red-600/10 text-white shadow-lg shadow-red-600/10'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Building2 className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-sm text-white">Commercial / Corporate Business</div>
                  <p className="text-xs text-slate-400 mt-1">For commercial offices, factories, retail outlets, and multi-tenant complexes.</p>
                </div>
              </button>
            </div>

            {formData.accountType === 'Business' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Company Registered Name *</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={e => handleChange('companyName', e.target.value)}
                    placeholder="e.g. Apex Security Solutions (Pty) Ltd"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Company Registration Number</label>
                  <input
                    type="text"
                    value={formData.companyRegNumber}
                    onChange={e => handleChange('companyRegNumber', e.target.value)}
                    placeholder="e.g. 2021/123456/07"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">VAT Registration Number</label>
                  <input
                    type="text"
                    value={formData.vatNumber}
                    onChange={e => handleChange('vatNumber', e.target.value)}
                    placeholder="e.g. 4010293847"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Industry Sector</label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={e => handleChange('industry', e.target.value)}
                    placeholder="e.g. Financial Services / Warehousing"
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
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Physical Address *</label>
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

            <div className="p-4 rounded-xl border border-red-500 bg-red-600/10 text-white flex items-center justify-between shadow-lg shadow-red-600/10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-red-500 shrink-0" />
                  <span className="font-bold text-sm text-white tracking-wide uppercase">SECURITY SYSTEMS ASSISTANCE</span>
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">Active</span>
                </div>
                <p className="text-xs text-slate-400">Primary security infrastructure, surveillance & access control services.</p>
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Security Systems Assistance Services
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  'Garage & Gate Automation',
                  'Audio & Video Intercoms',
                  'Access Control',
                  'Electric Fence',
                  'Alarm',
                  'CCTV',
                ].map(srv => {
                  const isChecked = formData.preferredServices.includes(srv as ServiceCategory);
                  return (
                    <button
                      type="button"
                      key={srv}
                      onClick={() => toggleService(srv as ServiceCategory)}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isChecked
                          ? 'border-red-500 bg-red-600/10 text-white'
                          : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xs font-semibold">{srv}</span>
                      <div className={`w-4 h-4 rounded flex items-center justify-center border ${isChecked ? 'bg-red-600 border-red-500 text-white' : 'border-slate-700 bg-slate-800'}`}>
                        {isChecked && <Check className="w-3 h-3" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Plan Selection & Comparison */}
        {step === 5 && (
          <PlanSelectionStep
            selectedPlanId={formData.selectedPlanId}
            onSelectPlan={(planId) => {
              handleChange('selectedPlanId', planId);
              handleChange('planConfirmed', false); // reset confirmation on plan change
            }}
            accountType={formData.accountType}
          />
        )}

        {/* STEP 6: Confirmation Before Subscription */}
        {step === 6 && (
          <PlanConfirmationStep
            selectedPlanId={formData.selectedPlanId}
            confirmed={formData.planConfirmed}
            onToggleConfirm={(val) => handleChange('planConfirmed', val)}
            onBackToPlans={() => setStep(5)}
          />
        )}

        {/* STEP 7: Preferences & Next of Kin */}
        {step === 7 && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Preferred Dispatch Contact Channel</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(['Email', 'SMS', 'WhatsApp', 'Push'] as const).map(method => (
                  <button
                    type="button"
                    key={method}
                    onClick={() => handleChange('preferredContactMethod', method)}
                    className={`py-3 px-4 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      formData.preferredContactMethod === method
                        ? 'border-red-500 bg-red-600/10 text-white shadow-lg shadow-red-600/10'
                        : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Emergency Contact / Next of Kin</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Emergency Contact Name</label>
                  <input
                    type="text"
                    value={formData.emergencyContactName}
                    onChange={e => handleChange('emergencyContactName', e.target.value)}
                    placeholder="e.g. Sindi Molefe"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Emergency Contact Phone</label>
                  <input
                    type="tel"
                    value={formData.emergencyContactPhone}
                    onChange={e => handleChange('emergencyContactPhone', e.target.value)}
                    placeholder="+27 83 555 8888"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 8: Security Verification */}
        {step === 8 && (
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
                  I agree to Same Day Assist Service Terms, Emergency Dispatch Protocols, and membership benefit ledger policies.
                </span>
              </label>
            </div>
          </div>
        )}

        {/* STEP 9: Review & Submit */}
        {step === 9 && (
          <div className="space-y-5 bg-slate-950/60 p-4 md:p-6 rounded-2xl border border-slate-800 animate-fadeIn">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Onboarding Profile & Subscription Summary
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                READY TO INITIALIZE
              </span>
            </div>

            {/* Selected Plan Spotlight Box */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-red-500/60 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-[10px] font-mono uppercase text-red-400 font-bold tracking-widest block">
                  CHOSEN MEMBERSHIP PLAN
                </span>
                <h4 className="text-xl font-black text-white font-brand-header tracking-wide mt-0.5">
                  {chosenPlan.name}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Monthly Subscription: <strong className="text-white font-mono">R{chosenPlan.monthlyPrice.toLocaleString()}/month</strong>
                </p>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5 text-right shrink-0">
                <span className="text-[9.5px] font-mono uppercase text-slate-400 block">
                  Annual Assistance Benefit
                </span>
                <span className={`text-base font-black font-mono ${chosenPlan.annualBenefit === 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {chosenPlan.partsBenefitDescription}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 text-xs">
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
                <span className="font-semibold text-red-400 break-words">{formData.accountType === 'Business' ? 'Business Account' : 'Residential Account'}</span>
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
                <span className="text-slate-500 block font-mono text-[10px] uppercase mb-0.5">Selected Services</span>
                <span className="font-semibold text-slate-300 break-words leading-relaxed">{formData.preferredServices.join(', ')}</span>
              </div>
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
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        ) : <div />}

        {step < 9 ? (
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 cursor-pointer"
          >
            Next Step <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? 'Generating Profile & Activating...' : 'Confirm Subscription & Activate'}
          </button>
        )}
      </div>
    </div>
  );
}
