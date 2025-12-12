import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { checkPlanLimits } from '../middleware/planLimits';
import { enforceSubscriptionStatus } from '../middleware/subscriptionEnforcement';
import {
  getJobs,
  getJob,
  createJob,
  updateJob,
  startJob,
  completeJob,
  getDashboardStats,
  getTodayJobs,
  getUpcomingJobs,
  getToCloseJobs,
} from '../controllers/jobController';
import {
  addJobMaterial,
  deleteJobMaterial,
} from '../controllers/jobMaterialController';
import {
  startJobChecklist,
  saveChecklistResponses,
} from '../controllers/jobChecklistController';
import {
  addAttachment,
  getAttachments,
  upload,
} from '../controllers/attachmentController';
import {
  generateReportPDF,
} from '../controllers/reportController';

const router = Router();

router.use(authenticate);
router.use(enforceSubscriptionStatus);

router.get('/', getJobs);
router.get('/dashboard/stats', getDashboardStats);
router.get('/dashboard/today', getTodayJobs);
router.get('/dashboard/upcoming', getUpcomingJobs);
router.get('/dashboard/to-close', getToCloseJobs);
router.get('/:id', getJob);
router.post('/', checkPlanLimits('jobs'), createJob);
router.patch('/:id', updateJob);
router.patch('/:id/start', startJob);
router.patch('/:id/complete', completeJob);

// Job Materials
router.post('/:id/materials', addJobMaterial);
router.delete('/:id/materials/:jobMaterialId', deleteJobMaterial);

// Job Checklists
router.post('/:id/checklists/:checklistId/start', startJobChecklist);

// Attachments
router.post('/:id/attachments', upload.single('file'), addAttachment);
router.get('/:id/attachments', getAttachments);

// Reports
router.get('/:id/report-pdf', generateReportPDF);

export default router;

// Export per le route delle checklist (separate)
export const jobChecklistRouter = Router();
jobChecklistRouter.use(authenticate);
jobChecklistRouter.use(enforceSubscriptionStatus);
jobChecklistRouter.post('/:id/responses', saveChecklistResponses);

