export function enforceTenantIsolation(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  // SuperAdmin has platform-wide authority
  if (req.user.role === 'SuperAdmin') {
    return next();
  }

  // All other roles must have an associated company ID
  if (!req.user.companyId) {
    return res.status(403).json({
      message: 'Access Denied: User is not assigned to an active construction company workspace.'
    });
  }

  next();
}

export default enforceTenantIsolation;
