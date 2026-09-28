import { Router } from 'express';
import { 
  getProjects, 
  getProjectById, 
  createProject, 
  updateProject,
  deleteProject,
  getProjectActivities 
} from '../controllers/projectController.js';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roleGuard.js';
import { verifySiteAccess } from '../middleware/siteAccessGuard.js';

const router = Router();

// All project endpoints require valid JWT authentication
router.use(authenticate);

// Listing projects (scoped by role inside controller)
router.get('/', getProjects);

// Single project access guarded by site assignment
router.get('/:id', verifySiteAccess, getProjectById);

// Specific project activities timeline
router.get('/:id/activities', verifySiteAccess, getProjectActivities);

// Admin-only site creation
router.post('/', authorizeRoles('Admin'), createProject);

// Admin & Manager site updates
router.put('/:id', verifySiteAccess, authorizeRoles('Admin', 'Manager'), updateProject);

// Admin-only site deletion
router.delete('/:id', authorizeRoles('Admin'), deleteProject);

export default router;
