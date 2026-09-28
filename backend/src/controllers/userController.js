import bcrypt from 'bcryptjs';
import db from '../config/db.js';

export async function getUsers(req, res) {
  try {
    const result = await db.query(
      'SELECT id, name, email, role, phone, title, created_at FROM users ORDER BY created_at ASC'
    );
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ message: 'Failed to retrieve users.', error: error.message });
  }
}

export async function createUser(req, res) {
  const { name, email, phone, role, title, password } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ message: 'Name, email, and role are required.' });
  }

  try {
    const existing = await db.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'A user with this email address already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password || 'password123', salt);

    const queryText = `
      INSERT INTO users (name, email, password_hash, role, phone, title)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, email, role, phone, title, created_at;
    `;
    const result = await db.query(queryText, [name, email.trim(), passwordHash, role, phone || '', title || '']);

    return res.status(201).json({
      message: 'Stakeholder registered successfully.',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error registering user:', error);
    return res.status(500).json({ message: 'Failed to create user.', error: error.message });
  }
}

export async function getUserById(req, res) {
  const { id } = req.params;

  try {
    const userRes = await db.query(
      'SELECT id, name, email, role, phone, title, created_at FROM users WHERE id = $1',
      [id]
    );
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const projectsRes = await db.query(`
      SELECT id, name, location, status, progress, total_budget, spent_budget, start_date, expected_completion
      FROM projects
      WHERE house_holder_id = $1 OR engineer_id = $1 OR manager_id = $1
      ORDER BY created_at DESC
    `, [id]);

    return res.status(200).json({
      ...userRes.rows[0],
      assignedProjects: projectsRes.rows
    });
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    return res.status(500).json({ message: 'Failed to retrieve user details.', error: error.message });
  }
}

export async function updateUser(req, res) {
  const { id } = req.params;
  const { name, email, phone, role, title, password } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ message: 'Name, email, and role are required.' });
  }

  try {
    const existing = await db.query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id != $2',
      [email.trim(), id]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Another user already exists with this email address.' });
    }

    let queryText;
    let params;

    if (password && password.trim().length > 0) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password.trim(), salt);
      queryText = `
        UPDATE users 
        SET name = $1, email = $2, phone = $3, role = $4, title = $5, password_hash = $6
        WHERE id = $7
        RETURNING id, name, email, role, phone, title, created_at;
      `;
      params = [name.trim(), email.trim(), phone || '', role, title || '', passwordHash, id];
    } else {
      queryText = `
        UPDATE users 
        SET name = $1, email = $2, phone = $3, role = $4, title = $5
        WHERE id = $6
        RETURNING id, name, email, role, phone, title, created_at;
      `;
      params = [name.trim(), email.trim(), phone || '', role, title || '', id];
    }

    const result = await db.query(queryText, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.status(200).json({
      message: 'Stakeholder updated successfully.',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ message: 'Failed to update user.', error: error.message });
  }
}

export async function deleteUser(req, res) {
  const { id } = req.params;
  const currentUserId = req.user.id;

  if (id === currentUserId) {
    return res.status(400).json({ message: 'You cannot delete your own active administrator account.' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Remove from projects stakeholder assignments
    await client.query('UPDATE projects SET house_holder_id = NULL WHERE house_holder_id = $1', [id]);
    await client.query('UPDATE projects SET engineer_id = NULL WHERE engineer_id = $1', [id]);
    await client.query('UPDATE projects SET manager_id = NULL WHERE manager_id = $1', [id]);

    // Reassign submitted_by to current admin to preserve audit history
    await client.query('UPDATE requests SET submitted_by = $1 WHERE submitted_by = $2', [currentUserId, id]);
    await client.query('UPDATE request_comments SET author_id = $1 WHERE author_id = $2', [currentUserId, id]);
    await client.query('UPDATE materials SET requested_by = $1 WHERE requested_by = $2', [currentUserId, id]);
    await client.query('UPDATE documents SET uploaded_by = $1 WHERE uploaded_by = $2', [currentUserId, id]);

    const result = await client.query('DELETE FROM users WHERE id = $1 RETURNING id, name, email', [id]);
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'User not found.' });
    }

    await client.query('COMMIT');
    return res.status(200).json({
      message: 'Stakeholder deleted successfully.',
      deletedUser: result.rows[0]
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
