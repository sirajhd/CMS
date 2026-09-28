import apiClient from './api.js';

function formatDocument(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    projectId: raw.project_id,
    projectName: raw.project_name || 'Construction Site',
    name: raw.name,
    type: raw.type,
    fileType: raw.file_type || 'PDF',
    size: raw.file_size || '2.4 MB',
    fileUrl: raw.file_url || null,
    uploadedBy: raw.uploaded_by_name || 'Project Stakeholder',
    uploadedById: raw.uploaded_by,
    date: raw.created_at || new Date().toISOString(),
    status: 'Approved',
  };
}

export const documentService = {
  subscribe(listener) {
    return () => {};
  },

  async getAllDocuments() {
    const list = await apiClient.get('/documents');
    return (list || []).map(formatDocument);
  },

  async getDocumentsByProject(projectId) {
    const list = await apiClient.get(`/documents?projectId=${projectId}`);
    return (list || []).map(formatDocument);
  },

  async uploadDocument(documentData) {
    const payload = {
      projectId: documentData.projectId,
      name: documentData.name,
      type: documentData.type,
    };
    const res = await apiClient.post('/documents', payload);
    return formatDocument(res.document || res);
  }
};

export default documentService;
