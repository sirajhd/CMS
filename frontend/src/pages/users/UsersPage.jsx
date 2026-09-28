import React, { useState, useEffect } from 'react';
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
  Shield
} from 'lucide-react';

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'Admin';
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredUsers = users.filter((u) =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadge = (role) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-950/60 text-purple-300 border-purple-500/40';
      case 'Engineer':
        return 'bg-amber-950/60 text-amber-300 border-amber-500/40';
      case 'Manager':
        return 'bg-sky-950/60 text-sky-300 border-sky-500/40';
      default:
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40';
    }
  };

  return (
    <div className="space-y-6 text-[#f0f6fc]">
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
          <h1 className="text-2xl font-black text-white tracking-wider uppercase">Stakeholders & User Directory</h1>
          <p className="text-xs text-slate-400 font-mono mt-1 uppercase">
            Manage site engineers, property owners, managers, and system administrators.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search users by name, role, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600] transition-all font-mono"
            />
          </div>

          {isAdmin && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#b4e600] hover:bg-[#cbf800] text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition-all flex-shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add New User</span>
            </button>
          )}
        </div>
      </div>

      {/* User Directory Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full py-16 text-center text-slate-400 text-xs font-mono animate-pulse uppercase tracking-wider">
            Loading stakeholders from database...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500 text-xs font-mono uppercase tracking-wider">
            No stakeholders found matching your query.
          </div>
        ) : (
          filteredUsers.map((u) => (
            <div 
              key={u.id}
              onClick={() => handleOpenUserDossier(u)}
              className="bg-[#161b22] p-5 rounded-2xl border border-[#30363d] shadow-xl flex flex-col justify-between hover:border-[#b4e600] hover:shadow-2xl transition-all cursor-pointer group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#b4e600] text-black font-black text-sm flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
                      {u.avatar || u.name?.[0] || 'U'}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider group-hover:text-[#b4e600] transition-colors flex items-center gap-1.5">
                        <span>{u.name}</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-[#b4e600]" />
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono">{u.title || 'Platform Stakeholder'}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getRoleBadge(u.role)}`}>
                    {u.role}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-400 mt-4 pt-3 border-t border-[#30363d]/60 font-mono">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Mail className="w-3.5 h-3.5 text-[#b4e600] flex-shrink-0" />
                    <span className="truncate text-slate-300">{u.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Phone className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    <span>{u.phone || 'No phone recorded'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#30363d] flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span className="text-slate-500 text-[10px]">UUID: {u.id.substring(0, 8)}...</span>
                <span className="text-[#b4e600] font-black uppercase tracking-wider text-[11px] flex items-center gap-1 group-hover:underline">
                  View Profile <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FULL USER DOSSIER MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#161b22] text-[#f0f6fc] w-full max-w-2xl rounded-2xl shadow-2xl border border-[#30363d] overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#30363d] flex items-center justify-between bg-[#0d1117]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#b4e600] text-black font-black text-base flex items-center justify-center shadow-lg">
                  {selectedUser.avatar || selectedUser.name?.[0] || 'U'}
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

              {/* Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-[#0d1117] rounded-xl border border-[#30363d] space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono font-bold tracking-wider block">Email Address</span>
                  <div className="flex items-center gap-2 text-xs font-bold text-white font-mono">
                    <Mail className="w-3.5 h-3.5 text-[#b4e600]" />
                    <span>{selectedUser.email}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-[#0d1117] rounded-xl border border-[#30363d] space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono font-bold tracking-wider block">Phone Contact</span>
                  <div className="flex items-center gap-2 text-xs font-bold text-white font-mono">
                    <Phone className="w-3.5 h-3.5 text-[#b4e600]" />
                    <span>{selectedUser.phone || 'No phone number on record'}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-[#0d1117] rounded-xl border border-[#30363d] space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono font-bold tracking-wider block">System Role & Clearance</span>
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Shield className="w-3.5 h-3.5 text-[#b4e600]" />
                    <span>{selectedUser.role}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-[#0d1117] rounded-xl border border-[#30363d] space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono font-bold tracking-wider block">Platform User ID</span>
                  <div className="text-xs font-bold text-slate-300 font-mono truncate" title={selectedUser.id}>
                    {selectedUser.id}
                  </div>
                </div>

                <div className="p-3.5 bg-[#0d1117] rounded-xl border border-[#30363d] space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono font-bold tracking-wider block">Designation / Specialization</span>
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Briefcase className="w-3.5 h-3.5 text-[#b4e600]" />
                    <span>{selectedUser.title || 'Platform Stakeholder'}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-[#0d1117] rounded-xl border border-[#30363d] space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono font-bold tracking-wider block">Registration Timestamp</span>
                  <div className="flex items-center gap-2 text-xs font-bold text-white font-mono">
                    <Calendar className="w-3.5 h-3.5 text-[#b4e600]" />
                    <span>{selectedUser.createdAt ? formatDate(selectedUser.createdAt) : 'Registered Member'}</span>
                  </div>
                </div>
              </div>

              {/* Assigned Construction Projects Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#b4e600]" />
                    <span>Assigned Construction Projects</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono uppercase">
                    {selectedUser.assignedProjects?.length || 0} Sites Active
                  </span>
                </div>

                {isLoadingDetails ? (
                  <div className="p-6 text-center text-xs text-slate-500 font-mono animate-pulse uppercase">
                    Querying assigned project sites...
                  </div>
                ) : !selectedUser.assignedProjects || selectedUser.assignedProjects.length === 0 ? (
                  <div className="p-6 bg-[#0d1117] border border-[#30363d] rounded-xl text-center text-xs text-slate-400 font-mono">
                    No construction sites currently assigned to this stakeholder.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {selectedUser.assignedProjects.map((p) => (
                      <div 
                        key={p.id}
                        onClick={() => {
                          setSelectedUser(null);
                          navigate(`/projects/${p.id}`);
                        }}
                        className="p-3.5 bg-[#0d1117] border border-[#30363d] hover:border-[#b4e600] rounded-xl flex items-center justify-between transition-colors cursor-pointer group"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs group-hover:text-[#b4e600] transition-colors">{p.name}</span>
                            <span className="text-[10px] font-mono px-2 py-0.2 bg-[#161b22] border border-[#30363d] rounded text-slate-300">
                              {p.status || 'Active'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono">{p.location}</p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right hidden sm:block font-mono">
                            <span className="text-[10px] text-slate-400 block uppercase">Execution</span>
                            <span className="text-xs font-bold text-[#b4e600]">{p.progress || 0}%</span>
                          </div>
                          <span className="p-1.5 bg-[#161b22] border border-[#30363d] group-hover:border-[#b4e600] group-hover:text-[#b4e600] rounded-lg transition-colors text-slate-400">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="px-6 py-4 border-t border-[#30363d] flex flex-wrap items-center justify-between gap-3 bg-[#0d1117]">
              {isAdmin ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                    disabled={selectedUser.id === currentUser?.id}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    title={selectedUser.id === currentUser?.id ? 'Cannot delete current logged in admin' : 'Delete user'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete User</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(selectedUser)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-white border border-[#30363d] text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#b4e600]" />
                    <span>Edit Profile</span>
                  </button>
                </div>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 border border-[#30363d] hover:bg-[#161b22] text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer uppercase tracking-wider"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT USER PROFILE MODAL */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#161b22] text-[#f0f6fc] w-full max-w-md rounded-2xl shadow-2xl border border-[#30363d] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#30363d] flex items-center justify-between bg-[#0d1117]">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Edit Stakeholder Profile</h3>
                <p className="text-xs text-slate-400 font-mono">Modifying details for {selectedUser.name}</p>
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
                <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl flex items-start gap-2.5 text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>{editFormError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Email Address *</label>
                <input
                  type="email"
                  required
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">System Role *</label>
                  <select
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-white focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600]"
                  >
                    <option value="Engineer" className="bg-[#161b22] text-white">Site Engineer</option>
                    <option value="House Holder" className="bg-[#161b22] text-white">House Holder</option>
                    <option value="Manager" className="bg-[#161b22] text-white">Operations Manager</option>
                    <option value="Admin" className="bg-[#161b22] text-white">System Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+251 911 000000"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Job Title / Specialty</label>
                <input
                  type="text"
                  placeholder="e.g., Senior Lead Architect"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Update Password <span className="text-[10px] text-slate-500 lowercase">(leave blank to keep unchanged)</span>
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={editFormData.password}
                  onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
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
                  className="px-5 py-2 bg-[#b4e600] hover:bg-[#cbf800] text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isUpdating ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW USER MODAL */}
      {isAdmin && isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#161b22] text-[#f0f6fc] w-full max-w-md rounded-2xl shadow-2xl border border-[#30363d] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#30363d] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Create Stakeholder Profile</h3>
                <p className="text-xs text-slate-400">Register new engineer, house holder, or operations manager</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#0d1117] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl flex items-start gap-2.5 text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Dawit Getachew"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g., dawit@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">System Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-white focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600]"
                  >
                    <option value="Engineer" className="bg-[#161b22] text-white">Site Engineer</option>
                    <option value="House Holder" className="bg-[#161b22] text-white">House Holder</option>
                    <option value="Manager" className="bg-[#161b22] text-white">Operations Manager</option>
                    <option value="Admin" className="bg-[#161b22] text-white">System Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+251 911 000000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Job Title / Specialty</label>
                <input
                  type="text"
                  placeholder="e.g., Senior Structural Engineer"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Initial Password</label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
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
                  className="px-5 py-2 bg-[#b4e600] hover:bg-[#cbf800] text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
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

export default UsersPage;
