import React from 'react';

const gemLogoSrc = '/assets/gem-logo.png';

export default function GemLogo({ height = 44, className = '' }) {
  return (
    <img
      src={gemLogoSrc}
      alt="GeM - Government e-Marketplace"
      className={`object-contain select-none ${className}`}
      style={{ 
        height: `${height}px`, 
        width: 'auto',
        filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.4)) brightness(1.2)',
      }}
      draggable={false}
    />
  );
}