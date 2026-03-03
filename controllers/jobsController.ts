import { Response } from 'express';
import { Job, User } from '../models';
import { JobStatus } from '../utils/enums';
import { AuthRequest } from '../middleware/auth';

// GET all jobs
export const getAllJobs = async (req: AuthRequest, res: Response) => {
  try {
    const jobs = await Job.findAll({
      include: [{ model: User, as: 'client', attributes: ['full_name'] }],
      order: [['created_at', 'DESC']],
    });

    res.json({
      message: 'Jobs retrieved successfully!',
      data: jobs,
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ message: 'Failed to retrieve jobs', error });
  }
};

// GET a single job by ID
export const getJobById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const job = await Job.findByPk(Number(id), {
      include: [{ model: User, as: 'client', attributes: ['full_name'] }],
    });

    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    res.json({
      message: 'Job retrieved successfully!',
      data: job,
    });
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ message: 'Failed to retrieve job', error });
  }
};

// GET jobs posted by the logged-in client
export const getMyPostedJobs = async (req: AuthRequest, res: Response) => {
  try {
    const jobs = await Job.findAll({
      where: { client_id: req.user!.id },
      order: [['created_at', 'DESC']],
    });

    res.json({
      message: 'Your posted jobs retrieved successfully!',
      data: jobs,
    });
  } catch (error) {
    console.error('Error fetching client jobs:', error);
    res.status(500).json({ message: 'Failed to retrieve your jobs', error });
  }
};

// POST create a new job
export const createJob = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, budget, status } = req.body;

    // Validate status if provided
    const validStatuses = Object.values(JobStatus);
    if (status && !validStatuses.includes(status)) {
      res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
      return;
    }

    const job = await Job.create({
      title,
      description,
      budget,
      status: status || JobStatus.OPEN,
      client_id: req.user!.id,
    });

    req.io?.to('taskers').emit('new_job', job);
    res.status(201).json({
      message: 'Job posted successfully!',
      data: job,
    });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ message: 'Failed to create job', error });
  }
};

// PUT update a job
export const updateJob = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, budget, status } = req.body;

    const job = await Job.findByPk(Number(id));
    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }
    if (job.client_id !== req.user!.id) {
      res.status(403).json({ message: 'You can only edit your own jobs' });
      return;
    }

    await job.update({
      title: title ?? job.title,
      description: description ?? job.description,
      budget: budget ?? job.budget,
      status: status ?? job.status,
    });

    res.json({
      message: 'Job updated successfully!',
      data: job,
    });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ message: 'Failed to update job', error });
  }
};

// DELETE a job
export const deleteJob = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const job = await Job.findByPk(Number(id));
    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }
    if (job.client_id !== req.user!.id) {
      res.status(403).json({ message: 'You can only delete your own jobs' });
      return;
    }

    await job.destroy();

    res.json({
      message: 'Job deleted successfully!',
      data: job,
    });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ message: 'Failed to delete job', error });
  }
};