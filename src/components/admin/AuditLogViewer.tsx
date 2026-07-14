import React, { useState } from 'react';
import { Search, ShieldAlert, Clipboard } from 'lucide-react';
import { useAppState } from '../../contexts/AppStateContext';

export default function AuditLogViewer() {
  const { state } = useAppState();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = state.auditLogs.filter(log => 
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.userType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* FILTER SEARCH */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-3xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search logs by action, details, or user role..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="text-xs w-full p-2.5 pl-10 border border-slate-200 rounded-xl focus:outline-none focus:border-navy bg-slate-50/50"
          />
        </div>
        <span className="text-[10px] bg-red/10 text-red border border-red/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider font-mono">
          System Logging Level: INFO
        </span>
      </div>

      {/* AUDIT LOG TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 font-bold uppercase tracking-wider text-slate-500 font-mono">
              <th className="p-4 pl-6">Timestamp</th>
              <th className="p-4">User Type</th>
              <th className="p-4">Action Event</th>
              <th className="p-4 pr-6">Event Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
            {filteredLogs.map(log => (
              <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 pl-6 text-slate-400 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded-sm font-bold text-[9px] uppercase ${
                    log.userType === 'Administrator' || log.userType === 'Super Administrator' ? 'bg-red/10 text-red' :
                    log.userType === 'Contractor' ? 'bg-navy/10 text-navy' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {log.userType}
                  </span>
                </td>
                <td className="p-4 font-bold text-slate-700 whitespace-nowrap">
                  {log.action}
                </td>
                <td className="p-4 pr-6 text-slate-500 max-w-md leading-relaxed">
                  {log.details}
                </td>
              </tr>
            ))}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-400">
                  No security log entries match your search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
