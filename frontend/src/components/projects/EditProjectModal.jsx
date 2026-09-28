import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { projectService } from '../../services/projectService';
import { userService } from '../../services/userService';
import { 
  Building2, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Activity, 
  CheckCircle2, 
  Save, 
  Layers,
  HardHat,
  User,
  Sliders
} from 'lucide-react';

export function EditProjectModal({ isOpen, onClose, project, onProjectUpdated }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    houseHolderId: '',
    engineerId: '',
    managerId: '',
    status: 'Active',
    progress: 0,
    totalBudget: '',
    spentBudget: '',
    startDate: '',
    expectedCompletion: '',
    description: '',
  });

  useEffect(() => {
    async function loadUsers() {
      try {
        const all = await userService.getAllUsers();
        setUsers(all || []);
      } catch (err) {
        console.error('Failed to load users for project edit modal:', err);
      }
    }

    if (isOpen) {
      loadUsers();
      setError('');
      if (project) {
        setFormData({
          name: project.name || '',
          location: project.location || '',
          houseHolderId: project.houseHolderId || '',
          engineerId: project.engineerId || '',
          managerId: project.managerId || '',
          status: project.status || 'Active',
          progress: project.progress || 0,
          totalBudget: project.totalBudget ?? '',
          spentBudget: project.spentBudget ?? '',
          startDate: project.startDate ? project.startDate.split('T')[0] : '',
          expectedCompletion: project.expectedCompletion ? project.expectedCompletion.split('T')[0] : '',
          description: project.description || '',
        });
      }
    }
  }, [isOpen, project]);

  const houseHolders = users.filter((u) => u.role === 'House Holder');
  const engineers = users.filter((u) => u.role === 'Engineer');
  const managers = users.filter((u) => u.role === 'Manager');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!project) return;
    setIsSubmitting(true);
    setError('');

    try {
      if (!formData.name.trim() || !formData.location.trim()) {
        throw new Error('Project name and site location are required.');
      }

      const updated = await projectService.updateProject(project.id, {
        name: formData.name.trim(),
        location: formData.location.trim(),
        houseHolderId: formData.houseHolderId || null,
        engineerId: formData.engineerId || null,
        managerId: formData.managerId || null,
        status: formData.status,
        progress: Number(formData.progress) || 0,
        totalBudget: Number(formData.totalBudget) || 0,
        spentBudget: Number(formData.spentBudget) || 0,
        startDate: formData.startDate,
        expectedCompletion: formData.expectedCompletion,
        description: formData.description,
      });

      if (onProjectUpdated) {
        onProjectUpdated(updated);
      }
      onClose();
    } catch (err) {
      console.error('Failed to update project:', err);
      setError(err.message || 'Failed to update construction project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Construction Site Dossier"
      subtitle={`Modify site parameters, schedule, budget, and assigned team for ${project?.name || 'project'}.`}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-950/50 border border-red-500/40 rounded-xl text-red-300 text-xs font-semibold">
            {error}
          </div>
        )}

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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Project Status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            options={[
              { value: 'Active', label: 'Active Execution' },
              { value: 'On Hold', label: 'On Hold / Suspended' },
              { value: 'Completed', label: 'Completed Site' },
            ]}
          />
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-300 block mb-1.5">
              Execution Progress ({formData.progress}%)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                name="progress"
                min="0"
                max="100"
                value={formData.progress}
                onChange={handleChange}
                className="w-full accent-[#b4e600] h-2 bg-[#0d1117] rounded-lg cursor-pointer border border-[#30363d]"
              />
              <span className="font-mono font-bold text-xs text-[#b4e600] w-12 text-right">
                {formData.progress}%
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 block">
            Project Stakeholders Assignment
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="House Holder (Owner)"
              name="houseHolderId"
              value={formData.houseHolderId}
              onChange={handleChange}
              options={[
                { value: '', label: '— Select Property Owner —' },
                ...houseHolders.map((u) => ({ value: u.id, label: u.name }))
              ]}
            />
            <Select
              label="Lead Engineer"
              name="engineerId"
              value={formData.engineerId}
              onChange={handleChange}
              options={[
                { value: '', label: '— Select Lead Engineer —' },
                ...engineers.map((u) => ({ value: u.id, label: u.name }))
              ]}
            />
            <Select
              label="Operations Manager"
              name="managerId"
              value={formData.managerId}
              onChange={handleChange}
              options={[
                { value: '', label: '— Select Manager —' },
                ...managers.map((u) => ({ value: u.id, label: u.name }))
              ]}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Total Allocated Budget (ETB)"
            name="totalBudget"
            type="number"
            required
            value={formData.totalBudget}
            onChange={handleChange}
            placeholder="e.g. 5200000"
            icon={DollarSign}
          />
          <Input
            label="Disbursed / Spent Budget (ETB)"
            name="spentBudget"
            type="number"
            value={formData.spentBudget}
            onChange={handleChange}
            placeholder="e.g. 1750000"
            icon={DollarSign}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <label className="text-[11px] font-black uppercase tracking-wider text-slate-300">
            Project Scope & Description
          </label>
          <textarea
            name="description"
            rows="3"
            value={formData.description}
            onChange={handleChange}
            placeholder="Scope details, architectural specifications, milestone goals..."
            className="w-full rounded-xl border border-[#30363d] bg-[#0d1117] p-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#b4e600] transition-colors"
          />
        </div>

        <div className="pt-3 border-t border-[#30363d] flex items-center justify-end gap-3">
          <Button variant="outline" size="md" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            icon={Save}
            isLoading={isSubmitting}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default EditProjectModal;
