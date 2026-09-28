import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { formatCurrency } from '../../utils/formatters';
import { materialService } from '../../services/materialService';
import { Truck, CheckCircle, FileText, Calendar } from 'lucide-react';

export function DeliverMaterialModal({ isOpen, onClose, material, onDeliveryRecorded }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    deliveryDate: new Date().toISOString().split('T')[0],
    receivingDocument: 'Mugher_Delivery_Waybill_Signed.pdf',
    notes: 'Offloaded at site under supervision of Site Foreman.',
  });

  if (!material) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await materialService.recordDelivery(material.id, formData);
      if (onDeliveryRecorded) onDeliveryRecorded();
      onClose();
    } catch (err) {
      console.error('Failed to record delivery:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Material Delivery to Site"
      subtitle={`${material.materialName} (${material.quantity} ${material.unit})`}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Verification Summary */}
        <div className="p-3.5 bg-sky-50 rounded-xl border border-sky-200 text-xs flex items-start gap-2.5">
          <Truck className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-sky-900 block">Site Delivery Verification</span>
            <span className="text-sky-700 block">
              Confirm arrival of <strong>{material.quantity} {material.unit}</strong> at{' '}
              <strong>{material.projectName}</strong>. Estimated value: {formatCurrency(material.estimatedCost)}.
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <Input
            label="Actual Delivery Date"
            name="deliveryDate"
            type="date"
            required
            value={formData.deliveryDate}
            onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
            icon={Calendar}
          />

          <Input
            label="Signed Receiving Waybill / Delivery Ticket"
            name="receivingDocument"
            required
            value={formData.receivingDocument}
            onChange={(e) => setFormData({ ...formData, receivingDocument: e.target.value })}
            placeholder="e.g. Dangote_Cement_Waybill_981.pdf"
            icon={FileText}
            helperText="Simulated delivery note signed by site foreman"
          />

          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-xs font-semibold text-slate-700">Inspection & Offloading Notes</label>
            <textarea
              rows="2"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
          >
            Confirm Site Receipt
          </Button>
        </div>

      </form>
    </Modal>
  );
}

export default DeliverMaterialModal;
