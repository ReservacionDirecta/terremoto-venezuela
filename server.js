require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const reportsRouter = require('./routes/reports');
const authRouter = require('./routes/auth');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URL || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/terremoto-venezuela';

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// ─── Rutas ─────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/reports', reportsRouter);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    app: 'Terremoto Venezuela',
    version: '3.0.0'
  });
});

// ─── Static (React build) ──────────────────────
const clientBuild = path.join(__dirname, 'client', 'build');
app.use(express.static(clientBuild));
app.get('*', (_req, res) => res.sendFile(path.join(clientBuild, 'index.html')));

// ─── Start ─────────────────────────────────────
mongoose.connect(MONGO_URI).then(async () => {
  console.log('✅ MongoDB conectado');

  // Crear super admin automáticamente si no existe
  const adminUser = process.env.ADMIN_USER || 'admin';
  const adminPass = process.env.ADMIN_PASS || 'terremoto2026';
  await User.createSuperAdmin(adminUser, adminPass);
  console.log(`🔑 Super admin: ${adminUser} / ${adminPass}`);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor en http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('❌ MongoDB:', err.message);
  process.exit(1);
});
