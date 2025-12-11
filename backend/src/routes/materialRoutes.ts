import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getMaterials,
  createMaterial,
  updateMaterial,
} from '../controllers/materialController';

const router = Router();

router.use(authenticate);

router.get('/', getMaterials);
router.post('/', createMaterial);
router.patch('/:id', updateMaterial);

export default router;

