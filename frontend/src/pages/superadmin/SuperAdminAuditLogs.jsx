import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Search, 
  RefreshCw, 
  Building2, 
  Clock, 
  Filter, 
  Activity, 
  FileText 
} from 'lucide-react';
import { superAdminService } from '../../services/superAdminService';

export function SuperAdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchAuditData = async () => {
    setIsLoading(true);
    try {
      const [logsData, companiesData] = await Promise.all([
        superAdminService.getAuditLogs({ companyId: selectedCompanyId || undefined, limit: 150 }),
        superAdminService.getCompanies(),
      ]);
      setLogs(logsData || []);
      setCompanies(companiesData || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, [selectedCompanyId]);

  const filtered = logs.filter((log) => {
    const text = `${log.action} ${log.entity} ${log.user?.name} ${log.company?.name}`.toLowerCase();
    return text.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#b4e600]" />
            Platform Security & Audit Trail
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable log of all tenant operations, authentication events, requisitions, disbursements, and workspace updates.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchAuditData}
          title="Refresh Logs"
          className="p-2.5 rounded-xl bg-[#161b22] border border-[#30363d] text-slate-300 hover:text-white transition-colors cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#b4e600]' : ''}`} />
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search action, actor, or entity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl bg-[#0d1117] border border-[#30363d] text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#b4e600]"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">Tenant Workspace:</span>
          <select
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-[#0d1117] border border-[#30363d] text-white focus:outline-none focus:ring-1 focus:ring-[#b4e600] w-full sm:w-auto"
          >
            <option value="">All Companies (Platform-Wide)</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code || `#${c.id}`})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-xl overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#30363d] text-slate-400 font-mono uppercase tracking-wider">
              <th className="pb-3 px-3">Timestamp</th>
              <th className="pb-3 px-3">Action</th>
              <th className="pb-3 px-3">Company Tenant</th>
              <th className="pb-3 px-3">Actor</th>
              <th className="pb-3 px-3">Entity & Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#30363d]/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-slate-500 font-mono">
                  No platform audit events found.
                </td>
              </tr>
            ) : (
              filtered.map((log) => (
                <tr 
                  key={log.id} 
                  className="hover:bg-[#0d1117]/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedLog(log)}
                >
                  <td className="py-3 px-3 text-slate-400 font-mono whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </td>

                  <td className="py-3 px-3 font-mono font-bold text-[#b4e600]">
                    {log.action}
                  </td>

                  <td className="py-3 px-3 text-slate-300">
                    {log.company?.name ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#0d1117] border border-[#30363d] text-slate-200">
                        <Building2 className="w-3 h-3 text-[#b4e600]" />
                        {log.company.name}
                      </span>
                    ) : (
                      <span className="text-slate-500 font-mono">Platform</span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-slate-300">
                    <p className="font-bold text-white">{log.user?.name || 'System'}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{log.user?.role || 'Service'}</p>
                  </td>

                  <td className="py-3 px-3 text-slate-400 max-w-xs truncate font-mono text-[11px]">
                    <span className="text-slate-200 uppercase">{log.entity}</span>
                    {log.entity_id && <span className="text-slate-500"> #{log.entity_id}</span>}
                    {log.details && (
                      <span className="ml-2 text-slate-500 text-[10px]">
                        {JSON.stringify(log.details)}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#30363d]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#b4e600]" />
                <h3 className="font-bold text-white text-sm uppercase">Audit Log Inspection</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#30363d]/40">
                <span className="text-slate-400 font-mono">Action:</span>
                <span className="text-[#b4e600] font-bold font-mono">{selectedLog.action}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#30363d]/40">
                <span className="text-slate-400 font-mono">Timestamp:</span>
                <span className="text-white font-mono">{new Date(selectedLog.created_at).toISOString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#30363d]/40">
                <span className="text-slate-400 font-mono">Actor:</span>
                <span className="text-white">{selectedLog.user?.name} ({selectedLog.user?.email} • {selectedLog.user?.role})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#30363d]/40">
                <span className="text-slate-400 font-mono">Company:</span>
                <span className="text-white">{selectedLog.company?.name || 'Platform Scope'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#30363d]/40">
                <span className="text-slate-400 font-mono">Entity:</span>
                <span className="text-white font-mono">{selectedLog.entity} #{selectedLog.entity_id || 'N/A'}</span>
              </div>
              <div className="pt-2">
                <span className="text-slate-400 font-mono block mb-1">Payload Details:</span>
                <pre className="p-3 rounded-xl bg-[#0d1117] border border-[#30363d] text-[#b4e600] font-mono text-[11px] overflow-x-auto max-h-48">
                  {JSON.stringify(selectedLog.details || {}, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SuperAdminAuditLogs;
