import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { documentService } from '../../services/documentService';
import { useAuth } from '../../context/AuthContext';
import { FileUp, FileText, CheckCircle2 } from 'lucide-react';

export function UploadDocumentModal({ 
  isOpen, 
  onClose, 
  projects = [], 
  onDocumentUploaded, 
  defaultProjectId = null,
  lockProject = false 
}) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  const initialProjectId = defaultProjectId || projects[0]?.id || '';
  const [formData, setFormData] = useState({
    projectId: initialProjectId,
    name: '',
    type: 'Technical Drawing',
    fileSize: '2.4 MB',
    fileType: 'PDF',
  });
  const [selectedFileName, setSelectedFileName] = useState('');

  // Sync defaultProjectId if provided
  React.useEffect(() => {
    if (defaultProjectId) {
      setFormData((prev) => ({ ...prev, projectId: defaultProjectId }));
    } else if (projects.length > 0 && !formData.projectId) {
      setFormData((prev) => ({ ...prev, projectId: projects[0].id }));
    }
  }, [defaultProjectId, projects]);

  const documentTypes = [
    { value: 'Technical Drawing', label: 'Technical Drawing / Blueprints' },
    { value: 'Agreement', label: 'Agreement / Subcontract' },
    { value: 'Payment Receipt', label: 'Payment Receipt / Bank Voucher' },
    { value: 'Material Receipt', label: 'Material Receipt / Delivery Waybill' },
    { value: 'Contract', label: 'General Contract' },
    { value: 'Invoice', label: 'Supplier Invoice' },
    { value: 'Other', label: 'Other Construction Document' },
  ];

  const handleFileSelection = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFileName(file.name);
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      const extension = file.name.split('.').pop().toUpperCase();
      setFormData((prev) => ({
        ...prev,
        name: file.name,
        fileSize: `${sizeMB} MB`,
        fileType: extension || 'PDF',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploadError('');

    if (!formData.projectId) {
      setUploadError('Please select a valid construction project site.');
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedProject = projects.find((p) => p.id === formData.projectId) || { id: formData.projectId };

      const payload = {
        name: formData.name,
        type: formData.type,
        projectId: formData.projectId,
        projectName: selectedProject?.name || 'Construction Site',
        uploadedBy: user?.name || 'Project Stakeholder',
        fileType: formData.fileType,
        size: formData.fileSize,
      };

      const uploaded = await documentService.uploadDocument(payload);
      if (onDocumentUploaded) onDocumentUploaded(uploaded);
      handleClose();
    } catch (err) {
      console.error('Failed to upload document:', err);
      setUploadError(err.message || 'Failed to archive document. Ensure you are an authorized site stakeholder.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      projectId: defaultProjectId || projects[0]?.id || '',
      type: 'Technical Drawing',
      name: '',
      fileSize: '2.4 MB',
      fileType: 'PDF',
    });
    setSelectedFileName('');
    setUploadError('');
    onClose();
  };

  const currentProjectObj = projects.find((p) => p.id === formData.projectId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Upload Construction Document"
      subtitle="Archive architectural drawings, contracts, payment vouchers, or waybills."
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {uploadError && (
          <div className="p-3 bg-rose-950/60 border border-rose-500/50 rounded-xl text-xs text-rose-300 font-mono">
            {uploadError}
          </div>
        )}

        {/* Project Target & Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {lockProject ? (
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-300 font-mono">
                Assigned Construction Project
              </label>
              <div className="px-3.5 py-2.5 rounded-xl border border-[#30363d] bg-[#0d1117] text-white flex items-center justify-between">
                <span className="text-xs font-bold truncate">{currentProjectObj?.name || 'Target Site'}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#161b22] text-[#b4e600] border border-[#b4e600]/30 uppercase">
                  Locked
                </span>
              </div>
            </div>
          ) : projects.length === 0 ? (
            <div className="sm:col-span-2 p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl text-xs text-amber-300 font-mono">
              ⚠️ You are not currently assigned as a stakeholder to any construction sites. Only project members or system administrators can upload documents.
            </div>
          ) : (
            <Select
              label="Related Construction Project"
              name="projectId"
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              options={projects.map((p) => ({ value: p.id, label: `${p.name} (${p.location})` }))}
              required
            />
          )}

          <Select
            label="Document Classification"
            name="type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            options={documentTypes}
            required
          />
        </div>

        {/* Document Title / Name */}
        <Input
          label="Document Name / Title"
          name="name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g. Ground_Floor_Structural_Columns_Rev2.pdf"
          icon={FileText}
        />

        {/* File Dropzone / Selector */}
        <div className="border-2 border-dashed border-[#30363d] rounded-2xl p-5 text-center bg-[#0d1117] hover:border-[#b4e600]/60 transition-colors">
          <input
            type="file"
            id="fileInput"
            className="hidden"
            onChange={handleFileSelection}
          />
          <label htmlFor="fileInput" className="cursor-pointer space-y-2 block">
            <div className="p-3 bg-[#161b22] border border-[#30363d] rounded-xl w-12 h-12 flex items-center justify-center mx-auto text-[#b4e600] shadow-xs">
              <FileUp className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div className="text-xs">
              <span className="font-bold text-[#b4e600] hover:text-[#cbf800] uppercase tracking-wider">Click to browse file</span>
              <p className="text-[11px] text-slate-400 mt-1">PDF, DWG, DOCX, PNG (Simulated upload)</p>
            </div>
          </label>

          {selectedFileName && (
            <div className="mt-3 p-2 bg-[#161b22] rounded-xl border border-[#30363d] inline-flex items-center gap-2 text-xs text-white font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{selectedFileName}</span>
              <span className="text-slate-400">({formData.fileSize})</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-[#30363d] flex items-center justify-end gap-3">
          <Button variant="outline" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            icon={FileUp}
            isLoading={isSubmitting}
            disabled={!formData.name.trim()}
          >
            Upload to Archive
          </Button>
        </div>

      </form>
    </Modal>
  );
}

export default UploadDocumentModal;
