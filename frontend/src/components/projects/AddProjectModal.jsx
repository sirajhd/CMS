import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { projectService } from '../../services/projectService';
import { userService } from '../../services/userService';
import { Building2, Plus, Calendar, DollarSign, MapPin, UserPlus } from 'lucide-react';

export function AddProjectModal({ isOpen, onClose, onProjectCreated }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState([]);
  const [showQuickUserModal, setShowQuickUserModal] = useState(false);
  const [quickUserRole, setQuickUserRole] = useState('House Holder');
  const [quickUserData, setQuickUserData] = useState({ name: '', email: '', phone: '', password: '' });

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    houseHolderId: '',
    engineerId: '',
    managerId: '',
    totalBudget: '',
    startDate: '2026-10-01',
    expectedCompletion: '2027-08-30',
    description: '',
  });

  useEffect(() => {
    async function load() {
      const all = await userService.getAllUsers();
      setUsers(all);

      // Set default IDs if empty
      const hh = all.find((u) => u.role === 'House Holder');
      const eng = all.find((u) => u.role === 'Engineer');
      const mgr = all.find((u) => u.role === 'Manager');

      setFormData((prev) => ({
        ...prev,
        houseHolderId: prev.houseHolderId || (hh ? hh.id : ''),
        engineerId: prev.engineerId || (eng ? eng.id : ''),
        managerId: prev.managerId || (mgr ? mgr.id : ''),
      }));
    }
    if (isOpen) {
      load();
    }
    const unsub = userService.subscribe((updatedUsers) => {
      setUsers(updatedUsers);
    });
    return () => unsub();
  }, [isOpen]);

  const houseHolders = users.filter((u) => u.role === 'House Holder');
  const engineers = users.filter((u) => u.role === 'Engineer');
  const managers = users.filter((u) => u.role === 'Manager');

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleQuickCreateUser = async (e) => {
    e.preventDefault();
    if (!quickUserData.name || !quickUserData.email) return;

    try {
      const created = await userService.createUser({
        name: quickUserData.name,
        email: quickUserData.email,
        phone: quickUserData.phone || '+251 90 000 0000',
        role: quickUserRole,
        title: quickUserRole === 'House Holder' ? 'Property Owner' : quickUserRole === 'Engineer' ? 'Lead Site Engineer' : 'Operations Manager',
        password: quickUserData.password || undefined,
      });

      if (quickUserRole === 'House Holder') {
        setFormData((prev) => ({ ...prev, houseHolderId: created.id }));
      } else if (quickUserRole === 'Engineer') {
        setFormData((prev) => ({ ...prev, engineerId: created.id }));
      } else if (quickUserRole === 'Manager') {
        setFormData((prev) => ({ ...prev, managerId: created.id }));
      }

      setShowQuickUserModal(false);
      setQuickUserData({ name: '', email: '', phone: '', password: '' });
    } catch (err) {
      console.error('Failed to create quick stakeholder:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const selectedHH = users.find((u) => u.id === formData.houseHolderId);
      const selectedEng = users.find((u) => u.id === formData.engineerId);
      const selectedMgr = users.find((u) => u.id === formData.managerId);

      const payload = {
        ...formData,
        houseHolderName: selectedHH ? selectedHH.name : 'Unknown Owner',
        engineerName: selectedEng ? selectedEng.name : 'Unknown Engineer',
        managerName: selectedMgr ? selectedMgr.name : 'Unknown Manager',
      };

      const created = await projectService.createProject(payload);
      if (onProjectCreated) onProjectCreated(created);
      onClose();
      // Reset form
      setFormData({
        name: '',
        location: '',
        houseHolderId: '',
        engineerId: '',
        managerId: '',
        totalBudget: '',
        startDate: '2026-10-01',
        expectedCompletion: '2027-08-30',
        description: '',
      });
    } catch (err) {
      console.error('Failed to create construction project:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Register New Construction Site"
        subtitle="Establish site parameters, allocate ETB budget, and assign stakeholder team."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Project / Villa Name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Bole Heights Villa"
              icon={Building2}
            />
            <Input
              label="Location"
              name="location"
              required
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g. Ayat Zone 3, Addis Ababa"
              icon={MapPin}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-300">Project Stakeholders Assignment</span>
              <button
                type="button"
                onClick={() => {
                  setQuickUserRole('House Holder');
                  setShowQuickUserModal(true);
                }}
                className="text-[11px] font-bold text-[#b4e600] hover:text-[#cbf800] inline-flex items-center gap-1 uppercase tracking-wider transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Register New Stakeholder
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="House Holder (Owner)"
                name="houseHolderId"
                value={formData.houseHolderId}
                onChange={handleChange}
                options={houseHolders.map((u) => ({ value: u.id, label: u.name }))}
                required
              />
              <Select
                label="Lead Engineer"
                name="engineerId"
                value={formData.engineerId}
                onChange={handleChange}
                options={engineers.map((u) => ({ value: u.id, label: u.name }))}
                required
              />
              <Select
                label="Operations Manager"
                name="managerId"
                value={formData.managerId}
                onChange={handleChange}
                options={managers.map((u) => ({ value: u.id, label: u.name }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Total Budget (ETB)"
              name="totalBudget"
              type="number"
              required
              value={formData.totalBudget}
              onChange={handleChange}
              placeholder="e.g. 5200000"
              icon={DollarSign}
            />
            <Input
              label="Start Date"
              name="startDate"
              type="date"
              required
              value={formData.startDate}
              onChange={handleChange}
              icon={Calendar}
            />
            <Input
              label="Expected Completion"
              name="expectedCompletion"
              type="date"
              required
              value={formData.expectedCompletion}
              onChange={handleChange}
              icon={Calendar}
            />
          </div>

          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-300">Project Description & Scope</label>
            <textarea
              name="description"
              rows="2"
              value={formData.description}
              onChange={handleChange}
              placeholder="Scope details: G+2 structure, foundation specification, retaining wall requirement..."
              className="w-full rounded-xl border border-[#30363d] bg-[#0d1117] p-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#b4e600] transition-colors"
            />
          </div>

          <div className="pt-3 border-t border-[#30363d] flex items-center justify-end gap-3">
            <Button variant="outline" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={Plus}
              isLoading={isSubmitting}
            >
              Create Construction Site
            </Button>
          </div>
        </form>
      </Modal>

      {/* Quick Add User Modal */}
      <Modal
        isOpen={showQuickUserModal}
        onClose={() => setShowQuickUserModal(false)}
        title="Register New Stakeholder"
        subtitle="Quickly add a stakeholder to assign directly to this new site."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleQuickCreateUser} className="space-y-4">
          <Input
            label="Full Name"
            required
            value={quickUserData.name}
            onChange={(e) => setQuickUserData({ ...quickUserData, name: e.target.value })}
            placeholder="e.g. Solomon Girma"
          />
          <Input
            label="Email Address"
            type="email"
            required
            value={quickUserData.email}
            onChange={(e) => setQuickUserData({ ...quickUserData, email: e.target.value })}
            placeholder="solomon@example.com"
          />
          <Input
            label="Phone Number"
            value={quickUserData.phone}
            onChange={(e) => setQuickUserData({ ...quickUserData, phone: e.target.value })}
            placeholder="+251 91 123 4567"
          />
          <Select
            label="Role in Project"
            value={quickUserRole}
            onChange={(e) => setQuickUserRole(e.target.value)}
            options={[
              { value: 'House Holder', label: 'House Holder (Property Owner)' },
              { value: 'Engineer', label: 'Lead Structural Engineer' },
              { value: 'Manager', label: 'Operations Manager' },
            ]}
          />
          <Input
            label="Account Password (Optional)"
            type="password"
            value={quickUserData.password}
            onChange={(e) => setQuickUserData({ ...quickUserData, password: e.target.value })}
            placeholder="Defaults to password123 if blank"
          />
          <div className="pt-3 border-t border-[#30363d] flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowQuickUserModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" icon={UserPlus}>
              Save & Select
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export default AddProjectModal;
