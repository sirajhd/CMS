import db from '../config/db.js';
import { logAudit } from '../utils/auditLogger.js';

export async function getRequests(req, res) {
  const { role, id: userId, companyId } = req.user;
  const { projectId } = req.query;

  try {
    let queryText = `
      SELECT 
        r.*,
        p.name AS project_name,
        p.location AS project_location,
        p.house_holder_id,
        p.engineer_id,
        p.manager_id,
        u.name AS submitted_by_name,
        u.role AS submitted_by_role,
        hh.name AS house_holder_name,
        eng.name AS engineer_name,
        mgr.name AS manager_name,
        pay.id AS payment_id,
        pay.status AS payment_status,
        pay.bank_name,
        pay.payment_method,
        pay.payment_reference,
        pay.payment_date,
        pay.additional_expenses,
        pay.total_amount AS payment_total_amount,
        pay.receipt_doc_url,
        pay.expenses_notes
      FROM requests r
      JOIN projects p ON r.project_id = p.id
      JOIN users u ON r.submitted_by = u.id
      LEFT JOIN users hh ON p.house_holder_id = hh.id
      LEFT JOIN users eng ON p.engineer_id = eng.id
      LEFT JOIN users mgr ON p.manager_id = mgr.id
      LEFT JOIN payments pay ON r.id = pay.request_id
    `;
    const params = [];

    if (role === 'SuperAdmin') {
      if (req.query.companyId) {
        queryText += ' WHERE r.company_id = $1';
        params.push(req.query.companyId);
      }
    } else {
      // Company tenant isolation
      queryText += ' WHERE r.company_id = $1';
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
      queryText += ` AND r.project_id = $${params.length + 1}`;
      params.push(projectId);
    }

    queryText += ' ORDER BY r.created_at DESC;';

    const result = await db.query(queryText, params);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error retrieving requests:', error);
    return res.status(500).json({ message: 'Failed to retrieve requisitions.', error: error.message });
  }
}

export async function getRequestById(req, res) {
  const { id } = req.params;
  const { role, id: userId, companyId } = req.user;

  try {
    let queryText = `
      SELECT 
        r.*,
        p.name AS project_name,
        p.location AS project_location,
        p.house_holder_id,
        p.engineer_id,
        p.manager_id,
        u.name AS submitted_by_name,
        u.role AS submitted_by_role,
        hh.name AS house_holder_name,
        eng.name AS engineer_name,
        mgr.name AS manager_name,
        pay.id AS payment_id,
        pay.status AS payment_status,
        pay.bank_name,
        pay.payment_method,
        pay.payment_reference,
        pay.payment_date,
        pay.additional_expenses,
        pay.total_amount AS payment_total_amount,
        pay.receipt_doc_url,
        pay.expenses_notes
      FROM requests r
      JOIN projects p ON r.project_id = p.id
      JOIN users u ON r.submitted_by = u.id
      LEFT JOIN users hh ON p.house_holder_id = hh.id
      LEFT JOIN users eng ON p.engineer_id = eng.id
      LEFT JOIN users mgr ON p.manager_id = mgr.id
      LEFT JOIN payments pay ON r.id = pay.request_id
      WHERE r.id = $1
    `;
    const params = [id];

    if (role !== 'SuperAdmin') {
      queryText += ' AND r.company_id = $2';
      params.push(companyId);

      if (role === 'Engineer') {
        queryText += ' AND p.engineer_id = $3';
        params.push(userId);
      } else if (role === 'House Holder') {
        queryText += ' AND p.house_holder_id = $3';
        params.push(userId);
      } else if (role === 'Manager') {
        queryText += ' AND p.manager_id = $3';
        params.push(userId);
      }
    }

    const result = await db.query(queryText, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Requisition not found.' });
    }

    const request = result.rows[0];

    const [commentsRes, materialsRes] = await Promise.all([
      db.query(`
        SELECT rc.*, u.name AS author_name, u.role AS author_role
        FROM request_comments rc
        JOIN users u ON rc.author_id = u.id
        WHERE rc.request_id = $1
        ORDER BY rc.created_at ASC
      `, [id]),
      db.query('SELECT * FROM materials WHERE request_id = $1 ORDER BY id ASC', [id]),
    ]);

    return res.status(200).json({
      request: {
        ...request,
        comments: commentsRes.rows,
        materials: materialsRes.rows,
      }
    });
  } catch (error) {
    console.error('Error fetching requisition details:', error);
    return res.status(500).json({ message: 'Failed to retrieve requisition details.', error: error.message });
  }
}

