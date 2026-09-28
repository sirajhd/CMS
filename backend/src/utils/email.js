import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Creates and returns a nodemailer transporter based on environment configuration.
 * Gracefully falls back to mock/stream mode if no SMTP credentials are provided.
 */
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });
  }

  // Fallback transporter: Logs email in terminal & dev preview for local testing
  return nodemailer.createTransport({
    streamTransport: true,
    newline: 'windows',
    buffer: true,
  });
}

const transporter = createTransporter();

/**
 * Send password reset email with modern branded HTML template.
 */
export async function sendPasswordResetEmail({ toEmail, userName, resetUrl, resetToken, expiresMinutes = 60 }) {
  const fromAddress = process.env.EMAIL_FROM || '"CMS Security" <no-reply@cms-portal.local>';
  const subject = 'Password Reset Request - Construction Management System';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <style>
        body { margin: 0; padding: 0; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f14; color: #f0f6fc; }
        .wrapper { width: 100%; max-width: 580px; margin: 0 auto; padding: 32px 16px; }
        .card { background-color: #161b22; border: 1px solid #30363d; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .logo-box { display: inline-block; background-color: #b4e600; color: #000000; padding: 10px 16px; border-radius: 10px; font-weight: 900; font-size: 16px; letter-spacing: 1px; margin-bottom: 20px; }
        h1 { color: #ffffff; font-size: 20px; font-weight: 700; margin: 0 0 12px 0; }
        p { color: #8b949e; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0; }
        .btn-container { margin: 28px 0; text-align: center; }
        .btn { display: inline-block; background-color: #b4e600; color: #000000 !important; text-decoration: none; font-weight: 800; font-size: 14px; padding: 14px 28px; border-radius: 10px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(180, 230, 0, 0.3); }
        .token-box { background-color: #0d1117; border: 1px dashed #30363d; border-radius: 8px; padding: 12px; margin: 20px 0; word-break: break-all; font-family: monospace; font-size: 12px; color: #58a6ff; }
        .footer { border-top: 1px solid #30363d; margin-top: 28px; padding-top: 20px; font-size: 12px; color: #6e7681; }
        .footer a { color: #58a6ff; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="card">
          <div class="logo-box">🏗️ CMS PORTAL</div>
          <h1>Password Reset Request</h1>
          <p>Hello <strong>${userName || 'User'}</strong>,</p>
          <p>We received a request to reset your password for your account associated with <strong>${toEmail}</strong> on the Construction Management System.</p>
          <p>Click the secure button below to choose a new password. This link is valid for the next <strong>${expiresMinutes} minutes</strong>.</p>
          
          <div class="btn-container">
            <a href="${resetUrl}" class="btn" target="_blank" rel="noopener noreferrer">Reset Password</a>
          </div>

          <p style="font-size: 12px; color: #8b949e;">If the button above does not work, copy and paste this URL into your browser:</p>
          <div class="token-box">${resetUrl}</div>

          <div class="footer">
            <p>If you did not request a password reset, you can safely ignore this email. Your current password will remain active and unchanged.</p>
            <p>© ${new Date().getFullYear()} Construction Management System. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Password Reset Request - Construction Management System

Hello ${userName || 'User'},

We received a request to reset the password for your account (${toEmail}).
Please use the following link to reset your password (valid for ${expiresMinutes} minutes):

${resetUrl}

If you did not request this, please ignore this email.
  `;

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject,
      text: textContent,
      html: htmlContent,
    });

    console.log(`📧 Password reset email dispatched to ${toEmail}. MessageId: ${info.messageId || 'dev-stream'}`);
    return { success: true, info };
  } catch (error) {
    console.error('❌ Failed to send password reset email via transporter:', error);
    // Don't crash API if SMTP server is down in dev, return failure details
    return { success: false, error: error.message };
  }
}

export default {
  sendPasswordResetEmail,
};
