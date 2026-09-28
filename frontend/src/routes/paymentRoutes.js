import { Router } from 'express';
import { getPayments, processPayment } from '../controllers/paymentController.js';
import { uploadMiddleware } from '../controllers/documentController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getPayments);
router.patch('/:id/process', uploadMiddleware.single('receipt'), processPayment);

export default router;
