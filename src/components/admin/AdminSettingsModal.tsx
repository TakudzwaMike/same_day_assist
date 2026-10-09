import React, { useState } from 'react';
import { 
  Settings, X, Shield, Lock, Bell, Moon, Sun, Check, 
  Volume2, VolumeX, Clock, RefreshCw, Key, User, AlertCircle, Save 
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAppState } from '../../contexts/AppStateContext';
import { api } from '../../services/api';

interface AdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminSettingsModal({ isOpen, onClose }: AdminSettingsModalProps) {
  const { theme, toggleTheme, isDark } = useTheme();
  const { user, refreshUser } = useAuth();
  const { addAuditLogLocal } = useAppState();

  const [activeTab, setActiveTab] = useState<'general' | 'dispatch' | 'security' | 'notifications'>('general');

  // Profile state
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // Operational Dispatch Settings
  const [soundAlerts, setSoundAlerts] = useState(() => localStorage.getItem('sda_admin_sound_alerts') !== 'false');
  const [slaThreshold, setSlaThreshold] = useState(() => localStorage.getItem('sda_admin_sla_threshold') || '15');
  const [autoRefreshRate, setAutoRefreshRate] = useState(() => localStorage.getItem('sda_admin_refresh_rate') || '30');
  const [dispatchSavedMsg, setDispatchSavedMsg] = useState<string | null>(null);

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
      await api.updateProfile({ name, phone });
      await refreshUser();
      addAuditLogLocal('Admin Profile Updated', `Administrator ${name} updated contact profile details.`);
      setProfileMsg('Admin details updated successfully!');
      setTimeout(() => setProfileMsg(null), 3500);
    } catch (err: any) {
      setProfileMsg(err.message || 'Failed to update admin profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveDispatchSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('sda_admin_sound_alerts', String(soundAlerts));
    localStorage.setItem('sda_admin_sla_threshold', slaThreshold);
    localStorage.setItem('sda_admin_refresh_rate', autoRefreshRate);
    setDispatchSavedMsg('Dispatch parameters saved successfully!');
    setTimeout(() => setDispatchSavedMsg(null), 3500);
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
      <div className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-navy'
      }`}>
        {/* MODAL HEADER */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red/10 border border-red/20 text-red rounded-xl">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black italic uppercase font-brand-header">
                System & Account Settings
              </h2>
              <p className="text-[10px] font-mono text-slate-400">
                {user?.role?.toUpperCase()} • {user?.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-navy hover:bg-slate-200'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SUBTABS */}
        <div className={`px-6 pt-3 border-b flex items-center gap-2 overflow-x-auto ${
          isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50/50'
        }`}>
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'general' ? 'border-red text-red' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            General & Theme
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dispatch')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'dispatch' ? 'border-red text-red' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Dispatch Operations
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'security' ? 'border-red text-red' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Password & Security
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto space-y-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Appearance / Theme Toggle */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <h4 className="text-xs font-bold flex items-center gap-2">
                    {isDark ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                    Theme Mode
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Currently using {isDark ? 'Navy Dark Mode' : 'Clean Light Mode'}.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={toggleTheme}
                  className="px-4 py-2 bg-red hover:bg-red/90 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                  <span>Switch to {isDark ? 'Light' : 'Dark'}</span>
                </button>
              </div>

              {/* Profile Details Form */}
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <User className="w-4 h-4 text-red" /> Administrator Credentials
                </h4>

                {profileMsg && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{profileMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-navy'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Direct Phone</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+27 11 555 0100"
                      className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-navy'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Assigned Email</label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full border border-slate-700/50 bg-slate-800/50 rounded-xl px-3 py-2 text-xs text-slate-400 cursor-not-allowed font-mono"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-5 py-2.5 bg-red hover:bg-red/90 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingProfile ? 'Saving...' : 'Save Profile Details'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'dispatch' && (
            <form onSubmit={handleSaveDispatchSettings} className="space-y-5">
              {dispatchSavedMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{dispatchSavedMsg}</span>
                </div>
              )}

              {/* Sound Alerts */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <h4 className="text-xs font-bold flex items-center gap-2">
                    {soundAlerts ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                    Audible Alarm On Emergency
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Play urgent audio tone when high-priority panic emergency is triggered.</p>
                </div>

                <button
                  type="button"
                  onClick={() => setSoundAlerts(!soundAlerts)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    soundAlerts ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {soundAlerts ? 'ENABLED' : 'MUTED'}
                </button>
              </div>

              {/* SLA Threshold */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <h4 className="text-xs font-bold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    SLA Alert Window Threshold
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Flag dispatches taking longer than this target arrival window.</p>
                </div>

                <select
                  value={slaThreshold}
                  onChange={e => setSlaThreshold(e.target.value)}
                  className={`border rounded-xl px-3 py-1.5 text-xs font-mono font-bold focus:outline-none focus:border-red ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-navy'
                  }`}
                >
                  <option value="10">10 Minutes</option>
                  <option value="15">15 Minutes (Default)</option>
                  <option value="20">20 Minutes</option>
                  <option value="30">30 Minutes</option>
                </select>
              </div>

              {/* Auto Refresh Rate */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <h4 className="text-xs font-bold flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-blue-400" />
                    Dashboard Live Sync Interval
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Polling frequency for dispatch tracking updates and telemetry.</p>
                </div>

                <select
                  value={autoRefreshRate}
                  onChange={e => setAutoRefreshRate(e.target.value)}
                  className={`border rounded-xl px-3 py-1.5 text-xs font-mono font-bold focus:outline-none focus:border-red ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-navy'
                  }`}
                >
                  <option value="15">15 Seconds (Rapid)</option>
                  <option value="30">30 Seconds (Standard)</option>
                  <option value="60">60 Seconds (Low Bandwidth)</option>
                </select>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-red hover:bg-red/90 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Operational Parameters</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Lock className="w-4 h-4 text-red" /> Update Administrative Password
              </h4>

              {passwordMsg && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  passwordMsg.type === 'success' 
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                    : 'bg-red-500/10 border border-red-500/30 text-red'
                }`}>
                  {passwordMsg.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{passwordMsg.text}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Current Password *</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-navy'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">New Password *</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-navy'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Confirm New Password *</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-navy'
                    }`}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="px-5 py-2.5 bg-red hover:bg-red/90 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
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
