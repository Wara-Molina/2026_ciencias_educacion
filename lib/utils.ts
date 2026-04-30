// src/lib/utils.ts

/**
 * Construye URL completa para archivos
 * Maneja tanto URLs completas como filenames sueltos
 */
export const getStorageUrl = (urlOrFilename: string | null | undefined): string => {
  if (!urlOrFilename) return '';
  
  // Si ya es una URL completa (empieza con http), retornarla tal cual
  if (urlOrFilename.startsWith('http://') || urlOrFilename.startsWith('https://')) {
    return urlOrFilename;
  }
  
  // Si es solo el filename, construir la URL completa
  const baseUrl = process.env.NEXT_PUBLIC_STORAGE_URL 
    || 'https://apiadministrador.upea.bo/storage';
  
  return `${baseUrl}/${urlOrFilename}`;
};

/**
 * Verifica si es una URL válida
 */
export const isValidUrl = (string: string | null | undefined): boolean => {
  if (!string) return false;
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

/**
 * Formatea fecha a formato latinoamericano
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-BO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Trunca texto con puntos suspensivos
 */
export const truncateText = (text: string, maxLength: number = 150): string => {
  if (!text) return '';
  const cleanText = text.replace(/<[^>]*>/g, '');
  if (cleanText.length <= maxLength) return cleanText;
  return cleanText.slice(0, maxLength) + '...';
};