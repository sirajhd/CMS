import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import userRoutes from './routes/userRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import materialRoutes from './routes/materialRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import superAdminRoutes from './routes/superAdminRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for local Vite ports (both 5173 and 5174)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps, curl, postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Dev mode: accept all local dev origins
    }
  },
  credentials: true,
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded documents statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    message: 'CMS Construction Backend API is running successfully',
    timestamp: new Date().toISOString(),
  });
});

// Mount Application Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/users', userRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/superadmin', superAdminRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Start listening and keep reference
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server is actively listening on http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => console.log('Process terminated'));
});
