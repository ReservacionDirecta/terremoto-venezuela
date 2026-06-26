const express = require('express');
const router = express.Router();
const https = require('https');
const Report = require('../models/Report');
const { authMiddleware } = require('../middleware/auth');
const { geocode } = require('../utils/geocode');

const API_BASE = 'https://desaparecidos-terremoto-api.theempire.tech';

// ─── Anti-spam filter ──────────────────────────
const SPAM_PATTERNS = [
  /infinityhotel/i,
  /TRUSTED/i,
  /\.it\b/i,
  /https?:\/\//i,        // URLs en nombres
  /crypto/i,
  /bitcoin/i,
  /casino/i,
  /\.com\b/i,
  /\.net\b/i,
];

function isSpam(persona) {
  const name = persona.nombre || '';
  const desc = persona.descripcion || '';
  const contact = persona.contacto || '';
  const combined = `${name} ${desc} ${contact}`;
  return SPAM_PATTERNS.some(p => p.test(combined));
}

// ─── Fetch from external API ───────────────────
function fetchPage(page) {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE}/api/personas?page=${page}&pageSize=50`;
    https.get(url, { timeout: 15000 }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

// ─── POST /api/external/sync ───────────────────
router.post('/sync', authMiddleware, async (req, res) => {
  try {
    const maxPages = Math.min(parseInt(req.body.maxPages) || 10, 50);
    let imported = 0;
    let skipped = 0;
    let spam = 0;
    let noGeo = 0;

    for (let page = 1; page <= maxPages; page++) {
      console.log(`📥 Sincronizando página ${page}/${maxPages}...`);

      let data;
      try { data = await fetchPage(page); }
      catch (err) { console.error(`Error página ${page}:`, err.message); break; }

      if (!data || !data.items) break;

      for (const p of data.items) {
        // Filtrar spam
        if (isSpam(p)) { spam++; continue; }

        // ¿Ya existe?
        const exists = await Report.findOne({ externalId: p.id });
        if (exists) { skipped++; continue; }

        // Geocodificar
        const coords = await geocode(p.ubicacion);
        if (!coords) { noGeo++; continue; }

        try {
          await Report.create({
            tipo: 'desaparecido',
            source: 'external',
            externalId: p.id,
            location: { type: 'Point', coordinates: [coords[1], coords[0]] },
            nombre: p.nombre?.trim().slice(0, 200) || '',
            edad: p.edad || undefined,
            ultimaUbicacion: p.ubicacion?.trim().slice(0, 500) || '',
            description: p.descripcion?.trim().slice(0, 500) || '',
            contactoReportante: p.contacto?.trim().slice(0, 200) || '',
            status: p.estado === 'localizado' ? 'localizado' : 'pendiente',
            encontrado: p.estado === 'localizado',
            fechaEncontrado: p.estado === 'localizado' ? new Date(p.updatedAt) : null,
            reportedAt: new Date(p.createdAt),
            flags: 0,
          });
          imported++;
        } catch (err) {
          console.error('Error insertando:', err.message);
        }
      }

      // Esperar 1s entre páginas (respetar rate limit)
      if (page < maxPages) await new Promise(r => setTimeout(r, 1000));
    }

    res.json({
      success: true,
      imported,
      skipped,
      spam,
      noGeo,
      total: imported + skipped + spam + noGeo,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/external/stats ───────────────────
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const [total, encontrados, noEncontrados] = await Promise.all([
      Report.countDocuments({ source: 'external' }),
      Report.countDocuments({ source: 'external', encontrado: true }),
      Report.countDocuments({ source: 'external', encontrado: false }),
    ]);
    res.json({ total, encontrados, noEncontrados });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/external/counts (público) ────────
router.get('/counts', async (req, res) => {
  try {
    const data = await fetchPage(1);
    res.json({
      total: data.total,
      sinContacto: data.counts?.sinContacto,
      localizado: data.counts?.localizado,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
