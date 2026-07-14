import React, { useState } from 'react';
import { useAppState } from '../../contexts/AppStateContext';
import { useAuth } from '../../contexts/AuthContext';

interface CustomerProfileProps {
  activeCustomer: any;
}

export default function CustomerProfile({ activeCustomer }: CustomerProfileProps) {
  const { state, updateState, addAuditLogLocal } = useAppState();
  
  const [profileName, setProfileName] = useState(activeCustomer?.name || '');
  const [profileEmail, setProfileEmail] = useState(activeCustomer?.email || '');
  const [profilePhone, setProfilePhone] = useState(activeCustomer?.phone || '');
  const [profileAddress, setProfileAddress] = useState(activeCustomer?.address || '');
  
  // Notification Preferences
  const [prefEmail, setPrefEmail] = useState(true);
  const [prefSms, setPrefSms] = useState(true);
  const [prefPush, setPrefPush] = useState(true);
  const [prefInApp, setPrefInApp] = useState(true);
  
  const [profileSavedMsg, setProfileSavedMsg] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName || !profileEmail || !profilePhone || !profileAddress) {
      alert('Please fill in all profile fields.');
      return;
    }
    
    // Update local context state
    const updatedCustomers = state.customers.map(c => 
      c.id === activeCustomer.id 
        ? { ...c, name: profileName, email: profileEmail, phone: profilePhone, address: profileAddress } 
        : c
    );
    
    updateState({ customers: updatedCustomers });
    addAuditLogLocal('Profile Updated', `Customer ${profileName} updated contact details.`);
    setProfileSavedMsg(true);
    setTimeout(() => setProfileSavedMsg(false), 3000);
  };

  return (
    <div className="flex flex-col gap-4 animate-fadeIn">
      <div className="border-b border-slate-100 pb-1.5">
        <h3 className="text-xs font-bold text-navy uppercase tracking-wider">My Account Profile</h3>
        <p className="text-[9px] text-slate-400">Manage your contact details, physical address, and communication channels</p>
      </div>

      <form onSubmit={handleSaveProfile} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col gap-4">
        {profileSavedMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] p-2.5 rounded-xl text-center font-bold">
            ✓ Profile details successfully updated!
          </div>
        )}

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase">Full Name</label>
            <input 
              type="text" 
              required
              value={profileName}
              onChange={e => setProfileName(e.target.value)}
              className="text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-navy"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Email Address</label>
              <input 
                type="email" 
                required
                value={profileEmail}
                onChange={e => setProfileEmail(e.target.value)}
                className="text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-navy"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Mobile Phone</label>
              <input 
                type="tel" 
                required
                value={profilePhone}
                onChange={e => setProfilePhone(e.target.value)}
                className="text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-navy"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase">Physical Dispatch Address</label>
            <input 
              type="text" 
              required
              value={profileAddress}
              onChange={e => setProfileAddress(e.target.value)}
              className="text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-navy"
            />
          </div>

          {/* Notification Preferences */}
          <div className="border-t border-slate-100 pt-3 mt-1">
            <label className="text-[9.5px] font-bold text-navy uppercase tracking-wider mb-2 block">Notification Preferences</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={prefEmail} 
                  onChange={e => setPrefEmail(e.target.checked)} 
                  className="rounded text-navy focus:ring-navy" 
                />
                <span className="text-[10px] font-bold text-slate-600">Email</span>
              </label>
              <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={prefSms} 
                  onChange={e => setPrefSms(e.target.checked)} 
                  className="rounded text-navy focus:ring-navy" 
                />
                <span className="text-[10px] font-bold text-slate-600">SMS</span>
              </label>
              <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={prefPush} 
                  onChange={e => setPrefPush(e.target.checked)} 
                  className="rounded text-navy focus:ring-navy" 
                />
                <span className="text-[10px] font-bold text-slate-600">Push App</span>
              </label>
              <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={prefInApp} 
                  onChange={e => setPrefInApp(e.target.checked)} 
                  className="rounded text-navy focus:ring-navy" 
                />
                <span className="text-[10px] font-bold text-slate-600">In-App</span>
              </label>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[10px] text-slate-500 space-y-1.5 mt-2">
            <p className="font-extrabold text-navy uppercase text-[8px] tracking-wider">Active Coverage Plan</p>
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-700">{activeCustomer?.package || 'Platinum'} Membership Assist</span>
              <span className="text-[8px] bg-red text-white px-2 py-0.5 rounded font-extrabold uppercase tracking-wide">ZAR COVERED</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-navy hover:bg-navy/95 text-white text-xs font-brand-header py-3 rounded-xl shadow-xs transition-all uppercase tracking-wider cursor-pointer mt-1"
        >
          Save Account Changes
        </button>
      </form>
    </div>
  );
}
