import db from '../config/db.js';

export async function getActivities(req, res) {
  const { role, id: userId, companyId } = req.user;
  const { projectId, companyId: filterCompanyId } = req.query;

  try {
    const isSuperAdmin = role === 'SuperAdmin';
    const effectiveCompanyId = isSuperAdmin ? (filterCompanyId ? parseInt(filterCompanyId) : null) : companyId;

    // If a specific project is requested, check permissions and company scoping
    if (projectId) {
      let verifyQuery = 'SELECT id, company_id FROM projects WHERE id = $1';
      const verifyParams = [projectId];

      if (!isSuperAdmin) {
        verifyQuery += ' AND company_id = $2';
        verifyParams.push(companyId);

        if (role !== 'Admin') {
          verifyQuery += ' AND (house_holder_id = $3 OR engineer_id = $3 OR manager_id = $3)';
          verifyParams.push(userId);
        }
      }

      const verifyProject = await db.query(verifyQuery, verifyParams);
      if (verifyProject.rows.length === 0) {
        return res.status(403).json({
          message: 'Access Denied: You are not authorized to view activities for this project.'
        });
      }

      const specificQuery = `
        SELECT 
          p.id::text AS id,
          'site_milestone' AS category,
          'Initialized Construction Site' AS action,
          'Site registered at ' || p.location || ' with budget of ETB ' || p.total_budget AS target,
          p.created_at AS timestamp,
          COALESCE(u.name, 'System Administrator') AS actor,
          COALESCE(u.role, 'Admin') AS role,
          p.id::text AS project_id,
          p.name AS project_name
        FROM projects p
        LEFT JOIN users u ON p.house_holder_id = u.id
        WHERE p.id = $1

        UNION ALL

        SELECT 
          r.id::text AS id,
          'request' AS category,
          'Submitted ' || r.type || ' Request' AS action,
          r.title || ' (' || r.status || ')' || CASE WHEN r.amount > 0 THEN ' - ETB ' || r.amount ELSE '' END AS target,
          r.created_at AS timestamp,
          u.name AS actor,
          u.role AS role,
          p.id::text AS project_id,
          p.name AS project_name
        FROM requests r
        JOIN projects p ON r.project_id = p.id
        JOIN users u ON r.submitted_by = u.id
        WHERE r.project_id = $1

        UNION ALL

        SELECT 
          pay.id::text AS id,
          'payment' AS category,
          'Logged Disbursement (' || pay.status || ')' AS action,
          'Tranche of ETB ' || COALESCE(pay.approved_amount, pay.requested_amount) || ' via ' || COALESCE(pay.payment_method, 'Bank Transfer') AS target,
          pay.created_at AS timestamp,
          COALESCE(eng.name, mgr.name, 'Finance Desk') AS actor,
          COALESCE(eng.role, mgr.role, 'Manager') AS role,
          p.id::text AS project_id,
          p.name AS project_name
        FROM payments pay
        JOIN projects p ON pay.project_id = p.id
        LEFT JOIN users eng ON p.engineer_id = eng.id
        LEFT JOIN users mgr ON p.manager_id = mgr.id
        WHERE pay.project_id = $1

        UNION ALL

        SELECT 
          m.id::text AS id,
          'material' AS category,
          'Material Requisition (' || m.delivery_status || ')' AS action,
          m.quantity || ' ' || m.unit || ' of ' || m.material_name || ' (Est. ETB ' || m.estimated_cost || ')' AS target,
          m.created_at AS timestamp,
          u.name AS actor,
          u.role AS role,
          p.id::text AS project_id,
          p.name AS project_name
        FROM materials m
        JOIN projects p ON m.project_id = p.id
        JOIN users u ON m.requested_by = u.id
        WHERE m.project_id = $1

        UNION ALL

        SELECT 
          d.id::text AS id,
          'document' AS category,
          'Archived Site Document' AS action,
          d.name || ' (' || COALESCE(d.type, 'General') || ') - ' || COALESCE(d.file_type, 'file') AS target,
          d.created_at AS timestamp,
          u.name AS actor,
          u.role AS role,
          p.id::text AS project_id,
          p.name AS project_name
        FROM documents d
        JOIN projects p ON d.project_id = p.id
        JOIN users u ON d.uploaded_by = u.id
        WHERE d.project_id = $1

        ORDER BY timestamp DESC
        LIMIT 100;
      `;

      const result = await db.query(specificQuery, [projectId]);
      return res.status(200).json(result.rows);
    }

    // Otherwise, fetch activities across allowed projects within the company
    let whereConditions = [];
    const queryParams = [];

    if (effectiveCompanyId) {
      queryParams.push(effectiveCompanyId);
      whereConditions.push(`p.company_id = $${queryParams.length}`);
    }

    if (!isSuperAdmin && role !== 'Admin') {
      queryParams.push(userId);
      whereConditions.push(`(p.house_holder_id = $${queryParams.length} OR p.engineer_id = $${queryParams.length} OR p.manager_id = $${queryParams.length})`);
    }

    const projectFilterClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const multiQuery = `
      SELECT 
        p.id::text AS id,
        'site_milestone' AS category,
        'Initialized Construction Site' AS action,
        'Site registered at ' || p.location || ' with budget of ETB ' || p.total_budget AS target,
        p.created_at AS timestamp,
        COALESCE(u.name, 'System Administrator') AS actor,
        COALESCE(u.role, 'Admin') AS role,
        p.id::text AS project_id,
        p.name AS project_name
      FROM projects p
      LEFT JOIN users u ON p.house_holder_id = u.id
      ${projectFilterClause}

      UNION ALL

      SELECT 
        r.id::text AS id,
        'request' AS category,
        'Submitted ' || r.type || ' Request' AS action,
        r.title || ' (' || r.status || ')' || CASE WHEN r.amount > 0 THEN ' - ETB ' || r.amount ELSE '' END AS target,
        r.created_at AS timestamp,
        u.name AS actor,
        u.role AS role,
        p.id::text AS project_id,
        p.name AS project_name
      FROM requests r
      JOIN projects p ON r.project_id = p.id
      JOIN users u ON r.submitted_by = u.id
      ${projectFilterClause}

      UNION ALL

      SELECT 
        pay.id::text AS id,
        'payment' AS category,
        'Logged Disbursement (' || pay.status || ')' AS action,
        'Tranche of ETB ' || COALESCE(pay.approved_amount, pay.requested_amount) || ' via ' || COALESCE(pay.payment_method, 'Bank Transfer') AS target,
        pay.created_at AS timestamp,
        COALESCE(eng.name, mgr.name, 'Finance Desk') AS actor,
        COALESCE(eng.role, mgr.role, 'Manager') AS role,
        p.id::text AS project_id,
        p.name AS project_name
      FROM payments pay
      JOIN projects p ON pay.project_id = p.id
      LEFT JOIN users eng ON p.engineer_id = eng.id
      LEFT JOIN users mgr ON p.manager_id = mgr.id
      ${projectFilterClause}

      UNION ALL

      SELECT 
        m.id::text AS id,
        'material' AS category,
        'Material Requisition (' || m.delivery_status || ')' AS action,
        m.quantity || ' ' || m.unit || ' of ' || m.material_name || ' (Est. ETB ' || m.estimated_cost || ')' AS target,
        m.created_at AS timestamp,
        u.name AS actor,
        u.role AS role,
        p.id::text AS project_id,
        p.name AS project_name
      FROM materials m
      JOIN projects p ON m.project_id = p.id
      JOIN users u ON m.requested_by = u.id
      ${projectFilterClause}

      UNION ALL

      SELECT 
        d.id::text AS id,
        'document' AS category,
        'Archived Site Document' AS action,
        d.name || ' (' || COALESCE(d.type, 'General') || ') - ' || COALESCE(d.file_type, 'file') AS target,
        d.created_at AS timestamp,
        u.name AS actor,
        u.role AS role,
        p.id::text AS project_id,
        p.name AS project_name
      FROM documents d
      JOIN projects p ON d.project_id = p.id
      JOIN users u ON d.uploaded_by = u.id
      ${projectFilterClause}

      ORDER BY timestamp DESC
      LIMIT 150;
    `;

    const result = await db.query(multiQuery, queryParams);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching activities:', error);
    return res.status(500).json({ message: 'Failed to retrieve activity audit trail.', error: error.message });
  }
}

export default {
  getActivities,
};
