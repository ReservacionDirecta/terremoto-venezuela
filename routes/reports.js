const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const { authMiddleware } = require('../middleware/auth');

// ─── Helpers ────────────────────────────────────
const VALID_TIPOS = ['sobreviviente', 'desaparecido', 'mascota'];
const VALID_STATUS = ['pendiente', 'en_proceso', 'atendido', 'localizado'];
const VALID_SEVERITY = ['alta', 'media', 'baja'];

// Rate limiter simple en memoria (máx 5 reportes por IP por minuto)
const rateLimit = new Map();
function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimit.get(ip) || { count: 0, reset: now + 60000 };
  if (now > entry.reset) { entry.count = 1; entry.reset = now + 60000; }
  else { entry.count++; }
  rateLimit.set(ip, entry);
  return entry.count <= 5;
}

// Sanitizar texto: sin HTML, sin caracteres de control
function sanitize(str, maxLen = 500) {
  if (!str) return '';
  return str
    .replace(/<[^>]*>/g, '')       // quitar HTML
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // quitar control chars
    .trim()
    .slice(0, maxLen);
}

// Verificar duplicados (mismo nombre + <500m distancia, últimas 24h)
async function findDuplicate(tipo, nombre, lng, lat) {
  if (!nombre || tipo !== 'desaparecido') return null;
  const since = new Date(Date.now() - 86400000);
  const candidates = await Report.find({
    tipo: 'desaparecido',
    nombre: { $regex: new RegExp('^' + nombre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 30), 'i') },
    reportedAt: { $gte: since }
  }).lean();
  for (const c of candidates) {
    const dist = haversine(lat, lng, c.location.coordinates[1], c.location.coordinates[0]);
    if (dist < 0.5) return c; // <500m = duplicado
  }
  return null;
}

function parseLatLng(lat, lng) {
  const pLat = parseFloat(lat);
  const pLng = parseFloat(lng);
  if (isNaN(pLat) || isNaN(pLng)) return null;
  if (pLat < -90 || pLat > 90 || pLng < -180 || pLng > 180) return null;
  return { lat: pLat, lng: pLng };
}

function formatReport(r, includeFoto = false) {
  const out = {
    _id: r._id,
    tipo: r.tipo,
    lat: Number(r.location.coordinates[1]),
    lng: Number(r.location.coordinates[0]),
    nombre: r.nombre || '',
    edad: r.edad != null ? Number(r.edad) : null,
    ultimaUbicacion: r.ultimaUbicacion || '',
    description: r.description || '',
    survivorsCount: r.survivorsCount != null ? Number(r.survivorsCount) : null,
    severity: r.severity || null,
    contactoReportante: r.contactoReportante || '',
    telefonoReportante: r.telefonoReportante || '',
    status: r.status || 'pendiente',
    encontrado: Boolean(r.encontrado),
    fechaEncontrado: r.fechaEncontrado ? r.fechaEncontrado.toISOString() : null,
    fotoContentType: r.fotoContentType || null,
    hasFoto: Boolean(r.foto),
    flags: Number(r.flags) || 0,
    source: r.source || 'app',
    fotoExterna: r.fotoExterna || null,
    reportedAt: r.reportedAt ? r.reportedAt.toISOString() : null
  };
  if (includeFoto) out.foto = r.foto || null;
  return out;
}

