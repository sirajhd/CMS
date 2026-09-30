import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import { logAudit } from '../utils/auditLogger.js';

export async function getUsers(req, res) {
  const { role, companyId } = req.user;
  const requestedCompanyId = req.query.companyId;

  try {
    let queryText = `
      SELECT 
        u.id, 
        u.company_id,
        u.name, 
        u.email, 
        u.role, 
        u.phone, 
        u.title, 
        u.status,
        u.created_at,
        c.name AS company_name,
        c.code AS company_code,
        COUNT(DISTINCT p.id)::int AS assigned_projects_count
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.id
      LEFT JOIN projects p ON (p.house_holder_id = u.id OR p.engineer_id = u.id OR p.manager_id = u.id)
    `;
    const params = [];

    if (role === 'SuperAdmin') {
      if (requestedCompanyId) {
        queryText += ' WHERE u.company_id = $1';
        params.push(requestedCompanyId);
      }
    } else {
      // Company tenant isolation: Only see stakeholders in the same company
      queryText += ' WHERE u.company_id = $1';
      params.push(companyId);
    }

    queryText += `
      GROUP BY u.id, c.id
      ORDER BY u.created_at ASC;
    `;

    const result = await db.query(queryText, params);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ message: 'Failed to retrieve users.', error: error.message });
  }
}

export async function createUser(req, res) {
  const { name, email, phone, role: newUserRole, title, password } = req.body;
  const { id: creatorId, role: creatorRole, companyId: creatorCompanyId } = req.user;

  if (!name || !email || !newUserRole) {
    return res.status(400).json({ message: 'Name, email, and role are required.' });
  }

  // Determine target companyId
  let targetCompanyId = creatorCompanyId;
  if (creatorRole === 'SuperAdmin') {
    targetCompanyId = req.body.companyId || null;
  }

  if (creatorRole !== 'SuperAdmin' && !targetCompanyId) {
    return res.status(403).json({ message: 'Access Denied: Missing company workspace assignment.' });
  }

  try {
    const existing = await db.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'A user with this email address already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password || 'password123', salt);

    const queryText = `
      INSERT INTO users (company_id, name, email, password_hash, role, phone, title, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE')
      RETURNING id, company_id, name, email, role, phone, title, status, created_at;
    `;
    const result = await db.query(queryText, [
      targetCompanyId,
      name.trim(),
      email.trim().toLowerCase(),
      passwordHash,
      newUserRole,
      phone ? phone.trim() : '',
      title ? title.trim() : '',
    ]);

    const createdUser = result.rows[0];

    await logAudit({
      companyId: targetCompanyId,
      userId: creatorId,
      action: 'CREATE_USER',
      entityType: 'USER',
      entityId: createdUser.id,
      details: `User ${createdUser.name} (${createdUser.email}) registered with role ${createdUser.role}.`,
    });

    return res.status(201).json({
      message: 'Stakeholder registered successfully.',
      user: createdUser,
    });
  } catch (error) {
    console.error('Error registering user:', error);
    return res.status(500).json({ message: 'Failed to create user.', error: error.message });
  }
}

export async function getUserById(req, res) {
  const { id } = req.params;
  const { role, companyId } = req.user;

  try {
    let userQuery = 'SELECT id, company_id, name, email, role, phone, title, status, created_at FROM users WHERE id = $1';
    const params = [id];

    if (role !== 'SuperAdmin') {
      userQuery += ' AND company_id = $2';
      params.push(companyId);
    }

    const userRes = await db.query(userQuery, params);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: 'User not found in your company workspace.' });
    }

    const user = userRes.rows[0];

    const projectsRes = await db.query(`
      SELECT id, name, location, status, progress, total_budget, spent_budget, start_date, expected_completion
      FROM projects
      WHERE (house_holder_id = $1 OR engineer_id = $1 OR manager_id = $1)
        ${role !== 'SuperAdmin' ? 'AND company_id = $2' : ''}
      ORDER BY created_at DESC
    `, role !== 'SuperAdmin' ? [id, companyId] : [id]);

    return res.status(200).json({
      ...user,
      assignedProjects: projectsRes.rows,
    });
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    return res.status(500).json({ message: 'Failed to retrieve user details.', error: error.message });
  }
}

