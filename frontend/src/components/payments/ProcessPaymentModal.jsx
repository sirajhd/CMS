import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { formatCurrency } from '../../utils/formatters';
import { requestService } from '../../services/requestService';
import { CreditCard, CheckCircle, FileText, Hash, DollarSign } from 'lucide-react';

export function ProcessPaymentModal({ isOpen, onClose, item, onPaymentProcessed }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    paymentMethod: 'Commercial Bank of Ethiopia (CBE)',
    paymentReference: '',
    receiptDoc: 'CBE_Bank_Advice_Voucher.pdf',
    comments: 'Disbursement executed. Reference attached.',
  });

  if (!item) return null;

  const paymentMethods = [
    'Commercial Bank of Ethiopia (CBE)',
    'Awash Bank',
    'Bank of Abyssinia',
    'Dashen Bank',
    'CBE Birr / Telebirr',
    'Cash On Site (Petty Cash Voucher)',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Find matching payment record or create one
      const allPayments = await paymentService.getAllPayments();
      let paymentRecord = allPayments.find((p) => p.requestId === item.id || p.id === item.id);

      if (!paymentRecord) {
        paymentRecord = await paymentService.createPaymentFromRequest(item);
      }

      await paymentService.processPayment(paymentRecord.id, formData);
      await requestService.reviewRequest(
        item.id,
        'Completed',
        `Payment settled via ${formData.paymentMethod}. Ref: ${formData.paymentReference}`,
        'Manager Daniel Hailu',
        'Manager'
      );

      if (onPaymentProcessed) onPaymentProcessed();
      onClose();
    } catch (err) {
      console.error('Failed to process payment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Process Approved Payment"
      subtitle={`Milestone: ${item.title} • Amount: ${formatCurrency(item.amount)}`}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Verification Summary Banner */}
        <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs flex items-start gap-2.5">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-emerald-900 block">Owner Approval Confirmed</span>
            <span className="text-emerald-700 block">
              House Holder Abebe Kebede has authorized this milestone release of{' '}
              <strong>{formatCurrency(item.amount)}</strong>. Record disbursement details below.
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <Select
            label="Disbursement Bank / Channel"
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
            options={paymentMethods}
            required
          />

          <Input
            label="Bank Transaction Reference / Cheque #"
            name="paymentReference"
            required
            value={formData.paymentReference}
            onChange={(e) => setFormData({ ...formData, paymentReference: e.target.value })}
            placeholder="e.g. CBE-FT-2026-981023"
            icon={Hash}
            helperText="Official bank transfer confirmation number"
          />

          <Input
            label="Payment Voucher / Receipt File"
            name="receiptDoc"
            required
            value={formData.receiptDoc}
            onChange={(e) => setFormData({ ...formData, receiptDoc: e.target.value })}
            placeholder="e.g. CBE_Deposit_Slip_Signed.pdf"
            icon={FileText}
            helperText="Simulated receipt attachment"
          />

          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-xs font-semibold text-slate-700">Manager Settlement Notes</label>
            <textarea
              rows="2"
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="success"
            size="sm"
            icon={CheckCircle}
            isLoading={isSubmitting}
            disabled={!formData.paymentReference.trim()}
          >
            Confirm Disbursement & Complete
          </Button>
        </div>

      </form>
    </Modal>
  );
}

export default ProcessPaymentModal;
