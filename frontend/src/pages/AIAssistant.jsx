import React, { useState, useEffect } from 'react';
import { 
  Bot, Send, Sparkles, BookOpen, BarChart3, FileSearch, 
  ExternalLink, CheckCircle, RefreshCw, HelpCircle, Layers 
} from 'lucide-react';
import api from '../services/api';

export default function AIAssistant() {
  const [activeTab, setActiveTab] = useState('rag'); // rag, analytics, summarizer
  
  // RAG Chat State (SRS FR-056, FR-057, Section 8.2)
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      content: 'Welcome to MediCore Assistive AI! I can answer questions regarding approved Hospital Standard Operating Procedures (SOPs), Patient Admission criteria, Discharge checklists, and Emergency Triage guidelines with grounded citations.',
      sources: [
        { documentId: 'hospital_admission_policy', documentName: 'Hospital Admission Policy', page: 1 }
      ]
    }
  ]);
  const [chatInput, setChatInput] = useState('What is the patient admission procedure?');
  const [chatLoading, setChatLoading] = useState(false);

  // Natural Language Analytics State (SRS FR-060, Section 8.3)
  const [analyticsQuery, setAnalyticsQuery] = useState('Show monthly revenue for the last six months');
  const [analyticsResult, setAnalyticsResult] = useState({
    summary: 'Revenue increased in the selected period by 28.5%.',
    chartType: 'line',
    labels: ['June', 'July', 'August', 'September', 'October', 'November'],
    values: [120000, 145000, 132000, 178000, 195000, 224000],
    seriesName: 'Revenue (INR/NPR)'
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // RAG Submit
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatLoading(true);
    const query = chatInput;
    setChatInput('');

    try {
      const res = await api.post('/ai/chat', {
        message: query,
        contextScope: 'HOSPITAL_POLICIES'
      });

      if (res.data?.success) {
        setChatMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: res.data.data.answer,
            sources: res.data.data.sources
          }
        ]);
      }
    } catch (err) {
      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Notice: AI Microservice response error. Standard operating procedures remain accessible at administrative desks.',
          sources: []
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Analytics Submit
  const handleAnalyticsSubmit = async (e) => {
    e.preventDefault();
    if (!analyticsQuery.trim()) return;
    setAnalyticsLoading(true);

    try {
      const res = await api.post('/ai/analytics/query', { question: analyticsQuery });
      if (res.data?.success) {
        setAnalyticsResult(res.data.data);
      }
    } catch (err) {
      alert(err.message || 'Analytics query failed');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  return (
    <div className="p-4 bg-slate-100 min-h-screen text-slate-800 space-y-4">
      {/* Top Banner */}
      <div className="bg-white p-3.5 rounded border border-slate-300 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-800">MediCore AI Assistive Intelligence Suite</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Python FastAPI + RAG Vector Engine + NL Analytics + Schema-Constrained Extraction
          </p>
        </div>

        {/* Suite Tabs */}
        <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded border border-slate-300 text-xs">
          <button
            onClick={() => setActiveTab('rag')}
            className={`px-3 py-1.5 rounded font-semibold flex items-center space-x-1.5 transition ${
              activeTab === 'rag' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>RAG Policy Chatbot</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 rounded font-semibold flex items-center space-x-1.5 transition ${
              activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>NL Analytics Query</span>
          </button>
        </div>
      </div>

      {/* TAB 1: RAG POLICY CHATBOT */}
      {activeTab === 'rag' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 bg-white rounded border border-slate-300 shadow-xs flex flex-col h-[560px]">
            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
              {chatMessages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-lg p-3 ${
                    msg.role === 'user' 
                      ? 'bg-teal-700 text-white' 
                      : 'bg-slate-50 border border-slate-200 text-slate-800 shadow-2xs'
                  }`}>
                    <div className="font-semibold text-[10px] uppercase mb-1 opacity-80">
                      {msg.role === 'user' ? 'You' : 'MediCore Knowledge AI (FastAPI)'}
                    </div>
                    <div className="whitespace-pre-wrap leading-relaxed text-xs">
                      {msg.content}
                    </div>

                    {/* Citations Box (SRS Section 8.2) */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200/70">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                          Verified Policy Citations:
                        </span>
                        <div className="space-y-1">
                          {msg.sources.map((s, idx) => (
                            <div key={idx} className="flex items-center space-x-1.5 text-[11px] text-indigo-700 font-medium">
                              <ExternalLink className="w-3 h-3 shrink-0" />
                              <span>{s.documentName} (Page {s.page})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-50 border border-slate-200 rounded p-2.5 text-xs text-slate-500 flex items-center space-x-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                    <span>Retrieving policy chunks & synthesizing grounded response...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleChatSubmit} className="p-3 border-t border-slate-200 bg-slate-50 flex space-x-2">
              <input
                type="text"
                placeholder="Ask about hospital policies, SOPs, triage scale, or discharge rules..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                className="flex-1 border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={chatLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded text-xs flex items-center space-x-1 shadow transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Ask AI</span>
              </button>
            </form>
          </div>

          {/* Right Reference Box */}
          <div className="lg:col-span-4 bg-white p-4 rounded border border-slate-300 shadow-xs space-y-3 text-xs">
            <h3 className="font-bold text-sm text-slate-800 border-b pb-2 flex items-center space-x-1.5">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>Approved Indexed SOPs (RAG)</span>
            </h3>

            <div className="space-y-2">
              <div 
                onClick={() => setChatInput('What is the patient admission procedure?')}
                className="p-2.5 rounded border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer transition"
              >
                <span className="font-bold text-slate-800 block text-xs">Hospital Admission SOP</span>
                <p className="text-[11px] text-slate-500 mt-0.5">Emergency vs Elective criteria, bed allocation and deposit.</p>
                <span className="text-[10px] text-indigo-600 font-semibold mt-1 inline-block">Ask this →</span>
              </div>

              <div 
                onClick={() => setChatInput('What are the Emergency Triage levels?')}
                className="p-2.5 rounded border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer transition"
              >
                <span className="font-bold text-slate-800 block text-xs">Emergency Triage Guidelines</span>
                <p className="text-[11px] text-slate-500 mt-0.5">Level 1 (Red), Level 2 (Yellow), Level 3 (Green) criteria & NEWS2.</p>
                <span className="text-[10px] text-indigo-600 font-semibold mt-1 inline-block">Ask this →</span>
              </div>

              <div 
                onClick={() => setChatInput('What are the discharge summary requirements?')}
                className="p-2.5 rounded border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer transition"
              >
                <span className="font-bold text-slate-800 block text-xs">Discharge & Transfer SOP</span>
                <p className="text-[11px] text-slate-500 mt-0.5">Clinical sign-off, medicine reconciliation, and financial clearance.</p>
                <span className="text-[10px] text-indigo-600 font-semibold mt-1 inline-block">Ask this →</span>
              </div>

              <div 
                onClick={() => setChatInput('What are the pharmacy dispensing verification rules?')}
                className="p-2.5 rounded border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer transition"
              >
                <span className="font-bold text-slate-800 block text-xs">Pharmacy Dispensing Standard</span>
                <p className="text-[11px] text-slate-500 mt-0.5">FEFO batch policy and atomic inventory decrement rules.</p>
                <span className="text-[10px] text-indigo-600 font-semibold mt-1 inline-block">Ask this →</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: NATURAL LANGUAGE ANALYTICS (SRS Section 8.3) */}
      {activeTab === 'analytics' && (
        <div className="bg-white p-5 rounded border border-slate-300 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-800">
              Approved Natural-Language Analytics (SRS Section 6.4 & 8.3)
            </h3>
            <p className="text-xs text-slate-500">
              Direct parameterized execution of verified read-only reporting queries without arbitrary SQL execution.
            </p>
          </div>

          <form onSubmit={handleAnalyticsSubmit} className="flex space-x-2">
            <input
              type="text"
              value={analyticsQuery}
              onChange={e => setAnalyticsQuery(e.target.value)}
              placeholder="e.g. Show monthly revenue, Department appointments, Low stock medicines..."
              className="flex-1 border border-slate-300 rounded px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 font-medium"
            />
            <button
              type="submit"
              disabled={analyticsLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded text-xs flex items-center space-x-1.5 shadow"
            >
              {analyticsLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>Run Analytics</span>
            </button>
          </form>

          {/* Quick query presets */}
          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="text-slate-500 py-0.5">Sample Queries:</span>
            {[
              'Show monthly revenue for the last six months',
              'Show consultations by department',
              'Show low stock medicines',
              'Show weekly patient visit count',
              'Show bed occupancy distribution'
            ].map(q => (
              <button
                key={q}
                type="button"
                onClick={() => {
                  setAnalyticsQuery(q);
                }}
                className="bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 px-2.5 py-1 rounded border border-slate-300 transition"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Chart & Result Display (SRS Section 8.3 Contract format) */}
          {analyticsResult && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="bg-slate-50 p-4 rounded border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-xs text-slate-800">
                    {analyticsResult.summary}
                  </h4>
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded font-mono uppercase">
                    Chart Type: {analyticsResult.chartType}
                  </span>
                </div>

                {/* Visual Bar / Metric Display */}
                <div className="space-y-2 mt-4">
                  {analyticsResult.labels.map((lbl, idx) => {
                    const val = analyticsResult.values[idx];
                    const maxVal = Math.max(...analyticsResult.values) || 1;
                    const pct = Math.round((val / maxVal) * 100);

                    return (
                      <div key={lbl} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-slate-700">{lbl}</span>
                          <span className="font-bold text-slate-900 font-mono">
                            {typeof val === 'number' ? val.toLocaleString() : val}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                          <div 
                            className="bg-indigo-600 h-3 rounded-full transition-all duration-500" 
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Raw API Contract Preview (SRS 8.3) */}
                <div className="mt-4 pt-3 border-t border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    JSON Response Payload:
                  </span>
                  <pre className="bg-slate-900 text-teal-300 p-2.5 rounded text-[11px] font-mono overflow-x-auto">
                    {JSON.stringify(analyticsResult, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

