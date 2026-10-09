import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, ShieldCheck, Mail, Phone, Briefcase } from 'lucide-react';
import { AuthorisedContact } from '../../types';
import { api } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';

interface AuthorisedContactsManagerProps {
  title?: string;
  description?: string;
}

export function AuthorisedContactsManager({ 
  title = "Additional Keyholders & Authorised Contacts",
  description = "Designate additional family members, keyholders, or corporate representatives permitted to request emergency dispatch."
}: AuthorisedContactsManagerProps) {
  const { isDark } = useTheme();
  const [contacts, setContacts] = useState<AuthorisedContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    phone: '',
    position: 'Emergency Keyholder / Next of Kin',
    permissions: 'Full' as 'Full' | 'Dispatch Only' | 'Billing Only',
  });

  const loadContacts = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAuthorisedContacts();
      setContacts(data);
    } catch (e) {
      console.error('Failed to load authorised contacts', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name.trim() || !newContact.email.trim() || !newContact.phone.trim()) return;

    try {
      await api.addAuthorisedContact(newContact);
      setNewContact({ name: '', email: '', phone: '', position: 'Emergency Keyholder / Next of Kin', permissions: 'Full' });
      setShowAddModal(false);
      loadContacts();
    } catch (e) {
      console.error('Failed to add contact', e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this contact?')) return;
    try {
      await api.deleteAuthorisedContact(id);
      loadContacts();
    } catch (e) {
      console.error('Failed to delete contact', e);
    }
  };

  return (
    <div className={`border rounded-2xl p-6 shadow-sm space-y-6 ${
      isDark ? 'bg-slate-900/60 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-navy'
    }`}>
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <div>
          <h3 className={`text-sm font-bold flex items-center gap-2 ${
            isDark ? 'text-white' : 'text-navy'
          }`}>
            <Users className="w-4 h-4 text-red" /> {title}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red hover:bg-red/90 text-white text-xs font-bold transition-all shadow-md shrink-0 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" /> Add Keyholder / Contact
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-xs text-slate-400">Loading contacts...</div>
      ) : contacts.length === 0 ? (
        <div className={`text-center py-8 border border-dashed rounded-xl ${
          isDark ? 'border-slate-800' : 'border-slate-300'
        }`}>
          <Users className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
          <p className="text-xs font-bold text-slate-400">No Additional Keyholders Configured</p>
          <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
            Add trusted family members, secondary emergency keyholders, or branch managers who are authorized to verify dispatches.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {contacts.map(c => (
            <div 
              key={c.id} 
              className={`p-4 rounded-xl border flex items-start justify-between transition-all ${
                isDark ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-navy'}`}>{c.name}</span>
                  <span className="text-[10px] bg-red/10 text-red px-2 py-0.5 rounded font-mono font-bold border border-red/20">
                    {c.permissions}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 opacity-70" /> {c.position}
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 opacity-70" /> {c.email}
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 opacity-70" /> {c.phone}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDelete(c.id)}
                className="text-slate-400 hover:text-red p-1.5 rounded-lg hover:bg-red/10 transition-all cursor-pointer"
                title="Remove Contact"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className={`border rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4 ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-navy'
          }`}>
            <h4 className="text-sm font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-red" /> Add Keyholder / Next of Kin Contact
            </h4>

            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newContact.name}
                  onChange={e => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Sipho Dlamini"
                  className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-navy'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newContact.email}
                  onChange={e => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="sipho@example.co.za"
                  className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-navy'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={newContact.phone}
                    onChange={e => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+27 82 123 4567"
                    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-navy'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Relationship / Role</label>
                  <input
                    type="text"
                    value={newContact.position}
                    onChange={e => setNewContact(prev => ({ ...prev, position: e.target.value }))}
                    placeholder="e.g. Next of Kin (Spouse) / Keyholder"
                    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red ${
                      isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-navy'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Dispatch & Activity Permissions</label>
                <select
                  value={newContact.permissions}
                  onChange={e => setNewContact(prev => ({ ...prev, permissions: e.target.value as any }))}
                  className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-navy'
                  }`}
                >
                  <option value="Full">Full Access (Emergency Dispatch & Billing Verification)</option>
                  <option value="Dispatch Only">Dispatch Only (Request Assistance & Security Alerts)</option>
                  <option value="Billing Only">Billing Only (View Invoices & Receipts)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className={`px-4 py-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                    isDark ? 'border-slate-700 text-slate-400 hover:text-white' : 'border-slate-200 text-slate-600 hover:text-navy'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red hover:bg-red/90 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Save Keyholder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
