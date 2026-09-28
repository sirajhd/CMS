import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { requestService } from '../../services/requestService';
import { projectService } from '../../services/projectService';
import { 
  FileText, 
  Send, 
  DollarSign, 
  Paperclip, 
  Layers, 
  HardHat, 
  Plus, 
  Trash2 
} from 'lucide-react';

export function CreateRequestModal({ isOpen, onClose, projects = [], onRequestCreated }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    projectId: projects[0]?.id || 'proj-001',
    type: 'Payment',
    title: '',
    amount: '',
    description: '',
  });

  // Simulated file attachment state
  const [attachments, setAttachments] = useState([]);
  const [mockFileName, setMockFileName] = useState('');

  const requestTypes = [
    { value: 'Payment', label: 'Payment Tranche (Milestone Release)' },
    { value: 'Material', label: 'Material Requisition (Site Dispatch)' },
    { value: 'Agreement', label: 'Agreement / Subcontract Terms' },
    { value: 'Technical Document', label: 'Technical Drawing / Engineering Calculation' },
    { value: 'Other', label: 'General Technical Requisition' },
  ];

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleAddAttachment = () => {
    if (!mockFileName.trim()) return;
    const newFile = {
      name: mockFileName.trim().endsWith('.pdf') ? mockFileName.trim() : `${mockFileName.trim()}.pdf`,
      size: `${(Math.random() * 3 + 0.8).toFixed(1)} MB`,
    };
    setAttachments((prev) => [...prev, newFile]);
    setMockFileName('');
  };

  const handleRemoveAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const selectedProject = projects.find((p) => p.id === formData.projectId) || projects[0];

      const payload = {
        projectId: selectedProject?.id || 'proj-001',
        projectName: selectedProject?.name || 'Modern Family House',
        type: formData.type,
        title: formData.title,
        amount: formData.type === 'Payment' || formData.type === 'Material' ? Number(formData.amount) || 0 : 0,
        description: formData.description,
        submittedBy: 'Engineer Hana Worku',
        submittedById: 'usr-eng-01',
        attachments: attachments.length > 0 ? attachments : [{ name: `${formData.title.replace(/\s+/g, '_')}_Spec.pdf`, size: '1.8 MB' }],
        comments: [
          {
            id: `c-${Date.now()}`,
            author: 'Engineer Hana Worku',
            role: 'Engineer',
            date: new Date().toISOString(),
            text: `Initial submission: ${formData.description}`,
          },
        ],
      };

      const created = await requestService.createRequest(payload);
      if (onRequestCreated) onRequestCreated(created);
      handleClose();
    } catch (err) {
      console.error('Failed to create engineer request:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      projectId: projects[0]?.id || 'proj-001',
      type: 'Payment',
      title: '',
      amount: '',
      description: '',
    });
    setAttachments([]);
    setMockFileName('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Technical Request"
      subtitle="Submit milestone tranches, material requests, or contracts to the House Holder."
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Project & Request Type Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Target Construction Project"
            name="projectId"
            value={formData.projectId}
            onChange={handleChange}
            options={projects.map((p) => ({ value: p.id, label: `${p.name} (${p.location})` }))}
            required
          />
          <Select
            label="Requisition Type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            options={requestTypes}
            required
          />
        </div>

        {/* Title & Amount Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <Input
              label="Request Title"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Ground Floor Slab Concreting Tranche"
              icon={FileText}
            />
          </div>

          {(formData.type === 'Payment' || formData.type === 'Material') && (
            <div>
              <Input
                label="Amount (ETB)"
                name="amount"
                type="number"
                required
                value={formData.amount}
                onChange={handleChange}
                placeholder="e.g. 185000"
                icon={DollarSign}
                helperText="Estimated cost in ETB"
              />
            </div>
          )}
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5 text-left">
          <label className="text-[11px] font-black uppercase tracking-wider text-slate-300">
            Requisition Scope & Engineering Specifications <span className="text-rose-400">*</span>
          </label>
          <textarea
            name="description"
            rows="3"
            required
            value={formData.description}
            onChange={handleChange}
            placeholder="Detailed engineering scope: Concrete grade, bar-bending reference, contractor terms, or rationale for milestone release..."
            className="w-full rounded-xl border border-[#30363d] bg-[#0d1117] p-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#b4e600] transition-colors"
          />
        </div>

        {/* Attachments Section */}
        <div className="p-3.5 bg-[#0d1117] border border-[#30363d] rounded-2xl space-y-3">
          <label className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-[#b4e600]" />
              Attach Technical Documents / Blueprints (Simulated)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">PDF, DWG, PNG</span>
          </label>

          <div className="flex gap-2">
            <input
              type="text"
              value={mockFileName}
              onChange={(e) => setMockFileName(e.target.value)}
              placeholder="e.g. Slab_Reinforcement_Inspection_Cert.pdf"
              className="flex-1 rounded-xl border border-[#30363d] bg-[#161b22] px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#b4e600] font-mono"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={Plus}
              onClick={handleAddAttachment}
              disabled={!mockFileName.trim()}
            >
              Add File
            </Button>
          </div>

          {attachments.length > 0 && (
            <div className="space-y-1.5 pt-1">
              {attachments.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-[#161b22] rounded-xl border border-[#30363d] text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-3.5 h-3.5 text-[#b4e600] flex-shrink-0" />
                    <span className="font-bold text-white truncate">{file.name}</span>
                    <span className="text-slate-400 font-mono text-[10px]">({file.size})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(idx)}
                    className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-[#30363d] flex items-center justify-end gap-3">
          <Button variant="outline" size="md" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            icon={Send}
            isLoading={isSubmitting}
          >
            Dispatch to House Holder
          </Button>
        </div>

      </form>
    </Modal>
  );
}

export default CreateRequestModal;
