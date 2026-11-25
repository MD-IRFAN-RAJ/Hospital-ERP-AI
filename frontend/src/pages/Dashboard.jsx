import React, { useState, useEffect } from 'react';
import { 
  Users, Calendar, BedDouble, AlertCircle, TrendingUp, 
  Pill, FlaskConical, Receipt, Sparkles, CheckCircle 
} from 'lucide-react';
import api from '../services/api';

export default function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState({
    totalPatients: 7,
    todayOPD: 7,
    occupiedBeds: 2,
    totalBeds: 8,
    lowStockCount: 4,
    monthlyRevenue: 224000
  });

  return (
    <div className="p-4 bg-slate-100 min-h-screen text-slate-800 space-y-4">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-[#14253d] text-white p-5 rounded-lg shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">MediCore Hospital Operations Central</h1>
          <p className="text-xs text-slate-300 mt-1">
            Centralized Hospital ERP System with Assistive Clinical AI, RAG Knowledge Base, and Transactional Integrity.
          </p>
        </div>
        <div className="mt-3 md:mt-0 flex space-x-2">
          <button 
            onClick={() => onNavigate('registration')}
            className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold px-3 py-2 rounded shadow transition"
          >
            + Register Patient (OPD)
          </button>
          <button 
            onClick={() => onNavigate('ai-assistant')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-2 rounded shadow transition flex items-center space-x-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Knowledge Chat</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div 
          onClick={() => onNavigate('opd')}
          className="bg-white p-3 rounded border border-slate-300 shadow-xs cursor-pointer hover:border-teal-500 transition"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase">Total Patients</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-xl font-extrabold text-slate-800">{stats.totalPatients}</div>
          <span className="text-[10px] text-teal-600 font-medium">Registered in DB</span>
        </div>

        <div 
          onClick={() => onNavigate('opd')}
          className="bg-white p-3 rounded border border-slate-300 shadow-xs cursor-pointer hover:border-blue-500 transition"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase">Today's OPD</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-extrabold text-slate-800">{stats.todayOPD}</div>
          <span className="text-[10px] text-blue-600 font-medium">Active Queue</span>
        </div>

        <div 
          onClick={() => onNavigate('inpatient')}
          className="bg-white p-3 rounded border border-slate-300 shadow-xs cursor-pointer hover:border-purple-500 transition"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase">Beds Occupied</span>
            <BedDouble className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-extrabold text-slate-800">{stats.occupiedBeds} / {stats.totalBeds}</div>
          <span className="text-[10px] text-purple-600 font-medium">25% Occupancy</span>
        </div>

        <div 
          onClick={() => onNavigate('pharmacy')}
          className="bg-white p-3 rounded border border-slate-300 shadow-xs cursor-pointer hover:border-amber-500 transition"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase">Stock Alerts</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-extrabold text-amber-700">{stats.lowStockCount}</div>
          <span className="text-[10px] text-amber-600 font-medium">Below reorder level</span>
        </div>

        <div 
          onClick={() => onNavigate('billing')}
          className="bg-white p-3 rounded border border-slate-300 shadow-xs cursor-pointer hover:border-emerald-500 transition"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase">Revenue (Mtd)</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-extrabold text-slate-800">Rs {stats.monthlyRevenue.toLocaleString()}</div>
          <span className="text-[10px] text-emerald-600 font-medium">+28.5% growth</span>
        </div>

        <div 
          onClick={() => onNavigate('ai-assistant')}
          className="bg-white p-3 rounded border border-slate-300 shadow-xs cursor-pointer hover:border-indigo-500 transition"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase">AI Assistant</span>
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-extrabold text-indigo-700">Online</div>
          <span className="text-[10px] text-indigo-600 font-medium">RAG + OCR Ready</span>
        </div>
      </div>

      {/* Main Grid: Operational Shortcuts & Clinical Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Quick Workflow Hub */}
        <div className="bg-white p-4 rounded border border-slate-300 shadow-xs space-y-3">
          <h3 className="font-bold text-sm text-slate-800 border-b pb-2 flex items-center justify-between">
            <span>Primary ERP Workflows</span>
            <span className="text-xs text-teal-600 font-normal">Academic Baseline</span>
          </h3>

          <div className="space-y-2">
            <button 
              onClick={() => onNavigate('opd')}
              className="w-full text-left p-2.5 rounded border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition flex items-center justify-between"
            >
              <div className="flex items-center space-x-2.5">
                <Users className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="text-xs font-bold text-slate-800">OPD Management Table</div>
                  <div className="text-[11px] text-slate-500">Live queue, case numbers, status updates</div>
                </div>
              </div>
              <span className="text-xs text-blue-600 font-bold">Open →</span>
            </button>

            <button 
              onClick={() => onNavigate('patient-overview')}
              className="w-full text-left p-2.5 rounded border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 transition flex items-center justify-between"
            >
              <div className="flex items-center space-x-2.5">
                <FlaskConical className="w-4 h-4 text-teal-600" />
                <div>
                  <div className="text-xs font-bold text-slate-800">Swedish EMR Clinical Dashboard</div>
                  <div className="text-[11px] text-slate-500">8-card clinical overview, NEWS2, Vitals, Labs</div>
                </div>
              </div>
              <span className="text-xs text-teal-600 font-bold">Open →</span>
            </button>

            <button 
              onClick={() => onNavigate('registration')}
              className="w-full text-left p-2.5 rounded border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition flex items-center justify-between"
            >
              <div className="flex items-center space-x-2.5">
                <Pill className="w-4 h-4 text-emerald-600" />
                <div>
                  <div className="text-xs font-bold text-slate-800">LunivaCare OPD Registration</div>
                  <div className="text-[11px] text-slate-500">Multi-section patient demographic & cashier fee</div>
                </div>
              </div>
              <span className="text-xs text-emerald-600 font-bold">Open →</span>
            </button>

            <button 
              onClick={() => onNavigate('pharmacy')}
              className="w-full text-left p-2.5 rounded border border-slate-200 hover:border-purple-400 hover:bg-purple-50/50 transition flex items-center justify-between"
            >
              <div className="flex items-center space-x-2.5">
                <Pill className="w-4 h-4 text-purple-600" />
                <div>
                  <div className="text-xs font-bold text-slate-800">Pharmacy & Dispensing</div>
                  <div className="text-[11px] text-slate-500">Atomic inventory transactions & FEFO batches</div>
                </div>
              </div>
              <span className="text-xs text-purple-600 font-bold">Open →</span>
            </button>
          </div>
        </div>

        {/* Center & Right Columns: Live OPD Snapshot */}
        <div className="lg:col-span-2 bg-white p-4 rounded border border-slate-300 shadow-xs">
          <div className="flex items-center justify-between border-b pb-2 mb-3">
            <h3 className="font-bold text-sm text-slate-800">
              Live Consultations Snapshot (Dr. Sagun Adhikari & Team)
            </h3>
            <button 
              onClick={() => onNavigate('opd')}
              className="text-xs text-teal-700 font-semibold hover:underline"
            >
              View Full Table →
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900">Atul T Chandankhede</span>
                <span className="text-[11px] text-slate-500 ml-2 font-mono">MC-2026-0001 (Case: O/202605/5)</span>
                <div className="text-[11px] text-slate-500 mt-0.5">Doctor: Dr. Phonchai Atsawawinitkunchai | Dept: Cardiology</div>
              </div>
              <span className="bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded text-[10px]">
                IN ROOM
              </span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900">Vivek Pateliya</span>
                <span className="text-[11px] text-slate-500 ml-2 font-mono">MC-2026-0002 (Case: O/202604/3)</span>
                <div className="text-[11px] text-slate-500 mt-0.5">Doctor: Dr. Phonchai Atsawawinitkunchai | Dept: Cardiology</div>
              </div>
              <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px]">
                WAITING
              </span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900">Jivan Parekh</span>
                <span className="text-[11px] text-slate-500 ml-2 font-mono">MC-2026-0003 (Case: O/202604/2)</span>
                <div className="text-[11px] text-slate-500 mt-0.5">Doctor: Dr. Kitikon Wichairueangtham | Dept: Orthopedics</div>
              </div>
              <span className="bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded text-[10px]">
                IN ROOM
              </span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900">Rajesh Gantharia</span>
                <span className="text-[11px] text-slate-500 ml-2 font-mono">MC-2026-0004 (Case: O/202604/1)</span>
                <div className="text-[11px] text-slate-500 mt-0.5">Doctor: Dr. Ekkachai Chioratamnuai | Dept: Pediatrics</div>
              </div>
              <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px]">
                WAITING
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

