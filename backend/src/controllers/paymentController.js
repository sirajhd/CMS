import db from '../config/db.js';
import { logAudit } from '../utils/auditLogger.js';

export async function getPayments(req, res) {
  const { role, id: userId, companyId } = req.user;
  const { projectId } = req.query;

  try {
    let queryText = `
      SELECT 
        pay.*,
        c.name AS company_name,
        p.name AS project_name,
        p.location AS project_location,
        p.house_holder_id,
        p.engineer_id,
        p.manager_id,
        r.title AS request_title,
        r.type AS request_type,
        r.status AS request_status
      FROM payments pay
      JOIN projects p ON pay.project_id = p.id
      LEFT JOIN companies c ON pay.company_id = c.id
      LEFT JOIN requests r ON pay.request_id = r.id
    `;
    const params = [];

    if (role === 'SuperAdmin') {
      if (req.query.companyId) {
        queryText += ' WHERE pay.company_id = $1';
        params.push(req.query.companyId);
      }
    } else {
      // Company tenant isolation
      queryText += ' WHERE pay.company_id = $1';
      params.push(companyId);

      // Role isolation within company
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

    if (projectId) {
      queryText += ` AND pay.project_id = $${params.length + 1}`;
      params.push(projectId);
    }

    queryText += ' ORDER BY pay.created_at DESC;';

    const result = await db.query(queryText, params);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return res.status(500).json({ message: 'Failed to retrieve payments.', error: error.message });
  }
}

export async function processPayment(req, res) {
  const { id } = req.params;
  const {
    bankName,
    paymentMethod,
    paymentReference,
    paymentDate,
    additionalExpenses = 0,
    expensesNotes = '',
    notes = '',
  } = req.body;

  const { role, id: userId, companyId } = req.user;

  if (role !== 'Manager') {
    return res.status(403).json({ 
      message: 'Access Denied: Only the designated Site Operations Manager can settle payment disbursements. Administrators must not upload receipts or record project expenses.' 
    });
  }

  if (!paymentMethod || !paymentReference || !paymentReference.trim()) {
    return res.status(400).json({ message: 'Payment method and bank reference voucher code are required.' });
  }

  const receiptFile = req.file;
  const receiptDocUrl = receiptFile ? `/uploads/${receiptFile.filename}` : (req.body.receiptUrl || null);

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const payCheck = await client.query(
      `SELECT pay.*, p.company_id, p.manager_id, p.name AS project_name 
       FROM payments pay 
       JOIN projects p ON pay.project_id = p.id 
       WHERE pay.id = $1 AND pay.company_id = $2`,
      [id, companyId]
    );

    if (payCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Payment item not found in your company workspace.' });
    }

    const currentPay = payCheck.rows[0];

    if (currentPay.manager_id !== userId) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        message: 'Access Denied: You are not the designated Project Manager for this construction site.',
      });
    }

    const baseApproved = Number(currentPay.approved_amount) || Number(currentPay.requested_amount) || 0.00;
    const extraExpenses = Number(additionalExpenses) >= 0 ? Number(additionalExpenses) : 0.00;
    const totalExpenditure = baseApproved + extraExpenses;
    const transactionDate = paymentDate || new Date().toISOString().split('T')[0];

    const updateRes = await client.query(
      `UPDATE payments 
       SET status = 'Paid',
           bank_name = $1,
           payment_method = $2,
           payment_reference = $3,
           payment_date = $4,
           additional_expenses = $5,
           total_amount = $6,
           receipt_doc_url = COALESCE($7, receipt_doc_url),
           notes = $8,
           expenses_notes = $9,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING *`,
      [
        bankName || 'Bank Transfer',
        paymentMethod,
        paymentReference.trim(),
        transactionDate,
        extraExpenses,
        totalExpenditure,
        receiptDocUrl,
        notes || '',
        expensesNotes || '',
        id,
      ]
    );

    const payment = updateRes.rows[0];

    // Increment site spent budget in database
    await client.query(
      'UPDATE projects SET spent_budget = spent_budget + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [totalExpenditure, payment.project_id]
    );

    // If linked to a request, mark request status as 'Done'
    if (payment.request_id) {
      await client.query(
        "UPDATE requests SET status = 'Done', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
        [payment.request_id]
      );

      const auditComment = `Disbursement completed by Project Manager. Bank: ${bankName || 'Standard Transfer'}, Ref: ${paymentReference.trim()}, Approved Amount: ${baseApproved.toLocaleString()} ETB, Additional Expenses: ${extraExpenses.toLocaleString()} ETB, Total: ${totalExpenditure.toLocaleString()} ETB.`;
      await client.query(
        'INSERT INTO request_comments (company_id, request_id, author_id, comment_text, decision) VALUES ($1, $2, $3, $4, \'Settled\')',
        [companyId, payment.request_id, userId, auditComment]
      );
    }

    // Save receipt to project's documents archive
    if (receiptDocUrl) {
      await client.query(
        `INSERT INTO documents (company_id, project_id, name, type, file_type, file_size, file_url, uploaded_by)
         VALUES ($1, $2, $3, 'Payment Receipt', 'PDF/IMG', 'Bank Receipt', $4, $5)`,
        [companyId, payment.project_id, `Receipt - ${payment.payment_reference}`, receiptDocUrl, userId]
      );
    }

    await logAudit({
      companyId,
      userId,
      action: 'SETTLE_PAYMENT',
      entityType: 'PAYMENT',
      entityId: payment.id,
      details: `Disbursement settled: ETB ${totalExpenditure} via ${bankName || 'Bank'}. Ref: ${paymentReference.trim()}.`,
    });

    await client.query('COMMIT');
    return res.status(200).json({
      message: 'Disbursement recorded and transaction completed successfully.',
      payment,
      totalExpenditure,
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
