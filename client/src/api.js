const API = '';

function getToken() { return localStorage.getItem('token'); }

async function request(url, opts = {}) {
  const headers = { ...opts.headers };
  // Solo enviar token si opts.auth es true (para endpoints protegidos)
  if (opts.auth) {
    const token = getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;
  }
  delete opts.auth;
  if (opts.body && typeof opts.body === 'object' && !(opts.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(opts.body);
  }
  const res = await fetch('' + url, { ...opts, headers });
  if (!res.ok) {
    let msg = 'Error ' + res.status;
    try { const e = await res.json(); msg = e.error || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

// ─── Auth ──────────────────────────────────────
export async function login(username, password) {
  const data = await request('/api/auth/login', {
    method: 'POST', body: { username, password }
  });
  localStorage.setItem('token', data.token);
  return data;
}
export function logout() { localStorage.removeItem('token'); }
export function isLoggedIn() { return !!getToken(); }
export async function verifyToken() {
  return request('/api/auth/verify', { auth: true });
}

// ─── Reports (públicos - sin auth) ─────────────
export async function fetchReports(tipo, encontrado, page = 1, limit = 500) {
  const params = new URLSearchParams();
  if (tipo) params.set('tipo', tipo);
  if (encontrado !== undefined) params.set('encontrado', encontrado);
  params.set('page', page);
  params.set('limit', limit);
  return request('/api/reports?' + params);
}

// Endpoint ligero para el mapa (solo lat/lng/tipo)
export async function fetchMapData(tipo) {
  const params = tipo ? '?tipo=' + tipo : '';
  return request('/api/reports/map' + params);
}
export async function createReport(data) {
  return request('/api/reports', { method: 'POST', body: data });
}
export async function fetchStats() { return request('/api/reports/stats'); }
export async function fetchCriticalZones(radius=2, minReports=3, tipo='all') {
  return request('/api/reports/critical-zones?radius='+radius+'&minReports='+minReports+'&tipo='+tipo);
}
export async function searchReports(q) {
  return request('/api/reports/search?q=' + encodeURIComponent(q));
}
export async function fetchFoto(id) {
  if (fetchFoto._cache && fetchFoto._cache[id]) return fetchFoto._cache[id];
  const data = await request('/api/reports/' + id + '/foto');
  if (!fetchFoto._cache) fetchFoto._cache = {};
  fetchFoto._cache[id] = data.foto;
  return data.foto;
}

// ─── Admin (requiere auth) ─────────────────────
export async function updateReport(id, data) {
  return request('/api/reports/' + id, { method: 'PATCH', body: data, auth: true });
}
export async function uploadFoto(id, base64, contentType) {
  return request('/api/reports/' + id + '/foto', { method: 'PATCH', body: { foto: base64, fotoContentType: contentType }, auth: true });
}

// ─── Comunidad (público) ───────────────────────
export async function flagReport(id) {
  return request('/api/reports/' + id + '/flag', { method: 'PATCH' });
}

// ─── Sincronización externa ────────────────────
export async function syncExternal(maxPages = 10) {
  return request('/api/external/sync', { method: 'POST', body: { maxPages }, auth: true });
}
export async function fetchExternalStats() {
  return request('/api/external/stats', { auth: true });
}
export async function fetchExternalCounts() {
  return request('/api/external/counts');
}
