import { Router } from 'express';
import { getMaterials, createMaterial, recordDelivery } from '../controllers/materialController.js';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roleGuard.js';
import { verifySiteAccess } from '../middleware/siteAccessGuard.js';

const router = Router();

router.use(authenticate);

// View materials
router.get('/', getMaterials);

// Only Site Engineer can create material requisitions
router.post('/', authorizeRoles('Engineer'), verifySiteAccess, createMaterial);

// Only Site Manager can confirm material deliveries
router.patch('/:id/deliver', authorizeRoles('Manager'), recordDelivery);

export default router;