export async function createRequest(req, res) {
  const { projectId, project_id, type, title, amount, description } = req.body;
  const targetProjectId = projectId || project_id;
  const { id: userId, role, companyId } = req.user;

  if (role !== 'Engineer') {
    return res.status(403).json({ 
      message: 'Access Denied: Only designated Site Engineers can submit requisitions. Administrators must not submit requisitions.' 
    });
  }

  if (!targetProjectId || !type || !title || !description) {
    return res.status(400).json({ message: 'Project site, type, title, and description are required.' });
  }

  try {
    // Validate project belongs to user's company and engineer is assigned
    const projCheck = await db.query(
      'SELECT id, name, company_id, house_holder_id, engineer_id, manager_id FROM projects WHERE id = $1 AND company_id = $2',
      [targetProjectId, companyId]
    );

    if (projCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Target project site not found in your company workspace.' });
    }

    const project = projCheck.rows[0];

    if (project.engineer_id !== userId) {
      return res.status(403).json({
        message: 'Access Denied: You can only submit requisitions for construction sites where you are the designated Lead Engineer.',
      });
    }

    const queryText = `
      INSERT INTO requests (company_id, project_id, type, title, amount, description, submitted_by, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'Submitted')
      RETURNING *;
    `;
    const result = await db.query(queryText, [
      companyId,
      targetProjectId,
      type,
      title.trim(),
      Number(amount) || 0.00,
      description.trim(),
      userId,
    ]);

    const created = result.rows[0];

    await logAudit({
      companyId,
      userId,
      action: 'SUBMIT_REQUISITION',
      entityType: 'REQUISITION',
      entityId: created.id,
      details: `Requisition "${created.title}" (${created.type}) submitted for ETB ${created.amount}.`,
    });

    return res.status(201).json({
      message: 'Requisition submitted successfully. Automatically forwarded to Property Owner for review.',
      request: {
        ...created,
        project_name: project.name,
      },
    });
  } catch (error) {
    console.error('Error creating requisition:', error);
    return res.status(500).json({ message: 'Failed to submit requisition.', error: error.message });
  }
}

