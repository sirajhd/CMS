import db from '../config/db.js';

export async function getProjects(req, res) {
  const { role, id: userId } = req.user;

  try {
    let queryText = `
      SELECT 
        p.*,
        hh.name AS house_holder_name,
        eng.name AS engineer_name,
        mgr.name AS manager_name
      FROM projects p
      LEFT JOIN users hh ON p.house_holder_id = hh.id
      LEFT JOIN users eng ON p.engineer_id = eng.id
      LEFT JOIN users mgr ON p.manager_id = mgr.id
    `;
    const params = [];

    if (role !== 'Admin') {
      queryText += `
        WHERE p.house_holder_id = $1 
           OR p.engineer_id = $1 
           OR p.manager_id = $1
      `;
      params.push(userId);
    }

    queryText += ' ORDER BY p.created_at DESC';

    const result = await db.query(queryText, params);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return res.status(500).json({ message: 'Failed to retrieve projects.', error: error.message });
  }
}

export async function getProjectById(req, res) {
  const { id } = req.params;

  try {
    const queryText = `
      SELECT 
        p.*,
        hh.name AS house_holder_name,
        eng.name AS engineer_name,
        mgr.name AS manager_name
      FROM projects p
      LEFT JOIN users hh ON p.house_holder_id = hh.id
      LEFT JOIN users eng ON p.engineer_id = eng.id
      LEFT JOIN users mgr ON p.manager_id = mgr.id
      WHERE p.id = $1
    `;
    const result = await db.query(queryText, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching project by ID:', error);
    return res.status(500).json({ message: 'Failed to retrieve project.', error: error.message });
  }
}

export async function createProject(req, res) {
  const {
    name,
    location,
    houseHolderId,
    engineerId,
    managerId,
    totalBudget,
    startDate,
    expectedCompletion,
    description
  } = req.body;

  if (!name || !location) {
    return res.status(400).json({ message: 'Project name and site location are required.' });
  }

  // Provide sensible fallbacks for dates if not supplied by the form
  const validStartDate = startDate || new Date().toISOString().split('T')[0];
  const validEndDate = expectedCompletion || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  try {
    const insertQuery = `
      INSERT INTO projects (
        name, location, house_holder_id, engineer_id, manager_id,
        total_budget, spent_budget, progress, status,
        start_date, expected_completion, description
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, 0.00, 0, 'Active',
        $7, $8, $9
      )
      RETURNING id;
    `;

    const values = [
      name.trim(),
      location.trim(),
      houseHolderId || null,
      engineerId || null,
      managerId || null,
      Number(totalBudget) || 0.00,
      validStartDate,
      validEndDate,
      description || ''
    ];

    const insertResult = await db.query(insertQuery, values);
    const newProjectId = insertResult.rows[0].id;

    // Fetch the newly created row with stakeholder names joined
    const populated = await db.query(`
      SELECT 
        p.*,
        hh.name AS house_holder_name,
        eng.name AS engineer_name,
        mgr.name AS manager_name
      FROM projects p
      LEFT JOIN users hh ON p.house_holder_id = hh.id
      LEFT JOIN users eng ON p.engineer_id = eng.id
      LEFT JOIN users mgr ON p.manager_id = mgr.id
      WHERE p.id = $1
    `, [newProjectId]);

    return res.status(201).json({
      message: 'Construction site registered successfully.',
      project: populated.rows[0]
    });
  } catch (error) {
    console.error('Error creating project:', error);
    return res.status(500).json({ message: 'Failed to create project in database.', error: error.message });
  }
}

export async function getProjectActivities(req, res) {
  const { id } = req.params;

  try {
    const unionQuery = `
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

      ORDER BY timestamp DESC;
    `;

    const result = await db.query(unionQuery, [id]);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching project activities:', error);
    return res.status(500).json({ message: 'Failed to retrieve project activities.', error: error.message });
  }
}

export async function updateProject(req, res) {
  const { id } = req.params;
  const {
    name,
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

  try {
    const existing = await db.query('SELECT * FROM projects WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const current = existing.rows[0];

    const updatedName = name !== undefined ? String(name).trim() : current.name;
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
        location = $2,
        house_holder_id = $3,
        engineer_id = $4,
        manager_id = $5,
        status = $6,
        progress = $7,
        total_budget = $8,
        spent_budget = $9,
        start_date = $10,
        expected_completion = $11,
        description = $12
      WHERE id = $13
      RETURNING *;
    `;

    const values = [
      updatedName,
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

    // Fetch joined record with stakeholder names
    const populated = await db.query(`
      SELECT 
        p.*,
        hh.name AS house_holder_name,
        eng.name AS engineer_name,
        mgr.name AS manager_name
      FROM projects p
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

  try {
    const existing = await db.query('SELECT id, name FROM projects WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const projectName = existing.rows[0].name;

    await db.query('DELETE FROM projects WHERE id = $1', [id]);

    return res.status(200).json({
      message: `Project "${projectName}" deleted successfully.`,
      id,
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    return res.status(500).json({ message: 'Failed to delete project from database.', error: error.message });
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
