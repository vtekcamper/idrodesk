import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';

// Routes
import authRoutes from './routes/authRoutes';
import clientRoutes from './routes/clientRoutes';
import quoteRoutes from './routes/quoteRoutes';
import jobRoutes from './routes/jobRoutes';
import materialRoutes from './routes/materialRoutes';
import checklistRoutes from './routes/checklistRoutes';
import userRoutes from './routes/userRoutes';
import { jobChecklistRouter } from './routes/jobRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
const uploadDir = process.env.UPLOAD_DIR || './uploads';
app.use('/uploads', express.static(path.resolve(uploadDir)));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/checklists', checklistRoutes);
app.use('/api/users', userRoutes);
app.use('/api/job-checklists', jobChecklistRouter);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Upload directory: ${path.resolve(uploadDir)}`);
});

