import { Router, Response } from 'express';
import pool from '../db';
import { ApplicationStatus, JobStatus } from '../utils/enums';
import { authenticate, authorizeRole, AuthRequest } from '../middleware/auth';

const router = Router();

// POST apply to a job (taskers only)
router.post('/', authenticate, authorizeRole('TASKER'), async (req: AuthRequest, res: Response) => {
  try {
    const { job_id, message } = req.body;

    // Check if job exists and is OPEN
    const job = await pool.query('SELECT * FROM jobs WHERE id = $1', [job_id]);
    if (job.rows.length === 0) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }
    if (job.rows[0].status !== JobStatus.OPEN) {
      res.status(400).json({ message: 'This job is no longer open for applications' });
      return;
    }

    // Insert application
    const result = await pool.query(
      'INSERT INTO applications (job_id, tasker_id, message) VALUES ($1, $2, $3) RETURNING *',
      [job_id, req.user!.id, message]
    );

    res.status(201).json({
      message: 'Application submitted successfully!',
      data: result.rows[0]
    });
  } catch (error: any) {
    // Handle duplicate application
    if (error.code === '23505') {
      res.status(409).json({ message: 'You have already applied to this job' });
      return;
    }
    console.error('Error applying to job:', error);
    res.status(500).json({ message: 'Failed to submit application', error });
  }
});

// GET my applications (tasker sees their own applications)
router.get('/my', authenticate, authorizeRole('TASKER'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT applications.*, jobs.title AS job_title, jobs.budget AS job_budget
       FROM applications
       JOIN jobs ON applications.job_id = jobs.id
       WHERE applications.tasker_id = $1
       ORDER BY applications.created_at DESC`,
      [req.user!.id]
    );

    res.json({
      message: 'Your applications retrieved successfully!',
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ message: 'Failed to retrieve applications', error });
  }
});

// GET applications for a job (client sees who applied to their job)
router.get('/job/:job_id', authenticate, authorizeRole('CLIENT'), async (req: AuthRequest, res: Response) => {
  try {
    const { job_id } = req.params;

    // Verify client owns this job
    const job = await pool.query('SELECT * FROM jobs WHERE id = $1 AND client_id = $2', [job_id, req.user!.id]);
    if (job.rows.length === 0) {
      res.status(404).json({ message: 'Job not found or you do not own this job' });
      return;
    }

    const result = await pool.query(
      `SELECT applications.*, users.full_name AS tasker_name, users.email AS tasker_email
       FROM applications
       JOIN users ON applications.tasker_id = users.id
       WHERE applications.job_id = $1
       ORDER BY applications.created_at DESC`,
      [job_id]
    );

    res.json({
      message: 'Applications retrieved successfully!',
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching job applications:', error);
    res.status(500).json({ message: 'Failed to retrieve applications', error });
  }
});

// PUT accept/reject an application (client only)
router.put('/:id/status', authenticate, authorizeRole('CLIENT'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = [ApplicationStatus.ACCEPTED, ApplicationStatus.REJECTED];
    if (!validStatuses.includes(status)) {
      res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
      return;
    }

    // Get the application and verify client owns the job
    const application = await pool.query(
      `SELECT applications.*, jobs.client_id 
       FROM applications 
       JOIN jobs ON applications.job_id = jobs.id 
       WHERE applications.id = $1`,
      [id]
    );

    if (application.rows.length === 0) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }
    if (application.rows[0].client_id !== req.user!.id) {
      res.status(403).json({ message: 'You can only manage applications for your own jobs' });
      return;
    }

    // Update application status
    const result = await pool.query(
      'UPDATE applications SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    // If accepted, update job status to ASSIGNED
    if (status === ApplicationStatus.ACCEPTED) {
      await pool.query('UPDATE jobs SET status = $1 WHERE id = $2', [JobStatus.ASSIGNED, application.rows[0].job_id]);
    }

    res.json({
      message: `Application ${status.toLowerCase()} successfully!`,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({ message: 'Failed to update application', error });
  }
});

export default router;
