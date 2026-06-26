# 🇻🇪 Hallados — Registro de Desaparecidos y Sobrevivientes · Terremoto Venezuela

> **Doble terremoto 7.2 + 7.5 Mw — 24 de Junio de 2026**
> Epicentro: Yaracuy/Carabobo · +188 fallecidos · +1,500 heridos · +41,000 desaparecidos

**hallados.org** es una herramienta ciudadana, gratuita y de código abierto para la búsqueda y localización de personas tras el terremoto en Venezuela. Combina datos propios con la API pública de [desaparecidosterremotovenezuela.com](https://desaparecidosterremotovenezuela.com/).

---

## 🎯 ¿Qué hace?

| Funcionalidad | Descripción |
|---|---|
| 🔥 **Mapa de calor** | Visualización geoespacial de 28,000+ reportes con heatmap Leaflet |
| 🔍 **Registro de desaparecidos** | Búsqueda, fotos, marcado comunitario de localizados |
| 🆘 **Sobrevivientes atrapados** | Reportes de rescate con estados (pendiente → en proceso → atendido) |
| 🎯 **Zonas críticas** | Algoritmo de densidad geográfica con score de criticidad |
| 📊 **Estadísticas** | KPIs en tiempo real, gráficos de severidad, distribución por zona |
| 📞 **Guía de emergencia** | Números reales de Aeroambulancias, Rescarven, ambulancias |
| 📖 **Guía de uso** | 8 pasos para familiares, rescatistas y voluntarios |
| 🚩 **Moderación comunitaria** | Cualquier persona puede reportar errores en registros |
| 🔒 **Panel admin** | Dashboard protegido con JWT para gestión avanzada |

---

## ⚡ Stack técnico

| Capa | Tecnología |
|---|---|
| Frontend | React 18 · Leaflet · leaflet.heat · CSS Design System v5 |
| Backend | Node.js · Express · compresión gzip/brotli · ETag cache |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Base de datos | MongoDB · GeoJSON 2dsphere · Connection pooling 5-20 |
| Sincronización | Cron automático cada 3 horas (node-cron) |
| Despliegue | Railway · halladosorg.up.railway.app |

---

## 📊 Datos

| Métrica | Valor |
|---|---|
| **Total registros** | 28,314 |
| Externos (API desaparecidos) | 28,298 |
| Locales (reportes propios) | 16 |
| Con fotos | 23,567 (83%) |
| Con contacto del familiar | ~25,000 (89%) |
| Spam bloqueado | 3,214 |
| Cobertura temporal | 24 jun → 25 jun 2026 (hora exacta) |
| Sincronización | Cada 3 horas (automático) |

---

## 🌐 Acceso

| URL | Contenido |
|---|---|
| `halladosorg.up.railway.app` | App pública — mapa, listas, reportes, guía |
| `halladosorg.up.railway.app#admin` | Panel de administración |
| Admin credentials | `admin` / `terremoto2026` |

Todo es público sin necesidad de registro. Solo el panel `#admin` requiere autenticación.

---

## 🛡️ Protección de datos

| Mecanismo | Descripción |
|---|---|
| **Anti-duplicados** | Mismo nombre + <500m en 24h → 409 Conflict |
| **Rate limiting** | 120 req/min global · 5 reportes/min por IP |
| **Sanitización** | HTML stripping · control chars · truncado a longitud máxima |
| **Validación** | Coordenadas [-90..90, -180..180] · edad [0..120] · survivorsCount [1..999] |
| **Spam filter** | Bloquea URLs, dominios (.it, .com, .net), crypto, hotel ads |
| **JWT auth** | Token 24h para endpoints sensibles |
| **Foto lazy** | Las fotos no viajan en listados — solo bajo demanda |
| **Flags comunitarios** | 🚩 en cada tarjeta — cualquiera reporta errores |

---

## 🔧 API Endpoints

### Públicos

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/reports` | Crear reporte (desaparecido o sobreviviente) |
| `GET` | `/api/reports?page=&limit=` | Listado paginado (sin fotos, ligero) |
| `GET` | `/api/reports/map` | Datos optimizados para heatmap (solo coords) |
| `GET` | `/api/reports/search?q=` | Búsqueda full-text |
| `GET` | `/api/reports/:id/foto` | Foto individual (lazy load) |
| `PATCH` | `/api/reports/:id` | Actualizar estado (todos pueden) |
| `PATCH` | `/api/reports/:id/foto` | Subir foto a un registro |
| `PATCH` | `/api/reports/:id/flag` | Reportar error/abuso |
| `GET` | `/api/external/counts` | Totales de la API externa |
| `GET` | `/api/external/image?url=` | Proxy de imágenes S3 externas |

### Admin (JWT requerido)

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/reports/stats` | Estadísticas agregadas |
| `GET` | `/api/reports/critical-zones` | Zonas críticas por densidad |
| `POST` | `/api/external/sync` | Sincronización manual con API externa |

### Auth

| Método | Ruta |
|---|---|
| `POST` | `/api/auth/login` |
| `GET` | `/api/auth/verify` |

---

## 📁 Estructura del proyecto

```
survivor-heatmap/
├── server.js                   # Express optimizado (gzip, pool, rate limit)
├── models/
│   ├── Report.js               # Reporte dual: desaparecido + sobreviviente
│   └── User.js                 # Super admin (auto-creado al iniciar)
├── routes/
│   ├── reports.js              # CRUD + algoritmo Haversine + /map endpoint
│   ├── auth.js                 # Login/verify JWT
│   └── external.js             # Sync API externa + proxy imágenes
├── middleware/
│   └── auth.js                 # JWT verification middleware
├── services/
│   └── syncCron.js             # Módulo reutilizable de sincronización
├── utils/
│   └── geocode.js              # Geocodificador lookup + Nominatim
├── seed.js                     # 16 reportes locales de prueba
├── seed-external.js            # Importa datos de API desaparecidos
├── seed-full.js                # Importación completa (todas las páginas)
├── seed-railway.js             # Seed para Railway (usa MONGO_URL)
├── update-all.js               # Actualización masiva de registros existentes
├── cleanup-spam.js             # Limpieza de spam en MongoDB
├── railway.json                # Configuración de build/deploy
├── implementation_plan.md      # Plan de migración a Vite + TailwindCSS v4
├── .env                        # Variables de entorno
└── client/                     # React SPA
    ├── public/index.html       # Favicon SVG inline + meta tags
    └── src/
        ├── App.js              # Hash router (#admin) + ThemeProvider
        ├── App.css             # Design System v5 (CSS custom properties)
        ├── ThemeContext.js      # Toggle claro/oscuro con localStorage
        ├── api.js              # HTTP client (auth opcional por endpoint)
        ├── PublicPage.js       # 5 tabs: Mapa · Reportar · Directorio · Guía · 911
        ├── LoginPage.js        # Login super admin
        ├── AdminPage.js        # Dashboard con 3 tabs: Mapa · Listas · Zonas
        └── components/
            ├── Logo.js             # SVG bandera Venezuela + pin ubicación
            ├── HeatmapView.js      # Leaflet + heatmap + filtros inline + epicentro
            ├── ReportForm.js       # GPS + compresor imagen + drag & drop
            ├── Desaparecidos.js    # Búsqueda full-text + fotos lazy + flag
            ├── Sobrevivientes.js   # Estados de rescate + acciones públicas
            ├── CriticalZones.js    # Scores de criticidad + mini reportes
            ├── StatsPanel.js       # KPIs + sync API externa + timeline
            ├── GuiaUso.js          # 8 pasos ilustrados
            ├── LeyendaEmergencia.js # Números reales con links tel:
            └── Mascotas.js         # Registro de mascotas perdidas
```

---

## 🎨 Diseño

| Elemento | Valor |
|---|---|
| **Paleta** | 🔴 `#dc2626` · 🔵 `#2563eb` · 🟡 `#eab308` + escala de grises |
| **Tema** | Claro + oscuro (CSS custom properties, sin duplicación) |
| **Sistema** | Design System v5 · 4px grid · WCAG AA |
| **Tipografía** | System font stack · Escala 12-32px · line-height 1.25-1.65 |
| **Tamaño** | ~110 kB JS + ~4 kB CSS (gzip) |
| **Mobile** | Touch targets ≥42px · Single column · Bottom nav con iconos |
| **Favicon** | SVG inline: bandera Venezuela tricolor + pin de ubicación |

### Responsive Design

| Componente | Mobile | Desktop |
|---|---|---|
| **Topbar Admin** | Logo + título truncado + 3 tabs compactos | Logo + stats + 3 tabs + theme toggle |
| **Bottom Nav** | 5 items con iconos + scrollbar oculto | 5 items con iconos + labels |
| **Filtros** | Solo filtro en mapa (HeatmapView) | Solo filtro en mapa (HeatmapView) |
| **Modales** | Full-width bottom sheet | Centered modal con backdrop blur |

### Estructura de Navegación

**AdminPage** (simplificado):
- **Mapa** — Vista principal con heatmap, filtros y zonas críticas
- **Listas** — Combina Desaparecidos + Atrapados en scrollable view
- **Zonas** — Panel de zonas críticas con scores

**PublicPage** (5 tabs):
- **Mapa** — Vista pública con búsqueda
- **Reportar** — Formularios de reporte
- **Directorio** — Listas de desaparecidos/mascotas/sobrevivientes
- **Guía** — Instrucciones de uso
- **911** — Números de emergencia

---

## ⚡ Rendimiento

| Optimización | Detalle |
|---|---|
| **Compresión** | Gzip/Brotli en todas las responses (10× en /map) |
| **Paginación** | GET /api/reports?page=1&limit=200 |
| **Map endpoint** | /api/reports/map — solo coordenadas (28k pts en ~230ms) |
| **ETag cache** | 15-30s con hash MD5 |
| **MongoDB pool** | 5-20 conexiones · índices geoespaciales y texto |
| **Rate limiting** | 120 req/min global · limpieza cada 60s |
| **Static assets** | Cache 365 días (JS/CSS con hash) |
| **CORS preflight** | Cache 24h |

### Load test (Railway producción)

| Usuarios | Endpoint | Avg | Errores |
|---|---|---|---|
| 10 | /api/reports/map (28k pts) | 1,859ms | 0 |
| 50 | /api/reports?limit=100 | 1,075ms | 0 |
| 100 | /api/health | 828ms | 0 |

---

## 🗜️ Compresor de imágenes

```
Foto original (hasta 10MB)
  → Redimensiona a máx 300×300px
  → Comprime JPEG calidad 0.5
  → Resultado: ~15-40KB base64
  → Drag & drop o selector de archivo
  → Vista previa antes de enviar
  → Carga lazy en listados (solo al hacer scroll)
  → Proxy para imágenes externas (S3 protegido)
```

---

## 🧠 Algoritmo de Zonas Críticas (Haversine)

Score 0-100 basado en:
- **35%** — Densidad de reportes en la zona
- **25%** — Número de sobrevivientes atrapados
- **20%** — Proporción de desaparecidos
- **20%** — Severidad alta

Clasificación: 🔴 **crítica** (≥70) · 🟠 **alta** (≥40) · 🔵 **media** (<40)

---

## ⏰ Sincronización automática

```
Cron: 0 */3 * * * (cada 3 horas)
  → Fetch API desaparecidosterremotovenezuela.com
  → Filtro anti-spam (8 patrones)
  → Geocodificación por lookup local
  → Bulk insert (evita duplicados por externalId)
  → Sync inicial al arrancar el servidor
  → Endpoint manual: POST /api/cron/sync
```

---

## 🚂 Despliegue

### Railway (producción)

1. Conectar repo GitHub: `ReservacionDirecta/terremoto-venezuela`
2. Agregar plugin MongoDB
3. Variables: `ADMIN_USER`, `ADMIN_PASS`, `JWT_SECRET`
4. El `railway.json` gestiona build + deploy automático

### Desarrollo local

```bash
git clone https://github.com/ReservacionDirecta/terremoto-venezuela.git
cd terremoto-venezuela
npm install && cd client && npm install && cd ..
# MongoDB en localhost:27017
node server.js
# → http://localhost:3000
```

---

## 👥 Comunidad

Herramienta ciudadana, sin fines de lucro, creada por venezolanos.  
No se solicita ni gestiona dinero. Solo información para encontrar personas.

**Contacto:** `soporte@hallados.org`  
**GitHub:** [ReservacionDirecta/terremoto-venezuela](https://github.com/ReservacionDirecta/terremoto-venezuela)  
**Producción:** [halladosorg.up.railway.app](https://halladosorg.up.railway.app)

---

## 📋 Roadmap

### Completado ✅
- [x] Eliminar filtro duplicado de AdminPage (mantener solo en HeatmapView)
- [x] Simplificar navbar AdminPage (5 → 3 pestañas: Mapa, Listas, Zonas)
- [x] Mejorar responsividad del topbar (truncar título, ocultar stats en móvil)
- [x] Agregar estilos responsivos al bottom-nav para pantallas < 380px
- [x] Corregir error de sintaxis JSX (fragment wrapper)

### En progreso 🚧
- [ ] Migrar de CRA a Vite (ver `implementation_plan.md`)
- [ ] Migrar CSS a TailwindCSS v4
- [ ] Implementar dark mode nativo con Tailwind v4

### Futuro 🔮
- [ ] Service Worker para modo offline
- [ ] Notificaciones push para actualizaciones
- [ ] Exportar datos a CSV/PDF
- [ ] Integración con WhatsApp Business API
