const express = require('express');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const pool = require('./config/database');
const { authenticate } = require('./middleware/auth');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Route modules
const authRoutes = require('./modules/auth/auth.routes');
const mechanicsRoutes = require('./modules/mechanics/mechanics.routes');
const fitmentRoutes = require('./modules/fitment/fitment.routes');
const academyRoutes = require('./modules/academy/academy.routes');
const toolbankRoutes = require('./modules/toolbank/toolbank.routes');
const adminRoutes = require('./modules/admin/admin.routes');

const app = express();

// Ensure evidence upload directory exists privately
const evidenceDir = path.join(__dirname, '../uploads/evidence');
if (!fs.existsSync(evidenceDir)) {
  fs.mkdirSync(evidenceDir, { recursive: true });
}

// Ensure public upload directory exists (for non-sensitive assets like avatars)
const publicUploadsDir = path.join(__dirname, '../uploads/public');
if (!fs.existsSync(publicUploadsDir)) {
  fs.mkdirSync(publicUploadsDir, { recursive: true });
}

// ==========================================
// 1. SECURITY & CORE MIDDLEWARE
// ==========================================
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS Configuration
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS policy: This origin is not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// HTTP Request Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Request Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==========================================
// 2. RATE LIMITING
// ==========================================
// Stricter rate limiting for authentication & OTP operations
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

// General API rate limiting (skips auth routes to prevent double-limiting)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.startsWith('/auth') || req.path.startsWith('/api/auth'),
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
});

app.use('/api', generalLimiter);

// ==========================================
// 3. HEALTH CHECK ENDPOINT
// ==========================================
app.get('/api/health', async (req, res) => {
  const startTime = Date.now();
  let dbStatus = 'disconnected';
  let latencyMs = null;
  let isHealthy = false;

  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    dbStatus = 'connected';
    latencyMs = Date.now() - startTime;
    isHealthy = true;
  } catch (err) {
    dbStatus = 'disconnected';
  }

  const response = {
    success: isHealthy,
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    database: {
      status: dbStatus,
      ...(latencyMs !== null ? { latency_ms: latencyMs } : {}),
    },
  };

  return res.status(isHealthy ? 200 : 503).json(response);
});

// ==========================================
// 4. UPLOADS & FILE ACCESS (PRIVATE VS PUBLIC)
// ==========================================
// Only explicitly non-sensitive assets are served publicly
app.use('/uploads/public', express.static(publicUploadsDir));

// Sensitive evidence files (invoices, customer records) require strict object-level authorization
const serveEvidence = async (req, res, next) => {
  try {
    const safeFilename = path.basename(req.params.filename);
    const filePath = path.join(evidenceDir, safeFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Evidence file not found' });
    }

    // Verify object-level ownership and role-based permissions
    const [evidenceRows] = await pool.query(`
      SELECT fe.*, fr.mechanic_id, mp.user_id as mechanic_user_id, mp.state as mechanic_state
      FROM fitment_evidence fe
      JOIN fitment_records fr ON fe.fitment_id = fr.id
      JOIN mechanic_profiles mp ON fr.mechanic_id = mp.id
      WHERE fe.file_url LIKE ?
    `, [`%${safeFilename}`]);

    if (!evidenceRows.length) {
      if (req.user.role === 'super_admin') {
        return res.sendFile(filePath);
      }
      return res.status(403).json({ success: false, message: 'Access denied to this evidence file.' });
    }

    const doc = evidenceRows[0];
    const user = req.user;

    // 1. Super Admin: full access
    if (user.role === 'super_admin') {
      return res.sendFile(filePath);
    }

    // 2. Mechanic: only own fitment evidence
    if (user.role === 'mechanic') {
      if (doc.mechanic_user_id === user.id) {
        return res.sendFile(filePath);
      }
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to view another mechanic\'s evidence document.',
      });
    }

    // 3. Regional Manager: within assigned region
    if (user.role === 'regional_manager') {
      if (!user.assigned_region || user.assigned_region === doc.mechanic_state) {
        return res.sendFile(filePath);
      }
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Evidence document is outside your assigned region.',
      });
    }

    // 4. Dealer: allowed for assigned dealer operations
    if (user.role === 'dealer') {
      return res.sendFile(filePath);
    }

    return res.status(403).json({ success: false, message: 'Access denied.' });
  } catch (err) {
    next(err);
  }
};

app.get('/uploads/evidence/:filename', authenticate, serveEvidence);
app.get('/api/fitments/evidence/:filename', authenticate, serveEvidence);

// ==========================================
// 5. API ROUTES REGISTRATION
// ==========================================
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/mechanics', mechanicsRoutes);
app.use('/api/fitments', fitmentRoutes);
app.use('/api/academy', academyRoutes);
app.use('/api/toolbank', toolbankRoutes);
app.use('/api/admin', adminRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Eurogrip Ustaad Network Backend API is running',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// ==========================================
// 6. ERROR HANDLING
// ==========================================
app.use(notFound);
app.use(errorHandler);

// ==========================================
// 7. SERVER INITIALIZATION & LIFECYCLE
// ==========================================
const PORT = process.env.PORT || 5000;
let server = null;

async function startServer(port = PORT) {
  try {
    console.log('[Server] Verifying database connectivity...');
    // 1. Establish MySQL database connection
    const connection = await pool.getConnection();
    // 2. Verify database connectivity
    await connection.ping();
    // 3. Release the connection back to the pool
    connection.release();
    console.log(`[Database] Connected successfully to MySQL (${process.env.DB_NAME || 'ustaad_network'})`);

    // 4. Start the Express server
    return new Promise((resolve, reject) => {
      server = app.listen(port, () => {
        console.log(`[Server] Eurogrip Ustaad Network Backend listening on port ${port} [${process.env.NODE_ENV || 'development'}]`);
        resolve(server);
      });

      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.error(`[Server] Port ${port} is already in use by another process.`);
        }
        reject(err);
      });
    });
  } catch (err) {
    console.error('[Database] Failed to connect to MySQL database:', err.message);
    throw err;
  }
}

async function gracefulShutdown(signal) {
  console.log(`\n[Server] Received ${signal}. Closing server and releasing resources...`);
  
  if (server) {
    server.close(async () => {
      console.log('[Server] HTTP server closed.');
      try {
        await pool.end();
        console.log('[Database] MySQL pool closed.');
      } catch (err) {
        console.error('[Database] Error closing MySQL pool:', err.message);
      }
      process.exit(0);
    });

    // Force exit after 10s timeout
    setTimeout(() => {
      console.error('[Server] Forced shutdown after timeout.');
      process.exit(1);
    }, 10000);
  } else {
    try {
      await pool.end();
      console.log('[Database] MySQL pool closed.');
    } catch (err) {
      console.error('[Database] Error closing MySQL pool:', err.message);
    }
    process.exit(0);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught Exception:', err);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Run directly if invoked via CLI
if (require.main === module) {
  startServer().catch((err) => {
    console.error('[Server] Startup failed:', err.message);
    process.exit(1);
  });
}

module.exports = { app, startServer, pool, gracefulShutdown };

