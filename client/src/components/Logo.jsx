import React from 'react';

export default function Logo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="60" height="20" fill="#ffcc00" rx="4" />
      <rect x="2" y="22" width="60" height="20" fill="#00247d" />
      <rect x="2" y="42" width="60" height="20" fill="#cf142b" />
      {[[14,29],[20,25],[28,23],[36,23],[44,25],[50,29],[54,35],[56,42]].map(([cx,cy],i) => (
        <polygon key={i}
          points={`${cx},${cy-3.5} ${cx+1},${cy-1} ${cx+3.5},${cy-1} ${cx+1.5},${cy+0.5} ${cx+2.5},${cy+3} ${cx},${cy+2} ${cx-2.5},${cy+3} ${cx-1.5},${cy+0.5} ${cx-3.5},${cy-1} ${cx-1},${cy-1}`}
          fill="#fff" />
      ))}
      <g transform="translate(32,36)">
        <path d="M0-18 C-9-18 -16-11 -16-3 C-16 6 0 18 0 18 C0 18 16 6 16-3 C16-11 9-18 0-18Z" fill="#fff" opacity="0.92" />
        <circle cx="0" cy="-3" r="5" fill="#cf142b" />
      </g>
    </svg>
  );
}
