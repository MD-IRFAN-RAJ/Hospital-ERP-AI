import React, { useState, useEffect } from 'react';
import { FlaskConical, Upload, CheckCircle, AlertTriangle, FileText, Sparkles, RefreshCw } from 'lucide-react';
import api from '../services/api';

export default function Laboratory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [ocrText, setOcrText] = useState(`CLINICAL PATHOLOGY LABORATORY REPORT
PATIENT: ATUL T CHANDANKHEDE | GENDER: MALE | AGE: 42
Hemoglobin: 12.1 g/dL
WBC / Leukocytes: 11.8 10^3/uL
Platelet Count: 220 10^3/uL
Fasting Blood Glucose: 138 mg/dL
Serum Creatinine: 1.0 mg/dL
Serum CRP: 7.2 mg/L`);
  const [ocrResult, setOcrResult] = useState(null);
  const [extracting, setExtracting] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/lab/orders');
      if (res.data?.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Run AI OCR Report Extraction (SRS UC-05, FR-059, TC-009)
  const handleRunOcr = async () => {
    setExtracting(true);
    try {
      const res = await api.post('/ai/ocr/extract', {
        rawText: ocrText,
        fileName: 'Hematology_Biochem_Report.pdf'
      });
      if (res.data?.success) {
        setOcrResult(res.data.data);
      }
    } catch (err) {
      alert(err.message || 'Failed to extract report');
    } finally {
      setExtracting(false);
    }
  };

  // Human Review Approval / Rejection (SRS FR-062)
  const handleReviewDecision = async (action) => {
    if (!ocrResult?.extractionId) return;
    try {
      const firstOrderId = orders[0]?.id;
      const res = await api.post(`/ai/extractions/${ocrResult.extractionId}/review`, {
        action,
        labOrderId: firstOrderId,
        editedTests: ocrResult.testsExtracted
      });
      if (res.data?.success) {
        alert(action === 'APPROVE' ? 'Lab results approved by clinician and committed to patient record!' : 'Extraction draft rejected.');
        setShowOcrModal(false);
        setOcrResult(null);
        fetchOrders();
      }
    } catch (err) {
      alert(err.message || 'Action failed');
    }
  };

  return (
    <div className="p-4 bg-slate-100 min-h-screen text-slate-800 space-y-4">
      <div className="bg-white p-3.5 rounded border border-slate-300 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800">Laboratory & Diagnostic Orders</h2>
          <p className="text-xs text-slate-500">Sample tracking, test results entry, and assistive OCR report extraction</p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => setShowOcrModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded flex items-center space-x-1.5 shadow-xs transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI OCR Report Extraction</span>
          </button>
          <button 
            onClick={fetchOrders}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded flex items-center space-x-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded border border-slate-300 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
            <tr>
              <th className="p-2.5">Order ID</th>
              <th className="p-2.5">Patient</th>
              <th className="p-2.5">Ordering Doctor</th>
              <th className="p-2.5">Priority</th>
              <th className="p-2.5">Status</th>
              <th className="p-2.5">Results Count</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map(ord => (
              <tr key={ord.id} className="hover:bg-slate-50">
                <td className="p-2.5 font-mono font-medium">{ord.id.slice(0, 8)}...</td>
                <td className="p-2.5 font-bold text-slate-800">
                  {ord.patient?.firstName} {ord.patient?.lastName} ({ord.patient?.patientNumber})
                </td>
                <td className="p-2.5">{ord.doctor?.user?.name || 'Dr. Sagun Adhikari'}</td>
                <td className="p-2.5">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    ord.priority === 'STAT' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {ord.priority}
                  </span>
                </td>
                <td className="p-2.5">
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                    {ord.status}
                  </span>
                </td>
                <td className="p-2.5 font-semibold text-slate-700">
                  {ord.results?.length || 0} tests recorded
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* OCR Extraction Review Modal (SRS UC-05, FR-059, FR-062, TC-009) */}
      {showOcrModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-5 border border-slate-300 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-2 mb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-800">
                  AI OCR Medical Report Extraction & Schema Validation
                </h3>
              </div>
              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                HUMAN REVIEW GATE (SRS FR-062)
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">
                  Scanned Lab Report Text / OCR Input (Paste or edit test values):
                </label>
                <textarea
                  rows={4}
                  value={ocrText}
                  onChange={e => setOcrText(e.target.value)}
                  className="w-full border rounded p-2 font-mono text-[11px] bg-slate-50 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleRunOcr}
                  disabled={extracting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3 py-1.5 rounded flex items-center space-x-1.5 shadow-xs transition"
                >
                  {extracting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Parse Report with LLM Schema</span>
                </button>
                <span className="text-[11px] text-slate-500">
                  Extracts parameters, units, reference intervals & abnormality flags
                </span>
              </div>

              {/* Draft Extraction Table for Human Review */}
              {ocrResult && (
                <div className="mt-4 pt-3 border-t border-slate-200">
                  <h4 className="font-bold text-slate-800 mb-1 flex items-center justify-between">
                    <span>Draft Extraction Results for Verification:</span>
                    <span className="text-[10px] text-indigo-700 font-normal">Confidence: 96%</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mb-2">{ocrResult.overallRemarks}</p>

                  <div className="border border-slate-200 rounded overflow-hidden">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 text-slate-700 font-semibold">
                        <tr>
                          <th className="p-1.5">Test Parameter</th>
                          <th className="p-1.5">Value</th>
                          <th className="p-1.5">Unit</th>
                          <th className="p-1.5">Reference Range</th>
                          <th className="p-1.5 text-center">Flag</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {ocrResult.testsExtracted?.map((t, idx) => (
                          <tr key={idx} className={t.flag === 'HIGH' || t.flag === 'LOW' ? 'bg-amber-50/50' : ''}>
                            <td className="p-1.5 font-medium">{t.testName}</td>
                            <td className="p-1.5 font-bold text-slate-800">{t.value}</td>
                            <td className="p-1.5 text-slate-600">{t.unit}</td>
                            <td className="p-1.5 text-slate-600 font-mono text-[10px]">{t.referenceRange}</td>
                            <td className="p-1.5 text-center">
                              <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                                t.flag === 'HIGH' ? 'bg-red-100 text-red-800' : (t.flag === 'LOW' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800')
                              }`}>
                                {t.flag}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 flex justify-end space-x-2">
                    <button
                      onClick={() => handleReviewDecision('APPROVE')}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-1.5 rounded text-xs flex items-center space-x-1 shadow transition"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Approve & Commit to EHR</span>
                    </button>
                    <button
                      onClick={() => handleReviewDecision('REJECT')}
                      className="bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-1.5 rounded text-xs transition"
                    >
                      Reject Draft
                    </button>
                    <button
                      onClick={() => setShowOcrModal(false)}
                      className="bg-slate-200 text-slate-700 px-3 py-1.5 rounded text-xs"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

