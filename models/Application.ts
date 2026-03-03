import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db';
import { ApplicationStatus } from '../utils/enums';

// Attributes interface — all fields on the model
export interface ApplicationAttributes {
  id: number;
  job_id: number;
  tasker_id: number;
  message?: string;
  status: ApplicationStatus;
  created_at?: Date;
}

// Creation attributes — 'id', 'created_at', 'status' are auto-generated
export interface ApplicationCreationAttributes
  extends Optional<ApplicationAttributes, 'id' | 'created_at' | 'status' | 'message'> {}

class Application
  extends Model<ApplicationAttributes, ApplicationCreationAttributes>
  implements ApplicationAttributes
{
  public id!: number;
  public job_id!: number;
  public tasker_id!: number;
  public message!: string;
  public status!: ApplicationStatus;
  public created_at!: Date;
}

Application.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    job_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'jobs',
        key: 'id',
      },
    },
    tasker_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(ApplicationStatus)),
      defaultValue: ApplicationStatus.PENDING,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'applications',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['job_id', 'tasker_id'],
      },
    ],
  }
);

export default Application;
