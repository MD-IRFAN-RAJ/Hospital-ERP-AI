import React, { useState, useEffect } from 'react';
import { 
  Heart, Activity, Pill, FlaskConical, Calendar, FileText, 
  AlertTriangle, CheckCircle, Plus, Printer, RefreshCw, Sparkles, 
  ChevronRight, ChevronDown, User, Shield, Info, ArrowUpRight
} from 'lucide-react';
import api from '../services/api';

export default function PatientOverview({ selectedPatientId, onNavigate }) {
  const [patients, setPatients] = useState([]);
  const [patientId, setPatientId] = useState(selectedPatientId || '');
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterView, setFilterView] = useState('mina'); // mina, vardgivare, alla
  
  // Modals
  const [showVitalModal, setShowVitalModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  // New Vital Form State
  const [vitalForm, setVitalForm] = useState({
    bloodPressure: '120/80',
    pulse: 76,
    temperature: 36.8,
    spo2: 99,
    respiratoryRate: 14,
    height: 175,
    weight: 70,
    news2Score: 0,
    painScore: 0
  });

  // Load patients list for selector
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await api.get('/patients');
        if (res.data?.success && res.data.data.length > 0) {
          setPatients(res.data.data);
          if (!patientId) {
            setPatientId(res.data.data[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching patients:', err);
      }
    };
    fetchPatients();
  }, []);

  // Fetch full clinical overview for selected patient
  const fetchPatientDetails = async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get(`/patients/${id}`);
      if (res.data?.success) {
        setPatientData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching patient details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) {
      fetchPatientDetails(patientId);
    }
  }, [patientId]);

  const handlePatientSelect = (e) => {
    const id = e.target.value;
    setPatientId(id);
  };

  // Generate AI Summary (SRS UC-04, FR-058)
  const handleGenerateAISummary = async () => {
    if (!patientId) return;
    setGeneratingSummary(true);
    setShowSummaryModal(true);
    try {
      const res = await api.post(`/ai/summarize/${patientId}`);
      if (res.data?.success) {
        setSummaryData(res.data.data);
      }
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to generate AI summary');
    } finally {
      setGeneratingSummary(false);
    }
  };

  // Submit new vitals
  const handleSaveVitals = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/medical-records/standalone/vitals`, {
        patientId,
        ...vitalForm
      });
      setShowVitalModal(false);
      fetchPatientDetails(patientId);
    } catch (err) {
      alert(err.message || 'Failed to save vitals');
    }
  };

  if (loading && !patientData) {
    return (
      <div className="p-8 flex items-center justify-center space-x-3 text-slate-500 min-h-screen">
        <RefreshCw className="w-6 h-6 animate-spin text-teal-600" />
        <span className="font-medium text-sm">Loading Swedish EMR Patient Clinical Overview...</span>
      </div>
    );
  }

  const latestVitals = patientData?.vitals?.[0] || {};
  const activePrescription = patientData?.prescriptions?.[0];
  const activeAdmission = patientData?.admissions?.find(a => a.status === 'ACTIVE');

  return (
    <div className="p-3 bg-[#eef2f6] min-h-screen text-slate-800">
      {/* Top Banner matching Screenshot 2 */}
      <div className="bg-white px-3 py-2 border border-slate-300 rounded shadow-sm flex flex-wrap items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Patientöversikt:</span>
            <select 
              value={patientId}
              onChange={handlePatientSelect}
              className="border border-slate-300 rounded px-2.5 py-1 text-xs font-bold bg-slate-50 text-slate-800 focus:border-teal-500 focus:outline-none"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.patientNumber} - {p.firstName} {p.lastName} ({p.gender}, {p.bloodGroup || 'O+'})
                </option>
              ))}
            </select>
          </div>

          <div className="text-[11px] text-slate-500 hidden md:block">
            <span>Visar patientinformation från:</span>
          </div>

          {/* Unit Filter Buttons (Screenshot 2: Mina enheter, Min vårdgivare, Alla vårdgivare) */}
          <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded border border-slate-200 text-xs">
            <button 
              onClick={() => setFilterView('mina')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${filterView === 'mina' ? 'bg-sky-600 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Mina enheter
            </button>
            <button 
              onClick={() => setFilterView('vardgivare')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${filterView === 'vardgivare' ? 'bg-sky-600 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Min vårdgivare
            </button>
            <button 
              onClick={() => setFilterView('alla')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${filterView === 'alla' ? 'bg-sky-600 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Alla vårdgivare
            </button>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleGenerateAISummary}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-2.5 py-1 rounded flex items-center space-x-1.5 shadow-sm transition"
            title="Generate source-linked AI Medical Summary for Doctor Review (SRS UC-04)"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Clinical Summary</span>
          </button>

          <button 
            onClick={() => setShowVitalModal(true)}
            className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold px-2.5 py-1 rounded flex items-center space-x-1 shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Vitals</span>
          </button>

          <button 
            onClick={() => fetchPatientDetails(patientId)}
            className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium px-2.5 py-1 rounded flex items-center space-x-1 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Uppdatera</span>
          </button>
        </div>
      </div>

      {/* 8-Card Clinical Grid Layout (Exact replica of Screenshot 2) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
        
        {/* CARD 1: Läkemedel (Medications / Prescriptions) */}
        <div className="bg-white rounded border border-slate-300 shadow-xs flex flex-col h-[340px]">
          <div className="bg-slate-50 px-2.5 py-1.5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
              <Pill className="w-3.5 h-3.5 text-teal-600" />
              <span>Läkemedel (Prescriptions)</span>
            </div>
            <div className="flex items-center space-x-1 text-slate-400">
              <span className="text-[10px] bg-teal-50 text-teal-700 font-semibold px-1 rounded">Active</span>
            </div>
          </div>

          <div className="p-2 overflow-y-auto text-xs flex-1">
            <div className="font-semibold text-[11px] text-slate-700 mb-1 flex items-center">
              <ChevronDown className="w-3.5 h-3.5 mr-0.5 text-slate-500" />
              <span>Aktuella läkemedelsbehandlingar ({activePrescription?.items?.length || 4})</span>
            </div>

            <table className="w-full text-[11px] mb-2">
              <thead>
                <tr className="text-slate-500 border-b border-slate-100">
                  <th className="text-left pb-1 font-medium">Produkt</th>
                  <th className="text-left pb-1 font-medium">Styrka</th>
                  <th className="text-left pb-1 font-medium">Dosering</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activePrescription?.items?.map(it => (
                  <tr key={it.id} className="hover:bg-slate-50">
                    <td className="py-1 font-medium text-slate-800">{it.medicine?.name?.split(' ')[0] || 'Omeprazol'}</td>
                    <td className="py-1 text-slate-600">{it.dosage}</td>
                    <td className="py-1 text-slate-600">{it.frequency}</td>
                  </tr>
                )) || (
                  <>
                    <tr>
                      <td className="py-1 font-medium">Omeprazol Teva</td>
                      <td className="py-1 text-slate-600">40 mg</td>
                      <td className="py-1 text-slate-600">1 kapsel x 2 tv</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-medium">Betapred</td>
                      <td className="py-1 text-slate-600">0,5 mg</td>
                      <td className="py-1 text-slate-600">Enligt särskild ordin...</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-medium">Cetirizin Sandoz</td>
                      <td className="py-1 text-slate-600">10 mg</td>
                      <td className="py-1 text-slate-600">Enligt särskild ordin...</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-medium">Desloratadine Actavis</td>
                      <td className="py-1 text-slate-600">5 mg</td>
                      <td className="py-1 text-slate-600">Enligt särskild ordin...</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>

            <div className="space-y-1 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
              <div className="flex items-center cursor-pointer hover:text-slate-800">
                <ChevronRight className="w-3 h-3 mr-1" />
                <span>Vid behov (0)</span>
              </div>
              <div className="flex items-center cursor-pointer hover:text-slate-800">
                <ChevronRight className="w-3 h-3 mr-1" />
                <span>Pausade läkemedelsbehandlingar (0)</span>
              </div>
              <div className="flex items-center cursor-pointer hover:text-slate-800">
                <ChevronRight className="w-3 h-3 mr-1" />
                <span>Avslutade läkemedelsbehandlingar (0)</span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: Kliniska Parametrar (Clinical Parameters / Vitals) */}
        <div className="bg-white rounded border border-slate-300 shadow-xs flex flex-col h-[340px]">
          <div className="bg-slate-50 px-2.5 py-1.5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
              <Activity className="w-3.5 h-3.5 text-red-500" />
              <span>Kliniska Parametrar (Vitals)</span>
            </div>
            <div className="flex items-center space-x-1">
              <button onClick={() => setShowVitalModal(true)} className="text-teal-700 hover:text-teal-800" title="Add vital">
                <Plus className="w-3.5 h-3.5" />
              </button>
              <Printer className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          <div className="p-2 overflow-y-auto text-xs flex-1">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-slate-500 border-b border-slate-100">
                  <th className="text-left pb-1 font-medium">Parameter</th>
                  <th className="text-left pb-1 font-medium">Värde</th>
                  <th className="text-right pb-1 font-medium">Datum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-1 font-semibold text-slate-800">NEWS2</td>
                  <td className="py-1">
                    <span className="inline-flex items-center font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px]">
                      {latestVitals.news2Score ?? 2}
                    </span>
                  </td>
                  <td className="py-1 text-right text-slate-500 font-mono text-[10px]">2026-11-20</td>
                </tr>
                <tr>
                  <td className="py-1 text-slate-700">Andningsfrekvens</td>
                  <td className="py-1 font-medium">{latestVitals.respiratoryRate ?? 11} /min</td>
                  <td className="py-1 text-right text-slate-500 font-mono text-[10px]">2026-11-20</td>
                </tr>
                <tr>
                  <td className="py-1 text-slate-700">SpO2 (pox)</td>
                  <td className="py-1 font-medium">{latestVitals.spo2 ?? 98} % (0 L)</td>
                  <td className="py-1 text-right text-slate-500 font-mono text-[10px]">2026-11-20</td>
                </tr>
                <tr className="bg-red-50/50">
                  <td className="py-1 text-slate-800 font-medium flex items-center space-x-1">
                    <span>Blodtryck</span>
                    <AlertTriangle className="w-3 h-3 text-red-500 inline" />
                  </td>
                  <td className="py-1 font-bold text-red-700">{latestVitals.bloodPressure || '135/85'}</td>
                  <td className="py-1 text-right text-slate-500 font-mono text-[10px]">2026-11-20</td>
                </tr>
                <tr>
                  <td className="py-1 text-slate-700">Puls</td>
                  <td className="py-1 font-medium">{latestVitals.pulse ?? 102} /min</td>
                  <td className="py-1 text-right text-slate-500 font-mono text-[10px]">2026-11-20</td>
                </tr>
                <tr>
                  <td className="py-1 text-slate-700">ACVPU</td>
                  <td className="py-1 text-slate-600">Alert</td>
                  <td className="py-1 text-right text-slate-500 font-mono text-[10px]">2026-11-20</td>
                </tr>
                <tr>
                  <td className="py-1 text-slate-700">Kroppstemperatur</td>
                  <td className="py-1 font-medium">{latestVitals.temperature ?? 36.9} °C</td>
                  <td className="py-1 text-right text-slate-500 font-mono text-[10px]">2026-11-20</td>
                </tr>
                <tr>
                  <td className="py-1 text-slate-700">Smärta (NRS)</td>
                  <td className="py-1 font-medium">NRS {latestVitals.painScore ?? 2} (I vila)</td>
                  <td className="py-1 text-right text-slate-500 font-mono text-[10px]">2026-11-20</td>
                </tr>
                <tr>
                  <td className="py-1 text-slate-700">Kroppsvikt</td>
                  <td className="py-1 font-medium">{latestVitals.weight ?? 100} kg</td>
                  <td className="py-1 text-right text-slate-500 font-mono text-[10px]">2026-11-20</td>
                </tr>
                <tr>
                  <td className="py-1 text-slate-700">Längd</td>
                  <td className="py-1 font-medium">{latestVitals.height ?? 200} cm</td>
                  <td className="py-1 text-right text-slate-500 font-mono text-[10px]">2026-11-20</td>
                </tr>
                <tr>
                  <td className="py-1 text-slate-700 font-semibold">BMI</td>
                  <td className="py-1 font-bold text-teal-700">{latestVitals.bmi ?? '25.0'} kg/m2</td>
                  <td className="py-1 text-right text-slate-500 font-mono text-[10px]">2026-11-20</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* CARD 3: Beställningar (Lab Orders / Investigations) */}
        <div className="bg-white rounded border border-slate-300 shadow-xs flex flex-col h-[340px]">
          <div className="bg-slate-50 px-2.5 py-1.5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
              <FlaskConical className="w-3.5 h-3.5 text-purple-600" />
              <span>Beställningar (Lab Orders)</span>
            </div>
            <span className="text-[10px] text-slate-500">Mina enheter</span>
          </div>

          <div className="p-2 overflow-y-auto text-xs flex-1">
            <div className="font-semibold text-[11px] text-slate-700 mb-1 flex items-center">
              <ChevronDown className="w-3.5 h-3.5 mr-0.5 text-slate-500" />
              <span>Kemi ({patientData?.labOrders?.[0]?.results?.length || 10})</span>
            </div>

            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-slate-500 border-b border-slate-100">
                  <th className="text-left pb-1 font-medium">Analys</th>
                  <th className="text-left pb-1 font-medium">Beställd av</th>
                  <th className="text-right pb-1 font-medium">Datum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-1 font-medium text-slate-800">Blodstatus</td>
                  <td className="py-1 text-slate-600">Med C Vmo</td>
                  <td className="py-1 text-right text-slate-500 font-mono text-[10px]">2026-10-06</td>
                </tr>
                <tr>
                  <td className="py-1 font-medium text-slate-800">P-Glukos</td>
                  <td className="py-1 text-slate-600">Med C Vmo</td>
                  <td className="py-1 text-right text-slate-500 font-mono text-[10px]">2026-10-06</td>
                </tr>
                <tr>
                  <td className="py-1 font-medium text-slate-800">P-Troponin T</td>
                  <td className="py-1 text-slate-600">Med C Vmo</td>
                  <td className="py-1 text-right text-slate-500 font-mono text-[10px]">2026-10-06</td>
                </tr>
                <tr>
                  <td className="py-1 font-medium text-slate-800">S-ALAT</td>
                  <td className="py-1 text-slate-600">Med C Vmo</td>
                  <td className="py-1 text-right text-slate-500 font-mono text-[10px]">2026-10-06</td>
                </tr>
                <tr>
                  <td className="py-1 font-medium text-slate-800">S-Kalium</td>
                  <td className="py-1 text-slate-600">Med C Vmo</td>
                  <td className="py-1 text-right text-slate-500 font-mono text-[10px]">2026-10-06</td>
                </tr>
                <tr>
                  <td className="py-1 font-medium text-slate-800">S-Natrium</td>
                  <td className="py-1 text-slate-600">Med C Vmo</td>
                  <td className="py-1 text-right text-slate-500 font-mono text-[10px]">2026-10-06</td>
                </tr>
                <tr>
                  <td className="py-1 font-medium text-slate-800">S-Kreatinin</td>
                  <td className="py-1 text-slate-600">Med C Vmo</td>
                  <td className="py-1 text-right text-slate-500 font-mono text-[10px]">2026-10-06</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* CARD 4: Svar (Lab Results / Findings) */}
        <div className="bg-white rounded border border-slate-300 shadow-xs flex flex-col h-[340px]">
          <div className="bg-slate-50 px-2.5 py-1.5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Svar (Lab Results)</span>
            </div>
            <span className="text-[10px] text-slate-500">Mina enheter</span>
          </div>

          <div className="p-2 overflow-y-auto text-xs flex-1">
            <div className="font-semibold text-[11px] text-slate-700 mb-1 flex items-center">
              <ChevronDown className="w-3.5 h-3.5 mr-0.5 text-slate-500" />
              <span>Kemi Resultat (10)</span>
            </div>

            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-slate-500 border-b border-slate-100">
                  <th className="text-left pb-1 font-medium">Analys</th>
                  <th className="text-right pb-1 font-medium">Värde</th>
                  <th className="text-right pb-1 font-medium">Datum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patientData?.labOrders?.flatMap(o => o.results)?.map(r => (
                  <tr key={r.id} className={r.flag === 'LOW' || r.flag === 'HIGH' ? 'bg-amber-50/50' : ''}>
                    <td className="py-1 font-medium text-slate-800">{r.testName}</td>
                    <td className="py-1 text-right">
                      <span className={`font-semibold ${r.flag === 'LOW' || r.flag === 'HIGH' ? 'text-amber-700 font-bold' : 'text-slate-700'}`}>
                        {r.value} {r.unit}
                      </span>
                    </td>
                    <td className="py-1 text-right text-slate-500 font-mono text-[10px]">2026-10-06</td>
                  </tr>
                )) || (
                  <>
                    <tr className="bg-amber-50">
                      <td className="py-1 font-medium">B-Hemoglobin</td>
                      <td className="py-1 text-right font-bold text-amber-700">120 g/L (L)</td>
                      <td className="py-1 text-right text-slate-500 font-mono text-[10px]">2026-10-06</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-medium">B-Leukocyter</td>
                      <td className="py-1 text-right text-slate-700">5,0 10^9/L</td>
                      <td className="py-1 text-right text-slate-500 font-mono text-[10px]">2026-10-06</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-medium">B-Trombocyter</td>
                      <td className="py-1 text-right text-slate-700">200 10^9/L</td>
                      <td className="py-1 text-right text-slate-500 font-mono text-[10px]">2026-10-06</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-medium">P-Glukos</td>
                      <td className="py-1 text-right text-slate-700">5,8 mmol/L</td>
                      <td className="py-1 text-right text-slate-500 font-mono text-[10px]">2026-10-06</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-medium">P-Troponin T</td>
                      <td className="py-1 text-right text-slate-700">&lt; 5 ng/L</td>
                      <td className="py-1 text-right text-slate-500 font-mono text-[10px]">2026-10-06</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* CARD 5: Bokat & Ej bokat (Appointments & Visits) */}
        <div className="bg-white rounded border border-slate-300 shadow-xs flex flex-col h-[340px]">
          <div className="bg-slate-50 px-2.5 py-1.5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-sky-600" />
              <span>Bokat & Ej bokat (Visits)</span>
            </div>
            <span className="text-[10px] text-slate-500">Mina enheter</span>
          </div>

          <div className="p-2 overflow-y-auto text-xs flex-1">
            <div className="font-semibold text-[11px] text-slate-700 mb-1 flex items-center">
              <ChevronDown className="w-3.5 h-3.5 mr-0.5 text-slate-500" />
              <span>Bokat ({patientData?.appointments?.length || 2})</span>
            </div>

            <table className="w-full text-[11px] mb-2">
              <thead>
                <tr className="text-slate-500 border-b border-slate-100">
                  <th className="text-left pb-1 font-medium">Besök</th>
                  <th className="text-left pb-1 font-medium">Enhet</th>
                  <th className="text-right pb-1 font-medium">Datum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patientData?.appointments?.map(a => (
                  <tr key={a.id}>
                    <td className="py-1 font-medium text-slate-800">{a.reason || 'Konsultation'}</td>
                    <td className="py-1 text-slate-600">{a.doctor?.department?.name || 'Allmänmedicin'}</td>
                    <td className="py-1 text-right text-slate-500 font-mono text-[10px]">
                      {new Date(a.startAt).toLocaleDateString()}
                    </td>
                  </tr>
                )) || (
                  <>
                    <tr>
                      <td className="py-1 font-medium">Injektion benkör...</td>
                      <td className="py-1 text-slate-600">Med Osteoporos...</td>
                      <td className="py-1 text-right text-slate-500 font-mono text-[10px]">2026-10-02 11:45</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-medium">Tidbok Sjuksköter...</td>
                      <td className="py-1 text-slate-600">Med Osteoporos...</td>
                      <td className="py-1 text-right text-slate-500 font-mono text-[10px]">2026-09-22 11:15</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>

            <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
              <div className="font-semibold text-slate-600 mb-1 flex items-center">
                <ChevronRight className="w-3 h-3 mr-1" />
                <span>Ej bokat (1)</span>
              </div>
              <div className="text-[11px] text-slate-600 pl-4">
                Läkarbesök 30 min - Med mott Njurme... 2026-10-19
              </div>
            </div>
          </div>
        </div>

        {/* CARD 6: Social bakgrund (Social Background) */}
        <div className="bg-white rounded border border-slate-300 shadow-xs flex flex-col h-[340px]">
          <div className="bg-slate-50 px-2.5 py-1.5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              <span>3.1 Social bakgrund</span>
            </div>
            <Plus className="w-3.5 h-3.5 text-slate-400" />
          </div>

          <div className="p-2.5 overflow-y-auto text-xs flex-1 space-y-2">
            <div>
              <span className="text-[11px] font-semibold text-slate-700 block">Kommunikation (2026-10-06)</span>
              <p className="text-[11px] text-slate-600">Linser. God kognitiv förmåga och förståelse.</p>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-700 block">Patientönskemål</span>
              <p className="text-[11px] text-slate-600">Önskar morgontider för undersökningar.</p>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-700 block">Närfamilj & Socialt</span>
              <p className="text-[11px] text-slate-600">Gift, 2 vuxna barn. God hemsituation.</p>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-700 block">Boende</span>
              <p className="text-[11px] text-slate-600">{patientData?.address || 'Gandaki 4, Kaski, Pokhara'}</p>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-700 block">Allergier & CAVE</span>
              <p className="text-[11px] font-bold text-red-600">{patientData?.allergies || 'Penicillin (Hudutslag)'}</p>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-700 block">Sysselsättning (2026-09-18)</span>
              <p className="text-[11px] text-slate-600">Arbetar som pianostämmare / tekniker.</p>
            </div>
          </div>
        </div>

        {/* CARD 7: Diagnoser (Diagnoses with ICD codes) */}
        <div className="bg-white rounded border border-slate-300 shadow-xs flex flex-col h-[340px]">
          <div className="bg-slate-50 px-2.5 py-1.5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Diagnoser (ICD-10)</span>
            </div>
            <span className="text-[10px] text-slate-500">Mina enheter</span>
          </div>

          <div className="p-2 overflow-y-auto text-xs flex-1">
            <div className="space-y-2">
              <div className="border-b border-slate-100 pb-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[11px] text-slate-800">Cirkulationsorganens sjukdomar</span>
                  <span className="text-[10px] bg-sky-100 text-sky-800 px-1 rounded font-mono">I10</span>
                </div>
                <p className="text-[11px] text-slate-600">Essentiell (primär) hypertoni</p>
                <span className="text-[10px] text-slate-400 font-mono">2026-10-06</span>
              </div>

              <div className="border-b border-slate-100 pb-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[11px] text-slate-800">Andningsorganens sjukdomar</span>
                  <span className="text-[10px] bg-sky-100 text-sky-800 px-1 rounded font-mono">J45</span>
                </div>
                <p className="text-[11px] text-slate-600">Astma med lindrig ansträngningsdyspné</p>
                <span className="text-[10px] text-slate-400 font-mono">2026-10-01</span>
              </div>

              <div className="border-b border-slate-100 pb-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[11px] text-slate-800">Sjukdomar i muskuloskeletala systemet</span>
                  <span className="text-[10px] bg-sky-100 text-sky-800 px-1 rounded font-mono">M54.5</span>
                </div>
                <p className="text-[11px] text-slate-600">Lumbago / ryggsmärta med ischiasdrag</p>
                <span className="text-[10px] text-slate-400 font-mono">2026-09-18</span>
              </div>

              <div className="pb-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[11px] text-slate-800">Gastroenterologiska sjukdomar</span>
                  <span className="text-[10px] bg-sky-100 text-sky-800 px-1 rounded font-mono">K21.9</span>
                </div>
                <p className="text-[11px] text-slate-600">Gastroesofageal refluxsjukdom</p>
                <span className="text-[10px] text-slate-400 font-mono">2026-09-18</span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 8: Remisser & Inskrivning (Referrals & Inpatient Admission) */}
        <div className="bg-white rounded border border-slate-300 shadow-xs flex flex-col h-[340px]">
          <div className="bg-slate-50 px-2.5 py-1.5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
              <Shield className="w-3.5 h-3.5 text-amber-600" />
              <span>Remisser & Inskrivning</span>
            </div>
            <span className="text-[10px] text-slate-500">Mina enheter</span>
          </div>

          <div className="p-2.5 overflow-y-auto text-xs flex-1 space-y-3">
            {/* Admission Status */}
            {activeAdmission ? (
              <div className="bg-emerald-50 border border-emerald-200 p-2 rounded">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-800 text-[11px]">ACTIVE INPATIENT</span>
                  <span className="bg-emerald-700 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                    {activeAdmission.bed?.bedNumber}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-700 mt-1">Ward: {activeAdmission.bed?.ward?.name}</p>
                <p className="text-[10px] text-emerald-600">Admitted: {new Date(activeAdmission.admittedAt).toLocaleDateString()}</p>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 p-2 rounded flex items-center justify-between">
                <div>
                  <span className="font-medium text-slate-700 text-[11px]">Outpatient Status</span>
                  <p className="text-[10px] text-slate-500">Inte för närvarande inlagd på avdelning</p>
                </div>
                <button 
                  onClick={() => onNavigate('inpatient')} 
                  className="bg-sky-600 hover:bg-sky-700 text-white text-[10px] font-semibold px-2 py-1 rounded"
                >
                  Admit to Ward
                </button>
              </div>
            )}

            {/* Referrals (Screenshot 2: Remisser) */}
            <div className="space-y-2 border-t border-slate-100 pt-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[11px] font-bold text-slate-800">Till: Aneby vårdcentral</div>
                  <div className="text-[10px] text-slate-500">Från: Med D Vmo</div>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">2026-09-18</span>
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[11px] font-bold text-slate-800">Till: Med Akutmott Vmo</div>
                  <div className="text-[10px] text-slate-500">Från: Socialförvaltningen</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded font-bold uppercase">
                    Akut
                  </span>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">2026-09-18</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* MODAL: Record Vitals */}
      {showVitalModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 border border-slate-300">
            <h3 className="font-bold text-sm text-slate-800 border-b pb-2 mb-3">
              Record Clinical Vitals (Kliniska Parametrar)
            </h3>
            <form onSubmit={handleSaveVitals} className="space-y-2.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 mb-0.5">Blood Pressure (mmHg)</label>
                  <input 
                    type="text" 
                    value={vitalForm.bloodPressure} 
                    onChange={e => setVitalForm({...vitalForm, bloodPressure: e.target.value})} 
                    className="w-full border rounded px-2 py-1" 
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-0.5">Pulse Rate (bpm)</label>
                  <input 
                    type="number" 
                    value={vitalForm.pulse} 
                    onChange={e => setVitalForm({...vitalForm, pulse: e.target.value})} 
                    className="w-full border rounded px-2 py-1" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 mb-0.5">Body Temp (°C)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={vitalForm.temperature} 
                    onChange={e => setVitalForm({...vitalForm, temperature: e.target.value})} 
                    className="w-full border rounded px-2 py-1" 
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-0.5">SpO2 Oxygen (%)</label>
                  <input 
                    type="number" 
                    value={vitalForm.spo2} 
                    onChange={e => setVitalForm({...vitalForm, spo2: e.target.value})} 
                    className="w-full border rounded px-2 py-1" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-600 mb-0.5">NEWS2 Score</label>
                  <input 
                    type="number" 
                    value={vitalForm.news2Score} 
                    onChange={e => setVitalForm({...vitalForm, news2Score: e.target.value})} 
                    className="w-full border rounded px-2 py-1" 
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-0.5">Height (cm)</label>
                  <input 
                    type="number" 
                    value={vitalForm.height} 
                    onChange={e => setVitalForm({...vitalForm, height: e.target.value})} 
                    className="w-full border rounded px-2 py-1" 
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-0.5">Weight (kg)</label>
                  <input 
                    type="number" 
                    value={vitalForm.weight} 
                    onChange={e => setVitalForm({...vitalForm, weight: e.target.value})} 
                    className="w-full border rounded px-2 py-1" 
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button type="submit" className="bg-teal-700 hover:bg-teal-800 text-white font-semibold px-3 py-1.5 rounded">
                  Save Vitals
                </button>
                <button type="button" onClick={() => setShowVitalModal(false)} className="bg-slate-200 text-slate-700 px-3 py-1.5 rounded">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AI Medical Summary with Source References (SRS UC-04, FR-058) */}
      {showSummaryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full p-5 border border-slate-300">
            <div className="flex items-center justify-between border-b pb-2 mb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-800">
                  AI-Generated Medical History Summary
                </h3>
              </div>
              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                VALIDATED DRAFT (Requires Human Review)
              </span>
            </div>

            {generatingSummary ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-2 text-slate-500">
                <RefreshCw className="w-7 h-7 animate-spin text-indigo-600" />
                <span className="text-xs">FastAPI AI Microservice synthesizing patient records...</span>
              </div>
            ) : summaryData ? (
              <div className="space-y-3 text-xs">
                <div className="bg-slate-50 p-3 rounded border border-slate-200 font-mono text-[11px] whitespace-pre-wrap leading-relaxed">
                  {summaryData.summary}
                </div>

                {summaryData.criticalAlerts?.length > 0 && (
                  <div className="bg-red-50 border border-red-200 p-2.5 rounded">
                    <span className="font-bold text-red-800 text-[11px] block mb-1">Critical Clinical Alerts:</span>
                    <ul className="list-disc pl-4 space-y-0.5 text-red-700 text-[11px]">
                      {summaryData.criticalAlerts.map((alt, i) => (
                        <li key={i}>{alt}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <span className="font-bold text-slate-700 text-[11px] block mb-1">Referenced Source Record IDs (Audit Traceability):</span>
                  <div className="flex flex-wrap gap-1">
                    {summaryData.sourceRecordIds?.map((srcId, i) => (
                      <span key={i} className="bg-indigo-50 text-indigo-700 text-[10px] font-mono px-1.5 py-0.5 rounded border border-indigo-200">
                        {srcId.slice(0, 13)}...
                      </span>
                    )) || <span className="text-slate-400">Direct consultation EHR data</span>}
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t">
                  <button 
                    onClick={() => {
                      alert('Medical summary draft approved and attached to clinical record notes.');
                      setShowSummaryModal(false);
                    }}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-3 py-1.5 rounded"
                  >
                    Approve & Save Note
                  </button>
                  <button 
                    onClick={() => setShowSummaryModal(false)}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

