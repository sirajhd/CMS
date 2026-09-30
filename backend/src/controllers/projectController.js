import db from '../config/db.js';
import { logAudit } from '../utils/auditLogger.js';

export async function getProjects(req, res) {
  const { role, id: userId, companyId } = req.user;
  const requestedCompanyId = req.query.companyId;

  try {
    let queryText = `
      SELECT 
        p.*,
        c.name AS company_name,
        c.code AS company_code,
        hh.name AS house_holder_name,
        eng.name AS engineer_name,
        mgr.name AS manager_name,
        COUNT(DISTINCT s.id)::int AS sites_count
      FROM projects p
      LEFT JOIN companies c ON p.company_id = c.id
      LEFT JOIN users hh ON p.house_holder_id = hh.id
      LEFT JOIN users eng ON p.engineer_id = eng.id
      LEFT JOIN users mgr ON p.manager_id = mgr.id
      LEFT JOIN sites s ON p.id = s.project_id
    `;
    const params = [];

    if (role === 'SuperAdmin') {
      if (requestedCompanyId) {
        queryText += ' WHERE p.company_id = $1';
        params.push(requestedCompanyId);
      }
    } else {
      // Strict Company Tenant Isolation
      queryText += ' WHERE p.company_id = $1';
      params.push(companyId);

      // Role Scoping within the company
      if (role === 'Engineer') {
        queryText += ' AND p.engineer_id = $2';
        params.push(userId);
      } else if (role === 'House Holder') {
        queryText += ' AND p.house_holder_id = $2';
        params.push(userId);
      } else if (role === 'Manager') {
        queryText += ' AND p.manager_id = $2';
        params.push(userId);
      }
    }

    queryText += ' GROUP BY p.id, c.id, hh.id, eng.id, mgr.id ORDER BY p.created_at DESC;';

    const result = await db.query(queryText, params);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return res.status(500).json({ message: 'Failed to retrieve projects.', error: error.message });
  }
}

export async function getProjectById(req, res) {
  const { id } = req.params;
  const { role, companyId } = req.user;

  try {
    let queryText = `
      SELECT 
        p.*,
        c.name AS company_name,
        c.code AS company_code,
        hh.name AS house_holder_name,
        eng.name AS engineer_name,
        mgr.name AS manager_name
      FROM projects p
      LEFT JOIN companies c ON p.company_id = c.id
      LEFT JOIN users hh ON p.house_holder_id = hh.id
      LEFT JOIN users eng ON p.engineer_id = eng.id
      LEFT JOIN users mgr ON p.manager_id = mgr.id
      WHERE p.id = $1
    `;
    const params = [id];

    if (role !== 'SuperAdmin') {
      queryText += ' AND p.company_id = $2';
      params.push(companyId);
    }

    const result = await db.query(queryText, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found in your company workspace.' });
    }

    const project = result.rows[0];

    // Fetch site parcels for this project
    const sitesRes = await db.query('SELECT * FROM sites WHERE project_id = $1 ORDER BY created_at ASC', [id]);
    project.sites = sitesRes.rows;

    return res.status(200).json(project);
  } catch (error) {
    console.error('Error fetching project by ID:', error);
    return res.status(500).json({ message: 'Failed to retrieve project.', error: error.message });
  }
}

