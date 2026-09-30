import apiClient from './api.js';

export const superAdminService = {
  async getPlatformStats() {
    const data = await apiClient.get('/superadmin/stats');
    return data.stats || data;
  },

  async getCompanies(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);
    
    const url = `/superadmin/companies${query.toString() ? `?${query.toString()}` : ''}`;
    const data = await apiClient.get(url);
    return data.companies || data;
  },

  async getCompanyById(id) {
    const data = await apiClient.get(`/superadmin/companies/${id}`);
    return data;
  },

  async createCompany(companyData) {
    const data = await apiClient.post('/superadmin/companies', companyData);
    return data;
  },

  async updateCompany(id, companyData) {
    const data = await apiClient.put(`/superadmin/companies/${id}`, companyData);
    return data;
  },

  async updateCompanyStatus(id, status) {
    const data = await apiClient.patch(`/superadmin/companies/${id}/status`, { status });
    return data;
  },

  async getAuditLogs(params = {}) {
    const query = new URLSearchParams();
    if (params.companyId) query.append('companyId', params.companyId);
    if (params.action) query.append('action', params.action);
    if (params.limit) query.append('limit', params.limit);

    const url = `/superadmin/audit-logs${query.toString() ? `?${query.toString()}` : ''}`;
    const data = await apiClient.get(url);
    return data.auditLogs || data;
  }
};

export default superAdminService;
