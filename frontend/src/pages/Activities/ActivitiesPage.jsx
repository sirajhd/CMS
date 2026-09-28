import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Select } from '../../components/common/Select';
import { projectService } from '../../services/projectService';
import { activityService } from '../../services/activityService';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime } from '../../utils/formatters';
import { 
  Activity, 
  Building2, 
  Search, 
  Filter, 
  ExternalLink, 
  FileText, 
  CreditCard, 
  Truck, 
  Calendar,
  Layers,
  MapPin
} from 'lucide-react';

export function ActivitiesPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Load available projects for the user
  useEffect(() => {
    async function loadProjects() {
      if (!user) return;
      try {
        const userProjects = await projectService.getProjectsForUser(user);
        const validList = Array.isArray(userProjects) ? userProjects : [];
        setProjects(validList);

        // If the user only has 1 project assigned, default to that specific project
        if (validList.length === 1) {
          setSelectedProjectId(validList[0].id);
        }
      } catch (err) {
        console.error('Failed to load projects for activities page:', err);
      }
    }
    loadProjects();
  }, [user]);

  // Load activities when selected project changes
  useEffect(() => {
    async function loadActivities() {
      if (!user) return;
      setIsLoading(true);
      try {
        let data = [];
        if (selectedProjectId && selectedProjectId !== 'all') {
          data = await activityService.getActivitiesByProject(selectedProjectId);
        } else {
          data = await activityService.getAllActivities();
        }
        setActivities(data || []);
      } catch (err) {
        console.error('Failed to load activity stream:', err);
        setActivities([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadActivities();
  }, [user, selectedProjectId]);

  const selectedProjectObj = projects.find((p) => p.id === selectedProjectId);

  const filteredActivities = activities.filter((a) => {
    const actor = a.actor || '';
    const projectName = a.project_name || a.projectName || '';
    const action = a.action || '';
    const target = a.target || '';
    const category = a.category || '';

    const matchesSearch = 
      actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      target.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const getCategoryMeta = (cat) => {
    switch (cat) {
      case 'request':
        return {
          label: 'Request',
          dotBg: 'bg-amber-400',
          badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          icon: FileText,
        };
      case 'payment':
        return {
          label: 'Disbursement',
          dotBg: 'bg-emerald-400',
          badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          icon: CreditCard,
        };
      case 'material':
        return {
          label: 'Logistics',
          dotBg: 'bg-sky-400',
          badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
          icon: Truck,
        };
      case 'document':
        return {
          label: 'Document',
          dotBg: 'bg-purple-400',
          badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
          icon: FileText,
        };
      case 'site_milestone':
      default:
        return {
          label: 'Milestone',
          dotBg: 'bg-[#b4e600]',
          badgeClass: 'bg-[#b4e600]/10 text-[#b4e600] border-[#b4e600]/30',
          icon: Building2,
        };
    }
  };

  return (
    <div className="space-y-6 text-[#f0f6fc]">
      {/* Header with Site Selector & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#161b22] p-5 rounded-2xl border border-[#30363d] shadow-sm">
        <div>
          <span className="text-[10px] font-mono text-[#b4e600] uppercase font-black tracking-widest block mb-0.5">
            Operational Audit Trail
          </span>
          <h1 className="text-xl font-black text-white tracking-tight uppercase">Site Activity Ledger</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Chronological log of approvals, disbursements, materials, blueprints & site milestones.
          </p>
        </div>

        {/* Site Filter Dropdown */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="min-w-64">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Select Specific Site
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-white focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600] transition-all font-semibold"
            >
              {(user?.role === 'Admin' || projects.length > 1) && (
                <option value="all">⚡ All Authorized Sites ({projects.length})</option>
              )}
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  🏗️ {proj.name} — {proj.location}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:w-60">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Search Events
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by actor, action..."
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600] transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Selected Site Information Card (if specific site is selected) */}
      {selectedProjectObj && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#b4e600]/10 text-[#b4e600] border border-[#b4e600]/30 font-black">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-white text-sm uppercase">{selectedProjectObj.name}</span>
                <span className="px-2 py-0.5 rounded-md bg-[#0d1117] text-[10px] font-mono text-[#b4e600] border border-[#30363d]">
                  {selectedProjectObj.status}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-[11px] mt-0.5">
                <MapPin className="w-3 h-3 text-slate-500" />
                <span>{selectedProjectObj.location}</span>
                <span>•</span>
                <span>Audit events: <strong className="text-white">{activities.length}</strong></span>
              </div>
            </div>
          </div>

          <Link
            to={`/projects/${selectedProjectObj.id}`}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0d1117] hover:bg-[#b4e600] text-slate-300 hover:text-black font-bold uppercase tracking-wider text-[11px] border border-[#30363d] hover:border-[#b4e600] transition-all"
          >
            <span>Open Full Site Dossier & Archive</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Category Filter Badges */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'all', label: 'All Activities' },
          { id: 'request', label: 'Requests' },
          { id: 'payment', label: 'Disbursements' },
          { id: 'material', label: 'Logistics' },
          { id: 'document', label: 'Documents' },
          { id: 'site_milestone', label: 'Milestones' },
        ].map((tab) => {
          const count = tab.id === 'all'
            ? activities.length
            : activities.filter((a) => a.category === tab.id).length;
          const isActive = categoryFilter === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCategoryFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-bold uppercase tracking-wider text-xs whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#b4e600] text-black font-black shadow-md'
                  : 'bg-[#161b22] text-slate-400 hover:text-white border border-[#30363d]'
              }`}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Timeline Stream */}
      <Card 
        title={`Recorded Events (${filteredActivities.length})`} 
        subtitle={
          selectedProjectObj 
            ? `Chronological audit trail for ${selectedProjectObj.name}` 
            : 'Cross-site construction audit ledger'
        }
      >
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 font-mono text-xs uppercase tracking-wider animate-pulse">
            Loading site audit trail events...
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="py-12 text-center space-y-3 bg-[#0d1117] rounded-xl border border-dashed border-[#30363d]">
            <div className="w-12 h-12 rounded-xl bg-[#161b22] border border-[#30363d] flex items-center justify-center mx-auto text-slate-400">
              <Activity className="w-6 h-6 text-[#b4e600]" />
            </div>
            <div>
              <p className="text-sm font-bold text-white uppercase tracking-wider">No Activity Logged</p>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                {selectedProjectObj 
                  ? `No matching actions found for ${selectedProjectObj.name}. Submitting requests or uploading blueprints will populate this feed.`
                  : 'No construction site actions match your query.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#30363d]">
            {filteredActivities.map((act) => {
              const meta = getCategoryMeta(act.category);
              const CatIcon = meta.icon;
              const pName = act.project_name || act.projectName;
              const pId = act.project_id || act.projectId;

              return (
                <div key={act.id} className="relative group text-xs">
                  {/* Timeline Dot */}
                  <div
                    className={`absolute -left-6 top-3 w-3 h-3 rounded-full ${meta.dotBg} ring-4 ring-[#161b22]`}
                  />

                  <div className="p-4 bg-[#0d1117] rounded-xl border border-[#30363d] group-hover:border-[#b4e600]/40 transition-colors space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-white">{act.actor}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#161b22] border border-[#30363d] text-slate-300">
                          {act.role}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1 ${meta.badgeClass}`}
                        >
                          <CatIcon className="w-3 h-3" />
                          {meta.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatDateTime(act.timestamp)}
                      </span>
                    </div>

                    <div>
                      <p className="text-[#b4e600] font-bold text-xs">{act.action}</p>
                      <p className="text-slate-300 text-xs mt-0.5 leading-relaxed">{act.target}</p>
                    </div>

                    {pName && (
                      <div className="pt-2 border-t border-[#30363d]/60 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Building2 className="w-3.5 h-3.5 text-slate-500" />
                          <span>Site: <strong className="text-white">{pName}</strong></span>
                        </div>
                        {pId && (
                          <Link
                            to={`/projects/${pId}`}
                            className="text-[#b4e600] hover:underline font-mono text-[10px] flex items-center gap-1"
                          >
                            View Site Dossier &rarr;
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

export default ActivitiesPage;
