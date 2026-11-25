import React, { useState, useEffect } from 'react';
import { BedDouble, CheckCircle, AlertCircle, UserMinus, UserPlus, RefreshCw } from 'lucide-react';
import api from '../services/api';

export default function InpatientAdmissions() {
  const [wards, setWards] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [admitModal, setAdmitModal] = useState(null);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [admissionReason, setAdmissionReason] = useState('Acute medical management');

  const fetchWardsAndBeds = async () => {
    setLoading(true);
    try {
      const [wRes, pRes] = await Promise.all([
        api.get('/admissions/wards'),
        api.get('/patients')
      ]);
      if (wRes.data?.success) setWards(wRes.data.data);
      if (pRes.data?.success) {
        setPatients(pRes.data.data);
        if (pRes.data.data.length > 0) setSelectedPatientId(pRes.data.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWardsAndBeds();
  }, []);

  const handleAdmit = async (e) => {
    e.preventDefault();
    if (!admitModal || !selectedPatientId) return;

    try {
      const res = await api.post('/admissions', {
        patientId: selectedPatientId,
        bedId: admitModal.id,
        reason: admissionReason
      });
      if (res.data?.success) {
        alert(`Patient admitted to Bed ${admitModal.bedNumber} successfully.`);
        setAdmitModal(null);
        fetchWardsAndBeds();
      }
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Admission failed');
    }
  };

  const handleDischarge = async (admissionId, bedNumber) => {
    if (!confirm(`Confirm discharge of patient from Bed ${bedNumber}?`)) return;
    try {
      const res = await api.post(`/admissions/${admissionId}/discharge`);
      if (res.data?.success) {
        alert(`Patient discharged and Bed ${bedNumber} is now marked AVAILABLE.`);
        fetchWardsAndBeds();
      }
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Discharge failed');
    }
  };

  return (
    <div className="p-4 bg-slate-100 min-h-screen text-slate-800 space-y-4">
      <div className="bg-white p-3.5 rounded border border-slate-300 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800">Inpatient Department (IPD) & Bed Allocation</h2>
          <p className="text-xs text-slate-500">Visual ward bed map, admission authorization, and clinical discharge</p>
        </div>
        <button 
          onClick={fetchWardsAndBeds}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded flex items-center space-x-1"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Beds</span>
        </button>
      </div>

      <div className="space-y-4">
        {wards.map((w) => (
          <div key={w.id} className="bg-white rounded border border-slate-300 shadow-xs p-4">
            <div className="flex items-center justify-between border-b pb-2 mb-3">
              <div className="flex items-center space-x-2">
                <BedDouble className="w-5 h-5 text-teal-700" />
                <h3 className="font-bold text-sm text-slate-800">{w.name}</h3>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase font-semibold">
                  Floor {w.floor} | {w.wardType}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                {w.beds.filter(b => b.status === 'AVAILABLE').length} Available / {w.beds.length} Total
              </div>
            </div>

            {/* Bed Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {w.beds.map((b) => {
                const activeAdm = b.admissions?.[0];
                const isAvail = b.status === 'AVAILABLE';
                const isOccupied = b.status === 'OCCUPIED';

                return (
                  <div 
                    key={b.id} 
                    className={`p-3 rounded border flex flex-col justify-between transition ${
                      isAvail 
                        ? 'bg-emerald-50/60 border-emerald-300 hover:border-emerald-500' 
                        : isOccupied 
                        ? 'bg-purple-50/60 border-purple-300' 
                        : 'bg-slate-100 border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs font-mono">{b.bedNumber}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                          isAvail ? 'bg-emerald-200 text-emerald-800' : isOccupied ? 'bg-purple-200 text-purple-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {b.status}
                        </span>
                      </div>

                      {isOccupied && activeAdm ? (
                        <div className="mt-1 text-[11px] space-y-0.5">
                          <div className="font-bold text-slate-800 truncate">
                            {activeAdm.patient?.firstName} {activeAdm.patient?.lastName}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {activeAdm.patient?.patientNumber}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-1 text-[10px] text-slate-500">
                          Rate: Rs {b.dailyRate}/day
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/60">
                      {isAvail ? (
                        <button
                          onClick={() => setAdmitModal(b)}
                          className="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-semibold py-1 rounded transition flex items-center justify-center space-x-1"
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>Allocate</span>
                        </button>
                      ) : isOccupied && activeAdm ? (
                        <button
                          onClick={() => handleDischarge(activeAdm.id, b.bedNumber)}
                          className="w-full bg-slate-800 hover:bg-red-700 text-white text-[11px] font-semibold py-1 rounded transition flex items-center justify-center space-x-1"
                        >
                          <UserMinus className="w-3 h-3" />
                          <span>Discharge</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 block text-center">Maintenance</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Admission Modal */}
      {admitModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-4 border border-slate-300 text-xs">
            <h3 className="font-bold text-sm text-slate-800 border-b pb-2 mb-3">
              Allocate Bed: {admitModal.bedNumber}
            </h3>
            <form onSubmit={handleAdmit} className="space-y-3">
              <div>
                <label className="block text-slate-600 mb-1">Select Patient to Admit</label>
                <select 
                  value={selectedPatientId}
                  onChange={e => setSelectedPatientId(e.target.value)}
                  className="w-full border rounded px-2 py-1 bg-white font-medium"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.patientNumber}: {p.firstName} {p.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Admission Reason & Clinical Notes</label>
                <textarea
                  rows={3}
                  value={admissionReason}
                  onChange={e => setAdmissionReason(e.target.value)}
                  className="w-full border rounded p-1.5 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-3 py-1.5 rounded">
                  Confirm Admission
                </button>
                <button type="button" onClick={() => setAdmitModal(null)} className="bg-slate-200 text-slate-700 px-3 py-1.5 rounded">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

