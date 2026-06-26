require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const mongoose = require('mongoose');
const path = require('path');

const reportsRouter = require('./routes/reports');
const authRouter = require('./routes/auth');
const externalRouter = require('./routes/external');
const User = require('./models/User');
const cron = require('node-cron');
const { syncExternal } = require('./services/syncCron');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URL || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/terremoto-venezuela';

// ─── Performance Middleware ─────────────────────
app.use(compression({ level: 6, threshold: 500 })); // gzip/brotli
app.use(cors({ maxAge: 86400 })); // cache CORS preflight 24h
app.use(express.json({ limit: '2mb' }));

// Cache static assets aggressively (1 año, tienen hash en filename)
app.use(express.static(path.join(__dirname, 'client', 'build'), {
  maxAge: '365d',
  immutable: true,
  setHeaders: (res, p) => {
    if (p.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
  }
}));

// ─── Response time header ──────────────────────
app.use((_req, res, next) => {
  const start = Date.now();
  const originalSend = res.json;
  res.json = function (body) {
    res.setHeader('X-Response-Time', (Date.now() - start) + 'ms');
    return originalSend.call(this, body);
  };
  next();
});

// ─── API Rate Limiter (en memoria, por IP) ─────
const rateStore = new Map();
setInterval(() => rateStore.clear(), 60000); // limpiar cada minuto

function rateLimit(maxReq = 60) {
  return (req, res, next) => {
    const ip = req.ip || req.connection?.remoteAddress || 'x';
    const entry = rateStore.get(ip) || { count: 0, reset: Date.now() + 60000 };
    if (Date.now() > entry.reset) { entry.count = 1; entry.reset = Date.now() + 60000; }
    else { entry.count++; }
    rateStore.set(ip, entry);
    if (entry.count > maxReq) {
      return res.status(429).json({ error: 'Demasiadas peticiones. Espera un momento.' });
    }
    res.setHeader('X-RateLimit-Remaining', maxReq - entry.count);
    next();
  };
}

// ─── Rutas ─────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/reports', rateLimit(120), reportsRouter);      // 120 req/min para GET públicos
app.use('/api/external', externalRouter);

// Health check con métricas básicas
app.get('/api/health', (_req, res) => {
  const mem = process.memoryUsage();
  res.setHeader('Cache-Control', 'no-cache');
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: Math.round(process.uptime()),
    memory: Math.round(mem.heapUsed / 1024 / 1024) + 'MB',
    version: '4.0.0'
  });
});

// ─── Static (React SPA) ────────────────────────
const clientBuild = path.join(__dirname, 'client', 'build');
app.get('*', (_req, res) => res.sendFile(path.join(clientBuild, 'index.html')));

// ─── MongoDB Connection Pool ───────────────────
const mongoOpts = {
  maxPoolSize: 20,        // 20 conexiones en pool
  minPoolSize: 5,         // mantener 5 calientes
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 5000,
  socketTimeoutMS: 30000,
};

// ─── Start ─────────────────────────────────────
mongoose.connect(MONGO_URI, mongoOpts).then(async () => {
  console.log('✅ MongoDB conectado (pool: 5-20)');
  const adminUser = process.env.ADMIN_USER || 'admin';
  const adminPass = process.env.ADMIN_PASS || 'terremoto2026';
  await User.createSuperAdmin(adminUser, adminPass);
  console.log(`🔑 Admin: ${adminUser} / ${adminPass}`);
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor optimizado en http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('❌ MongoDB:', err.message);
  process.exit(1);
});
