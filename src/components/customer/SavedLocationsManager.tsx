import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, Home, Building2, Warehouse, Factory, ShieldAlert } from 'lucide-react';
import { SavedLocation } from '../../types';
import { api } from '../../services/api';

export function SavedLocationsManager() {
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
    if (!window.confirm('Are you sure you want to remove this saved location?')) return;
    try {
      await api.deleteSavedLocation(id);
      loadLocations();
    } catch (e) {
      console.error('Failed to delete location', e);
    }
  };

  const getIcon = (label: string) => {
    switch (label.toLowerCase()) {
      case 'home': return <Home className="w-5 h-5 text-emerald-400" />;
      case 'office': return <Building2 className="w-5 h-5 text-blue-400" />;
      case 'warehouse': return <Warehouse className="w-5 h-5 text-amber-400" />;
      case 'factory': return <Factory className="w-5 h-5 text-purple-400" />;
      default: return <MapPin className="w-5 h-5 text-red-400" />;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100 space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-red-500" /> Saved Properties & Service Locations
          </h3>
          <p className="text-xs text-slate-400 mt-1">Manage physical sites for fast one-click emergency assistance and service dispatch.</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-lg shadow-red-600/30"
        >
          <Plus className="w-4 h-4" /> Add Saved Location
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-xs text-slate-500">Loading saved locations...</div>
      ) : locations.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
          <MapPin className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-400">No Saved Locations Yet</p>
          <p className="text-xs text-slate-500 mt-1">Add your home, office, or commercial sites to speed up dispatch requests.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {locations.map(loc => (
            <div key={loc.id} className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  {getIcon(loc.label)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{loc.label}</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{loc.address}</p>
                  {loc.accessNotes && (
                    <p className="text-[11px] text-slate-500 mt-1 font-mono">Access: {loc.accessNotes}</p>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleDelete(loc.id)}
                className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-900 transition-all"
                title="Delete Location"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Location Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <h4 className="text-base font-bold text-white">Add New Saved Location</h4>

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Location Label</label>
                <select
                  value={newLocation.label}
                  onChange={e => setNewLocation(prev => ({ ...prev, label: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500"
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
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Full Physical Address *</label>
                <input
                  type="text"
                  required
                  value={newLocation.address}
                  onChange={e => setNewLocation(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="e.g. 12 West Street, Sandown, Sandton"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Site Access Instructions / Gate Code</label>
                <input
                  type="text"
                  value={newLocation.accessNotes}
                  onChange={e => setNewLocation(prev => ({ ...prev, accessNotes: e.target.value }))}
                  placeholder="e.g. Gate Code 5501, Guard check-in required"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500"
                />
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
                  Save Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
