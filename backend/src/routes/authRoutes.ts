import { Router } from 'express';
import {
  registerCompany,
  login,
  refresh,
} from '../controllers/authController';
import { loginRateLimiter, createRateLimiter } from '../middleware/rateLimit';

const router = Router();

router.post('/register-company', createRateLimiter, registerCompany);
router.post('/login', loginRateLimiter, login);
router.post('/refresh', loginRateLimiter, refresh);

export default router;

