import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';
import { requestId } from './middleware/auditLog';
import { apiRateLimiter, loginRateLimiter } from './middleware/rateLimit';

// Routes
import authRoutes from './routes/authRoutes';
import clientRoutes from './routes/clientRoutes';
import quoteRoutes from './routes/quoteRoutes';
import jobRoutes from './routes/jobRoutes';
import materialRoutes from './routes/materialRoutes';
import checklistRoutes from './routes/checklistRoutes';
import userRoutes from './routes/userRoutes';
import { jobChecklistRouter } from './routes/jobRoutes';
import adminRoutes from './routes/adminRoutes';

dotenv.config();

const app = express();
// Railway usa la variabile PORT automaticamente, ma se non è settata usiamo 3001
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// Request ID middleware (deve essere prima di tutto)
app.use(requestId);

// Rate limiting generale (applicato a tutte le route)
app.use('/api', apiRateLimiter);

// Stripe webhook (deve essere prima di express.json() per ricevere raw body)
app.post('/api/admin/payments/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const { stripeWebhook } = await import('./controllers/paymentController');
  stripeWebhook(req, res);
});

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
app.use('/api/admin', adminRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/checklists', checklistRoutes);
app.use('/api/users', userRoutes);
app.use('/api/job-checklists', jobChecklistRouter);

// Error handler
app.use(errorHandler);

// Gestione errori non catturati
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Upload directory: ${path.resolve(uploadDir)}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
});

