import User from './User';
import Job from './Job';
import Application from './Application';

// ─── Associations ────────────────────────────────────────────────

// A User (client) has many Jobs
User.hasMany(Job, { foreignKey: 'client_id', as: 'jobs' });
Job.belongsTo(User, { foreignKey: 'client_id', as: 'client' });

// A Job has many Applications
Job.hasMany(Application, { foreignKey: 'job_id', as: 'applications' });
Application.belongsTo(Job, { foreignKey: 'job_id', as: 'job' });

// A User (tasker) has many Applications
User.hasMany(Application, { foreignKey: 'tasker_id', as: 'applications' });
Application.belongsTo(User, { foreignKey: 'tasker_id', as: 'tasker' });

// ─── Export ──────────────────────────────────────────────────────

export { User, Job, Application };
