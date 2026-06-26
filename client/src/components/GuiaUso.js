import React from 'react';

const STEPS = [
  {
    emoji: '🔍',
    title: 'Reportar un desaparecido',
    desc: 'Si no logras comunicarte con alguien tras el terremoto, toca el botón azul "Reportar Persona Desaparecida". Ingresa el nombre, edad, última ubicación conocida y una foto si la tienes. La ubicación se obtiene automáticamente con el GPS de tu teléfono o puedes ingresarla manualmente.',
  },
  {
    emoji: '🆘',
    title: 'Reportar sobrevivientes atrapados',
    desc: 'Si conoces personas atrapadas que necesitan rescate, toca el botón rojo "Reportar Sobrevivientes Atrapados". Describe la situación, cuántas personas son y la severidad. Los equipos de rescate usan esta información para priorizar.',
  },
  {
    emoji: '🔥',
    title: 'Ver el mapa de calor',
    desc: 'En la pestaña Mapa puedes ver todos los reportes geolocalizados. Las zonas rojas y naranjas indican mayor concentración de reportes. Puedes filtrar por tipo: todos, solo desaparecidos o solo atrapados.',
  },
  {
    emoji: '👥',
    title: 'Consultar listas',
    desc: 'Las pestañas Desaparecidos y Atrapados muestran listas completas. Puedes buscar por nombre o ubicación. Si encuentras a alguien que estaba reportado, un administrador puede marcarlo como localizado.',
  },
  {
    emoji: '🚩',
    title: 'Reportar información incorrecta',
    desc: 'Si ves un reporte duplicado, falso o con errores, toca el botón "Reportar error" en la tarjeta. La comunidad ayuda a mantener los datos limpios.',
  },
  {
    emoji: '🌐',
    title: 'Datos de fuentes externas',
    desc: 'Los marcadores azules en el mapa son datos sincronizados desde desaparecidosterremotovenezuela.com. Se actualizan periódicamente para tener la información más completa.',
  },
  {
    emoji: '☀️',
    title: 'Modo claro / oscuro',
    desc: 'Toca el ícono ☀️/🌙 en la barra superior para cambiar entre tema claro y oscuro. Útil para ahorrar batería o mejorar visibilidad según la luz.',
  },
  {
    emoji: '📞',
    title: 'Llamar a emergencias',
    desc: 'Esta web es una herramienta de registro, NO un servicio de emergencia. Si necesitas asistencia médica o rescate inmediato, llama a los números de emergencia listados abajo.',
  },
];

export default function GuiaUso() {
  return (
    <div style={{ padding: '16px', maxWidth: 700, margin: '0 auto' }}>
      <h2 className="fw-700 mb-3" style={{ fontSize: '1.1rem' }}>📖 Cómo usar Hallados</h2>
      <p className="fs-sm text-gray mb-3">
        Guía rápida para familiares, rescatistas y voluntarios.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {STEPS.map((step, i) => (
          <div key={i} className="card" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: 'var(--bg2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.3rem', flexShrink: 0, border: '1px solid var(--border)'
            }}>
              {step.emoji}
            </div>
            <div>
              <h3 className="fw-700 fs-sm" style={{ marginBottom: 3 }}>{i + 1}. {step.title}</h3>
              <p className="fs-sm" style={{ color: 'var(--text2)', lineHeight: 1.6 }}>{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
