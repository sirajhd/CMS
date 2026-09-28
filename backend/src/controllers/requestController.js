import db from '../config/db.js';

export async function getRequests(req, res) {
  const { role, id: userId } = req.user;
  const { projectId } = req.query;

  try {
    let queryText = `
      SELECT 
        r.*,
        p.name AS project_name,
        u.name AS submitted_by_name,
        u.role AS submitted_by_role
      FROM requests r
      JOIN projects p ON r.project_id = p.id
      JOIN users u ON r.submitted_by = u.id
    `;
    const params = [];

    if (projectId) {
      queryText += ' WHERE r.project_id = $1';
      params.push(projectId);
    } else if (role !== 'Admin') {
      queryText += `
        WHERE p.house_holder_id = $1 
           OR p.engineer_id = $1 
           OR p.manager_id = $1
      `;
      params.push(userId);
    }

    queryText += ' ORDER BY r.created_at DESC';

    const result = await db.query(queryText, params);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error retrieving requests:', error);
    return res.status(500).json({ message: 'Failed to retrieve requests.', error: error.message });
  }
}

export async function createRequest(req, res) {
  const { projectId, type, title, amount, description } = req.body;
  const { id: userId, role } = req.user;

  if (role !== 'Engineer') {
    return res.status(403).json({ message: 'Only site engineers can submit requisitions. Administrators have view-only access.' });
  }

  if (!projectId || !type || !title || !description) {
    return res.status(400).json({ message: 'Project, type, title, and description are required.' });
  }

  try {
    const queryText = `
      INSERT INTO requests (project_id, type, title, amount, description, submitted_by, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'Submitted')
      RETURNING *;
    `;
    const result = await db.query(queryText, [
      projectId,
      type,
      title,
      Number(amount) || 0.00,
      description,
      userId,
    ]);

    return res.status(201).json({
      message: 'Requisition submitted successfully.',
      request: result.rows[0],
    });
  } catch (error) {
    console.error('Error creating request:', error);
    return res.status(500).json({ message: 'Failed to create request.', error: error.message });
  }
}

export async function reviewRequest(req, res) {
  const { id } = req.params;
  const { status, comment } = req.body;
  const { id: userId, role } = req.user;

  if (role !== 'House Holder') {
    return res.status(403).json({ message: 'Only the property owner can review or approve requisitions. Administrators have view-only access.' });
  }

  const validStatuses = ['Approved', 'Revision Required', 'Rejected', 'Under Review'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const updateRes = await client.query(
      'UPDATE requests SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (updateRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Request not found.' });
    }

    const updatedRequest = updateRes.rows[0];

    if (comment && comment.trim()) {
      await client.query(
        'INSERT INTO request_comments (request_id, author_id, comment_text) VALUES ($1, $2, $3)',
        [id, userId, comment.trim()]
      );
    }

    if (status === 'Approved' && updatedRequest.type === 'Payment') {
      const existingPay = await client.query('SELECT id FROM payments WHERE request_id = $1', [id]);
      if (existingPay.rows.length === 0) {
        await client.query(
          `INSERT INTO payments (project_id, request_id, requested_amount, approved_amount, status, notes)
           VALUES ($1, $2, $3, $3, 'Approved', 'Auto-generated on House Holder milestone approval')`,
          [updatedRequest.project_id, id, updatedRequest.amount]
        );
      }
    }

    await client.query('COMMIT');
    return res.status(200).json({
      message: `Request status updated to ${status}.`,
      request: updatedRequest,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error reviewing request:', error);
    return res.status(500).json({ message: 'Failed to process request review.', error: error.message });
  } finally {
    client.release();
  }
}

export default {
  getRequests,
  createRequest,
  reviewRequest,
};