export async function reviewRequest(req, res) {
  const { id } = req.params;
  const { status, comment } = req.body;
  const { id: userId, role, companyId } = req.user;

  if (role !== 'House Holder') {
    return res.status(403).json({
      message: 'Access Denied: Only the property owner (House Holder) of this site can review or approve requisitions. Administrators must not approve or reject requisitions.',
    });
  }

  const validStatuses = ['Approved', 'Revision Required', 'Rejected', 'Under Review'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Retrieve request and verify company and site ownership
    const reqCheck = await client.query(
      `SELECT r.*, p.company_id, p.house_holder_id, p.manager_id, p.name AS project_name
       FROM requests r
       JOIN projects p ON r.project_id = p.id
       WHERE r.id = $1 AND r.company_id = $2`,
      [id, companyId]
    );

    if (reqCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Requisition not found in your company workspace.' });
    }

    const currentReq = reqCheck.rows[0];

    if (currentReq.house_holder_id !== userId) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        message: 'Access Denied: You can only review requisitions for construction sites that you own as Property Owner.',
      });
    }

    // Update request status
    const updateRes = await client.query(
      'UPDATE requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    const updatedRequest = updateRes.rows[0];

    // Record review comment
    if (comment && comment.trim()) {
      await client.query(
        'INSERT INTO request_comments (company_id, request_id, author_id, comment_text, decision) VALUES ($1, $2, $3, $4, $5)',
        [companyId, id, userId, comment.trim(), status]
      );
    }

    // On Householder Approval: Automatically prepare payment record for the assigned Manager
    if (status === 'Approved') {
      const existingPay = await client.query('SELECT id FROM payments WHERE request_id = $1', [id]);
      if (existingPay.rows.length === 0) {
        await client.query(
          `INSERT INTO payments (
            company_id, project_id, request_id, requested_amount, approved_amount, total_amount, status, notes
          ) VALUES ($1, $2, $3, $4, $4, $4, 'Approved', $5)`,
          [
            companyId,
            updatedRequest.project_id,
            id,
            updatedRequest.amount,
            `Approved by Property Owner (${req.user.name || 'Owner'}). Ready for Manager bank disbursement and additional expenses settlement.`,
          ]
        );
      } else {
        await client.query(
          `UPDATE payments 
           SET status = 'Approved', 
               approved_amount = $1, 
               total_amount = $1,
               notes = $2,
               updated_at = CURRENT_TIMESTAMP 
           WHERE request_id = $3`,
          [
            updatedRequest.amount,
            `Approved by Property Owner (${req.user.name || 'Owner'}). Ready for Manager settlement.`,
            id,
          ]
        );
      }
    }

    await logAudit({
      companyId,
      userId,
      action: `REVIEW_REQUISITION_${status.toUpperCase().replace(/\s+/g, '_')}`,
      entityType: 'REQUISITION',
      entityId: id,
      details: `Requisition "${currentReq.title}" marked as ${status} by Property Owner.`,
    });

    await client.query('COMMIT');
    return res.status(200).json({
      message: status === 'Approved'
        ? 'Requisition approved successfully! Automatically forwarded to Project Manager for bank disbursement.'
        : `Requisition status updated to ${status}.`,
      request: {
        ...updatedRequest,
        project_name: currentReq.project_name,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error reviewing requisition:', error);
    return res.status(500).json({ message: 'Failed to process requisition review.', error: error.message });
  } finally {
    client.release();
  }
}

export async function processRequisitionDisbursement(req, res) {
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

  const { id: userId, role, companyId } = req.user;

  if (role !== 'Manager') {
    return res.status(403).json({
      message: 'Access Denied: Only the designated Project Manager for this site can process and disburse payments. Administrators must not upload receipts or record project expenses.',
    });
  }

  if (!paymentMethod || !paymentReference || !paymentReference.trim()) {
    return res.status(400).json({
      message: 'Bank payment method and reference voucher code are required.',
    });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Retrieve request and verify company & manager assignment
    const reqCheck = await client.query(
      `SELECT r.*, p.company_id, p.manager_id, p.name AS project_name, p.spent_budget
       FROM requests r
       JOIN projects p ON r.project_id = p.id
       WHERE r.id = $1 AND r.company_id = $2`,
      [id, companyId]
    );

    if (reqCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Requisition not found in your company workspace.' });
    }

    const currentReq = reqCheck.rows[0];

    if (currentReq.manager_id !== userId) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        message: 'Access Denied: You can only process disbursements for construction sites where you are the designated Project Manager.',
      });
    }

    if (currentReq.status !== 'Approved' && currentReq.status !== 'Processing') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: `This requisition cannot be processed because its status is '${currentReq.status}'. It must be approved by the Property Owner first.`,
      });
    }

    const baseApproved = Number(currentReq.amount) || 0.00;
    const extraExpenses = Number(additionalExpenses) >= 0 ? Number(additionalExpenses) : 0.00;
    const totalExpenditure = baseApproved + extraExpenses;

    const receiptFile = req.file;
    const receiptDocUrl = receiptFile ? `/uploads/${receiptFile.filename}` : (req.body.receiptUrl || null);
    const transactionDate = paymentDate || new Date().toISOString().split('T')[0];

    // 1. Update Requisition Status to 'Done'
    const reqUpdate = await client.query(
      `UPDATE requests 
       SET status = 'Done', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 
       RETURNING *`,
      [id]
    );

    // 2. Insert or Update Payment record
    const existingPay = await client.query('SELECT id FROM payments WHERE request_id = $1', [id]);
    let paymentRecord;

    if (existingPay.rows.length > 0) {
      const payUpdate = await client.query(
        `UPDATE payments 
         SET status = 'Paid',
             bank_name = $1,
             payment_method = $2,
             payment_reference = $3,
             payment_date = $4,
             approved_amount = $5,
             additional_expenses = $6,
             total_amount = $7,
             receipt_doc_url = COALESCE($8, receipt_doc_url),
             notes = $9,
             expenses_notes = $10,
             updated_at = CURRENT_TIMESTAMP
         WHERE request_id = $11
         RETURNING *`,
        [
          bankName || 'Bank Transfer',
          paymentMethod,
          paymentReference.trim(),
          transactionDate,
          baseApproved,
          extraExpenses,
          totalExpenditure,
          receiptDocUrl,
          notes || '',
          expensesNotes || '',
          id,
        ]
      );
      paymentRecord = payUpdate.rows[0];
    } else {
      const payInsert = await client.query(
        `INSERT INTO payments (
          company_id, project_id, request_id, requested_amount, approved_amount, additional_expenses, total_amount,
          status, bank_name, payment_method, payment_reference, receipt_doc_url, payment_date, notes, expenses_notes
        ) VALUES ($1, $2, $3, $4, $4, $5, $6, 'Paid', $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          companyId,
          currentReq.project_id,
          id,
          baseApproved,
          extraExpenses,
          totalExpenditure,
          bankName || 'Bank Transfer',
          paymentMethod,
          paymentReference.trim(),
          receiptDocUrl,
          transactionDate,
          notes || '',
          expensesNotes || '',
        ]
      );
      paymentRecord = payInsert.rows[0];
    }

    // 3. Record itemized expense if extra expenses incurred
    if (extraExpenses > 0) {
      await client.query(`
        INSERT INTO expenses (company_id, project_id, payment_id, category, amount, description, recorded_by, expense_date, receipt_url)
        VALUES ($1, $2, $3, 'Transport & Delivery', $4, $5, $6, $7, $8);
      `, [
        companyId,
        currentReq.project_id,
        paymentRecord.id,
        extraExpenses,
        expensesNotes || 'Additional logistics expenses during material drop',
        userId,
        transactionDate,
        receiptDocUrl,
      ]);
    }

    // 4. Increment Project's spent_budget in company workspace
    await client.query(
      'UPDATE projects SET spent_budget = spent_budget + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [totalExpenditure, currentReq.project_id]
    );

    // 5. Archive Bank Receipt in Documents table
    if (receiptDocUrl) {
      await client.query(
        `INSERT INTO documents (company_id, project_id, name, type, file_type, file_size, file_url, uploaded_by)
         VALUES ($1, $2, $3, 'Payment Receipt', 'PDF/IMG', 'Bank Receipt', $4, $5)`,
        [
          companyId,
          currentReq.project_id,
          `Bank Receipt - ${paymentReference.trim()} (${currentReq.title})`,
          receiptDocUrl,
          userId,
        ]
      );
    }

    // 6. Add Audit Trail Comment
    const auditComment = `Transaction settled by Project Manager. Bank: ${bankName || 'Standard Transfer'}, Ref: ${paymentReference.trim()}, Approved Amount: ${baseApproved.toLocaleString()} ETB, Extra Expenses: ${extraExpenses.toLocaleString()} ETB, Total: ${totalExpenditure.toLocaleString()} ETB. Status marked as Done.`;

    await client.query(
      'INSERT INTO request_comments (company_id, request_id, author_id, comment_text, decision) VALUES ($1, $2, $3, $4, \'Settled\')',
      [companyId, id, userId, auditComment]
    );

    await logAudit({
      companyId,
      userId,
      action: 'PROCESS_DISBURSEMENT',
      entityType: 'PAYMENT',
      entityId: paymentRecord.id,
      details: `Manager disbursed ETB ${totalExpenditure} for "${currentReq.title}" via ${bankName || 'Bank'}. Ref: ${paymentReference.trim()}.`,
    });

    await client.query('COMMIT');

    return res.status(200).json({
      message: 'Payment processed and transaction completed successfully. Financial records updated.',
      request: reqUpdate.rows[0],
      payment: paymentRecord,
      totalExpenditure,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error processing requisition disbursement:', error);
    return res.status(500).json({ message: 'Failed to process disbursement.', error: error.message });
  } finally {
    client.release();
  }
}

export default {
  getRequests,
  createRequest,
  reviewRequest,
  processRequisitionDisbursement,
};
