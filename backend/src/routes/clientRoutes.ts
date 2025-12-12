import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { checkPlanLimits } from '../middleware/planLimits';
import {
  getClients,
  getClient,
  createClient,
  updateClient,
} from '../controllers/clientController';

const router = Router();

router.use(authenticate);

router.get('/', getClients);
router.get('/:id', getClient);
router.post('/', checkPlanLimits('clients'), createClient);
router.patch('/:id', updateClient);

export default router;

