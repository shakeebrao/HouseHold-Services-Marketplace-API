import { Router } from 'express';
import { authenticate, authorizeRole } from '../middleware/auth';
import {
  getAllJobs,
  getJobById,
  getMyPostedJobs,
  createJob,
  updateJob,
  deleteJob,
} from '../controllers/jobsController';

const router = Router();

router.get('/', getAllJobs);
router.get('/my/posted', authenticate, authorizeRole('CLIENT'), getMyPostedJobs);
router.get('/:id', getJobById);
router.post('/', authenticate, authorizeRole('CLIENT'), createJob);
router.put('/:id', authenticate, authorizeRole('CLIENT'), updateJob);
router.delete('/:id', authenticate, authorizeRole('CLIENT'), deleteJob);

export default router;