export async function updateUser(req, res) {
  const { id } = req.params;
  const { name, email, phone, role: updatedRole, title, password, status } = req.body;
  const { id: editorId, role: editorRole, companyId: editorCompanyId } = req.user;

  if (!name || !email || !updatedRole) {
    return res.status(400).json({ message: 'Name, email, and role are required.' });
  }

  try {
    // Tenant ownership check
    let checkQuery = 'SELECT id, company_id FROM users WHERE id = $1';
    const checkParams = [id];
    if (editorRole !== 'SuperAdmin') {
      checkQuery += ' AND company_id = $2';
      checkParams.push(editorCompanyId);
    }

    const existingUser = await db.query(checkQuery, checkParams);
    if (existingUser.rows.length === 0) {
      return res.status(404).json({ message: 'User not found in your company workspace.' });
    }

    const emailCheck = await db.query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id != $2',
      [email.trim(), id]
    );
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Another user already exists with this email address.' });
    }

    let queryText;
    let params;

    if (password && password.trim().length > 0) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password.trim(), salt);
      queryText = `
        UPDATE users 
        SET name = $1, email = $2, phone = $3, role = $4, title = $5, password_hash = $6, status = COALESCE($7, status), updated_at = CURRENT_TIMESTAMP
        WHERE id = $8
        RETURNING id, company_id, name, email, role, phone, title, status, created_at;
      `;
      params = [name.trim(), email.trim().toLowerCase(), phone || '', updatedRole, title || '', passwordHash, status || null, id];
    } else {
      queryText = `
        UPDATE users 
        SET name = $1, email = $2, phone = $3, role = $4, title = $5, status = COALESCE($6, status), updated_at = CURRENT_TIMESTAMP
        WHERE id = $7
        RETURNING id, company_id, name, email, role, phone, title, status, created_at;
      `;
      params = [name.trim(), email.trim().toLowerCase(), phone || '', updatedRole, title || '', status || null, id];
    }

    const result = await db.query(queryText, params);

    await logAudit({
      companyId: existingUser.rows[0].company_id,
      userId: editorId,
      action: 'UPDATE_USER',
      entityType: 'USER',
      entityId: id,
      details: `User profile for ${email.trim()} updated.`,
    });

    return res.status(200).json({
      message: 'Stakeholder updated successfully.',
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ message: 'Failed to update user.', error: error.message });
  }
}

export async function deleteUser(req, res) {
  const { id } = req.params;
  const { id: currentUserId, role: currentUserRole, companyId: currentCompanyId } = req.user;

  if (id === currentUserId) {
    return res.status(400).json({ message: 'You cannot delete your own active account.' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Tenant ownership check
    let checkQuery = 'SELECT id, name, email, company_id FROM users WHERE id = $1';
    const checkParams = [id];
    if (currentUserRole !== 'SuperAdmin') {
      checkQuery += ' AND company_id = $2';
      checkParams.push(currentCompanyId);
    }

    const userCheck = await client.query(checkQuery, checkParams);
    if (userCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'User not found in your company workspace.' });
    }

    const targetUser = userCheck.rows[0];

    // Remove from projects stakeholder assignments
    await client.query('UPDATE projects SET house_holder_id = NULL WHERE house_holder_id = $1', [id]);
    await client.query('UPDATE projects SET engineer_id = NULL WHERE engineer_id = $1', [id]);
    await client.query('UPDATE projects SET manager_id = NULL WHERE manager_id = $1', [id]);
    await client.query('DELETE FROM project_assignments WHERE user_id = $1', [id]);

    // Reassign submitted_by to current admin to preserve audit history
    await client.query('UPDATE requests SET submitted_by = $1 WHERE submitted_by = $2', [currentUserId, id]);
    await client.query('UPDATE request_comments SET author_id = $1 WHERE author_id = $2', [currentUserId, id]);
    await client.query('UPDATE materials SET requested_by = $1 WHERE requested_by = $2', [currentUserId, id]);
    await client.query('UPDATE documents SET uploaded_by = $1 WHERE uploaded_by = $2', [currentUserId, id]);

    await client.query('DELETE FROM users WHERE id = $1', [id]);

    await logAudit({
      companyId: targetUser.company_id,
      userId: currentUserId,
      action: 'DELETE_USER',
      entityType: 'USER',
      entityId: id,
      details: `Stakeholder "${targetUser.name}" (${targetUser.email}) removed from workspace.`,
    });

    await client.query('COMMIT');
    return res.status(200).json({
      message: 'Stakeholder deleted successfully.',
      deletedUser: targetUser,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting user:', error);
    return res.status(500).json({ message: 'Failed to delete user.', error: error.message });
  } finally {
    client.release();
  }
}

export default {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
