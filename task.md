# Migración Vite + TailwindCSS v4

## Fase 1: Infraestructura Vite
- [ ] Actualizar `package.json` (deps + scripts)
- [ ] Crear `vite.config.js`
- [ ] Mover `index.html` a raíz de `client/` y adaptar para Vite
- [ ] Renombrar `index.js` → `index.jsx`
- [ ] `npm install`

## Fase 2: TailwindCSS v4
- [ ] Crear `src/index.css` con `@import "tailwindcss"` + custom properties + dark mode
- [ ] Eliminar `App.css`

## Fase 3: Convertir componentes
- [ ] `App.js` → `App.jsx`
- [ ] `ThemeContext.js` → `ThemeContext.jsx` (sin cambios CSS)
- [ ] `PublicPage.js` → `PublicPage.jsx`
- [ ] `AdminPage.js` → `AdminPage.jsx`
- [ ] `LoginPage.js` → `LoginPage.jsx`
- [ ] `HeatmapView.js` → `HeatmapView.jsx`
- [ ] `Desaparecidos.js` → `Desaparecidos.jsx`
- [ ] `Sobrevivientes.js` → `Sobrevivientes.jsx`
- [ ] `Mascotas.js` → `Mascotas.jsx`
- [ ] `ReportForm.js` → `ReportForm.jsx`
- [ ] `CriticalZones.js` → `CriticalZones.jsx`
- [ ] `StatsPanel.js` → `StatsPanel.jsx`
- [ ] `Stats.js` → `Stats.jsx`
- [ ] `GuiaUso.js` → `GuiaUso.jsx`
- [ ] `LeyendaEmergencia.js` → `LeyendaEmergencia.jsx`
- [ ] `Logo.js` → `Logo.jsx`
- [ ] `api.js` (sin cambios)

## Fase 4: Verificación
- [ ] `npm run build` exitoso
- [ ] Verificar visualmente en navegador
