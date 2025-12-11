import { Router } from 'express';
import {
  registerCompany,
  login,
  refresh,
} from '../controllers/authController';

const router = Router();

router.post('/register-company', registerCompany);
router.post('/login', login);
router.post('/refresh', refresh);

export default router;

