import apiClient from './api';

function formatMaterial(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    projectId: raw.project_id,
    projectName: raw.project_name || 'Construction Site',
    requestId: raw.request_id,
    materialName: raw.material_name,
    description: raw.description,
    quantity: Number(raw.quantity) || 0,
    unit: raw.unit,
    estimatedCost: Number(raw.estimated_cost) || 0,
    requestedBy: raw.requested_by_name || 'Site Engineer',
    approvalStatus: raw.approval_status || 'Approved',
    deliveryStatus: raw.delivery_status || 'Pending',
    deliveryDate: raw.delivery_date,
    waybillDocUrl: raw.waybill_doc_url,
  };
}

export const materialService = {
  subscribe(listener) {
    return () => {};
  },

  async getAllMaterials() {
    const list = await apiClient.get('/materials');
    return list.map(formatMaterial);
  },

  async getMaterialsByProject(projectId) {
    const list = await apiClient.get(`/materials?projectId=${projectId}`);
    return list.map(formatMaterial);
  },

  async createMaterial(materialData) {
    const res = await apiClient.post('/materials', {
      projectId: materialData.projectId,
      materialName: materialData.materialName,
      description: materialData.description,
      quantity: materialData.quantity,
      unit: materialData.unit,
      estimatedCost: materialData.estimatedCost,
    });
    return formatMaterial(res.material);
  },

  async recordDelivery(materialId, details) {
    const res = await apiClient.patch(`/materials/${materialId}/deliver`, {
      deliveryDate: details.deliveryDate,
      notes: details.notes,
      waybillDocUrl: details.waybillDocUrl,
    });
    return formatMaterial(res.material);
  }
};

export default materialService;
