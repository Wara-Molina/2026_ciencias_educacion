// src/components/providers/ThemeDynamicProvider.tsx
'use client';

import { useEffect } from 'react';

interface ThemeDynamicProviderProps {
  children: React.ReactNode;
  colors?: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
  };
}

export default function ThemeDynamicProvider({ 
  children, 
  colors 
}: ThemeDynamicProviderProps) {
  
  useEffect(() => {
    if (!colors) return;
    
    const root = document.documentElement;
    
    // Aplicar colores principales
    if (colors.primary) {
      root.style.setProperty('--color-primary', colors.primary);
      root.style.setProperty('--color-primary-light', `${colors.primary}15`);
      root.style.setProperty('--color-primary-fg', calculateContrastColor(colors.primary));
    }
    
    if (colors.secondary) {
      root.style.setProperty('--color-secondary', colors.secondary);
      root.style.setProperty('--color-secondary-light', `${colors.secondary}15`);
      root.style.setProperty('--color-secondary-fg', calculateContrastColor(colors.secondary));
    }
    
    if (colors.tertiary) {
      root.style.setProperty('--color-tertiary', colors.tertiary);
    }
    
  }, [colors]);

  return <>{children}</>;
}

function calculateContrastColor(hex: string): string {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6) return '#ffffff';
  
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  
  // Fórmula de luminosidad relativa
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? '#000000' : '#ffffff';
}