export async function createProject(req, res) {
  const {
    name,
    code,
    location,
    houseHolderId,
    engineerId,
    managerId,
    totalBudget,
    startDate,
    expectedCompletion,
    description,
    siteName,
    siteDetails,
  } = req.body;

  const { id: creatorId, role: creatorRole, companyId: creatorCompanyId } = req.user;

  if (!name || !location) {
    return res.status(400).json({ message: 'Project name and site location are required.' });
  }

  let targetCompanyId = creatorCompanyId;
  if (creatorRole === 'SuperAdmin') {
    targetCompanyId = req.body.companyId || null;
  }

  if (!targetCompanyId) {
    return res.status(403).json({ message: 'Access Denied: Missing company workspace assignment.' });
  }

  const validStartDate = startDate || new Date().toISOString().split('T')[0];
  const validEndDate = expectedCompletion || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Validate that assigned stakeholders belong to this company
    const stakeholderIds = [houseHolderId, engineerId, managerId].filter(Boolean);
    if (stakeholderIds.length > 0) {
      const checkRes = await client.query(
        'SELECT id FROM users WHERE id = ANY($1::uuid[]) AND company_id = $2',
        [stakeholderIds, targetCompanyId]
      );
      if (checkRes.rows.length !== stakeholderIds.length) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          message: 'One or more assigned stakeholders do not belong to your company workspace.',
        });
      }
    }

    const insertQuery = `
      INSERT INTO projects (
        company_id, name, code, location, house_holder_id, engineer_id, manager_id,
        total_budget, spent_budget, progress, status,
        start_date, expected_completion, description
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, 0.00, 0, 'Active',
        $9, $10, $11
      )
      RETURNING *;
    `;

    const values = [
      targetCompanyId,
      name.trim(),
      code ? code.trim() : null,
      location.trim(),
      houseHolderId || null,
      engineerId || null,
      managerId || null,
      Number(totalBudget) || 0.00,
      validStartDate,
      validEndDate,
      description || '',
    ];

    const insertResult = await client.query(insertQuery, values);
    const newProject = insertResult.rows[0];

    // Create default site parcel
    await client.query(`
      INSERT INTO sites (company_id, project_id, name, location, details)
      VALUES ($1, $2, $3, $4, $5);
    `, [
      targetCompanyId,
      newProject.id,
      siteName ? siteName.trim() : `${newProject.name} - Primary Parcel`,
      location.trim(),
      siteDetails || 'Primary construction site zone',
    ]);

    // Create project assignments
    if (engineerId) {
      await client.query(`
        INSERT INTO project_assignments (company_id, project_id, user_id, role)
        VALUES ($1, $2, $3, 'Engineer') ON CONFLICT DO NOTHING;
      `, [targetCompanyId, newProject.id, engineerId]);
    }
    if (houseHolderId) {
      await client.query(`
        INSERT INTO project_assignments (company_id, project_id, user_id, role)
        VALUES ($1, $2, $3, 'House Holder') ON CONFLICT DO NOTHING;
      `, [targetCompanyId, newProject.id, houseHolderId]);
    }
    if (managerId) {
      await client.query(`
        INSERT INTO project_assignments (company_id, project_id, user_id, role)
        VALUES ($1, $2, $3, 'Manager') ON CONFLICT DO NOTHING;
      `, [targetCompanyId, newProject.id, managerId]);
    }

    // Increment company's total_sites
    await client.query('UPDATE companies SET total_sites = total_sites + 1 WHERE id = $1', [targetCompanyId]);

    // Log Audit
    await client.query(`
      INSERT INTO audit_logs (company_id, user_id, action, entity_type, entity_id, details)
      VALUES ($1, $2, 'CREATE_PROJECT', 'PROJECT', $3::text, $4);
    `, [
      targetCompanyId,
      creatorId,
      newProject.id,
      `Project "${newProject.name}" created with budget of ETB ${newProject.total_budget}.`,
    ]);

    await client.query('COMMIT');

    // Fetch joined record
    const populated = await db.query(`
      SELECT 
        p.*,
        c.name AS company_name,
        hh.name AS house_holder_name,
        eng.name AS engineer_name,
        mgr.name AS manager_name
      FROM projects p
      LEFT JOIN companies c ON p.company_id = c.id
      LEFT JOIN users hh ON p.house_holder_id = hh.id
      LEFT JOIN users eng ON p.engineer_id = eng.id
      LEFT JOIN users mgr ON p.manager_id = mgr.id
      WHERE p.id = $1
    `, [newProject.id]);

    return res.status(201).json({
      message: 'Construction project registered successfully in company workspace.',
      project: populated.rows[0] || newProject,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating project:', error);
    return res.status(500).json({ message: 'Failed to create project in database.', error: error.message });
  } finally {
    client.release();
  }
}

