const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateToken, authMiddleware } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }
    const user = await User.findOne({ username: username.trim() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    res.json({ token: generateToken(user), role: user.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/verify — verificar token
router.get('/verify', authMiddleware, (req, res) => {
  res.json({ valid: true, role: req.user.role });
});

module.exports = router;
