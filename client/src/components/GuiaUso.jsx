import React from 'react';

const STEPS = [
  { emoji: '🔍', title: 'Reportar un desaparecido', desc: 'Si no logras comunicarte con alguien tras el terremoto, toca el botón azul "Reportar Persona Desaparecida". Ingresa el nombre, edad, última ubicación conocida y una foto si la tienes. La ubicación se obtiene automáticamente con el GPS de tu teléfono o puedes ingresarla manualmente.' },
  { emoji: '🆘', title: 'Reportar sobrevivientes atrapados', desc: 'Si conoces personas atrapadas que necesitan rescate, toca el botón rojo "Reportar Sobrevivientes Atrapados". Describe la situación, cuántas personas son y la severidad. Los equipos de rescate usan esta información para priorizar.' },
  { emoji: '🔥', title: 'Ver el mapa de calor', desc: 'En la pestaña Mapa puedes ver todos los reportes geolocalizados. Las zonas rojas y naranjas indican mayor concentración de reportes. Puedes filtrar por tipo: todos, solo desaparecidos o solo atrapados.' },
  { emoji: '👥', title: 'Consultar listas', desc: 'Las pestañas Desaparecidos y Atrapados muestran listas completas. Puedes buscar por nombre o ubicación. Si encuentras a alguien que estaba reportado, un administrador puede marcarlo como localizado.' },
  { emoji: '🚩', title: 'Reportar información incorrecta', desc: 'Si ves un reporte duplicado, falso o con errores, toca el botón "Reportar error" en la tarjeta. La comunidad ayuda a mantener los datos limpios.' },
  { emoji: '🌐', title: 'Datos de fuentes externas', desc: 'Los marcadores azules en el mapa son datos sincronizados desde desaparecidosterremotovenezuela.com. Se actualizan periódicamente para tener la información más completa.' },
  { emoji: '☀️', title: 'Modo claro / oscuro', desc: 'Toca el ícono ☀️/🌙 en la barra superior para cambiar entre tema claro y oscuro. Útil para ahorrar batería o mejorar visibilidad según la luz.' },
  { emoji: '📞', title: 'Llamar a emergencias', desc: 'Esta web es una herramienta de registro, NO un servicio de emergencia. Si necesitas asistencia médica o rescate inmediato, llama a los números de emergencia listados abajo.' },
];

export default function GuiaUso() {
  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="font-bold mb-3 text-lg">📖 Cómo usar Hallados</h2>
      <p className="text-sm text-txt3 mb-3">Guía rápida para familiares, rescatistas y voluntarios.</p>

      <div className="flex flex-col gap-3">
        {STEPS.map((step, i) => (
          <div key={i} className="bg-surface border border-border rounded-2xl p-3.5 shadow-sm hover:shadow-md transition-shadow flex gap-3 items-start">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 border border-border"
                 style={{background:'var(--color-bg2)'}}>
              {step.emoji}
            </div>
            <div>
              <h3 className="font-bold text-sm mb-1">{i + 1}. {step.title}</h3>
              <p className="text-sm text-txt2 leading-relaxed">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
