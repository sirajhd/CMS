import React, { useState, useEffect, useMemo } from 'react';
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
  Send,
  Boxes,
  Trash2,
  Calculator,
  UploadCloud,
  Building2,
  DollarSign,
  Receipt,
  ArrowRight,
  Eye,
  ExternalLink,
  ShieldCheck,
  Check,
  CreditCard,
  Truck,
  FileText,
  Layers,
  ChevronRight,
  HardHat,
  UserCheck
} from 'lucide-react';

const MATERIAL_UNITS = [
  'Pieces',
  'Bags',
  'KG',
  'Quintals',
  'Tons',
  'Cubic Meters',
  'Liters',
];

const ETHIOPIAN_BANKS = [
  'Commercial Bank of Ethiopia (CBE)',
  'Awash Bank',
  'Dashen Bank',
  'Bank of Abyssinia',
  'Telebirr (Mobile Money)',
  'CBE Birr',
  'Hibret Bank',
  'Cooperative Bank of Oromia',
  'Zemen Bank',
  'Nib International Bank',
  'Wegagen Bank',
  'Sinqe Bank',
  'Other / Cash Voucher'
];

export function RequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'submitted', 'approved', 'done', 'my_actions'

  // Step 1: Engineer Requisition Creation Modal State
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

  // Material Requisition Items State
  const createEmptyMaterial = () => ({
    id: Date.now() + Math.random(),
    name: '',
    type: '',
    brand: '',
    unit: 'Bags',
    quantity: '',
    unitPrice: '',
  });

  const [materials, setMaterials] = useState([createEmptyMaterial()]);

  // Step 2: Householder Review / Approval Modal State
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedReviewRequest, setSelectedReviewRequest] = useState(null);
  const [reviewDecision, setReviewDecision] = useState('Approved');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Step 3: Manager Disbursement & Settlement Modal State
  const [isDisburseOpen, setIsDisburseOpen] = useState(false);
  const [selectedDisburseRequest, setSelectedDisburseRequest] = useState(null);
  const [disburseSubmitting, setDisburseSubmitting] = useState(false);
  const [disburseError, setDisburseError] = useState('');
  const [disburseForm, setDisburseForm] = useState({
    bankName: 'Commercial Bank of Ethiopia (CBE)',
    paymentMethod: 'Bank Transfer',
    paymentReference: '',
    paymentDate: new Date().toISOString().split('T')[0],
    additionalExpenses: '0',
    expensesNotes: '',
    notes: '',
  });
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);

  // Requisition Full Details / Audit Modal
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [activeDetailsRequest, setActiveDetailsRequest] = useState(null);

  // Strict Role Permissions: Enforce Engineer -> Householder -> Manager workflow (Admin is view-only audit)
  const canCreate = user?.role === 'Engineer';
  const canReview = user?.role === 'House Holder';
  const canDisburse = user?.role === 'Manager';
  const isAdmin = user?.role === 'Admin';

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

  // Total material cost calculation in Create Modal
  const totalMaterialCost = useMemo(() => {
    return materials.reduce((sum, m) => {
      const qty = parseFloat(m.quantity) || 0;
      const price = parseFloat(m.unitPrice) || 0;
      return sum + (qty * price);
    }, 0);
  }, [materials]);

  // Live total calculation for Manager Disbursement Modal
  const calculatedTotalDisbursement = useMemo(() => {
    if (!selectedDisburseRequest) return 0;
    const base = Number(selectedDisburseRequest.amount) || 0;
    const extra = parseFloat(disburseForm.additionalExpenses) || 0;
    return base + (extra > 0 ? extra : 0);
  }, [selectedDisburseRequest, disburseForm.additionalExpenses]);

  const handleMaterialChange = (id, field, value) => {
    setMaterials((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleAddMaterial = () => {
    setMaterials((prev) => [...prev, createEmptyMaterial()]);
  };

  const handleRemoveMaterial = (id) => {
    if (materials.length <= 1) return;
    setMaterials((prev) => prev.filter((item) => item.id !== id));
  };

  const handleCloseCreateModal = () => {
    setIsCreateOpen(false);
    setCreateError('');
    setFormData({
      projectId: projects[0]?.id || '',
      type: 'Payment',
      title: '',
      amount: '',
      description: '',
    });
    setMaterials([createEmptyMaterial()]);
  };

  // STEP 1: Engineer submits requisition
  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setCreateError('');
    setIsSubmitting(true);

    try {
      if (!formData.projectId) {
        throw new Error('Please select a target project site.');
      }
      if (!formData.title.trim()) {
        throw new Error('Please enter a requisition subject.');
      }

      let requestAmount = Number(formData.amount) || 0;
      let requestDescription = formData.description.trim();

      if (formData.type === 'Material') {
        if (!materials || materials.length === 0) {
          throw new Error('At least one construction material entry is required.');
        }

        for (let i = 0; i < materials.length; i++) {
          const m = materials[i];
          const idx = i + 1;
          if (!m.name.trim()) {
            throw new Error(`Material #${idx}: Material Name is required.`);
          }
          if (!m.type.trim()) {
            throw new Error(`Material #${idx}: Material Type is required.`);
          }
          if (!m.unit) {
            throw new Error(`Material #${idx}: Unit must be selected.`);
          }
          const qty = parseFloat(m.quantity);
          if (isNaN(qty) || qty <= 0) {
            throw new Error(`Material #${idx}: Quantity must be greater than zero.`);
          }
          const price = parseFloat(m.unitPrice);
          if (isNaN(price) || price < 0 || m.unitPrice === '') {
            throw new Error(`Material #${idx}: Unit Price must be zero or greater.`);
          }
        }

        if (!formData.description.trim()) {
          throw new Error('Work description / technical notes are required.');
        }

        requestAmount = totalMaterialCost;

        // Structured material ledger summary
        const materialSummary = materials
          .map((m, idx) => {
            const itemTotal = (parseFloat(m.quantity) || 0) * (parseFloat(m.unitPrice) || 0);
            const brandText = m.brand?.trim() ? `, Brand: ${m.brand.trim()}` : '';
            return `${idx + 1}. ${m.name.trim()} (${m.type.trim()}${brandText}) — ${Number(m.quantity).toLocaleString()} ${m.unit} @ ${Number(m.unitPrice).toLocaleString()} ETB = ${itemTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB`;
          })
          .join('\n');

        requestDescription = `[Material Requisition Ledger]\n${materialSummary}\n\nTotal Estimated Cost: ${totalMaterialCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB\n\n[Work Description / Technical Notes]\n${formData.description.trim()}`;
      } else {
        if (!formData.description.trim()) {
          throw new Error('Work description / technical notes are required.');
        }
      }

      const newReq = await requestService.createRequest({
        projectId: formData.projectId,
        type: formData.type,
        title: formData.title.trim(),
        amount: requestAmount,
        description: requestDescription,
      });

      setRequests((prev) => [newReq, ...prev]);
      handleCloseCreateModal();
    } catch (err) {
      setCreateError(err.message || 'Failed to submit requisition.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // STEP 2: Householder reviews and approves
  const openReviewModal = (reqItem, defaultDecision = 'Approved') => {
    setSelectedReviewRequest(reqItem);
    setReviewDecision(defaultDecision);
    setReviewComment(
      defaultDecision === 'Approved'
        ? 'Milestone inspection verified and authorized for manager fund disbursement.'
        : 'Please provide structural test logs and revised quantity takeoff.'
    );
    setIsReviewOpen(true);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedReviewRequest) return;
    setReviewSubmitting(true);

    try {
      const updated = await requestService.reviewRequest(
        selectedReviewRequest.id,
        reviewDecision,
        reviewComment
      );
      setRequests((prev) => prev.map((r) => (r.id === selectedReviewRequest.id ? updated : r)));
      setIsReviewOpen(false);
    } catch (err) {
      alert('Error updating review: ' + err.message);
    } finally {
      setReviewSubmitting(false);
    }
  };

  // STEP 3 & 4: Manager processes disbursement with bank receipt & extra expenses
  const openDisburseModal = (reqItem) => {
    setSelectedDisburseRequest(reqItem);
    setDisburseError('');
    setReceiptFile(null);
    setReceiptPreview(null);
    setDisburseForm({
      bankName: 'Commercial Bank of Ethiopia (CBE)',
      paymentMethod: 'Bank Transfer',
      paymentReference: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      paymentDate: new Date().toISOString().split('T')[0],
      additionalExpenses: '0',
      expensesNotes: '',
      notes: `Disbursement completed for ${reqItem.title}. Transferred via bank with verified receipt.`,
    });
    setIsDisburseOpen(true);
  };

  const handleReceiptFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReceiptFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => setReceiptPreview(ev.target.result);
        reader.readAsDataURL(file);
      } else {
        setReceiptPreview(null);
      }
    }
  };

  const handleSubmitDisbursement = async (e) => {
    e.preventDefault();
    if (!selectedDisburseRequest) return;
    setDisburseError('');
    setDisburseSubmitting(true);

    try {
      if (!disburseForm.paymentReference.trim()) {
        throw new Error('Bank payment reference / transaction voucher ID is required.');
      }

      const extraExp = parseFloat(disburseForm.additionalExpenses) || 0;
      if (extraExp < 0) {
        throw new Error('Additional expenses cannot be negative.');
      }

      // Prepare FormData payload for Multer to receive file and fields
      const formDataPayload = new FormData();
      formDataPayload.append('bankName', disburseForm.bankName);
      formDataPayload.append('paymentMethod', disburseForm.paymentMethod);
      formDataPayload.append('paymentReference', disburseForm.paymentReference.trim());
      formDataPayload.append('paymentDate', disburseForm.paymentDate);
      formDataPayload.append('additionalExpenses', extraExp);
      formDataPayload.append('expensesNotes', disburseForm.expensesNotes.trim());
      formDataPayload.append('notes', disburseForm.notes.trim());

      if (receiptFile) {
        formDataPayload.append('receipt', receiptFile);
      }

      const res = await requestService.processDisbursement(selectedDisburseRequest.id, formDataPayload);

      // Refresh list to reflect 'Done' status and updated payment
      await loadData();
      setIsDisburseOpen(false);
    } catch (err) {
      setDisburseError(err.message || 'Failed to process disbursement.');
    } finally {
      setDisburseSubmitting(false);
    }
  };

  // Open Details Modal
  const openDetailsModal = (reqItem) => {
    setActiveDetailsRequest(reqItem);
    setIsDetailsOpen(true);
  };

  // Filtered requests based on active tab
  const filteredRequests = useMemo(() => {
    if (activeTab === 'submitted') {
      return requests.filter((r) => r.status === 'Submitted' || r.status === 'Under Review');
    }
    if (activeTab === 'approved') {
      return requests.filter((r) => r.status === 'Approved' || r.status === 'Processing');
    }
    if (activeTab === 'done') {
      return requests.filter((r) => r.status === 'Done' || r.status === 'Completed');
    }
    if (activeTab === 'my_actions') {
      if (user?.role === 'House Holder') {
        return requests.filter((r) => r.status === 'Submitted');
      }
      if (user?.role === 'Manager') {
        return requests.filter((r) => r.status === 'Approved');
      }
      if (user?.role === 'Engineer') {
        return requests.filter((r) => r.status === 'Revision Required');
      }
      return requests;
    }
    return requests;
  }, [requests, activeTab, user]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Done':
      case 'Completed':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-xs';
      case 'Approved':
        return 'bg-sky-950/80 text-sky-300 border-sky-500/50';
      case 'Rejected':
        return 'bg-rose-950/80 text-rose-300 border-rose-500/50';
      case 'Revision Required':
        return 'bg-amber-950/80 text-amber-300 border-amber-500/50';
      case 'Submitted':
      default:
        return 'bg-purple-950/80 text-purple-300 border-purple-500/50';
    }
  };

  const getWorkflowStepLabel = (status) => {
    switch (status) {
      case 'Submitted':
        return { step: 'Step 1 of 4', label: 'Pending Owner Review', color: 'text-purple-400' };
      case 'Under Review':
        return { step: 'Step 1 of 4', label: 'Under Review', color: 'text-purple-400' };
      case 'Approved':
        return { step: 'Step 2 of 4', label: 'Ready for Manager Disbursement', color: 'text-sky-400' };
      case 'Processing':
        return { step: 'Step 3 of 4', label: 'Manager Processing', color: 'text-amber-400' };
      case 'Done':
      case 'Completed':
        return { step: 'Step 4 of 4', label: 'Settled & Ledger Updated', color: 'text-emerald-400' };
      case 'Revision Required':
        return { step: 'Action Required', label: 'Engineer Revision Needed', color: 'text-amber-400' };
      case 'Rejected':
        return { step: 'Terminated', label: 'Declined by Owner', color: 'text-rose-400' };
      default:
        return { step: 'Pipeline', label: status, color: 'text-slate-400' };
    }
  };

  return (
    <div className="space-y-6 text-[#f0f6fc]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tight uppercase">Site Requisitions & Fund Release Pipeline</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#b4e600]/20 text-[#b4e600] border border-[#b4e600]/40">
              4-Step Workflow
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Site-isolated pipeline: <span className="text-slate-300 font-semibold">Engineer</span> initiates &rarr; <span className="text-slate-300 font-semibold">Householder</span> approves &rarr; <span className="text-slate-300 font-semibold">Manager</span> disburses & records receipt &rarr; <span className="text-slate-300 font-semibold">Project Spent Budget</span> auto-increments.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => {
              setFormData((prev) => ({ ...prev, projectId: projects[0]?.id || '' }));
              setIsCreateOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#b4e600] hover:bg-[#cbf800] text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Requisition</span>
          </button>
        )}
      </div>

      {isAdmin && (
        <div className="p-4 bg-purple-950/40 border border-purple-500/30 rounded-2xl flex items-start gap-3 text-xs text-purple-200">
          <ShieldCheck className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-black uppercase tracking-wider text-purple-300 block">Administrator Read-Only Oversight</span>
            <p className="text-slate-300 leading-relaxed">
              Per HDtech-CMS architecture, the requisition approval workflow operates strictly between 
              <strong className="text-white"> Site Engineer</strong> (initiates) &rarr; <strong className="text-white">Property Owner / Householder</strong> (authorizes) &rarr; <strong className="text-white">Project Manager</strong> (disburses). 
              Administrators hold platform oversight but do not submit, review, or disburse site requisitions.
            </p>
          </div>
        </div>
      )}

      {/* 4-Step Visual Workflow Stepper Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Step 1 */}
        <div className="p-3.5 bg-[#161b22] border border-[#30363d] rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold text-xs">
                1
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider text-white">Engineer Submits</span>
            </div>
            <HardHat className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            Site Engineer submits material ledger or tranche for assigned site.
          </p>
          <div className="mt-2.5 pt-2 border-t border-[#30363d]/60 flex justify-between items-center text-[10px]">
            <span className="text-slate-500">Status</span>
            <span className="font-mono font-bold text-purple-400">Submitted</span>
          </div>
        </div>

        {/* Step 2 */}
        <div className="p-3.5 bg-[#161b22] border border-[#30363d] rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider text-white">Owner Approves</span>
            </div>
            <UserCheck className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            Property Owner inspects site milestone and grants fund release authorization.
          </p>
          <div className="mt-2.5 pt-2 border-t border-[#30363d]/60 flex justify-between items-center text-[10px]">
            <span className="text-slate-500">Status</span>
            <span className="font-mono font-bold text-sky-400">Approved</span>
          </div>
        </div>

        {/* Step 3 */}
        <div className="p-3.5 bg-[#161b22] border border-[#30363d] rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider text-white">Manager Disburses</span>
            </div>
            <Receipt className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            Manager executes bank payment, adds delivery/transport costs, & uploads receipt.
          </p>
          <div className="mt-2.5 pt-2 border-t border-[#30363d]/60 flex justify-between items-center text-[10px]">
            <span className="text-slate-500">Action</span>
            <span className="font-mono font-bold text-amber-400">Voucher & Receipt</span>
          </div>
        </div>

        {/* Step 4 */}
        <div className="p-3.5 bg-[#161b22] border border-[#30363d] rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs">
                4
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider text-white">Ledger Settled</span>
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            Status marks <strong className="text-emerald-300">Done</strong>, spent budget auto-increments, receipt archived.
          </p>
          <div className="mt-2.5 pt-2 border-t border-[#30363d]/60 flex justify-between items-center text-[10px]">
            <span className="text-slate-500">Status</span>
            <span className="font-mono font-bold text-emerald-400">Done / Paid</span>
          </div>
        </div>
      </div>

      {/* Tabs / Filter Navigation */}
      <div className="flex items-center justify-between border-b border-[#30363d] overflow-x-auto pb-1 gap-2">
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-2 rounded-xl font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#b4e600] text-black font-black'
                : 'text-slate-400 hover:bg-[#161b22] hover:text-white'
            }`}
          >
            All Requisitions ({requests.length})
          </button>
          <button
            onClick={() => setActiveTab('submitted')}
            className={`px-3.5 py-2 rounded-xl font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              activeTab === 'submitted'
                ? 'bg-[#b4e600] text-black font-black'
                : 'text-slate-400 hover:bg-[#161b22] hover:text-white'
            }`}
          >
            Step 1: Pending Owner ({requests.filter((r) => r.status === 'Submitted' || r.status === 'Under Review').length})
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`px-3.5 py-2 rounded-xl font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              activeTab === 'approved'
                ? 'bg-[#b4e600] text-black font-black'
                : 'text-slate-400 hover:bg-[#161b22] hover:text-white'
            }`}
          >
            Step 2: Ready for Disbursement ({requests.filter((r) => r.status === 'Approved' || r.status === 'Processing').length})
          </button>
          <button
            onClick={() => setActiveTab('done')}
            className={`px-3.5 py-2 rounded-xl font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              activeTab === 'done'
                ? 'bg-[#b4e600] text-black font-black'
                : 'text-slate-400 hover:bg-[#161b22] hover:text-white'
            }`}
          >
            Step 3 & 4: Settled ({requests.filter((r) => r.status === 'Done' || r.status === 'Completed').length})
          </button>
          <button
            onClick={() => setActiveTab('my_actions')}
            className={`px-3.5 py-2 rounded-xl font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              activeTab === 'my_actions'
                ? 'bg-amber-400 text-black font-black'
                : 'text-amber-400/90 hover:bg-amber-400/10'
            }`}
          >
            My Action Items
          </button>
        </div>
      </div>

      {/* Requisitions List Table */}
      <div className="bg-[#161b22] rounded-2xl border border-[#30363d] overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#0d1117] border-b border-[#30363d] text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Project Site</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Requisition Title</th>
                <th className="py-3 px-4">Amount (ETB)</th>
                <th className="py-3 px-4">Assigned Team</th>
                <th className="py-3 px-4">Workflow Status</th>
                <th className="py-3 px-4 text-right">Action / Settlement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363d]/60">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500 font-mono text-xs">
                    Loading site requisitions from PostgreSQL...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500 font-mono text-xs">
                    No requisitions found matching current filter.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((r) => {
                  const wf = getWorkflowStepLabel(r.status);
                  const isSubmitted = r.status === 'Submitted' || r.status === 'Under Review';
                  const isApproved = r.status === 'Approved' || r.status === 'Processing';
                  const isDone = r.status === 'Done' || r.status === 'Completed';

                  return (
                    <tr key={r.id} className="hover:bg-[#21262d]/50 transition-colors">
                      {/* Project Site */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-[#b4e600] flex-shrink-0" />
                          <span>{r.projectName}</span>
                        </div>
                        {r.projectLocation && (
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">{r.projectLocation}</div>
                        )}
                      </td>

                      {/* Type */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#0d1117] text-slate-300 border border-[#30363d] inline-flex items-center gap-1">
                          {r.type === 'Material' ? <Boxes className="w-3 h-3 text-[#b4e600]" /> : <CreditCard className="w-3 h-3 text-sky-400" />}
                          <span>{r.type}</span>
                        </span>
                      </td>

                      {/* Title & Description preview */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{r.title}</span>
                          <button
                            onClick={() => openDetailsModal(r)}
                            className="text-slate-400 hover:text-[#b4e600] transition-colors p-0.5"
                            title="View Full Requisition Details & Audit Log"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs font-mono mt-0.5">
                          {r.description}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-200">
                          {r.amount ? `${Number(r.amount).toLocaleString()} ETB` : '—'}
                        </div>
                        {isDone && r.paymentTotalAmount > r.amount && (
                          <div className="text-[10px] font-mono text-emerald-400 font-semibold" title="Total Disbursed including additional expenses">
                            Total: {Number(r.paymentTotalAmount).toLocaleString()} ETB
                          </div>
                        )}
                      </td>

                      {/* Assigned Team */}
                      <td className="py-3.5 px-4 text-[11px] text-slate-400 space-y-0.5">
                        <div>Eng: <span className="text-slate-200 font-medium">{r.engineerName || r.submittedBy}</span></div>
                        <div>Owner: <span className="text-slate-300">{r.houseHolderName}</span></div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border inline-flex items-center gap-1 ${getStatusBadge(r.status)}`}>
                            {isDone && <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />}
                            <span>{r.status}</span>
                          </span>
                          <div className={`text-[9px] font-bold uppercase tracking-wider ${wf.color}`}>
                            {wf.step}: {wf.label}
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {/* Step 2: Householder Review Buttons */}
                        {canReview && isSubmitted && (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => openReviewModal(r, 'Approved')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] uppercase rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1"
                            >
                              <Check className="w-3 h-3 stroke-[3]" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => openReviewModal(r, 'Revision Required')}
                              className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] uppercase rounded-lg shadow-sm transition-all cursor-pointer"
                            >
                              Revision
                            </button>
                            <button
                              onClick={() => openReviewModal(r, 'Rejected')}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] uppercase rounded-lg shadow-sm transition-all cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        )}

                        {/* Step 3: Manager Disbursement Button */}
                        {canDisburse && isApproved && (
                          <button
                            onClick={() => openDisburseModal(r)}
                            className="px-3 py-1.5 bg-[#b4e600] hover:bg-[#cbf800] text-black font-black text-[10px] uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 ml-auto active:scale-95"
                          >
                            <Receipt className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Process Disbursement</span>
                          </button>
                        )}

                        {/* Step 4: Done / Settled State Details */}
                        {isDone && (
                          <button
                            onClick={() => openDetailsModal(r)}
                            className="px-2.5 py-1 bg-[#0d1117] hover:bg-[#21262d] text-emerald-400 border border-emerald-500/40 font-bold text-[10px] uppercase rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <Receipt className="w-3 h-3" />
                            <span>View Receipt</span>
                          </button>
                        )}

                        {/* If not authorized for current action */}
                        {!((canReview && isSubmitted) || (canDisburse && isApproved) || isDone) && (
                          <span className="text-[10px] text-slate-500 font-mono italic">
                            {isSubmitted && 'Awaiting Owner Sign-off'}
                            {isApproved && 'Awaiting Manager Bank Payout'}
                            {r.status === 'Revision Required' && 'Awaiting Engineer Revision'}
                            {r.status === 'Rejected' && 'Requisition Rejected'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: STEP 2 - PROPERTY OWNER REVIEW & APPROVAL MODAL */}
      {/* ======================================================== */}
      {isReviewOpen && selectedReviewRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#161b22] text-[#f0f6fc] w-full max-w-lg rounded-2xl shadow-2xl border border-[#30363d] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#30363d] flex items-center justify-between bg-[#0d1117]">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-400">Step 2 of 4</span>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Property Owner Milestone Review</h3>
                <p className="text-xs text-slate-400">Validate structural requisitions and authorize tranche payout for Site Manager</p>
              </div>
              <button onClick={() => setIsReviewOpen(false)} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-[#161b22] transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="p-6 space-y-4">
              <div className="p-3.5 bg-[#0d1117] rounded-xl border border-[#30363d] space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Site / Project:</span>
                  <span className="font-bold text-white">{selectedReviewRequest.projectName}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Requisition:</span>
                  <span className="font-bold text-[#b4e600]">{selectedReviewRequest.title}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Submitted Amount:</span>
                  <span className="font-bold font-mono text-emerald-400">{Number(selectedReviewRequest.amount || 0).toLocaleString()} ETB</span>
                </div>
                <div className="pt-2 border-t border-[#30363d] text-slate-300 text-[11px] whitespace-pre-wrap font-mono">
                  {selectedReviewRequest.description}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Decision *</label>
                <select
                  value={reviewDecision}
                  onChange={(e) => setReviewDecision(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-white focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600]"
                >
                  <option value="Approved" className="bg-[#161b22] text-white">Approve (Release to Project Manager for Bank Disbursement)</option>
                  <option value="Revision Required" className="bg-[#161b22] text-white">Request Revision (Require Additional Testing / Docs)</option>
                  <option value="Rejected" className="bg-[#161b22] text-white">Reject (Halt Requisition)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Owner Directives / Remarks</label>
                <textarea
                  rows="3"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Add notes, milestone confirmation, or required amendments..."
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
                  {reviewSubmitting ? 'Recording...' : 'Authorize Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: STEP 3 - MANAGER BANK DISBURSEMENT & EXPENSES SETTLEMENT MODAL */}
      {/* ========================================================================= */}
      {isDisburseOpen && selectedDisburseRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#161b22] text-[#f0f6fc] w-full max-w-2xl rounded-2xl shadow-2xl border border-[#30363d] overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#30363d] flex items-center justify-between bg-[#0d1117] flex-shrink-0">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">Step 3 & 4</span>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Process Bank Disbursement & Expense Settlement</h3>
                <p className="text-xs text-slate-400">Record bank transaction voucher, transport costs, and upload payment receipt</p>
              </div>
              <button 
                onClick={() => setIsDisburseOpen(false)} 
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#161b22] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmitDisbursement} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              {disburseError && (
                <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl flex items-center gap-2 text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{disburseError}</span>
                </div>
              )}

              {/* Summary Card */}
              <div className="p-3.5 bg-[#0d1117] rounded-xl border border-[#30363d] space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Site / Construction Project:</span>
                  <span className="font-bold text-white">{selectedDisburseRequest.projectName}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Requisition Title:</span>
                  <span className="font-bold text-[#b4e600]">{selectedDisburseRequest.title}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Approved Base Amount:</span>
                  <span className="font-bold font-mono text-emerald-400 text-sm">
                    {Number(selectedDisburseRequest.amount || 0).toLocaleString()} ETB
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Authorized by Owner:</span>
                  <span className="text-slate-300 font-semibold">{selectedDisburseRequest.houseHolderName || 'Property Owner'}</span>
                </div>
              </div>

              {/* Bank Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Disbursing Bank / Channel <span className="text-[#b4e600]">*</span>
                  </label>
                  <select
                    value={disburseForm.bankName}
                    onChange={(e) => setDisburseForm({ ...disburseForm, bankName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-white focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600]"
                  >
                    {ETHIOPIAN_BANKS.map((b) => (
                      <option key={b} value={b} className="bg-[#161b22] text-white">{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Payment Method <span className="text-[#b4e600]">*</span>
                  </label>
                  <select
                    value={disburseForm.paymentMethod}
                    onChange={(e) => setDisburseForm({ ...disburseForm, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-white focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600]"
                  >
                    <option value="Bank Transfer" className="bg-[#161b22] text-white">Direct Bank Transfer</option>
                    <option value="Mobile Money (Telebirr/CBE Birr)" className="bg-[#161b22] text-white">Mobile Money (Telebirr / CBE Birr)</option>
                    <option value="Cheque" className="bg-[#161b22] text-white">Corporate Cheque</option>
                    <option value="Cash Voucher" className="bg-[#161b22] text-white">Cash Voucher / Petty Cash</option>
                  </select>
                </div>
              </div>

              {/* Reference and Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Bank Reference / Voucher No. <span className="text-[#b4e600]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., TXN-8942187 or FT24098234"
                    value={disburseForm.paymentReference}
                    onChange={(e) => setDisburseForm({ ...disburseForm, paymentReference: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Transaction Date <span className="text-[#b4e600]">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={disburseForm.paymentDate}
                    onChange={(e) => setDisburseForm({ ...disburseForm, paymentDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-white focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600]"
                  />
                </div>
              </div>

              {/* Additional Expenses Section */}
              <div className="p-3.5 bg-[#0d1117] border border-[#30363d] rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-black uppercase tracking-wider text-white">Additional Site Expenses (Transport, Crane, Labor)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Additional Expenses (ETB)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="e.g., 5000"
                      value={disburseForm.additionalExpenses}
                      onChange={(e) => setDisburseForm({ ...disburseForm, additionalExpenses: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#30363d] bg-[#161b22] text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#b4e600]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Expenses Breakdown Notes
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Cement transport truck haulage + crane offloading"
                      value={disburseForm.expensesNotes}
                      onChange={(e) => setDisburseForm({ ...disburseForm, expensesNotes: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#30363d] bg-[#161b22] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600]"
                    />
                  </div>
                </div>
              </div>

              {/* Live Automatic Total Expenditure Calculation Card */}
              <div className="p-4 bg-gradient-to-r from-[#0d1117] via-[#161b22] to-[#0d1117] border border-[#b4e600]/40 rounded-xl space-y-2 shadow-inner">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Approved Requisition Base:</span>
                  <span className="font-mono text-white font-bold">{Number(selectedDisburseRequest.amount || 0).toLocaleString()} ETB</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>+ Additional Recorded Expenses:</span>
                  <span className="font-mono text-amber-400 font-bold">
                    {(parseFloat(disburseForm.additionalExpenses) || 0).toLocaleString()} ETB
                  </span>
                </div>
                <div className="pt-2 border-t border-[#30363d] flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-white block">
                      Total Disbursed to Ledger:
                    </span>
                    <span className="text-[10px] text-slate-500">
                      * Automatically added to Project Spent Budget
                    </span>
                  </div>
                  <span className="text-lg font-black text-[#b4e600] font-mono">
                    {calculatedTotalDisbursement.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB
                  </span>
                </div>
              </div>

              {/* Bank Payment Receipt Upload */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Upload Bank Payment Receipt / Deposit Slip <span className="text-[#b4e600]">*</span>
                </label>
                <div className="p-4 border-2 border-dashed border-[#30363d] hover:border-[#b4e600]/60 rounded-xl bg-[#0d1117] text-center space-y-2 transition-colors">
                  <UploadCloud className="w-8 h-8 text-[#b4e600] mx-auto" />
                  <div className="text-xs text-slate-300">
                    <label className="font-bold text-[#b4e600] hover:underline cursor-pointer">
                      Click to choose receipt file
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleReceiptFileChange}
                        className="hidden"
                      />
                    </label>
                    <span className="text-slate-500 block text-[11px] mt-0.5">
                      Accepts PNG, JPG, JPEG, or PDF bank transfer slips
                    </span>
                  </div>
                  {receiptFile && (
                    <div className="p-2 bg-[#161b22] border border-[#30363d] rounded-lg text-xs text-white font-mono flex items-center justify-between">
                      <span className="truncate">{receiptFile.name} ({(receiptFile.size / 1024).toFixed(1)} KB)</span>
                      <button
                        type="button"
                        onClick={() => {
                          setReceiptFile(null);
                          setReceiptPreview(null);
                        }}
                        className="text-rose-400 hover:text-rose-300 ml-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {receiptPreview && (
                    <div className="mt-2 max-h-36 overflow-hidden rounded-lg border border-[#30363d]">
                      <img src={receiptPreview} alt="Receipt preview" className="w-full object-contain max-h-36 bg-black" />
                    </div>
                  )}
                </div>
              </div>

              {/* Settlement Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Manager Settlement Notes</label>
                <textarea
                  rows="2"
                  value={disburseForm.notes}
                  onChange={(e) => setDisburseForm({ ...disburseForm, notes: e.target.value })}
                  placeholder="Additional delivery confirmations, cashier reference, or site remarks..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600] resize-none"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-2 flex items-center justify-end gap-2.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsDisburseOpen(false)}
                  className="px-4 py-2 border border-[#30363d] hover:bg-[#0d1117] text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={disburseSubmitting}
                  className="px-5 py-2.5 bg-[#b4e600] hover:bg-[#cbf800] text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-lg cursor-pointer transition-all disabled:opacity-50 flex items-center gap-1.5 active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>{disburseSubmitting ? 'Recording Settlement...' : 'Complete Disbursement & Settle'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 3: STEP 1 - DRAFT SITE REQUISITION MODAL (ENGINEER)     */}
      {/* ============================================================= */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className={`bg-[#161b22] text-[#f0f6fc] w-full ${formData.type === 'Material' ? 'max-w-3xl' : 'max-w-md'} rounded-2xl shadow-2xl border border-[#30363d] overflow-hidden flex flex-col max-h-[90vh] transition-all`}>
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#30363d] flex items-center justify-between bg-[#0d1117] flex-shrink-0">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-400">Step 1 of 4</span>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Draft Site Requisition</h3>
                <p className="text-xs text-slate-400">Submit milestone tranche or material requisition for owner sign-off</p>
              </div>
              <button 
                onClick={handleCloseCreateModal} 
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#161b22] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Scrollable Body */}
            <form onSubmit={handleCreateRequest} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              {createError && (
                <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl flex items-center gap-2 text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              {/* Target Project Dropdown */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Target Project *</label>
                <select
                  required
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-white focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600] transition-all"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#161b22] text-white">{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Type and General Cost Fields */}
              {formData.type === 'Material' ? (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Requisition Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-white focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600] transition-all"
                  >
                    <option value="Payment" className="bg-[#161b22] text-white">Payment Tranche</option>
                    <option value="Material" className="bg-[#161b22] text-white">Material Requisition</option>
                    <option value="Variation" className="bg-[#161b22] text-white">Scope Variation</option>
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Requisition Type *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-white focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600] transition-all"
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
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600] transition-all font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Requisition Subject */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Requisition Subject *</label>
                <input
                  type="text"
                  required
                  placeholder={formData.type === 'Material' ? 'e.g., Structural Foundation Materials Consignment' : 'e.g., Ground Beam Concrete Pouring Sign-off'}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600] transition-all"
                />
              </div>

              {/* DYNAMIC MATERIAL REQUISITION LEDGER */}
              {formData.type === 'Material' && (
                <div className="space-y-3.5 pt-2 pb-2 border-t border-b border-[#30363d]/80 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Boxes className="w-4 h-4 text-[#b4e600]" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-white">Construction Materials Ledger</h4>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono bg-[#0d1117] px-2 py-0.5 rounded border border-[#30363d]">
                      {materials.length} {materials.length === 1 ? 'Material Entry' : 'Material Entries'}
                    </span>
                  </div>

                  {/* Multiple Material Cards List */}
                  <div className="space-y-3">
                    {materials.map((mat, index) => {
                      const itemTotal = (parseFloat(mat.quantity) || 0) * (parseFloat(mat.unitPrice) || 0);
                      return (
                        <div 
                          key={mat.id}
                          className="p-3.5 bg-[#0d1117] border border-[#30363d] rounded-xl space-y-3 relative shadow-inner"
                        >
                          <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#b4e600] flex items-center gap-1.5">
                              <span>Material #{index + 1}</span>
                            </span>
                            {materials.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveMaterial(mat.id)}
                                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 px-2 py-0.5 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-bold uppercase">Remove</span>
                              </button>
                            )}
                          </div>

                          {/* Row 1: Material Name, Material Type, Brand */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                Material Name <span className="text-[#b4e600]">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="e.g., Cement, Steel, Sand, Bricks"
                                value={mat.name}
                                onChange={(e) => handleMaterialChange(mat.id, 'name', e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-lg border border-[#30363d] bg-[#161b22] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600] transition-all"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                Material Type <span className="text-[#b4e600]">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="e.g., OPC Cement, Grade 60"
                                value={mat.type}
                                onChange={(e) => handleMaterialChange(mat.id, 'type', e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-lg border border-[#30363d] bg-[#161b22] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600] transition-all"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                Brand
                              </label>
                              <input
                                type="text"
                                placeholder="e.g., Derba, Dangote, Local"
                                value={mat.brand}
                                onChange={(e) => handleMaterialChange(mat.id, 'brand', e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-lg border border-[#30363d] bg-[#161b22] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600] transition-all"
                              />
                            </div>
                          </div>

                          {/* Row 2: Unit, Quantity, Unit Price (ETB), Total Price (ETB) */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 items-end">
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                Unit <span className="text-[#b4e600]">*</span>
                              </label>
                              <select
                                value={mat.unit}
                                onChange={(e) => handleMaterialChange(mat.id, 'unit', e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-lg border border-[#30363d] bg-[#161b22] text-white focus:outline-none focus:ring-2 focus:ring-[#b4e600] transition-all"
                              >
                                {MATERIAL_UNITS.map((u) => (
                                  <option key={u} value={u} className="bg-[#161b22] text-white">{u}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                Quantity <span className="text-[#b4e600]">*</span>
                              </label>
                              <input
                                type="number"
                                min="0.01"
                                step="any"
                                required
                                placeholder="e.g., 100"
                                value={mat.quantity}
                                onChange={(e) => handleMaterialChange(mat.id, 'quantity', e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-lg border border-[#30363d] bg-[#161b22] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600] transition-all font-mono"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                Unit Price (ETB) <span className="text-[#b4e600]">*</span>
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="any"
                                required
                                placeholder="e.g., 1200"
                                value={mat.unitPrice}
                                onChange={(e) => handleMaterialChange(mat.id, 'unitPrice', e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-lg border border-[#30363d] bg-[#161b22] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600] transition-all font-mono"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                Total Price (ETB)
                              </label>
                              <div className="px-3 py-2 text-xs font-mono font-bold bg-[#161b22] border border-[#30363d] rounded-lg text-emerald-400 truncate flex items-center justify-between">
                                <span>{itemTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                <span className="text-[10px] text-slate-500 font-sans">ETB</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* + Add Another Material Button */}
                  <button
                    type="button"
                    onClick={handleAddMaterial}
                    className="w-full py-2.5 px-3 bg-[#0d1117] hover:bg-[#21262d] text-[#b4e600] border border-dashed border-[#30363d] hover:border-[#b4e600]/60 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99]"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>+ Add Another Material</span>
                  </button>

                  {/* Grand Total Estimated Cost Summary Box */}
                  <div className="p-3.5 bg-gradient-to-r from-[#0d1117] via-[#161b22] to-[#0d1117] border border-[#b4e600]/30 rounded-xl flex items-center justify-between shadow-md">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-[#b4e600]/10 text-[#b4e600] border border-[#b4e600]/20">
                        <Calculator className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Estimated Cost</p>
                        <p className="text-[11px] text-slate-500">Auto-calculated sum of all material entries</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-black text-[#b4e600] font-mono tracking-tight">
                        {totalMaterialCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs text-white font-sans font-bold">ETB</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Work Description / Technical Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Work Description / Details *</label>
                <textarea
                  rows="3"
                  required
                  placeholder={formData.type === 'Material' ? 'Provide installation schedule, structural verification, and delivery notes...' : 'Provide technical validation, milestone verification...'}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600] resize-none transition-all"
                />
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleCloseCreateModal}
                  className="px-4 py-2 border border-[#30363d] hover:bg-[#0d1117] text-slate-300 text-xs font-bold rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#b4e600] hover:bg-[#cbf800] text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-md cursor-pointer transition-all disabled:opacity-50 active:scale-95"
                >
                  {isSubmitting ? 'Transmitting...' : 'Submit Requisition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 4: FULL REQUISITION DETAILS & AUDIT LOG VIEWER          */}
      {/* ============================================================= */}
      {isDetailsOpen && activeDetailsRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#161b22] text-[#f0f6fc] w-full max-w-2xl rounded-2xl shadow-2xl border border-[#30363d] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-[#30363d] flex items-center justify-between bg-[#0d1117]">
              <div>
                <span className="text-[10px] font-mono text-[#b4e600] font-black uppercase tracking-wider">
                  Requisition ID: {activeDetailsRequest.id}
                </span>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">{activeDetailsRequest.title}</h3>
              </div>
              <button 
                onClick={() => setIsDetailsOpen(false)} 
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-[#161b22] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs">
              {/* Pipeline Status Indicator */}
              <div className="p-3 bg-[#0d1117] rounded-xl border border-[#30363d] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Status</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border inline-block mt-1 ${getStatusBadge(activeDetailsRequest.status)}`}>
                    {activeDetailsRequest.status}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Disbursed</span>
                  <span className="text-base font-black font-mono text-emerald-400">
                    {Number(activeDetailsRequest.paymentTotalAmount || activeDetailsRequest.amount || 0).toLocaleString()} ETB
                  </span>
                </div>
              </div>

              {/* Site Details */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-[#0d1117] rounded-xl border border-[#30363d]">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Construction Site</span>
                  <span className="font-bold text-white text-xs">{activeDetailsRequest.projectName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Location</span>
                  <span className="text-slate-300 text-xs">{activeDetailsRequest.projectLocation || 'Municipality Site'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Site Engineer</span>
                  <span className="text-slate-200 text-xs">{activeDetailsRequest.engineerName || activeDetailsRequest.submittedBy}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Property Owner</span>
                  <span className="text-slate-200 text-xs">{activeDetailsRequest.houseHolderName || 'Site Owner'}</span>
                </div>
              </div>

              {/* Description & Technical Breakdown */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Requisition Breakdown</span>
                <div className="p-3.5 bg-[#0d1117] rounded-xl border border-[#30363d] text-slate-200 font-mono text-[11px] whitespace-pre-wrap leading-relaxed">
                  {activeDetailsRequest.description}
                </div>
              </div>

              {/* Payment & Bank Disbursement Details (if processed) */}
              {activeDetailsRequest.bankName && (
                <div className="p-4 bg-[#0d1117] rounded-xl border border-emerald-500/30 space-y-2.5">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Receipt className="w-4 h-4 stroke-[2.5]" />
                    <span className="font-black uppercase tracking-wider text-xs">Bank Disbursement Record</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Disbursing Bank</span>
                      <span className="text-white font-semibold">{activeDetailsRequest.bankName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Method</span>
                      <span className="text-white font-semibold">{activeDetailsRequest.paymentMethod}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Reference Code</span>
                      <span className="font-mono text-sky-400 font-bold">{activeDetailsRequest.paymentReference}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Payment Date</span>
                      <span className="font-mono text-slate-200">{activeDetailsRequest.paymentDate || '—'}</span>
                    </div>
                  </div>

                  {activeDetailsRequest.additionalExpenses > 0 && (
                    <div className="pt-2 border-t border-[#30363d] flex justify-between items-center text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Additional Expenses</span>
                        <span className="text-slate-300 text-[11px]">{activeDetailsRequest.expensesNotes || 'Transport & Logistics'}</span>
                      </div>
                      <span className="font-mono font-bold text-amber-400">
                        +{Number(activeDetailsRequest.additionalExpenses).toLocaleString()} ETB
                      </span>
                    </div>
                  )}

                  {activeDetailsRequest.receiptDocUrl && (
                    <div className="pt-2 border-t border-[#30363d]">
                      <a
                        href={activeDetailsRequest.receiptDocUrl.startsWith('http') ? activeDetailsRequest.receiptDocUrl : `http://localhost:5000${activeDetailsRequest.receiptDocUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#161b22] hover:bg-[#21262d] text-[#b4e600] border border-[#30363d] rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open Bank Receipt Document</span>
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[#30363d] bg-[#0d1117] flex justify-end">
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="px-4 py-2 border border-[#30363d] hover:bg-[#161b22] text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RequestsPage;

