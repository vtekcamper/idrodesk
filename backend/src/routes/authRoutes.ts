import { Router } from 'express';
import {
  registerCompany,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
} from '../controllers/authController';
import { loginRateLimiter, createRateLimiter } from '../middleware/rateLimit';

const router = Router();

router.post('/register-company', createRateLimiter, registerCompany);
router.post('/login', loginRateLimiter, login);
router.post('/refresh', loginRateLimiter, refresh);
router.post('/logout', logout);
router.post('/forgot-password', loginRateLimiter, forgotPassword);
router.post('/reset-password', loginRateLimiter, resetPassword);

export default router;

