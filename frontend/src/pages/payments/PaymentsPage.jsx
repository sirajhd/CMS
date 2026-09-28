import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { paymentService } from '../../services/paymentService';
import { CreditCard, Landmark, CheckCircle2, Upload, FileText, X, AlertCircle } from 'lucide-react';

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
  const [formData, setFormData] = useState({
    paymentMethod: 'Commercial Bank of Ethiopia',
    paymentReference: '',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const canProcess = user?.role === 'Manager' || user?.role === 'Admin';

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

  const openProcessModal = (payment) => {
    setSelectedPayment(payment);
    setFormError('');
    setReceiptFile(null);
    setFormData({
      paymentMethod: 'Commercial Bank of Ethiopia',
      paymentReference: `CBE-TX-${Math.floor(100000 + Math.random() * 900000)}`,
      paymentDate: new Date().toISOString().split('T')[0],
      notes: `Payout authorized for milestone: ${payment.requestTitle || 'Milestone'}`,
    });
    setIsModalOpen(true);
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

      // Build Multipart Form Data so file upload works
      const multipart = new FormData();
      multipart.append('paymentMethod', formData.paymentMethod);
      multipart.append('paymentReference', formData.paymentReference);
      multipart.append('paymentDate', formData.paymentDate);
      multipart.append('notes', formData.notes);
      if (receiptFile) {
        multipart.append('receipt', receiptFile);
      }

      const updated = await paymentService.processPayment(selectedPayment.id, multipart);
      setPayments((prev) => prev.map((p) => (p.id === selectedPayment.id ? updated : p)));
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err.message || 'Failed to process disbursement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-[#f0f6fc]">
      <div>
        <h1 className="text-xl font-black text-white tracking-tight uppercase">Financial Ledger & Disbursements</h1>
        <p className="text-xs text-slate-400">Track milestone payouts, upload bank receipts, and review manager vouchers.</p>
      </div>

      <div className="bg-[#161b22] rounded-2xl border border-[#30363d] shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0d1117] border-b border-[#30363d] text-slate-400 font-black uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Milestone / Description</th>
                <th className="py-3 px-4">Approved Amount</th>
                <th className="py-3 px-4">Disbursement Method</th>
                <th className="py-3 px-4">Reference Voucher</th>
                <th className="py-3 px-4">Receipt Doc</th>
                <th className="py-3 px-4">Status</th>
                {canProcess && <th className="py-3 px-4 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363d]/60 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500 text-xs">
                    Loading payments from PostgreSQL ledger...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500 text-xs">
                    No payment records logged in system.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-[#21262d]/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">{p.projectName}</td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <div>{p.requestTitle}</div>
                      {p.notes && <div className="text-[10px] text-slate-400 mt-0.5">{p.notes}</div>}
                    </td>
                    <td className="py-3.5 px-4 font-black text-[#b4e600]">{p.approvedAmount?.toLocaleString()} ETB</td>
                    <td className="py-3.5 px-4 text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Landmark className="w-3.5 h-3.5 text-slate-500" />
                        <span>{p.paymentMethod || 'Commercial Bank of Ethiopia'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      {p.paymentReference || 'PENDING-AUTH'}
                    </td>
                    <td className="py-3.5 px-4">
                      {p.receiptDocUrl ? (
                        <a 
                          href={`http://localhost:5000${p.receiptDocUrl}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#b4e600] hover:text-[#cbf800] uppercase tracking-wider underline"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          View Receipt
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">None</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        p.status === 'Paid'
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    {canProcess && (
                      <td className="py-3.5 px-4 text-right">
                        {p.status === 'Approved' ? (
                          <button
                            onClick={() => openProcessModal(p)}
                            className="px-3 py-1.5 bg-[#b4e600] hover:bg-[#cbf800] text-black font-black uppercase tracking-wider rounded-lg text-[10px] transition-all cursor-pointer shadow-xs"
                          >
                            Process Payout
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">Settled</span>
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

      {/* Disbursement Settlement Modal with Receipt Upload */}
      {isModalOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#161b22] text-[#f0f6fc] w-full max-w-md rounded-2xl shadow-2xl border border-[#30363d] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#30363d] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Disburse Approved Funds</h3>
                <p className="text-xs text-slate-400">Record bank voucher & upload receipt for {selectedPayment.projectName}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-[#0d1117] transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleProcessSubmit} className="p-6 space-y-4">
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
                  <span className="font-bold uppercase tracking-wider text-[10px]">Approved Sum:</span>
                  <span className="font-black text-[#b4e600]">{selectedPayment.approvedAmount?.toLocaleString()} ETB</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Payment Method *</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-white focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600]"
                >
                  <option value="Commercial Bank of Ethiopia" className="bg-[#161b22] text-white">Commercial Bank of Ethiopia (CBE)</option>
                  <option value="Awash Bank" className="bg-[#161b22] text-white">Awash Bank</option>
                  <option value="Dashen Bank" className="bg-[#161b22] text-white">Dashen Bank</option>
                  <option value="Telebirr" className="bg-[#161b22] text-white">Telebirr Business Payout</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Bank Reference Voucher / TX ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., CBE-FT-9912048"
                  value={formData.paymentReference}
                  onChange={(e) => setFormData({ ...formData, paymentReference: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600] font-mono"
                />
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
                      onChange={(e) => setReceiptFile(e.target.files[0])}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[11px] text-slate-400 truncate max-w-[180px]">
                    {receiptFile ? receiptFile.name : 'No file chosen'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Approval / Transaction Comments</label>
                <textarea
                  rows="2"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Enter manager settlement notes or voucher remarks..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600] resize-none"
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
