import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import { generateToken } from '../utils/token.js';
import { sendPasswordResetEmail } from '../utils/email.js';

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const userResult = await db.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
      [email.trim()]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials. User not found.' });
    }

    const user = userResult.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials. Password mismatch.' });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      title: user.title,
    };

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

export async function getMe(req, res) {
  return res.status(200).json({
    user: req.user,
  });
}

/**
 * Handle Forgot Password Request:
 * Generates a crypto reset token, saves it with expiration in DB, and sends email.
 */
export async function forgotPassword(req, res) {
  const { email } = req.body;

  if (!email || !email.trim()) {
    return res.status(400).json({ message: 'Please provide a valid email address.' });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    // Ensure DB columns exist
    await db.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255),
      ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP WITH TIME ZONE;
    `);

    const userRes = await db.query(
      'SELECT id, name, email FROM users WHERE LOWER(email) = LOWER($1)',
      [cleanEmail]
    );

    if (userRes.rows.length === 0) {
      // For user friendliness while protecting user enumeration, return a clear message
      return res.status(200).json({
        message: 'If an account with that email exists in our system, password reset instructions have been sent.',
        sent: true,
      });
    }

    const user = userRes.rows[0];

    // Generate secure random reset token (64 hex characters)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Token expires in 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Store token hash and expiration in DB
    await db.query(
      `UPDATE users 
       SET reset_password_token = $1, reset_password_expires = $2 
       WHERE id = $3`,
      [tokenHash, expiresAt, user.id]
    );

    // Build reset URL
    const clientBaseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientBaseUrl}/reset-password?token=${rawToken}`;

    // Send email
    const emailResult = await sendPasswordResetEmail({
      toEmail: user.email,
      userName: user.name,
      resetUrl,
      resetToken: rawToken,
      expiresMinutes: 60,
    });

    console.log(`[Forgot Password] Reset token generated for ${user.email}. Link: ${resetUrl}`);

    return res.status(200).json({
      message: 'Password reset link has been sent to your email address.',
      sent: true,
      // Provide preview URL in development mode so user can test effortlessly
      devResetUrl: process.env.NODE_ENV !== 'production' ? resetUrl : undefined,
      devToken: process.env.NODE_ENV !== 'production' ? rawToken : undefined,
      emailDelivered: emailResult.success,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      message: 'An error occurred while processing your password reset request. Please try again.',
      error: error.message,
    });
  }
}

/**
 * Verify if a reset token is valid and unexpired
 */
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

/**
 * Reset password using the valid token
 */
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

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // Update password and invalidate token
    await db.query(
      `UPDATE users 
       SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL 
       WHERE id = $2`,
      [newPasswordHash, user.id]
    );

    console.log(`[Reset Password] Successfully updated password for user: ${user.email}`);

    return res.status(200).json({
      success: true,
      message: 'Your password has been successfully reset! You can now log in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Server error resetting password.', error: error.message });
  }
}

/**
 * Stakeholder Registration (Sign Up)
 */
export async function register(req, res) {
  const { name, email, password, role = 'House Holder', phone = '', title = '' } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
  }

  const validRoles = ['Admin', 'House Holder', 'Engineer', 'Manager'];
  const assignedRole = validRoles.includes(role) ? role : 'House Holder';

  try {
    const existing = await db.query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
      [email.trim()]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'An account with this email address already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await db.query(
      `INSERT INTO users (name, email, password_hash, role, phone, title)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, role, phone, title, created_at`,
      [name.trim(), email.trim().toLowerCase(), passwordHash, assignedRole, phone.trim(), title.trim()]
    );

    const newUser = result.rows[0];
    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    return res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone,
        title: newUser.title,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Failed to create account.', error: error.message });
  }
}

export default {
  login,
  getMe,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  register,
};
