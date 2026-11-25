import React, { useState, useEffect } from 'react';
import { Pill, AlertTriangle, CheckCircle, Package, ArrowDownRight, RefreshCw } from 'lucide-react';
import api from '../services/api';

export default function Pharmacy() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dispenseModal, setDispenseModal] = useState(null);
  const [dispenseQty, setDispenseQty] = useState(10);
  const [selectedBatchId, setSelectedBatchId] = useState('');

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const res = await api.get('/medicines');
      if (res.data?.success) {
        setMedicines(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const handleDispense = async (e) => {
    e.preventDefault();
    if (!dispenseModal || !selectedBatchId) return;

    try {
      const res = await api.post('/pharmacy/dispense', {
        items: [
          {
            batchId: selectedBatchId,
            quantity: Number(dispenseQty)
          }
        ]
      });

      if (res.data?.success) {
        alert(`Success: ${dispenseQty} units dispensed transactionally. Stock decremented.`);
        setDispenseModal(null);
        fetchMedicines();
      }
    } catch (err) {
      // TC-006: Insufficient stock error handling
      alert(err.response?.data?.error || err.message || 'Dispensing rejected by server.');
    }
  };

  return (
    <div className="p-4 bg-slate-100 min-h-screen text-slate-800 space-y-4">
      <div className="bg-white p-3.5 rounded border border-slate-300 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800">Pharmacy Inventory & Dispensing</h2>
          <p className="text-xs text-slate-500">Atomic inventory transactions, FEFO batch tracking, and low-stock alerts</p>
        </div>
        <button 
          onClick={fetchMedicines}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded flex items-center space-x-1"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Stock</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {medicines.map((m) => (
          <div key={m.id} className="bg-white rounded border border-slate-300 shadow-xs p-3 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-900">{m.name}</h4>
                  <span className="text-[10px] text-slate-500">{m.category}</span>
                </div>
                {m.isLowStock && (
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded flex items-center space-x-0.5">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    <span>Low</span>
                  </span>
                )}
              </div>

              <div className="mt-2 text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Total In Stock:</span>
                  <span className={`font-bold ${m.isLowStock ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {m.totalStock} units
                  </span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Unit Price:</span>
                  <span>Rs {m.unitPrice}</span>
                </div>
              </div>

              {/* Batches breakdown */}
              <div className="mt-3 pt-2 border-t border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Batches</span>
                {m.batches.map(b => (
                  <div key={b.id} className="flex justify-between text-[11px] text-slate-600 font-mono bg-slate-50 p-1 rounded">
                    <span>{b.batchNumber}</span>
                    <span>{b.quantity}u (exp {new Date(b.expiryDate).toLocaleDateString()})</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                setDispenseModal(m);
                setSelectedBatchId(m.batches[0]?.id || '');
              }}
              className="mt-3 w-full bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold py-1.5 rounded transition flex items-center justify-center space-x-1"
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>Dispense Medicine</span>
            </button>
          </div>
        ))}
      </div>

      {/* Dispense Modal */}
      {dispenseModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-4 border border-slate-300">
            <h3 className="font-bold text-sm text-slate-800 border-b pb-2 mb-3">
              Dispense: {dispenseModal.name}
            </h3>
            <form onSubmit={handleDispense} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1">Select Batch (FEFO)</label>
                <select 
                  value={selectedBatchId} 
                  onChange={e => setSelectedBatchId(e.target.value)}
                  className="w-full border rounded px-2 py-1 bg-white font-mono"
                >
                  {dispenseModal.batches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.batchNumber} (Avail: {b.quantity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Quantity to Dispense</label>
                <input 
                  type="number" 
                  min="1"
                  value={dispenseQty} 
                  onChange={e => setDispenseQty(e.target.value)}
                  className="w-full border rounded px-2 py-1 font-bold text-slate-800" 
                />
              </div>

              <div className="p-2 bg-slate-50 rounded text-[11px] text-slate-500">
                Notice: Dispensing executes an atomic transaction. If quantity exceeds batch stock, it will be rejected safely (SRS TC-006).
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button type="submit" className="bg-teal-700 hover:bg-teal-800 text-white font-semibold px-3 py-1.5 rounded">
                  Confirm Dispensing
                </button>
                <button type="button" onClick={() => setDispenseModal(null)} className="bg-slate-200 text-slate-700 px-3 py-1.5 rounded">
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

