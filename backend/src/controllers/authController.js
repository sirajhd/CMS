import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import { generateToken } from '../utils/token.js';
import { sendPasswordResetEmail } from '../utils/email.js';
import { logAudit } from '../utils/auditLogger.js';

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const query = `
      SELECT 
        u.*,
        c.name AS company_name,
        c.code AS company_code,
        c.subdomain AS company_subdomain,
        c.logo_url AS company_logo,
        c.status AS company_status
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.id
      WHERE LOWER(u.email) = LOWER($1)
    `;

    const userResult = await db.query(query, [email.trim()]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials. User not found.' });
    }

    const user = userResult.rows[0];

    // Enforce active user status
    if (user.status && user.status !== 'ACTIVE') {
      return res.status(403).json({ message: `Access Denied: Your user account status is ${user.status}.` });
    }

    // Enforce company active status for non-SuperAdmin users
    if (user.role !== 'SuperAdmin' && user.company_id) {
      if (user.company_status && user.company_status !== 'ACTIVE') {
        return res.status(403).json({
          message: `Access Denied: Your company workspace (${user.company_name || 'Tenant'}) is currently ${user.company_status.toLowerCase()}. Please contact platform administrator.`,
        });
      }
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials. Password mismatch.' });
    }

    const token = generateToken({
      id: user.id,
      companyId: user.company_id,
      email: user.email,
      role: user.role,
    });

    const userProfile = {
      id: user.id,
      companyId: user.company_id,
      companyName: user.company_name,
      companyCode: user.company_code,
      companySubdomain: user.company_subdomain,
      companyLogo: user.company_logo,
      companyStatus: user.company_status,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      title: user.title,
    };

    // Log successful sign-in
    await logAudit({
      companyId: user.company_id,
      userId: user.id,
      action: 'USER_LOGIN',
      entityType: 'AUTH',
      entityId: user.id,
      details: `User ${user.email} (${user.role}) logged in successfully.`,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      message: 'Authentication successful',
      token,
      user: userProfile,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error during authentication.' });
  }
}

/**
 * Company Self-Registration (Onboarding for new construction companies)
 */