export async function updateProject(req, res) {
  const { id } = req.params;
  const {
    name,
    code,
    location,
    houseHolderId,
    engineerId,
    managerId,
    status,
    progress,
    totalBudget,
    spentBudget,
    startDate,
    expectedCompletion,
    description,
  } = req.body;

  const { id: editorId, role: editorRole, companyId: editorCompanyId } = req.user;

  try {
    let checkQuery = 'SELECT * FROM projects WHERE id = $1';
    const checkParams = [id];
    if (editorRole !== 'SuperAdmin') {
      checkQuery += ' AND company_id = $2';
      checkParams.push(editorCompanyId);
    }

    const existing = await db.query(checkQuery, checkParams);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found in your company workspace.' });
    }

    const current = existing.rows[0];

    // Validate assigned users belong to same company
    const newStakeholderIds = [houseHolderId, engineerId, managerId].filter(Boolean);
    if (newStakeholderIds.length > 0) {
      const checkRes = await db.query(
        'SELECT id FROM users WHERE id = ANY($1::uuid[]) AND company_id = $2',
        [newStakeholderIds, current.company_id]
      );
      if (checkRes.rows.length !== newStakeholderIds.length) {
        return res.status(400).json({
          message: 'One or more assigned stakeholders do not belong to this project company.',
        });
      }
    }

    const updatedName = name !== undefined ? String(name).trim() : current.name;
    const updatedCode = code !== undefined ? (code ? String(code).trim() : null) : current.code;
    const updatedLocation = location !== undefined ? String(location).trim() : current.location;
    const updatedHouseHolderId = houseHolderId !== undefined ? (houseHolderId || null) : current.house_holder_id;
    const updatedEngineerId = engineerId !== undefined ? (engineerId || null) : current.engineer_id;
    const updatedManagerId = managerId !== undefined ? (managerId || null) : current.manager_id;
    const updatedStatus = status !== undefined ? status : current.status;
    const updatedProgress = progress !== undefined ? Math.min(100, Math.max(0, parseInt(progress, 10) || 0)) : current.progress;
    const updatedTotalBudget = totalBudget !== undefined ? Number(totalBudget) || 0.00 : current.total_budget;
    const updatedSpentBudget = spentBudget !== undefined ? Number(spentBudget) || 0.00 : current.spent_budget;
    const updatedStartDate = startDate !== undefined ? startDate : current.start_date;
    const updatedExpectedCompletion = expectedCompletion !== undefined ? expectedCompletion : current.expected_completion;
    const updatedDescription = description !== undefined ? description : current.description;

    const updateQuery = `
      UPDATE projects
      SET
        name = $1,
        code = $2,
        location = $3,
        house_holder_id = $4,
        engineer_id = $5,
        manager_id = $6,
        status = $7,
        progress = $8,
        total_budget = $9,
        spent_budget = $10,
        start_date = $11,
        expected_completion = $12,
        description = $13,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $14
      RETURNING *;
    `;

    const values = [
      updatedName,
      updatedCode,
      updatedLocation,
      updatedHouseHolderId,
      updatedEngineerId,
      updatedManagerId,
      updatedStatus,
      updatedProgress,
      updatedTotalBudget,
      updatedSpentBudget,
      updatedStartDate,
      updatedExpectedCompletion,
      updatedDescription,
      id,
    ];

    await db.query(updateQuery, values);

    // Sync project assignments
    if (engineerId) {
      await db.query(
        'INSERT INTO project_assignments (company_id, project_id, user_id, role) VALUES ($1, $2, $3, \'Engineer\') ON CONFLICT (project_id, user_id) DO NOTHING',
        [current.company_id, id, engineerId]
      );
    }
    if (houseHolderId) {
      await db.query(
        'INSERT INTO project_assignments (company_id, project_id, user_id, role) VALUES ($1, $2, $3, \'House Holder\') ON CONFLICT (project_id, user_id) DO NOTHING',
        [current.company_id, id, houseHolderId]
      );
    }
    if (managerId) {
      await db.query(
        'INSERT INTO project_assignments (company_id, project_id, user_id, role) VALUES ($1, $2, $3, \'Manager\') ON CONFLICT (project_id, user_id) DO NOTHING',
        [current.company_id, id, managerId]
      );
    }

    await logAudit({
      companyId: current.company_id,
      userId: editorId,
      action: 'UPDATE_PROJECT',
      entityType: 'PROJECT',
      entityId: id,
      details: `Project "${updatedName}" updated.`,
    });

    const populated = await db.query(`
      SELECT 
        p.*,
        c.name AS company_name,
        hh.name AS house_holder_name,
        eng.name AS engineer_name,
        mgr.name AS manager_name
      FROM projects p
      LEFT JOIN companies c ON p.company_id = c.id
      LEFT JOIN users hh ON p.house_holder_id = hh.id
      LEFT JOIN users eng ON p.engineer_id = eng.id
      LEFT JOIN users mgr ON p.manager_id = mgr.id
      WHERE p.id = $1
    `, [id]);

    return res.status(200).json({
      message: 'Project updated successfully.',
      project: populated.rows[0],
    });
  } catch (error) {
    console.error('Error updating project:', error);
    return res.status(500).json({ message: 'Failed to update project in database.', error: error.message });
  }
}

