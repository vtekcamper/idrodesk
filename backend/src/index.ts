import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';
import { requestId } from './middleware/auditLog';
import { apiRateLimiter, loginRateLimiter } from './middleware/rateLimit';
import { logger } from './utils/logger';
import { requestLogger } from './middleware/requestLogger';

// Avvia workers (solo se non in test mode)
if (process.env.NODE_ENV !== 'test' && process.env.SKIP_WORKERS !== 'true') {
  // Email worker
  import('./workers/emailWorker').then(() => {
    logger.info('Email worker started');
  }).catch((error) => {
    logger.error('Error starting email worker', { error: error.message });
    if (error.message?.includes('ECONNREFUSED')) {
      logger.warn('Redis not available, email worker disabled');
    }
  });

  // Data export worker
  import('./workers/dataExportWorker').then(() => {
    logger.info('Data export worker started');
  }).catch((error) => {
    logger.error('Error starting data export worker', { error: error.message });
    if (error.message?.includes('ECONNREFUSED')) {
      logger.warn('Redis not available, data export worker disabled');
    }
  });
}

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
import companyRoutes from './routes/companyRoutes';

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

// Request logger (dopo requestId per avere requestId nei log)
app.use(requestLogger);

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

// Health check avanzato
app.get('/health', async (req, res) => {
  const health: any = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
  };

  try {
    // Verifica database
    const prisma = (await import('./config/database')).default;
    await prisma.$queryRaw`SELECT 1`;
    health.database = 'connected';

    // Verifica Redis (opzionale)
    try {
      const { getRedisClient } = await import('./config/redis');
      const redis = getRedisClient();
      await redis.ping();
      health.redis = 'connected';
    } catch (redisError) {
      health.redis = 'disconnected';
      health.warnings = health.warnings || [];
      health.warnings.push('Redis not available (workers disabled)');
    }

    res.json(health);
  } catch (error: any) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Service unavailable',
      database: 'disconnected',
    });
  }
});

// Monitoring hook (per servizi esterni come UptimeRobot)
app.get('/monitoring', async (req, res) => {
  try {
    const prisma = (await import('./config/database')).default;
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'healthy' });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy' });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/checklists', checklistRoutes);
app.use('/api/users', userRoutes);
app.use('/api/job-checklists', jobChecklistRouter);

// Error handler
app.use(errorHandler);

// Gestione errori non catturati (logger li gestisce già, ma aggiungiamo log)
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

app.listen(PORT, () => {
  logger.info('Server started', {
    port: PORT,
    uploadDir: path.resolve(uploadDir),
    environment: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  });
});

