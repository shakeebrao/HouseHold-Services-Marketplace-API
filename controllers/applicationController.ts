import { Response } from 'express';
import { Application, Job, User } from '../models';
import { ApplicationStatus, JobStatus } from '../utils/enums';
import { AuthRequest } from '../middleware/auth';
import { UniqueConstraintError } from 'sequelize';

// POST apply to a job (taskers only)
export const applyToJob = async (req: AuthRequest, res: Response) => {
  try {
    const { job_id, message } = req.body;

    // Check if job exists and is OPEN
    const job = await Job.findByPk(job_id);
    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }
    if (job.status !== JobStatus.OPEN) {
      res.status(400).json({ message: 'This job is no longer open for applications' });
      return;
    }

    // Create application
    const application = await Application.create({
      job_id,
      tasker_id: req.user!.id,
      message,
    });

    res.status(201).json({
      message: 'Application submitted successfully!',
      data: application,
    });

    req.io?.to(`client_room_${job.client_id}`).emit(
      'new_application',
      `Tasker having id: ${application.tasker_id} has applied for your job.`
    );
  } catch (error) {
    // Handle duplicate application
    if (error instanceof UniqueConstraintError) {
      res.status(409).json({ message: 'You have already applied to this job' });
      return;
    }
    console.error('Error applying to job:', error);
    res.status(500).json({ message: 'Failed to submit application', error });
  }
};

// GET my applications (tasker sees their own applications)
export const getMyApplications = async (req: AuthRequest, res: Response) => {
  try {
    const applications = await Application.findAll({
      where: { tasker_id: req.user!.id },
      include: [
        {
          model: Job,
          as: 'job',
          attributes: ['title', 'budget'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    res.json({
      message: 'Your applications retrieved successfully!',
      data: applications,
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ message: 'Failed to retrieve applications', error });
  }
};

// GET applications for a specific job (client sees who applied)
export const getApplicationsForJob = async (req: AuthRequest, res: Response) => {
  try {
    const { job_id } = req.params;

    // Verify client owns this job
    const job = await Job.findOne({
      where: { id: job_id, client_id: req.user!.id },
    });
    if (!job) {
      res.status(404).json({ message: 'Job not found or you do not own this job' });
      return;
    }

    const applications = await Application.findAll({
      where: { job_id },
      include: [
        {
          model: User,
          as: 'tasker',
          attributes: ['full_name', 'email'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    res.json({
      message: 'Applications retrieved successfully!',
      data: applications,
    });
  } catch (error) {
    console.error('Error fetching job applications:', error);
    res.status(500).json({ message: 'Failed to retrieve applications', error });
  }
};

// PUT accept/reject an application (client only)
export const updateApplicationStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = [ApplicationStatus.ACCEPTED, ApplicationStatus.REJECTED];
    if (!validStatuses.includes(status)) {
      res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
      return;
    }

    // Get the application and verify client owns the job
    const application = await Application.findByPk(Number(id), {
      include: [{ model: Job, as: 'job', attributes: ['client_id'] }],
    });

    if (!application) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }

    const jobData = (application as any).job;
    if (jobData.client_id !== req.user!.id) {
      res.status(403).json({ message: 'You can only manage applications for your own jobs' });
      return;
    }

    // Update application status
    await application.update({ status });

    // If accepted, update job status to ASSIGNED
    if (status === ApplicationStatus.ACCEPTED) {
      await Job.update(
        { status: JobStatus.ASSIGNED },
        { where: { id: application.job_id } }
      );
    }

    res.json({
      message: `Application ${status.toLowerCase()} successfully!`,
      data: application,
    });
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({ message: 'Failed to update application', error });
  }
};
