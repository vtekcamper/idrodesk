import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { checkPlanLimits } from '../middleware/planLimits';
import { enforceSubscriptionStatus } from '../middleware/subscriptionEnforcement';
import {
  getQuotes,
  getQuote,
  createQuote,
  updateQuote,
  duplicateQuote,
  convertToJob,
} from '../controllers/quoteController';

const router = Router();

router.use(authenticate);
router.use(enforceSubscriptionStatus);

router.get('/', getQuotes);
router.get('/:id', getQuote);
router.post('/', checkPlanLimits('quotes'), createQuote);
router.patch('/:id', updateQuote);
router.post('/:id/duplicate', duplicateQuote);
router.post('/:id/to-job', convertToJob);

export default router;

