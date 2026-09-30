import { Router } from 'express';
import { 
  getRequests, 
  getRequestById,
  createRequest, 
  reviewRequest, 
  processRequisitionDisbursement 
} from '../controllers/requestController.js';
import { uploadMiddleware } from '../controllers/documentController.js';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roleGuard.js';
import { verifySiteAccess } from '../middleware/siteAccessGuard.js';

const router = Router();

router.use(authenticate);

// List requisitions (Admin can view for oversight, site actors view only assigned sites)
router.get('/', getRequests);
router.get('/:id', getRequestById);

// STEP 1: Site Engineer submits requisition for assigned site (Admin prohibited)
router.post('/', authorizeRoles('Engineer'), verifySiteAccess, createRequest);

// STEP 2: Property Owner (Householder) reviews & approves/rejects (Admin prohibited)
router.patch('/:id/review', authorizeRoles('House Holder'), reviewRequest);

// STEP 3 & 4: Project Manager processes disbursement, uploads receipt, records extra expenses (Admin prohibited)
router.patch('/:id/process', authorizeRoles('Manager'), uploadMiddleware.single('receipt'), processRequisitionDisbursement);
router.post('/:id/process', authorizeRoles('Manager'), uploadMiddleware.single('receipt'), processRequisitionDisbursement);

export default router;

