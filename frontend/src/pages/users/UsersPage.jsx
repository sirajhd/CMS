import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { formatDate } from '../../utils/formatters';
import { 
  Users, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Plus, 
  Search, 
  UserCheck, 
  X, 
  AlertCircle,
  Edit3,
  Trash2,
  Building2,
  ExternalLink,
  Calendar,
  Briefcase,
  Key,
  CheckCircle2,
  ArrowRight,
  Shield,
  HardHat,
  LayoutGrid,
  List,
  Columns3,
  Layers,
  Filter,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  FolderKanban,
  Sparkles,
  UserPlus,
  Info
} from 'lucide-react';

// Role Definitions and Metadata Configuration
const ROLE_CONFIG = {
  'Admin': {
    name: 'Administrator',
    plural: 'System Administrators',
    badgeClass: 'bg-purple-950/60 text-purple-300 border-purple-500/40 shadow-purple-950/30',
    headerBg: 'from-purple-950/40 via-[#161b22] to-[#161b22]',
    accentColor: '#c084fc',
    lightBorder: 'border-purple-500/30',
    icon: Shield,
    description: 'Full platform governance, security access control, and master site oversight.',
    capabilities: ['Manage Stakeholders', 'Create & Delete Sites', 'Audit Logs Access', 'System Configuration'],
  },
  'Engineer': {
    name: 'Site Engineer',
    plural: 'Lead Structural Engineers',
    badgeClass: 'bg-amber-950/60 text-amber-300 border-amber-500/40 shadow-amber-950/30',
    headerBg: 'from-amber-950/40 via-[#161b22] to-[#161b22]',
    accentColor: '#fbbf24',
    lightBorder: 'border-amber-500/30',
    icon: HardHat,
    description: 'On-site technical supervision, material requisitions, and structural inspection reports.',
    capabilities: ['Submit Requisitions', 'Material Deliveries', 'Technical Drawings', 'Site Progress Logs'],
  },
  'Manager': {
    name: 'Project Manager',
    plural: 'Operations Managers',
    badgeClass: 'bg-sky-950/60 text-sky-300 border-sky-500/40 shadow-sky-950/30',
    headerBg: 'from-sky-950/40 via-[#161b22] to-[#161b22]',
    accentColor: '#38bdf8',
    lightBorder: 'border-sky-500/30',
    icon: Briefcase,
    description: 'Financial disbursement execution, vendor contracts, and logistics coordination.',
    capabilities: ['Disburse Payments', 'Manage Waybills', 'Vendor Logistics', 'Schedule Coordination'],
  },
  'House Holder': {
    name: 'House Holder (Owner)',
    plural: 'Property Owners',
    badgeClass: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 shadow-emerald-950/30',
    headerBg: 'from-emerald-950/40 via-[#161b22] to-[#161b22]',
    accentColor: '#34d399',
    lightBorder: 'border-emerald-500/30',
    icon: Building2,
    description: 'Property owners with milestone validation and project fund release permissions.',
    capabilities: ['Approve Payments', 'Review Milestone Docs', 'Site File Access', 'Owner Approvals'],
  },
};

