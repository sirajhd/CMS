import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { paymentService } from '../../services/paymentService';
import { 
  CreditCard, 
  Landmark, 
  CheckCircle2, 
  Upload, 
  FileText, 
  X, 
  AlertCircle,
  Truck,
  ExternalLink,
  DollarSign,
  Building2,
  Receipt,
  Check
} from 'lucide-react';

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

export function PaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Settlement Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [formData, setFormData] = useState({
    bankName: 'Commercial Bank of Ethiopia (CBE)',
    paymentMethod: 'Bank Transfer',
    paymentReference: '',
    paymentDate: new Date().toISOString().split('T')[0],
    additionalExpenses: '0',
    expensesNotes: '',
    notes: '',
  });

  const canProcess = user?.role === 'Manager';

  const loadPayments = async () => {
    try {
      setIsLoading(true);
      const data = await paymentService.getAllPayments();
      setPayments(data || []);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const calculatedTotalDisbursement = useMemo(() => {
    if (!selectedPayment) return 0;
    const base = Number(selectedPayment.approvedAmount || selectedPayment.requestedAmount) || 0;
    const extra = parseFloat(formData.additionalExpenses) || 0;
    return base + (extra > 0 ? extra : 0);
  }, [selectedPayment, formData.additionalExpenses]);

  const openProcessModal = (payment) => {
    setSelectedPayment(payment);
    setFormError('');
    setReceiptFile(null);
    setReceiptPreview(null);
    setFormData({
      bankName: payment.bankName || 'Commercial Bank of Ethiopia (CBE)',
      paymentMethod: payment.paymentMethod || 'Bank Transfer',
      paymentReference: payment.paymentReference || `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      paymentDate: new Date().toISOString().split('T')[0],
      additionalExpenses: String(payment.additionalExpenses || '0'),
      expensesNotes: payment.expensesNotes || '',
      notes: `Disbursement settled for ${payment.requestTitle || 'Milestone'}`,
    });
    setIsModalOpen(true);
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

  const handleProcessSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPayment) return;
    setFormError('');
    setIsSubmitting(true);

    try {
      if (!formData.paymentReference.trim()) {
        throw new Error('Bank transaction reference number is required.');
      }

      const extraExp = parseFloat(formData.additionalExpenses) || 0;
      if (extraExp < 0) {
        throw new Error('Additional expenses cannot be negative.');
      }

      // Build Multipart Form Data
      const multipart = new FormData();
      multipart.append('bankName', formData.bankName);
      multipart.append('paymentMethod', formData.paymentMethod);
      multipart.append('paymentReference', formData.paymentReference.trim());
      multipart.append('paymentDate', formData.paymentDate);
      multipart.append('additionalExpenses', extraExp);
      multipart.append('expensesNotes', formData.expensesNotes.trim());
      multipart.append('notes', formData.notes.trim());

      if (receiptFile) {
        multipart.append('receipt', receiptFile);
      }

      const updated = await paymentService.processPayment(selectedPayment.id, multipart);
      setPayments((prev) => prev.map((p) => (p.id === selectedPayment.id ? updated : p)));
      setIsModalOpen(false);
      // Reload all payments to ensure consistency
      await loadPayments();
    } catch (err) {
      setFormError(err.message || 'Failed to process disbursement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-[#f0f6fc]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight uppercase">Disbursement Ledger & Financial Settlement</h1>
          <p className="text-xs text-slate-400 mt-1">
            Site-isolated ledger: Track owner-approved tranches, disburse bank funds, account for transit expenses, and archive deposit slips.
          </p>
        </div>
      </div>

      {user?.role === 'Admin' && (
        <div className="p-4 bg-purple-950/40 border border-purple-500/30 rounded-2xl flex items-start gap-3 text-xs text-purple-200">
          <AlertCircle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-black uppercase tracking-wider text-purple-300 block">Administrator Read-Only Oversight</span>
            <p className="text-slate-300 leading-relaxed">
              Per HDtech-CMS workflow policy, the Administrator role is restricted to user and project management. 
              Disbursement processing, recording transport/delivery expenses, and uploading bank vouchers are reserved exclusively for designated <strong>Site Operations Managers</strong>.
            </p>
          </div>
        </div>
      )}

      <div className="bg-[#161b22] rounded-2xl border border-[#30363d] shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0d1117] border-b border-[#30363d] text-slate-400 font-black uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Project Site</th>
                <th className="py-3 px-4">Milestone Requisition</th>
                <th className="py-3 px-4">Approved Base (ETB)</th>
                <th className="py-3 px-4">Extra Expenses</th>
                <th className="py-3 px-4">Total Disbursed (ETB)</th>
                <th className="py-3 px-4">Bank & Reference</th>
                <th className="py-3 px-4">Receipt Slip</th>
                <th className="py-3 px-4">Status</th>
                {canProcess && <th className="py-3 px-4 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363d]/60 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-500 text-xs font-mono">
                    Loading disbursement ledger from PostgreSQL...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-500 text-xs font-mono">
                    No payment records logged in system.
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const isPaid = p.status === 'Paid';
                  const baseAmt = Number(p.approvedAmount || p.requestedAmount || 0);
                  const extraAmt = Number(p.additionalExpenses || 0);
                  const totalAmt = Number(p.totalAmount || (baseAmt + extraAmt));

                  return (
                    <tr key={p.id} className="hover:bg-[#21262d]/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-[#b4e600] flex-shrink-0" />
                          <span>{p.projectName}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">
                        <div className="font-bold text-white">{p.requestTitle}</div>
                        {p.notes && <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">{p.notes}</div>}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                        {baseAmt.toLocaleString()} ETB
                      </td>

                      <td className="py-3.5 px-4 text-xs font-mono">
                        {extraAmt > 0 ? (
                          <div>
                            <span className="text-amber-400 font-bold">+{extraAmt.toLocaleString()} ETB</span>
                            {p.expensesNotes && (
                              <div className="text-[9px] text-slate-400 truncate max-w-[140px] font-sans">
                                {p.expensesNotes}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-black text-emerald-400">
                        {totalAmt.toLocaleString()} ETB
                      </td>

                      <td className="py-3.5 px-4 text-slate-400">
                        <div className="font-semibold text-slate-200">{p.bankName || p.paymentMethod}</div>
                        <div className="font-mono text-[10px] text-sky-400 mt-0.5">
                          {p.paymentReference || 'PENDING-AUTH'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {p.receiptDocUrl ? (
                          <a 
                            href={p.receiptDocUrl.startsWith('http') ? p.receiptDocUrl : `http://localhost:5000${p.receiptDocUrl}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0d1117] border border-[#30363d] text-[11px] font-bold text-[#b4e600] hover:text-[#cbf800] hover:border-[#b4e600]/40 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View Slip</span>
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">None</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          isPaid
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                            : 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                        }`}>
                          {isPaid && <Check className="w-3 h-3 stroke-[3]" />}
                          <span>{p.status}</span>
                        </span>
                      </td>

                      {canProcess && (
                        <td className="py-3.5 px-4 text-right">
                          {p.status === 'Approved' ? (
                            <button
                              onClick={() => openProcessModal(p)}
                              className="px-3 py-1.5 bg-[#b4e600] hover:bg-[#cbf800] text-black font-black uppercase tracking-wider rounded-xl text-[10px] transition-all cursor-pointer shadow-md active:scale-95"
                            >
                              Process Settlement
                            </button>
                          ) : (
                            <span className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider font-mono">
                              Settled
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disbursement Settlement Modal with Receipt Upload */}
      {isModalOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#161b22] text-[#f0f6fc] w-full max-w-lg rounded-2xl shadow-2xl border border-[#30363d] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-[#30363d] flex items-center justify-between bg-[#0d1117] flex-shrink-0">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Disburse Approved Funds</h3>
                <p className="text-xs text-slate-400">Record bank voucher & upload receipt for {selectedPayment.projectName}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-[#161b22] transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleProcessSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              {formError && (
                <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl flex items-center gap-2 text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="p-3 bg-[#0d1117] rounded-xl border border-[#30363d] space-y-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span className="font-bold uppercase tracking-wider text-[10px]">Milestone:</span>
                  <span className="font-bold text-white">{selectedPayment.requestTitle}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span className="font-bold uppercase tracking-wider text-[10px]">Approved Base Sum:</span>
                  <span className="font-black text-[#b4e600] font-mono">{Number(selectedPayment.approvedAmount || selectedPayment.requestedAmount || 0).toLocaleString()} ETB</span>
                </div>
              </div>

              {/* Bank Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Disbursing Bank *</label>
                  <select
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-white focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600]"
                  >
                    {ETHIOPIAN_BANKS.map((b) => (
                      <option key={b} value={b} className="bg-[#161b22] text-white">{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Payment Method *</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-white focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600]"
                  >
                    <option value="Bank Transfer" className="bg-[#161b22] text-white">Direct Bank Transfer</option>
                    <option value="Mobile Money (Telebirr/CBE Birr)" className="bg-[#161b22] text-white">Mobile Money (Telebirr / CBE Birr)</option>
                    <option value="Cheque" className="bg-[#161b22] text-white">Corporate Cheque</option>
                    <option value="Cash Voucher" className="bg-[#161b22] text-white">Cash Voucher / Petty Cash</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Bank Reference / TX ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., CBE-FT-9912048"
                    value={formData.paymentReference}
                    onChange={(e) => setFormData({ ...formData, paymentReference: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.paymentDate}
                    onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-white focus:outline-none focus:ring-2 focus:ring-[#b4e600]"
                  />
                </div>
              </div>

              {/* Additional Expenses */}
              <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase">
                  <Truck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Additional Expenses (Transport / Delivery)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="Extra ETB"
                    value={formData.additionalExpenses}
                    onChange={(e) => setFormData({ ...formData, additionalExpenses: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#30363d] bg-[#161b22] text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#b4e600]"
                  />
                  <input
                    type="text"
                    placeholder="Notes (e.g., Cement transport)"
                    value={formData.expensesNotes}
                    onChange={(e) => setFormData({ ...formData, expensesNotes: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#30363d] bg-[#161b22] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600]"
                  />
                </div>
              </div>

              {/* Total Calculation Card */}
              <div className="p-3 bg-[#0d1117] border border-[#b4e600]/40 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Expenditure Disbursed</span>
                  <span className="text-[10px] text-slate-500">Auto-increments Project Spent Budget</span>
                </div>
                <span className="text-base font-mono font-black text-[#b4e600]">
                  {calculatedTotalDisbursement.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB
                </span>
              </div>

              {/* Bank Receipt File Upload */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Attach Bank Deposit Slip / Voucher</label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 bg-[#0d1117] hover:bg-[#21262d] text-slate-300 hover:text-white font-bold rounded-xl text-xs transition-colors border border-[#30363d]">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{receiptFile ? 'Change File' : 'Select Slip (PDF/Image)'}</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleReceiptFileChange}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[11px] text-slate-400 truncate max-w-[180px]">
                    {receiptFile ? receiptFile.name : 'No file chosen'}
                  </span>
                </div>
                {receiptPreview && (
                  <div className="mt-2 max-h-28 overflow-hidden rounded-lg border border-[#30363d]">
                    <img src={receiptPreview} alt="Slip preview" className="w-full object-contain max-h-28 bg-black" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Approval / Transaction Comments</label>
                <textarea
                  rows="2"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Enter manager settlement notes or voucher remarks..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600] resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#30363d] hover:bg-[#0d1117] text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#b4e600] hover:bg-[#cbf800] text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-md cursor-pointer transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Uploading & Settling...' : 'Confirm Bank Disbursement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentsPage;

