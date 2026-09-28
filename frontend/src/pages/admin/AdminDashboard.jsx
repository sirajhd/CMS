import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { projectService } from '../../services/projectService';
import { userService } from '../../services/userService';
import { EditProjectModal } from '../../components/projects/EditProjectModal';
import { DeleteProjectModal } from '../../components/projects/DeleteProjectModal';
import {
  Building2,
  Clock,
  CreditCard,
  Users,
  Plus,
  MapPin,
  X,
  AlertCircle,
  Search,
  FolderKanban,
  FileText,
  LayoutGrid,
  List,
  ArrowRight,
  User,
  HardHat,
  Layers,
  Calendar,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Edit3,
  Trash2
} from 'lucide-react';

export function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'Admin';

  const [projects, setProjects] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Selected Site File for Detailed Inspection Modal
  const [selectedSiteFile, setSelectedSiteFile] = useState(null);

  // Edit & Delete Project Modals State
  const [editingProject, setEditingProject] = useState(null);
  const [deletingProject, setDeletingProject] = useState(null);

  // New Project Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    totalBudget: '',
    houseHolderId: '',
    engineerId: '',
    managerId: '',
    startDate: new Date().toISOString().split('T')[0],
    expectedCompletion: '',
    description: '',
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [fetchedProjects, fetchedUsers] = await Promise.all([
        projectService.getAllProjects(),
        isAdmin ? userService.getAllUsers() : Promise.resolve([]),
      ]);
      setProjects(fetchedProjects || []);
      setAllUsers(fetchedUsers || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;

    setFormError('');
    setIsSubmitting(true);

    try {
      if (!formData.name.trim() || !formData.location.trim()) {
        throw new Error('Project name and site location are required.');
      }

      const newProject = await projectService.createProject({
        name: formData.name,
        location: formData.location,
        totalBudget: Number(formData.totalBudget) || 0,
        houseHolderId: formData.houseHolderId || null,
        engineerId: formData.engineerId || null,
        managerId: formData.managerId || null,
        startDate: formData.startDate,
        expectedCompletion: formData.expectedCompletion || null,
        description: formData.description,
      });

      setProjects((prev) => [newProject, ...prev]);

      setFormData({
        name: '',
        location: '',
        totalBudget: '',
        houseHolderId: '',
        engineerId: '',
        managerId: '',
        startDate: new Date().toISOString().split('T')[0],
        expectedCompletion: '',
        description: '',
      });
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err.message || 'Failed to register project in database');
    } finally {
      setIsSubmitting(false);
    }
  };

  const houseHolders = allUsers.filter((u) => u.role === 'House Holder');
  const engineers = allUsers.filter((u) => u.role === 'Engineer');
  const managers = allUsers.filter((u) => u.role === 'Manager');

  const filteredProjects = projects.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.location?.toLowerCase().includes(q) ||
      p.houseHolderName?.toLowerCase().includes(q) ||
      p.engineerName?.toLowerCase().includes(q) ||
      p.managerName?.toLowerCase().includes(q)
    );
  });

  const totalCommitted = projects.reduce((acc, curr) => acc + (curr.totalBudget || 0), 0);
  const totalSpent = projects.reduce((acc, curr) => acc + (curr.spentBudget || 0), 0);

  const getDashboardTitle = () => {
    switch (user?.role) {
      case 'House Holder':
        return 'Property Owner Dashboard';
      case 'Engineer':
        return 'Site Engineering Dashboard';
      case 'Manager':
        return 'Operations Management Dashboard';
      default:
        return 'System Administration Dashboard';
    }
  };

  const getDashboardSubtitle = () => {
    switch (user?.role) {
      case 'House Holder':
        return 'Track site development milestones, inspections, and disbursement approvals.';
      case 'Engineer':
        return 'Structural progress, field requisitions, and materials consignments.';
      case 'Manager':
        return 'Financial disbursement execution and site drop confirmations.';
      default:
        return 'Portfolio oversight, independent site file dossiers, and stakeholder assignments.';
    }
  };

  return (
    <div className="space-y-6 text-[#f0f6fc]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight uppercase">{getDashboardTitle()}</h1>
          <p className="text-xs text-slate-400">{getDashboardSubtitle()}</p>
        </div>

        {/* ONLY Render for Admin */}
        {isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#b4e600] hover:bg-[#cbf800] text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add New Project</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#161b22] p-5 rounded-2xl border border-[#30363d] shadow-md flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {isAdmin ? 'Total Sites' : 'Assigned Sites'}
            </p>
            <p className="text-2xl font-black text-white mt-1">{projects.length}</p>
            <p className="text-xs text-[#b4e600] mt-1 font-semibold">{projects.filter(p => p.status === 'Active').length} Active Sites</p>
          </div>
          <div className="p-3 bg-[#b4e600]/10 text-[#b4e600] border border-[#b4e600]/30 rounded-xl">
            <Building2 className="w-6 h-6 stroke-[2.5]" />
          </div>
        </div>

        <div className="bg-[#161b22] p-5 rounded-2xl border border-[#30363d] shadow-md flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Committed Budget</p>
            <p className="text-2xl font-black text-white mt-1">{totalCommitted.toLocaleString()} ETB</p>
            <p className="text-xs text-slate-400 mt-1">{totalSpent.toLocaleString()} ETB Disbursed</p>
          </div>
          <div className="p-3 bg-[#b4e600]/10 text-[#b4e600] border border-[#b4e600]/30 rounded-xl">
            <CreditCard className="w-6 h-6 stroke-[2.5]" />
          </div>
        </div>

        <div className="bg-[#161b22] p-5 rounded-2xl border border-[#30363d] shadow-md flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Site Status</p>
            <p className="text-2xl font-black text-white mt-1">100%</p>
            <p className="text-xs text-[#b4e600] mt-1 font-semibold">On schedule</p>
          </div>
          <div className="p-3 bg-[#b4e600]/10 text-[#b4e600] border border-[#b4e600]/30 rounded-xl">
            <Clock className="w-6 h-6 stroke-[2.5]" />
          </div>
        </div>

        <div className="bg-[#161b22] p-5 rounded-2xl border border-[#30363d] shadow-md flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Stakeholder Team</p>
            <p className="text-2xl font-black text-white mt-1">{allUsers.length > 0 ? `${allUsers.length} Users` : 'Active Crew'}</p>
            <p className="text-xs text-slate-400 mt-1">Admin • Owner • Eng • Mgr</p>
          </div>
          <div className="p-3 bg-[#b4e600]/10 text-[#b4e600] border border-[#b4e600]/30 rounded-xl">
            <Users className="w-6 h-6 stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* Projects Directory & Site File Dossiers Section */}
      {/* Projects Directory & Site File Dossiers Section */}
      <div className="bg-[#161b22] rounded-2xl border border-[#30363d] shadow-md overflow-hidden">
        {/* Directory Controls Bar */}
        <div className="p-5 border-b border-[#30363d] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-wider">
              {isAdmin ? 'Construction Site Files & Dossiers' : 'My Assigned Site Files'}
            </h2>
            <p className="text-xs text-slate-400">
              Select any project file to inspect site details, stakeholders, budget allocation, and progress.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle (Grid File Cards vs Data Table) */}
            <div className="flex items-center rounded-lg bg-[#0d1117] border border-[#30363d] p-1">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-[#b4e600] text-black shadow-xs font-black' 
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Dossier File Grid View"
              >
                <LayoutGrid className="w-4 h-4 stroke-[2.5]" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'table' 
                    ? 'bg-[#b4e600] text-black shadow-xs font-black' 
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Data Table View"
              >
                <List className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search site, owner, engineer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-[#0d1117] border border-[#30363d] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600] transition-all"
              />
            </div>
          </div>
        </div>

        {/* Content View: File Dossier Grid or Table */}
        {isLoading ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            Loading site files from PostgreSQL...
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            No construction project files found.
          </div>
        ) : viewMode === 'grid' ? (
          /* 1. Independent Site File Dossier Grid View */
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedSiteFile(p)}
                className="group cursor-pointer bg-[#0d1117]/90 rounded-2xl border border-[#30363d] p-5 shadow-xs hover:border-[#b4e600] hover:bg-[#161b22] hover:shadow-xl transition-all flex flex-col justify-between"
              >
                <div>
                  {/* File Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 bg-[#161b22] text-[#b4e600] border border-[#30363d] rounded-xl group-hover:bg-[#b4e600] group-hover:text-black transition-colors">
                        <FolderKanban className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-slate-500 block uppercase">
                          FILE ID: {p.id.substring(0, 8)}...
                        </span>
                        <h3 className="text-sm font-bold text-white group-hover:text-[#b4e600] transition-colors">
                          {p.name}
                        </h3>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#b4e600]/15 text-[#b4e600] border border-[#b4e600]/40">
                      {p.status || 'Active'}
                    </span>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    <span className="truncate">{p.location}</span>
                  </div>

                  {/* Stakeholders Chips */}
                  <div className="p-3 bg-[#161b22]/70 border border-[#30363d] rounded-xl space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-500 flex items-center gap-1">
                        <User className="w-3 h-3 text-[#b4e600]" /> Owner:
                      </span>
                      <span className="font-semibold text-white truncate max-w-[140px]">
                        {p.houseHolderName || 'Unassigned'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-500 flex items-center gap-1">
                        <HardHat className="w-3 h-3 text-[#b4e600]" /> Engineer:
                      </span>
                      <span className="font-semibold text-white truncate max-w-[140px]">
                        {p.engineerName || 'Unassigned'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Layers className="w-3 h-3 text-[#b4e600]" /> Manager:
                      </span>
                      <span className="font-semibold text-white truncate max-w-[140px]">
                        {p.managerName || 'Unassigned'}
                      </span>
                    </div>
                  </div>

                  {/* Budget & Progress */}
                  <div className="mt-3.5 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-400">
                      <span className="text-slate-500">Total Budget:</span>
                      <span className="font-bold text-white">
                        {(p.totalBudget || 0).toLocaleString()} ETB
                      </span>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-500">Progress</span>
                        <span className="font-bold text-[#b4e600]">{p.progress || 0}%</span>
                      </div>
                      <div className="w-full bg-[#30363d] rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-[#b4e600] h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${p.progress || 0}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-4 pt-3 border-t border-[#30363d] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500">
                    Click to inspect site details
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-[#b4e600] group-hover:translate-x-0.5 transition-transform">
                    <span>Inspect File</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* 2. Traditional Table View */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0d1117] border-b border-[#30363d] text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Construction Site</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Property Owner</th>
                  <th className="py-3 px-4">Site Engineer</th>
                  <th className="py-3 px-4">Manager</th>
                  <th className="py-3 px-4">Budget & Spent</th>
                  <th className="py-3 px-4">Progress</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#30363d] text-slate-300">
                {filteredProjects.map((p) => (
                  <tr key={p.id} className="hover:bg-[#0d1117]/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <button 
                        onClick={() => setSelectedSiteFile(p)}
                        className="text-left font-bold text-white hover:text-[#b4e600] hover:underline transition-colors block"
                      >
                        {p.name}
                      </button>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{p.id}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        <span>{p.location}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-white">{p.houseHolderName}</td>
                    <td className="py-3.5 px-4 text-slate-400">{p.engineerName}</td>
                    <td className="py-3.5 px-4 text-slate-400">{p.managerName}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{(p.totalBudget || 0).toLocaleString()} ETB</div>
                      <div className="text-[10px] text-slate-500">Spent: {(p.spentBudget || 0).toLocaleString()} ETB</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-[#30363d] rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-[#b4e600] h-2 rounded-full" 
                            style={{ width: `${p.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-white">{p.progress || 0}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#b4e600]/15 text-[#b4e600] border border-[#b4e600]/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#b4e600]"></span>
                        {p.status || 'Active'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedSiteFile(p)}
                          className="px-2.5 py-1 text-xs font-bold text-[#b4e600] hover:bg-[#b4e600]/10 rounded-lg transition-colors cursor-pointer"
                        >
                          Inspect File
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              type="button"
                              onClick={() => setEditingProject(p)}
                              className="p-1 rounded-lg text-slate-400 hover:text-[#b4e600] hover:bg-[#b4e600]/10 transition-colors cursor-pointer"
                              title="Edit Project"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingProject(p)}
                              className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                              title="Delete Project"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* INDEPENDENT SITE FILE INSPECTION MODAL */}
      {selectedSiteFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#161b22] w-full max-w-2xl rounded-2xl shadow-2xl border border-[#30363d] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#30363d] flex items-center justify-between bg-[#0d1117]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#b4e600] text-black rounded-xl shadow-xs ring-2 ring-[#b4e600]/30">
                  <Building2 className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-white uppercase">{selectedSiteFile.name}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#b4e600]/15 text-[#b4e600] border border-[#b4e600]/40">
                      {selectedSiteFile.status || 'Active'}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-500">UUID: {selectedSiteFile.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSiteFile(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#161b22] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Site Location & Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-[#0d1117] rounded-xl border border-[#30363d]">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Location</span>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-200 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-[#b4e600] flex-shrink-0" />
                    <span>{selectedSiteFile.location}</span>
                  </div>
                </div>
                <div className="p-3 bg-[#0d1117] rounded-xl border border-[#30363d]">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Start Date</span>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-200 mt-1">
                    <Calendar className="w-3.5 h-3.5 text-[#b4e600] flex-shrink-0" />
                    <span>{selectedSiteFile.startDate || '2026-01-01'}</span>
                  </div>
                </div>
                <div className="p-3 bg-[#0d1117] rounded-xl border border-[#30363d]">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Target Completion</span>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-200 mt-1">
                    <Clock className="w-3.5 h-3.5 text-[#b4e600] flex-shrink-0" />
                    <span>{selectedSiteFile.expectedCompletion || '2026-12-31'}</span>
                  </div>
                </div>
              </div>

              {/* Stakeholder Directory for this Site */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2.5">
                  Assigned Site Stakeholders
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Property Owner */}
                  <div className="p-3.5 rounded-xl border border-[#30363d] bg-[#0d1117] space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#b4e600]/15 text-[#b4e600] flex items-center justify-center font-bold text-xs">
                        <User className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[#b4e600] uppercase block">Property Owner</span>
                        <p className="text-xs font-bold text-white">{selectedSiteFile.houseHolderName || 'Abebe Kebede'}</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 pt-1">Authorized client sign-off</p>
                  </div>

                  {/* Lead Engineer */}
                  <div className="p-3.5 rounded-xl border border-[#30363d] bg-[#0d1117] space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#b4e600]/15 text-[#b4e600] flex items-center justify-center font-bold text-xs">
                        <HardHat className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[#b4e600] uppercase block">Site Engineer</span>
                        <p className="text-xs font-bold text-white">{selectedSiteFile.engineerName || 'Engineer Hana Worku'}</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 pt-1">Technical supervision & requests</p>
                  </div>

                  {/* Operations Manager */}
                  <div className="p-3.5 rounded-xl border border-[#30363d] bg-[#0d1117] space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#b4e600]/15 text-[#b4e600] flex items-center justify-center font-bold text-xs">
                        <Layers className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[#b4e600] uppercase block">Operations Manager</span>
                        <p className="text-xs font-bold text-white">{selectedSiteFile.managerName || 'Manager Daniel Hailu'}</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 pt-1">Logistics & disbursement release</p>
                  </div>
                </div>
              </div>

              {/* Financial Architecture & Progress */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2.5">
                  Financial Ledger & Milestone Progress
                </h4>
                <div className="p-4 bg-[#0d1117] rounded-xl border border-[#30363d] space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Authorized Total Budget:</span>
                      <p className="text-base font-black text-white">
                        {(selectedSiteFile.totalBudget || 0).toLocaleString()} ETB
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Disbursed Capital:</span>
                      <p className="text-base font-black text-[#b4e600]">
                        {(selectedSiteFile.spentBudget || 0).toLocaleString()} ETB
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Remaining Balance:</span>
                      <p className="text-base font-bold text-slate-300">
                        {Math.max(0, (selectedSiteFile.totalBudget || 0) - (selectedSiteFile.spentBudget || 0)).toLocaleString()} ETB
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#30363d]">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">Milestone Progress Completion</span>
                      <span className="font-black text-[#b4e600]">{selectedSiteFile.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-[#30363d] rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-[#b4e600] h-2.5 rounded-full transition-all duration-500" 
                        style={{ width: `${selectedSiteFile.progress || 0}%` }} 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Scope & Description */}
              {selectedSiteFile.description && (
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    Engineering Scope & Specifications
                  </h4>
                  <p className="text-xs text-slate-300 bg-[#0d1117] p-3.5 rounded-xl border border-[#30363d] leading-relaxed">
                    {selectedSiteFile.description}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[#30363d] flex flex-wrap items-center justify-between gap-3 bg-[#0d1117]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSiteFile(null)}
                  className="px-4 py-2 border border-[#30363d] hover:bg-[#161b22] text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer uppercase tracking-wider"
                >
                  Close File
                </button>
                {isAdmin && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProject(selectedSiteFile);
                        setSelectedSiteFile(null);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#30363d] hover:border-[#b4e600]/50 hover:bg-[#b4e600]/10 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer uppercase tracking-wider"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#b4e600]" />
                      <span>Edit Site</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeletingProject(selectedSiteFile);
                        setSelectedSiteFile(null);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 border border-red-500/30 hover:bg-red-500/10 text-red-400 text-xs font-bold rounded-xl transition-colors cursor-pointer uppercase tracking-wider"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </>
                )}
              </div>

              <Link
                to={`/projects/${selectedSiteFile.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#b4e600] hover:bg-[#cbf800] text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition-all"
              >
                <span>Open Full Site Dossier & Archive</span>
                <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Admin-Only Modal: Register Project */}
      {isAdmin && isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#161b22] w-full max-w-lg rounded-2xl shadow-2xl border border-[#30363d] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-[#30363d] flex items-center justify-between bg-[#0d1117]">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Register Construction Site</h3>
                <p className="text-xs text-slate-400">Administrator access: create project and assign stakeholders</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#161b22] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-950/50 border border-red-800/80 rounded-xl flex items-start gap-2.5 text-xs text-red-200">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">Site Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Summit Luxury Villa"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-[#0d1117] border border-[#30363d] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600] transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">Location / Municipality *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Bole Subcity, Addis Ababa"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-[#0d1117] border border-[#30363d] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">Total Contract Budget (ETB) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g., 2500000"
                    value={formData.totalBudget}
                    onChange={(e) => setFormData({ ...formData, totalBudget: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-[#0d1117] border border-[#30363d] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600] transition-all"
                  />
                </div>
              </div>

              {/* Stakeholder Dropdowns */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">Property Owner (House Holder)</label>
                <select
                  value={formData.houseHolderId}
                  onChange={(e) => setFormData({ ...formData, houseHolderId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-[#0d1117] border border-[#30363d] text-white focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600] transition-all"
                >
                  <option value="">Select Property Owner...</option>
                  {houseHolders.map((u) => (
                    <option key={u.id} value={u.id} className="bg-[#0d1117] text-white">{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">Lead Structural Engineer</label>
                  <select
                    value={formData.engineerId}
                    onChange={(e) => setFormData({ ...formData, engineerId: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-[#0d1117] border border-[#30363d] text-white focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600] transition-all"
                  >
                    <option value="">Select Engineer...</option>
                    {engineers.map((u) => (
                      <option key={u.id} value={u.id} className="bg-[#0d1117] text-white">{u.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">Operations Manager</label>
                  <select
                    value={formData.managerId}
                    onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-[#0d1117] border border-[#30363d] text-white focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600] transition-all"
                  >
                    <option value="">Select Manager...</option>
                    {managers.map((u) => (
                      <option key={u.id} value={u.id} className="bg-[#0d1117] text-white">{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">Project Scope / Technical Description</label>
                <textarea
                  rows="2"
                  placeholder="Describe structural scope, foundations, floors..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-[#0d1117] border border-[#30363d] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600] resize-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-[#0d1117] border border-[#30363d] text-white focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">Expected Completion</label>
                  <input
                    type="date"
                    value={formData.expectedCompletion}
                    onChange={(e) => setFormData({ ...formData, expectedCompletion: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-[#0d1117] border border-[#30363d] text-white focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600] transition-all"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#30363d] hover:bg-[#0d1117] text-slate-300 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#b4e600] hover:bg-[#cbf800] text-black text-xs font-black uppercase tracking-wider rounded-lg shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Saving to Database...' : 'Register Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      <EditProjectModal
        isOpen={Boolean(editingProject)}
        onClose={() => setEditingProject(null)}
        project={editingProject}
        onProjectUpdated={(updated) => {
          setProjects((prev) =>
            prev.map((p) => (p.id === updated.id ? updated : p))
          );
        }}
      />

      {/* Delete Project Modal */}
      <DeleteProjectModal
        isOpen={Boolean(deletingProject)}
        onClose={() => setDeletingProject(null)}
        project={deletingProject}
        onProjectDeleted={(deletedId) => {
          setProjects((prev) => prev.filter((p) => p.id !== deletedId));
        }}
      />
    </div>
  );
}

export default AdminDashboard;
