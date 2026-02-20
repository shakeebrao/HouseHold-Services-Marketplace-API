import { Router, Response } from 'express';
import pool from '../db';
import { JobStatus } from '../utils/enums';
import { authenticate, authorizeRole, AuthRequest } from '../middleware/auth';

const router = Router();

// GET all OPEN jobs (for taskers to browse)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT jobs.*, users.full_name AS client_name FROM jobs LEFT JOIN users ON jobs.client_id = users.id ORDER BY jobs.created_at DESC'
    );
    res.json({
      message: "Jobs retrieved successfully!",
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ message: "Failed to retrieve jobs", error });
  }
});

// GET a single job by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT jobs.*, users.full_name AS client_name FROM jobs LEFT JOIN users ON jobs.client_id = users.id WHERE jobs.id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: "Job not found" });
      return;
    }

    res.json({
      message: "Job retrieved successfully!",
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ message: "Failed to retrieve job", error });
  }
});

// GET jobs posted by the logged-in client
router.get('/my/posted', authenticate, authorizeRole('CLIENT'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM jobs WHERE client_id = $1 ORDER BY created_at DESC',
      [req.user!.id]
    );
    res.json({
      message: "Your posted jobs retrieved successfully!",
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching client jobs:', error);
    res.status(500).json({ message: "Failed to retrieve your jobs", error });
  }
});

// POST a new job (clients only)
router.post('/', authenticate, authorizeRole('CLIENT'), async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, budget, status } = req.body;

    // Validate status if provided
    const validStatuses = Object.values(JobStatus);
    if (status && !validStatuses.includes(status)) {
      res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
      return;
    }

    const result = await pool.query(
      'INSERT INTO jobs (title, description, budget, status, client_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, description, budget, status || JobStatus.OPEN, req.user!.id]
    );

    res.status(201).json({
      message: "Job posted successfully!",
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ message: "Failed to create job", error });
  }
});

// PUT update a job (only the client who posted it)
router.put('/:id', authenticate, authorizeRole('CLIENT'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, budget, status } = req.body;

    // Verify ownership
    const job = await pool.query('SELECT * FROM jobs WHERE id = $1', [id]);
    if (job.rows.length === 0) {
      res.status(404).json({ message: "Job not found" });
      return;
    }
    if (job.rows[0].client_id !== req.user!.id) {
      res.status(403).json({ message: "You can only edit your own jobs" });
      return;
    }

    const result = await pool.query(
      'UPDATE jobs SET title = COALESCE($1, title), description = COALESCE($2, description), budget = COALESCE($3, budget), status = COALESCE($4, status) WHERE id = $5 RETURNING *',
      [title, description, budget, status, id]
    );

    res.json({
      message: "Job updated successfully!",
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ message: "Failed to update job", error });
  }
});

// DELETE a job (only the client who posted it)
router.delete('/:id', authenticate, authorizeRole('CLIENT'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const job = await pool.query('SELECT * FROM jobs WHERE id = $1', [id]);
    if (job.rows.length === 0) {
      res.status(404).json({ message: "Job not found" });
      return;
    }
    if (job.rows[0].client_id !== req.user!.id) {
      res.status(403).json({ message: "You can only delete your own jobs" });
      return;
    }

    const result = await pool.query('DELETE FROM jobs WHERE id = $1 RETURNING *', [id]);

    res.json({
      message: "Job deleted successfully!",
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ message: "Failed to delete job", error });
  }
});

export default router;
