import { Router } from 'express';
import { getMaterials, createMaterial, recordDelivery } from '../controllers/materialController.js';
import { authenticate } from '../middleware/auth.js';
import { verifySiteAccess } from '../middleware/siteAccessGuard.js';

const router = Router();

router.use(authenticate);

router.get('/', getMaterials);
router.post('/', verifySiteAccess, createMaterial);
router.patch('/:id/deliver', recordDelivery);

export default router;
