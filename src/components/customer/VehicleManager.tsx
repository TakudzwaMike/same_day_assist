import React, { useState } from 'react';
import { Car, Plus, Trash2, Edit2, Check, AlertCircle, Shield } from 'lucide-react';
import { useAppState } from '../../contexts/AppStateContext';

export function VehicleManager() {
  const { state, addVehicle, updateVehicle, deleteVehicle } = useAppState();
  const vehicles = state.vehicles || [];

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [licensePlate, setLicensePlate] = useState('');
  const [color, setColor] = useState('');
  const [vinNumber, setVinNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const resetForm = () => {
    setMake('');
    setModel('');
    setYear(String(new Date().getFullYear()));
    setLicensePlate('');
    setColor('');
    setVinNumber('');
    setNotes('');
    setEditingId(null);
    setIsAdding(false);
    setFormError('');
  };

  const handleStartEdit = (v: any) => {
    setEditingId(v.id);
    setMake(v.make);
    setModel(v.model);
    setYear(String(v.year));
    setLicensePlate(v.licensePlate);
    setColor(v.color || '');
    setVinNumber(v.vinNumber || '');
    setNotes(v.notes || '');
    setIsAdding(true);
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMsg('');

    if (!make.trim() || !model.trim() || !licensePlate.trim()) {
      setFormError('Make, model, and license plate are required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        make: make.trim(),
        model: model.trim(),
        year: parseInt(year, 10) || new Date().getFullYear(),
        licensePlate: licensePlate.trim().toUpperCase(),
        color: color.trim() || 'Unspecified',
        vinNumber: vinNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      if (editingId) {
        await updateVehicle(editingId, payload);
        setSuccessMsg('Vehicle details updated successfully!');
      } else {
        await addVehicle(payload);
        setSuccessMsg('Vehicle added to your account fleet!');
      }

      resetForm();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save vehicle details');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, plate: string) => {
    if (!confirm(`Are you sure you want to remove vehicle ${plate} from your account?`)) return;

    try {
      await deleteVehicle(id);
      setSuccessMsg('Vehicle removed successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to delete vehicle');
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xs space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red">
            <Car className="w-4 h-4" /> Member Fleet Management
          </div>
          <h2 className="text-xl font-bold text-navy mt-0.5">My Registered Vehicles</h2>
          <p className="text-xs text-slate-500">
            Keep your vehicles on file for fast roadside & security dispatch without re-entering details during an emergency.
          </p>
        </div>

        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="px-4 py-2.5 bg-navy hover:bg-navy-light text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Vehicle</span>
          </button>
        )}
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Add / Edit Form Modal/Drawer */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-5 space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <h3 className="text-sm font-bold text-navy uppercase">
              {editingId ? 'Edit Vehicle Information' : 'Register New Vehicle'}
            </h3>
            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
            >
              Cancel
            </button>
          </div>

          {formError && (
            <div className="p-3 bg-red/10 border border-red/20 text-red text-xs font-bold rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Make *</label>
              <input
                type="text"
                required
                placeholder="e.g. Toyota"
                value={make}
                onChange={e => setMake(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-navy"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Model *</label>
              <input
                type="text"
                required
                placeholder="e.g. Hilux 2.8 GD-6"
                value={model}
                onChange={e => setModel(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-navy"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Year</label>
              <input
                type="number"
                min="1980"
                max={new Date().getFullYear() + 2}
                placeholder="e.g. 2022"
                value={year}
                onChange={e => setYear(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-navy"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Registration / Plate *</label>
              <input
                type="text"
                required
                placeholder="e.g. ND 123-456 GP"
                value={licensePlate}
                onChange={e => setLicensePlate(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 uppercase focus:outline-none focus:border-navy"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Color</label>
              <input
                type="text"
                placeholder="e.g. Silver Metallic"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-navy"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">VIN / Chassis (Optional)</label>
              <input
                type="text"
                placeholder="e.g. AHTBA3CD..."
                value={vinNumber}
                onChange={e => setVinNumber(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-navy"
              />
            </div>

            <div className="sm:col-span-2 md:col-span-3">
              <label className="text-[10px] font-bold text-slate-700 uppercase block mb-1">Access or Vehicle Notes</label>
              <input
                type="text"
                placeholder="e.g. Keyless entry; parked in underground bay 42"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-navy"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-navy hover:bg-navy-light text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingId ? 'Update Vehicle' : 'Save Vehicle'}
            </button>
          </div>
        </form>
      )}

      {/* Vehicle Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vehicles.map(v => (
          <div key={v.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between gap-3 hover:border-slate-300 transition-all">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
                  <Car className="w-5 h-5 text-navy" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{v.make} {v.model}</h4>
                  <span className="text-[11px] font-mono font-bold bg-white text-slate-800 px-2 py-0.5 rounded border border-slate-200 inline-block mt-0.5">
                    {v.licensePlate}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleStartEdit(v)}
                  className="p-1.5 hover:bg-white text-slate-500 hover:text-navy rounded-lg border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                  title="Edit details"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(v.id, v.licensePlate)}
                  className="p-1.5 hover:bg-red/10 text-slate-500 hover:text-red rounded-lg border border-transparent hover:border-red/20 transition-all cursor-pointer"
                  title="Delete vehicle"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/60">
              <div>
                <span className="text-slate-400 block text-[9px] uppercase">Year</span>
                <span className="font-bold text-slate-800">{v.year || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] uppercase">Color</span>
                <span className="font-bold text-slate-800">{v.color || 'Unspecified'}</span>
              </div>
              {v.vinNumber && (
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[9px] uppercase">VIN</span>
                  <span className="font-bold text-slate-800 truncate block">{v.vinNumber}</span>
                </div>
              )}
              {v.notes && (
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[9px] uppercase">Notes</span>
                  <span className="text-slate-700 italic block">{v.notes}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {vehicles.length === 0 && !isAdding && (
          <div className="col-span-1 md:col-span-2 py-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl space-y-2">
            <Car className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">No Vehicles Registered</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Add your car or fleet vehicles to enable 1-click roadside assistance and vehicle tracking.
            </p>
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="mt-2 px-4 py-2 bg-navy hover:bg-navy-light text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" /> Add Your First Vehicle
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