const ROLES_LIST = ['Admin', 'Engineer', 'Manager', 'House Holder'];

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'Admin';
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Organization Filters & View Modes
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL'); // 'ALL' | 'Admin' | 'Engineer' | 'Manager' | 'House Holder'
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' | 'grid' | 'table' | 'columns'
  const [sortBy, setSortBy] = useState('name_asc'); // 'name_asc' | 'name_desc' | 'projects_desc' | 'date_desc' | 'date_asc'
  const [expandedSections, setExpandedSections] = useState({
    Admin: true,
    Engineer: true,
    Manager: true,
    'House Holder': true,
  });

  // View User Dossier State
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Edit User State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editFormError, setEditFormError] = useState('');
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Engineer',
    title: '',
    password: '',
  });

  // Delete State
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Create User Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: 'password123',
    role: 'Engineer',
    phone: '',
    title: '',
  });

  // Action feedback message
  const [feedback, setFeedback] = useState(null);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await userService.getAllUsers();
      setUsers(data || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showNotification = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Toggle role group accordion in grouped mode
  const toggleRoleGroup = (roleKey) => {
    setExpandedSections((prev) => ({
      ...prev,
      [roleKey]: !prev[roleKey],
    }));
  };

  // Open Full User Dossier
  const handleOpenUserDossier = async (u) => {
    setSelectedUser(u);
    setIsLoadingDetails(true);
    setShowDeleteConfirm(false);
    try {
      const detailed = await userService.getUserById(u.id);
      setSelectedUser(detailed);
    } catch (err) {
      console.error('Failed to fetch full user details:', err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (u, e) => {
    if (e) e.stopPropagation();
    setEditFormData({
      name: u.name || '',
      email: u.email || '',
      phone: u.phone || '',
      role: u.role || 'Engineer',
      title: u.title || '',
      password: '',
    });
    setEditFormError('');
    setIsEditModalOpen(true);
  };

  // Save Edit Changes
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!isAdmin || !selectedUser) return;

    setIsUpdating(true);
    setEditFormError('');

    try {
      if (!editFormData.name.trim() || !editFormData.email.trim()) {
        throw new Error('Name and email are required.');
      }

      const updated = await userService.updateUser(selectedUser.id, editFormData);
      
      // Update in master list
      setUsers((prev) => prev.map((item) => (item.id === selectedUser.id ? { ...item, ...updated } : item)));
      
      // Update in selected modal
      setSelectedUser((prev) => (prev ? { ...prev, ...updated } : updated));
      setIsEditModalOpen(false);
      showNotification('success', `Stakeholder ${updated.name} updated successfully!`);
    } catch (err) {
      setEditFormError(err.message || 'Failed to update user profile.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete User
  const handleDeleteUser = async () => {
    if (!isAdmin || !selectedUser) return;
    if (selectedUser.id === currentUser?.id) {
      alert('You cannot delete your own active administrator account.');
      return;
    }

    setIsDeleting(true);
    try {
      await userService.deleteUser(selectedUser.id);
      setUsers((prev) => prev.filter((item) => item.id !== selectedUser.id));
      const deletedName = selectedUser.name;
      setSelectedUser(null);
      setShowDeleteConfirm(false);
      showNotification('success', `Stakeholder ${deletedName} has been removed from the platform.`);
    } catch (err) {
      alert(err.message || 'Failed to delete user.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Create User
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;

    setFormError('');
    setIsSubmitting(true);

    try {
      if (!formData.name.trim() || !formData.email.trim()) {
        throw new Error('Name and email are required.');
      }

      const created = await userService.createUser(formData);
      setUsers((prev) => [created, ...prev]);
      setIsModalOpen(false);
      setFormData({
        name: '',
        email: '',
        password: 'password123',
        role: 'Engineer',
        phone: '',
        title: '',
      });
      showNotification('success', `New stakeholder ${created.name} registered successfully!`);
    } catch (err) {
      setFormError(err.message || 'Failed to register user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Role Statistics Calculation
  const roleCounts = useMemo(() => {
    const counts = {
      ALL: users.length,
      Admin: 0,
      Engineer: 0,
      Manager: 0,
      'House Holder': 0,
    };
    users.forEach((u) => {
      if (counts[u.role] !== undefined) {
        counts[u.role] += 1;
      }
    });
    return counts;
  }, [users]);

  // Filter and Sort Users
  const processedUsers = useMemo(() => {
    let result = users.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q) ||
        u.title?.toLowerCase().includes(q) ||
        u.phone?.toLowerCase().includes(q)
      );

      const matchesRole = selectedRoleFilter === 'ALL' || u.role === selectedRoleFilter;
      return matchesSearch && matchesRole;
    });

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name_desc':
          return (b.name || '').localeCompare(a.name || '');
        case 'projects_desc':
          return (Number(b.assigned_projects_count) || 0) - (Number(a.assigned_projects_count) || 0);
        case 'date_desc':
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        case 'date_asc':
          return new Date(a.created_at || 0) - new Date(b.created_at || 0);
        case 'name_asc':
        default:
          return (a.name || '').localeCompare(b.name || '');
      }
    });

    return result;
  }, [users, searchQuery, selectedRoleFilter, sortBy]);

  // Group users by role for Grouped and Columns modes
  const groupedUsersByRole = useMemo(() => {
    const groups = {
      Admin: [],
      Engineer: [],
      Manager: [],
      'House Holder': [],
    };

    processedUsers.forEach((u) => {
      if (groups[u.role]) {
        groups[u.role].push(u);
      } else {
        // Fallback into House Holder if unknown
        groups['House Holder'].push(u);
      }
    });

    return groups;
  }, [processedUsers]);

  const getRoleBadge = (role) => {
    const config = ROLE_CONFIG[role] || ROLE_CONFIG['House Holder'];
    return config.badgeClass;
  };

  return (
    <div className="space-y-6 text-[#f0f6fc] font-sans pb-12">
      {/* Action Notification Toast */}
      {feedback && (
        <div className={`p-4 rounded-xl border flex items-center justify-between shadow-xl animate-in fade-in duration-200 ${
          feedback.type === 'success' 
            ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200' 
            : 'bg-rose-950/70 border-rose-500/40 text-rose-200'
        }`}>
          <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-[#b4e600]" />
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#30363d]">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-[#b4e600]/10 border border-[#b4e600]/30 text-[#b4e600] text-[11px] font-bold uppercase tracking-wider mb-1">
            <Users className="w-3.5 h-3.5" />
            <span>Role-Based Governance</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-wider uppercase">Stakeholders & User Directory</h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Role-organized personnel registry with assigned site files, project access matrix, and credentials.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#b4e600] hover:bg-[#cbf800] text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition-all flex-shrink-0 cursor-pointer active:scale-95"
          >
            <UserPlus className="w-4 h-4 stroke-[3]" />
            <span>Register New User</span>
          </button>
        )}
      </div>

      {/* TOP ROLE KPI CARDS / INTERACTIVE FILTER TABS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* All Users Card */}
        <button
          type="button"
          onClick={() => setSelectedRoleFilter('ALL')}
          className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
            selectedRoleFilter === 'ALL'
              ? 'bg-[#161b22] border-[#b4e600] ring-2 ring-[#b4e600]/20 shadow-lg'
              : 'bg-[#161b22]/70 border-[#30363d] hover:border-slate-500 hover:bg-[#161b22]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Workforce</span>
            <div className={`p-1.5 rounded-lg ${selectedRoleFilter === 'ALL' ? 'bg-[#b4e600] text-black' : 'bg-[#21262d] text-slate-300'}`}>
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-1.5">{roleCounts.ALL}</p>
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
            <span>All Stakeholders</span>
            <span className="text-[#b4e600] font-semibold">100%</span>
          </div>
        </button>

        {/* 4 Role Categories */}
        {ROLES_LIST.map((rKey) => {
          const cfg = ROLE_CONFIG[rKey];
          const RoleIcon = cfg.icon;
          const count = roleCounts[rKey] || 0;
          const percentage = roleCounts.ALL > 0 ? Math.round((count / roleCounts.ALL) * 100) : 0;
          const isSelected = selectedRoleFilter === rKey;

          return (
            <button
              key={rKey}
              type="button"
              onClick={() => setSelectedRoleFilter(isSelected ? 'ALL' : rKey)}
              className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
                isSelected
                  ? `bg-[#161b22] ${cfg.lightBorder} ring-2 ring-[${cfg.accentColor}]/30 shadow-lg`
                  : 'bg-[#161b22]/70 border-[#30363d] hover:border-slate-500 hover:bg-[#161b22]'
              }`}
            >
              {isSelected && (
                <div 
                  className="absolute top-0 left-0 right-0 h-1" 
                  style={{ backgroundColor: cfg.accentColor }} 
                />
              )}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate pr-1">
                  {cfg.name}
                </span>
                <div 
                  className="p-1.5 rounded-lg text-white" 
                  style={{ backgroundColor: `${cfg.accentColor}25`, color: cfg.accentColor }}
                >
                  <RoleIcon className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-2xl font-black text-white mt-1.5">{count}</p>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                <span>Active</span>
                <span className="font-semibold" style={{ color: cfg.accentColor }}>{percentage}%</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* FILTER & VIEW CONTROLS TOOLBAR */}
      <div className="bg-[#161b22] p-3.5 rounded-2xl border border-[#30363d] shadow-md flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, role, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* View Mode & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl bg-[#0d1117] border border-[#30363d] text-white focus:outline-none focus:ring-2 focus:ring-[#b4e600] transition-all"
            >
              <option value="name_asc">Name (A → Z)</option>
              <option value="name_desc">Name (Z → A)</option>
              <option value="projects_desc">Assigned Sites (High → Low)</option>
              <option value="date_desc">Joined Date (Newest)</option>
              <option value="date_asc">Joined Date (Oldest)</option>
            </select>
          </div>

          {/* View Mode Switcher Buttons */}
          <div className="flex items-center bg-[#0d1117] p-1 rounded-xl border border-[#30363d]">
            <button
              type="button"
              onClick={() => setViewMode('grouped')}
              title="Grouped by Role"
              className={`p-1.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'grouped'
                  ? 'bg-[#b4e600] text-black shadow-xs font-black'
                  : 'text-slate-400 hover:text-white hover:bg-[#161b22]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[10px]">Grouped</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('grid')}
              title="Grid View"
              className={`p-1.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-[#b4e600] text-black shadow-xs font-black'
                  : 'text-slate-400 hover:text-white hover:bg-[#161b22]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[10px]">Grid</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('table')}
              title="Table View"
              className={`p-1.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[#b4e600] text-black shadow-xs font-black'
                  : 'text-slate-400 hover:text-white hover:bg-[#161b22]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[10px]">Table</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('columns')}
              title="Role Columns"
              className={`p-1.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'columns'
                  ? 'bg-[#b4e600] text-black shadow-xs font-black'
                  : 'text-slate-400 hover:text-white hover:bg-[#161b22]'
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[10px]">Columns</span>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA BY VIEW MODE */}
      {isLoading ? (
        <div className="py-24 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#b4e600] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono uppercase tracking-wider text-slate-400">Loading directory stakeholders...</p>
        </div>
      ) : processedUsers.length === 0 ? (
        <div className="py-20 bg-[#161b22] border border-[#30363d] rounded-2xl text-center space-y-3">
          <Users className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">No Stakeholders Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No user matched your filter criteria. Try clearing search keywords or switching role tabs.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedRoleFilter('ALL');
            }}
            className="px-4 py-2 text-xs font-bold bg-[#21262d] hover:bg-[#30363d] text-[#b4e600] rounded-xl transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          {/* 1. ADVANCED GROUPED BY ROLE MODE */}
          {viewMode === 'grouped' && (
            <div className="space-y-6">
              {ROLES_LIST.map((roleKey) => {
                const roleUsers = groupedUsersByRole[roleKey] || [];
                // If filtering by a specific role and not ALL, skip non-matching roles
                if (selectedRoleFilter !== 'ALL' && selectedRoleFilter !== roleKey) {
                  return null;
                }

                const cfg = ROLE_CONFIG[roleKey];
                const RoleIcon = cfg.icon;
                const isExpanded = expandedSections[roleKey];

                return (
                  <div 
                    key={roleKey} 
                    className="bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden shadow-xl transition-all"
                  >
                    {/* Role Category Banner Header */}
                    <div 
                      onClick={() => toggleRoleGroup(roleKey)}
                      className={`px-5 py-4 bg-gradient-to-r ${cfg.headerBg} border-b border-[#30363d] flex items-center justify-between cursor-pointer hover:bg-opacity-80 transition-colors select-none`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md text-white font-bold"
                          style={{ backgroundColor: `${cfg.accentColor}25`, color: cfg.accentColor }}
                        >
                          <RoleIcon className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2.5">
                            <h2 className="text-base font-black text-white uppercase tracking-wider">
                              {cfg.plural}
                            </h2>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/40 text-white border border-white/10">
                              {roleUsers.length} {roleUsers.length === 1 ? 'Member' : 'Members'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {cfg.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Capabilities Chips */}
                        <div className="hidden lg:flex items-center gap-1.5">
                          {cfg.capabilities.slice(0, 2).map((cap, i) => (
                            <span 
                              key={i}
                              className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-[#0d1117]/80 text-slate-300 border border-[#30363d]"
                            >
                              ✓ {cap}
                            </span>
                          ))}
                        </div>

                        <button className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#21262d] transition-colors">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Role Users Content Grid */}
                    {isExpanded && (
                      <div className="p-5">
                        {roleUsers.length === 0 ? (
                          <div className="py-8 text-center text-xs text-slate-500 font-mono">
                            No {cfg.plural.toLowerCase()} registered yet.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {roleUsers.map((u) => (
                              <UserCard
                                key={u.id}
                                user={u}
                                roleConfig={cfg}
                                onOpenDossier={handleOpenUserDossier}
                                onOpenEdit={handleOpenEdit}
                                isAdmin={isAdmin}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 2. UNIFIED GRID VIEW */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {processedUsers.map((u) => {
                const cfg = ROLE_CONFIG[u.role] || ROLE_CONFIG['House Holder'];
                return (
                  <UserCard
                    key={u.id}
                    user={u}
                    roleConfig={cfg}
                    onOpenDossier={handleOpenUserDossier}
                    onOpenEdit={handleOpenEdit}
                    isAdmin={isAdmin}
                  />
                );
              })}
            </div>
          )}

          {/* 3. ENTERPRISE DATA TABLE VIEW */}
          {viewMode === 'table' && (
            <div className="bg-[#161b22] rounded-2xl border border-[#30363d] overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#0d1117] border-b border-[#30363d] text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-4">Stakeholder</th>
                      <th className="py-3.5 px-4">Role & Permissions</th>
                      <th className="py-3.5 px-4">Designation / Title</th>
                      <th className="py-3.5 px-4">Assigned Projects</th>
                      <th className="py-3.5 px-4">Contact Info</th>
                      <th className="py-3.5 px-4">Joined Date</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#30363d]/60">
                    {processedUsers.map((u) => {
                      const cfg = ROLE_CONFIG[u.role] || ROLE_CONFIG['House Holder'];
                      const RoleIcon = cfg.icon;

                      return (
                        <tr 
                          key={u.id}
                          onClick={() => handleOpenUserDossier(u)}
                          className="hover:bg-[#21262d]/60 transition-colors cursor-pointer group"
                        >
                          {/* Name + Avatar */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center shadow-md flex-shrink-0"
                                style={{ backgroundColor: `${cfg.accentColor}25`, color: cfg.accentColor, border: `1px solid ${cfg.accentColor}50` }}
                              >
                                {u.name?.[0]?.toUpperCase() || 'U'}
                              </div>
                              <div>
                                <p className="font-black text-white uppercase tracking-wider group-hover:text-[#b4e600] transition-colors">
                                  {u.name}
                                </p>
                                <span className="text-[10px] text-slate-500 font-mono">ID: {u.id.substring(0, 8)}</span>
                              </div>
                            </div>
                          </td>

                          {/* Role Badge */}
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${cfg.badgeClass}`}>
                              <RoleIcon className="w-3 h-3" />
                              <span>{u.role}</span>
                            </span>
                          </td>

                          {/* Title */}
                          <td className="py-3.5 px-4 text-slate-300 font-medium">
                            {u.title || 'Platform Stakeholder'}
                          </td>

                          {/* Assigned Projects */}
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0d1117] border border-[#30363d] text-slate-300 text-[11px] font-mono">
                              <FolderKanban className="w-3.5 h-3.5 text-[#b4e600]" />
                              <span>{u.assigned_projects_count || 0} {Number(u.assigned_projects_count) === 1 ? 'Site' : 'Sites'}</span>
                            </span>
                          </td>

                          {/* Contact Info */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5 font-mono text-[11px]">
                              <p className="text-slate-300 truncate max-w-xs">{u.email}</p>
                              <p className="text-slate-500">{u.phone || 'No phone'}</p>
                            </div>
                          </td>

                          {/* Joined Date */}
                          <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                            {u.created_at ? formatDate(u.created_at) : 'N/A'}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenUserDossier(u)}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-[#30363d] rounded-lg transition-colors"
                                title="View Dossier"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={(e) => handleOpenEdit(u, e)}
                                  className="p-1.5 text-slate-400 hover:text-[#b4e600] hover:bg-[#30363d] rounded-lg transition-colors"
                                  title="Edit Stakeholder"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. KANBAN / ROLE MATRIX COLUMNS VIEW */}
          {viewMode === 'columns' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
              {ROLES_LIST.map((roleKey) => {
                const roleUsers = groupedUsersByRole[roleKey] || [];
                const cfg = ROLE_CONFIG[roleKey];
                const RoleIcon = cfg.icon;

                return (
                  <div 
                    key={roleKey}
                    className="bg-[#161b22] border border-[#30363d] rounded-2xl flex flex-col max-h-[750px] shadow-xl overflow-hidden"
                  >
                    {/* Column Header */}
                    <div 
                      className={`p-4 border-b border-[#30363d] bg-gradient-to-b ${cfg.headerBg} flex items-center justify-between`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div 
                          className="p-2 rounded-xl text-white shadow-sm"
                          style={{ backgroundColor: `${cfg.accentColor}25`, color: cfg.accentColor }}
                        >
                          <RoleIcon className="w-4 h-4 stroke-[2.5]" />
                        </div>
                        <div>
                          <h3 className="text-xs font-black text-white uppercase tracking-wider">{cfg.name}</h3>
                          <span className="text-[10px] text-slate-400 font-mono">{roleUsers.length} Active</span>
                        </div>
                      </div>
                    </div>

                    {/* Column Scrollable Cards */}
                    <div className="p-3 space-y-3 overflow-y-auto custom-scrollbar flex-1">
                      {roleUsers.length === 0 ? (
                        <div className="py-12 text-center text-slate-500 text-xs font-mono">
                          No {roleKey} users.
                        </div>
                      ) : (
                        roleUsers.map((u) => (
                          <div
                            key={u.id}
                            onClick={() => handleOpenUserDossier(u)}
                            className="bg-[#0d1117] p-3.5 rounded-xl border border-[#30363d] hover:border-[#b4e600] transition-all cursor-pointer group shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <h4 className="text-xs font-bold text-white uppercase tracking-wider group-hover:text-[#b4e600] transition-colors">
                                  {u.name}
                                </h4>
                                <p className="text-[10px] text-slate-400 font-mono truncate">{u.title || 'Platform Member'}</p>
                              </div>
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-mono bg-[#161b22] text-[#b4e600] border border-[#30363d]">
                                {u.assigned_projects_count || 0} sites
                              </span>
                            </div>

                            <div className="space-y-1 text-[10px] text-slate-400 font-mono pt-2 border-t border-[#30363d]/60">
                              <p className="truncate">{u.email}</p>
                              <p className="text-slate-500">{u.phone || 'No phone'}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* FULL USER DOSSIER MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#161b22] text-[#f0f6fc] w-full max-w-2xl rounded-2xl shadow-2xl border border-[#30363d] overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#30363d] flex items-center justify-between bg-[#0d1117]">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-xl text-black font-black text-base flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: ROLE_CONFIG[selectedUser.role]?.accentColor || '#b4e600' }}
                >
                  {selectedUser.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-white uppercase tracking-wider">{selectedUser.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getRoleBadge(selectedUser.role)}`}>
                      {selectedUser.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono">{selectedUser.title || 'Platform Stakeholder'}</p>
                </div>
              </div>

              <button 
                onClick={() => setSelectedUser(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-[#161b22] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Delete Confirmation Warning Box */}
              {showDeleteConfirm && (
                <div className="p-4 bg-rose-950/40 border border-rose-500/50 rounded-2xl space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-black text-rose-200 uppercase tracking-wider">Confirm Account Deletion</h4>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        Are you sure you want to permanently delete <strong className="text-white">{selectedUser.name}</strong> ({selectedUser.email})?
                        They will be removed from all assigned construction projects.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3.5 py-1.5 border border-[#30363d] hover:bg-[#0d1117] text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteUser}
                      disabled={isDeleting}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isDeleting ? 'Deleting...' : 'Confirm Permanent Deletion'}
                    </button>
                  </div>
                </div>
              )}

              {/* Stakeholder Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#0d1117] p-4 rounded-xl border border-[#30363d] space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Email Address</span>
                  <div className="flex items-center gap-2 text-xs font-bold text-white font-mono">
                    <Mail className="w-3.5 h-3.5 text-[#b4e600]" />
                    <span>{selectedUser.email}</span>
                  </div>
                </div>

                <div className="bg-[#0d1117] p-4 rounded-xl border border-[#30363d] space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Phone Contact</span>
                  <div className="flex items-center gap-2 text-xs font-bold text-white font-mono">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedUser.phone || 'Not Registered'}</span>
                  </div>
                </div>

                <div className="bg-[#0d1117] p-4 rounded-xl border border-[#30363d] space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">System Role & Access</span>
                  <div className="flex items-center gap-2 text-xs font-bold text-white font-mono">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#b4e600]" />
                    <span>{selectedUser.role} Privileges</span>
                  </div>
                </div>

                <div className="bg-[#0d1117] p-4 rounded-xl border border-[#30363d] space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Joined CMS</span>
                  <div className="flex items-center gap-2 text-xs font-bold text-white font-mono">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedUser.created_at ? formatDate(selectedUser.created_at) : 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Role Scope Capabilities Summary */}
              {ROLE_CONFIG[selectedUser.role] && (
                <div className="p-4 bg-[#0d1117] rounded-xl border border-[#30363d] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                    <Info className="w-3.5 h-3.5 text-[#b4e600]" />
                    <span>Assigned Role Capabilities</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {ROLE_CONFIG[selectedUser.role].capabilities.map((cap, i) => (
                      <div key={i} className="p-2 rounded-lg bg-[#161b22] border border-[#30363d] text-[11px] text-slate-300 font-mono flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-[#b4e600] flex-shrink-0" />
                        <span className="truncate">{cap}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assigned Projects Dossier Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#b4e600]" />
                    <span>Assigned Construction Sites ({selectedUser.assignedProjects?.length || 0})</span>
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">Live PostgreSQL Link</span>
                </div>

                {isLoadingDetails ? (
                  <div className="p-6 text-center text-xs font-mono text-slate-400 animate-pulse bg-[#0d1117] rounded-xl border border-[#30363d]">
                    Loading assigned site files...
                  </div>
                ) : !selectedUser.assignedProjects || selectedUser.assignedProjects.length === 0 ? (
                  <div className="p-6 text-center text-xs font-mono text-slate-500 bg-[#0d1117] rounded-xl border border-[#30363d]">
                    No active construction sites currently linked to this stakeholder.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedUser.assignedProjects.map((p) => (
                      <div 
                        key={p.id}
                        onClick={() => {
                          setSelectedUser(null);
                          navigate(`/projects/${p.id}`);
                        }}
                        className="p-3.5 bg-[#0d1117] hover:bg-[#21262d] rounded-xl border border-[#30363d] hover:border-[#b4e600] transition-all cursor-pointer group space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="text-xs font-bold text-white uppercase tracking-wider group-hover:text-[#b4e600] transition-colors flex items-center gap-1.5">
                            <span>{p.name}</span>
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </h5>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-950/60 text-emerald-300 border border-emerald-500/40">
                            {p.status || 'Active'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono truncate">{p.location}</p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1.5 border-t border-[#30363d]/60">
                          <span>Progress: {p.progress || 0}%</span>
                          <span className="text-slate-300 font-bold">{Number(p.total_budget || 0).toLocaleString()} ETB</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer with Actions */}
            <div className="px-6 py-4 border-t border-[#30363d] flex items-center justify-between bg-[#0d1117]">
              {isAdmin && selectedUser.id !== currentUser?.id ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Account</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2.5">
                {isAdmin && (
                  <button
                    type="button"
                    onClick={(e) => handleOpenEdit(selectedUser, e)}
                    className="px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#b4e600]" />
                    <span>Edit Profile</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 bg-[#b4e600] hover:bg-[#cbf800] text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT STAKEHOLDER MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#161b22] text-[#f0f6fc] w-full max-w-md rounded-2xl shadow-2xl border border-[#30363d] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#30363d] flex items-center justify-between bg-[#0d1117]">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#b4e600]" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Update Stakeholder Profile</h3>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#161b22] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              {editFormError && (
                <div className="p-3 bg-red-950/50 border border-red-800/80 rounded-xl flex items-start gap-2.5 text-xs text-red-200">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>{editFormError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#0d1117] border border-[#30363d] text-white focus:outline-none focus:ring-2 focus:ring-[#b4e600] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#0d1117] border border-[#30363d] text-white focus:outline-none focus:ring-2 focus:ring-[#b4e600] transition-all font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">Role *</label>
                  <select
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#0d1117] border border-[#30363d] text-white focus:outline-none focus:ring-2 focus:ring-[#b4e600] transition-all"
                  >
                    <option value="House Holder">House Holder</option>
                    <option value="Engineer">Engineer</option>
                    <option value="Manager">Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#0d1117] border border-[#30363d] text-white focus:outline-none focus:ring-2 focus:ring-[#b4e600] transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">Title / Designation</label>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  placeholder="e.g. Lead Structural Consultant"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#0d1117] border border-[#30363d] text-white focus:outline-none focus:ring-2 focus:ring-[#b4e600] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Reset Password <span className="text-slate-500 font-normal lowercase">(leave blank to keep unchanged)</span>
                </label>
                <input
                  type="password"
                  value={editFormData.password}
                  onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#0d1117] border border-[#30363d] text-white focus:outline-none focus:ring-2 focus:ring-[#b4e600] transition-all font-mono"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-[#30363d] hover:bg-[#0d1117] text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 bg-[#b4e600] hover:bg-[#cbf800] text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isUpdating ? 'Saving...' : 'Update Stakeholder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW STAKEHOLDER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#161b22] text-[#f0f6fc] w-full max-w-md rounded-2xl shadow-2xl border border-[#30363d] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#30363d] flex items-center justify-between bg-[#0d1117]">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Register Platform Stakeholder</h3>
                <p className="text-xs text-slate-400">Administrator access: create credentials & role permissions</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#161b22] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-950/50 border border-red-800/80 rounded-xl flex items-start gap-2.5 text-xs text-red-200">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Eng. Samuel Bekele"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#0d1117] border border-[#30363d] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="stakeholder@domain.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#0d1117] border border-[#30363d] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600] transition-all font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">Platform Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#0d1117] border border-[#30363d] text-white focus:outline-none focus:ring-2 focus:ring-[#b4e600] transition-all"
                  >
                    <option value="House Holder">House Holder (Owner)</option>
                    <option value="Engineer">Site Engineer</option>
                    <option value="Manager">Operations Manager</option>
                    <option value="Admin">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+251 9..."
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#0d1117] border border-[#30363d] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600] transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">Title / Designation</label>
                <input
                  type="text"
                  placeholder="e.g., Senior Structural Engineer"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#0d1117] border border-[#30363d] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">Initial Password *</label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#0d1117] border border-[#30363d] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600] transition-all font-mono"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#30363d] hover:bg-[#0d1117] text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#b4e600] hover:bg-[#cbf800] text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Registering...' : 'Register User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponent: Modern Stakeholder Card
function UserCard({ user, roleConfig, onOpenDossier, onOpenEdit, isAdmin }) {
  const RoleIcon = roleConfig.icon;

  return (
    <div 
      onClick={() => onOpenDossier(user)}
      className="bg-[#161b22] p-5 rounded-2xl border border-[#30363d] shadow-lg flex flex-col justify-between hover:border-[#b4e600] hover:shadow-2xl transition-all cursor-pointer group relative overflow-hidden"
    >
      <div>
        {/* Top Header with Avatar & Badge */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div 
              className="w-11 h-11 rounded-xl text-white font-black text-sm flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform"
              style={{ backgroundColor: `${roleConfig.accentColor}25`, color: roleConfig.accentColor, border: `1px solid ${roleConfig.accentColor}50` }}
            >
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider group-hover:text-[#b4e600] transition-colors flex items-center gap-1.5">
                <span>{user.name}</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-[#b4e600]" />
              </h3>
              <p className="text-[11px] text-slate-400 font-mono truncate max-w-[180px]">
                {user.title || 'Platform Stakeholder'}
              </p>
            </div>
          </div>

          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${roleConfig.badgeClass} flex items-center gap-1`}>
            <RoleIcon className="w-3 h-3" />
            <span>{user.role}</span>
          </span>
        </div>

        {/* Contact Info */}
        <div className="space-y-1.5 text-xs text-slate-400 mt-4 pt-3 border-t border-[#30363d]/60 font-mono">
          <div className="flex items-center gap-2 text-slate-300">
            <Mail className="w-3.5 h-3.5 text-[#b4e600] flex-shrink-0" />
            <span className="truncate">{user.email}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Phone className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            <span>{user.phone || 'No phone recorded'}</span>
          </div>
        </div>
      </div>

      {/* Footer Details & Direct Actions */}
      <div className="mt-4 pt-3 border-t border-[#30363d] flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <span className="inline-flex items-center gap-1 text-[#b4e600] font-semibold text-[10px]">
          <FolderKanban className="w-3 h-3" />
          <span>{user.assigned_projects_count || 0} {Number(user.assigned_projects_count) === 1 ? 'Site' : 'Sites'}</span>
        </span>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {isAdmin && (
            <button
              type="button"
              onClick={(e) => onOpenEdit(user, e)}
              className="p-1 text-slate-400 hover:text-[#b4e600] rounded transition-colors"
              title="Edit Profile"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}
          <span 
            onClick={() => onOpenDossier(user)}
            className="text-slate-300 hover:text-[#b4e600] font-bold uppercase tracking-wider text-[10px] flex items-center gap-1 group-hover:underline cursor-pointer"
          >
            Dossier <ExternalLink className="w-2.5 h-2.5" />
          </span>
        </div>
      </div>
    </div>
  );
}

export default UsersPage;