export async function registerCompany(req, res) {
  const {
    name,
    companyName,
    code,
    companyCode,
    subdomain,
    email,
    companyEmail,
    phone,
    companyPhone,
    address,
    adminName,
    adminEmail,
    adminPassword,
    adminPhone,
    adminTitle,
  } = req.body;

  const targetName = (name || companyName || '').trim();
  let targetCode = (code || companyCode || '').trim();
  if (!targetCode && targetName) {
    targetCode = targetName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase();
  }
  const targetAdminEmail = (adminEmail || '').trim();
  const targetAdminName = (adminName || '').trim();
  const targetAdminPassword = adminPassword || '';

  if (!targetName || !targetCode || !targetAdminName || !targetAdminEmail || !targetAdminPassword) {
    return res.status(400).json({
      message: 'Company name, company code, admin name, admin email, and password are required.',
    });
  }

  if (targetAdminPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Check unique code and email
    const codeCheck = await client.query('SELECT id FROM companies WHERE LOWER(code) = LOWER($1)', [targetCode]);
    if (codeCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'A company with this unique identification code already exists.' });
    }

    const emailCheck = await client.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [targetAdminEmail]);
    if (emailCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'An account with this email address already exists.' });
    }

    // 1. Create Company
    const cleanSubdomain = subdomain ? subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '') : targetCode.toLowerCase();
    const compInsert = await client.query(`
      INSERT INTO companies (name, code, subdomain, email, phone, address, status, total_sites)
      VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE', 0)
      RETURNING *;
    `, [
      targetName,
      targetCode.toUpperCase(),
      cleanSubdomain,
      (email || companyEmail) ? (email || companyEmail).trim() : null,
      (phone || companyPhone) ? (phone || companyPhone).trim() : null,
      address ? address.trim() : null,
    ]);

    const newCompany = compInsert.rows[0];

    // 2. Create Initial Company System Admin
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    const userInsert = await client.query(`
      INSERT INTO users (company_id, name, email, password_hash, role, phone, title)
      VALUES ($1, $2, $3, $4, 'Admin', $5, $6)
      RETURNING id, company_id, name, email, role, phone, title, created_at;
    `, [
      newCompany.id,
      adminName.trim(),
      adminEmail.trim().toLowerCase(),
      passwordHash,
      adminPhone ? adminPhone.trim() : null,
      adminTitle ? adminTitle.trim() : 'Company System Administrator',
    ]);

    const newAdmin = userInsert.rows[0];

    // 3. Log Audit
    await client.query(`
      INSERT INTO audit_logs (company_id, user_id, action, entity_type, entity_id, details)
      VALUES ($1, $2, 'COMPANY_SELF_REGISTRATION', 'COMPANY', $3, $4);
    `, [
      newCompany.id,
      newAdmin.id,
      String(newCompany.id),
      `Company "${newCompany.name}" provisioned workspace with administrator "${newAdmin.name}".`,
    ]);

    await client.query('COMMIT');

    const token = generateToken({
      id: newAdmin.id,
      companyId: newCompany.id,
      email: newAdmin.email,
      role: 'Admin',
    });

    return res.status(201).json({
      message: 'Company workspace registered successfully. Welcome to HDtech-CMS!',
      token,
      user: {
        id: newAdmin.id,
        companyId: newCompany.id,
        companyName: newCompany.name,
        companyCode: newCompany.code,
        companySubdomain: newCompany.subdomain,
        companyLogo: newCompany.logo_url,
        companyStatus: newCompany.status,
        company: {
          id: newCompany.id,
          name: newCompany.name,
          code: newCompany.code,
          subdomain: newCompany.subdomain,
          logoUrl: newCompany.logo_url,
          status: newCompany.status,
        },
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
        phone: newAdmin.phone,
        title: newAdmin.title,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error registering company:', error);
    return res.status(500).json({ message: 'Failed to provision company workspace.', error: error.message });
  } finally {
    client.release();
  }
}

export async function getMe(req, res) {
  return res.status(200).json({
    user: req.user,
  });
}

export async function forgotPassword(req, res) {
  const { email } = req.body;

  if (!email || !email.trim()) {
    return res.status(400).json({ message: 'Please provide a valid email address.' });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const userRes = await db.query(
      'SELECT id, name, email FROM users WHERE LOWER(email) = LOWER($1)',
      [cleanEmail]
    );

    if (userRes.rows.length === 0) {
      return res.status(200).json({
        message: 'If an account with that email exists in our system, password reset instructions have been sent.',
        sent: true,
      });
    }

    const user = userRes.rows[0];
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await db.query(
      `UPDATE users 
       SET reset_password_token = $1, reset_password_expires = $2 
       WHERE id = $3`,
      [tokenHash, expiresAt, user.id]
    );

    const clientBaseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientBaseUrl}/reset-password?token=${rawToken}`;

    const emailResult = await sendPasswordResetEmail({
      toEmail: user.email,
      userName: user.name,
      resetUrl,
      resetToken: rawToken,
      expiresMinutes: 60,
    });

    return res.status(200).json({
      message: 'Password reset link has been sent to your email address.',
      sent: true,
      devResetUrl: process.env.NODE_ENV !== 'production' ? resetUrl : undefined,
      devToken: process.env.NODE_ENV !== 'production' ? rawToken : undefined,
      emailDelivered: emailResult.success,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      message: 'An error occurred while processing your password reset request.',
      error: error.message,
    });
  }
}

export async function verifyResetToken(req, res) {
  const { token } = req.params;

  if (!token) {
    return res.status(400).json({ valid: false, message: 'Reset token is required.' });
  }

  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const result = await db.query(
      `SELECT id, name, email FROM users 
       WHERE reset_password_token = $1 
         AND reset_password_expires > NOW()`,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        valid: false,
        message: 'Password reset link is invalid or has expired. Please request a new one.',
      });
    }

    return res.status(200).json({
      valid: true,
      message: 'Reset token is valid.',
      email: result.rows[0].email,
      name: result.rows[0].name,
    });
  } catch (error) {
    console.error('Verify reset token error:', error);
    return res.status(500).json({ valid: false, message: 'Server error verifying reset token.' });
  }
}

export async function resetPassword(req, res) {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Token and new password are required.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
  }

  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const result = await db.query(
      `SELECT id, name, email FROM users 
       WHERE reset_password_token = $1 
         AND reset_password_expires > NOW()`,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: 'Password reset link is invalid or has expired. Please submit a new reset request.',
      });
    }

    const user = result.rows[0];
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await db.query(
      `UPDATE users 
       SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL 
       WHERE id = $2`,
      [newPasswordHash, user.id]
    );

    return res.status(200).json({
      success: true,
      message: 'Your password has been successfully reset! You can now log in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Server error resetting password.', error: error.message });
  }
}

export default {
  login,
  registerCompany,
  getMe,
  forgotPassword,
  verifyResetToken,
  resetPassword,
};
