import { Router } from 'express';
import { getDocuments, uploadDocument, uploadMiddleware } from '../controllers/documentController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getDocuments);
router.post('/', uploadMiddleware.single('file'), uploadDocument);

export default router;
