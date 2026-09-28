import { Router } from 'express';
import {
  login,
  getMe,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  register,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Authentication
router.post('/login', login);
router.post('/register', register);
router.get('/me', authenticate, getMe);

// Forgot & Reset Password Flow
router.post('/forgot-password', forgotPassword);
router.get('/verify-reset-token/:token', verifyResetToken);
router.post('/reset-password', resetPassword);

export default router;
