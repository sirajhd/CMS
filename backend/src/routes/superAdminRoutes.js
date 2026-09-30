import { Router } from 'express';
import { 
  getPlatformStats, 
  getCompanies, 
  getCompanyById, 
  createCompany, 
  updateCompanyStatus, 
  updateCompany, 
  getAuditLogs 
} from '../controllers/superAdminController.js';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roleGuard.js';

const router = Router();

// All SuperAdmin routes require authentication and SuperAdmin role
router.use(authenticate);
router.use(authorizeRoles('SuperAdmin'));

// Platform-wide metrics and dashboard
router.get('/stats', getPlatformStats);

// Tenant management
router.get('/companies', getCompanies);
router.get('/companies/:id', getCompanyById);
router.post('/companies', createCompany);
router.put('/companies/:id', updateCompany);
router.patch('/companies/:id/status', updateCompanyStatus);

// Platform Audit Logs
router.get('/audit-logs', getAuditLogs);

export default router;
