import React, { useState } from 'react';
import { 
  Building2, Search, Bell, Info, User, ChevronDown, 
  Sparkles, Shield, LogOut 
} from 'lucide-react';
import { useAuth, DEMO_ROLES } from '../context/AuthContext';

export default function Navbar({ onNavigate, currentPage }) {
  const { user, switchRole, logout } = useAuth();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('pat_name');
  const [searchQuery, setSearchQuery] = useState('');

  const handleRoleSelect = async (roleKey) => {
    setRoleDropdownOpen(false);
    await switchRole(roleKey);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('opd', { search: searchQuery.trim(), filterType: searchFilter });
    }
  };

  return (
    <header className="bg-slate-800 text-white border-b border-slate-700 select-none sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 py-2 text-sm">
        {/* Left: Brand and Quick Navigation */}
        <div className="flex items-center space-x-6">
          <div 
            onClick={() => onNavigate('dashboard')}
            className="flex items-center space-x-2 cursor-pointer font-bold tracking-wide text-lg text-teal-400 hover:text-teal-300 transition-colors"
          >
            <Building2 className="w-6 h-6 text-teal-400" />
            <span>MEDICORE<span className="text-white text-xs font-normal ml-1 px-1.5 py-0.5 rounded bg-teal-800/80">ERP</span></span>
          </div>

          <nav className="hidden md:flex items-center space-x-1 text-slate-300 text-xs font-medium">
            <button 
              onClick={() => onNavigate('opd')} 
              className={`px-2.5 py-1.5 rounded hover:text-white hover:bg-slate-700/60 transition ${currentPage === 'opd' ? 'bg-teal-700 text-white' : ''}`}
            >
              OPD Queue
            </button>
            <button 
              onClick={() => onNavigate('registration')} 
              className={`px-2.5 py-1.5 rounded hover:text-white hover:bg-slate-700/60 transition ${currentPage === 'registration' ? 'bg-teal-700 text-white' : ''}`}
            >
              Registration
            </button>
            <button 
              onClick={() => onNavigate('patient-overview')} 
              className={`px-2.5 py-1.5 rounded hover:text-white hover:bg-slate-700/60 transition ${currentPage === 'patient-overview' ? 'bg-teal-700 text-white' : ''}`}
            >
              EMR Clinical
            </button>
            <button 
              onClick={() => onNavigate('pharmacy')} 
              className={`px-2.5 py-1.5 rounded hover:text-white hover:bg-slate-700/60 transition ${currentPage === 'pharmacy' ? 'bg-teal-700 text-white' : ''}`}
            >
              Pharmacy
            </button>
            <button 
              onClick={() => onNavigate('laboratory')} 
              className={`px-2.5 py-1.5 rounded hover:text-white hover:bg-slate-700/60 transition ${currentPage === 'laboratory' ? 'bg-teal-700 text-white' : ''}`}
            >
              Laboratory
            </button>
            <button 
              onClick={() => onNavigate('billing')} 
              className={`px-2.5 py-1.5 rounded hover:text-white hover:bg-slate-700/60 transition ${currentPage === 'billing' ? 'bg-teal-700 text-white' : ''}`}
            >
              Billing
            </button>
            <button 
              onClick={() => onNavigate('inpatient')} 
              className={`px-2.5 py-1.5 rounded hover:text-white hover:bg-slate-700/60 transition ${currentPage === 'inpatient' ? 'bg-teal-700 text-white' : ''}`}
            >
              Wards & Beds
            </button>
            <button 
              onClick={() => onNavigate('ai-assistant')} 
              className={`px-2.5 py-1.5 rounded flex items-center space-x-1 text-cyan-300 hover:text-cyan-200 hover:bg-slate-700/60 transition ${currentPage === 'ai-assistant' ? 'bg-cyan-800 text-white' : ''}`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Assistant</span>
            </button>
          </nav>
        </div>

        {/* Center: Search Bar with radio options matching LunivaCare UI */}
        <form onSubmit={handleSearchSubmit} className="hidden lg:flex items-center space-x-2 bg-slate-900/60 px-2 py-1 rounded border border-slate-700">
          <div className="flex items-center space-x-2 text-[11px] text-slate-300">
            <label className="flex items-center cursor-pointer">
              <input 
                type="radio" 
                name="searchFilter" 
                checked={searchFilter === 'pat_no'} 
                onChange={() => setSearchFilter('pat_no')} 
                className="mr-1 accent-teal-500" 
              />
              Pat No
            </label>
            <label className="flex items-center cursor-pointer">
              <input 
                type="radio" 
                name="searchFilter" 
                checked={searchFilter === 'pat_name'} 
                onChange={() => setSearchFilter('pat_name')} 
                className="mr-1 accent-teal-500" 
              />
              Pat Name
            </label>
            <label className="flex items-center cursor-pointer">
              <input 
                type="radio" 
                name="searchFilter" 
                checked={searchFilter === 'mobile'} 
                onChange={() => setSearchFilter('mobile')} 
                className="mr-1 accent-teal-500" 
              />
              Mobile
            </label>
          </div>

          <div className="flex items-center">
            <input 
              type="text" 
              placeholder="Search for..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-800 text-white text-xs px-2 py-1 rounded-l border border-slate-600 focus:outline-none focus:border-teal-400 w-36 lg:w-48"
            />
            <button 
              type="submit" 
              className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold px-2.5 py-1 rounded-r border border-teal-600"
            >
              Go!
            </button>
          </div>
        </form>

        {/* Right: Role Switcher & User Profile */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <button 
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center space-x-2 bg-slate-700/80 hover:bg-slate-700 px-2.5 py-1.5 rounded border border-slate-600 transition"
              title="Click to switch role for demo/testing"
            >
              <Shield className="w-3.5 h-3.5 text-teal-400" />
              <div className="text-left text-xs">
                <span className="text-[10px] text-teal-300 block leading-tight uppercase font-mono">Demo Role</span>
                <span className="font-semibold text-white">{user?.role?.replace('_', ' ') || 'DOCTOR'}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-1 w-56 bg-slate-900 border border-slate-700 rounded shadow-xl py-1 z-50">
                <div className="px-3 py-1.5 border-b border-slate-800 text-[11px] text-slate-400 uppercase font-semibold">
                  Switch Active Role (Instant Demo)
                </div>
                {DEMO_ROLES.map((r) => (
                  <button
                    key={r.role}
                    onClick={() => handleRoleSelect(r.role)}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-800 transition ${user?.role === r.role ? 'text-teal-400 font-bold bg-slate-800/60' : 'text-slate-300'}`}
                  >
                    <span>{r.label}</span>
                    <span className="text-[10px] text-slate-500">{r.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 pl-2 border-l border-slate-700">
            <div className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-xs">
              {user?.name ? user.name[0] : 'U'}
            </div>
            <div className="hidden sm:block text-left text-xs leading-tight">
              <span className="font-medium text-slate-200 block truncate max-w-[120px]">{user?.name || 'Dr. Sagun Adhikari'}</span>
              <span className="text-[10px] text-slate-400">{user?.role || 'Staff'}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

