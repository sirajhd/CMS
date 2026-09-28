import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { projectService } from '../../services/projectService';
import { Button } from '../../components/common/Button';
import { AddProjectModal } from '../../components/projects/AddProjectModal';
import { EditProjectModal } from '../../components/projects/EditProjectModal';
import { DeleteProjectModal } from '../../components/projects/DeleteProjectModal';
import { 
  FolderKanban, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Search, 
  CheckCircle2, 
  ArrowRight, 
  Plus, 
  Edit3, 
  Trash2,
  Building2
} from 'lucide-react';

export function ProjectsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const isManager = user?.role === 'Manager';
  const canEdit = isAdmin || isManager;

  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deletingProject, setDeletingProject] = useState(null);

  useEffect(() => {
    async function fetchProjects() {
      try {
        setIsLoading(true);
        const data = await projectService.getAllProjects();
        setProjects(data || []);
      } catch (err) {
        console.error('Failed to load projects:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProjects();
  }, []);

  const handleProjectCreated = (newProject) => {
    setProjects((prev) => [newProject, ...prev]);
  };

  const handleProjectUpdated = (updatedProject) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === updatedProject.id ? updatedProject : p))
    );
  };

  const handleProjectDeleted = (deletedId) => {
    setProjects((prev) => prev.filter((p) => p.id !== deletedId));
  };

  const filtered = projects.filter((p) =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.houseHolderName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 text-[#f0f6fc]">
      {/* Header with Title, Actions, and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight uppercase">Projects Management</h1>
          <p className="text-xs text-slate-400">Comprehensive site registry, project timelines, and operational status.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search site, location, client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600] transition-all"
            />
          </div>

          {isAdmin && (
            <Button
              variant="primary"
              size="md"
              icon={Plus}
              onClick={() => setIsAddModalOpen(true)}
            >
              New Project
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-slate-500 text-xs">Loading projects list from PostgreSQL...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-slate-500 text-xs">No projects found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((p) => (
            <div 
              key={p.id} 
              className="bg-[#161b22] rounded-2xl border border-[#30363d] p-5 shadow-md hover:border-[#b4e600]/40 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="p-2.5 bg-[#b4e600]/10 text-[#b4e600] border border-[#b4e600]/30 rounded-xl">
                    <FolderKanban className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950/60 text-emerald-300 border border-emerald-500/40">
                      {p.status || 'Active'}
                    </span>
                    {canEdit && (
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingProject(p);
                          }}
                          className="p-1.5 rounded-lg bg-[#0d1117] text-slate-400 hover:text-[#b4e600] hover:bg-[#b4e600]/10 border border-[#30363d] transition-colors cursor-pointer"
                          title="Edit Project"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingProject(p);
                            }}
                            className="p-1.5 rounded-lg bg-[#0d1117] text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-[#30363d] transition-colors cursor-pointer"
                            title="Delete Project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <h3 className="text-sm font-black text-white uppercase tracking-wide group-hover:text-[#b4e600] transition-colors">
                  {p.name}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                  <span className="truncate">{p.location}</span>
                </div>

                <div className="mt-4 pt-3 border-t border-[#30363d]/60 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Owner:</span>
                    <span className="font-semibold text-slate-200 truncate ml-2">{p.houseHolderName || '—'}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Engineer:</span>
                    <span className="font-semibold text-slate-200 truncate ml-2">{p.engineerName || '—'}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Total Budget:</span>
                    <span className="font-black text-white">{(p.totalBudget || 0).toLocaleString()} ETB</span>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Progress</span>
                    <span className="font-bold text-[#b4e600]">{p.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-[#0d1117] border border-[#30363d] rounded-full h-2 overflow-hidden">
                    <div className="bg-[#b4e600] h-2 rounded-full transition-all" style={{ width: `${p.progress || 0}%` }} />
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[#30363d] flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-mono">ID: {p.id.substring(0, 8)}...</span>
                <Link
                  to={`/projects/${p.id}`}
                  className="inline-flex items-center gap-1 font-bold text-xs uppercase tracking-wider text-[#b4e600] hover:text-[#cbf800] transition-colors"
                >
                  <span>Site Dossier</span>
                  <ArrowRight className="w-3 h-3 stroke-[3]" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Project Modal */}
      <AddProjectModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onProjectCreated={handleProjectCreated}
      />

      {/* Edit Project Modal */}
      <EditProjectModal
        isOpen={Boolean(editingProject)}
        onClose={() => setEditingProject(null)}
        project={editingProject}
        onProjectUpdated={handleProjectUpdated}
      />

      {/* Delete Project Confirmation Modal */}
      <DeleteProjectModal
        isOpen={Boolean(deletingProject)}
        onClose={() => setDeletingProject(null)}
        project={deletingProject}
        onProjectDeleted={handleProjectDeleted}
      />
    </div>
  );
}

export default ProjectsPage;
