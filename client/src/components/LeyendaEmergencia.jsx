import React from 'react';

const CONTACTS = [
  { title: 'Emergencia General', items: [{ label: 'CANTV', num: '171' }, { label: 'Movilnet', num: '*1' }, { label: 'Digitel', num: '112' }, { label: 'Movistar', num: '911' }] },
  { title: 'Aeroambulancias', items: [{ label: 'Principal', num: '(0212) 993.25.41' }, { label: 'Línea 2', num: '(0212) 992.89.80' }, { label: 'Línea 3', num: '(0212) 992.89.90' }, { label: 'Línea 4', num: '(0212) 991.79.40' }] },
  { title: 'Rescarven', items: [{ label: 'Principal', num: '(0212) 993.69.11' }, { label: 'Línea 2', num: '(0212) 993.69.91' }, { label: 'Línea 3', num: '(0212) 993.13.10' }, { label: 'Línea 4', num: '(0212) 993.33.67' }] },
  { title: 'Ambulancia Metropolitano', items: [{ label: 'Principal', num: '(0212) 545.45.45' }, { label: 'Línea 2', num: '(0212) 545.46.55' }, { label: 'Línea 3', num: '(0212) 577.92.09' }] },
];

function telLink(num) {
  return 'tel:' + num.replace(/[\(\)\s\.\-]/g, '');
}

export default function LeyendaEmergencia() {
  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="font-bold mb-3 text-lg">Contactos de Emergencia — Venezuela</h2>
      <p className="text-sm text-txt3 mb-3">
        Si tienes una emergencia médica, llama a estos números. Esta web es solo para registro de personas.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
        {CONTACTS.map((group, i) => (
          <div key={i} className="bg-surface border border-border rounded-2xl p-3.5 shadow-sm">
            <h3 className="font-bold text-sm mb-2">{group.title}</h3>
            <div className="flex flex-col gap-1.5">
              {group.items.map((item, j) => (
                <a key={j} href={telLink(item.num)}
                   className="flex justify-between items-center p-2 rounded-lg no-underline border border-border"
                   style={{background:'var(--color-bg2)', color:'var(--color-txt)'}}>
                  <span className="text-sm">{item.label}</span>
                  <span className="font-bold text-sm text-red-600">{item.num}</span>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
