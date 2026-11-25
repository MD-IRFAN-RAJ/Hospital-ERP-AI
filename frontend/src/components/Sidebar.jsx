import React from 'react';
import { 
  LayoutDashboard, UserPlus, Users, FileHeart, Stethoscope, 
  Pill, FlaskConical, Receipt, BedDouble, Bot, History, Settings 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ currentPage, onNavigate }) {
  const { user } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'opd', label: 'OPD Management', icon: Users, badge: 'Queue' },
    { id: 'registration', label: 'OPD Registration', icon: UserPlus },
    { id: 'patient-overview', label: 'Patient Overview (EMR)', icon: FileHeart, badge: 'Clinical' },
    { id: 'appointments', label: 'Appointments', icon: Stethoscope },
    { id: 'pharmacy', label: 'Pharmacy & Stock', icon: Pill },
    { id: 'laboratory', label: 'Lab & Diagnostics', icon: FlaskConical },
    { id: 'billing', label: 'Billing & Cashier', icon: Receipt },
    { id: 'inpatient', label: 'IPD & Bed Allocation', icon: BedDouble },
    { id: 'ai-assistant', label: 'AI Assistant (RAG)', icon: Bot, badge: 'Assistive' },
    { id: 'audit', label: 'System Audit Logs', icon: History },
  ];

  return (
    <aside className="w-64 bg-[#14253d] text-slate-300 flex flex-col shrink-0 min-h-[calc(100vh-53px)] select-none border-r border-slate-800">
      {/* User Profile Card (Screenshot 1 LunivaCare style) */}
      <div className="p-4 border-b border-slate-700/60 flex items-center space-x-3 bg-[#111e31]">
        <div className="w-11 h-11 rounded-full bg-slate-600/80 border-2 border-teal-400/80 flex items-center justify-center text-slate-200">
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>
        <div className="overflow-hidden">
          <span className="text-[11px] text-slate-400 block">Welcome,</span>
          <span className="font-semibold text-white text-xs block truncate">{user?.name || 'Suman Sunuwar'}</span>
          <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-teal-900/90 text-teal-300 border border-teal-700/50">
            {user?.role || 'STAFF'}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-3 overflow-y-auto">
        <div className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Main Modules
        </div>
        <nav className="space-y-0.5 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs transition font-medium ${
                  active 
                    ? 'bg-[#0284c7] text-white shadow-sm font-semibold' 
                    : 'text-slate-300 hover:bg-[#1c3352] hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    active ? 'bg-sky-900 text-sky-200' : 'bg-slate-700/80 text-slate-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-700/50 text-[11px] text-slate-400 flex items-center justify-between bg-[#0e1a2b]">
        <span>MediCore v1.0</span>
        <span className="flex items-center space-x-1 text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Online</span>
        </span>
      </div>
    </aside>
  );
}