// ═══════════════════════════════════════════════
// POST /api/reports — crear reporte
// ═══════════════════════════════════════════════
router.post('/', async (req, res) => {
  try {
    const { tipo, lat, lng, nombre, edad, ultimaUbicacion, description,
            survivorsCount, severity, contactoReportante, telefonoReportante,
            foto, fotoContentType } = req.body;

    // Validaciones
    if (!tipo || !VALID_TIPOS.includes(tipo)) {
      return res.status(400).json({ error: 'tipo requerido: sobreviviente | desaparecido' });
    }
    const coords = parseLatLng(lat, lng);
    if (!coords) {
      return res.status(400).json({ error: 'lat y lng inválidos (lat: -90..90, lng: -180..180)' });
    }
    if (tipo === 'desaparecido' && !nombre?.trim()) {
      return res.status(400).json({ error: 'nombre requerido para reportar desaparecido' });
    }
    if (tipo === 'mascota' && !description?.trim() && !nombre?.trim()) {
      return res.status(400).json({ error: 'nombre o descripción requerida para reportar mascota' });
    }
    if (tipo === 'sobreviviente') {
      if (!description?.trim() || survivorsCount == null) {
        return res.status(400).json({ error: 'description y survivorsCount requeridos para sobreviviente' });
      }
      if (parseInt(survivorsCount) < 1 || parseInt(survivorsCount) > 999) {
        return res.status(400).json({ error: 'survivorsCount debe ser 1-999' });
      }
    }

    const edadParsed = edad != null ? parseInt(edad) : undefined;
    if (edadParsed !== undefined && (isNaN(edadParsed) || edadParsed < 0 || edadParsed > 120)) {
      return res.status(400).json({ error: 'edad inválida (0-120)' });
    }

    if (foto && foto.length > 700000) {
      return res.status(400).json({ error: 'La foto es demasiado grande. Máximo ~500KB.' });
    }

    // Rate limiting
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    if (!checkRateLimit(ip)) {
      return res.status(429).json({ error: 'Demasiados reportes. Espera un minuto.' });
    }

    // Detección de duplicados (solo para desaparecidos con nombre)
    if (tipo === 'desaparecido' && nombre?.trim()) {
      const dup = await findDuplicate(tipo, nombre.trim(), coords.lng, coords.lat);
      if (dup) {
        return res.status(409).json({
          error: 'Posible duplicado: ya existe un reporte similar para esta persona en esta zona.',
          duplicateId: dup._id
        });
      }
    }

    // Sanitizar todos los campos de texto
    const doc = {
      tipo,
      location: { type: 'Point', coordinates: [coords.lng, coords.lat] },
      nombre: sanitize(nombre, 200),
      edad: edadParsed,
      ultimaUbicacion: sanitize(ultimaUbicacion, 500),
      description: sanitize(description, 500),
      survivorsCount: tipo === 'sobreviviente' ? parseInt(survivorsCount) : undefined,
      severity: tipo === 'sobreviviente'
        ? (VALID_SEVERITY.includes(severity) ? severity : 'alta')
        : undefined,
      contactoReportante: sanitize(contactoReportante, 200),
      telefonoReportante: sanitize(telefonoReportante, 50),
      foto: foto || undefined,
      fotoContentType: fotoContentType || undefined,
      status: req.body.encontrado ? 'localizado' : 'pendiente',
      encontrado: Boolean(req.body.encontrado),
      flags: 0
    };

    const report = await Report.create(doc);
    res.status(201).json(formatReport(report, true));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════
// GET /api/reports — listado (SIN fotos — performance)
// ═══════════════════════════════════════════════
router.get('/', async (req, res) => {
  try {
    const { tipo, encontrado } = req.query;
    const filter = {};
    if (tipo && VALID_TIPOS.includes(tipo)) filter.tipo = tipo;
    if (encontrado === 'true') filter.encontrado = true;
    if (encontrado === 'false') filter.encontrado = false;

    const reports = await Report.find(filter)
      .select('-foto -fotoContentType')
      .sort({ reportedAt: -1 })
      .lean();

    res.json(reports.map(r => formatReport(r, false)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════
// GET /api/reports/:id/foto — obtener solo la foto (lazy load)
// ═══════════════════════════════════════════════
router.get('/:id/foto', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .select('foto fotoContentType')
      .lean();

    if (!report) return res.status(404).json({ error: 'No encontrado' });
    if (!report.foto) return res.status(404).json({ error: 'Sin foto' });

    res.json({
      _id: report._id,
      foto: report.foto,
      fotoContentType: report.fotoContentType || 'image/jpeg'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════
// GET /api/reports/stats — estadísticas
// ═══════════════════════════════════════════════
router.get('/stats', async (req, res) => {
  try {
    const [total, sobrevivientes, desaparecidos, encontrados, noEncontrados, mascotasTotal, mascotasEncontradas] = await Promise.all([
      Report.countDocuments(),
      Report.countDocuments({ tipo: 'sobreviviente' }),
      Report.countDocuments({ tipo: 'desaparecido' }),
      Report.countDocuments({ tipo: 'desaparecido', encontrado: true }),
      Report.countDocuments({ tipo: 'desaparecido', encontrado: false }),
      Report.countDocuments({ tipo: 'mascota' }),
      Report.countDocuments({ tipo: 'mascota', encontrado: true })
    ]);

    const sevCounts = await Report.aggregate([
      { $match: { tipo: 'sobreviviente' } },
      { $group: { _id: '$severity', count: { $sum: 1 }, totalSurvivors: { $sum: '$survivorsCount' } } }
    ]);

    const porUbicacion = await Report.aggregate([
      { $match: { tipo: 'desaparecido', ultimaUbicacion: { $ne: '' } } },
      { $group: { _id: '$ultimaUbicacion', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      total: Number(total),
      sobrevivientes: Number(sobrevivientes),
      desaparecidos: Number(desaparecidos),
      encontrados: Number(encontrados),
      noEncontrados: Number(noEncontrados),
      mascotasTotal: Number(mascotasTotal),
      mascotasEncontradas: Number(mascotasEncontradas),
      severidad: sevCounts.map(s => ({
        _id: s._id,
        count: Number(s.count),
        totalSurvivors: Number(s.totalSurvivors)
      })),
      porUbicacion: porUbicacion.map(e => ({ _id: e._id, count: Number(e.count) }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════
// GET /api/reports/critical-zones — zonas críticas
// ═══════════════════════════════════════════════
router.get('/critical-zones', async (req, res) => {
  try {
    const radiusKm = Math.min(Math.max(parseFloat(req.query.radius) || 2, 0.5), 10);
    const minReports = Math.min(Math.max(parseInt(req.query.minReports) || 3, 2), 20);
    const tipo = req.query.tipo || 'all';

    const filter = {};
    if (tipo !== 'all' && VALID_TIPOS.includes(tipo)) filter.tipo = tipo;

    // Excluir foto del algoritmo — solo necesitamos ubicación y conteos
    const reports = await Report.find(filter)
      .select('-foto -fotoContentType')
      .lean();

    if (reports.length === 0) {
      return res.json({ zones: [], total: 0, radiusKm, minReports });
    }

    const zones = findDensityClusters(reports, radiusKm, minReports);

    res.json({ zones, total: reports.length, radiusKm, minReports });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════
// PATCH /api/reports/:id — actualizar estado
// ═══════════════════════════════════════════════
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { status, encontrado } = req.body;
    const update = {};

    if (status && VALID_STATUS.includes(status)) update.status = status;
    if (encontrado === true || encontrado === false) {
      update.encontrado = encontrado;
      update.fechaEncontrado = encontrado ? new Date() : null;
      if (encontrado) update.status = 'localizado';
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: 'Nada que actualizar' });
    }

    const report = await Report.findByIdAndUpdate(req.params.id, update, { new: true })
      .select('-foto -fotoContentType');

    if (!report) return res.status(404).json({ error: 'No encontrado' });
    res.json(formatReport(report, false));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════
// PATCH /api/reports/:id/foto — actualizar foto
// ═══════════════════════════════════════════════
router.patch('/:id/foto', authMiddleware, async (req, res) => {
  try {
    const { foto, fotoContentType } = req.body;
    if (!foto) return res.status(400).json({ error: 'foto requerida (base64)' });
    if (foto.length > 700000) return res.status(400).json({ error: 'Foto demasiado grande. Máx ~500KB.' });

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { foto, fotoContentType: fotoContentType || 'image/jpeg' },
      { new: true }
    );
    if (!report) return res.status(404).json({ error: 'No encontrado' });
    res.json(formatReport(report, true));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════
// PATCH /api/reports/:id/flag — reportar error/abuso (público)
// ═══════════════════════════════════════════════
router.patch('/:id/flag', async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { $inc: { flags: 1 } },
      { new: true }
    ).select('-foto -fotoContentType');
    if (!report) return res.status(404).json({ error: 'No encontrado' });
    res.json({ _id: report._id, flags: report.flags });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════
// GET /api/reports/search?q= — búsqueda full-text (sin fotos)
// ═══════════════════════════════════════════════
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q?.trim()) return res.status(400).json({ error: 'Parámetro q requerido' });

    const regex = new RegExp(q.trim(), 'i');
    const reports = await Report.find({
      $or: [
        { nombre: regex },
        { identificacion: regex },
        { ultimaUbicacion: regex },
        { description: regex },
        { telefonoReportante: regex },
        { contactoReportante: regex }
      ]
    })
    .select('-foto -fotoContentType')
    .sort({ reportedAt: -1 })
    .limit(50)
    .lean();

    res.json(reports.map(r => formatReport(r, false)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Algoritmo de Densidad ──────────────────────

function findDensityClusters(reports, radiusKm, minReports) {
  const clusters = [];
  const visited = new Set();
  const totalReports = reports.length;

  // Pre-computar coordenadas para evitar acceso repetido a location.coordinates
  const coords = reports.map(r => ({
    lng: Number(r.location.coordinates[0]),
    lat: Number(r.location.coordinates[1])
  }));

  for (let i = 0; i < reports.length; i++) {
    if (visited.has(i)) continue;

    const center = coords[i];
    const neighborhood = [];

    for (let j = 0; j < reports.length; j++) {
      if (visited.has(j)) continue;
      if (haversine(center.lat, center.lng, coords[j].lat, coords[j].lng) <= radiusKm) {
        neighborhood.push(j);
      }
    }

    if (neighborhood.length >= minReports) {
      const zoneReports = neighborhood.map(idx => reports[idx]);
      const centroid = computeCentroid(zoneReports);

      const sobrevivientes = zoneReports.filter(r => r.tipo === 'sobreviviente');
      const desaparecidos = zoneReports.filter(r => r.tipo === 'desaparecido');
      const totalSurvivors = sobrevivientes.reduce((s, r) => s + (Number(r.survivorsCount) || 0), 0);
      const highSev = sobrevivientes.filter(r => r.severity === 'alta').length;

      const densityPct = (neighborhood.length / totalReports) * 35;
      const survivorPct = totalSurvivors > 0 ? (totalSurvivors / (totalSurvivors + 1)) * 25 : 0;
      const missingPct = desaparecidos.length > 0 ? (desaparecidos.length / neighborhood.length) * 20 : 0;
      const sevPct = neighborhood.length > 0 ? (highSev / neighborhood.length) * 20 : 0;

      const score = Math.min(100, Math.round(densityPct + survivorPct + missingPct + sevPct));

      clusters.push({
        center: { lat: centroid.lat, lng: centroid.lng },
        reportCount: neighborhood.length,
        sobrevivientes: sobrevivientes.length,
        desaparecidos: desaparecidos.length,
        totalSurvivors,
        radiusKm,
        score,
        severity: score >= 70 ? 'crítica' : score >= 40 ? 'alta' : 'media',
        reports: zoneReports.slice(0, 20).map(r => ({
          _id: r._id,
          tipo: r.tipo,
          lat: Number(r.location.coordinates[1]),
          lng: Number(r.location.coordinates[0]),
          nombre: r.nombre || '',
          survivorsCount: Number(r.survivorsCount) || 0,
          description: (r.description || '').slice(0, 100),
          encontrado: Boolean(r.encontrado)
        }))
      });

      neighborhood.forEach(idx => visited.add(idx));
    } else {
      visited.add(i);
    }
  }

  return clusters.sort((a, b) => b.score - a.score);
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) { return (deg * Math.PI) / 180; }

function computeCentroid(reports) {
  const sum = reports.reduce((acc, r) => {
    acc.lat += Number(r.location.coordinates[1]);
    acc.lng += Number(r.location.coordinates[0]);
    return acc;
  }, { lat: 0, lng: 0 });
  return {
    lat: Math.round((sum.lat / reports.length) * 100000) / 100000,
    lng: Math.round((sum.lng / reports.length) * 100000) / 100000
  };
}

module.exports = router;