export async function deleteProject(req, res) {
  const { id } = req.params;
  const { id: deleterId, role: deleterRole, companyId: deleterCompanyId } = req.user;

  try {
    let checkQuery = 'SELECT id, name, company_id FROM projects WHERE id = $1';
    const checkParams = [id];
    if (deleterRole !== 'SuperAdmin') {
      checkQuery += ' AND company_id = $2';
      checkParams.push(deleterCompanyId);
    }

    const existing = await db.query(checkQuery, checkParams);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found in your company workspace.' });
    }

    const project = existing.rows[0];

    await db.query('DELETE FROM projects WHERE id = $1', [id]);
    await db.query('UPDATE companies SET total_sites = GREATEST(0, total_sites - 1) WHERE id = $1', [project.company_id]);

    await logAudit({
      companyId: project.company_id,
      userId: deleterId,
      action: 'DELETE_PROJECT',
      entityType: 'PROJECT',
      entityId: id,
      details: `Project "${project.name}" deleted from workspace.`,
    });

    return res.status(200).json({
      message: `Project "${project.name}" deleted successfully.`,
      id,
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    return res.status(500).json({ message: 'Failed to delete project from database.', error: error.message });
  }
}

export async function getProjectActivities(req, res) {
  const { id } = req.params;
  const { role, companyId } = req.user;

  try {
    let checkQuery = 'SELECT id, company_id FROM projects WHERE id = $1';
    const checkParams = [id];
    if (role !== 'SuperAdmin') {
      checkQuery += ' AND company_id = $2';
      checkParams.push(companyId);
    }

    const checkRes = await db.query(checkQuery, checkParams);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found in your workspace.' });
    }

    const unionQuery = `
      SELECT 
        p.id::text AS id,
        'site_milestone' AS category,
        'Initialized Construction Site' AS action,
        'Site registered at ' || p.location || ' with budget of ETB ' || p.total_budget AS target,
        p.created_at AS timestamp,
        COALESCE(u.name, 'Workspace Administrator') AS actor,
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
        COALESCE(eng.name, mgr.name, 'Operations Manager') AS actor,
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

      ORDER BY timestamp DESC;
    `;

    const result = await db.query(unionQuery, [id]);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching project activities:', error);
    return res.status(500).json({ message: 'Failed to retrieve project activities.', error: error.message });
  }
}

export default {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectActivities,
};
