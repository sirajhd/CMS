import { Router } from 'express';
import { getUsers, getUserById, createUser, updateUser, deleteUser } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roleGuard.js';

const router = Router();

router.use(authenticate);

// List all stakeholders
router.get('/', getUsers);

// Get single user dossier with assigned projects
router.get('/:id', getUserById);

// Admin-only user management
router.post('/', authorizeRoles('Admin'), createUser);
router.put('/:id', authorizeRoles('Admin'), updateUser);
router.delete('/:id', authorizeRoles('Admin'), deleteUser);

export default router;
