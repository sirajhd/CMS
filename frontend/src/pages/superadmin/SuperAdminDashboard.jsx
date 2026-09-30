import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  FolderKanban, 
  CreditCard, 
  ShieldCheck, 
  ShieldAlert, 
  Activity, 
  Plus, 
  RefreshCw, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ExternalLink,
  Edit2,
  TrendingUp,
  Server
} from 'lucide-react';
import { superAdminService } from '../../services/superAdminService';
import { CreateCompanyModal } from './components/CreateCompanyModal';
import { EditCompanyModal } from './components/EditCompanyModal';

export function SuperAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsData, companiesData, logsData] = await Promise.all([
        superAdminService.getPlatformStats(),
        superAdminService.getCompanies(),
        superAdminService.getAuditLogs({ limit: 10 }),
      ]);
      setStats(statsData);
      setCompanies(companiesData || []);
      setAuditLogs(logsData || []);
    } catch (err) {
      console.error('Failed to load SuperAdmin dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleToggleStatus = async (company) => {
    const nextStatus = company.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const confirmMsg = `Are you sure you want to change ${company.name} status to ${nextStatus}? ${
      nextStatus === 'SUSPENDED' ? 'All users of this company will be blocked from accessing the system.' : ''
    }`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await superAdminService.updateCompanyStatus(company.id, nextStatus);
      await fetchDashboardData();
    } catch (err) {
      alert(err.message || 'Failed to update company status');
    }
  };

  const filteredCompanies = companies.filter((c) => {
    const matchesSearch = c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#161b22] via-[#1a2332] to-[#161b22] border border-[#30363d] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#b4e600]/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 bg-[#b4e600]/10 border border-[#b4e600]/30 text-[#b4e600] rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5" />
              SaaS Multi-Tenant Infrastructure
            </span>
            <span className="text-xs text-slate-400 font-mono">Platform Super Admin</span>
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider">
            Platform Master Console
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Monitor all isolated tenant workspaces, construction companies, active site users, and platform audit records.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            type="button"
            onClick={fetchDashboardData}
            title="Refresh Data"
            className="p-2.5 rounded-xl bg-[#0d1117] border border-[#30363d] text-slate-300 hover:text-white hover:border-slate-500 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#b4e600]' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2.5 bg-[#b4e600] hover:bg-[#cbf800] text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg hover:shadow-[#b4e600]/20 cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Provision Company</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Companies */}
        <div className="p-5 rounded-2xl bg-[#161b22] border border-[#30363d] flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Companies
            </p>
            <h3 className="text-2xl font-black text-white mt-1">
              {isLoading ? '...' : stats?.totalCompanies ?? 0}
            </h3>
            <div className="flex items-center gap-2 mt-2 text-[10px] font-mono">
              <span className="text-emerald-400 flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-3 h-3" /> {stats?.activeCompanies ?? 0} Active
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-amber-400 flex items-center gap-1 font-bold">
                <ShieldAlert className="w-3 h-3" /> {stats?.suspendedCompanies ?? 0} Suspended
              </span>
            </div>
          </div>
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* Total Platform Users */}
        <div className="p-5 rounded-2xl bg-[#161b22] border border-[#30363d] flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Registered Users
            </p>
            <h3 className="text-2xl font-black text-white mt-1">
              {isLoading ? '...' : stats?.totalUsers ?? 0}
            </h3>
            <p className="text-[10px] text-slate-400 mt-2 font-mono">
              Across all isolated tenants
            </p>
          </div>
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Total Projects / Construction Sites */}
        <div className="p-5 rounded-2xl bg-[#161b22] border border-[#30363d] flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Active Sites & Projects
            </p>
            <h3 className="text-2xl font-black text-white mt-1">
              {isLoading ? '...' : stats?.totalProjects ?? 0}
            </h3>
            <p className="text-[10px] text-[#b4e600] mt-2 font-mono flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> {stats?.totalRequisitions ?? 0} Requisitions
            </p>
          </div>
          <div className="p-3 bg-[#b4e600]/10 border border-[#b4e600]/20 text-[#b4e600] rounded-xl">
            <FolderKanban className="w-6 h-6" />
          </div>
        </div>

        {/* Total Disbursed Spend ETB */}
        <div className="p-5 rounded-2xl bg-[#161b22] border border-[#30363d] flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Platform Disbursed Funds
            </p>
            <h3 className="text-2xl font-black text-white mt-1">
              {isLoading ? '...' : `ETB ${(Number(stats?.totalDisbursed || 0)).toLocaleString()}`}
            </h3>
            <p className="text-[10px] text-emerald-400 mt-2 font-mono">
              Verified Manager Disbursements
            </p>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Tenant Workspaces Table Section */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#30363d]">
          <div>
            <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#b4e600]" />
              Registered Construction Companies
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage multi-tenant subscriptions, view company resources, or toggle account access
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search company or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs rounded-xl bg-[#0d1117] border border-[#30363d] text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#b4e600]"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl bg-[#0d1117] border border-[#30363d] text-white focus:outline-none focus:ring-1 focus:ring-[#b4e600]"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="SUSPENDED">Suspended Only</option>
              <option value="DEACTIVATED">Deactivated Only</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#30363d] text-slate-400 font-mono uppercase tracking-wider">
                <th className="pb-3 px-3">Company Name / Code</th>
                <th className="pb-3 px-3">Contact & Location</th>
                <th className="pb-3 px-3">Plan</th>
                <th className="pb-3 px-3">Users</th>
                <th className="pb-3 px-3">Sites</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363d]/60">
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500 font-mono">
                    No construction companies match the criteria.
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((c) => (
                  <tr key={c.id} className="hover:bg-[#0d1117]/50 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#0d1117] border border-[#30363d] flex items-center justify-center font-black text-xs text-[#b4e600] shadow-sm">
                          {c.code ? c.code.slice(0, 3) : c.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-white">{c.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">CODE: {c.code || 'N/A'}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-slate-300">
                      <p>{c.email || 'No email'}</p>
                      <p className="text-[10px] text-slate-400">{c.phone || c.address || '—'}</p>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 border border-blue-500/30 text-blue-400">
                        {c.plan || 'PRO'}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 font-mono font-bold text-white">
                      {c._count?.users ?? 0}
                    </td>

                    <td className="py-3.5 px-3 font-mono font-bold text-white">
                      {c._count?.projects ?? 0}
                    </td>

                    <td className="py-3.5 px-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        c.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                          : c.status === 'SUSPENDED'
                          ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                          : 'bg-red-500/10 border border-red-500/30 text-red-400'
                      }`}>
                        {c.status === 'ACTIVE' && <CheckCircle2 className="w-3 h-3" />}
                        {c.status === 'SUSPENDED' && <ShieldAlert className="w-3 h-3" />}
                        {c.status === 'DEACTIVATED' && <XCircle className="w-3 h-3" />}
                        {c.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingCompany(c)}
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#0d1117] transition-colors cursor-pointer"
                          title="Edit Company Details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(c)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer border ${
                            c.status === 'ACTIVE'
                              ? 'text-amber-400 border-amber-500/30 hover:bg-amber-500/10'
                              : 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10'
                          }`}
                        >
                          {c.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Platform Security & Audit Trail */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#30363d]">
          <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#b4e600]" />
            Recent Platform Security & Audit Logs
          </h2>
          <span className="text-[10px] text-slate-500 font-mono">Immutable Compliance Trail</span>
        </div>

        <div className="space-y-2.5">
          {auditLogs.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center font-mono">No recent platform audit events.</p>
          ) : (
            auditLogs.slice(0, 8).map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-[#0d1117] border border-[#30363d] flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-[#161b22] border border-[#30363d] text-[#b4e600]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-bold text-white">
                      <span className="text-[#b4e600] font-mono">{log.action}</span>
                      {log.company?.name && <span className="text-slate-400 font-normal"> on {log.company.name}</span>}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      By {log.user?.name || 'Platform System'} ({log.user?.role || 'SuperAdmin'}) • {log.details ? JSON.stringify(log.details) : log.entity}
                    </p>
                  </div>
                </div>
                <div className="text-right text-[10px] text-slate-500 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Provision Company Modal */}
      <CreateCompanyModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCompanyCreated={() => fetchDashboardData()}
      />

      {/* Edit Company Modal */}
      <EditCompanyModal
        isOpen={Boolean(editingCompany)}
        company={editingCompany}
        onClose={() => setEditingCompany(null)}
        onCompanyUpdated={() => fetchDashboardData()}
      />
    </div>
  );
}

export default SuperAdminDashboard;
