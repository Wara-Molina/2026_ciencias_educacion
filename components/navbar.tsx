// components/navbar.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronDown, Menu, X, LogIn, User, ExternalLink } from 'lucide-react';
import { useInstitucion } from '@/context/InstitucionContext';
import api from '@/lib/axios';

interface CursoItem {
  id: number;
  nombre: string;
  url: string;
  tipo: string;
}

interface ComunicadoItem {
  id: number;
  titulo: string;
  url: string;
  tipo: 'CONVOCATORIAS' | 'AVISOS' | 'COMUNICADOS';
}

interface EnlaceItem {
  id: number;
  nombre: string;
  url: string;
  tipo: string;
}

interface InvestigacionItem {
  id: number;
  titulo: string;
  url: string;
  tipo: 'gaceta' | 'evento' | 'publicacion';
}

interface Usuario {
  id: number;
  nombre: string;
  email: string;
}

const isLightColor = (hex: string): boolean => {
  const color = hex.replace('#', '');
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
};

const isValidUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export function Navbar() {
  const { institucion, loading: institucionLoading } = useInstitucion();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  
  const [cursosItems, setCursosItems] = useState<CursoItem[]>([]);
  const [comunicadosItems, setComunicadosItems] = useState<ComunicadoItem[]>([]);
  const [enlacesItems, setEnlacesItems] = useState<EnlaceItem[]>([]);
  const [investigacionItems, setInvestigacionItems] = useState<InvestigacionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const primaryColor = institucion?.colorinstitucion?.[0]?.color_primario || '#04246C';
  const secondaryColor = institucion?.colorinstitucion?.[0]?.color_secundario || '#FC0102';
  const tertiaryColor = institucion?.colorinstitucion?.[0]?.color_terciario || '#020733';

  const isLightBackground = isLightColor(tertiaryColor);
  const textColorClass = isLightBackground ? 'text-gray-900' : 'text-white';
  const textColorHoverClass = isLightBackground ? 'hover:text-gray-700' : 'hover:text-white';
  const textColorMutedClass = isLightBackground ? 'text-gray-600' : 'text-white/70';
  const textColorDimmedClass = isLightBackground ? 'text-gray-500' : 'text-white/60';
  const borderColorClass = isLightBackground ? 'border-gray-200' : 'border-white/10';
  const hoverBgClass = isLightBackground ? 'hover:bg-gray-100' : 'hover:bg-white/10';
  const dropdownBgClass = isLightBackground ? 'bg-white' : tertiaryColor;
  const dropdownTextClass = isLightBackground ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100' : 'text-white/90 hover:text-white hover:bg-white/10';

  const logoUrl = institucion?.institucion_logo || '/imagenes/logo-default.png';

  useEffect(() => {
    const fetchDynamicItems = async () => {
      try {
        setLoading(true);
        const institucionId = process.env.NEXT_PUBLIC_INSTITUCION_ID || 12;
        
        const gacetaEventosRes = await api.get(`/institucion/${institucionId}/gacetaEventos`);
        
        if (gacetaEventosRes.data?.cursos) {
          const cursosFiltrados = gacetaEventosRes.data.cursos
            .filter((c: any) => c.det_estado === "1" && c.tipo_curso_otro)
            .map((c: any) => ({
              id: c.iddetalle_cursos_academicos,
              nombre: c.det_titulo,
              url: `/cursos/${c.iddetalle_cursos_academicos}`,
              tipo: c.tipo_curso_otro.tipo_conv_curso_nombre?.toUpperCase() || 'CURSOS',
            }));
          setCursosItems(cursosFiltrados);
        }

        if (gacetaEventosRes.data?.convocatorias) {
          const comunicadosFiltrados = gacetaEventosRes.data.convocatorias
            .filter((c: any) => c.con_estado === "1" && c.tipo_conv_comun)
            .map((c: any) => ({
              id: c.idconvocatorias,
              titulo: c.con_titulo,
              url: `/comunicados/${c.idconvocatorias}`,
              tipo: c.tipo_conv_comun.tipo_conv_comun_titulo?.toUpperCase() || 'COMUNICADOS',
            }));
          setComunicadosItems(comunicadosFiltrados);
        }

        const recursosRes = await api.get(`/institucion/${institucionId}/recursos`);
        if (recursosRes.data?.linksExternoInterno) {
          const enlacesFiltrados = recursosRes.data.linksExternoInterno
            .filter((l: any) => l.estado === 1)
            .map((l: any) => ({
              id: l.id_link,
              nombre: l.nombre,
              url: l.url_link,
              tipo: l.tipo,
            }));
          setEnlacesItems(enlacesFiltrados);
        }

        const investigacion: InvestigacionItem[] = [];
        
        if (gacetaEventosRes.data?.upea_gaceta_universitaria) {
          const gacetasInv = gacetaEventosRes.data.upea_gaceta_universitaria
            .filter((g: any) => g.gaceta_tipo === "INSTITUTO DE INVESTIGACION")
            .map((g: any) => ({
              id: g.gaceta_id,
              titulo: g.gaceta_titulo,
              url: g.gaceta_documento || '#',
              tipo: 'gaceta' as const,
            }));
          investigacion.push(...gacetasInv);
        }
        
        if (gacetaEventosRes.data?.upea_evento) {
          const eventosInv = gacetaEventosRes.data.upea_evento
            .filter((e: any) => e.tipo_evento === "INSTITUTO DE INVESTIGACION")
            .map((e: any) => ({
              id: e.evento_id,
              titulo: e.evento_titulo,
              url: `/eventos/${e.evento_id}`,
              tipo: 'evento' as const,
            }));
          investigacion.push(...eventosInv);
        }
        
        if (recursosRes.data?.upea_publicaciones) {
          const pubsInv = recursosRes.data.upea_publicaciones
            .filter((p: any) => p.publicaciones_tipo === "INSTITUTO DE INVESTIGACION")
            .map((p: any) => ({
              id: p.publicaciones_id,
              titulo: p.publicaciones_titulo,
              url: `/publicaciones/${p.publicaciones_id}`,
              tipo: 'publicacion' as const,
            }));
          investigacion.push(...pubsInv);
        }
        
        setInvestigacionItems(investigacion);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(' Navbar: Error cargando items dinámicos', error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDynamicItems();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      setUsuario({ id: 1, nombre: 'Usuario', email: 'user@example.com' });
    }
  }, []);

  useEffect(() => {
    return () => {
      if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    };
  }, []);

  const handleDropdownEnter = (label: string) => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setOpenDropdown(label);
  };

  const handleDropdownLeave = () => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    dropdownTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 150);
  };

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const getCursosByTipo = (tipo: string) => cursosItems.filter(c => c.tipo === tipo);
  const getComunicadosByTipo = (tipo: ComunicadoItem['tipo']) => comunicadosItems.filter(c => c.tipo === tipo);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setUsuario(null);
    setUserMenuOpen(false);
    window.location.href = '/';
  };

  const handleLinkClick = (isMobile: boolean, isExternal: boolean = false) => {
    if (isMobile) setMobileMenuOpen(false);
    if (!isExternal) {
      setTimeout(() => setOpenDropdown(null), 100);
    }
  };

  const menuItems = [
    { label: 'Inicio', href: '/' },
    { 
      label: 'Información', 
      items: [
        { label: 'Misión y Visión', href: '/informacion?section=mision-vision' },
        { label: 'Autoridades', href: '/informacion?section=autoridades' },
        { label: 'Historia', href: '/informacion?section=historia' },
        { label: 'Ubicación', href: '/informacion?section=ubicacion' },
      ]
    },
    { label: 'Cursos', href: '/cursos' },  
    { 
      label: 'Comunicados', 
      items: [
        { label: `Convocatorias (${getComunicadosByTipo('CONVOCATORIAS').length})`, href: '/comunicados?tipo=CONVOCATORIAS' },
        { label: `Avisos (${getComunicadosByTipo('AVISOS').length})`, href: '/comunicados?tipo=AVISOS' },
        { label: `Comunicados (${getComunicadosByTipo('COMUNICADOS').length})`, href: '/comunicados?tipo=COMUNICADOS' },
      ]
    },
    { 
      label: 'Instituto de Investigación', 
      href: '/institutoInvestigacion',
    },
    { 
      label: 'Más', 
      items: [
        { label: 'Publicaciones', href: '/publicaciones' },
        { label: 'Eventos', href: '/eventos' },
        { label: 'Gacetas', href: '/gacetas' },
        { label: 'Videos', href: '/videos' },
        { label: 'Contacto', href: '/contacto' },
        { label: 'Sedes', href: '/sedes' },
        { label: '─'.repeat(25), href: '#', separator: true },
        ...(enlacesItems.length > 0 
          ? enlacesItems.map((enlace) => ({
              label: enlace.nombre,
              href: enlace.url,
              external: true,
            }))
          : [
              { label: 'Campus Virtual', href: '#', external: true },
              { label: 'Biblioteca', href: '#', external: true },
            ])
      ]
    },
  ];

  const renderDropdownItems = (items: any[], isMobile = false) => {
    return items.map((item: any, idx: number) => {
      if (item.separator) {
        return <div key={idx} className={`my-1 border-t ${borderColorClass}`} />;
      }
      
      if (item.external && isValidUrl(item.href)) {
        return (
          <a
            key={idx}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`block px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${dropdownTextClass}`}
            onClick={() => {
              if (isMobile) setMobileMenuOpen(false);
              setOpenDropdown(null);
            }}
          >
            {item.label}
            <ExternalLink className={`w-3 h-3 ${isLightBackground ? 'opacity-50' : 'opacity-50'}`} />
          </a>
        );
      }
      
      return (
        <Link
          key={idx}
          href={item.href || '#'}
          className={`block px-4 py-2.5 text-sm transition-colors ${dropdownTextClass}`}
          onClick={() => handleLinkClick(isMobile)}
        >
          {item.label}
        </Link>
      );
    });
  };

  return (
    <header 
      className="sticky top-0 z-50 w-full shadow-lg transition-colors duration-300"
      style={{ backgroundColor: tertiaryColor }}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex h-20 items-center justify-between gap-4">
          
          <Link href="/" className="relative flex items-center gap-3 group flex-shrink-0">
            <div 
              className="relative w-30 h-30 bg-white shadow-lg overflow-hidden transition-transform group-hover:scale-105 group-hover:shadow-xl flex items-center justify-center flex-shrink-0"
              style={{ transform: 'translateY(20%)', zIndex: 60 }}
            >
              {institucionLoading ? (
                <div className="w-full h-full bg-gray-100 animate-pulse" />
              ) : (
                <div className="relative w-full h-full">
                  <Image
                    src={logoUrl}
                    alt={institucion?.institucion_nombre || 'Logo'}
                    fill
                    sizes="(max-width: 768px) 100px, (max-width: 1200px) 150px, 200px"
                    className="object-contain p-2"
                    priority
onError={(e) => {
  const imgElement = e.currentTarget;
  
  // Ocultar la imagen fallida
  imgElement.style.display = 'none';
  
  // Crear fallback seguro
  const fallback = document.createElement('div');
  fallback.className = `flex items-center justify-center w-full h-full ${textColorDimmedClass}`;
  fallback.innerHTML = `
    <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
    </svg>
  `;
  
  // Insertar fallback después de la imagen
  if (imgElement.parentElement) {
    imgElement.parentElement.appendChild(fallback);
  }
}}
                  />
                </div>
              )}
            </div>
            
            <div className="hidden xl:block">
              <h1 className={`font-bold text-lg leading-tight ${textColorClass}`}>
                {institucion?.institucion_nombre || 'Ciencias de la Educación'}
              </h1>
              <p className={`${textColorMutedClass} text-xs font-medium`}>
                {institucion?.institucion_iniciales || 'UPEA'}
              </p>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-0 flex-1 justify-center">
            {menuItems.map((item) => (
              <div key={item.label} className="relative">
                {item.href ? (
                  <Link
                    href={item.href}
                    className={`px-4 py-2.5 text-sm font-medium transition-colors ${textColorClass} ${textColorHoverClass}`}
                    onMouseEnter={() => handleDropdownLeave()}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <>
                    <button
                      className={`px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-1 ${textColorClass} ${textColorHoverClass}`}
                      onMouseEnter={() => handleDropdownEnter(item.label)}
                      onMouseLeave={handleDropdownLeave}
                      onClick={() => toggleDropdown(item.label)}
                      aria-expanded={openDropdown === item.label}
                      aria-haspopup="true"
                      aria-controls={`dropdown-${item.label}`}
                    >
                      {item.label}
                      <ChevronDown 
                        className={`w-3 h-3 transition-transform duration-200 ${
                          openDropdown === item.label ? 'rotate-180' : ''
                        } ${isLightBackground ? 'text-gray-600' : 'text-white/70'}`}
                      />
                    </button>
                    
                    {item.items && openDropdown === item.label && (
                      <div 
                        id={`dropdown-${item.label}`}
                        role="menu"
                        className={`absolute top-full left-0 mt-0 w-56 rounded-lg shadow-xl py-2 z-50 max-h-96 overflow-y-auto border ${borderColorClass}`}
                        style={{ backgroundColor: dropdownBgClass }}
                        onMouseEnter={() => handleDropdownEnter(item.label)}
                        onMouseLeave={handleDropdownLeave}
                      >
                        {renderDropdownItems(item.items)}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </nav>

          <div className="flex items-center gap-3 flex-shrink-0">
            {usuario ? (
              <div className="relative">
                <button
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 font-medium text-xs transition-all hover:shadow-lg ${textColorClass}`}
                  style={{ borderColor: secondaryColor }}
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  onMouseEnter={() => handleDropdownLeave()}
                >
                  <User className="w-4 h-4" />
                  <span className="hidden xl:inline">{usuario.nombre}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${userMenuOpen ? 'rotate-180' : ''} ${isLightBackground ? 'text-gray-600' : 'text-white/70'}`} />
                </button>
                
                {userMenuOpen && (
                  <div 
                    className={`absolute top-full right-0 mt-2 w-48 rounded-lg shadow-xl py-2 z-50 border ${borderColorClass}`}
                    style={{ backgroundColor: dropdownBgClass }}
                    onMouseEnter={() => setUserMenuOpen(true)}
                    onMouseLeave={() => setUserMenuOpen(false)}
                  >
                    <Link 
                      href="/perfil" 
                      className={`block px-4 py-2 text-sm transition-colors ${dropdownTextClass}`}
                      onClick={() => { setUserMenuOpen(false); setOpenDropdown(null); }}
                    >
                      Mi Perfil
                    </Link>
                    <Link 
                      href="/dashboard" 
                      className={`block px-4 py-2 text-sm transition-colors ${dropdownTextClass}`}
                      onClick={() => { setUserMenuOpen(false); setOpenDropdown(null); }}
                    >
                      Dashboard
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${isLightBackground ? 'text-red-600 hover:bg-red-50' : 'text-red-400 hover:bg-white/10'}`}
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <a
                href="https://servicioadministrador.upea.bo"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-xs overflow-hidden transition-all hover:shadow-xl hover:-translate-y-0.5 flex-shrink-0"
                style={{ backgroundColor: secondaryColor, color: '#ffffff' }}
                onMouseEnter={() => handleDropdownLeave()}
              >
                <LogIn className="w-4 h-4 relative z-10" />
                <span className="relative z-10 hidden sm:inline">Iniciar Sesión</span>
                <span className="relative z-10 sm:hidden">Login</span>
              </a>
            )}

            <button 
              className={`lg:hidden p-2 rounded-lg transition-colors ${textColorClass} ${hoverBgClass}`}
              onClick={() => { setMobileMenuOpen(!mobileMenuOpen); setOpenDropdown(null); }}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div 
          className={`lg:hidden border-t ${borderColorClass}`}
          style={{ backgroundColor: tertiaryColor }}
        >
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-2 max-h-[80vh] overflow-y-auto">
            <Link
              href="/"
              className={`block px-4 py-3 text-sm font-medium rounded-lg ${textColorClass} ${hoverBgClass}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Inicio
            </Link>
            
            {menuItems.map((item) => (
              <div key={item.label} className={`border-b ${borderColorClass} last:border-0`}>
                {item.href ? (
                  <Link
                    href={item.href}
                    className={`block px-4 py-3 text-sm font-medium rounded-lg ${textColorClass} ${hoverBgClass}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <>
                    <button
                      className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg ${textColorClass} ${hoverBgClass}`}
                      onClick={() => toggleDropdown(item.label)}
                      aria-expanded={openDropdown === item.label}
                      aria-haspopup="true"
                    >
                      {item.label}
                      <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === item.label ? 'rotate-180' : ''} ${isLightBackground ? 'text-gray-600' : 'text-white/70'}`} />
                    </button>
                    {openDropdown === item.label && item.items && (
                      <div className="ml-4 mt-1 space-y-1 pb-2" role="menu">
                        {renderDropdownItems(item.items, true)}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}

            <div className={`pt-4 border-t ${borderColorClass}`}>
              {usuario ? (
                <div className="space-y-2">
                  <div className={`px-4 py-3 rounded-lg ${isLightBackground ? 'bg-gray-100' : 'bg-white/10'}`}>
                    <p className={`text-sm font-medium ${textColorClass}`}>{usuario.nombre}</p>
                    <p className={`text-xs ${textColorMutedClass}`}>{usuario.email}</p>
                  </div>
                  <Link 
                    href="/perfil" 
                    className={`block px-4 py-3 text-sm rounded-lg ${textColorClass} ${hoverBgClass}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Mi Perfil
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className={`w-full text-left px-4 py-3 text-sm rounded-lg ${isLightBackground ? 'text-red-600 hover:bg-red-50' : 'text-red-400 hover:bg-white/10'}`}
                  >
                    Cerrar Sesión
                  </button>
                </div>
              ) : (
                <a
                  href="https://servicioadministrador.upea.bo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-full font-semibold text-sm"
                  style={{ backgroundColor: secondaryColor, color: '#ffffff' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LogIn className="w-4 h-4" />
                  Iniciar Sesión
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}