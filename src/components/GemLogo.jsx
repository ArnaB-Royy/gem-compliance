import React from 'react';
import gemLogoSrc from '../assets/gem-logo.jpg';

/**
 * Official GeM Logo - renders the actual gem-logo.jpg from src/assets
 */
export default function GemLogo({ height = 44, className = '' }) {
  return (
    <img
      src={gemLogoSrc}
      alt="GeM - Government e-Marketplace"
      className={`object-contain select-none ${className}`}
      style={{ height: `${height}px`, width: 'auto' }}
      draggable={false}
    />
  );
}
