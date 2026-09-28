import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { materialService } from '../../services/materialService';
import { useAuth } from '../../context/AuthContext';
import { Truck, Plus, DollarSign, Package, Layers } from 'lucide-react';

export function CreateMaterialModal({ isOpen, onClose, projects = [], onMaterialCreated }) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    projectId: projects[0]?.id || 'proj-001',
    materialName: '',
    description: '',
    quantity: '',
    unit: 'Quintals',
    estimatedCost: '',
  });

  const unitOptions = [
    { value: 'Quintals', label: 'Quintals (Rebar / Steel)' },
    { value: 'Bags', label: 'Bags (50kg Cement)' },
    { value: 'm³ (Cubic Meters)', label: 'm³ (Aggregate / Sand)' },
    { value: 'Sheets', label: 'Sheets (Corrugated Iron / Roofing)' },
    { value: 'Meters', label: 'Meters (Pipes / Conduits / Cables)' },
    { value: 'Pieces', label: 'Pieces (Hollow Concrete Blocks / Bricks)' },
    { value: 'Truck Loads', label: 'Truck Loads (Selected Fill Material)' },
  ];

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const selectedProject = projects.find((p) => p.id === formData.projectId) || projects[0];

      const payload = {
        projectId: selectedProject?.id || 'proj-001',
        projectName: selectedProject?.name || 'Modern Family House',
        materialName: formData.materialName,
        description: formData.description,
        quantity: Number(formData.quantity) || 1,
        unit: formData.unit,
        estimatedCost: Number(formData.estimatedCost) || 0,
        requestedBy: user?.name || 'Engineer Hana Worku',
      };

      const created = await materialService.createMaterial(payload);

      if (onMaterialCreated) onMaterialCreated(created);
      handleClose();
    } catch (err) {
      console.error('Failed to create material requisition:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      projectId: projects[0]?.id || 'proj-001',
      materialName: '',
      description: '',
      quantity: '',
      unit: 'Quintals',
      estimatedCost: '',
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Requisition Construction Materials"
      subtitle="Specify batch quantities, target site, and procurement budget."
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Project Target */}
        <Select
          label="Target Construction Project"
          name="projectId"
          value={formData.projectId}
          onChange={handleChange}
          options={projects.map((p) => ({ value: p.id, label: `${p.name} (${p.location})` }))}
          required
        />

        {/* Material Name */}
        <Input
          label="Material Name & Grade"
          name="materialName"
          required
          value={formData.materialName}
          onChange={handleChange}
          placeholder="e.g. 14mm Deformed Steel Rebar (Grade 60)"
          icon={Package}
        />

        {/* Quantity & Unit Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Quantity"
            name="quantity"
            type="number"
            required
            value={formData.quantity}
            onChange={handleChange}
            placeholder="e.g. 45"
            icon={Layers}
          />

          <Select
            label="Measurement Unit"
            name="unit"
            value={formData.unit}
            onChange={handleChange}
            options={unitOptions}
            required
          />
        </div>

        {/* Estimated Cost */}
        <Input
          label="Estimated Procurement Cost (ETB)"
          name="estimatedCost"
          type="number"
          required
          value={formData.estimatedCost}
          onChange={handleChange}
          placeholder="e.g. 310000"
          icon={DollarSign}
          helperText="Estimated market quotation in ETB"
        />

        {/* Description / Specifics */}
        <div className="flex flex-col gap-1.5 text-left">
          <label className="text-xs font-semibold text-slate-700">Engineering Batch Notes</label>
          <textarea
            name="description"
            rows="2"
            value={formData.description}
            onChange={handleChange}
            placeholder="e.g. Required for slab casting and cantilever beams. Delivery before Friday..."
            className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button variant="outline" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            icon={Plus}
            isLoading={isSubmitting}
            disabled={!formData.materialName.trim() || !formData.quantity}
          >
            Submit Requisition
          </Button>
        </div>

      </form>
    </Modal>
  );
}

export default CreateMaterialModal;
