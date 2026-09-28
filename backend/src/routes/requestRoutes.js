import { Router } from 'express';
import { getRequests, createRequest, reviewRequest } from '../controllers/requestController.js';
import { authenticate } from '../middleware/auth.js';
import { verifySiteAccess } from '../middleware/siteAccessGuard.js';

const router = Router();

router.use(authenticate);

router.get('/', getRequests);
router.post('/', verifySiteAccess, createRequest);
router.patch('/:id/review', reviewRequest);

export default router;
