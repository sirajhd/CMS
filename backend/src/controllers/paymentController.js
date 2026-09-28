import db from '../config/db.js';

export async function getPayments(req, res) {
  const { role, id: userId } = req.user;
  const { projectId } = req.query;

  try {
    let queryText = `
      SELECT 
        pay.*,
        p.name AS project_name,
        r.title AS request_title
      FROM payments pay
      JOIN projects p ON pay.project_id = p.id
      LEFT JOIN requests r ON pay.request_id = r.id
    `;
    const params = [];

    if (projectId) {
      queryText += ' WHERE pay.project_id = $1';
      params.push(projectId);
    } else if (role !== 'Admin') {
      queryText += `
        WHERE p.house_holder_id = $1 
           OR p.engineer_id = $1 
           OR p.manager_id = $1
      `;
      params.push(userId);
    }

    queryText += ' ORDER BY pay.created_at DESC';

    const result = await db.query(queryText, params);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return res.status(500).json({ message: 'Failed to retrieve payments.', error: error.message });
  }
}

export async function processPayment(req, res) {
  const { id } = req.params;
  const { paymentMethod, paymentReference, paymentDate, notes } = req.body;
  const { role } = req.user;

  if (role !== 'Manager' && role !== 'Admin') {
    return res.status(403).json({ message: 'Only operations managers or administrators can settle payment disbursements.' });
  }

  if (!paymentMethod || !paymentReference) {
    return res.status(400).json({ message: 'Payment method and bank reference voucher code are required.' });
  }

  // If a receipt file was uploaded through Multer
  const receiptFile = req.file;
  const receiptDocUrl = receiptFile ? `/uploads/${receiptFile.filename}` : null;

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    let updateQuery;
    let params;

    if (receiptDocUrl) {
      updateQuery = `
        UPDATE payments 
        SET status = 'Paid',
            payment_method = $1,
            payment_reference = $2,
            payment_date = $3,
            notes = $4,
            receipt_doc_url = $5
        WHERE id = $6
        RETURNING *
      `;
      params = [paymentMethod, paymentReference, paymentDate || new Date().toISOString().split('T')[0], notes || '', receiptDocUrl, id];
    } else {
      updateQuery = `
        UPDATE payments 
        SET status = 'Paid',
            payment_method = $1,
            payment_reference = $2,
            payment_date = $3,
            notes = $4
        WHERE id = $5
        RETURNING *
      `;
      params = [paymentMethod, paymentReference, paymentDate || new Date().toISOString().split('T')[0], notes || '', id];
    }

    const updateRes = await client.query(updateQuery, params);

    if (updateRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Payment item not found.' });
    }

    const payment = updateRes.rows[0];

    // Increment site spent budget
    await client.query(
      'UPDATE projects SET spent_budget = spent_budget + $1 WHERE id = $2',
      [payment.approved_amount, payment.project_id]
    );

    // Optional: save receipt directly to the project's documents archive
    if (receiptDocUrl) {
      await client.query(
        `INSERT INTO documents (project_id, name, type, file_type, file_size, file_url, uploaded_by)
         VALUES ($1, $2, 'Receipt', 'PDF/IMG', '1.5 MB', $3, $4)`,
        [payment.project_id, `Receipt - ${payment.payment_reference}`, receiptDocUrl, req.user.id]
      );
    }

    await client.query('COMMIT');
    return res.status(200).json({
      message: 'Disbursement recorded and receipt attached.',
      payment,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error settling payment:', error);
    return res.status(500).json({ message: 'Failed to process payment.', error: error.message });
  } finally {
    client.release();
  }
}

export default {
  getPayments,
  processPayment,
};
