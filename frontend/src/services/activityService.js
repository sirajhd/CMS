import api from './api';

export const activityService = {
  /**
   * Fetch real-time chronological audit trail for a specific construction site
   * @param {string} projectId 
   * @returns {Promise<Array>}
   */
  async getActivitiesByProject(projectId) {
    if (!projectId) return [];
    try {
      const data = await api.get(`/projects/${projectId}/activities`);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn(`Failed to fetch activities for project ${projectId}:`, err);
      // Fallback to query param route
      try {
        const fallback = await api.get(`/activities?projectId=${projectId}`);
        return Array.isArray(fallback) ? fallback : [];
      } catch (subErr) {
        console.error('All activity endpoints failed for project:', subErr);
        return [];
      }
    }
  },

  /**
   * Fetch all activities accessible to the authenticated user, optionally filtered by site
   * @param {string|null} projectId 
   * @returns {Promise<Array>}
   */
  async getAllActivities(projectId = null) {
    try {
      const url = projectId ? `/activities?projectId=${projectId}` : '/activities';
      const data = await api.get(url);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Failed to fetch system activities:', err);
      return [];
    }
  },
};

export default activityService;
