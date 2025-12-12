import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { enforceSubscriptionStatus } from '../middleware/subscriptionEnforcement';
import {
  getChecklists,
  getChecklist,
  createChecklist,
} from '../controllers/checklistController';

const router = Router();

router.use(authenticate);
router.use(enforceSubscriptionStatus);

router.get('/', getChecklists);
router.get('/:id', getChecklist);
router.post('/', createChecklist);

export default router;

