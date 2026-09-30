import apiClient from './api.js';

function formatPayment(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    projectId: raw.project_id,
    projectName: raw.project_name || 'Construction Site',
    requestId: raw.request_id,
    requestTitle: raw.request_title || 'Payment Tranche',
    requestedAmount: Number(raw.requested_amount) || 0,
    approvedAmount: Number(raw.approved_amount) || 0,
    additionalExpenses: Number(raw.additional_expenses) || 0,
    totalAmount: Number(raw.total_amount) || (Number(raw.approved_amount) || Number(raw.requested_amount) || 0),
    status: raw.status,
    paymentDate: raw.payment_date,
    bankName: raw.bank_name || 'Commercial Bank of Ethiopia',
    paymentMethod: raw.payment_method || 'Bank Transfer',
    paymentReference: raw.payment_reference || '',
    receiptDocUrl: raw.receipt_doc_url || null,
    expensesNotes: raw.expenses_notes || '',
    notes: raw.notes || '',
  };
}

export const paymentService = {
  subscribe(listener) {
    return () => {};
  },

  async getAllPayments() {
    const list = await apiClient.get('/payments');
    return (list || []).map(formatPayment);
  },

  async getPaymentsByProject(projectId) {
    const list = await apiClient.get(`/payments?projectId=${projectId}`);
    return (list || []).map(formatPayment);
  },

  async processPayment(paymentId, formDataObj) {
    const res = await apiClient.patch(`/payments/${paymentId}/process`, formDataObj);
    return formatPayment(res.payment || res);
  }
};

export default paymentService;
