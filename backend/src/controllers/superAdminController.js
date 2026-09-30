import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import { logAudit } from '../utils/auditLogger.js';

export async function getPlatformStats(req, res) {
  try {
    const [companiesRes, usersRes, projectsRes, paymentsRes] = await Promise.all([
      db.query(`
        SELECT 
          COUNT(*)::int AS total_companies,
          COUNT(*) FILTER (WHERE status = 'ACTIVE')::int AS active_companies,
          COUNT(*) FILTER (WHERE status = 'SUSPENDED')::int AS suspended_companies,
          COUNT(*) FILTER (WHERE status = 'DEACTIVATED')::int AS deactivated_companies
        FROM companies
      `),
      db.query(`
        SELECT 
          COUNT(*)::int AS total_users,
          COUNT(*) FILTER (WHERE role = 'Admin')::int AS company_admins,
          COUNT(*) FILTER (WHERE role = 'Engineer')::int AS engineers,
          COUNT(*) FILTER (WHERE role = 'House Holder')::int AS house_holders,
          COUNT(*) FILTER (WHERE role = 'Manager')::int AS managers
        FROM users
      `),
      db.query(`
        SELECT 
          COUNT(*)::int AS total_projects,
          COUNT(*) FILTER (WHERE status = 'Active')::int AS active_projects,
          COUNT(*) FILTER (WHERE status = 'Completed')::int AS completed_projects,
          COALESCE(SUM(total_budget), 0)::numeric AS total_committed_budget,
          COALESCE(SUM(spent_budget), 0)::numeric AS total_disbursed_funds
        FROM projects
      `),
      db.query(`
        SELECT 
          COUNT(*)::int AS total_payments,
          COALESCE(SUM(total_amount), 0)::numeric AS total_settled_amount
        FROM payments
        WHERE status = 'Paid'
      `),
    ]);

    const recentAudit = await db.query(`
      SELECT 
        a.*,
        u.name AS actor_name,
        u.email AS actor_email,
        u.role AS actor_role,
        c.name AS company_name
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN companies c ON a.company_id = c.id
      ORDER BY a.created_at DESC
      LIMIT 10;
    `);

    return res.status(200).json({
      stats: {
        totalCompanies: companiesRes.rows[0]?.total_companies || 0,
        activeCompanies: companiesRes.rows[0]?.active_companies || 0,
        suspendedCompanies: companiesRes.rows[0]?.suspended_companies || 0,
        deactivatedCompanies: companiesRes.rows[0]?.deactivated_companies || 0,
        totalUsers: usersRes.rows[0]?.total_users || 0,
        totalProjects: projectsRes.rows[0]?.total_projects || 0,
        totalDisbursed: Number(paymentsRes.rows[0]?.total_settled_amount || projectsRes.rows[0]?.total_disbursed_funds || 0),
      },
      companies: companiesRes.rows[0],
      users: usersRes.rows[0],
      projects: projectsRes.rows[0],
      payments: paymentsRes.rows[0],
      recentActivity: recentAudit.rows,
    });
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    return res.status(500).json({ message: 'Failed to retrieve platform statistics.', error: error.message });
  }
}

