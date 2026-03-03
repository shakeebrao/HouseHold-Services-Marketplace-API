import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../db';
import { UserRole } from '../utils/enums';

// Attributes interface — all fields on the model
export interface UserAttributes {
  id: number;
  full_name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at?: Date;
}

// Creation attributes — 'id' and 'created_at' are auto-generated
export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'created_at'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public full_name!: string;
  public email!: string;
  public password_hash!: string;
  public role!: UserRole;
  public created_at!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    full_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    password_hash: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM(...Object.values(UserRole)),
      defaultValue: UserRole.CLIENT,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: false, // We manage created_at manually
  }
);

export default User;
