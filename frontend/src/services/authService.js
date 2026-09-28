import apiClient from './api';

const SESSION_STORAGE_KEY = 'cms_session_user';

export const authService = {
  async login(email, password) {
    const data = await apiClient.post('/auth/login', { email, password });
    
    // Server returns { token, user: { id, name, email, role, phone, title } }
    const sessionData = {
      ...data.user,
      token: data.token,
    };

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    return sessionData;
  },

  async register(userData) {
    const data = await apiClient.post('/auth/register', userData);
    const sessionData = {
      ...data.user,
      token: data.token,
    };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    return sessionData;
  },

  async forgotPassword(email) {
    return await apiClient.post('/auth/forgot-password', { email });
  },

  async verifyResetToken(token) {
    return await apiClient.get(`/auth/verify-reset-token/${encodeURIComponent(token)}`);
  },

  async resetPassword(token, newPassword) {
    return await apiClient.post('/auth/reset-password', { token, newPassword });
  },

  getCurrentUser() {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  async logout() {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
};

export default authService;
