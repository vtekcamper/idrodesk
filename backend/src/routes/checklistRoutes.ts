import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getChecklists,
  getChecklist,
  createChecklist,
} from '../controllers/checklistController';

const router = Router();

router.use(authenticate);

router.get('/', getChecklists);
router.get('/:id', getChecklist);
router.post('/', createChecklist);

export default router;

