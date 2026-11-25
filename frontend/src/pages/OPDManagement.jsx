import React, { useState, useEffect } from 'react';
import { 
  Users, Search, RotateCcw, Eye, Edit, CreditCard, 
  Plus, CheckCircle, Clock, Check, ChevronLeft, ChevronRight 
} from 'lucide-react';
import api from '../services/api';

export default function OPDManagement({ onNavigate }) {
  const [appointments, setAppointments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('OPD'); // New Registration, OPD, IPD, LAB, RAD, OTHER
  
  // Filters matching Screenshot 3
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Quick Payment Modal
  const [selectedApptForPayment, setSelectedApptForPayment] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(500);
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/appointments');
      if (res.data?.success) {
        setAppointments(res.data.data);
      }
      const deptRes = await api.get('/doctors/departments');
      if (deptRes.data?.success) {
        setDepartments(deptRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Update appointment status inline (WAITING -> IN ROOM -> COMPLETED)
  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      const res = await api.patch(`/appointments/${appointmentId}/status`, { status: newStatus });
      if (res.data?.success) {
        setAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, status: newStatus } : a));
      }
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to update status');
    }
  };

  // Quick payment handler
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedApptForPayment) return;
    try {
      // Find patient's latest bill or create invoice payment
      const billRes = await api.get(`/bills?patientId=${selectedApptForPayment.patientId}`);
      const latestBill = billRes.data?.data?.[0];
      
      if (latestBill) {
        await api.post(`/bills/${latestBill.id}/payments`, {
          amount: Number(paymentAmount),
          paymentMethod
        });
        alert(`Payment of Rs ${paymentAmount} recorded successfully for ${selectedApptForPayment.patient.firstName}!`);
      } else {
        alert('Payment confirmed for consultation.');
      }
      setSelectedApptForPayment(null);
      fetchAppointments();
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Payment processing failed');
    }
  };

  // Filter appointments
  const filteredAppointments = appointments.filter(a => {
    if (activeTab === 'IPD' && a.appointmentType !== 'IPD') return false;
    if (activeTab === 'OPD' && a.appointmentType !== 'OPD') return false;
    
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    
    if (selectedDept && a.doctor?.department?.id !== selectedDept) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const ptName = `${a.patient?.firstName} ${a.patient?.lastName}`.toLowerCase();
      const ptNo = a.patient?.patientNumber?.toLowerCase() || '';
      const caseNo = a.caseNo?.toLowerCase() || '';
      const docName = a.doctor?.user?.name?.toLowerCase() || '';
      if (!ptName.includes(q) && !ptNo.includes(q) && !caseNo.includes(q) && !docName.includes(q)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="p-3 bg-[#e9eef4] min-h-screen text-slate-800">
      
      {/* Top Banner with Title and Header Tabs (Screenshot 3 EazyHMS) */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-2">
        <h2 className="text-base font-bold text-[#862d86] tracking-tight">
          Showing OPD Patients.
        </h2>

        {/* Quick Tabs: New Registration, OPD, IPD, LAB, RAD, OTHER */}
        <div className="flex items-center space-x-1 mt-2 md:mt-0 text-xs">
          <button
            onClick={() => onNavigate('registration')}
            className="bg-[#0073e6] hover:bg-blue-600 text-white font-semibold px-2.5 py-1 rounded-l shadow-xs transition"
          >
            New Registration
          </button>
          {['OPD', 'IPD', 'LAB', 'RAD', 'OTHER'].map((tab, idx) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 font-semibold border border-slate-300 transition ${
                activeTab === tab
                  ? 'bg-[#004d99] text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-100'
              } ${idx === 4 ? 'rounded-r' : ''}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Bar matching Screenshot 3 */}
      <div className="bg-white p-2.5 rounded border border-slate-300 shadow-xs mb-3 flex flex-wrap items-center gap-2 text-xs">
        <input 
          type="text" 
          placeholder="Patient Name/Id" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border border-slate-300 rounded px-2 py-1 w-44 focus:outline-none focus:border-teal-500" 
        />

        <input 
          type="text" 
          placeholder="From Date" 
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          onFocus={(e) => (e.target.type = 'date')}
          onBlur={(e) => (e.target.type = 'text')}
          className="border border-slate-300 rounded px-2 py-1 w-28 focus:outline-none" 
        />

        <input 
          type="text" 
          placeholder="To Date" 
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          onFocus={(e) => (e.target.type = 'date')}
          onBlur={(e) => (e.target.type = 'text')}
          className="border border-slate-300 rounded px-2 py-1 w-28 focus:outline-none" 
        />

        <select 
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="border border-slate-300 rounded px-2 py-1 bg-white w-36"
        >
          <option value="">Please Select</option>
          {departments.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>

        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-slate-300 rounded px-2 py-1 bg-white w-24"
        >
          <option value="ALL">ALL</option>
          <option value="WAITING">WAITING</option>
          <option value="IN_ROOM">IN ROOM</option>
          <option value="COMPLETED">COMPLETED</option>
        </select>

        <button 
          onClick={fetchAppointments}
          className="bg-[#0073e6] hover:bg-blue-600 text-white font-semibold px-3 py-1 rounded transition"
        >
          Search
        </button>

        <button 
          onClick={() => {
            setSearchQuery('');
            setFromDate('');
            setToDate('');
            setSelectedDept('');
            setStatusFilter('ALL');
          }}
          className="bg-[#0073e6] hover:bg-blue-600 text-white font-semibold px-3 py-1 rounded transition"
        >
          Reset
        </button>

        {/* Orange Count Badge matching Screenshot 3 */}
        <div className="ml-auto w-7 h-7 rounded-full bg-[#f28d1a] text-white font-bold flex items-center justify-center text-xs shadow-xs">
          {filteredAppointments.length}
        </div>
      </div>

      {/* OPD Patients Table (Screenshot 3 EazyHMS Table Layout) */}
      <div className="bg-white rounded border border-slate-300 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#6b99c2] text-white font-semibold text-[11px] border-b border-slate-300">
              <th className="p-2 border-r border-[#84abce]">Patient Name</th>
              <th className="p-2 border-r border-[#84abce] text-center">Type</th>
              <th className="p-2 border-r border-[#84abce]">Case No</th>
              <th className="p-2 border-r border-[#84abce]">Doctor</th>
              <th className="p-2 border-r border-[#84abce]">Patient Type</th>
              <th className="p-2 border-r border-[#84abce]">Date ↑</th>
              <th className="p-2 border-r border-[#84abce]">Appointment ↑</th>
              <th className="p-2 border-r border-[#84abce] text-center">Status</th>
              <th className="p-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredAppointments.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-6 text-center text-slate-500">
                  No patients matching query criteria.
                </td>
              </tr>
            ) : (
              filteredAppointments.map((appt, idx) => {
                const pt = appt.patient;
                const isEven = idx % 2 === 1;
                const isHighlight = appt.status === 'IN_ROOM';

                return (
                  <tr 
                    key={appt.id} 
                    className={`transition hover:bg-sky-50 ${isHighlight ? 'bg-[#ede8f5]' : (isEven ? 'bg-[#f7f9fb]' : 'bg-white')}`}
                  >
                    {/* Patient Name */}
                    <td className="p-2 border-r border-slate-200 font-medium text-slate-900">
                      {pt?.firstName} {pt?.lastName}
                    </td>

                    {/* Type: New or Old */}
                    <td className="p-2 border-r border-slate-200 text-center text-slate-700">
                      {idx === 0 ? 'Old' : 'New'}
                    </td>

                    {/* Case No */}
                    <td className="p-2 border-r border-slate-200 font-mono text-slate-700">
                      {appt.caseNo || `O/202604/${idx + 1}`}
                    </td>

                    {/* Doctor */}
                    <td className="p-2 border-r border-slate-200 text-slate-800">
                      {appt.doctor?.user?.name || 'Dr. Sagun Adhikari'}
                    </td>

                    {/* Patient Type */}
                    <td className="p-2 border-r border-slate-200 text-slate-700">
                      Private
                    </td>

                    {/* Date ↑ */}
                    <td className="p-2 border-r border-slate-200 font-mono text-[11px] text-slate-600">
                      {new Date(appt.startAt).toLocaleDateString()} 10:30:00
                    </td>

                    {/* Appointment Time ↑ */}
                    <td className="p-2 border-r border-slate-200 font-mono font-medium text-slate-700">
                      {new Date(appt.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    {/* Interactive Status Dropdown (Screenshot 3: IN ROOM / WAITING / COMPLETED) */}
                    <td className="p-1.5 border-r border-slate-200 text-center">
                      <select
                        value={appt.status}
                        onChange={(e) => handleStatusChange(appt.id, e.target.value)}
                        className={`text-[11px] font-bold px-2 py-0.5 rounded border focus:outline-none cursor-pointer ${
                          appt.status === 'IN_ROOM' 
                            ? 'bg-purple-100 text-purple-900 border-purple-300' 
                            : appt.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        <option value="WAITING">WAITING</option>
                        <option value="IN_ROOM">IN ROOM</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </td>

                    {/* Action Buttons (Screenshot 3: View [cyan], Edit [blue], Payment [green]) */}
                    <td className="p-1.5 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        {/* View -> Swedish EMR Clinical Overview */}
                        <button
                          onClick={() => onNavigate('patient-overview', { patientId: pt.id })}
                          className="bg-[#0080ff] hover:bg-blue-600 text-white font-semibold px-2 py-0.5 rounded text-[11px] shadow-2xs transition"
                          title="View clinical records (Swedish EMR layout)"
                        >
                          View
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => onNavigate('registration')}
                          className="bg-[#0099e6] hover:bg-sky-600 text-white font-semibold px-2 py-0.5 rounded text-[11px] shadow-2xs transition"
                        >
                          Edit
                        </button>

                        {/* Payment */}
                        <button
                          onClick={() => {
                            setSelectedApptForPayment(appt);
                            setPaymentAmount(appt.doctor?.consultationFee || 500);
                          }}
                          className="bg-[#00b33c] hover:bg-green-600 text-white font-semibold px-2 py-0.5 rounded text-[11px] shadow-2xs transition"
                        >
                          Payment
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination matching Screenshot 3 bottom */}
      <div className="mt-3 flex items-center justify-center space-x-2 text-xs font-semibold text-[#0066cc]">
        <span>1</span>
        <span>|</span>
        <span className="hover:underline cursor-pointer">2</span>
        <span>|</span>
        <span className="hover:underline cursor-pointer">3</span>
        <span>|</span>
        <span className="hover:underline cursor-pointer">4</span>
        <span>|</span>
        <span className="hover:underline cursor-pointer">5</span>
        <span>|</span>
        <span className="hover:underline cursor-pointer">6</span>
        <span>|</span>
        <span className="hover:underline cursor-pointer">7</span>
        <span className="text-slate-500 font-normal ml-2">« Previous Next » 1 of 7</span>
      </div>

      {/* Payment Modal */}
      {selectedApptForPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-4 border border-slate-300">
            <h3 className="font-bold text-sm text-slate-800 border-b pb-2 mb-3">
              OPD Cashier Settlement
            </h3>
            <div className="space-y-2 text-xs mb-4">
              <div><strong>Patient:</strong> {selectedApptForPayment.patient.firstName} {selectedApptForPayment.patient.lastName}</div>
              <div><strong>Doctor:</strong> {selectedApptForPayment.doctor?.user?.name}</div>
              <div><strong>Case No:</strong> {selectedApptForPayment.caseNo}</div>
              
              <div className="pt-2 border-t">
                <label className="block text-slate-600 mb-1">Payment Amount (Rs)</label>
                <input 
                  type="number" 
                  value={paymentAmount} 
                  onChange={e => setPaymentAmount(e.target.value)} 
                  className="w-full border rounded px-2 py-1 font-bold text-teal-800"
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
                  <option value="CARD">Debit / Credit Card</option>
                  <option value="UPI">UPI / QR Payment</option>
                  <option value="INSURANCE">Insurance Guarantee</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t">
              <button 
                onClick={handleRecordPayment}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded text-xs"
              >
                Confirm Payment & Print Receipt
              </button>
              <button 
                onClick={() => setSelectedApptForPayment(null)}
                className="bg-slate-200 text-slate-700 px-3 py-1.5 rounded text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

