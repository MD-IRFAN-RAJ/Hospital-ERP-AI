import React, { useState, useEffect } from 'react';
import { History, Shield, RefreshCw } from 'lucide-react';
import api from '../services/api';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/audit/logs');
      if (res.data?.success) {
        setLogs(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="p-4 bg-slate-100 min-h-screen text-slate-800 space-y-4">
      <div className="bg-white p-3.5 rounded border border-slate-300 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800">System Audit Trail & Traceability (SRS NFR-008)</h2>
          <p className="text-xs text-slate-500">Immutable ledger of patient registrations, dispensing actions, billing settlements, and AI queries</p>
        </div>
        <button 
          onClick={fetchLogs}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded flex items-center space-x-1"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-white rounded border border-slate-300 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
            <tr>
              <th className="p-2.5">Timestamp</th>
              <th className="p-2.5">User</th>
              <th className="p-2.5">Action</th>
              <th className="p-2.5">Entity Type</th>
              <th className="p-2.5">Entity ID</th>
              <th className="p-2.5">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="p-2.5 text-slate-500">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="p-2.5 font-sans font-medium text-slate-800">
                  {log.user?.name || 'System / Auto'}
                </td>
                <td className="p-2.5">
                  <span className="bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-bold text-[10px]">
                    {log.action}
                  </span>
                </td>
                <td className="p-2.5 text-slate-600">{log.entityType}</td>
                <td className="p-2.5 text-slate-500">{log.entityId ? `${log.entityId.slice(0, 8)}...` : '-'}</td>
                <td className="p-2.5 text-slate-600 font-sans truncate max-w-xs">{log.details || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

