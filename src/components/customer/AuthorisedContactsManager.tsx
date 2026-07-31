import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, ShieldCheck, Mail, Phone, Briefcase } from 'lucide-react';
import { AuthorisedContact } from '../../types';
import { api } from '../../services/api';

export function AuthorisedContactsManager() {
  const [contacts, setContacts] = useState<AuthorisedContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    phone: '',
    position: 'Operations Manager',
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
      setNewContact({ name: '', email: '', phone: '', position: 'Operations Manager', permissions: 'Full' });
      setShowAddModal(false);
      loadContacts();
    } catch (e) {
      console.error('Failed to add contact', e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this authorised contact?')) return;
    try {
      await api.deleteAuthorisedContact(id);
      loadContacts();
    } catch (e) {
      console.error('Failed to delete contact', e);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100 space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-red-500" /> Authorised Organization Contacts
          </h3>
          <p className="text-xs text-slate-400 mt-1">Designate employees or representatives permitted to request services or view organization activity.</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-lg shadow-red-600/30"
        >
          <UserPlus className="w-4 h-4" /> Add Authorised Contact
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-xs text-slate-500">Loading authorised contacts...</div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
          <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-400">No Authorised Contacts Configured</p>
          <p className="text-xs text-slate-500 mt-1">Add authorized dispatch personnel or department heads for your account.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contacts.map(c => (
            <div key={c.id} className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">{c.name}</span>
                  <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-semibold border border-red-500/30">
                    {c.permissions}
                  </span>
                </div>

                <div className="text-xs text-slate-400 flex items-center gap-1.5 pt-1">
                  <Briefcase className="w-3.5 h-3.5 text-slate-500" /> {c.position}
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" /> {c.email}
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500" /> {c.phone}
                </div>
              </div>

              <button
                onClick={() => handleDelete(c.id)}
                className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-900 transition-all"
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <h4 className="text-base font-bold text-white">Add Authorised Contact</h4>

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newContact.name}
                  onChange={e => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Sipho Dlamini"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newContact.email}
                  onChange={e => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="sipho@company.co.za"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={newContact.phone}
                    onChange={e => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+27 82 123 4567"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Job Position</label>
                  <input
                    type="text"
                    value={newContact.position}
                    onChange={e => setNewContact(prev => ({ ...prev, position: e.target.value }))}
                    placeholder="e.g. Site Security Manager"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Dispatch & Activity Permissions</label>
                <select
                  value={newContact.permissions}
                  onChange={e => setNewContact(prev => ({ ...prev, permissions: e.target.value as any }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500"
                >
                  <option value="Full">Full Access (Request Services & View Billing)</option>
                  <option value="Dispatch Only">Dispatch Only (Request Assistance Only)</option>
                  <option value="Billing Only">Billing Only (View Invoices & Receipts)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
