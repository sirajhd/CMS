import apiClient from './api.js';

function formatRequest(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    projectId: raw.project_id,
    projectName: raw.project_name || 'Construction Site',
    title: raw.title,
    type: raw.type,
    amount: Number(raw.amount) || 0,
    status: raw.status,
    description: raw.description || '',
    submittedBy: raw.submitted_by_name || 'Site Engineer',
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
      comments: commentText,
    };
    const res = await apiClient.patch(`/requests/${requestId}/review`, payload);
    return formatRequest(res.request || res);
  }
};

export default requestService;
