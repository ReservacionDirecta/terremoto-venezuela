const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');

// ─── CRUD ───────────────────────────────────────────

// POST /api/alerts — crear una alerta
router.post('/', async (req, res) => {
  try {
    const { lat, lng, description, survivorsCount, severity, contactInfo } = req.body;

    if (!lat || !lng || !description || !survivorsCount) {
      return res.status(400).json({ error: 'Faltan campos: lat, lng, description, survivorsCount' });
    }

    const alert = await Alert.create({
      location: {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)]
      },
      description: description.trim(),
      survivorsCount: parseInt(survivorsCount),
      severity: severity || 'alta',
      contactInfo: contactInfo?.trim() || ''
    });

    res.status(201).json(alert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/alerts — todas las alertas (para el heatmap)
router.get('/', async (req, res) => {
  try {
    const alerts = await Alert.find()
      .sort({ reportedAt: -1 })
      .lean();

    // Formato amigable para el frontend
    const formatted = alerts.map(a => ({
      _id: a._id,
      lat: a.location.coordinates[1],
      lng: a.location.coordinates[0],
      description: a.description,
      survivorsCount: a.survivorsCount,
      severity: a.severity,
      contactInfo: a.contactInfo,
      status: a.status,
      reportedAt: a.reportedAt
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/alerts/critical-zones — zonas críticas con algoritmo de densidad
router.get('/critical-zones', async (req, res) => {
  try {
    const radiusKm = parseFloat(req.query.radius) || 1;       // radio en km
    const minAlerts = parseInt(req.query.minAlerts) || 3;     // mínimo de alertas para ser "zona crítica"

    const alerts = await Alert.find().lean();

    if (alerts.length === 0) {
      return res.json({ zones: [], totalAlerts: 0 });
    }

    // Algoritmo de clustering por densidad (DBSCAN simplificado)
    const zones = findDensityClusters(alerts, radiusKm, minAlerts);

    res.json({
      zones,
      totalAlerts: alerts.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/alerts/:id — actualizar estado de una alerta
router.patch('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pendiente', 'en_proceso', 'atendido'].includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!alert) return res.status(404).json({ error: 'Alerta no encontrada' });
    res.json(alert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Algoritmo de densidad ──────────────────────────

/**
 * Agrupa alertas por densidad geográfica.
 * Usa un enfoque de "sliding window" sobre una grilla adaptativa.
 */
function findDensityClusters(alerts, radiusKm, minAlerts) {
  const clusters = [];
  const visited = new Set();

  // Conversión aproximada: 1° ≈ 111.32 km
  const radiusDeg = radiusKm / 111.32;

  for (let i = 0; i < alerts.length; i++) {
    if (visited.has(i)) continue;

    const center = alerts[i].location.coordinates;
    const neighborhood = [];

    // Encontrar todos los puntos dentro del radio
    for (let j = 0; j < alerts.length; j++) {
      if (visited.has(j)) continue;
      const point = alerts[j].location.coordinates;
      const dist = haversine(
        center[1], center[0],
        point[1], point[0]
      );
      if (dist <= radiusKm) {
        neighborhood.push(j);
      }
    }

    // Si hay suficientes alertas, es un cluster
    if (neighborhood.length >= minAlerts) {
      const zoneAlerts = neighborhood.map(idx => alerts[idx]);
      const centroid = computeCentroid(zoneAlerts);

      // Calcular score de criticidad (0-100)
      const totalSurvivors = zoneAlerts.reduce((s, a) => s + a.survivorsCount, 0);
      const highSeverity = zoneAlerts.filter(a => a.severity === 'alta').length;
      const score = Math.min(100, Math.round(
        (neighborhood.length / Math.max(alerts.length, 1)) * 40 +
        (totalSurvivors / Math.max(totalSurvivors, 1)) * 30 +
        (highSeverity / Math.max(neighborhood.length, 1)) * 30
      ));

      clusters.push({
        center: { lat: centroid.lat, lng: centroid.lng },
        alertCount: neighborhood.length,
        totalSurvivors,
        radiusKm,
        score,
        severity: score >= 70 ? 'crítica' : score >= 40 ? 'alta' : 'media',
        alerts: zoneAlerts.map(a => ({
          _id: a._id,
          lat: a.location.coordinates[1],
          lng: a.location.coordinates[0],
          survivorsCount: a.survivorsCount,
          description: a.description
        }))
      });

      // Marcar todos como visitados
      neighborhood.forEach(idx => visited.add(idx));
    } else {
      visited.add(i);
    }
  }

  // Ordenar por score descendente
  clusters.sort((a, b) => b.score - a.score);

  return clusters;
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function computeCentroid(alerts) {
  const sum = alerts.reduce(
    (acc, a) => {
      acc.lat += a.location.coordinates[1];
      acc.lng += a.location.coordinates[0];
      return acc;
    },
    { lat: 0, lng: 0 }
  );
  return {
    lat: sum.lat / alerts.length,
    lng: sum.lng / alerts.length
  };
}

module.exports = router;
