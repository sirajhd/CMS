import { Router } from 'express';
import { getPayments, processPayment } from '../controllers/paymentController.js';
import { uploadMiddleware } from '../controllers/documentController.js';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roleGuard.js';

const router = Router();

router.use(authenticate);

// List payments (Admin and assigned site stakeholders)
router.get('/', getPayments);

// Only Site Manager can process disbursements (Admin strictly prohibited)
router.patch('/:id/process', authorizeRoles('Manager'), uploadMiddleware.single('receipt'), processPayment);

export default router;
