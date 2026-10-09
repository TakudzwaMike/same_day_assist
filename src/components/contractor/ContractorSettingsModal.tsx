import React, { useState } from 'react';
import { 
  Settings, X, Shield, Lock, Bell, Moon, Sun, Check, 
  Volume2, VolumeX, Wrench, User, AlertCircle, Save, Key, MapPin 
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAppState } from '../../contexts/AppStateContext';
import { api } from '../../services/api';

interface ContractorSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContractorSettingsModal({ isOpen, onClose }: ContractorSettingsModalProps) {
  const { theme, toggleTheme, isDark } = useTheme();
  const { user, refreshUser } = useAuth();
  const { addAuditLogLocal } = useAppState();

  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security'>('profile');

  // Profile state
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [specialty, setSpecialty] = useState((user as any)?.specialty || 'Security Services');
  const [coverageArea, setCoverageArea] = useState((user as any)?.address || 'Johannesburg Metro');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // Dispatch sound settings
  const [soundAlerts, setSoundAlerts] = useState(() => localStorage.getItem('sda_contractor_sound_alerts') !== 'false');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMsg(null);
    try {
      await api.updateProfile({ 
        name, 
        phone,
      });
      await refreshUser();
      addAuditLogLocal('Contractor Profile Updated', `Service Provider ${name} updated contact details.`);
      setProfileMsg('Provider details saved successfully!');
      setTimeout(() => setProfileMsg(null), 3500);
    } catch (err: any) {
      setProfileMsg(err.message || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleToggleSound = () => {
    const nextVal = !soundAlerts;
    setSoundAlerts(nextVal);
    localStorage.setItem('sda_contractor_sound_alerts', String(nextVal));
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    if (!currentPassword || !newPassword) {
      setPasswordMsg({ type: 'error', text: 'Please complete all password fields.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setPasswordSaving(true);
    try {
      await api.changePassword({ currentPassword, newPassword, confirmPassword });
      setPasswordMsg({ type: 'success', text: 'Password successfully updated!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMsg(null), 4000);
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Failed to change password. Verify your current password.' });
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className={`w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
        isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-navy'
      }`}>
        {/* HEADER */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isDark ? 'bg-zinc-950/80 border-zinc-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-600/10 border border-red-600/20 text-red-500 rounded-xl">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black italic uppercase font-brand-header">
                Provider Account Settings
              </h2>
              <p className="text-[10px] font-mono text-zinc-400">
                FIELD CONTRACTOR • {user?.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-500 hover:text-navy hover:bg-slate-200'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TABS */}
        <div className={`px-6 pt-3 border-b flex items-center gap-2 ${
          isDark ? 'border-zinc-800 bg-zinc-950/40' : 'border-slate-200 bg-slate-50/50'
        }`}>
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'profile' ? 'border-red-600 text-red-500' : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Provider Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'notifications' ? 'border-red-600 text-red-500' : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Alerts & Theme
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'security' ? 'border-red-600 text-red-500' : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Security & Login
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 overflow-y-auto space-y-5">
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {profileMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{profileMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Contractor Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500 ${
                      isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-navy'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+27 82 555 1234"
                    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500 ${
                      isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-navy'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Primary Specialty Trade</label>
                <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                  isDark ? 'bg-zinc-800/60 border-zinc-700 text-zinc-300' : 'bg-slate-50 border-slate-200 text-navy'
                }`}>
                  <Wrench className="w-4 h-4 text-red-500" />
                  <span>{specialty}</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Service Coverage Region</label>
                <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                  isDark ? 'bg-zinc-800/60 border-zinc-700 text-zinc-300' : 'bg-slate-50 border-slate-200 text-navy'
                }`}>
                  <MapPin className="w-4 h-4 text-red-500" />
                  <span>{coverageArea}</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingProfile ? 'Saving...' : 'Save Profile'}</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              {/* Audio Alerts */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <h4 className="text-xs font-bold flex items-center gap-2">
                    {soundAlerts ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-zinc-400" />}
                    Audible Tone on New Assignment
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Play audible tone whenever an emergency job is dispatched to you.</p>
                </div>

                <button
                  type="button"
                  onClick={handleToggleSound}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    soundAlerts ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {soundAlerts ? 'ENABLED' : 'MUTED'}
                </button>
              </div>

              {/* Theme Toggle */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <h4 className="text-xs font-bold flex items-center gap-2">
                    {isDark ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                    App Appearance
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Currently set to {isDark ? 'Dark Mode' : 'Light Mode'}.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={toggleTheme}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                  <span>Switch Theme</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Lock className="w-4 h-4 text-red-500" /> Change Provider Password
              </h4>

              {passwordMsg && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  passwordMsg.type === 'success' 
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                    : 'bg-red-500/10 border border-red-500/30 text-red-500'
                }`}>
                  {passwordMsg.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{passwordMsg.text}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Current Password *</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500 ${
                    isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-navy'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">New Password *</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500 ${
                      isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-navy'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Confirm New Password *</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500 ${
                      isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-50 border-slate-200 text-navy'
                    }`}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>{passwordSaving ? 'Updating...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
