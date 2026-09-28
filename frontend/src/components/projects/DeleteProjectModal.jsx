import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { projectService } from '../../services/projectService';
import { AlertTriangle, Trash2 } from 'lucide-react';

export function DeleteProjectModal({ isOpen, onClose, project, onProjectDeleted }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  if (!project) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError('');

    try {
      await projectService.deleteProject(project.id);
      if (onProjectDeleted) {
        onProjectDeleted(project.id);
      }
      onClose();
    } catch (err) {
      console.error('Failed to delete project:', err);
      setError(err.message || 'Failed to delete project from database.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Construction Project"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-950/50 border border-red-500/40 rounded-xl text-red-300 text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="flex items-start gap-3 p-3.5 bg-red-950/30 border border-red-500/30 rounded-xl text-red-300">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-red-200">
              Are you sure you want to permanently delete this project?
            </p>
            <p className="text-slate-400 leading-relaxed">
              This action cannot be undone. Deleting <span className="font-bold text-white uppercase">{project.name}</span> will cascade-delete all linked requisitions, milestone payments, material ledgers, and document archives.
            </p>
          </div>
        </div>

        <div className="p-3 bg-[#0d1117] rounded-xl border border-[#30363d] space-y-1 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Project Name:</span>
            <span className="font-bold text-white">{project.name}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Site Location:</span>
            <span className="font-semibold text-slate-200">{project.location}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Allocated Budget:</span>
            <span className="font-mono font-bold text-[#b4e600]">
              {(project.totalBudget || 0).toLocaleString()} ETB
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-[#30363d] flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={Trash2}
            isLoading={isDeleting}
            onClick={handleDelete}
          >
            Delete Project
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default DeleteProjectModal;
