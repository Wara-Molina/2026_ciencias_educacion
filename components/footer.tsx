'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Mail, Phone, MapPin, Facebook, Youtube, Twitter, 
  ExternalLink, BookOpen, GraduationCap
} from 'lucide-react';
import api from '@/lib/axios';
import { sanitizeTextField, sanitizeHref } from '@/lib/sanitize';
import ThemeDynamicProvider from '@/components/providers/ThemeDynamicProvider';

interface ColorInstitucion {
  color_primario: string;
  color_secundario: string;
  color_terciario: string;
}

interface InstitucionData {
  institucion_id: number;
  institucion_nombre: string;
  institucion_iniciales: string;
  institucion_logo?: string;
  institucion_direccion?: string;
  institucion_correo1?: string;
  institucion_celular1?: number;
  institucion_celular2?: number;
  institucion_facebook?: string;
  institucion_youtube?: string;
  institucion_twitter?: string;
  institucion_mision?: string;
  colorinstitucion: ColorInstitucion[];
}

interface LinkExterno {
  id_link: number;
  nombre: string;
  url_link: string;
  estado: number;
  tipo: string;
}

const isValidHexColor = (color: string | undefined): boolean => {
  if (!color) return false;
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
};

const isLightColor = (hex: string): boolean => {
  if (!hex || typeof hex !== 'string') return false;
  const cleanHex = hex.replace('#', '');
  if (!/^[0-9A-Fa-f]{6}$/.test(cleanHex)) return false;
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
};

