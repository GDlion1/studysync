
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import groupRoutes from './routes/groups.js';
import hubRoutes from './routes/hub.js';
import scheduleRoutes from './routes/schedule.js';
import resourceRoutes from './routes/resources.js';

// Setup Socket.IO
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';

dotenv.config();

const app = express();
const httpServer = createServer(app);

const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_ORIGIN || 'http://localhost:3000,http://localhost:5173')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS origin denied: ${origin}`));
    }
  },
  credentials: true,
};

const io = new Server(httpServer, {
  cors: { origin: allowedOrigins.length > 0 ? allowedOrigins : '*', methods: ['GET', 'POST'] }
});

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());

// Fix for Google Auth COOP issues
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  next();
});

// Set up static uploads folder (for Multer)
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/hub', hubRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/resources', resourceRoutes);

// Socket.IO Logic
io.on('connection', (socket) => {
    // console.log('A user connected:', socket.id);

    // Join a specific study group room
    socket.on('join_room', (room) => {
        socket.join(room);
        // console.log(`User ${socket.id} joined room ${room}`);
    });

    // Handle new messages in Real-Time
    socket.on('send_message', (data) => {
        // data.room is the group_id
        // Broadcast the new message to everyone in the group room
        io.to(data.room).emit('receive_message', data);
    });

    // Handle goal additions/updates
    socket.on('goal_updated', (data) => {
        io.to(data.room).emit('refresh_goals');
    });

    // Handle resource uploads
    socket.on('resource_uploaded', (data) => {
        io.to(data.room).emit('refresh_resources');
    });

    socket.on('disconnect', () => {
        // console.log('User disconnected', socket.id);
    });
});

// MongoDB Connection with retry logic
let dbConnected = false;
const connectWithRetry = (attempts = 0) => {
  const MAX = 10;
  mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
  })
    .then(() => {
      dbConnected = true;
      console.log('✅ Connected to MongoDB Atlas');
    })
    .catch(err => {
      console.error(`❌ MongoDB connection error (attempt ${attempts + 1}/${MAX}): ${err.message}`);
      if (attempts < MAX - 1) {
        console.log(`   Retrying in 5 seconds...`);
        setTimeout(() => connectWithRetry(attempts + 1), 5000);
      } else {
        console.error('   Max retries reached. Please check your MONGODB_URI in server/.env');
        console.error('   👉 Get a fresh connection string from: https://cloud.mongodb.com');
      }
    });
};
connectWithRetry();

app.get('/', (req, res) => {
  res.send('StudySync Backend is running!');
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    server: 'running',
    database: dbConnected ? 'connected' : 'disconnected',
    mongoUri: process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/:\/\/.*@/, '://***@') : 'NOT SET',
  });
});

// Local listener
const PORT = process.env.PORT || 5000;

// In serverless environments like Vercel, .listen() is handled by the platform.
// We only call it if we are running the process directly.
if (import.meta.url === `file://${process.argv[1]}` || process.env.NODE_ENV !== 'production') {
  httpServer.listen(PORT, () => console.log(`🚀 Server and WebSockets running on port ${PORT}`));
}

export default app;
