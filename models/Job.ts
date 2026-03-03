import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db';
import { JobStatus } from '../utils/enums';

// Attributes interface — all fields on the model
export interface JobAttributes {
  id: number;
  client_id: number;
  title: string;
  description: string;
  budget: number;
  status: JobStatus;
  created_at?: Date;
}

// Creation attributes — 'id' and 'created_at' are auto-generated
export interface JobCreationAttributes extends Optional<JobAttributes, 'id' | 'created_at' | 'status' | 'budget'> {}

class Job extends Model<JobAttributes, JobCreationAttributes> implements JobAttributes {
  public id!: number;
  public client_id!: number;
  public title!: string;
  public description!: string;
  public budget!: number;
  public status!: JobStatus;
  public created_at!: Date;
}

Job.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    budget: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: JobStatus.OPEN,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'jobs',
    timestamps: false,
  }
);

export default Job;