const isValidUrl = (url: string | undefined): boolean => {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return ['https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

const getSafeImageUrl = (path: string | undefined): string => {
  if (!path) return '/imagenes/logo-default.png';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return isValidUrl(path) ? path : '/imagenes/logo-default.png';
  }
  const storageUrl = process.env.NEXT_PUBLIC_STORAGE_URL || 'https://apiadministrador.upea.bo/storage';
  const cleanPath = path.replace(/[^a-zA-Z0-9._-]/g, '');
  return `${storageUrl}/${cleanPath}`;
};

export function Footer() {
  const [institucion, setInstitucion] = useState<InstitucionData | null>(null);
  const [linksExternos, setLinksExternos] = useState<LinkExterno[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [primaryColor, setPrimaryColor] = useState('#04246C');
  const [secondaryColor, setSecondaryColor] = useState('#FC0102');
  const [tertiaryColor, setTertiaryColor] = useState('#020733');

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const institucionId = process.env.NEXT_PUBLIC_INSTITUCION_ID;
        if (!institucionId) return;
        
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://apiadministrador.upea.bo/api/v2';
        
        const [instRes, recursosRes] = await Promise.all([
          api.get(`${API_BASE_URL}/institucionesPrincipal/${institucionId}`),
          api.get(`${API_BASE_URL}/institucion/${institucionId}/recursos`)
        ]);

        if (!isMounted) return;
        const instData = instRes.data.Descripcion;
        setInstitucion({
          ...instData,
          institucion_nombre: sanitizeTextField(instData.institucion_nombre, 100),
          institucion_iniciales: sanitizeTextField(instData.institucion_iniciales, 20),
          institucion_mision: sanitizeTextField(instData.institucion_mision, 300),
          institucion_direccion: sanitizeTextField(instData.institucion_direccion, 200),
          institucion_correo1: sanitizeTextField(instData.institucion_correo1, 100),
        });
        
        const filteredLinks = (recursosRes.data.linksExternoInterno || [])
          .filter((l: any) => l.estado === 1)
          .slice(0, 4)
          .map((l: any) => ({
            ...l,
            nombre: sanitizeTextField(l.nombre, 50),
            url_link: sanitizeHref(l.url_link),
          }));
        setLinksExternos(filteredLinks);

        if (instData.colorinstitucion?.[0]) {
          const colors = instData.colorinstitucion[0];
          if (isValidHexColor(colors.color_primario)) setPrimaryColor(colors.color_primario);
          if (isValidHexColor(colors.color_secundario)) setSecondaryColor(colors.color_secundario);
          if (isValidHexColor(colors.color_terciario)) setTertiaryColor(colors.color_terciario);
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Footer: Error cargando datos', error);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, []);

  const isLightBackground = isLightColor(tertiaryColor);
  
  const textColorClass = isLightBackground ? 'text-gray-900' : 'text-white';
  const textColorMutedClass = isLightBackground ? 'text-gray-600' : 'text-white/80';
  const textColorDimmedClass = isLightBackground ? 'text-gray-500' : 'text-white/60';
  const textColorFaintClass = isLightBackground ? 'text-gray-400' : 'text-white/40';
  const borderColorClass = isLightBackground ? 'border-gray-200' : 'border-white/10';
  const hoverTextClass = isLightBackground ? 'hover:text-gray-900' : 'hover:text-white';
  const hoverBgClass = isLightBackground ? 'hover:bg-gray-100' : 'hover:bg-white/20';
  const iconBgClass = isLightBackground ? 'bg-gray-100' : 'bg-white/10';
  const logoBgClass = isLightBackground ? 'bg-gray-200' : 'bg-white';
  const uticBgClass = isLightBackground ? 'bg-gray-100' : 'bg-white';

  const socialLinks = [
    { name: 'Facebook', url: sanitizeHref(institucion?.institucion_facebook), icon: Facebook, color: '#1877F2' },
    { name: 'YouTube', url: sanitizeHref(institucion?.institucion_youtube), icon: Youtube, color: '#FF0000' },
    { name: 'Twitter/X', url: sanitizeHref(institucion?.institucion_twitter), icon: Twitter, color: '#1DA1F2' },
  ].filter(link => link.url && isValidUrl(link.url));

  const logoUrl = getSafeImageUrl(institucion?.institucion_logo);

  if (loading) {
    return (
      <footer className="py-20 mt-1" style={{ backgroundColor: tertiaryColor }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="h-32 animate-pulse rounded-lg" style={{ backgroundColor: `${primaryColor}20` }} />
        </div>
      </footer>
    );
  }

  return (
    <ThemeDynamicProvider colors={{ primary: primaryColor, secondary: secondaryColor, tertiary: tertiaryColor }}>
      <footer 
        className="py-20 mt-1 transition-colors duration-800 border-t"
        style={{ 
          backgroundColor: tertiaryColor,
          borderTopColor: `${primaryColor}40`
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div 
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBgClass}`}
                  style={{ border: `1px solid ${primaryColor}30` }}
                >
                  <BookOpen className="w-5 h-5" style={{ color: secondaryColor }} />
                </div>
                <div>
                  <h3 className={`font-bold text-lg ${textColorClass}`}>
                    {institucion?.institucion_nombre || 'Carrera'}
                  </h3>
                  <p className={`text-xs ${textColorDimmedClass}`}>
                    {institucion?.institucion_iniciales || 'UPEA'}
                  </p>
                </div>
              </div>
              <p className={`text-sm ${textColorMutedClass} leading-relaxed line-clamp-3`}>
                {institucion?.institucion_mision || 'Formando profesionales competentes con excelencia académica.'}
              </p>
            </div>

            <div>
              <h4 className={`font-semibold mb-4 ${textColorClass}`}>Navegación</h4>
              <ul className="space-y-3">
                {[
                  { label: 'Inicio', href: '/' },
                  { label: 'Cursos', href: '/cursos' },
                  { label: 'Eventos', href: '/eventos' },
                  { label: 'Comunicados', href: '/comunicados' },
                  { label: 'Gacetas', href: '/gacetas' },
                  { label: 'Investigación', href: '/institutoInvestigacion' },
                ].map((item) => (
                  <li key={item.href}>
                    <Link 
                      href={item.href} 
                      className={`text-sm ${textColorMutedClass} ${hoverTextClass} transition-colors flex items-center gap-2 border-l-2 border-transparent hover:border-l-current`}
                      style={{ borderColor: `${primaryColor}40` }}
                    >
                      <span className={`w-1 h-1 rounded-full ${isLightBackground ? 'bg-gray-400' : 'bg-white/40'}`} />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className={`font-semibold mb-4 ${textColorClass}`}>Contacto</h4>
              <ul className="space-y-4">
                {institucion?.institucion_direccion && (
                  <li className="flex items-start gap-3">
                    <MapPin className={`w-5 h-5 mt-0.5 ${textColorDimmedClass}`} />
                    <span className={`text-sm ${textColorMutedClass}`}>
                      {institucion.institucion_direccion}
                    </span>
                  </li>
                )}
                {institucion?.institucion_correo1 && (
                  <li className="flex items-center gap-3">
                    <Mail className={`w-5 h-5 ${textColorDimmedClass}`} />
                    <a 
                      href={`mailto:${sanitizeHref(institucion.institucion_correo1)}`} 
                      className={`text-sm ${textColorMutedClass} ${hoverTextClass}`}
                    >
                      {institucion.institucion_correo1}
                    </a>
                  </li>
                )}
                {institucion?.institucion_celular1 && institucion.institucion_celular1 !== 2147483647 && (
                  <li className="flex items-center gap-3">
                    <Phone className={`w-5 h-5 ${textColorDimmedClass}`} />
                    <a 
                      href={`tel:+591${institucion.institucion_celular1}`} 
                      className={`text-sm ${textColorMutedClass} ${hoverTextClass}`}
                    >
                      +591 {institucion.institucion_celular1}
                    </a>
                  </li>
                )}
              </ul>
            </div>

            <div>
              <h4 className={`font-semibold mb-4 ${textColorClass}`}>Síguenos</h4>
              <div className="flex gap-3 mb-6">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-2.5 rounded-lg ${iconBgClass} ${hoverBgClass} transition-colors`}
                    style={{ border: `1px solid ${primaryColor}30` }}
                    title={social.name}
                  >
                    <social.icon className={`w-5 h-5 ${textColorMutedClass}`} style={{ color: social.color }} />
                  </a>
                ))}
              </div>

              <div 
                className={`mt-6 pt-6 border-t ${borderColorClass} flex flex-col items-center text-center`}
                style={{ borderTopColor: `${primaryColor}20` }}
              >
                <div 
                  className={`relative w-20 h-20 ${logoBgClass} rounded-xl p-1.5 shadow-lg mb-3 overflow-hidden`}
                  style={{ border: `1px solid ${primaryColor}30` }}
                >
                  {logoUrl && logoUrl !== '/imagenes/logo-default.png' ? (
                    <Image
                      src={logoUrl}
                      alt={sanitizeTextField(institucion?.institucion_nombre, 50) || 'Logo'}
                      fill
                      sizes="(max-width: 768px) 100px, (max-width: 1200px) 150px, 200px"
                      className="object-contain p-2"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = document.createElement('div');
                        fallback.className = `flex items-center justify-center w-full h-full ${textColorDimmedClass}`;
                        fallback.innerHTML = `
                          <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                          </svg>
                        `;
                        if (target.parentElement) {
                          target.parentElement.appendChild(fallback);
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <GraduationCap className={`w-10 h-10 ${textColorDimmedClass}`} />
                    </div>
                  )}
                </div>
                <p className={`text-xs ${textColorDimmedClass} font-medium`}>
                  {institucion?.institucion_nombre || 'Facultad'}
                </p>
                <p className={`text-xs ${textColorFaintClass} mt-1`}>
                  {institucion?.institucion_iniciales || 'UPEA'}
                </p>
              </div>
            </div>
          </div>

          <div 
            className={`border-t ${borderColorClass} pt-8`}
            style={{ borderTopColor: `${primaryColor}20` }}
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className={`text-sm ${textColorFaintClass} text-center md:text-left`}>
                &copy; {new Date().getFullYear()} {institucion?.institucion_nombre || 'UPEA'}.
                <br className="md:hidden" />
                <span className="hidden md:inline"> Todos los derechos reservados.</span>
              </p>
              
              <a 
                href={process.env.NEXT_PUBLIC_UTIC_URL || 'https://utic.upea.bo'}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${hoverBgClass} transition-colors group`}
                style={{ border: `1px solid ${primaryColor}30` }}
              >
                <div className={`relative w-8 h-8 ${uticBgClass} rounded-full overflow-hidden p-1`}>
                  <Image 
                    src="/imagenes/logo_utic.png" 
                    alt="UTIC UPEA" 
                    width={32} 
                    height={32}
                    className="object-contain"
                  />
                </div>
                <span className={`text-sm ${textColorMutedClass} group-hover:${isLightBackground ? 'text-gray-900' : 'text-white'} font-medium`}>
                  utic.upea.bo
                </span>
                <ExternalLink className={`w-3 h-3 ${textColorFaintClass} group-hover:${isLightBackground ? 'text-gray-600' : 'text-white/80'}`} />
              </a>
            </div>
          </div>

        </div>
      </footer>
    </ThemeDynamicProvider>
  );
}