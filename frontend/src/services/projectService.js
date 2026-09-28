import apiClient from './api';

function formatProject(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    name: raw.name,
    location: raw.location,
    houseHolderId: raw.house_holder_id,
    houseHolderName: raw.house_holder_name || 'Assigned Property Owner',
    engineerId: raw.engineer_id,
    engineerName: raw.engineer_name || 'Assigned Lead Engineer',
    managerId: raw.manager_id,
    managerName: raw.manager_name || 'Assigned Operations Manager',
    status: raw.status || 'Active',
    progress: Number(raw.progress) || 0,
    totalBudget: Number(raw.total_budget) || 0,
    spentBudget: Number(raw.spent_budget) || 0,
    startDate: raw.start_date,
    expectedCompletion: raw.expected_completion,
    description: raw.description || '',
  };
}

export const projectService = {
  subscribe(listener) {
    return () => {};
  },

  async getAllProjects() {
    const list = await apiClient.get('/projects');
    return list.map(formatProject);
  },

  async getProjectsForUser(user) {
    // The backend /projects endpoint automatically scopes by the caller's JWT role
    const list = await apiClient.get('/projects');
    return list.map(formatProject);
  },

  async getProjectById(projectId) {
    const item = await apiClient.get(`/projects/${projectId}`);
    return formatProject(item);
  },

  async createProject(projectData) {
    const res = await apiClient.post('/projects', {
      name: projectData.name,
      location: projectData.location,
      houseHolderId: projectData.houseHolderId,
      engineerId: projectData.engineerId,
      managerId: projectData.managerId,
      totalBudget: projectData.totalBudget,
      startDate: projectData.startDate,
      expectedCompletion: projectData.expectedCompletion,
      description: projectData.description,
    });
    return formatProject(res.project || res);
  },

  async updateProject(projectId, projectData) {
    const payload = {
      name: projectData.name,
      location: projectData.location,
      houseHolderId: projectData.houseHolderId,
      engineerId: projectData.engineerId,
      managerId: projectData.managerId,
      status: projectData.status,
      progress: projectData.progress,
      totalBudget: projectData.totalBudget,
      spentBudget: projectData.spentBudget,
      startDate: projectData.startDate,
      expectedCompletion: projectData.expectedCompletion,
      description: projectData.description,
    };
    const res = await apiClient.put(`/projects/${projectId}`, payload);
    return formatProject(res.project || res);
  },

  async deleteProject(projectId) {
    const res = await apiClient.delete(`/projects/${projectId}`);
    return res;
  },

  async assignUserToProject(projectId, data) {
    const proj = await this.getProjectById(projectId);
    return {
      project: proj,
      user: { name: data.name || 'Stakeholder' }
    };
  },

  async removeUserFromProject(projectId, userId) {
    return await this.getProjectById(projectId);
  }
};

export default projectService;
