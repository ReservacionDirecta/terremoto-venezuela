# Migración a Vite + TailwindCSS v4

## Contexto

El proyecto actualmente usa **react-scripts (CRA)** con CSS vanilla personalizado (~435 líneas en `App.css`). TailwindCSS v4 requiere Vite como bundler, por lo que esta migración tiene dos fases: **cambiar el bundler** y **convertir los estilos**.

## Fase 1: Migrar de CRA a Vite

> [!IMPORTANT]
> CRA está oficialmente deprecado desde febrero 2025. Vite es significativamente más rápido para desarrollo y build.

### Cambios en `client/`

#### [MODIFY] [package.json](file:///c:/Users/yerct/survivor-heatmap/client/package.json)
- Reemplazar `react-scripts` por `vite` + `@vitejs/plugin-react` + `@tailwindcss/vite` + `tailwindcss`
- Eliminar `react-leaflet` (no se usa)
- Actualizar scripts: `dev` → `vite`, `build` → `vite build`, `preview` → `vite preview`

#### [NEW] [vite.config.js](file:///c:/Users/yerct/survivor-heatmap/client/vite.config.js)
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { proxy: { '/api': 'http://localhost:5000' } },
  build: { outDir: 'build' }  // mantener "build" para compatibilidad con deploy existente
})
```

#### [MODIFY] [index.html](file:///c:/Users/yerct/survivor-heatmap/client/public/index.html)
- Mover de `public/` a la raíz de `client/`
- Agregar `<script type="module" src="/src/index.jsx"></script>` dentro del `<body>`
- Eliminar el link CDN de Leaflet CSS (ahora se importa vía npm)

#### [MODIFY] [index.js → index.jsx](file:///c:/Users/yerct/survivor-heatmap/client/src/index.js)
- Renombrar `.js` → `.jsx` (Vite requiere extensión explícita para JSX)
- Agregar `import './index.css'`

---

## Fase 2: Migrar CSS a TailwindCSS v4

### Estrategia

TailwindCSS v4 usa CSS nativo con `@import "tailwindcss"`. La estrategia es:

1. **Crear `index.css`** con `@import "tailwindcss"` + CSS custom properties + clases componentes (`@layer components`)
2. **Convertir cada archivo** de `className="btn btn-primary"` a `className="inline-flex items-center justify-center gap-1.5 px-4.5 py-2.5 bg-red-600 text-white ..."`
3. **Eliminar `App.css`** completamente

### Mapeo de Clases Custom → Tailwind v4

| Clase Actual | Equivalente Tailwind v4 |
|---|---|
| `.btn` | `inline-flex items-center justify-center gap-1.5 px-4.5 py-2.5 border border-transparent rounded-xl font-semibold text-sm cursor-pointer transition-all` |
| `.btn-primary` | `bg-red-600 text-white hover:bg-red-700` |
| `.btn-secondary` | `bg-blue-600 text-white hover:bg-blue-700` |
| `.btn-outline` | `bg-white text-slate-600 border-slate-300 hover:border-slate-400` |
| `.btn-sm` | `py-1.5 px-3 text-xs min-h-[34px] rounded-lg` |
| `.card` | `bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow` |
| `.badge` | `inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold` |
| `.kpi` | `text-center p-4 rounded-xl bg-white border border-slate-200 shadow-sm` |
| `.topbar` | `flex items-center justify-between px-5 py-3 bg-red-600 text-white shadow-md` |
| `.modal-overlay` | `fixed inset-0 z-300 bg-black/50 flex items-end sm:items-center justify-center backdrop-blur-sm` |
| `.modal` | `bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-lg` |
| `.spinner` | `w-7 h-7 border-2.5 border-slate-200 border-t-red-600 rounded-full animate-spin` |

### Archivos a Convertir (15 archivos)

#### [DELETE] [App.css](file:///c:/Users/yerct/survivor-heatmap/client/src/App.css)

#### [NEW] [index.css](file:///c:/Users/yerct/survivor-heatmap/client/src/index.css)
- `@import "tailwindcss"`
- CSS custom properties para dark mode (`:root` y `[data-theme="dark"]`)
- `@layer components` con las pocas clases que no se pueden hacer inline (animaciones, scrollbar, etc.)

#### [MODIFY] Todos los componentes (convertir className + eliminar inline styles)
- [App.js](file:///c:/Users/yerct/survivor-heatmap/client/src/App.js)
- [PublicPage.js](file:///c:/Users/yerct/survivor-heatmap/client/src/PublicPage.js) — el más grande (~474 líneas)
- [AdminPage.js](file:///c:/Users/yerct/survivor-heatmap/client/src/AdminPage.js)
- [LoginPage.js](file:///c:/Users/yerct/survivor-heatmap/client/src/LoginPage.js)
- [HeatmapView.js](file:///c:/Users/yerct/survivor-heatmap/client/src/components/HeatmapView.js)
- [Desaparecidos.js](file:///c:/Users/yerct/survivor-heatmap/client/src/components/Desaparecidos.js)
- [Sobrevivientes.js](file:///c:/Users/yerct/survivor-heatmap/client/src/components/Sobrevivientes.js)
- [Mascotas.js](file:///c:/Users/yerct/survivor-heatmap/client/src/components/Mascotas.js)
- [ReportForm.js](file:///c:/Users/yerct/survivor-heatmap/client/src/components/ReportForm.js)
- [CriticalZones.js](file:///c:/Users/yerct/survivor-heatmap/client/src/components/CriticalZones.js)
- [StatsPanel.js](file:///c:/Users/yerct/survivor-heatmap/client/src/components/StatsPanel.js)
- [Stats.js](file:///c:/Users/yerct/survivor-heatmap/client/src/components/Stats.js)
- [GuiaUso.js](file:///c:/Users/yerct/survivor-heatmap/client/src/components/GuiaUso.js)
- [LeyendaEmergencia.js](file:///c:/Users/yerct/survivor-heatmap/client/src/components/LeyendaEmergencia.js)
- [Logo.js](file:///c:/Users/yerct/survivor-heatmap/client/src/components/Logo.js) (sin cambios — es SVG puro)

---

## Fase 3: Dark Mode con Tailwind v4

TailwindCSS v4 soporta dark mode nativo con `dark:` prefix. El proyecto usa `data-theme="dark"`, lo configuraremos así:

```css
/* index.css */
@import "tailwindcss";
@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));
```

Esto permite usar `dark:bg-slate-900`, `dark:text-slate-100`, etc., sincronizado con el `ThemeContext` existente.

---

## Open Questions

> [!IMPORTANT]
> **¿Build output?** — Actualmente el build va a `client/build/`. ¿Lo mantenemos así para que `server.js` lo sirva igual, o cambiamos a `dist/`?

> [!IMPORTANT]
> **¿Deploy?** — ¿El deploy es vía Railway? Si es así, el `railway.json` actual probablemente ejecuta `cd client && npm run build`. Necesitará ajustarse a Vite.

---

## Verificación

1. `cd client && npm install` — instalar nuevas deps
2. `npm run dev` — verificar que el dev server Vite arranca
3. `npm run build` — verificar que el build de producción compila sin errores
4. Verificar visualmente: mapa, modales, directorio, formularios, dark mode
5. Verificar que el `server.js` sirve correctamente el `build/` output