export async function getCompanies(req, res) {
  try {
    const query = `
      SELECT 
        c.*,
        COUNT(DISTINCT p.id)::int AS total_projects,
        COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'Active')::int AS active_projects,
        COUNT(DISTINCT u.id)::int AS total_users,
        COALESCE(SUM(p.total_budget), 0)::numeric AS total_budget,
        COALESCE(SUM(p.spent_budget), 0)::numeric AS spent_budget
      FROM companies c
      LEFT JOIN projects p ON c.id = p.company_id
      LEFT JOIN users u ON c.id = u.company_id
      GROUP BY c.id
      ORDER BY c.created_at DESC;
    `;
    const result = await db.query(query);
    return res.status(200).json({
      companies: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    return res.status(500).json({ message: 'Failed to retrieve companies.', error: error.message });
  }
}

export async function getCompanyById(req, res) {
  const { id } = req.params;

  try {
    const companyRes = await db.query('SELECT * FROM companies WHERE id = $1', [id]);
    if (companyRes.rows.length === 0) {
      return res.status(404).json({ message: 'Company not found.' });
    }

    const company = companyRes.rows[0];

    const [projectsRes, usersRes, auditRes] = await Promise.all([
      db.query(`
        SELECT p.*, eng.name AS engineer_name, hh.name AS house_holder_name, mgr.name AS manager_name
        FROM projects p
        LEFT JOIN users eng ON p.engineer_id = eng.id
        LEFT JOIN users hh ON p.house_holder_id = hh.id
        LEFT JOIN users mgr ON p.manager_id = mgr.id
        WHERE p.company_id = $1
        ORDER BY p.created_at DESC
      `, [id]),
      db.query(`
        SELECT id, name, email, role, phone, title, status, created_at
        FROM users
        WHERE company_id = $1
        ORDER BY created_at DESC
      `, [id]),
      db.query(`
        SELECT a.*, u.name AS actor_name
        FROM audit_logs a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE a.company_id = $1
        ORDER BY a.created_at DESC
        LIMIT 20
      `, [id]),
    ]);

    return res.status(200).json({
      ...company,
      projects: projectsRes.rows,
      users: usersRes.rows,
      auditLogs: auditRes.rows,
    });
  } catch (error) {
    console.error('Error fetching company dossier:', error);
    return res.status(500).json({ message: 'Failed to retrieve company details.', error: error.message });
  }
}

export async function createCompany(req, res) {
  const {
    name,
    code,
    subdomain,
    email,
    phone,
    address,
    adminName,
    adminEmail,
    adminPassword,
    adminPhone,
  } = req.body;

  if (!name || !code || !adminEmail || !adminName) {
    return res.status(400).json({
      message: 'Company name, company code, and initial admin name and email are required.',
    });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Verify unique code / subdomain
    const existingCode = await client.query('SELECT id FROM companies WHERE LOWER(code) = LOWER($1)', [code.trim()]);
    if (existingCode.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'A company with this unique code already exists.' });
    }

    const existingUser = await client.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [adminEmail.trim()]);
    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'A user account with this email address already exists.' });
    }

    // 1. Create Company
    const cleanSubdomain = subdomain ? subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '') : null;
    const compInsert = await client.query(`
      INSERT INTO companies (name, code, subdomain, email, phone, address, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE')
      RETURNING *;
    `, [
      name.trim(),
      code.trim().toUpperCase(),
      cleanSubdomain || null,
      email ? email.trim() : null,
      phone ? phone.trim() : null,
      address ? address.trim() : null,
    ]);

    const newCompany = compInsert.rows[0];

    // 2. Create Initial Company System Admin
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword || 'password123', salt);

    const userInsert = await client.query(`
      INSERT INTO users (company_id, name, email, password_hash, role, phone, title)
      VALUES ($1, $2, $3, $4, 'Admin', $5, 'Company System Administrator')
      RETURNING id, company_id, name, email, role, phone, title, created_at;
    `, [
      newCompany.id,
      adminName.trim(),
      adminEmail.trim(),
      passwordHash,
      adminPhone ? adminPhone.trim() : null,
    ]);

    const newAdmin = userInsert.rows[0];

    // 3. Log Audit
    await client.query(`
      INSERT INTO audit_logs (company_id, user_id, action, entity_type, entity_id, details)
      VALUES ($1, $2, 'CREATE_COMPANY', 'COMPANY', $3, $4);
    `, [
      newCompany.id,
      req.user?.id || null,
      String(newCompany.id),
      `Company "${newCompany.name}" registered with initial admin "${newAdmin.name}".`,
    ]);

    await client.query('COMMIT');

    return res.status(201).json({
      message: 'Company workspace provisioned and initial administrator created successfully.',
      company: newCompany,
      admin: newAdmin,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating company:', error);
    return res.status(500).json({ message: 'Failed to provision company workspace.', error: error.message });
  } finally {
    client.release();
  }
}

export async function updateCompanyStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['ACTIVE', 'SUSPENDED', 'DEACTIVATED'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    const result = await db.query(`
      UPDATE companies 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *;
    `, [status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Company not found.' });
    }

    const updated = result.rows[0];

    await logAudit({
      companyId: id,
      userId: req.user.id,
      action: 'UPDATE_COMPANY_STATUS',
      entityType: 'COMPANY',
      entityId: id,
      details: `Company "${updated.name}" status changed to ${status}.`,
    });

    return res.status(200).json({
      message: `Company status updated to ${status}.`,
      company: updated,
    });
  } catch (error) {
    console.error('Error updating company status:', error);
    return res.status(500).json({ message: 'Failed to update company status.', error: error.message });
  }
}

export async function updateCompany(req, res) {
  const { id } = req.params;
  const { name, code, subdomain, email, phone, address, logoUrl } = req.body;

  try {
    const existing = await db.query('SELECT * FROM companies WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Company not found.' });
    }

    const current = existing.rows[0];

    const result = await db.query(`
      UPDATE companies
      SET 
        name = COALESCE($1, name),
        code = COALESCE($2, code),
        subdomain = COALESCE($3, subdomain),
        email = COALESCE($4, email),
        phone = COALESCE($5, phone),
        address = COALESCE($6, address),
        logo_url = COALESCE($7, logo_url),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *;
    `, [
      name ? name.trim() : null,
      code ? code.trim().toUpperCase() : null,
      subdomain ? subdomain.trim().toLowerCase() : null,
      email ? email.trim() : null,
      phone ? phone.trim() : null,
      address ? address.trim() : null,
      logoUrl || null,
      id,
    ]);

    return res.status(200).json({
      message: 'Company profile updated successfully.',
      company: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating company profile:', error);
    return res.status(500).json({ message: 'Failed to update company.', error: error.message });
  }
}

export async function getAuditLogs(req, res) {
  const { companyId } = req.query;

  try {
    let query = `
      SELECT 
        a.*,
        u.name AS actor_name,
        u.email AS actor_email,
        u.role AS actor_role,
        c.name AS company_name
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN companies c ON a.company_id = c.id
    `;
    const params = [];

    if (companyId) {
      query += ' WHERE a.company_id = $1';
      params.push(companyId);
    }

    query += ' ORDER BY a.created_at DESC LIMIT 100;';

    const result = await db.query(query, params);
    return res.status(200).json({
      auditLogs: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return res.status(500).json({ message: 'Failed to retrieve audit trail.', error: error.message });
  }
}

export default {
  getPlatformStats,
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompanyStatus,
  updateCompany,
  getAuditLogs,
};
