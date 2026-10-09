import React, { useState, useEffect } from 'react';
import { 
  Palette, 
  User, 
  MapPin, 
  Lock, 
  Bell, 
  Shield, 
  Check, 
  AlertCircle, 
  Phone, 
  Mail, 
  Building, 
  Eye, 
  EyeOff, 
  Save, 
  Plus, 
  Trash2, 
  Edit3, 
  LogOut, 
  FileText, 
  Info, 
  Key, 
  Sun, 
  Moon,
  Sparkles,
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAppState } from '../../contexts/AppStateContext';
import { api } from '../../services/api';
import { SavedLocation } from '../../types';

interface CustomerSettingsProps {
  activeCustomer?: any;
  onNavigateTab?: (tab: string) => void;
}

const SA_PROVINCES = [
  'Gauteng',
  'Western Cape',
  'KwaZulu-Natal',
  'Eastern Cape',
  'Free State',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape',
];

export default function CustomerSettings({ activeCustomer, onNavigateTab }: CustomerSettingsProps) {
  const { theme, setTheme, isDark } = useTheme();
  const { user, logout, refreshUser } = useAuth();
  const { addAuditLogLocal } = useAppState();

  const [activeSubTab, setActiveSubTab] = useState<'appearance' | 'profile' | 'addresses' | 'security' | 'notifications' | 'account'>('appearance');

  // ==========================================
  // SECTION B: PROFILE STATE
  // ==========================================
  const [name, setName] = useState(user?.name || activeCustomer?.name || '');
  const [email] = useState(user?.email || activeCustomer?.email || '');
  const [phone, setPhone] = useState(user?.phone || activeCustomer?.phone || '');
  const [secondaryPhone, setSecondaryPhone] = useState((user as any)?.secondaryPhone || '');
  const [idNumber, setIdNumber] = useState((user as any)?.idNumber || '');
  const [emergencyContactName, setEmergencyContactName] = useState((user as any)?.emergencyContactName || '');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState((user as any)?.emergencyContactPhone || '');
  const [preferredContactMethod, setPreferredContactMethod] = useState((user as any)?.preferredContactMethod || 'Email');
  const [accountType, setAccountType] = useState((user as any)?.accountType || 'Residential');

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  // ==========================================
  // SECTION C: ADDRESS MANAGEMENT STATE
  // ==========================================
  // Parse existing address if comma-separated, else default to values
  const parseAddressComponents = (rawAddress: string) => {
    if (!rawAddress) return { street: '', suburb: '', city: 'Johannesburg', province: 'Gauteng', postalCode: '' };
    const parts = rawAddress.split(',').map(s => s.trim());
    return {
      street: parts[0] || rawAddress,
      suburb: parts[1] || '',
      city: parts[2] || 'Johannesburg',
      province: parts[3] || 'Gauteng',
      postalCode: parts[4] || '',
    };
  };

  const initialParsed = parseAddressComponents(user?.address || activeCustomer?.address || '');
  const [streetAddress, setStreetAddress] = useState(initialParsed.street);
  const [suburb, setSuburb] = useState(initialParsed.suburb);
  const [city, setCity] = useState(initialParsed.city);
  const [province, setProvince] = useState(initialParsed.province);
  const [postalCode, setPostalCode] = useState(initialParsed.postalCode);
  const [addressType, setAddressType] = useState<'Home' | 'Work' | 'Commercial' | 'Other'>('Home');

  const [addressSaving, setAddressSaving] = useState(false);
  const [addressSuccessMsg, setAddressSuccessMsg] = useState<string | null>(null);
  const [addressErrorMsg, setAddressErrorMsg] = useState<string | null>(null);

  // Additional saved locations
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [newLocationLabel, setNewLocationLabel] = useState('Office');
  const [newLocationAddress, setNewLocationAddress] = useState('');
  const [newLocationNotes, setNewLocationNotes] = useState('');

  // ==========================================
  // SECTION D: CHANGE PASSWORD STATE
  // ==========================================
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string | null>(null);
  const [forgotPasswordMsg, setForgotPasswordMsg] = useState<string | null>(null);

  // ==========================================
  // SECTION E: NOTIFICATIONS STATE
  // ==========================================
  const [prefEmail, setPrefEmail] = useState(true);
  const [prefSms, setPrefSms] = useState(true);
  const [prefPush, setPrefPush] = useState(true);
  const [prefInApp, setPrefInApp] = useState(true);
  const [prefServiceUpdates, setPrefServiceUpdates] = useState(true);
  const [prefPaymentAlerts, setPrefPaymentAlerts] = useState(true);
  const [prefSecurityAlerts, setPrefSecurityAlerts] = useState(true);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsSaving, setNotificationsSaving] = useState(false);
  const [notificationsSuccessMsg, setNotificationsSuccessMsg] = useState<string | null>(null);

  // Load saved locations & notification preferences on mount
  useEffect(() => {
    loadLocationsList();
    loadNotificationPrefs();
  }, []);

  const loadLocationsList = async () => {
    setLoadingLocations(true);
    try {
      const locs = await api.getSavedLocations();
      setSavedLocations(locs || []);
    } catch (err) {
      console.warn('Failed to load saved locations:', err);
    } finally {
      setLoadingLocations(false);
    }
  };

  const loadNotificationPrefs = async () => {
    setNotificationsLoading(true);
    try {
      const prefs = await api.getNotificationPreferences();
      if (prefs) {
        if (prefs.email !== undefined) setPrefEmail(prefs.email);
        if (prefs.sms !== undefined) setPrefSms(prefs.sms);
        if (prefs.push !== undefined) setPrefPush(prefs.push);
        if (prefs.inApp !== undefined) setPrefInApp(prefs.inApp);
        if (prefs.serviceUpdates !== undefined) setPrefServiceUpdates(prefs.serviceUpdates);
        if (prefs.paymentAlerts !== undefined) setPrefPaymentAlerts(prefs.paymentAlerts);
        if (prefs.securityAlerts !== undefined) setPrefSecurityAlerts(prefs.securityAlerts);
      }
    } catch (err) {
      console.warn('Failed to fetch notification preferences:', err);
    } finally {
      setNotificationsLoading(false);
    }
  };

  // ==========================================
  // SAVE HANDLERS
  // ==========================================

  // Save Profile Handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMsg(null);
    setProfileErrorMsg(null);

    if (!name.trim()) {
      setProfileErrorMsg('Full Name is required.');
      return;
    }
    if (!phone.trim()) {
      setProfileErrorMsg('Contact phone number is required.');
      return;
    }

    setProfileSaving(true);
    try {
      const res = await api.updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        secondaryPhone: secondaryPhone.trim() || undefined,
        idNumber: idNumber.trim() || undefined,
        emergencyContactName: emergencyContactName.trim() || undefined,
        emergencyContactPhone: emergencyContactPhone.trim() || undefined,
        preferredContactMethod,
      });

      if (res.user) {
        localStorage.setItem('sda_user', JSON.stringify({ ...user, ...res.user }));
      }
      await refreshUser();
      addAuditLogLocal('Profile Details Updated', `Customer ${name} saved personal profile changes.`);
      setProfileSuccessMsg('Profile details successfully updated and saved to your account!');
      setTimeout(() => setProfileSuccessMsg(null), 4000);
    } catch (err: any) {
      setProfileErrorMsg(err.message || 'Failed to save profile changes. Please try again.');
    } finally {
      setProfileSaving(false);
    }
  };

  // Save Primary Address Handler
  const handleSavePrimaryAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressSuccessMsg(null);
    setAddressErrorMsg(null);

    if (!streetAddress.trim() || !suburb.trim()) {
      setAddressErrorMsg('Street address and Suburb are required.');
      return;
    }

    // Construct full address string for backward compatibility
    const compiledAddress = [
      streetAddress.trim(),
      suburb.trim(),
      city.trim() || 'Johannesburg',
      province.trim() || 'Gauteng',
      postalCode.trim() || '',
    ].filter(Boolean).join(', ');

    setAddressSaving(true);
    try {
      const res = await api.updateProfile({
        address: compiledAddress,
      });

      if (res.user) {
        localStorage.setItem('sda_user', JSON.stringify({ ...user, address: compiledAddress }));
      }
      await refreshUser();
      addAuditLogLocal('Primary Address Updated', `Customer updated physical dispatch address to: ${compiledAddress}`);
      setAddressSuccessMsg('Primary dispatch address updated successfully. Active service requests will retain their recorded addresses.');
      setTimeout(() => setAddressSuccessMsg(null), 4500);
    } catch (err: any) {
      setAddressErrorMsg(err.message || 'Failed to update address. Please try again.');
    } finally {
      setAddressSaving(false);
    }
  };

  // Save Additional Location Handler
  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocationAddress.trim()) return;

    try {
      await api.addSavedLocation({
        label: newLocationLabel,
        address: newLocationAddress.trim(),
        accessNotes: newLocationNotes.trim(),
        lat: -26.2041,
        lng: 28.0473,
      });
      setNewLocationAddress('');
      setNewLocationNotes('');
      setShowAddLocationModal(false);
      await loadLocationsList();
      addAuditLogLocal('Saved Location Added', `Added secondary address label: ${newLocationLabel}`);
    } catch (err: any) {
      alert(err.message || 'Could not add saved location.');
    }
  };

  // Delete Additional Location
  const handleDeleteLocation = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this saved address?')) return;
    try {
      await api.deleteSavedLocation(id);
      await loadLocationsList();
      addAuditLogLocal('Saved Location Removed', `Removed saved location ID: ${id}`);
    } catch (err: any) {
      alert(err.message || 'Could not delete location.');
    }
  };

  // Change Password Handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccessMsg(null);
    setPasswordErrorMsg(null);

    if (!currentPassword) {
      setPasswordErrorMsg('Please enter your current password.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordErrorMsg('New password must be at least 6 characters in length.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('New password and confirmation do not match.');
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await api.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setPasswordSuccessMsg(res.message || 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      addAuditLogLocal('Password Changed', `Customer successfully changed password.`);
      setTimeout(() => setPasswordSuccessMsg(null), 5000);
    } catch (err: any) {
      setPasswordErrorMsg(err.message || 'Failed to change password. Please check your current password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  // Forgot Password / Reset Link Handler
  const handleForgotPassword = async () => {
    if (!user?.email) return;
    setForgotPasswordMsg('Sending password recovery instructions...');
    try {
      await api.forgotPassword(user.email);
      setForgotPasswordMsg(`Password reset instructions have been sent to ${user.email}.`);
      setTimeout(() => setForgotPasswordMsg(null), 6000);
    } catch (err: any) {
      setForgotPasswordMsg('Password reset request initiated.');
    }
  };

  // Save Notifications Preferences Handler
  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotificationsSuccessMsg(null);
    setNotificationsSaving(true);
    try {
      await api.updateNotificationPreferences({
        email: prefEmail,
        sms: prefSms,
        push: prefPush,
        inApp: prefInApp,
        serviceUpdates: prefServiceUpdates,
        paymentAlerts: prefPaymentAlerts,
        securityAlerts: prefSecurityAlerts,
      });
      setNotificationsSuccessMsg('Notification preferences updated successfully!');
      addAuditLogLocal('Notification Preferences Updated', 'Customer updated communication preferences.');
      setTimeout(() => setNotificationsSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to save notification settings.');
    } finally {
      setNotificationsSaving(false);
    }
  };

  // Theme card helper
  const cardBgClass = isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const innerBgClass = isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200';
  const inputBgClass = isDark 
    ? 'bg-slate-950 text-white border-slate-800 focus:border-red' 
    : 'bg-white text-slate-900 border-slate-200 focus:border-navy';
  const labelClass = isDark ? 'text-slate-400' : 'text-slate-600';

  return (
    <div className="flex flex-col gap-6 animate-fadeIn pb-12">
      {/* SECTION HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 dark:border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black italic tracking-wide uppercase font-brand-header text-navy dark:text-white">
              Customer Settings
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-red/10 text-red border border-red/30">
              SECURE PORTAL
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Personalize your appearance, maintain contact records, manage dispatch addresses, and configure security preferences.
          </p>
        </div>

        {/* Quick Theme Pill in Header */}
        <div className={`flex items-center gap-2 p-1.5 rounded-2xl border ${cardBgClass} shadow-xs`}>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              isDark 
                ? 'bg-[#091C3E] text-white shadow-xs border border-slate-700' 
                : 'text-slate-500 hover:text-navy'
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-blue-400" />
            <span>Navy Dark</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              !isDark 
                ? 'bg-white text-navy shadow-xs border border-slate-200' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>Clean Light</span>
          </button>
        </div>
      </div>

      {/* HORIZONTAL TAB NAVIGATION */}
      <div className={`p-1.5 rounded-2xl border ${innerBgClass} flex items-center gap-1.5 overflow-x-auto`}>
        <button
          type="button"
          onClick={() => setActiveSubTab('appearance')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeSubTab === 'appearance'
              ? 'bg-red text-white shadow-xs'
              : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-900' : 'text-slate-600 hover:text-navy hover:bg-white'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Appearance & Themes</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('profile')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeSubTab === 'profile'
              ? 'bg-red text-white shadow-xs'
              : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-900' : 'text-slate-600 hover:text-navy hover:bg-white'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Customer Profile</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('addresses')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeSubTab === 'addresses'
              ? 'bg-red text-white shadow-xs'
              : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-900' : 'text-slate-600 hover:text-navy hover:bg-white'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Addresses & Sites</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('security')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeSubTab === 'security'
              ? 'bg-red text-white shadow-xs'
              : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-900' : 'text-slate-600 hover:text-navy hover:bg-white'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Security & Password</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('notifications')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeSubTab === 'notifications'
              ? 'bg-red text-white shadow-xs'
              : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-900' : 'text-slate-600 hover:text-navy hover:bg-white'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notifications</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('account')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeSubTab === 'account'
              ? 'bg-red text-white shadow-xs'
              : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-900' : 'text-slate-600 hover:text-navy hover:bg-white'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Plan & Support</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION A: APPEARANCE AND THEMES                                         */}
      {/* ========================================================================= */}
      {activeSubTab === 'appearance' && (
        <div className={`p-6 rounded-3xl border ${cardBgClass} shadow-md flex flex-col gap-6`}>
          <div>
            <h3 className="text-base font-black italic uppercase font-brand-header text-navy dark:text-white flex items-center gap-2">
              <Palette className="w-5 h-5 text-red" />
              Theme & Appearance Settings
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Select your preferred visual style. Both themes preserve Same Day Assist's signature brand colours, fonts, icons and buttons.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Dark Theme Option (Original Navy-Blue Branding) */}
            <div 
              onClick={() => setTheme('dark')}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col gap-3 relative overflow-hidden ${
                isDark 
                  ? 'border-red shadow-lg bg-[#050E20] text-white ring-2 ring-red/30' 
                  : 'border-slate-300 bg-[#050E20] text-white opacity-85 hover:opacity-100 hover:border-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#091C3E] text-white border border-[#142D59]">
                    <Moon className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Dark Theme (Original Navy-Blue)</h4>
                    <span className="text-[10px] font-mono text-blue-300">Default Brand Theme</span>
                  </div>
                </div>
                {isDark && (
                  <span className="p-1.5 bg-red text-white rounded-full">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                The authentic Same Day Assist dark appearance, powered by deep navy blue (<span className="font-mono text-blue-300">#050E20</span> & <span className="font-mono text-blue-300">#091C3E</span>) rather than pure pitch black, accented with high-visibility red buttons.
              </p>

              {/* Swatch palette preview */}
              <div className="mt-2 pt-3 border-t border-[#142D59] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#050E20] border border-slate-700" title="Deep Navy (#050E20)" />
                  <span className="w-5 h-5 rounded-full bg-[#091C3E] border border-slate-700" title="Primary Navy (#091C3E)" />
                  <span className="w-5 h-5 rounded-full bg-[#183366] border border-slate-700" title="Navy Light (#183366)" />
                  <span className="w-5 h-5 rounded-full bg-[#CC322C] border border-slate-700" title="Brand Red (#CC322C)" />
                </div>
                <span className="text-[10px] font-mono text-slate-400">AUTHENTIC NAVY</span>
              </div>
            </div>

            {/* Light Theme Option */}
            <div 
              onClick={() => setTheme('light')}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col gap-3 relative overflow-hidden ${
                !isDark 
                  ? 'border-red shadow-lg bg-white text-slate-900 ring-2 ring-red/30' 
                  : 'border-slate-700 bg-white text-slate-900 opacity-85 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-slate-100 text-slate-800 border border-slate-200">
                    <Sun className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-navy">Light Theme</h4>
                    <span className="text-[10px] font-mono text-slate-500">Daylight Contrast</span>
                  </div>
                </div>
                {!isDark && (
                  <span className="p-1.5 bg-red text-white rounded-full">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                A clean, crisp light background (<span className="font-mono text-slate-700">#F8FAFC</span>) with pure white cards, high-contrast dark navy typography, and brand-red interactive elements for daytime readability.
              </p>

              {/* Swatch palette preview */}
              <div className="mt-2 pt-3 border-t border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#F8FAFC] border border-slate-300" title="Light Page (#F8FAFC)" />
                  <span className="w-5 h-5 rounded-full bg-white border border-slate-300" title="White Card (#FFFFFF)" />
                  <span className="w-5 h-5 rounded-full bg-[#091C3E] border border-slate-300" title="Brand Navy Text (#091C3E)" />
                  <span className="w-5 h-5 rounded-full bg-[#CC322C] border border-slate-300" title="Brand Red (#CC322C)" />
                </div>
                <span className="text-[10px] font-mono text-slate-500">CLEAN CONTRAST</span>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-2xl border ${innerBgClass} flex items-start gap-3 text-xs`}>
            <Info className="w-4 h-4 text-red shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-navy dark:text-white">Seamless Live Switching</p>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                Theme selection applies immediately across all pages and components without a page reload or losing form data. Your preference is automatically stored in your browser and synced with your customer account profile.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION B: CUSTOMER PROFILE                                               */}
      {/* ========================================================================= */}
      {activeSubTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className={`p-6 rounded-3xl border ${cardBgClass} shadow-md flex flex-col gap-6`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black italic uppercase font-brand-header text-navy dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-red" />
                Customer Profile Information
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                View and update your verified customer contact details. Changes are persisted securely to your database profile.
              </p>
            </div>

            <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              VERIFIED ACCOUNT
            </span>
          </div>

          {profileSuccessMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-2xl flex items-center gap-2 animate-fadeIn">
              <Check className="w-4 h-4 shrink-0" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          {profileErrorMsg && (
            <div className="p-3 bg-red/10 border border-red/30 text-red text-xs font-bold rounded-2xl flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{profileErrorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label className={`text-[10px] font-black uppercase tracking-wider ${labelClass}`}>
                Full Name & Surname *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Sipho Ndlovu"
                className={`p-3 rounded-xl text-xs border focus:outline-none transition-all ${inputBgClass}`}
              />
            </div>

            {/* Email (Read-only) */}
            <div className="flex flex-col gap-1.5">
              <label className={`text-[10px] font-black uppercase tracking-wider ${labelClass}`}>
                Registered Email Address (Account Identifier)
              </label>
              <div className="relative">
                <input
                  type="email"
                  disabled
                  value={email}
                  className={`p-3 pr-20 rounded-xl text-xs border w-full opacity-70 cursor-not-allowed ${inputBgClass}`}
                />
                <span className="absolute right-3 top-2.5 text-[9px] font-mono text-emerald-500 font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                  LOCKED
                </span>
              </div>
            </div>

            {/* Primary Contact Phone */}
            <div className="flex flex-col gap-1.5">
              <label className={`text-[10px] font-black uppercase tracking-wider ${labelClass}`}>
                Contact Number (Primary Mobile) *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. +27 82 555 1234"
                className={`p-3 rounded-xl text-xs border focus:outline-none transition-all ${inputBgClass}`}
              />
            </div>

            {/* Secondary Phone */}
            <div className="flex flex-col gap-1.5">
              <label className={`text-[10px] font-black uppercase tracking-wider ${labelClass}`}>
                Alternative / Landline Number
              </label>
              <input
                type="tel"
                value={secondaryPhone}
                onChange={e => setSecondaryPhone(e.target.value)}
                placeholder="e.g. +27 11 444 5678 (Optional)"
                className={`p-3 rounded-xl text-xs border focus:outline-none transition-all ${inputBgClass}`}
              />
            </div>

            {/* ID / Passport Number */}
            <div className="flex flex-col gap-1.5">
              <label className={`text-[10px] font-black uppercase tracking-wider ${labelClass}`}>
                RSA ID Number / Passport
              </label>
              <input
                type="text"
                value={idNumber}
                onChange={e => setIdNumber(e.target.value)}
                placeholder="e.g. 8801015000085"
                className={`p-3 rounded-xl text-xs border focus:outline-none transition-all ${inputBgClass}`}
              />
            </div>

            {/* Preferred Contact Method */}
            <div className="flex flex-col gap-1.5">
              <label className={`text-[10px] font-black uppercase tracking-wider ${labelClass}`}>
                Preferred Communication Channel
              </label>
              <select
                value={preferredContactMethod}
                onChange={e => setPreferredContactMethod(e.target.value)}
                className={`p-3 rounded-xl text-xs border focus:outline-none transition-all ${inputBgClass}`}
              >
                <option value="Email">Email</option>
                <option value="SMS">SMS Message</option>
                <option value="Phone">Phone Call</option>
                <option value="WhatsApp">WhatsApp</option>
              </select>
            </div>

            {/* Emergency Contact Name */}
            <div className="flex flex-col gap-1.5">
              <label className={`text-[10px] font-black uppercase tracking-wider ${labelClass}`}>
                Next of Kin / Emergency Contact Name
              </label>
              <input
                type="text"
                value={emergencyContactName}
                onChange={e => setEmergencyContactName(e.target.value)}
                placeholder="e.g. Lerato Ndlovu (Spouse)"
                className={`p-3 rounded-xl text-xs border focus:outline-none transition-all ${inputBgClass}`}
              />
            </div>

            {/* Emergency Contact Phone */}
            <div className="flex flex-col gap-1.5">
              <label className={`text-[10px] font-black uppercase tracking-wider ${labelClass}`}>
                Next of Kin Phone Number
              </label>
              <input
                type="tel"
                value={emergencyContactPhone}
                onChange={e => setEmergencyContactPhone(e.target.value)}
                placeholder="e.g. +27 83 777 8888"
                className={`p-3 rounded-xl text-xs border focus:outline-none transition-all ${inputBgClass}`}
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-200/50 dark:border-slate-800/80">
            <button
              type="submit"
              disabled={profileSaving}
              className="px-6 py-3 bg-red hover:bg-red/90 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{profileSaving ? 'Saving Profile...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* SECTION C: ADDRESS MANAGEMENT                                             */}
      {/* ========================================================================= */}
      {activeSubTab === 'addresses' && (
        <div className="flex flex-col gap-6">
          {/* Primary Dispatch Address Form */}
          <form onSubmit={handleSavePrimaryAddress} className={`p-6 rounded-3xl border ${cardBgClass} shadow-md flex flex-col gap-5`}>
            <div>
              <h3 className="text-base font-black italic uppercase font-brand-header text-navy dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-red" />
                Primary Physical Dispatch Address
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Your primary residential or commercial property address used for emergency dispatch and assistance callouts.
              </p>
            </div>

            {addressSuccessMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-2xl flex items-center gap-2 animate-fadeIn">
                <Check className="w-4 h-4 shrink-0" />
                <span>{addressSuccessMsg}</span>
              </div>
            )}

            {addressErrorMsg && (
              <div className="p-3 bg-red/10 border border-red/30 text-red text-xs font-bold rounded-2xl flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{addressErrorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Street Address */}
              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label className={`text-[10px] font-black uppercase tracking-wider ${labelClass}`}>
                  Street Address & House / Unit Number *
                </label>
                <input
                  type="text"
                  required
                  value={streetAddress}
                  onChange={e => setStreetAddress(e.target.value)}
                  placeholder="e.g. 14 Sandton Drive, Block B, Unit 4"
                  className={`p-3 rounded-xl text-xs border focus:outline-none transition-all ${inputBgClass}`}
                />
              </div>

              {/* Suburb */}
              <div className="flex flex-col gap-1.5">
                <label className={`text-[10px] font-black uppercase tracking-wider ${labelClass}`}>
                  Suburb *
                </label>
                <input
                  type="text"
                  required
                  value={suburb}
                  onChange={e => setSuburb(e.target.value)}
                  placeholder="e.g. Sandton / Rosebank / Morningside"
                  className={`p-3 rounded-xl text-xs border focus:outline-none transition-all ${inputBgClass}`}
                />
              </div>

              {/* City / Town */}
              <div className="flex flex-col gap-1.5">
                <label className={`text-[10px] font-black uppercase tracking-wider ${labelClass}`}>
                  City / Town *
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="e.g. Johannesburg / Pretoria"
                  className={`p-3 rounded-xl text-xs border focus:outline-none transition-all ${inputBgClass}`}
                />
              </div>

              {/* Province */}
              <div className="flex flex-col gap-1.5">
                <label className={`text-[10px] font-black uppercase tracking-wider ${labelClass}`}>
                  Province *
                </label>
                <select
                  value={province}
                  onChange={e => setProvince(e.target.value)}
                  className={`p-3 rounded-xl text-xs border focus:outline-none transition-all ${inputBgClass}`}
                >
                  {SA_PROVINCES.map(prov => (
                    <option key={prov} value={prov}>{prov}</option>
                  ))}
                </select>
              </div>

              {/* Postal Code */}
              <div className="flex flex-col gap-1.5">
                <label className={`text-[10px] font-black uppercase tracking-wider ${labelClass}`}>
                  Postal Code
                </label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={e => setPostalCode(e.target.value)}
                  placeholder="e.g. 2196"
                  className={`p-3 rounded-xl text-xs border focus:outline-none transition-all ${inputBgClass}`}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200/50 dark:border-slate-800/80">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                🔒 Note: Ongoing emergency or open service requests will preserve their historical job dispatch address.
              </div>
              <button
                type="submit"
                disabled={addressSaving}
                className="px-6 py-3 bg-red hover:bg-red/90 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{addressSaving ? 'Saving Address...' : 'Update Primary Address'}</span>
              </button>
            </div>
          </form>

          {/* Additional Saved Properties & Locations */}
          <div className={`p-6 rounded-3xl border ${cardBgClass} shadow-md flex flex-col gap-5`}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-navy dark:text-white flex items-center gap-2">
                  <Building className="w-4 h-4 text-red" />
                  Additional Saved Sites & Secondary Properties
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Save holiday homes, branch offices, warehouses, or family residences for fast one-click dispatch.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddLocationModal(true)}
                className="px-4 py-2 bg-navy dark:bg-slate-800 hover:bg-navy/90 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-slate-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Site</span>
              </button>
            </div>

            {loadingLocations ? (
              <div className="text-center py-6 text-xs text-slate-400">Loading saved locations...</div>
            ) : savedLocations.length === 0 ? (
              <div className={`text-center py-8 rounded-2xl border border-dashed ${innerBgClass}`}>
                <MapPin className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">No Secondary Locations Saved</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Click "Add Site" above to store additional service locations.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {savedLocations.map(loc => (
                  <div key={loc.id} className={`p-4 rounded-2xl border ${innerBgClass} flex items-start justify-between gap-3`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-navy dark:text-white">{loc.label}</span>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                          SAVED
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">{loc.address}</p>
                      {loc.accessNotes && (
                        <p className="text-[10px] text-slate-400 italic">Notes: {loc.accessNotes}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteLocation(loc.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red hover:bg-red/10 transition-colors cursor-pointer"
                      title="Delete site"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Location Modal */}
          {showAddLocationModal && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className={`w-full max-w-md p-6 rounded-3xl border ${cardBgClass} shadow-2xl flex flex-col gap-4 animate-scaleUp`}>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <h4 className="font-bold text-sm text-navy dark:text-white">Add Secondary Service Site</h4>
                  <button 
                    onClick={() => setShowAddLocationModal(false)}
                    className="text-slate-400 hover:text-slate-200 text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddLocation} className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className={`text-[10px] font-bold uppercase ${labelClass}`}>Location Type / Label</label>
                    <select
                      value={newLocationLabel}
                      onChange={e => setNewLocationLabel(e.target.value)}
                      className={`p-2.5 rounded-xl text-xs border ${inputBgClass}`}
                    >
                      <option value="Home">Home</option>
                      <option value="Office">Office / Workplace</option>
                      <option value="Warehouse">Warehouse / Depot</option>
                      <option value="Holiday Home">Holiday Home</option>
                      <option value="Family Residence">Family Residence</option>
                      <option value="Commercial Site">Commercial Site</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className={`text-[10px] font-bold uppercase ${labelClass}`}>Full Physical Address</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 88 Grayston Drive, Sandton"
                      value={newLocationAddress}
                      onChange={e => setNewLocationAddress(e.target.value)}
                      className={`p-2.5 rounded-xl text-xs border ${inputBgClass}`}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className={`text-[10px] font-bold uppercase ${labelClass}`}>Gate Access / Security Instructions</label>
                    <input
                      type="text"
                      placeholder="e.g. Code #4921, ask for guard Sipho"
                      value={newLocationNotes}
                      onChange={e => setNewLocationNotes(e.target.value)}
                      className={`p-2.5 rounded-xl text-xs border ${inputBgClass}`}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddLocationModal(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-red hover:bg-red/90 text-white text-xs font-bold rounded-xl"
                    >
                      Save Site
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION D: CHANGE PASSWORD AND SECURITY                                   */}
      {/* ========================================================================= */}
      {activeSubTab === 'security' && (
        <div className="flex flex-col gap-6">
          <form onSubmit={handleChangePassword} className={`p-6 rounded-3xl border ${cardBgClass} shadow-md flex flex-col gap-5`}>
            <div>
              <h3 className="text-base font-black italic uppercase font-brand-header text-navy dark:text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-red" />
                Change Password & Account Security
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Protect your account by setting a strong password with letters, numbers, and special characters.
              </p>
            </div>

            {passwordSuccessMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-2xl flex items-center gap-2 animate-fadeIn">
                <Check className="w-4 h-4 shrink-0" />
                <span>{passwordSuccessMsg}</span>
              </div>
            )}

            {passwordErrorMsg && (
              <div className="p-3 bg-red/10 border border-red/30 text-red text-xs font-bold rounded-2xl flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordErrorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Current Password */}
              <div className="flex flex-col gap-1.5">
                <label className={`text-[10px] font-black uppercase tracking-wider ${labelClass}`}>
                  Current Password *
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className={`p-3 pr-10 rounded-xl text-xs border w-full focus:outline-none transition-all ${inputBgClass}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="flex flex-col gap-1.5">
                <label className={`text-[10px] font-black uppercase tracking-wider ${labelClass}`}>
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className={`p-3 pr-10 rounded-xl text-xs border w-full focus:outline-none transition-all ${inputBgClass}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="flex flex-col gap-1.5">
                <label className={`text-[10px] font-black uppercase tracking-wider ${labelClass}`}>
                  Confirm New Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    className={`p-3 pr-10 rounded-xl text-xs border w-full focus:outline-none transition-all ${inputBgClass}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200/50 dark:border-slate-800/80">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs text-red hover:underline font-bold cursor-pointer"
              >
                Forgot your password? Send recovery instructions
              </button>

              <button
                type="submit"
                disabled={passwordSaving}
                className="px-6 py-3 bg-red hover:bg-red/90 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Key className="w-4 h-4" />
                <span>{passwordSaving ? 'Updating Password...' : 'Update Password'}</span>
              </button>
            </div>

            {forgotPasswordMsg && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 text-blue-500 text-xs font-bold rounded-2xl">
                {forgotPasswordMsg}
              </div>
            )}
          </form>

          {/* Account Security & Sessions Info */}
          <div className={`p-5 rounded-3xl border ${cardBgClass} shadow-md flex items-start gap-4`}>
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div className="space-y-1 flex-1 text-xs">
              <h4 className="font-bold text-navy dark:text-white">Enterprise-Grade Password Security</h4>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                Passwords are authenticated with 10-round salted bcrypt hashing and are never logged, stored in plain text, or exposed in API responses. Session timeouts protect your account when unattended.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION E: NOTIFICATIONS PREFERENCES                                      */}
      {/* ========================================================================= */}
      {activeSubTab === 'notifications' && (
        <form onSubmit={handleSaveNotifications} className={`p-6 rounded-3xl border ${cardBgClass} shadow-md flex flex-col gap-6`}>
          <div>
            <h3 className="text-base font-black italic uppercase font-brand-header text-navy dark:text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-red" />
              Customer Notification Preferences
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Choose which channels Same Day Assist uses to notify you about dispatches, contractor arrivals, and invoices.
            </p>
          </div>

          {notificationsSuccessMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-2xl flex items-center gap-2 animate-fadeIn">
              <Check className="w-4 h-4 shrink-0" />
              <span>{notificationsSuccessMsg}</span>
            </div>
          )}

          <div className="space-y-4">
            <h4 className={`text-[11px] font-black uppercase tracking-wider ${labelClass}`}>
              Connected Notification Delivery Channels
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Email Notifications */}
              <label className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${innerBgClass} hover:border-slate-400`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-navy dark:text-white block">Email Notifications</span>
                    <span className="text-[10px] text-slate-400">Invoices, quotes, and formal job logs</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={prefEmail}
                  onChange={e => setPrefEmail(e.target.checked)}
                  className="w-4 h-4 accent-red cursor-pointer"
                />
              </label>

              {/* SMS Notifications */}
              <label className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${innerBgClass} hover:border-slate-400`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-navy dark:text-white block">SMS Notifications</span>
                    <span className="text-[10px] text-slate-400">Emergency dispatch alerts and OTPs</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={prefSms}
                  onChange={e => setPrefSms(e.target.checked)}
                  className="w-4 h-4 accent-red cursor-pointer"
                />
              </label>

              {/* Push Notifications */}
              <label className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${innerBgClass} hover:border-slate-400`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-navy dark:text-white block">Push Notifications</span>
                    <span className="text-[10px] text-slate-400">Live contractor ETA and GPS radar</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={prefPush}
                  onChange={e => setPrefPush(e.target.checked)}
                  className="w-4 h-4 accent-red cursor-pointer"
                />
              </label>

              {/* In-App Notifications */}
              <label className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${innerBgClass} hover:border-slate-400`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-navy dark:text-white block">In-App Banner Notifications</span>
                    <span className="text-[10px] text-slate-400">Real-time alerts while portal is open</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={prefInApp}
                  onChange={e => setPrefInApp(e.target.checked)}
                  className="w-4 h-4 accent-red cursor-pointer"
                />
              </label>
            </div>

            <h4 className={`text-[11px] font-black uppercase tracking-wider pt-2 ${labelClass}`}>
              Event Specific Notification Categories
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer ${innerBgClass}`}>
                <input
                  type="checkbox"
                  checked={prefServiceUpdates}
                  onChange={e => setPrefServiceUpdates(e.target.checked)}
                  className="w-4 h-4 accent-red mt-0.5"
                />
                <div>
                  <span className="font-bold text-xs text-navy dark:text-white block">Service Request Updates</span>
                  <span className="text-[10px] text-slate-400">Milestone status: Dispatched, En Route, Arrived, Done</span>
                </div>
              </label>

              <label className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer ${innerBgClass}`}>
                <input
                  type="checkbox"
                  checked={prefPaymentAlerts}
                  onChange={e => setPrefPaymentAlerts(e.target.checked)}
                  className="w-4 h-4 accent-red mt-0.5"
                />
                <div>
                  <span className="font-bold text-xs text-navy dark:text-white block">Billing & Payment Notices</span>
                  <span className="text-[10px] text-slate-400">Membership renewals, invoice receipts, benefit claims</span>
                </div>
              </label>

              <label className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer ${innerBgClass}`}>
                <input
                  type="checkbox"
                  checked={prefSecurityAlerts}
                  onChange={e => setPrefSecurityAlerts(e.target.checked)}
                  className="w-4 h-4 accent-red mt-0.5"
                />
                <div>
                  <span className="font-bold text-xs text-navy dark:text-white block">Critical Account & Security</span>
                  <span className="text-[10px] text-slate-400">Password updates, new login devices, urgent notices</span>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-200/50 dark:border-slate-800/80">
            <button
              type="submit"
              disabled={notificationsSaving}
              className="px-6 py-3 bg-red hover:bg-red/90 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{notificationsSaving ? 'Saving...' : 'Save Notification Preferences'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* SECTION F: PLAN DETAILS, COMPLIANCE, SUPPORT & SIGN OUT                   */}
      {/* ========================================================================= */}
      {activeSubTab === 'account' && (
        <div className="flex flex-col gap-6">
          <div className={`p-6 rounded-3xl border ${cardBgClass} shadow-md flex flex-col gap-5`}>
            <div>
              <h3 className="text-base font-black italic uppercase font-brand-header text-navy dark:text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-red" />
                Membership Plan & Coverage Summary
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Your enrolled assistance tier and current standing with the Same Day Assist network.
              </p>
            </div>

            <div className={`p-4 rounded-2xl border ${innerBgClass} flex flex-col md:flex-row items-start md:items-center justify-between gap-4`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-base font-black italic uppercase font-brand-header text-navy dark:text-white">
                    {user?.package || activeCustomer?.package || 'Assist Plus'} Plan
                  </span>
                  <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded">
                    ACTIVE COVERAGE
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Member Since: {user?.memberSince || activeCustomer?.memberSince || '2026'} • Account ID: {user?.id?.slice(0, 8) || 'SDA-MEM-2026'}
                </p>
              </div>

              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('payments')}
                  className="px-4 py-2 bg-navy dark:bg-slate-800 hover:bg-navy/90 text-white text-xs font-bold rounded-xl transition-all border border-slate-700 cursor-pointer"
                >
                  Manage Membership & Billing
                </button>
              )}
            </div>

            {/* Compliance & Regulatory Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className={`p-3.5 rounded-2xl border ${innerBgClass} space-y-1`}>
                <span className="text-[10px] font-bold text-red font-mono">PSIRA REGISTERED</span>
                <p className="text-xs font-bold text-navy dark:text-white">Private Security Industry</p>
                <p className="text-[10px] text-slate-400">Fully vetted, background-checked and accredited dispatch units.</p>
              </div>

              <div className={`p-3.5 rounded-2xl border ${innerBgClass} space-y-1`}>
                <span className="text-[10px] font-bold text-red font-mono">SABS CERTIFIED</span>
                <p className="text-xs font-bold text-navy dark:text-white">Technical Standards</p>
                <p className="text-[10px] text-slate-400">Plumbing, electrical, and security equipment verified to SABS norms.</p>
              </div>

              <div className={`p-3.5 rounded-2xl border ${innerBgClass} space-y-1`}>
                <span className="text-[10px] font-bold text-red font-mono">POPIA COMPLIANT</span>
                <p className="text-xs font-bold text-navy dark:text-white">Data Privacy Protection</p>
                <p className="text-[10px] text-slate-400">Your address and contact information are strictly guarded under POPIA.</p>
              </div>
            </div>

            {/* Direct Support & Hotline */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200/50 dark:border-slate-800/80">
              <div className="flex items-center gap-3">
                <a
                  href="tel:+27115559111"
                  className="flex items-center gap-2 px-4 py-2.5 bg-red hover:bg-red/90 text-white text-xs font-black uppercase rounded-xl transition-all shadow-md"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call Operations Hotline</span>
                </a>
                <span className="text-xs text-slate-400 font-mono">+27 (0) 11 555 9111</span>
              </div>

              <button
                type="button"
                onClick={() => logout()}
                className="px-5 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-red hover:text-white text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of Account</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
