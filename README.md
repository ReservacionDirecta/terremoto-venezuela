# 🇻🇪 Terremoto Venezuela — Registro de Desaparecidos y Sobrevivientes

> **Doble terremoto 7.2 + 7.5 Mw — 24 de Junio de 2026**
> Epicentro: San Felipe, Yaracuy / Montalbán, Carabobo
> +188 fallecidos | +1,500 heridos | +41,000 desaparecidos

Aplicación de emergencia de código abierto para:
- 📍 **Mapa de calor** público con filtros por tipo de reporte
- 🔍 **Registro de desaparecidos** con búsqueda, fotos y marcado de localizados
- 🆘 **Registro de sobrevivientes atrapados** con estados de rescate
- 🎯 **Zonas críticas** detectadas por algoritmo de densidad geográfica
- 🚩 **Moderación comunitaria** — cualquier persona puede reportar errores
- 🔒 **Panel admin** protegido con JWT para gestionar estados

Inspirado en [desaparecidosterremotovenezuela.com](https://desaparecidosterremotovenezuela.com/)

---

## ⚡ Stack

| Capa | Tecnología |
|------|------------|
| Frontend | React 18 + Leaflet + leaflet.heat |
| Backend | Node.js + Express + JWT |
| Base de datos | MongoDB (GeoJSON 2dsphere) |
| Despliegue | Railway |

---

## 🌐 Acceso público vs Admin

| Funcionalidad | Público | Admin |
|---|---|---|
| Ver mapa de calor | ✅ | ✅ |
| Ver lista de desaparecidos | ✅ | ✅ |
| Ver lista de sobrevivientes | ✅ | ✅ |
| Buscar personas | ✅ | ✅ |
| Ver fotos | ✅ | ✅ |
| Reportar desaparecido | ✅ | ✅ |
| Reportar sobrevivientes | ✅ | ✅ |
| Reportar error (🚩 flag) | ✅ | ✅ |
| Marcar como localizado | ❌ | ✅ |
| Cambiar estado de rescate | ❌ | ✅ |
| Subir fotos | ❌ | ✅ |
| Ver estadísticas | ❌ | ✅ |
| Ver zonas críticas | ❌ | ✅ |

---

## 🛡️ Protección de datos

| Mecanismo | Descripción |
|---|---|
| **Anti-duplicados** | Detecta mismo nombre + <500m en 24h → error 409 |
| **Rate limiting** | Máx 5 reportes por IP por minuto → 429 |
| **Sanitización** | Elimina HTML, caracteres de control, trunca texto |
| **Validación** | Coordenadas, edad, cantidad de personas |
| **JWT auth** | Token de 24h para endpoints admin |
| **Foto lazy** | Las fotos no se incluyen en listados — solo bajo demanda |
| **Flags comunitarios** | Botón 🚩 en cada tarjeta para reportar errores |

---

## 🔧 API Endpoints

### Públicos (sin autenticación)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/reports` | Crear reporte |
| `GET` | `/api/reports` | Listar todos (sin fotos) |
| `GET` | `/api/reports/search?q=` | Búsqueda full-text |
| `GET` | `/api/reports/:id/foto` | Obtener foto individual |
| `PATCH` | `/api/reports/:id/flag` | Reportar error (comunitario) |

### Admin (requiere token JWT)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/reports/stats` | Estadísticas |
| `GET` | `/api/reports/critical-zones` | Zonas críticas |
| `PATCH` | `/api/reports/:id` | Actualizar estado |
| `PATCH` | `/api/reports/:id/foto` | Subir/actualizar foto |

### Auth

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/auth/login` | Iniciar sesión |
| `GET` | `/api/auth/verify` | Verificar token |

---

## 🚀 Desarrollo Local

```bash
cd survivor-heatmap

# 1. Instalar dependencias
npm install
cd client && npm install && cd ..

# 2. MongoDB corriendo en localhost:27017

# 3. Sembrar datos de prueba (38 reportes realistas)
node seed.js

# 4. Iniciar servidor
node server.js
# → http://localhost:3000
```

### Credenciales por defecto

| Campo | Valor |
|---|---|
| Usuario | `admin` |
| Contraseña | `terremoto2026` |
| Configurable en | `.env` (`ADMIN_USER`, `ADMIN_PASS`) |

---

## 📁 Estructura

```
survivor-heatmap/
├── server.js                 # Express + sirve React build
├── models/
│   ├── Report.js             # Esquema dual (sobreviviente/desaparecido)
│   └── User.js               # Super admin
├── routes/
│   ├── reports.js            # API REST + algoritmo densidad
│   └── auth.js               # Login/verify
├── middleware/
│   └── auth.js               # JWT middleware
├── seed.js                   # 38 reportes de prueba
├── railway.json              # Config Railway
├── .env                      # Variables de entorno
└── client/                   # React app
    ├── public/
    │   └── index.html        # Favicon SVG inline
    └── src/
        ├── App.js            # ThemeProvider + login gate
        ├── App.css           # Variables CSS (claro/oscuro)
        ├── ThemeContext.js    # Toggle ☀️/🌙
        ├── api.js            # Cliente HTTP con auth opcional
        ├── PublicPage.js     # Tabs: Reportar | Mapa | Desaparecidos | Atrapados
        ├── LoginPage.js      # Login super admin
        ├── AdminPage.js      # Dashboard completo
        └── components/
            ├── Logo.js            # SVG bandera VE + pin ubicación
            ├── HeatmapView.js     # Mapa Leaflet + heatmap
            ├── ReportForm.js      # Formulario con GPS + compresor imagen
            ├── Desaparecidos.js   # Lista + búsqueda + fotos lazy
            ├── Sobrevivientes.js  # Lista por estado + acciones
            ├── CriticalZones.js   # Panel de zonas críticas
            └── StatsPanel.js      # KPIs + gráficos
```

---

## 🎨 Diseño

| Elemento | Valor |
|---|---|
| **Paleta** | 🔴 `#dc2626` · 🔵 `#2563eb` · 🟡 `#eab308` + blanco/negro/grises |
| **Tema** | Claro (default) + oscuro (toggle ☀️/🌙) |
| **CSS** | Variables nativas, sin duplicación |
| **Tamaño** | 102 kB JS + 2.9 kB CSS (gzip) |
| **Tipografía** | System fonts, sin dependencias externas |
| **Touch** | Targets ≥44px, mobile-first |
| **Favicon** | SVG inline — bandera VE + pin ubicación |

---

## 🗜️ Compresor de imágenes

```
Foto original (hasta 10MB)
  → Redimensiona a máx 300×300px
  → Comprime JPEG calidad 0.5
  → Resultado: ~15-40KB base64
  → Carga lazy en listados (solo al hacer scroll)
```

---

## 🧠 Algoritmo de Zonas Críticas

Score 0-100 basado en:
- **35%** — Densidad de reportes en la zona
- **25%** — Número de sobrevivientes atrapados
- **20%** — Proporción de desaparecidos
- **20%** — Severidad alta

Clasificación: 🔴 **crítica** (≥70) | 🟠 **alta** (≥40) | 🔵 **media** (<40)

---

## 🚂 Despliegue en Railway

1. Subir a GitHub
2. Railway → New Project → Deploy from GitHub
3. Agregar plugin MongoDB (inyecta `MONGO_URL`)
4. Configurar variables: `ADMIN_USER`, `ADMIN_PASS`, `JWT_SECRET`
