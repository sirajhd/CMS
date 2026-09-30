import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Search, 
  Plus, 
  RefreshCw, 
  CheckCircle2, 
  ShieldAlert, 
  XCircle, 
  Edit2, 
  Users, 
  FolderKanban, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Layers
} from 'lucide-react';
import { superAdminService } from '../../services/superAdminService';
import { CreateCompanyModal } from './components/CreateCompanyModal';
import { EditCompanyModal } from './components/EditCompanyModal';

export function SuperAdminCompanies() {
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);

  const fetchCompanies = async () => {
    setIsLoading(true);
    try {
      const data = await superAdminService.getCompanies();
      setCompanies(data || []);
    } catch (err) {
      console.error('Failed to load companies:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleToggleStatus = async (company) => {
    const nextStatus = company.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (!window.confirm(`Are you sure you want to change ${company.name} status to ${nextStatus}?`)) return;

    try {
      await superAdminService.updateCompanyStatus(company.id, nextStatus);
      await fetchCompanies();
    } catch (err) {
      alert(err.message || 'Failed to update company status');
    }
  };

  const filtered = companies.filter((c) => {
    const matchesSearch = c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.address?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#b4e600]" />
            Tenant Organizations Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Provision, monitor, and configure isolated workspace tenants across the SaaS platform.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchCompanies}
            title="Refresh List"
            className="p-2.5 rounded-xl bg-[#161b22] border border-[#30363d] text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#b4e600]' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2.5 bg-[#b4e600] hover:bg-[#cbf800] text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg hover:shadow-[#b4e600]/20 cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Provision Tenant</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by company name, code, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl bg-[#0d1117] border border-[#30363d] text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#b4e600]"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-[#0d1117] border border-[#30363d] text-white focus:outline-none focus:ring-1 focus:ring-[#b4e600] w-full sm:w-auto"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Workspaces</option>
            <option value="SUSPENDED">Suspended Workspaces</option>
            <option value="DEACTIVATED">Deactivated Workspaces</option>
          </select>
        </div>
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 bg-[#161b22] border border-[#30363d] rounded-2xl font-mono text-xs">
            No company workspaces match the specified criteria.
          </div>
        ) : (
          filtered.map((c) => (
            <div
              key={c.id}
              className="bg-[#161b22] border border-[#30363d] hover:border-slate-600 transition-all rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4 relative overflow-hidden group"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0d1117] border border-[#30363d] flex items-center justify-center font-black text-sm text-[#b4e600] shadow-sm">
                    {c.code ? c.code.slice(0, 3) : c.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-bold text-white text-sm group-hover:text-[#b4e600] transition-colors">
                      {c.name}
                    </h2>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ID: {c.code || `#${c.id}`} • Plan: {c.plan || 'PRO'}
                    </span>
                  </div>
                </div>

                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  c.status === 'ACTIVE'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                    : c.status === 'SUSPENDED'
                    ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                    : 'bg-red-500/10 border border-red-500/30 text-red-400'
                }`}>
                  {c.status}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-1.5 text-xs text-slate-300 border-y border-[#30363d]/60 py-3">
                {c.email && (
                  <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                    <Mail className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    <span className="truncate">{c.email}</span>
                  </div>
                )}
                {c.phone && (
                  <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                    <Phone className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    <span>{c.phone}</span>
                  </div>
                )}
                {c.address && (
                  <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    <span className="truncate">{c.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-500 text-[10px] font-mono pt-1">
                  <Calendar className="w-3 h-3 flex-shrink-0" />
                  <span>Created {new Date(c.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Metrics Pills */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-[#0d1117] border border-[#30363d] flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  <div>
                    <p className="text-[10px] uppercase font-mono text-slate-500">Users</p>
                    <p className="text-xs font-bold text-white font-mono">{c._count?.users ?? 0}</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#0d1117] border border-[#30363d] flex items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-[#b4e600]" />
                  <div>
                    <p className="text-[10px] uppercase font-mono text-slate-500">Sites</p>
                    <p className="text-xs font-bold text-white font-mono">{c._count?.projects ?? 0}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-between gap-2 border-t border-[#30363d]/40">
                <button
                  type="button"
                  onClick={() => setEditingCompany(c)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white bg-[#0d1117] border border-[#30363d] hover:border-slate-500 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Configure</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleStatus(c)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer border ${
                    c.status === 'ACTIVE'
                      ? 'text-amber-400 border-amber-500/30 hover:bg-amber-500/10'
                      : 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10'
                  }`}
                >
                  {c.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Provision Company Modal */}
      <CreateCompanyModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCompanyCreated={() => fetchCompanies()}
      />

      {/* Edit Company Modal */}
      <EditCompanyModal
        isOpen={Boolean(editingCompany)}
        company={editingCompany}
        onClose={() => setEditingCompany(null)}
        onCompanyUpdated={() => fetchCompanies()}
      />
    </div>
  );
}

export default SuperAdminCompanies;
