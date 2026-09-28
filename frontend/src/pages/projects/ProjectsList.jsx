import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../../components/layout/AppLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { projectService } from '../../services/projectService';
import { Building2, MapPin, Calendar, ArrowUpRight, Search, Plus } from 'lucide-react';

export function ProjectsList() {
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const data = await projectService.getAllProjects();
      setProjects(data);
    }
    load();
    const unsub = projectService.subscribe(setProjects);
    return () => unsub();
  }, []);

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.houseHolderName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#30363d]">
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-wider">Construction Sites Directory</h1>
            <p className="text-xs text-slate-400 mt-1 font-mono uppercase">
              Portfolio of all active engineering projects and residential sites
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search site, location, client..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-white placeholder-slate-500 focus:outline-none focus:border-[#b4e600] transition-colors font-mono"
            />
          </div>
        </div>

        {/* Project Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((proj) => (
            <div
              key={proj.id}
              onClick={() => navigate(`/projects/${proj.id}`)}
              className="bg-[#161b22] rounded-2xl border border-[#30363d] p-5 hover:border-[#b4e600]/60 transition-all cursor-pointer flex flex-col justify-between group shadow-xl"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-mono font-bold text-[#b4e600] bg-[#b4e600]/10 border border-[#b4e600]/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {proj.id}
                  </span>
                  <StatusBadge status={proj.status} />
                </div>

                <div>
                  <h3 className="font-black text-white text-lg tracking-wide group-hover:text-[#b4e600] transition-colors">
                    {proj.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1 font-mono">
                    <MapPin className="w-3.5 h-3.5 text-[#b4e600] flex-shrink-0" />
                    <span>{proj.location}</span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-400 uppercase text-[10px] tracking-wider">Site Execution:</span>
                    <span className="font-bold text-[#b4e600]">{proj.progress}%</span>
                  </div>
                  <div className="w-full bg-[#0d1117] rounded-full h-2 overflow-hidden border border-[#30363d]">
                    <div className="bg-[#b4e600] h-2 rounded-full transition-all duration-500" style={{ width: `${proj.progress}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-[#30363d]/60 font-mono">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase tracking-wider block">Owner:</span>
                    <span className="font-bold text-white truncate block mt-0.5">{proj.houseHolderName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase tracking-wider block">Budget:</span>
                    <span className="font-bold text-[#b4e600] block mt-0.5">{formatCurrency(proj.totalBudget)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-[#30363d]/60 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 text-[11px]">{formatDate(proj.expectedCompletion)}</span>
                <span className="font-bold text-[#b4e600] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform uppercase tracking-wider text-[11px]">
                  Inspect Site <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </AppLayout>
  );
}

export default ProjectsList;
