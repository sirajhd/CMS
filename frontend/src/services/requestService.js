import apiClient from './api.js';

function formatRequest(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    projectId: raw.project_id,
    projectName: raw.project_name || 'Construction Site',
    projectLocation: raw.project_location || '',
    houseHolderId: raw.house_holder_id,
    engineerId: raw.engineer_id,
    managerId: raw.manager_id,
    title: raw.title,
    type: raw.type,
    amount: Number(raw.amount) || 0,
    status: raw.status,
    description: raw.description || '',
    submittedBy: raw.submitted_by_name || 'Site Engineer',
    submittedByRole: raw.submitted_by_role || 'Engineer',
    houseHolderName: raw.house_holder_name || 'Property Owner',
    engineerName: raw.engineer_name || 'Site Engineer',
    managerName: raw.manager_name || 'Project Manager',
    paymentId: raw.payment_id,
    paymentStatus: raw.payment_status,
    bankName: raw.bank_name,
    paymentMethod: raw.payment_method,
    paymentReference: raw.payment_reference,
    paymentDate: raw.payment_date,
    additionalExpenses: Number(raw.additional_expenses) || 0,
    paymentTotalAmount: Number(raw.payment_total_amount) || Number(raw.amount) || 0,
    receiptDocUrl: raw.receipt_doc_url,
    expensesNotes: raw.expenses_notes || '',
    comments: Array.isArray(raw.comments) 
      ? raw.comments 
      : (typeof raw.comments === 'string' ? JSON.parse(raw.comments || '[]') : []),
    createdAt: raw.created_at,
  };
}

export const requestService = {
  subscribe(listener) {
    return () => {};
  },

  async getAllRequests() {
    const list = await apiClient.get('/requests');
    return (list || []).map(formatRequest);
  },

  async getRequestsByProject(projectId) {
    const list = await apiClient.get(`/requests?projectId=${projectId}`);
    return (list || []).map(formatRequest);
  },

  async createRequest(data) {
    const payload = {
      projectId: data.projectId,
      type: data.type,
      title: data.title,
      amount: Number(data.amount) || 0,
      description: data.description,
    };
    const res = await apiClient.post('/requests', payload);
    return formatRequest(res.request || res);
  },

  async reviewRequest(requestId, status, commentText) {
    const payload = {
      status,
      comment: commentText,
    };
    const res = await apiClient.patch(`/requests/${requestId}/review`, payload);
    return formatRequest(res.request || res);
  },

  async processDisbursement(requestId, disbursementData) {
    let payload;
    if (disbursementData instanceof FormData) {
      payload = disbursementData;
    } else {
      payload = {
        bankName: disbursementData.bankName,
        paymentMethod: disbursementData.paymentMethod,
        paymentReference: disbursementData.paymentReference,
        paymentDate: disbursementData.paymentDate,
        additionalExpenses: Number(disbursementData.additionalExpenses) || 0,
        expensesNotes: disbursementData.expensesNotes || '',
        notes: disbursementData.notes || '',
        receiptUrl: disbursementData.receiptUrl || '',
      };
    }
    const res = await apiClient.patch(`/requests/${requestId}/process`, payload);
    return {
      message: res.message,
      request: formatRequest(res.request),
      payment: res.payment,
      totalExpenditure: res.totalExpenditure,
    };
  }
};

export default requestService;

