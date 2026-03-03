import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import swaggerUi from 'swagger-ui-express';
import jobRoutes from './routes/jobs';
import userRoutes from './routes/users';
import applicationRoutes from './routes/applications';
import { connectDB } from './db';
import generateSwagger from './swagger';
import path from 'path';
import fs from 'fs';

// Import models to register associations
import './models';

const app = express();
const port = process.env.PORT || 3000;
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  const { id, role, full_name } = (socket as any).user;
  if (role === 'CLIENT') {
    socket.join(`client_room_${id}`);
    console.log(`Client ${full_name} joined client room`);
  }
  if (role === 'TASKER') {
    socket.join('taskers');
    console.log(`Tasker ${full_name} joined taskers room`);
  }
  socket.on('disconnect', () => {
    console.log('user disconnected', socket.id);
  });
});

app.use((req: any, res: Response, next) => {
  req.io = io;
  next();
});

// Middleware to parse JSON data sent to our API (must be before routes)
app.use(express.json());

// Mount routes
app.use('/api/jobs', jobRoutes);
app.use('/api/users', userRoutes);
app.use('/api/applications', applicationRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('Household Marketplace API is running! Visit <a href="/api-docs">API Docs</a> to explore the API.');
});

// Start server with database connection
async function startServer() {
  await connectDB();

  // Auto-generate Swagger docs from routes
  await generateSwagger();

  // Load the generated spec and serve Swagger UI
  const swaggerOutputPath = path.join(__dirname, 'swagger-output.json');
  const swaggerDocument = JSON.parse(fs.readFileSync(swaggerOutputPath, 'utf-8'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  httpServer.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
    console.log(`Swagger docs at http://localhost:${port}/api-docs`);
  });
}

startServer();
