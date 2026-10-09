import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, Home, Building2, Warehouse, Factory, ShieldAlert, Check } from 'lucide-react';
import { SavedLocation } from '../../types';
import { api } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';

export function SavedLocationsManager() {
  const { isDark } = useTheme();
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newLocation, setNewLocation] = useState({
    label: 'Home',
    address: '',
    accessNotes: '',
    lat: -26.2041,
    lng: 28.0473,
  });

  const loadLocations = async () => {
    setIsLoading(true);
    try {
      const data = await api.getSavedLocations();
      setLocations(data);
    } catch (e) {
      console.error('Failed to load saved locations', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocation.address.trim()) return;

    try {
      await api.addSavedLocation(newLocation);
      setNewLocation({ label: 'Home', address: '', accessNotes: '', lat: -26.2041, lng: 28.0473 });
      setShowAddModal(false);
      loadLocations();
    } catch (e) {
      console.error('Failed to add location', e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this saved property?')) return;
    try {
      await api.deleteSavedLocation(id);
      loadLocations();
    } catch (e) {
      console.error('Failed to delete location', e);
    }
  };

  const getIcon = (label: string) => {
    switch (label.toLowerCase()) {
      case 'home':
      case 'residential':
      case 'apartment':
        return <Home className="w-5 h-5 text-emerald-400" />;
      case 'office':
      case 'workplace':
      case 'commercial':
        return <Building2 className="w-5 h-5 text-blue-400" />;
      case 'warehouse':
        return <Warehouse className="w-5 h-5 text-amber-400" />;
      case 'factory':
      case 'industrial':
        return <Factory className="w-5 h-5 text-purple-400" />;
      default:
        return <Building2 className="w-5 h-5 text-red" />;
    }
  };

  const cardBgClass = isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const innerBgClass = isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200';
  const inputBgClass = isDark ? 'bg-slate-950 text-white border-slate-800' : 'bg-white text-slate-900 border-slate-200';

  return (
    <div className={`p-6 rounded-3xl border shadow-md space-y-6 animate-fadeIn ${cardBgClass}`}>
      <div className={`flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
        <div>
          <h3 className={`text-base font-black italic uppercase font-brand-header flex items-center gap-2 ${isDark ? 'text-white' : 'text-navy'}`}>
            <Building2 className="w-5 h-5 text-red" />
            My Properties & Service Sites
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage your residential, office, and commercial properties for rapid emergency dispatch and on-demand assistance.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red hover:bg-red/90 text-white text-xs font-bold transition-all shadow-md cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Property
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-xs text-slate-400">Loading registered properties...</div>
      ) : locations.length === 0 ? (
        <div className={`text-center py-10 border border-dashed rounded-2xl ${innerBgClass}`}>
          <Building2 className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No Properties Registered Yet</p>
          <p className="text-xs text-slate-400 mt-1">Add your home, office, or commercial sites to speed up dispatch requests.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {locations.map(loc => (
            <div key={loc.id} className={`p-4 rounded-2xl border flex items-start justify-between gap-3 transition-all ${innerBgClass}`}>
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  {getIcon(loc.label)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-navy'}`}>{loc.label}</span>
                    <span className="text-[9px] font-mono px-2 py-0.2 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold">
                      VERIFIED PROPERTY
                    </span>
                  </div>
                  <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{loc.address}</p>
                  {loc.accessNotes && (
                    <p className="text-[11px] text-slate-400 mt-1 font-mono">Access / Gate: {loc.accessNotes}</p>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleDelete(loc.id)}
                className="text-slate-400 hover:text-red p-1.5 rounded-lg hover:bg-red/10 transition-all cursor-pointer"
                title="Remove Property"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Property Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`border rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 animate-scaleUp ${cardBgClass}`}>
            <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <h4 className={`text-sm font-black uppercase font-brand-header ${isDark ? 'text-white' : 'text-navy'}`}>
                Add New Property Site
              </h4>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Property Type / Designation
                </label>
                <select
                  value={newLocation.label}
                  onChange={e => setNewLocation({ ...newLocation, label: e.target.value })}
                  className={`w-full p-2.5 rounded-xl text-xs border focus:outline-none ${inputBgClass}`}
                >
                  <option value="Home">Home / Primary Residence</option>
                  <option value="Apartment">Apartment / Complex Unit</option>
                  <option value="Office">Office / Workplace</option>
                  <option value="Warehouse">Warehouse / Storage Facility</option>
                  <option value="Commercial">Commercial / Retail Site</option>
                  <option value="Holiday Home">Holiday Home</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Physical Property Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 24 Katherine Street, Sandton, Johannesburg"
                  value={newLocation.address}
                  onChange={e => setNewLocation({ ...newLocation, address: e.target.value })}
                  className={`w-full p-2.5 rounded-xl text-xs border focus:outline-none ${inputBgClass}`}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Security Access / Gate Instructions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Gate code #1234, intercom unit 4B, security guard on duty"
                  value={newLocation.accessNotes}
                  onChange={e => setNewLocation({ ...newLocation, accessNotes: e.target.value })}
                  className={`w-full p-2.5 rounded-xl text-xs border focus:outline-none ${inputBgClass}`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-red hover:bg-red/90 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Save Property
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
