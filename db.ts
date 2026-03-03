import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'HouseHold Services Management',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    dialect: 'postgres',
    logging: false, // Set to console.log to see SQL queries
  }
);

export async function connectDB(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL database successfully!');

    // Sync all models (creates tables if they don't exist)
    await sequelize.sync();
    console.log('✅ All models synchronized successfully!');
  } catch (error) {
    console.error('❌ Failed to connect to PostgreSQL database:', error);
    process.exit(1);
  }
}

export default sequelize;
