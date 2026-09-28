import apiClient from './api.js';

function formatUser(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    role: raw.role,
    phone: raw.phone || '',
    title: raw.title || '',
    avatar: raw.avatar || raw.name?.substring(0, 2).toUpperCase() || 'US',
    createdAt: raw.created_at,
    assignedProjects: raw.assignedProjects || [],
  };
}

export const userService = {
  subscribe(listener) {
    return () => {};
  },

  async getAllUsers() {
    const data = await apiClient.get('/users');
    return (data || []).map(formatUser);
  },

  async getUserById(id) {
    const data = await apiClient.get(`/users/${id}`);
    return formatUser(data);
  },

  async createUser(userData) {
    const res = await apiClient.post('/users', userData);
    return formatUser(res.user || res);
  },

  async updateUser(id, userData) {
    const res = await apiClient.put(`/users/${id}`, userData);
    return formatUser(res.user || res);
  },

  async deleteUser(id) {
    const res = await apiClient.delete(`/users/${id}`);
    return res;
  }
};

export default userService;
