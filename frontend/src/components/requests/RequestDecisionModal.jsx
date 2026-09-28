import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { StatusBadge } from '../common/StatusBadge';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { requestService } from '../../services/requestService';
import { 
  CheckCircle, 
  RotateCcw, 
  XCircle, 
  FileText, 
  Download, 
  MessageSquare, 
  User, 
  Clock, 
  AlertTriangle 
} from 'lucide-react';

export function RequestDecisionModal({ isOpen, onClose, request, onDecisionComplete }) {
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmApprove, setShowConfirmApprove] = useState(false);
  const [showSendBackBox, setShowSendBackBox] = useState(false);

  if (!request) return null;

  const handleAction = async (decision) => {
    setIsSubmitting(true);
    try {
      await requestService.reviewRequest(
        request.id,
        decision,
        comments,
        'Abebe Kebede',
        'House Holder'
      );
      if (onDecisionComplete) onDecisionComplete(request.id, decision);
      handleClose();
    } catch (err) {
      console.error('Failed to submit decision:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setComments('');
    setShowConfirmApprove(false);
    setShowSendBackBox(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={request.title}
      subtitle={`Project: ${request.projectName} • ID: ${request.id}`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6">
               {/* Top Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#0d1117] rounded-xl border border-[#30363d] text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5 font-mono uppercase text-[10px]">Request Type:</span>
            <span className="font-bold text-white tracking-wide">{request.type}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5 font-mono uppercase text-[10px]">Requested Amount:</span>
            <span className="font-bold text-[#b4e600] font-mono text-sm">
              {request.amount > 0 ? formatCurrency(request.amount) : 'Non-Financial'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5 font-mono uppercase text-[10px]">Submitted By:</span>
            <span className="font-medium text-slate-200">{request.submittedBy}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5 font-mono uppercase text-[10px]">Current Status:</span>
            <StatusBadge status={request.status} />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
            Requisition Description & Scope
          </h4>
          <p className="text-sm text-slate-300 leading-relaxed bg-[#0d1117] p-3.5 rounded-xl border border-[#30363d]">
            {request.description}
          </p>
        </div>

        {/* Attachments Section */}
        {request.attachments && request.attachments.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Attached Engineering Documents ({request.attachments.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {request.attachments.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs hover:border-slate-500 transition-colors"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-[#b4e600] flex-shrink-0" />
                    <span className="font-medium text-white truncate">{file.name}</span>
                    <span className="text-slate-400 font-mono text-[10px]">({file.size})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => alert(`Simulated download of ${file.name}`)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-[#b4e600] hover:bg-[#21262d] transition-colors"
                    title="Download document"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audit Comment Thread */}
        <div className="space-y-2">
          <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-[#b4e600]" />
            Communication & Audit Trail
          </h4>
          <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
            {request.comments && request.comments.length > 0 ? (
              request.comments.map((c) => (
                <div key={c.id} className="p-3 rounded-xl bg-[#0d1117] border border-[#30363d] text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-white">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {c.author} <span className="text-slate-400 font-normal font-mono text-[10px]">({c.role})</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatDateTime(c.date)}
                    </span>
                  </div>
                  <p className="text-slate-300 leading-normal">{c.text}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic font-mono">No previous comments on this request.</p>
            )}
          </div>
        </div>

        {/* Decision Panels */}
        {showConfirmApprove ? (
          <div className="p-4 bg-emerald-950/20 rounded-xl border border-emerald-500/40 space-y-3">
            <div className="flex items-start gap-2.5 text-emerald-300 text-xs">
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-black uppercase tracking-wider text-emerald-200">Authorize and Approve Request</p>
                <p className="text-emerald-300/80 mt-0.5">
                  Are you sure you want to approve this request? It will be immediately routed to Manager Daniel for disbursement/execution.
                </p>
              </div>
            </div>
            <textarea
              rows="2"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Add optional approval remarks for the Manager..."
              className="w-full text-xs rounded-xl border border-emerald-500/40 p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-[#0d1117] text-white placeholder-slate-500"
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={() => setShowConfirmApprove(false)}>
                Cancel
              </Button>
              <Button
                variant="success"
                size="sm"
                icon={CheckCircle}
                isLoading={isSubmitting}
                onClick={() => handleAction('Approved')}
              >
                Confirm Approval
              </Button>
            </div>
          </div>
        ) : showSendBackBox ? (
          <div className="p-4 bg-amber-950/20 rounded-xl border border-amber-500/40 space-y-3">
            <div className="flex items-start gap-2.5 text-amber-300 text-xs">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-black uppercase tracking-wider text-amber-200">Send Back to Site Engineer for Revision</p>
                <p className="text-amber-300/80 mt-0.5">
                  Specify what the engineer needs to revise, recalculate, or provide before approval.
                </p>
              </div>
            </div>
            <textarea
              rows="2"
              required
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="e.g. Please attach updated supplier quotations and structural drawings..."
              className="w-full text-xs rounded-xl border border-amber-500/40 p-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-[#0d1117] text-white placeholder-slate-500"
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={() => setShowSendBackBox(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={RotateCcw}
                isLoading={isSubmitting}
                disabled={!comments.trim()}
                onClick={() => handleAction('Revision Required')}
              >
                Send Back to Engineer
              </Button>
            </div>
          </div>
        ) : (
          /* Main Action Buttons for House Holder */
          <div className="pt-3 border-t border-[#30363d] flex flex-wrap items-center justify-between gap-3">
            <Button variant="outline" size="sm" onClick={handleClose}>
              Close
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="danger"
                size="sm"
                icon={RotateCcw}
                onClick={() => {
                  setShowSendBackBox(true);
                  setShowConfirmApprove(false);
                }}
              >
                Send Back / Revision
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={CheckCircle}
                onClick={() => {
                  setShowConfirmApprove(true);
                  setShowSendBackBox(false);
                }}
              >
                Approve Request
              </Button>
            </div>
          </div>
        )}

      </div>
    </Modal>
  );
}

export default RequestDecisionModal;
