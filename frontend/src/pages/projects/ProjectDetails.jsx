import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Table } from '../../components/common/Table';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { projectService } from '../../services/projectService';
import { requestService } from '../../services/requestService';
import { paymentService } from '../../services/paymentService';
import { materialService } from '../../services/materialService';
import { userService } from '../../services/userService';
import { documentService } from '../../services/documentService';
import { UploadDocumentModal } from '../../components/documents/UploadDocumentModal';
import { EditProjectModal } from '../../components/projects/EditProjectModal';
import { DeleteProjectModal } from '../../components/projects/DeleteProjectModal';
import { useAuth } from '../../context/AuthContext';
import { activityService } from '../../services/activityService';
import { 
  Building2, 
  MapPin, 
  Calendar, 
  HardHat, 
  Layers, 
  User, 
  ArrowLeft, 
  FileText, 
  CreditCard, 
  Truck, 
  Activity,
  ShieldAlert,
  Users,
  UserPlus,
  Trash2,
  Edit3,
  Mail,
  Phone,
  CheckCircle2,
  UserCheck,
  Plus,
  Briefcase,
  Lock,
  FileUp,
  Download
} from 'lucide-react';

export function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [requests, setRequests] = useState([]);
  const [payments, setPayments] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [activityFilter, setActivityFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [isAccessDenied, setIsAccessDenied] = useState(false);
  const [isUploadDocOpen, setIsUploadDocOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Stakeholder management state
  const [systemUsers, setSystemUsers] = useState([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignMode, setAssignMode] = useState('existing'); // 'existing' | 'new'
  const [isSubmittingStakeholder, setIsSubmittingStakeholder] = useState(false);
  const [stakeholderFeedback, setStakeholderFeedback] = useState(null);

  const [existingUserForm, setExistingUserForm] = useState({
    userId: '',
    projectRole: '',
    isPrimary: false,
  });

  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'House Holder',
    projectRole: 'Property Owner',
    password: '',
    isPrimary: false,
  });

  useEffect(() => {
    async function loadProjectData() {
      if (!user) return;
      setLoading(true);
      setIsAccessDenied(false);

      try {
        let targetId = id;
        if (!targetId) {
          const userProjects = await projectService.getProjectsForUser(user);
          if (!userProjects || userProjects.length === 0) {
            setProject(null);
            setLoading(false);
            return;
          }
          targetId = userProjects[0].id;
        }

        const proj = await projectService.getProjectById(targetId, user);
        if (!proj) {
          setProject(null);
          setLoading(false);
          return;
        }

        setProject(proj);

        // Fetch related operations data in parallel with safe fallbacks
        try {
          const [reqs, pays, mats, docs, acts] = await Promise.all([
            requestService.getRequestsByProject(targetId).catch(() => []),
            paymentService.getPaymentsByProject(targetId).catch(() => []),
            materialService.getMaterialsByProject(targetId).catch(() => []),
            documentService.getDocumentsByProject(targetId).catch(() => []),
            activityService.getActivitiesByProject(targetId).catch(() => []),
          ]);

          setRequests(reqs || []);
          setPayments(pays || []);
          setMaterials(mats || []);
          setDocuments(docs || []);
          setActivities(acts || []);
        } catch (subErr) {
          console.warn('Failed to load related project sub-resources:', subErr);
        }
      } catch (err) {
        console.error('Error loading project dossier:', err);
        if (
          err.message?.includes('Access Denied') || 
          err.message === 'UNAUTHORIZED_SITE_ACCESS' || 
          err.status === 403
        ) {
          setIsAccessDenied(true);
        } else {
          setProject(null);
        }
      } finally {
        setLoading(false);
      }
    }
    loadProjectData();
  }, [id, user]);

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 text-sm font-mono animate-pulse uppercase tracking-wider">
        Verifying site security credentials & loading dossier...
      </div>
    );
  }

  if (isAccessDenied) {
    return (
      <div className="p-8 bg-[#161b22] rounded-2xl border border-rose-500/40 text-center max-w-lg mx-auto space-y-4 mt-10 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-base font-black text-white uppercase tracking-wider">
          Access Denied: Restricted Construction Site
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed font-mono">
          You are not an assigned stakeholder for this construction site.
          Only the assigned Property Owner, Lead Engineer, Site Manager, or Master Admin can access this site dossier.
        </p>
        <div className="pt-2">
          <Button variant="outline" size="sm" icon={ArrowLeft} onClick={() => navigate(-1)}>
            Return to Authorized Workspace
          </Button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-12 text-center space-y-4 bg-[#161b22] rounded-2xl border border-[#30363d] max-w-md mx-auto mt-12 shadow-2xl">
        <div className="w-12 h-12 rounded-xl bg-[#0d1117] border border-[#30363d] flex items-center justify-center mx-auto text-slate-400">
          <Building2 className="w-6 h-6 text-[#b4e600]" />
        </div>
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-wider">Construction Site Not Found</h3>
          <p className="text-xs text-slate-400 font-mono mt-1">
            The requested project ID does not exist or has been archived.
          </p>
        </div>
        <Button variant="outline" size="sm" icon={ArrowLeft} onClick={() => navigate(-1)}>
          Return to Sites Directory
        </Button>
      </div>
    );
  }

  const handleOpenAssignModal = async () => {
    try {
      const all = await userService.getAllUsers();
      setSystemUsers(all);
      if (all.length > 0) {
        setExistingUserForm((prev) => ({
          ...prev,
          userId: prev.userId || all[0].id,
          projectRole: prev.projectRole || all[0].title || all[0].role,
        }));
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    }
    setIsAssignModalOpen(true);
  };

  const handleAssignExistingUser = async (e) => {
    e.preventDefault();
    if (!existingUserForm.userId) return;
    setIsSubmittingStakeholder(true);
    try {
      const selectedUser = systemUsers.find((u) => u.id === existingUserForm.userId);
      const result = await projectService.assignUserToProject(project.id, {
        userId: existingUserForm.userId,
        projectRole: existingUserForm.projectRole || selectedUser?.title || selectedUser?.role,
        isPrimary: existingUserForm.isPrimary,
        isNewUser: false,
      });
      setProject(result.project);
      setIsAssignModalOpen(false);
      setStakeholderFeedback({
        type: 'success',
        message: `${result.user.name} has been assigned to ${project.name} successfully!`,
      });
      setTimeout(() => setStakeholderFeedback(null), 4000);
      setExistingUserForm({ userId: '', projectRole: '', isPrimary: false });
    } catch (err) {
      alert(err.message || 'Failed to assign stakeholder');
    } finally {
      setIsSubmittingStakeholder(false);
    }
  };

  const handleAssignNewUser = async (e) => {
    e.preventDefault();
    if (!newUserForm.name || !newUserForm.email) return;
    setIsSubmittingStakeholder(true);
    try {
      const result = await projectService.assignUserToProject(project.id, {
        name: newUserForm.name,
        email: newUserForm.email,
        phone: newUserForm.phone,
        role: newUserForm.role,
        projectRole: newUserForm.projectRole || newUserForm.role,
        password: newUserForm.password || undefined,
        isPrimary: newUserForm.isPrimary,
        isNewUser: true,
      });
      setProject(result.project);
      setIsAssignModalOpen(false);
      setStakeholderFeedback({
        type: 'success',
        message: `New stakeholder ${result.user.name} was registered and assigned to ${project.name}!`,
      });
      setTimeout(() => setStakeholderFeedback(null), 4000);
      setNewUserForm({
        name: '',
        email: '',
        phone: '',
        role: 'House Holder',
        projectRole: 'Property Owner',
        password: '',
        isPrimary: false,
      });
    } catch (err) {
      alert(err.message || 'Failed to register and assign user');
    } finally {
      setIsSubmittingStakeholder(false);
    }
  };

  const handleRemoveStakeholder = async (userId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from this project?`)) {
      return;
    }
    try {
      const updated = await projectService.removeUserFromProject(project.id, userId);
      setProject(updated);
      setStakeholderFeedback({
        type: 'success',
        message: `${memberName} has been unassigned from this construction site.`,
      });
      setTimeout(() => setStakeholderFeedback(null), 4000);
    } catch (err) {
      alert(err.message || 'Failed to remove user');
    }
  };

  const isProjectMember = Boolean(
    user?.role === 'Admin' ||
    (project && (
      project.houseHolderId === user?.id ||
      project.engineerId === user?.id ||
      project.managerId === user?.id ||
      (project.assignedUsers && project.assignedUsers.some((u) => u.userId === user?.id || u.id === user?.id))
    ))
  );

  const assignedStakeholders = (project.assignedUsers && project.assignedUsers.length > 0)
    ? project.assignedUsers
    : [
        {
          userId: project.houseHolderId,
          name: project.houseHolderName,
          role: 'House Holder',
          projectRole: 'Property Owner',
          email: 'householder@example.com',
          phone: '+251 92 234 5678',
          isPrimary: true,
          assignedAt: project.startDate,
        },
        {
          userId: project.engineerId,
          name: project.engineerName,
          role: 'Engineer',
          projectRole: 'Lead Structural Engineer',
          email: 'engineer@example.com',
          phone: '+251 93 345 6789',
          isPrimary: true,
          assignedAt: project.startDate,
        },
        {
          userId: project.managerId,
          name: project.managerName,
          role: 'Manager',
          projectRole: 'Site Operations Manager',
          email: 'manager@example.com',
          phone: '+251 94 456 7890',
          isPrimary: true,
          assignedAt: project.startDate,
        },
      ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'stakeholders', label: `Stakeholders (${assignedStakeholders.length})`, icon: Users },
    { id: 'requests', label: `Requests (${requests.length})`, icon: FileText },
    { id: 'documents', label: `Documents (${documents.length})`, icon: FileText },
    { id: 'payments', label: `Payments (${payments.length})`, icon: CreditCard },
    { id: 'materials', label: `Materials (${materials.length})`, icon: Truck },
    { id: 'activities', label: `Timeline (${activities.length})`, icon: Activity },
  ];

  return (
    <div className="space-y-6 text-[#f0f6fc]">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Directory
          </button>
          <div className="flex items-center gap-2.5">
            {(user?.role === 'Admin' || user?.role === 'Manager') && (
              <Button
                variant="outline"
                size="sm"
                icon={Edit3}
                onClick={() => setIsEditModalOpen(true)}
              >
                Edit Site Dossier
              </Button>
            )}
            {user?.role === 'Admin' && (
              <Button
                variant="danger"
                size="sm"
                icon={Trash2}
                onClick={() => setIsDeleteModalOpen(true)}
              >
                Delete Site
              </Button>
            )}
            <StatusBadge status={project.status} />
          </div>
        </div>

        {/* Project Header */}
        <div className="bg-[#161b22] p-6 rounded-2xl border border-[#30363d] shadow-md space-y-5 text-[#f0f6fc]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-mono text-[#b4e600] font-black uppercase tracking-wider block mb-1">
                Site ID: {project.id}
              </span>
              <h1 className="text-2xl font-black text-white uppercase tracking-tight">{project.name}</h1>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>{project.location}</span>
                <span>•</span>
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Target Completion: {formatDate(project.expectedCompletion)}</span>
              </div>
            </div>

            <div className="bg-[#0d1117] p-4 rounded-xl border border-[#30363d] min-w-56 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Milestone Progress:</span>
                <span className="font-black text-[#b4e600] text-sm">{project.progress}%</span>
              </div>
              <div className="w-full bg-[#161b22] border border-[#30363d] rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-[#b4e600] h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${project.progress}%` }} 
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#30363d] flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs flex-1">
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#0d1117] border border-[#30363d]">
                <div className="w-8 h-8 rounded-lg bg-[#b4e600]/10 text-[#b4e600] border border-[#b4e600]/30 flex items-center justify-center font-black">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Property Owner</span>
                  <span className="font-bold text-white">{project.houseHolderName || '—'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#0d1117] border border-[#30363d]">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black">
                  <HardHat className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Lead Engineer</span>
                  <span className="font-bold text-white">{project.engineerName || '—'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#0d1117] border border-[#30363d]">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/30 flex items-center justify-center font-black">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Operations Manager</span>
                  <span className="font-bold text-white">{project.managerName || '—'}</span>
                </div>
              </div>
            </div>

            {user?.role === 'Admin' && (
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="sm"
                  icon={UserPlus}
                  onClick={handleOpenAssignModal}
                >
                  Assign Stakeholder
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Strip */}
        <div className="flex items-center gap-2 border-b border-[#30363d] overflow-x-auto pb-1 text-xs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#b4e600] text-black font-black shadow-md'
                    : 'text-slate-400 hover:bg-[#161b22] hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 stroke-[2.5]" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card title="Scope & Construction Blueprint" subtitle="Technical specifications">
                <p className="text-xs text-slate-300 leading-relaxed">
                  {project.description || 'Standard residential reinforced concrete structure adhering to Ethiopian building codes.'}
                </p>
              </Card>

              <Card title="Milestone Financial Summary" subtitle="Total contracted budget vs. disbursements">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-[#0d1117] rounded-xl border border-[#30363d] space-y-1">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Total Authorized Budget:</span>
                    <p className="text-xl font-black text-white">{formatCurrency(project.totalBudget)}</p>
                  </div>
                  <div className="p-4 bg-[#0d1117] rounded-xl border border-[#30363d] space-y-1">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Total Capital Disbursed:</span>
                    <p className="text-xl font-black text-[#b4e600]">{formatCurrency(project.spentBudget)}</p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card title="Site Logistics & Dates" subtitle="Timeline schedule">
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Start Date:</span>
                    <span className="font-semibold text-white">{formatDate(project.startDate)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Projected Handover:</span>
                    <span className="font-semibold text-white">{formatDate(project.expectedCompletion)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Municipality Location:</span>
                    <span className="font-medium text-slate-300">{project.location}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Stakeholder Action Banner / Feedback */}
        {stakeholderFeedback && (
          <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{stakeholderFeedback.message}</span>
          </div>
        )}

        {/* Tab: Stakeholders & Team */}
        {activeTab === 'stakeholders' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wider">Project Stakeholders & Site Team</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Authorized personnel, consulting engineers, client representatives, and site supervisors for {project.name}.
                </p>
              </div>
              {user?.role === 'Admin' && (
                <Button
                  variant="primary"
                  size="md"
                  icon={UserPlus}
                  onClick={handleOpenAssignModal}
                >
                  Assign / Register Stakeholder
                </Button>
              )}
            </div>

            <Card
              title={`Authorized Site Roster (${assignedStakeholders.length})`}
              subtitle="All stakeholders authorized to inspect, operate, or administer this construction site"
            >
              <Table
                columns={[
                  { header: 'Stakeholder' },
                  { header: 'Project Role / Title' },
                  { header: 'System Role' },
                  { header: 'Contact Details' },
                  { header: 'Assigned Date' },
                  ...(user?.role === 'Admin' ? [{ header: 'Actions' }] : []),
                ]}
                data={assignedStakeholders}
                keyExtractor={(s, idx) => s.userId || `stakeholder-${idx}`}
                renderRow={(s) => (
                  <>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#b4e600] text-black font-black text-xs flex items-center justify-center">
                          {(s.name || 'U').split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white block">{s.name}</span>
                            {s.isPrimary && (
                              <span className="text-[9px] font-bold uppercase bg-[#b4e600]/20 text-[#b4e600] px-1.5 py-0.5 rounded border border-[#b4e600]/40">
                                Primary Lead
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">{s.userId || '—'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-200 text-xs">
                        {s.projectRole || s.title || s.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        s.role === 'Admin'
                          ? 'bg-purple-950/60 text-purple-300 border-purple-500/40'
                          : s.role === 'House Holder'
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                          : s.role === 'Engineer'
                          ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                          : 'bg-sky-950/60 text-sky-300 border-sky-500/40'
                      }`}>
                        {s.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs space-y-0.5">
                      {s.email && (
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Mail className="w-3 h-3 text-slate-500" />
                          <span>{s.email}</span>
                        </div>
                      )}
                      {s.phone && (
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{s.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-xs font-mono">
                      {formatDate(s.assignedAt || project.startDate)}
                    </td>
                    {user?.role === 'Admin' && (
                      <td className="py-3 px-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Trash2}
                          className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/40"
                          onClick={() => handleRemoveStakeholder(s.userId, s.name)}
                          title="Remove stakeholder from project"
                        >
                          Remove
                        </Button>
                      </td>
                    )}
                  </>
                )}
              />
            </Card>
          </div>
        )}

        {/* Tab 2: Requests */}
        {activeTab === 'requests' && (
          <Card title="Site Technical Requests" subtitle="Filtered strictly to this site">
            <Table
              columns={[
                { header: 'Request Title' },
                { header: 'Type' },
                { header: 'Amount' },
                { header: 'Submitted By' },
                { header: 'Date' },
                { header: 'Status' },
              ]}
              data={requests}
              keyExtractor={(r) => r.id}
              renderRow={(r) => (
                <>
                  <td className="py-3 px-4 font-bold text-white">{r.title}</td>
                  <td className="py-3 px-4 text-slate-400">{r.type}</td>
                  <td className="py-3 px-4 font-black text-[#b4e600]">
                    {r.amount > 0 ? formatCurrency(r.amount) : '—'}
                  </td>
                  <td className="py-3 px-4 text-slate-300">{r.submittedBy}</td>
                  <td className="py-3 px-4 text-slate-400">{formatDate(r.submittedDate || r.createdAt)}</td>
                  <td className="py-3 px-4"><StatusBadge status={r.status} /></td>
                </>
              )}
            />
          </Card>
        )}

        {/* Tab 3: Documents */}
        {activeTab === 'documents' && (
          <Card 
            title="Site Document Repository" 
            subtitle="Engineering blueprints, structural calculations, permits & compliance archives for this site"
            headerAction={
              isProjectMember ? (
                <Button
                  variant="primary"
                  size="sm"
                  icon={FileUp}
                  onClick={() => setIsUploadDocOpen(true)}
                >
                  Upload Site Document
                </Button>
              ) : (
                <span className="text-[11px] font-mono text-slate-400 bg-[#0d1117] border border-[#30363d] px-2.5 py-1 rounded-lg">
                  Read-Only Site Access
                </span>
              )
            }
          >
            {documents.length === 0 ? (
              <div className="py-12 text-center space-y-3 bg-[#0d1117] rounded-xl border border-dashed border-[#30363d]">
                <div className="w-12 h-12 rounded-xl bg-[#161b22] border border-[#30363d] flex items-center justify-center mx-auto text-slate-400">
                  <FileText className="w-6 h-6 text-[#b4e600]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white uppercase tracking-wider">No Site Documents Uploaded</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {isProjectMember 
                      ? "Upload engineering blueprints, structural permits, or site contracts for this project."
                      : "No technical or compliance documents have been archived for this project yet."}
                  </p>
                </div>
                {isProjectMember && (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={FileUp}
                    onClick={() => setIsUploadDocOpen(true)}
                  >
                    Upload First Document
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {documents.map((doc) => (
                  <div 
                    key={doc.id} 
                    className="p-3.5 bg-[#0d1117] border border-[#30363d] rounded-xl flex items-start justify-between text-xs hover:border-[#b4e600]/40 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-[#b4e600]/10 text-[#b4e600] border border-[#b4e600]/30 rounded-lg mt-0.5">
                        <FileText className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <div>
                        <p className="font-bold text-white">{doc.name || doc.title}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          <span className="text-[#b4e600] font-mono">{doc.category || doc.type}</span> • {doc.size} • Uploaded by {doc.uploadedBy}
                        </p>
                        {doc.uploadedAt && (
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {formatDate(doc.uploadedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={doc.status || 'Approved'} />
                      {doc.url && (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-[#161b22] border border-[#30363d] text-slate-400 hover:text-white hover:border-[#b4e600]/50 transition-colors cursor-pointer"
                          title="Download / View Document"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Tab 4: Payments */}
        {activeTab === 'payments' && (
          <Card title="Disbursement Ledger & Financial Payouts" subtitle="Milestone tranches & settled expenses for this construction site">
            <Table
              columns={[
                { header: 'Milestone Item' },
                { header: 'Base Amount' },
                { header: 'Extra Expenses' },
                { header: 'Total Disbursed' },
                { header: 'Bank & Reference' },
                { header: 'Receipt Slip' },
                { header: 'Status' },
              ]}
              data={payments}
              keyExtractor={(p) => p.id}
              renderRow={(p) => {
                const baseAmt = Number(p.approvedAmount || p.requestedAmount || 0);
                const extraAmt = Number(p.additionalExpenses || 0);
                const totalAmt = Number(p.totalAmount || (baseAmt + extraAmt));

                return (
                  <>
                    <td className="py-3 px-4 font-bold text-white">
                      <div>{p.requestTitle}</div>
                      {p.notes && <div className="text-[10px] text-slate-400 mt-0.5">{p.notes}</div>}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-200">
                      {formatCurrency(baseAmt)}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono">
                      {extraAmt > 0 ? (
                        <div>
                          <span className="text-amber-400 font-bold">+{formatCurrency(extraAmt)}</span>
                          {p.expensesNotes && (
                            <div className="text-[9px] text-slate-400 truncate max-w-[120px]">
                              {p.expensesNotes}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-black text-[#b4e600] font-mono">
                      {formatCurrency(totalAmt)}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <div className="font-semibold text-white">{p.bankName || p.paymentMethod || 'Bank Transfer'}</div>
                      <div className="font-mono text-[10px] text-sky-400 mt-0.5">{p.paymentReference || '—'}</div>
                    </td>
                    <td className="py-3 px-4">
                      {p.receiptDocUrl ? (
                        <a
                          href={p.receiptDocUrl.startsWith('http') ? p.receiptDocUrl : `http://localhost:5000${p.receiptDocUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#b4e600] hover:text-[#cbf800] underline"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Receipt</span>
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">None</span>
                      )}
                    </td>
                    <td className="py-3 px-4"><StatusBadge status={p.status} /></td>
                  </>
                );
              }}
            />
          </Card>
        )}

        {/* Tab 5: Materials */}
        {activeTab === 'materials' && (
          <Card title="Site Requisitions & Deliveries" subtitle="Logistics for this site">
            <Table
              columns={[
                { header: 'Material' },
                { header: 'Quantity' },
                { header: 'Est. Cost' },
                { header: 'Delivery Status' },
              ]}
              data={materials}
              keyExtractor={(m) => m.id}
              renderRow={(m) => (
                <>
                  <td className="py-3 px-4 font-bold text-white">{m.materialName}</td>
                  <td className="py-3 px-4 font-semibold text-slate-300">{m.quantity} {m.unit}</td>
                  <td className="py-3 px-4 text-[#b4e600] font-black">{formatCurrency(m.estimatedCost)}</td>
                  <td className="py-3 px-4"><StatusBadge status={m.deliveryStatus} /></td>
                </>
              )}
            />
          </Card>
        )}

        {/* Tab 6: Timeline */}
        {activeTab === 'activities' && (
          <Card 
            title="Site Audit Trail & Event Timeline" 
            subtitle="Chronological log tracking approvals, disbursements, materials, blueprints & site milestones for this site"
            headerAction={
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {[
                  { id: 'all', label: 'All Events' },
                  { id: 'request', label: 'Requests' },
                  { id: 'payment', label: 'Disbursements' },
                  { id: 'material', label: 'Logistics' },
                  { id: 'document', label: 'Documents' },
                  { id: 'site_milestone', label: 'Milestones' },
                ].map((filter) => {
                  const count = filter.id === 'all' 
                    ? activities.length 
                    : activities.filter((a) => a.category === filter.id).length;
                  const isActive = activityFilter === filter.id;
                  return (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setActivityFilter(filter.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#b4e600] text-black font-black'
                          : 'bg-[#0d1117] text-slate-400 hover:text-white border border-[#30363d]'
                      }`}
                    >
                      {filter.label} ({count})
                    </button>
                  );
                })}
              </div>
            }
          >
            {activities.length === 0 ? (
              <div className="py-12 text-center space-y-3 bg-[#0d1117] rounded-xl border border-dashed border-[#30363d]">
                <div className="w-12 h-12 rounded-xl bg-[#161b22] border border-[#30363d] flex items-center justify-center mx-auto text-slate-400">
                  <Activity className="w-6 h-6 text-[#b4e600]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white uppercase tracking-wider">No Activity Logged for this Site</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    Actions such as submitting technical requests, approving tranches, material requisitions, and document uploads will be automatically recorded here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#30363d]">
                {activities
                  .filter((act) => activityFilter === 'all' || act.category === activityFilter)
                  .map((act) => {
                    const getCategoryStyle = () => {
                      switch (act.category) {
                        case 'request':
                          return {
                            dotBg: 'bg-amber-400',
                            badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                            icon: FileText,
                          };
                        case 'payment':
                          return {
                            dotBg: 'bg-emerald-400',
                            badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                            icon: CreditCard,
                          };
                        case 'material':
                          return {
                            dotBg: 'bg-sky-400',
                            badgeBg: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
                            icon: Truck,
                          };
                        case 'document':
                          return {
                            dotBg: 'bg-purple-400',
                            badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
                            icon: FileText,
                          };
                        case 'site_milestone':
                        default:
                          return {
                            dotBg: 'bg-[#b4e600]',
                            badgeBg: 'bg-[#b4e600]/10 text-[#b4e600] border-[#b4e600]/30',
                            icon: Building2,
                          };
                      }
                    };

                    const style = getCategoryStyle();
                    const CatIcon = style.icon;

                    return (
                      <div key={act.id} className="relative group text-xs">
                        {/* Timeline Node */}
                        <div
                          className={`absolute -left-6 top-3 w-3 h-3 rounded-full ${style.dotBg} ring-4 ring-[#161b22]`}
                        />

                        <div className="p-4 bg-[#0d1117] rounded-xl border border-[#30363d] group-hover:border-[#b4e600]/40 transition-colors space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-black text-white">{act.actor}</span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#161b22] border border-[#30363d] text-slate-300">
                                {act.role}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1 ${style.badgeBg}`}
                              >
                                <CatIcon className="w-3 h-3" />
                                {act.category?.replace('_', ' ')}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {formatDateTime(act.timestamp)}
                            </span>
                          </div>

                          <div>
                            <p className="text-white font-bold">{act.action}</p>
                            <p className="text-slate-300 text-xs mt-0.5 leading-relaxed">{act.target}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </Card>
        )}

        {/* Modal: Assign or Register Stakeholder */}
        <Modal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          title={`Assign Stakeholder to ${project.name}`}
          subtitle="Choose an existing platform user or register a brand-new user specifically for this site."
          maxWidth="max-w-lg"
        >
          <div className="space-y-5">
            {/* Mode Switcher */}
            <div className="flex rounded-xl bg-[#0d1117] border border-[#30363d] p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setAssignMode('existing')}
                className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  assignMode === 'existing'
                    ? 'bg-[#b4e600] text-black font-black shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                Select Existing User
              </button>
              <button
                type="button"
                onClick={() => setAssignMode('new')}
                className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  assignMode === 'new'
                    ? 'bg-[#b4e600] text-black font-black shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Register New User
              </button>
            </div>

            {/* Mode 1: Existing User */}
            {assignMode === 'existing' && (
              <form onSubmit={handleAssignExistingUser} className="space-y-4">
                <Select
                  label="Select Platform User"
                  value={existingUserForm.userId}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const found = systemUsers.find((u) => u.id === selectedId);
                    setExistingUserForm((prev) => ({
                      ...prev,
                      userId: selectedId,
                      projectRole: found?.title || found?.role || '',
                    }));
                  }}
                  options={systemUsers.map((u) => ({
                    value: u.id,
                    label: `${u.name} (${u.role}) — ${u.email}`,
                  }))}
                  required
                />

                <Input
                  label="Project Role / Specific Responsibility"
                  value={existingUserForm.projectRole}
                  onChange={(e) =>
                    setExistingUserForm((prev) => ({ ...prev, projectRole: e.target.value }))
                  }
                  placeholder="e.g. Lead Structural Engineer, Co-Owner, Site Inspector"
                  icon={Briefcase}
                  required
                />

                <div className="flex items-center gap-2 p-3 bg-[#0d1117] rounded-xl border border-[#30363d]">
                  <input
                    type="checkbox"
                    id="isPrimaryExisting"
                    checked={existingUserForm.isPrimary}
                    onChange={(e) =>
                      setExistingUserForm((prev) => ({ ...prev, isPrimary: e.target.checked }))
                    }
                    className="rounded border-[#30363d] text-[#b4e600] focus:ring-[#b4e600] h-4 w-4 bg-[#161b22]"
                  />
                  <label htmlFor="isPrimaryExisting" className="text-xs text-slate-300 cursor-pointer">
                    Set as <strong className="text-white">Primary Site Lead</strong> (Updates designated site lead card)
                  </label>
                </div>

                <div className="pt-3 border-t border-[#30363d] flex items-center justify-end gap-3">
                  <Button variant="outline" size="sm" onClick={() => setIsAssignModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    icon={UserCheck}
                    isLoading={isSubmittingStakeholder}
                  >
                    Assign Stakeholder
                  </Button>
                </div>
              </form>
            )}

            {/* Mode 2: Register New User On-The-Fly */}
            {assignMode === 'new' && (
              <form onSubmit={handleAssignNewUser} className="space-y-4">
                <Input
                  label="Full Name"
                  required
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  placeholder="e.g. Samuel Bekele"
                  icon={User}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Email Address"
                    type="email"
                    required
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    placeholder="samuel@example.com"
                    icon={Mail}
                  />

                  <Input
                    label="Phone Number"
                    value={newUserForm.phone}
                    onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                    placeholder="+251 91 234 5678"
                    icon={Phone}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Platform Role"
                    value={newUserForm.role}
                    onChange={(e) => {
                      const newRole = e.target.value;
                      let defaultProjRole = 'Property Owner';
                      if (newRole === 'Engineer') defaultProjRole = 'Lead Structural Engineer';
                      if (newRole === 'Manager') defaultProjRole = 'Site Operations Manager';
                      setNewUserForm((prev) => ({
                        ...prev,
                        role: newRole,
                        projectRole: defaultProjRole,
                      }));
                    }}
                    options={[
                      { value: 'House Holder', label: 'House Holder (Owner / Client)' },
                      { value: 'Engineer', label: 'Engineer' },
                      { value: 'Manager', label: 'Operations Manager' },
                    ]}
                  />

                  <Input
                    label="Project Role / Title"
                    required
                    value={newUserForm.projectRole}
                    onChange={(e) => setNewUserForm({ ...newUserForm, projectRole: e.target.value })}
                    placeholder="e.g. Lead Foundation Engineer"
                    icon={Briefcase}
                  />
                </div>

                <Input
                  label="Account Password (Optional)"
                  type="password"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  placeholder="Defaults to password123 if blank"
                  icon={Lock}
                />

                <div className="flex items-center gap-2 p-3 bg-[#0d1117] rounded-xl border border-[#30363d]">
                  <input
                    type="checkbox"
                    id="isPrimaryNew"
                    checked={newUserForm.isPrimary}
                    onChange={(e) =>
                      setNewUserForm((prev) => ({ ...prev, isPrimary: e.target.checked }))
                    }
                    className="rounded border-[#30363d] text-[#b4e600] focus:ring-[#b4e600] h-4 w-4 bg-[#161b22]"
                  />
                  <label htmlFor="isPrimaryNew" className="text-xs text-slate-300 cursor-pointer">
                    Set as <strong className="text-white">Primary Site Lead</strong> for this site
                  </label>
                </div>

                <div className="pt-3 border-t border-[#30363d] flex items-center justify-end gap-3">
                  <Button variant="outline" size="sm" onClick={() => setIsAssignModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    icon={UserPlus}
                    isLoading={isSubmittingStakeholder}
                  >
                    Create User & Assign to Site
                  </Button>
                </div>
              </form>
            )}
          </div>
        </Modal>

        {/* Upload Document Modal scoped strictly to this project */}
        <UploadDocumentModal
          isOpen={isUploadDocOpen}
          onClose={() => setIsUploadDocOpen(false)}
          onDocumentUploaded={(newDoc) => {
            setDocuments((prev) => [newDoc, ...prev]);
          }}
          projects={[project]}
          defaultProjectId={project.id}
          lockProject={true}
        />

        {/* Edit Project Modal */}
        <EditProjectModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          project={project}
          onProjectUpdated={(updated) => {
            setProject(updated);
            setStakeholderFeedback({
              type: 'success',
              message: `Project dossier "${updated.name}" updated successfully.`,
            });
            setTimeout(() => setStakeholderFeedback(null), 4000);
          }}
        />

        {/* Delete Project Modal */}
        <DeleteProjectModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          project={project}
          onProjectDeleted={() => {
            navigate('/projects');
          }}
        />
      </div>
  );
}

export default ProjectDetails;
