import React from 'react';

const CONTACTS = [
  {
    title: 'Emergencia General',
    items: [
      { label: 'CANTV', num: '171' },
      { label: 'Movilnet', num: '*1' },
      { label: 'Digitel', num: '112' },
      { label: 'Movistar', num: '911' },
    ]
  },
  {
    title: 'Aeroambulancias',
    items: [
      { label: 'Principal', num: '(0212) 993.25.41' },
      { label: 'Línea 2', num: '(0212) 992.89.80' },
      { label: 'Línea 3', num: '(0212) 992.89.90' },
      { label: 'Línea 4', num: '(0212) 991.79.40' },
    ]
  },
  {
    title: 'Rescarven',
    items: [
      { label: 'Principal', num: '(0212) 993.69.11' },
      { label: 'Línea 2', num: '(0212) 993.69.91' },
      { label: 'Línea 3', num: '(0212) 993.13.10' },
      { label: 'Línea 4', num: '(0212) 993.33.67' },
    ]
  },
  {
    title: 'Ambulancia Metropolitano',
    items: [
      { label: 'Principal', num: '(0212) 545.45.45' },
      { label: 'Línea 2', num: '(0212) 545.46.55' },
      { label: 'Línea 3', num: '(0212) 577.92.09' },
    ]
  },
];

// Formatear número para tel: link
function telLink(num) {
  return 'tel:' + num.replace(/[\(\)\s\.\-]/g, '');
}

export default function LeyendaEmergencia() {
  return (
    <div style={{ padding: '16px', maxWidth: 700, margin: '0 auto' }}>
      <h2 className="fw-700 mb-3" style={{ fontSize: '1.1rem' }}>Contactos de Emergencia — Venezuela</h2>
      <p className="fs-sm text-gray mb-3">
        Si tienes una emergencia médica, llama a estos números. Esta web es solo para registro de personas.
      </p>

      <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {CONTACTS.map((group, i) => (
          <div key={i} className="card" style={{ padding: '14px' }}>
            <h3 className="fw-700 fs-sm mb-2">{group.title}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {group.items.map((item, j) => (
                <a key={j} href={telLink(item.num)}
                   className="flex justify-between items-center"
                   style={{
                     padding: '8px 10px', borderRadius: 8, textDecoration: 'none',
                     background: 'var(--bg2)', color: 'var(--text)',
                     border: '1px solid var(--border)'
                   }}>
                  <span className="fs-sm">{item.label}</span>
                  <span className="fw-700 fs-sm" style={{ color: 'var(--red)' }}>{item.num}</span>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
