import db from '../config/db.js';

export async function verifySiteAccess(req, res, next) {
  const { role, id: userId, companyId } = req.user;
  const projectId = req.params.id || req.params.projectId || req.body.projectId || req.body.project_id || req.query.projectId || req.query.project_id;

  if (role === 'SuperAdmin') {
    return next();
  }

  if (role === 'Admin') {
    return next();
  }

  if (!projectId) {
    return res.status(400).json({ message: 'Project ID is required for verification.' });
  }

  try {
    const query = `
      SELECT id FROM projects 
      WHERE id = $1 AND company_id = $2 AND (
        house_holder_id = $3 OR 
        engineer_id = $3 OR 
        manager_id = $3
      )
    `;
    const result = await db.query(query, [projectId, companyId, userId]);

    if (result.rows.length === 0) {
      return res.status(403).json({
        message: 'Access Denied: You are not an assigned stakeholder for this construction site.'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      message: 'Database security verification failed',
      error: error.message
    });
  }
}

export default verifySiteAccess;
