import React, { useState, useEffect } from 'react';
import { 
  UserCheck, AlertCircle, Printer, CheckCircle, ChevronDown, 
  ChevronUp, ShieldAlert, FileText, ArrowRight, RefreshCw 
} from 'lucide-react';
import api from '../services/api';

export default function PatientRegistration({ onNavigate }) {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [showStickerModal, setShowStickerModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [warningDuplicate, setWarningDuplicate] = useState(null);

  // Form State matching Screenshot 1 (LunivaCare)
  const [formData, setFormData] = useState({
    title: 'Mr.',
    firstName: '',
    middleName: '',
    lastName: '',
    gender: 'Male',
    ageYears: '35',
    ageMonths: '0',
    dateOfBirth: '1991-05-15',
    mobileNumber: '',
    phone: '',
    country: 'Nepal',
    state: 'Gandaki',
    city: 'Kaski',
    municipality: 'Pokhara-4',
    address: 'Gandaki 4, Kaski',
    wardNo: '4',
    ethnicity: 'General',
    bloodGroup: 'B+',
    allergies: '',
    chronicDiseases: '',
    emergencyContact: '',
    isPoliceCase: false,
    patientCategory: 'Nepalese',
    patientType: 'General',
    departmentId: '',
    doctorId: '',
    consultationTag: 'POPD General',
    consultationFee: 500,
    depositAmount: 500,
    discountAmount: 0
  });

  // Section collapse states
  const [openSections, setOpenSections] = useState({
    generalInfo: true,
    financialInfo: true,
    contactInfo: false,
    additionalInfo: false,
    membershipInfo: false
  });

  const toggleSection = (sec) => {
    setOpenSections(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [docRes, deptRes] = await Promise.all([
          api.get('/doctors'),
          api.get('/doctors/departments')
        ]);
        if (docRes.data?.success) setDoctors(docRes.data.data);
        if (deptRes.data?.success) {
          setDepartments(deptRes.data.data);
          if (deptRes.data.data.length > 0 && !formData.departmentId) {
            setFormData(prev => ({ 
              ...prev, 
              departmentId: deptRes.data.data[0].id,
              doctorId: docRes.data?.data?.[0]?.id || ''
            }));
          }
        }
      } catch (err) {
        console.error('Error fetching metadata:', err);
      }
    };
    fetchMetadata();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDoctorChange = (e) => {
    const docId = e.target.value;
    const selectedDoc = doctors.find(d => d.id === docId);
    setFormData(prev => ({
      ...prev,
      doctorId: docId,
      departmentId: selectedDoc?.departmentId || prev.departmentId,
      consultationFee: selectedDoc?.consultationFee || 500,
      depositAmount: selectedDoc?.consultationFee || 500
    }));
  };

  const handleSubmit = async (e, force = false) => {
    if (e) e.preventDefault();
    setLoading(true);
    setWarningDuplicate(null);

    try {
      const payload = {
        title: formData.title,
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        phone: formData.mobileNumber || formData.phone,
        email: formData.email,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        wardNo: formData.wardNo,
        ethnicity: formData.ethnicity,
        bloodGroup: formData.bloodGroup,
        allergies: formData.allergies,
        chronicDiseases: formData.chronicDiseases,
        emergencyContact: formData.emergencyContact,
        isPoliceCase: formData.isPoliceCase,
        patientType: formData.patientType,
        doctorId: formData.doctorId,
        consultationFee: formData.consultationFee,
        depositAmount: formData.depositAmount
      };

      const res = await api.post(`/patients${force ? '?force=true' : ''}`, payload);
      
      if (!res.data.success && res.data.warning === 'POTENTIAL_DUPLICATE') {
        setWarningDuplicate(res.data);
        setLoading(false);
        return;
      }

      if (res.data.success) {
        setSuccessData(res.data.data);
      }
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-slate-100 min-h-screen">
      {/* Title Bar matching Screenshot 1 */}
      <div className="bg-white p-3 rounded-t border border-slate-300 shadow-sm flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-slate-700 text-base">OPD Patient Registration</span>
          <span className="text-xs bg-teal-100 text-teal-800 font-semibold px-2 py-0.5 rounded">
            LunivaCare Layout
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            type="button" 
            onClick={() => onNavigate('opd')} 
            className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium px-3 py-1.5 rounded transition"
          >
            View OPD Queue
          </button>
        </div>
      </div>

      {/* Duplicate Warning Dialog (SRS TC-004) */}
      {warningDuplicate && (
        <div className="mb-4 bg-amber-50 border-l-4 border-amber-500 p-4 rounded shadow-sm">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-amber-600 mr-3 mt-0.5 shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-amber-800">Duplicate Patient Warning (TC-004)</h4>
              <p className="text-xs text-amber-700 mt-1">{warningDuplicate.message}</p>
              <div className="mt-3 flex space-x-3">
                <button
                  onClick={() => handleSubmit(null, true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3 py-1.5 rounded"
                >
                  Proceed Anyway (Force Register)
                </button>
                <button
                  onClick={() => onNavigate('patient-overview', { patientId: warningDuplicate.existingPatient.id })}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded"
                >
                  Open Existing Patient Record
                </button>
                <button
                  onClick={() => setWarningDuplicate(null)}
                  className="text-slate-500 hover:text-slate-700 text-xs px-2 py-1.5"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification Bar */}
      {successData && (
        <div className="mb-4 bg-emerald-50 border border-emerald-300 p-4 rounded shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-emerald-900">
                Patient Successfully Registered: {successData.patient.firstName} {successData.patient.lastName}
              </h4>
              <p className="text-xs text-emerald-700">
                Patient Number: <strong className="font-mono">{successData.patient.patientNumber}</strong> | 
                Case No: <strong className="font-mono">{successData.appointment?.caseNo || 'O/2026/1'}</strong> | 
                Invoice: <strong className="font-mono">{successData.bill?.billNumber || 'INV-2026-0001'}</strong>
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => setShowStickerModal(true)}
              className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold px-3 py-1.5 rounded flex items-center space-x-1"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Sticker</span>
            </button>
            <button 
              onClick={() => setShowBillModal(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-3 py-1.5 rounded flex items-center space-x-1"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Print Bill</span>
            </button>
            <button 
              onClick={() => onNavigate('patient-overview', { patientId: successData.patient.id })}
              className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-3 py-1.5 rounded flex items-center space-x-1"
            >
              <span>Clinical Overview</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Registration Form Grid */}
      <form onSubmit={(e) => handleSubmit(e, false)}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          
          {/* Left Column: Patient Information (7 Cols) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="bg-white rounded border border-slate-300 shadow-sm overflow-hidden">
              <div 
                onClick={() => toggleSection('generalInfo')}
                className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center space-x-1 text-xs font-bold text-slate-700">
                  <span>Patient Information</span>
                  <span className="text-[10px] text-slate-500 font-normal ml-2">General information</span>
                </div>
                {openSections.generalInfo ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </div>

              {openSections.generalInfo && (
                <div className="p-3 text-xs space-y-2.5">
                  {/* Row 1: Patient ID & Mobile */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-0.5">Patient Id</label>
                      <input 
                        type="text" 
                        readOnly 
                        value="(Auto-Generated e.g. MC-2026-0008)" 
                        className="w-full bg-slate-100 border border-slate-300 rounded px-2 py-1 text-slate-500 font-mono text-xs" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-0.5">Mobile Number *</label>
                      <input 
                        type="tel" 
                        name="mobileNumber" 
                        required
                        value={formData.mobileNumber} 
                        onChange={handleChange}
                        placeholder="e.g. 9841234567" 
                        className="w-full border border-slate-300 rounded px-2 py-1 focus:border-teal-500 focus:outline-none" 
                      />
                    </div>
                  </div>

                  {/* Row 2: Title, First Name, Middle Name, Last Name */}
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-3">
                      <label className="block text-[11px] text-slate-600 mb-0.5">Title</label>
                      <select 
                        name="title" 
                        value={formData.title} 
                        onChange={handleChange}
                        className="w-full border border-slate-300 rounded px-2 py-1 bg-white focus:border-teal-500 focus:outline-none"
                      >
                        <option>Mr.</option>
                        <option>Mrs.</option>
                        <option>Miss</option>
                        <option>Dr.</option>
                      </select>
                    </div>
                    <div className="col-span-9">
                      <label className="block text-[11px] text-slate-600 mb-0.5">First Name *</label>
                      <input 
                        type="text" 
                        name="firstName" 
                        required
                        value={formData.firstName} 
                        onChange={handleChange}
                        placeholder="First Name" 
                        className="w-full border border-slate-300 rounded px-2 py-1 focus:border-teal-500 focus:outline-none" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-0.5">Middle Name</label>
                      <input 
                        type="text" 
                        name="middleName" 
                        value={formData.middleName} 
                        onChange={handleChange}
                        placeholder="Middle Name (optional)" 
                        className="w-full border border-slate-300 rounded px-2 py-1 focus:border-teal-500 focus:outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-0.5">Last Name *</label>
                      <input 
                        type="text" 
                        name="lastName" 
                        required
                        value={formData.lastName} 
                        onChange={handleChange}
                        placeholder="Last Name" 
                        className="w-full border border-slate-300 rounded px-2 py-1 focus:border-teal-500 focus:outline-none" 
                      />
                    </div>
                  </div>

                  {/* Row 3: Gender Radio */}
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Gender *</label>
                    <div className="flex items-center space-x-5">
                      {['Male', 'Female', 'Other'].map(g => (
                        <label key={g} className="flex items-center space-x-1.5 cursor-pointer">
                          <input 
                            type="radio" 
                            name="gender" 
                            value={g} 
                            checked={formData.gender === g} 
                            onChange={handleChange}
                            className="accent-teal-600" 
                          />
                          <span>{g}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Row 4: Age & DOB */}
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-4">
                      <label className="block text-[11px] text-slate-600 mb-0.5">Age</label>
                      <input 
                        type="number" 
                        name="ageYears" 
                        value={formData.ageYears} 
                        onChange={handleChange}
                        className="w-full border border-slate-300 rounded px-2 py-1 focus:border-teal-500 focus:outline-none" 
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-[11px] text-slate-600 mb-0.5">Unit</label>
                      <select className="w-full border border-slate-300 rounded px-2 py-1 bg-white">
                        <option>Years</option>
                        <option>Months</option>
                      </select>
                    </div>
                    <div className="col-span-5">
                      <label className="block text-[11px] text-slate-600 mb-0.5">D.O.B</label>
                      <input 
                        type="date" 
                        name="dateOfBirth" 
                        value={formData.dateOfBirth} 
                        onChange={handleChange}
                        className="w-full border border-slate-300 rounded px-2 py-1 bg-white focus:border-teal-500 focus:outline-none" 
                      />
                    </div>
                  </div>

                  {/* Row 5: Country & State */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-0.5">Country</label>
                      <input 
                        type="text" 
                        name="country" 
                        value={formData.country} 
                        onChange={handleChange}
                        className="w-full border border-slate-300 rounded px-2 py-1 bg-white" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-0.5">Province / State</label>
                      <input 
                        type="text" 
                        name="state" 
                        value={formData.state} 
                        onChange={handleChange}
                        className="w-full border border-slate-300 rounded px-2 py-1 bg-white" 
                      />
                    </div>
                  </div>

                  {/* Row 6: District & Municipality */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-0.5">District / City</label>
                      <input 
                        type="text" 
                        name="city" 
                        value={formData.city} 
                        onChange={handleChange}
                        className="w-full border border-slate-300 rounded px-2 py-1 bg-white" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-0.5">Municipality / Area</label>
                      <input 
                        type="text" 
                        name="municipality" 
                        value={formData.municipality} 
                        onChange={handleChange}
                        className="w-full border border-slate-300 rounded px-2 py-1 bg-white" 
                      />
                    </div>
                  </div>

                  {/* Row 7: Address & Ward */}
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-9">
                      <label className="block text-[11px] text-slate-600 mb-0.5">Address</label>
                      <input 
                        type="text" 
                        name="address" 
                        value={formData.address} 
                        onChange={handleChange}
                        className="w-full border border-slate-300 rounded px-2 py-1 bg-white" 
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-[11px] text-slate-600 mb-0.5">Ward No.</label>
                      <input 
                        type="text" 
                        name="wardNo" 
                        value={formData.wardNo} 
                        onChange={handleChange}
                        className="w-full border border-slate-300 rounded px-2 py-1 bg-white" 
                      />
                    </div>
                  </div>

                  {/* Row 8: Blood group & Ethnicity */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-0.5">Blood Group</label>
                      <select 
                        name="bloodGroup" 
                        value={formData.bloodGroup} 
                        onChange={handleChange}
                        className="w-full border border-slate-300 rounded px-2 py-1 bg-white"
                      >
                        <option>A+</option><option>A-</option>
                        <option>B+</option><option>B-</option>
                        <option>AB+</option><option>AB-</option>
                        <option>O+</option><option>O-</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-0.5">Ethnicity</label>
                      <input 
                        type="text" 
                        name="ethnicity" 
                        value={formData.ethnicity} 
                        onChange={handleChange}
                        className="w-full border border-slate-300 rounded px-2 py-1 bg-white" 
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Collapsible: Contact Information and Other */}
            <div className="bg-white rounded border border-slate-300 shadow-sm overflow-hidden">
              <div 
                onClick={() => toggleSection('contactInfo')}
                className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex items-center justify-between cursor-pointer"
              >
                <span className="text-xs font-bold text-slate-700">Contact Information and Other</span>
                {openSections.contactInfo ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </div>
              {openSections.contactInfo && (
                <div className="p-3 text-xs space-y-2">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">Emergency Contact (Name & Phone)</label>
                    <input 
                      type="text" 
                      name="emergencyContact" 
                      value={formData.emergencyContact} 
                      onChange={handleChange}
                      placeholder="e.g. Spouse: 9811223344" 
                      className="w-full border border-slate-300 rounded px-2 py-1" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-0.5">Known Drug Allergies</label>
                      <input 
                        type="text" 
                        name="allergies" 
                        value={formData.allergies} 
                        onChange={handleChange}
                        placeholder="e.g. Penicillin, Sulfa" 
                        className="w-full border border-slate-300 rounded px-2 py-1 text-red-600 font-medium" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-0.5">Chronic Medical Conditions</label>
                      <input 
                        type="text" 
                        name="chronicDiseases" 
                        value={formData.chronicDiseases} 
                        onChange={handleChange}
                        placeholder="e.g. Hypertension, Diabetes" 
                        className="w-full border border-slate-300 rounded px-2 py-1" 
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Collapsible: Membership Information & Police Case */}
            <div className="bg-white rounded border border-slate-300 shadow-sm overflow-hidden">
              <div 
                onClick={() => toggleSection('membershipInfo')}
                className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-700">Membership Information</span>
                </div>
                {openSections.membershipInfo ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </div>
              <div className="p-3 flex items-center justify-between bg-slate-50/50">
                <span className="text-xs text-slate-600">Standard MediCore Patient Record</span>
                <label className="flex items-center space-x-2 cursor-pointer bg-red-50 px-3 py-1.5 rounded border border-red-200">
                  <span className="text-xs font-bold text-red-800">Is Police Case (MLC)</span>
                  <input 
                    type="checkbox" 
                    name="isPoliceCase" 
                    checked={formData.isPoliceCase} 
                    onChange={handleChange}
                    className="accent-red-600 w-4 h-4" 
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Financial Information & Summary (5 Cols) */}
          <div className="lg:col-span-5 space-y-3">
            {/* Financial Information Card (Screenshot 1) */}
            <div className="bg-white rounded border border-slate-300 shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex items-center justify-between">
                <div className="text-xs font-bold text-slate-700">Financial Information</div>
                <span className="text-[11px] text-teal-600 font-semibold cursor-pointer">Add Deposit</span>
              </div>
              <div className="p-3 text-xs space-y-2.5">
                <div>
                  <label className="block text-[11px] text-slate-600 mb-0.5">Patient Category *</label>
                  <select 
                    name="patientCategory" 
                    value={formData.patientCategory} 
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded px-2 py-1 bg-white"
                  >
                    <option>Nepalese</option>
                    <option>International</option>
                    <option>Corporate Tie-up</option>
                    <option>Insurance Scheme</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-600 mb-0.5">Patient Type *</label>
                  <select 
                    name="patientType" 
                    value={formData.patientType} 
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded px-2 py-1 bg-white"
                  >
                    <option>General</option>
                    <option>Emergency</option>
                    <option>VIP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-600 mb-0.5">Department *</label>
                  <select 
                    name="departmentId" 
                    value={formData.departmentId} 
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded px-2 py-1 bg-white font-medium"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-600 mb-0.5">Doctor *</label>
                  <select 
                    name="doctorId" 
                    value={formData.doctorId} 
                    onChange={handleDoctorChange}
                    className="w-full border border-slate-300 rounded px-2 py-1 bg-white font-medium text-teal-800"
                  >
                    {doctors.map(doc => (
                      <option key={doc.id} value={doc.id}>
                        {doc.user.name} - {doc.specialization}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-600 mb-0.5">Consultation Tier</label>
                  <div className="inline-block bg-teal-50 border border-teal-300 text-teal-800 px-2 py-1 rounded text-xs font-semibold">
                    * {formData.consultationTag}
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Summary Card (Screenshot 1 top right) */}
            <div className="bg-white rounded border border-slate-300 shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-3 py-2 border-b border-slate-200">
                <div className="text-xs font-bold text-slate-700">Financial Information Summary</div>
              </div>
              <div className="p-3 text-xs">
                <div className="flex justify-between items-center mb-1 text-slate-600">
                  <span>Actual Total:</span>
                  <span className="font-semibold text-slate-800">Rs {formData.consultationFee}</span>
                </div>
                <div className="flex justify-between items-center mb-1 text-slate-600">
                  <span>Discount Amt:</span>
                  <span>Rs {formData.discountAmount}</span>
                </div>
                <div className="flex justify-between items-center mb-3 text-slate-600 pb-2 border-b border-slate-200">
                  <span>Rounded Amount:</span>
                  <span>0.00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-800">Total:</span>
                  <span className="text-xl font-extrabold text-teal-700">Rs {formData.consultationFee}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons matching Screenshot 1 Bottom Right */}
            <div className="bg-white p-3 rounded border border-slate-300 shadow-sm flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => successData ? setShowBillModal(true) : alert('Register patient first to print bill')}
                className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold px-3 py-2 rounded flex items-center space-x-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Re-Print Bill</span>
              </button>

              <button
                type="button"
                onClick={() => successData ? setShowStickerModal(true) : alert('Register patient first to print sticker')}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded flex items-center space-x-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Sticker</span>
              </button>

              <button
                type="submit"
                disabled={loading}
                className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold px-4 py-2 rounded shadow transition flex items-center space-x-1.5"
              >
                {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Submit</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Print Sticker Modal */}
      {showStickerModal && successData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full p-4 border border-slate-300">
            <div className="border-2 border-dashed border-slate-400 p-3 rounded bg-amber-50/50">
              <div className="text-center font-bold text-xs uppercase tracking-wider text-slate-800 border-b pb-1 mb-2">
                MediCore Hospital - OPD Sticker
              </div>
              <div className="space-y-1 text-xs">
                <div><strong>Patient No:</strong> {successData.patient.patientNumber}</div>
                <div><strong>Name:</strong> {successData.patient.title} {successData.patient.firstName} {successData.patient.lastName}</div>
                <div><strong>Gender / Age:</strong> {successData.patient.gender} / {formData.ageYears}y</div>
                <div><strong>Doctor:</strong> {doctors.find(d => d.id === formData.doctorId)?.user?.name || 'Dr. Sagun Adhikari'}</div>
                <div><strong>Case No:</strong> {successData.appointment?.caseNo || 'O/2026/01'}</div>
                <div><strong>Date/Time:</strong> {new Date().toLocaleString()}</div>
              </div>
              <div className="mt-3 text-center">
                <div className="font-mono text-[10px] tracking-widest text-slate-600">||| |||| || ||||| ||||||| |||</div>
                <div className="text-[10px] font-mono text-slate-500">{successData.patient.patientNumber}</div>
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button 
                onClick={() => window.print()} 
                className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold px-3 py-1.5 rounded"
              >
                Print
              </button>
              <button 
                onClick={() => setShowStickerModal(false)} 
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Bill Modal */}
      {showBillModal && successData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-5 border border-slate-300">
            <div className="border-b pb-3 mb-3">
              <h3 className="font-bold text-base text-slate-800 text-center">MEDICORE HOSPITAL ERP</h3>
              <p className="text-[11px] text-center text-slate-500">Official Outpatient Invoice & Money Receipt</p>
            </div>
            <div className="grid grid-cols-2 text-xs gap-1 mb-3 bg-slate-50 p-2 rounded">
              <div><strong>Invoice No:</strong> {successData.bill?.billNumber || 'INV-2026-0001'}</div>
              <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
              <div><strong>Patient ID:</strong> {successData.patient.patientNumber}</div>
              <div><strong>Name:</strong> {successData.patient.firstName} {successData.patient.lastName}</div>
            </div>
            <table className="w-full text-xs border border-slate-200 mb-3">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-1.5 text-left">Description</th>
                  <th className="p-1.5 text-right">Qty</th>
                  <th className="p-1.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-1.5 border-t">OPD Specialist Consultation Fee</td>
                  <td className="p-1.5 border-t text-right">1</td>
                  <td className="p-1.5 border-t text-right font-medium">Rs {formData.consultationFee}</td>
                </tr>
              </tbody>
            </table>
            <div className="text-right text-xs space-y-1 mb-4 border-t pt-2">
              <div>Total: <strong>Rs {formData.consultationFee}</strong></div>
              <div>Paid Amount: <strong className="text-emerald-700">Rs {formData.depositAmount}</strong></div>
              <div>Balance: <strong>Rs {Math.max(0, formData.consultationFee - formData.depositAmount)}</strong></div>
            </div>
            <div className="flex justify-end space-x-2">
              <button onClick={() => window.print()} className="bg-teal-700 text-white text-xs px-3 py-1.5 rounded font-semibold">
                Print Invoice
              </button>
              <button onClick={() => setShowBillModal(false)} className="bg-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded font-semibold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

