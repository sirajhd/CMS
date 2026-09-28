import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { requestService } from '../../services/requestService';
import { projectService } from '../../services/projectService';
import { 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  X, 
  MessageSquare,
  Send
} from 'lucide-react';

export function RequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Engineer Requisition Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');
  const [formData, setFormData] = useState({
    projectId: '',
    type: 'Payment',
    title: '',
    amount: '',
    description: '',
  });

  // Review / Comment Modal (Owner & Admin)
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewDecision, setReviewDecision] = useState('Approved');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Role permissions: Only Site Engineers can create requisitions, and only Property Owners can review/approve
  const canCreate = user?.role === 'Engineer';
  const canReview = user?.role === 'House Holder';

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [reqData, projData] = await Promise.all([
        requestService.getAllRequests(),
        projectService.getAllProjects(),
      ]);
      setRequests(reqData || []);
      setProjects(projData || []);
      if (projData && projData.length > 0 && !formData.projectId) {
        setFormData((prev) => ({ ...prev, projectId: projData[0].id }));
      }
    } catch (err) {
      console.error('Failed to load requisitions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setCreateError('');
    setIsSubmitting(true);

    try {
      if (!formData.projectId || !formData.title.trim() || !formData.description.trim()) {
        throw new Error('Project, title, and description are required.');
      }

      const newReq = await requestService.createRequest({
        projectId: formData.projectId,
        type: formData.type,
        title: formData.title,
        amount: Number(formData.amount) || 0,
        description: formData.description,
      });

      setRequests((prev) => [newReq, ...prev]);
      setIsCreateOpen(false);
      setFormData({
        projectId: projects[0]?.id || '',
        type: 'Payment',
        title: '',
        amount: '',
        description: '',
      });
    } catch (err) {
      setCreateError(err.message || 'Failed to submit requisition.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openReviewModal = (reqItem, defaultDecision = 'Approved') => {
    setSelectedRequest(reqItem);
    setReviewDecision(defaultDecision);
    setReviewComment(defaultDecision === 'Approved' ? 'Milestone inspection verified and authorized for payout.' : 'Please provide updated concrete cube test results.');
    setIsReviewOpen(true);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;
    setReviewSubmitting(true);

    try {
      const updated = await requestService.reviewRequest(selectedRequest.id, reviewDecision, reviewComment);
      setRequests((prev) => prev.map((r) => (r.id === selectedRequest.id ? updated : r)));
      setIsReviewOpen(false);
    } catch (err) {
      alert('Error updating review: ' + err.message);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40';
      case 'Revision Required':
      case 'Rejected':
        return 'bg-rose-950/60 text-rose-300 border-rose-500/40';
      default:
        return 'bg-amber-950/60 text-amber-300 border-amber-500/40';
    }
  };

  return (
    <div className="space-y-6 text-[#f0f6fc]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight uppercase">Requisitions & Milestone Approvals</h1>
          <p className="text-xs text-slate-400">Site engineer submission channel and property owner milestone authorizations.</p>
        </div>

        {canCreate && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#b4e600] hover:bg-[#cbf800] text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Requisition</span>
          </button>
        )}
        {user?.role === 'Admin' && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161b22] text-slate-400 text-xs font-bold uppercase tracking-wider border border-[#30363d]">
            Read-Only Audit Ledger
          </span>
        )}
      </div>

      <div className="bg-[#161b22] rounded-2xl border border-[#30363d] shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0d1117] border-b border-[#30363d] text-slate-400 font-black uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Requisition Title</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Submitted By</th>
                <th className="py-3 px-4">Feedback / Notes</th>
                <th className="py-3 px-4">Status</th>
                {canReview && <th className="py-3 px-4 text-right">Review Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363d]/60 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500 text-xs">
                    Loading requisitions from PostgreSQL...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500 text-xs">
                    No requisitions logged yet.
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id} className="hover:bg-[#21262d]/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">{r.projectName}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{r.title}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">{r.description}</div>
                    </td>
                    <td className="py-3.5 px-4 font-black text-[#b4e600]">
                      {r.amount ? `${r.amount.toLocaleString()} ETB` : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{r.submittedBy}</td>
                    <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">
                      {r.comments && r.comments.length > 0 ? (
                        <span className="text-[11px] text-slate-300 font-medium">💬 {r.comments[r.comments.length - 1].comment}</span>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">No comments</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    {canReview && (
                      <td className="py-3.5 px-4 text-right">
                        {r.status === 'Submitted' || r.status === 'Under Review' ? (
                          <button
                            onClick={() => openReviewModal(r, 'Approved')}
                            className="px-3 py-1.5 bg-[#b4e600] hover:bg-[#cbf800] text-black font-black uppercase tracking-wider rounded-lg text-[10px] transition-all cursor-pointer shadow-xs"
                          >
                            Review & Sign-Off
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">Reviewed</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Owner / Admin Review & Comment Modal */}
      {isReviewOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#161b22] text-[#f0f6fc] w-full max-w-md rounded-2xl shadow-2xl border border-[#30363d] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#30363d] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Milestone Review & Sign-Off</h3>
                <p className="text-xs text-slate-400">Provide feedback or authorize disbursement for {selectedRequest.projectName}</p>
              </div>
              <button onClick={() => setIsReviewOpen(false)} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-[#0d1117] transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="p-6 space-y-4">
              <div className="p-3 bg-[#0d1117] rounded-xl border border-[#30363d] space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Requisition:</span>
                  <span className="font-bold text-white">{selectedRequest.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Requested Amount:</span>
                  <span className="font-black text-[#b4e600]">{selectedRequest.amount?.toLocaleString()} ETB</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Decision *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewDecision('Approved')}
                    className={`py-2 text-xs font-black uppercase tracking-wider rounded-xl border transition-all cursor-pointer ${
                      reviewDecision === 'Approved'
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-xs'
                        : 'border-[#30363d] text-slate-400 hover:text-white hover:bg-[#0d1117]'
                    }`}
                  >
                    Authorize Payout
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewDecision('Revision Required')}
                    className={`py-2 text-xs font-black uppercase tracking-wider rounded-xl border transition-all cursor-pointer ${
                      reviewDecision === 'Revision Required'
                        ? 'bg-rose-950/80 border-rose-500 text-rose-300 shadow-xs'
                        : 'border-[#30363d] text-slate-400 hover:text-white hover:bg-[#0d1117]'
                    }`}
                  >
                    Request Revision
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Reviewer Feedback & Comments *</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Explain reason for authorization or required adjustments..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600] resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsReviewOpen(false)}
                  className="px-4 py-2 border border-[#30363d] hover:bg-[#0d1117] text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="px-5 py-2 bg-[#b4e600] hover:bg-[#cbf800] text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-md cursor-pointer transition-all disabled:opacity-50"
                >
                  {reviewSubmitting ? 'Recording...' : 'Submit Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Engineer Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#161b22] text-[#f0f6fc] w-full max-w-md rounded-2xl shadow-2xl border border-[#30363d] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#30363d] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Draft Site Requisition</h3>
                <p className="text-xs text-slate-400">Submit milestone tranche or material requisition for owner sign-off</p>
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-[#0d1117] transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="p-6 space-y-4">
              {createError && (
                <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl flex items-center gap-2 text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Target Project *</label>
                <select
                  required
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-white focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600]"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#161b22] text-white">{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Requisition Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-white focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600]"
                  >
                    <option value="Payment" className="bg-[#161b22] text-white">Payment Tranche</option>
                    <option value="Material" className="bg-[#161b22] text-white">Material Requisition</option>
                    <option value="Variation" className="bg-[#161b22] text-white">Scope Variation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Estimated Cost (ETB)</label>
                  <input
                    type="number"
                    placeholder="e.g., 250000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Requisition Subject *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Ground Beam Concrete Pouring Sign-off"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Work Description / Details *</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Provide technical validation, milestone verification..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600] resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-[#30363d] hover:bg-[#0d1117] text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#b4e600] hover:bg-[#cbf800] text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-md cursor-pointer transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Transmitting...' : 'Submit Requisition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RequestsPage;
