import db from '../config/db.js';

export async function logAudit({ companyId = null, userId = null, action, entityType, entityId = null, details = null, ipAddress = null }) {
  try {
    const query = `
      INSERT INTO audit_logs (company_id, user_id, action, entity_type, entity_id, details, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    await db.query(query, [
      companyId || null,
      userId || null,
      action,
      entityType,
      entityId ? String(entityId) : null,
      typeof details === 'object' ? JSON.stringify(details) : details,
      ipAddress || null,
    ]);
  } catch (error) {
    console.error('Failed to write audit log:', error.message);
  }
}

export default logAudit;
