import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables FIRST
// Check for --mode argument or default to 'dev'
const modeArgIndex = process.argv.findIndex(arg => arg === '--mode');
const mode = modeArgIndex !== -1 ? process.argv[modeArgIndex + 1] : process.argv[2] || 'dev';
const envFile = `.env.${mode}`;
const envPath = path.join(__dirname, '..', envFile);

console.log(`🔧 Loading environment from: ${envFile}`);
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.warn(`⚠️  Could not load ${envFile}, trying .env as fallback`);
  dotenv.config({ path: path.join(__dirname, '../.env') });
} else {
  console.log(`✅ Environment loaded successfully from ${envFile}`);
}

import { connectDB } from '@/config/database';
import { errorHandler } from '@/middleware/errorHandler';
import authRoutes from '@/routes/auth';
import userRoutes from '@/routes/users';
import productRoutes from '@/routes/products';
import chatRoutes from '@/routes/chat';
import adminRoutes from '@/routes/admin';
import recordsRoutes from '@/routes/records';
import fileRoutes from '@/routes/file';

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(helmet());
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3050')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      // Allow non-browser or same-origin requests
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true
}));
// Lightweight request logger for debugging (toggle with DEBUG_REQUESTS=1)
app.use((req, _res, next) => {
  if (process.env.DEBUG_REQUESTS === '1') {
    console.log(`[req] ${req.method} ${req.originalUrl}`);
  }
  next();
});
app.use(compression());
app.use(morgan('combined'));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Additional verbose logging including request body (post-parsing)
morgan.token('body', (req) => {
  try { return JSON.stringify((req as any).body); } catch { return '[unserializable]'; }
});
app.use(morgan(':method :url :status :res[content-length] - :response-time ms ip=:remote-addr ua=":user-agent" body=:body'));

// Log all /api traffic explicitly
app.use('/api', (req, _res, next) => {
  console.log(`[api] ${req.method} ${req.originalUrl} ip=${req.ip} cl=${req.headers['content-length'] || 0}`);
  next();
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Campus Marketplace API is running',
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint to list registered routes
app.get('/api/_debug/routes', (_req, res) => {
  const routes: any[] = [];
  const stack = (app as any)._router?.stack || [];
  stack.forEach((layer: any) => {
    if (layer.route && layer.route.path) {
      const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase());
      routes.push({ base: '', path: layer.route.path, methods });
    } else if (layer.name === 'router' && layer.handle?.stack) {
      const baseMatch = layer.regexp && layer.regexp.toString();
      const base = baseMatch || '';
      layer.handle.stack.forEach((sub: any) => {
        if (sub.route && sub.route.path) {
          const methods = Object.keys(sub.route.methods).map((m: string) => m.toUpperCase());
          routes.push({ base, path: sub.route.path, methods });
        }
      });
    }
  });
  res.json({ success: true, routes });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/records', recordsRoutes);
app.use('/api/file', fileRoutes);


// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  console.warn(`404 ${req.method} ${req.originalUrl} ip=${req.ip}`);
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📚 Campus Marketplace API ready at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;

