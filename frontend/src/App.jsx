import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import OPDManagement from './pages/OPDManagement';
import PatientRegistration from './pages/PatientRegistration';
import PatientOverview from './pages/PatientOverview';
import Pharmacy from './pages/Pharmacy';
import Laboratory from './pages/Laboratory';
import Billing from './pages/Billing';
import InpatientAdmissions from './pages/InpatientAdmissions';
import AIAssistant from './pages/AIAssistant';
import AuditLogs from './pages/AuditLogs';

export default function App() {
  const [currentPage, setCurrentPage] = useState('opd'); // Default to OPD queue matching Screenshot 3
  const [selectedPatientId, setSelectedPatientId] = useState('');

  const handleNavigate = (page, params = {}) => {
    if (params.patientId) {
      setSelectedPatientId(params.patientId);
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'opd':
      case 'appointments':
        return <OPDManagement onNavigate={handleNavigate} />;
      case 'registration':
        return <PatientRegistration onNavigate={handleNavigate} />;
      case 'patient-overview':
        return <PatientOverview selectedPatientId={selectedPatientId} onNavigate={handleNavigate} />;
      case 'pharmacy':
        return <Pharmacy onNavigate={handleNavigate} />;
      case 'laboratory':
        return <Laboratory onNavigate={handleNavigate} />;
      case 'billing':
        return <Billing onNavigate={handleNavigate} />;
      case 'inpatient':
        return <InpatientAdmissions onNavigate={handleNavigate} />;
      case 'ai-assistant':
        return <AIAssistant onNavigate={handleNavigate} />;
      case 'audit':
        return <AuditLogs onNavigate={handleNavigate} />;
      default:
        return <OPDManagement onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <Navbar onNavigate={handleNavigate} currentPage={currentPage} />
      <div className="flex flex-1">
        <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />
        <main className="flex-1 overflow-x-hidden">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

