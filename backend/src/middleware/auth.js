import { verifyToken } from '../utils/token.js';
import db from '../config/db.js';

export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);

    // Verify user & tenant status in PostgreSQL
    const query = `
      SELECT 
        u.id, 
        u.company_id, 
        u.name, 
        u.email, 
        u.role, 
        u.phone, 
        u.title, 
        u.status AS user_status,
        c.name AS company_name,
        c.code AS company_code,
        c.subdomain AS company_subdomain,
        c.logo_url AS company_logo,
        c.status AS company_status
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.id
      WHERE u.id = $1
    `;

    const result = await db.query(query, [decoded.id]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'User account not found or has been revoked.' });
    }

    const user = result.rows[0];

    // Enforce user active status
    if (user.user_status && user.user_status !== 'ACTIVE') {
      return res.status(403).json({ message: `Access Denied: Your user account status is ${user.user_status}.` });
    }

    // Enforce company active status for non-SuperAdmin users
    if (user.role !== 'SuperAdmin' && user.company_id) {
      if (user.company_status && user.company_status !== 'ACTIVE') {
        return res.status(403).json({ 
          message: `Access Denied: Your company workspace (${user.company_name || 'Tenant'}) is currently ${user.company_status.toLowerCase()}. Please contact platform support.` 
        });
      }
    }

    req.user = {
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

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired authentication token.' });
  }
}

export default authenticate;
