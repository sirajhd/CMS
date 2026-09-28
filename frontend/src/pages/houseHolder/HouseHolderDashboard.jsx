import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { projectService } from '../../services/projectService';
import { requestService } from '../../services/requestService';
import { Building2, CreditCard, Clock, CheckCircle2, MapPin } from 'lucide-react';

export function HouseHolderDashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        const [projData, reqData] = await Promise.all([
          projectService.getAllProjects(),
          requestService.getAllRequests(),
        ]);
        setProjects(projData || []);
        setRequests(reqData || []);
      } catch (err) {
        console.error('Failed to load owner dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const totalCommitted = projects.reduce((acc, curr) => acc + (curr.totalBudget || 0), 0);
  const totalSpent = projects.reduce((acc, curr) => acc + (curr.spentBudget || 0), 0);
  const pendingApprovals = requests.filter((r) => r.status === 'Submitted' || r.status === 'Under Review');

  return (
    <div className="space-y-6 text-[#f0f6fc]">
      <div>
        <h1 className="text-xl font-black text-white tracking-tight uppercase">Property Owner Dashboard</h1>
        <p className="text-xs text-slate-400">Monitor site milestones, approve engineer requisitions, and track capital disbursement.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#161b22] p-5 rounded-2xl border border-[#30363d] shadow-md flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">My Properties</p>
            <p className="text-2xl font-black text-white mt-1">{projects.length}</p>
            <p className="text-xs text-[#b4e600] mt-1 font-semibold">Active Construction</p>
          </div>
          <div className="p-3 bg-[#b4e600]/10 text-[#b4e600] border border-[#b4e600]/30 rounded-xl">
            <Building2 className="w-6 h-6 stroke-[2.5]" />
          </div>
        </div>

        <div className="bg-[#161b22] p-5 rounded-2xl border border-[#30363d] shadow-md flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Disbursed Funds</p>
            <p className="text-2xl font-black text-white mt-1">{totalSpent.toLocaleString()} ETB</p>
            <p className="text-xs text-slate-400 mt-1">Of {totalCommitted.toLocaleString()} ETB Budget</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl">
            <CreditCard className="w-6 h-6 stroke-[2.5]" />
          </div>
        </div>

        <div className="bg-[#161b22] p-5 rounded-2xl border border-[#30363d] shadow-md flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Action Required</p>
            <p className="text-2xl font-black text-white mt-1">{pendingApprovals.length}</p>
            <p className="text-xs text-amber-400 mt-1 font-semibold">Awaiting milestone sign-off</p>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-xl">
            <Clock className="w-6 h-6 stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div className="bg-[#161b22] rounded-2xl border border-[#30363d] shadow-md overflow-hidden p-5">
        <h2 className="text-sm font-black text-white uppercase tracking-wider mb-4">My Construction Sites</h2>
        {isLoading ? (
          <p className="text-xs text-slate-500 py-6 text-center">Loading site details from PostgreSQL...</p>
        ) : projects.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">No assigned properties found.</p>
        ) : (
          <div className="divide-y divide-[#30363d]/60">
            {projects.map((p) => (
              <div key={p.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wide">{p.name}</h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{p.location}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Lead Site Engineer: <span className="font-semibold text-slate-200">{p.engineerName || 'Assigned Engineer'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-[11px] text-slate-400">Budget Spent</div>
                    <div className="text-xs font-bold text-white">
                      {p.spentBudget?.toLocaleString()} / {p.totalBudget?.toLocaleString()} ETB
                    </div>
                  </div>
                  <div className="w-28">
                    <div className="text-[11px] font-bold text-[#b4e600] text-right mb-1">{p.progress}%</div>
                    <div className="w-full bg-[#0d1117] border border-[#30363d] rounded-full h-2 overflow-hidden">
                      <div className="bg-[#b4e600] h-2 rounded-full transition-all" style={{ width: `${p.progress}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default HouseHolderDashboard;
