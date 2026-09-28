import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { projectService } from '../../services/projectService';
import { materialService } from '../../services/materialService';
import { requestService } from '../../services/requestService';
import { HardHat, Boxes, FileQuestion, MapPin } from 'lucide-react';

export function EngineerDashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        const [projData, matData, reqData] = await Promise.all([
          projectService.getAllProjects(),
          materialService.getAllMaterials(),
          requestService.getAllRequests(),
        ]);
        setProjects(projData || []);
        setMaterials(matData || []);
        setRequests(reqData || []);
      } catch (err) {
        console.error('Failed to load engineer dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6 text-[#f0f6fc]">
      <div>
        <h1 className="text-xl font-black text-white tracking-tight uppercase">Site Engineering Dashboard</h1>
        <p className="text-xs text-slate-400">Field operations overview, structural requisition status, and delivery schedules.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#161b22] p-5 rounded-2xl border border-[#30363d] shadow-md flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Assigned Sites</p>
            <p className="text-2xl font-black text-white mt-1">{projects.length}</p>
            <p className="text-xs text-[#b4e600] mt-1 font-semibold">Active Field Management</p>
          </div>
          <div className="p-3 bg-[#b4e600]/10 text-[#b4e600] border border-[#b4e600]/30 rounded-xl">
            <HardHat className="w-6 h-6 stroke-[2.5]" />
          </div>
        </div>

        <div className="bg-[#161b22] p-5 rounded-2xl border border-[#30363d] shadow-md flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Materials Logged</p>
            <p className="text-2xl font-black text-white mt-1">{materials.length}</p>
            <p className="text-xs text-slate-400 mt-1">Consignments ordered</p>
          </div>
          <div className="p-3 bg-sky-500/10 text-sky-400 border border-sky-500/30 rounded-xl">
            <Boxes className="w-6 h-6 stroke-[2.5]" />
          </div>
        </div>

        <div className="bg-[#161b22] p-5 rounded-2xl border border-[#30363d] shadow-md flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Requisitions Submitted</p>
            <p className="text-2xl font-black text-white mt-1">{requests.length}</p>
            <p className="text-xs text-slate-400 mt-1">Site inspections & payouts</p>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-xl">
            <FileQuestion className="w-6 h-6 stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* Assigned Site Overview */}
      <div className="bg-[#161b22] rounded-2xl border border-[#30363d] shadow-md p-5">
        <h2 className="text-sm font-black text-white uppercase tracking-wider mb-4">Site Construction Logs</h2>
        {isLoading ? (
          <p className="text-xs text-slate-500 py-6 text-center">Loading site assignments...</p>
        ) : projects.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">No active building assignments.</p>
        ) : (
          <div className="space-y-3">
            {projects.map((p) => (
              <div key={p.id} className="p-4 rounded-xl border border-[#30363d] bg-[#0d1117] flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wide">{p.name}</h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{p.location}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-[#b4e600]">{p.progress}% Completed</span>
                  <div className="w-32 bg-[#161b22] border border-[#30363d] rounded-full h-2 mt-1.5 overflow-hidden">
                    <div className="bg-[#b4e600] h-2 rounded-full transition-all" style={{ width: `${p.progress}%` }} />
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

export default EngineerDashboard;
