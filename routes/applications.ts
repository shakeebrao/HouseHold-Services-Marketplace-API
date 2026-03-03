import { Router } from 'express';
import { authenticate, authorizeRole } from '../middleware/auth';
import {
  applyToJob,
  getMyApplications,
  getApplicationsForJob,
  updateApplicationStatus,
} from '../controllers/applicationController';

const router = Router();

router.post('/', authenticate, authorizeRole('TASKER'), applyToJob);
router.get('/my', authenticate, authorizeRole('TASKER'), getMyApplications);
router.get('/job/:job_id', authenticate, authorizeRole('CLIENT'), getApplicationsForJob);
router.put('/:id/status', authenticate, authorizeRole('CLIENT'), updateApplicationStatus);

export default router;
