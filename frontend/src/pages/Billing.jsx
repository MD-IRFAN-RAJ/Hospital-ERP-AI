import React, { useState, useEffect } from 'react';
import { Receipt, CreditCard, Printer, CheckCircle, Plus, RefreshCw } from 'lucide-react';
import api from '../services/api';

export default function Billing() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentModal, setPaymentModal] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  const fetchBills = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bills');
      if (res.data?.success) {
        setBills(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentModal) return;
    try {
      const res = await api.post(`/bills/${paymentModal.id}/payments`, {
        amount: Number(payAmount),
        paymentMethod
      });
      if (res.data?.success) {
        alert('Payment recorded successfully and balance updated transactionally.');
        setPaymentModal(null);
        fetchBills();
      }
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Payment failed');
    }
  };

  return (
    <div className="p-4 bg-slate-100 min-h-screen text-slate-800 space-y-4">
      <div className="bg-white p-3.5 rounded border border-slate-300 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800">Hospital Billing & Cashier Ledger</h2>
          <p className="text-xs text-slate-500">Invoices, partial/full settlements, itemized breakdown, and receipt printing</p>
        </div>
        <button 
          onClick={fetchBills}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded flex items-center space-x-1"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded border border-slate-300 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
            <tr>
              <th className="p-2.5">Invoice No</th>
              <th className="p-2.5">Patient</th>
              <th className="p-2.5">Date</th>
              <th className="p-2.5 text-right">Net Total</th>
              <th className="p-2.5 text-right">Paid</th>
              <th className="p-2.5 text-right">Balance</th>
              <th className="p-2.5 text-center">Status</th>
              <th className="p-2.5 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bills.map(b => (
              <tr key={b.id} className="hover:bg-slate-50">
                <td className="p-2.5 font-mono font-bold text-teal-800">{b.billNumber}</td>
                <td className="p-2.5 font-medium text-slate-900">
                  {b.patient?.firstName} {b.patient?.lastName} ({b.patient?.patientNumber})
                </td>
                <td className="p-2.5 text-slate-500 font-mono text-[11px]">
                  {new Date(b.createdAt).toLocaleDateString()}
                </td>
                <td className="p-2.5 text-right font-bold">Rs {b.netAmount}</td>
                <td className="p-2.5 text-right font-semibold text-emerald-700">Rs {b.paidAmount}</td>
                <td className="p-2.5 text-right font-bold text-red-700">Rs {b.balanceAmount}</td>
                <td className="p-2.5 text-center">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    b.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : (b.status === 'PARTIAL' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800')
                  }`}>
                    {b.status}
                  </span>
                </td>
                <td className="p-2 text-center">
                  <div className="flex items-center justify-center space-x-1.5">
                    {b.balanceAmount > 0 && (
                      <button
                        onClick={() => {
                          setPaymentModal(b);
                          setPayAmount(b.balanceAmount);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold px-2 py-1 rounded transition"
                      >
                        Receive Pay
                      </button>
                    )}
                    <button
                      onClick={() => window.print()}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium px-2 py-1 rounded border border-slate-300"
                    >
                      Print
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payment Settlement Modal */}
      {paymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-4 border border-slate-300 text-xs">
            <h3 className="font-bold text-sm text-slate-800 border-b pb-2 mb-3">
              Record Invoice Payment
            </h3>
            <div className="space-y-2 mb-3">
              <div>Invoice: <strong>{paymentModal.billNumber}</strong></div>
              <div>Patient: <strong>{paymentModal.patient?.firstName} {paymentModal.patient?.lastName}</strong></div>
              <div>Outstanding Balance: <strong className="text-red-700">Rs {paymentModal.balanceAmount}</strong></div>

              <div className="pt-2 border-t">
                <label className="block text-slate-600 mb-1">Amount to Pay</label>
                <input 
                  type="number" 
                  value={payAmount} 
                  onChange={e => setPayAmount(e.target.value)} 
                  max={paymentModal.balanceAmount}
                  className="w-full border rounded px-2 py-1 font-bold text-slate-800" 
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Payment Method</label>
                <select 
                  value={paymentMethod} 
                  onChange={e => setPaymentMethod(e.target.value)} 
                  className="w-full border rounded px-2 py-1 bg-white"
                >
                  <option value="CASH">Cash</option>
                  <option value="CARD">Credit/Debit Card</option>
                  <option value="UPI">UPI / QR Code</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t">
              <button 
                onClick={handleRecordPayment}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded"
              >
                Record Payment
              </button>
              <button onClick={() => setPaymentModal(null)} className="bg-slate-200 text-slate-700 px-3 py-1.5 rounded">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

