'use client';

import { ArrowRight, ChevronLeft, ChevronRight, Calendar, MapPin, Clock, Sparkles, Zap, Code, Users, TrendingUp, Lock, FileText, ExternalLink, BookOpen, GraduationCap, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import { sanitizeHTML } from '@/lib/sanitize';
import ThemeDynamicProvider from '@/components/providers/ThemeDynamicProvider';
import CalendarWidget from './CalendarWidget';
import { useInstitucion } from '@/context/InstitucionContext';

interface ColorInstitucion {
  color_primario: string;
  color_secundario: string;
  color_terciario: string;
}

interface Institucion {
  institucion_id: number;
  institucion_nombre: string;
  institucion_iniciales: string;
  institucion_logo: string;
  institucion_mision: string;
  institucion_vision: string;
  institucion_facebook?: string;
  institucion_youtube?: string;
  institucion_twitter?: string;
  institucion_direccion?: string;
  institucion_correo1?: string;
  institucion_celular1?: number;
  institucion_celular2?: number;
  institucion_api_google_map?: string;
  colorinstitucion: ColorInstitucion[];
}

interface Portada {
  portada_id: number;
  portada_imagen: string;
  portada_titulo: string;
  portada_subtitulo: string;
}

interface Convocatoria {
  idconvocatorias: number;
  con_titulo: string;
  con_descripcion: string;
  con_foto_portada?: string;
  con_fecha_inicio: string;
  con_fecha_fin: string;
  con_estado: string;
  tipo_conv_comun?: { tipo_conv_comun_titulo: string };
}

interface Curso {
  iddetalle_cursos_academicos: number;
  det_titulo: string;
  det_descripcion: string;
  det_img_portada?: string;
  det_modalidad: string;
  det_costo: number;
  det_cupo_max: number;
  det_carga_horaria: number;
  det_estado: string;
}

interface ApiData {
  inst: Institucion;
  dinamico: {
    convocatorias: Convocatoria[];
    cursos: Curso[];
    gacetas: any[];
    eventos: any[];
  };
  institucional: {
    portada: Portada[];
    autoridad: any[];
    upea_videos: any[];
    ubicacion: any[];
  };
  recursos: {
    upea_publicaciones: any[];
    linksExternoInterno: Array<{
      id_link: number;
      nombre: string;
      url_link: string;
      imagen?: string;
      estado: number;
      tipo: string;
    }>;
  };
}

const isValidHexColor = (color: string | undefined): boolean => {
  if (!color) return false;
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
};

const getSafeColor = (color: string | undefined, fallback: string): string => {
  return isValidHexColor(color) ? color! : fallback;
};

const isValidResourceUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  try {
    const urlToParse = url.startsWith('http') ? url : `https://${url}`;
    const parsed = new URL(urlToParse);
    return ['https:'].includes(parsed.protocol) && 
           (parsed.hostname.includes('upea.bo') || 
            parsed.hostname.includes('localhost') ||
            parsed.hostname.includes('127.0.0.1')) &&
           !parsed.pathname.includes('<') &&
           !parsed.pathname.includes('javascript:');
  } catch {
    return false;
  }
};

const sanitizeTextField = (text: string | undefined, maxLength = 500): string => {
  if (!text) return '';
  return sanitizeHTML(text).replace(/<[^>]*>/g, '').trim().slice(0, maxLength);
};

const getImageUrl = (imagenPath: string | undefined): string | undefined => {
  if (!imagenPath) return undefined;
  if (imagenPath.startsWith('http://') || imagenPath.startsWith('https://')) {
    return isValidResourceUrl(imagenPath) ? imagenPath : undefined;
  }
  const storageUrl = process.env.NEXT_PUBLIC_STORAGE_URL || 'https://apiadministrador.upea.bo/storage';
  return `${storageUrl}/${imagenPath}`;
};

const useEducacionData = (institucionId: number) => {
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isInteger(institucionId) || institucionId <= 0 || institucionId >= 1000000) {
      setLoading(false);
      setError('ID de institución inválido');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'https://apiadministrador.upea.bo/api/v2';
        
        const [instRes, dinamicoRes, institucionalRes, recursosRes] = await Promise.all([
          api.get(`${API_BASE_URL}/institucionesPrincipal/${institucionId}`),
          api.get(`${API_BASE_URL}/institucion/${institucionId}/gacetaEventos`),
          api.get(`${API_BASE_URL}/institucion/${institucionId}/contenido`),
          api.get(`${API_BASE_URL}/institucion/${institucionId}/recursos`),
        ]);

        setData({
          inst: {
            ...instRes.data.Descripcion,
            institucion_nombre: sanitizeTextField(instRes.data.Descripcion?.institucion_nombre, 100),
            institucion_iniciales: sanitizeTextField(instRes.data.Descripcion?.institucion_iniciales, 20),
            institucion_mision: sanitizeHTML(instRes.data.Descripcion?.institucion_mision || ''),
          },
          dinamico: {
            convocatorias: (dinamicoRes.data.convocatorias || []).map((c: any) => ({
              ...c,
              con_titulo: sanitizeTextField(c.con_titulo, 200),
              con_descripcion: sanitizeHTML(c.con_descripcion || ''),
            })),
            cursos: (dinamicoRes.data.cursos || []).map((c: any) => ({
              ...c,
              det_titulo: sanitizeTextField(c.det_titulo, 200),
              det_descripcion: sanitizeHTML(c.det_descripcion || ''),
            })),
            gacetas: dinamicoRes.data.upea_gaceta_universitaria || [],
            eventos: dinamicoRes.data.upea_evento || [],
          },
          institucional: {
            portada: (institucionalRes.data.portada || []).map((p: any) => ({
              ...p,
              portada_titulo: sanitizeTextField(p.portada_titulo, 200),
              portada_subtitulo: sanitizeTextField(p.portada_subtitulo, 300),
            })),
            autoridad: institucionalRes.data.autoridad || [],
            upea_videos: institucionalRes.data.upea_videos || [],
            ubicacion: institucionalRes.data.ubicacion || [],
          },
          recursos: {
            upea_publicaciones: recursosRes.data.upea_publicaciones || [],
            linksExternoInterno: (recursosRes.data.linksExternoInterno || [])
              .filter((l: any) => l.estado === 1)
              .map((l: any) => ({
                ...l,
                nombre: sanitizeTextField(l.nombre, 50),
                url_link: isValidResourceUrl(l.url_link) ? l.url_link : '#',
              })),
          },
        });
      } catch (err: any) {
        if (process.env.NODE_ENV === 'development') {
          console.error('HomePage: Error fetching data', err);
        }
        setError(err.response?.status === 403 ? 'Error de autenticación con la API' : 'Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [institucionId]);

  return { data, loading, error };
};

export default function Home() {
  const { institucion: institucionContext, loading: contextLoading } = useInstitucion();

  const rawId = institucionContext?.institucion_id;
  const institucionId = rawId !== undefined && Number.isInteger(rawId) && rawId > 0 && rawId < 1000000 
    ? rawId 
    : 12;
  
  const { data, loading: dataLoading, error } = useEducacionData(institucionId);

  const getDesignTheme = (id: number): 'educacion' | 'moderno' | 'minimalista' => {
    if (id === 18) return 'moderno';
    if (id === 20) return 'minimalista';
    return 'educacion';
  };

  const designTheme = getDesignTheme(institucionId);

  const institucionData = data?.inst;
  const portadas = data?.institucional?.portada || [];
  const convocatorias = data?.dinamico?.convocatorias?.filter((c: any) => c.con_estado === "1").slice(0, 4) || [];
  const cursos = data?.dinamico?.cursos?.filter((c: any) => c.det_estado === "1").slice(0, 3) || [];
  const enlaces = data?.recursos?.linksExternoInterno?.slice(0, 6) || [];
  
  const colores = institucionContext?.colorinstitucion?.[0] || institucionData?.colorinstitucion?.[0];
  const primaryColor = getSafeColor(colores?.color_primario, designTheme === 'moderno' ? '#06b6d4' : '#f56224');
  const secondaryColor = getSafeColor(colores?.color_secundario, designTheme === 'moderno' ? '#06b6d4' : '#0A02B0');
  const tertiaryColor = getSafeColor(colores?.color_terciario, '#020733');
  const dynamicColors = colores ? { primary: primaryColor, secondary: secondaryColor, tertiary: tertiaryColor } : undefined;

  if (contextLoading || dataLoading) {
    return (
      <ThemeDynamicProvider colors={dynamicColors}>
        <div className={`min-h-screen flex items-center justify-center ${designTheme === 'moderno' ? 'bg-slate-950' : 'bg-white'}`}>
          <div className="text-center">
            <div className={`w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4 ${designTheme === 'moderno' ? 'border-cyan-500/30 border-t-cyan-500' : 'border-primary/30 border-t-primary'}`} />
            <p className={designTheme === 'moderno' ? 'text-slate-400' : 'text-muted-foreground'}>Cargando...</p>
          </div>
        </div>
      </ThemeDynamicProvider>
    );
  }

  if (error || !data) {
    return (
      <ThemeDynamicProvider colors={dynamicColors}>
        <div className={`min-h-screen flex items-center justify-center ${designTheme === 'moderno' ? 'bg-slate-950' : 'bg-background'} p-4`}>
          <div className="text-center max-w-md">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className={`text-2xl font-bold mb-2 ${designTheme === 'moderno' ? 'text-white' : 'text-foreground'}`}>Error de conexión</h2>
            <p className={designTheme === 'moderno' ? 'text-slate-400' : 'text-muted-foreground'}>Error al cargar los datos</p>
            <button onClick={() => window.location.reload()} className="mt-4 px-6 py-3 rounded-lg font-medium text-white" style={{ backgroundColor: primaryColor }}>Reintentar</button>
          </div>
        </div>
      </ThemeDynamicProvider>
    );
  }

  switch (designTheme) {
    case 'moderno':
      return <ModernDarkDesign data={data} institucionContext={institucionContext} institucionData={institucionData} portadas={portadas} cursos={cursos} convocatorias={convocatorias} enlaces={enlaces} primaryColor={primaryColor} secondaryColor={secondaryColor} tertiaryColor={tertiaryColor} dynamicColors={dynamicColors} />;
    case 'minimalista':
      return <DiseñoDesign data={data} institucionContext={institucionContext} institucionData={institucionData} portadas={portadas} cursos={cursos} convocatorias={convocatorias} enlaces={enlaces} primaryColor={primaryColor} secondaryColor={secondaryColor} tertiaryColor={tertiaryColor} dynamicColors={dynamicColors} />;
    case 'educacion':
    default:
      return <EducacionDesign data={data} institucionContext={institucionContext} institucionData={institucionData} portadas={portadas} cursos={cursos} convocatorias={convocatorias} enlaces={enlaces} primaryColor={primaryColor} secondaryColor={secondaryColor} tertiaryColor={tertiaryColor} dynamicColors={dynamicColors} />;
  }
}

function EducacionDesign({ data, institucionContext, institucionData, portadas, cursos, convocatorias, enlaces, primaryColor, secondaryColor, tertiaryColor, dynamicColors }: any) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide(index);
    setTimeout(() => setIsTransitioning(false), 600);
  }, [isTransitioning]);

  useEffect(() => {
    if (portadas.length <= 1) return;
    const interval = setInterval(() => setCurrentSlide((prev) => (prev + 1) % portadas.length), 5000);
    return () => clearInterval(interval);
  }, [portadas.length]);

  const isValidYouTubeUrl = (url: string): boolean => {
    try {
      const parsed = new URL(url);
      return (parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be')) && parsed.pathname.includes('/embed/');
    } catch { return false; }
  };

  const videoUrl = data?.institucional?.upea_videos?.[0]?.video_enlace;
  const safeVideoUrl = videoUrl && isValidYouTubeUrl(videoUrl) ? videoUrl : null;

  const renderStatCard = ({ icon, label, value, hasData, href, color, static: isStatic = false }: any) => {
    const safeColor = getSafeColor(color, '#f56224');
    const cardContent = (
      <>
        <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center">{icon}</div>
        <p className="text-white/70 text-sm mb-2">{label}</p>
        <p className="text-3xl md:text-4xl font-bold" style={{ color: safeColor }}>{value}</p>
        {hasData && !isStatic && (
          <div className="mt-3 text-xs text-white/40 group-hover:text-white/70 transition-colors flex items-center justify-center gap-1">
            <span>Ver más</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </div>
        )}
      </>
    );
    if (hasData && !isStatic) {
      return <Link href={href} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center hover:bg-white/10 transition-all duration-300 hover:-translate-y-2 group cursor-pointer block">{cardContent}</Link>;
    }
    return <div className={`bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center transition-all duration-300 ${hasData ? 'hover:bg-white/10 hover:-translate-y-2 group cursor-pointer' : 'opacity-60'}`}>{cardContent}</div>;
  };

  return (
    <ThemeDynamicProvider colors={dynamicColors}>
      <div className="flex flex-col min-h-screen bg-white text-gray-900">
        <section className="relative h-[80vh] sm:h-[90vh] min-h-[500px] sm:min-h-[600px] overflow-hidden">
          <div className="flex h-full transition-transform duration-700 ease-out" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
            {portadas.length > 0 ? portadas.map((portada: any) => {
              const bgUrl = getImageUrl(portada.portada_imagen);
              return (
                <div key={portada.portada_id} className="w-full flex-shrink-0 relative">
                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: bgUrl ? `url('${bgUrl}')` : 'none' }} />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
                </div>
              );
            }) : <div className="w-full flex-shrink-0" style={{ background: `linear-gradient(135deg, ${primaryColor}40, ${secondaryColor}30)` }} />}
          </div>
          <div className="absolute inset-0 z-10 flex items-center">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
              <div className="max-w-3xl">
                <div className="inline-block px-4 py-2 sm:px-6 sm:py-2 mb-4 sm:mb-6 rounded-full backdrop-blur-md border text-xs sm:text-sm font-semibold tracking-wide uppercase" style={{ backgroundColor: `${primaryColor}20`, borderColor: `${primaryColor}40`, color: '#fff' }}>
                  {sanitizeTextField(institucionContext?.institucion_iniciales || institucionData?.institucion_iniciales, 20) || 'UPEA'}
                </div>
                <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold text-white leading-tight tracking-tight" style={{ fontFamily: 'serif' }}>
                  {sanitizeTextField(institucionContext?.institucion_nombre || institucionData?.institucion_nombre, 100) || 'Ciencias de la Educación'}
                </h1>
                <div className="flex flex-wrap gap-3 sm:gap-4 mt-4 sm:mt-6">
                  <Link href="#cursos" className="inline-flex items-center px-6 py-3 sm:px-8 sm:py-4 font-semibold rounded transition-all hover:shadow-lg hover:-translate-y-0.5 text-sm sm:text-base" style={{ backgroundColor: primaryColor, color: '#ffffff' }}>Explorar Cursos <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" /></Link>
                  <Link href="#convocatorias" className="inline-flex items-center px-6 py-3 sm:px-8 sm:py-4 font-semibold rounded border-2 border-white/60 text-white backdrop-blur-sm hover:bg-white/10 transition-all text-sm sm:text-base">Ver Convocatorias</Link>
                </div>
              </div>
            </div>
          </div>
          {portadas.length > 1 && (
            <>
              <button onClick={() => goToSlide((currentSlide - 1 + portadas.length) % portadas.length)} className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white transition-all hover:bg-white/20 min-w-[44px] min-h-[44px] flex items-center justify-center"><ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" /></button>
              <button onClick={() => goToSlide((currentSlide + 1) % portadas.length)} className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white transition-all hover:bg-white/20 min-w-[44px] min-h-[44px] flex items-center justify-center"><ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" /></button>
              <div className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-1 sm:gap-2">{portadas.map((_: any, index: number) => <button key={index} onClick={() => goToSlide(index)} className="rounded-full transition-all duration-300 bg-white/40 hover:bg-white/60" style={{ width: currentSlide === index ? '32px' : '8px', height: '4px', backgroundColor: currentSlide === index ? primaryColor : undefined }} />)}</div>
            </>
          )}
        </section>

        {enlaces.length > 0 && (
          <section className="py-12 sm:py-16 bg-gradient-to-b from-gray-50 to-white border-y relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            <div className="max-w-6xl mx-auto px-4 relative z-10">
              <h3 className="text-center text-xs sm:text-sm font-bold uppercase tracking-[0.2em] mb-8 sm:mb-12" style={{ color: secondaryColor }}>Accesos Directos</h3>
              <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
                {enlaces.map((link: any) => (
                  <a key={link.id_link} href={isValidResourceUrl(link.url_link) ? link.url_link : '#'} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 sm:gap-3 px-4 sm:px-8 py-3 sm:py-4 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 min-h-[44px]">
                    <span className="font-medium text-gray-800 group-hover:text-primary transition-colors text-sm sm:text-base">{sanitizeTextField(link.nombre, 50)}</span>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="py-16 sm:py-24 bg-gradient-to-br from-white via-gray-50/50 to-white relative">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl opacity-20" style={{ backgroundColor: primaryColor }} />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl opacity-20" style={{ backgroundColor: secondaryColor }} />
          <div className="max-w-6xl mx-auto px-4 relative z-10">
            <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
              <div className="relative">
                <div className="relative h-[300px] sm:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
                  <img src="/imagenes/imagen_upea.jpg" alt="Sobre la institución" className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 opacity-20" style={{ backgroundColor: primaryColor }} />
                </div>
                <div className="absolute -bottom-4 sm:-bottom-6 -right-4 sm:-right-6 w-32 sm:w-48 h-32 sm:h-48 rounded-2xl -z-10 shadow-xl" style={{ backgroundColor: `${primaryColor}20` }} />
              </div>
              <div>
                <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 leading-tight" style={{ color: primaryColor, fontFamily: 'serif' }}>{sanitizeTextField(institucionContext?.institucion_nombre || institucionData?.institucion_nombre, 100) || 'Nuestra Institución'}</h2>
                <div className="w-16 sm:w-20 h-1 mb-6 sm:mb-8 rounded-full" style={{ backgroundColor: secondaryColor }} />
                <div className="text-gray-700 text-base sm:text-lg leading-relaxed space-y-4" dangerouslySetInnerHTML={{ __html: sanitizeHTML(institucionData?.institucion_mision || '') }} />
                <div className="mt-8 sm:mt-10 grid grid-cols-2 gap-4 sm:gap-6">
                  <div className="p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-gray-200 shadow-sm"><div className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: primaryColor }}>15+</div><p className="text-xs sm:text-sm text-gray-600">Años de experiencia</p></div>
                  <div className="p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-gray-200 shadow-sm"><div className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: secondaryColor }}>5000+</div><p className="text-xs sm:text-sm text-gray-600">Estudiantes</p></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24 relative bg-cover bg-center bg-fixed" style={{ backgroundImage: `url('/imagenes/upea-noche.jpg')` }}>
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/95 via-gray-900/90 to-gray-800/95" />
          <div className="relative z-10 max-w-7xl mx-auto px-4">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4" style={{ fontFamily: 'serif' }}>Impacto Académico</h2>
              <p className="text-white/70 max-w-2xl mx-auto mb-4 sm:mb-6 text-sm sm:text-base">Conoce los números que respaldan nuestra trayectoria y compromiso con la excelencia educativa</p>
              <div className="w-20 sm:w-24 h-1 mx-auto rounded-full" style={{ backgroundColor: primaryColor }} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
              {renderStatCard({ icon: <svg className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>, label: 'Gacetas', value: data?.dinamico?.gacetas?.length || 0, hasData: (data?.dinamico?.gacetas?.length || 0) > 0, href: '/gacetas', color: primaryColor })}
              {renderStatCard({ icon: <svg className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>, label: 'Cursos Activos', value: data?.dinamico?.cursos?.filter((c: any) => c.det_estado === "1").length || 0, hasData: (data?.dinamico?.cursos?.filter((c: any) => c.det_estado === "1").length || 0) > 0, href: '/cursos', color: primaryColor })}
              {renderStatCard({ icon: <svg className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>, label: 'Publicaciones', value: data?.recursos?.upea_publicaciones?.length || 0, hasData: (data?.recursos?.upea_publicaciones?.length || 0) > 0, href: '/publicaciones', color: primaryColor })}
              {renderStatCard({ icon: <svg className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>, label: 'Eventos', value: data?.dinamico?.eventos?.length || 0, hasData: (data?.dinamico?.eventos?.length || 0) > 0, href: '/eventos', color: primaryColor })}
              {renderStatCard({ icon: <svg className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>, label: 'Convocatorias', value: data?.dinamico?.convocatorias?.filter((c: any) => c.con_estado === "1").length || 0, hasData: (data?.dinamico?.convocatorias?.filter((c: any) => c.con_estado === "1").length || 0) > 0, href: '/comunicados?tipo=CONVOCATORIAS', color: primaryColor })}
              {renderStatCard({ icon: <svg className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>, label: 'Autoridades', value: data?.institucional?.autoridad?.length || 0, hasData: (data?.institucional?.autoridad?.length || 0) > 0, href: '/informacion?section=autoridades', color: primaryColor })}
              {renderStatCard({ icon: <svg className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>, label: 'Videos', value: data?.institucional?.upea_videos?.length || 0, hasData: (data?.institucional?.upea_videos?.length || 0) > 0, href: '/videos', color: primaryColor })}
              {renderStatCard({ icon: <svg className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>, label: 'Enlaces', value: data?.recursos?.linksExternoInterno?.filter((l: any) => l.estado === 1).length || 0, hasData: (data?.recursos?.linksExternoInterno?.filter((l: any) => l.estado === 1).length || 0) > 0, href: '#', color: primaryColor, static: true })}
            </div>
            <div className="mt-8 sm:mt-12 text-center"><p className="text-white/50 text-xs sm:text-sm">Basado en datos actualizados de la Gestión {new Date().getFullYear()}</p></div>
          </div>
        </section>

        <section id="convocatorias" className="py-16 sm:py-20 bg-gray-50/80 relative">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-end justify-between mb-8 sm:mb-12 pb-4 border-b-2" style={{ borderColor: `${primaryColor}20` }}>
              <div><h2 className="text-2xl sm:text-4xl font-bold mb-1 sm:mb-2" style={{ color: primaryColor, fontFamily: 'serif' }}>Convocatorias</h2><p className="text-gray-600 text-sm sm:text-base">Oportunidades académicas y profesionales</p></div>
              <Link href="/comunicados?tipo=CONVOCATORIAS" className="text-xs sm:text-sm font-semibold hover:underline flex items-center gap-1 mt-3 sm:mt-0" style={{ color: primaryColor }}>Ver todas <ArrowRight className="w-3 h-4 sm:w-4 sm:h-4" /></Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
              {convocatorias.slice(0, 6).map((conv: any) => (
                <Link key={conv.idconvocatorias} href={`/comunicados/${conv.idconvocatorias}`} className="group block">
                  <article className="cursor-pointer bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    {conv.con_foto_portada && isValidResourceUrl(conv.con_foto_portada) && (
                      <div className="relative h-36 sm:h-48 mb-4 overflow-hidden rounded-lg">
                        <img src={getImageUrl(conv.con_foto_portada)} alt={sanitizeTextField(conv.con_titulo, 100)} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )}
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 text-xs">
                      <span className="px-2 sm:px-3 py-1 rounded-full font-semibold uppercase tracking-wide" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>{sanitizeTextField(conv.tipo_conv_comun?.tipo_conv_comun_titulo, 50) || 'Convocatoria'}</span>
                      <span className="text-gray-500 flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(conv.con_fecha_inicio).toLocaleDateString('es-BO')}</span>
                    </div>
                    <h3 className="font-bold text-base sm:text-lg mb-2 text-gray-900 group-hover:text-primary transition-colors line-clamp-2">{sanitizeTextField(conv.con_titulo, 200)}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-2" dangerouslySetInnerHTML={{ __html: sanitizeHTML(conv.con_descripcion || '') }} />
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="cursos" className="py-16 sm:py-24 relative overflow-hidden bg-cover bg-center bg-fixed" style={{ backgroundImage: `url('/imagenes/upea1.png')` }}>
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/95 via-gray-900/90 to-gray-800/95" />
          <div className="relative z-10 max-w-7xl mx-auto px-4">
            <div className="text-center mb-12 sm:mb-20">
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 text-white" style={{ fontFamily: 'serif' }}>Programas Académicos</h2>
              <p className="text-white/80 text-sm sm:text-lg max-w-3xl mx-auto">Explora nuestros diversos programas diseñados para inspirar la curiosidad, fomentar la innovación y prepararte para un futuro exitoso.</p>
              <div className="w-20 sm:w-24 h-1 mx-auto mt-4 sm:mt-6 rounded-full" style={{ backgroundColor: primaryColor }} />
            </div>
            <div className="space-y-8 sm:space-y-12">
              {cursos.slice(0, 3).map((curso: any, index: number) => (
                <div key={curso.iddetalle_cursos_academicos} className={`relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-white/20 transition-transform hover:-translate-y-2 ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`} style={{ boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.5)` }}>
                  <div className="absolute -top-4 sm:-top-6 right-4 sm:right-8 text-[80px] sm:text-[120px] md:text-[180px] font-bold leading-none select-none pointer-events-none" style={{ color: primaryColor, fontFamily: 'serif', opacity: 0.1 }}>{String(index + 1).padStart(2, '0')}</div>
                  <div className="grid md:grid-cols-2 gap-0">
                    <div className="relative h-48 sm:h-64 md:h-[500px] overflow-hidden">
                      {curso.det_img_portada && isValidResourceUrl(curso.det_img_portada) ? (
                        <img src={getImageUrl(curso.det_img_portada)} alt={sanitizeTextField(curso.det_titulo, 100)} className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" loading="lazy" />
                      ) : <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: `${primaryColor}10` }}><span className="text-4xl sm:text-6xl opacity-30">🎓</span></div>}
                      <div className="absolute inset-0" style={{ background: `linear-gradient(to right, ${primaryColor}40, transparent)` }} />
                    </div>
                    <div className="p-6 sm:p-8 md:p-12 flex flex-col justify-center relative z-10">
                      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 flex-wrap">
                        <span className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold uppercase tracking-wide" style={{ backgroundColor: curso.det_modalidad === 'PRESENCIAL' ? `${primaryColor}20` : `${secondaryColor}20`, color: curso.det_modalidad === 'PRESENCIAL' ? primaryColor : secondaryColor }}>{sanitizeTextField(curso.det_modalidad, 30)}</span>
                        {curso.det_costo > 0 && <span className="text-base sm:text-lg font-bold" style={{ color: primaryColor }}>Bs. {curso.det_costo}</span>}
                      </div>
                      <h3 className="text-xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-6 text-gray-900" style={{ fontFamily: 'serif' }}>{sanitizeTextField(curso.det_titulo, 200)}</h3>
                      <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-6 sm:mb-8 line-clamp-3 sm:line-clamp-none" dangerouslySetInnerHTML={{ __html: sanitizeHTML(curso.det_descripcion || '') }} />
                      <div className="flex flex-wrap gap-4 sm:gap-6 mb-6 sm:mb-8 text-xs sm:text-sm text-gray-600">
                        <div className="flex items-center gap-2"><Clock className="w-4 h-5" style={{ color: primaryColor }} /><span><strong className="text-gray-900">Duración:</strong> {curso.det_carga_horaria} horas</span></div>
                        <div className="flex items-center gap-2"><MapPin className="w-4 h-5" style={{ color: primaryColor }} /><span><strong className="text-gray-900">Cupos:</strong> {curso.det_cupo_max} disponibles</span></div>
                      </div>
                      <div className="space-y-2 sm:space-y-3">
                        <Link href={`/cursos/${curso.iddetalle_cursos_academicos}`} className="w-full py-3 sm:py-4 px-4 sm:px-6 rounded-full border-2 font-medium transition-all hover:shadow-md flex items-center justify-between group text-sm sm:text-base" style={{ borderColor: primaryColor, color: primaryColor }} onMouseEnter={(e: any) => { e.currentTarget.style.backgroundColor = primaryColor; e.currentTarget.style.color = '#ffffff'; }} onMouseLeave={(e: any) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = primaryColor; }}><span>Ver Detalles del Curso</span><ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transform group-hover:translate-x-1 transition-transform" /></Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {cursos.length > 3 && (
              <div className="text-center mt-12 sm:mt-16">
                <Link href="/cursos" className="inline-flex items-center px-8 sm:px-10 py-4 sm:py-5 rounded-full font-semibold text-sm sm:text-lg transition-all hover:shadow-xl hover:-translate-y-1 border-2 bg-white/10 backdrop-blur-sm" style={{ borderColor: 'rgba(255,255,255,0.3)', color: '#ffffff' }} onMouseEnter={(e: any) => { e.currentTarget.style.backgroundColor = primaryColor; e.currentTarget.style.borderColor = primaryColor; }} onMouseLeave={(e: any) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}>Ver Todos los Programas <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 sm:ml-3" /></Link>
              </div>
            )}
          </div>
        </section>

        <section className="py-16 sm:py-24 bg-gradient-to-br from-gray-50 via-white to-gray-100/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-10" style={{ backgroundColor: primaryColor }} />
          <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-10" style={{ backgroundColor: secondaryColor }} />
          <div className="max-w-6xl mx-auto px-4 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-12 pb-4 border-b-2" style={{ borderColor: `${primaryColor}20` }}>
              <div><h2 className="text-2xl sm:text-4xl font-bold mb-1 sm:mb-2" style={{ color: primaryColor, fontFamily: 'serif' }}>Eventos</h2><p className="text-gray-600 text-sm sm:text-base">Actividades académicas y culturales</p></div>
              <Link href="/eventos" className="text-xs sm:text-sm font-semibold hover:underline flex items-center gap-1 mt-3 sm:mt-0" style={{ color: primaryColor }}>Ver todos <ArrowRight className="w-3 h-4 sm:w-4 sm:h-4" /></Link>
            </div>
            <div className="grid lg:grid-cols-2 gap-6 sm:gap-12">
              <div className="space-y-4 sm:space-y-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Próximos Eventos</h3>
                {data?.dinamico?.eventos?.slice(0, 4).map((evento: any) => {
                  const eventoImagen = evento.evento_imagen && isValidResourceUrl(evento.evento_imagen) ? getImageUrl(evento.evento_imagen) : null;
                  return (
                    <Link key={evento.evento_id} href={`/eventos/${evento.evento_id}`} className="block group">
                      <article className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                        <div className="flex gap-3 sm:gap-4">
                          <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg flex flex-col items-center justify-center text-white shadow-lg" style={{ backgroundColor: primaryColor }}>
                            <span className="text-xs font-bold uppercase">{new Date(evento.evento_fecha).toLocaleDateString('es-BO', { month: 'short' })}</span>
                            <span className="text-xl sm:text-2xl font-bold">{new Date(evento.evento_fecha).getDate()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            {eventoImagen && (<div className="relative w-full h-24 sm:h-28 mb-3 rounded-lg overflow-hidden"><img src={eventoImagen} alt={sanitizeTextField(evento.evento_titulo, 100)} className="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" sizes="(max-width: 640px) 100vw, 200px" /></div>)}
                            <h4 className="font-bold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base line-clamp-2 group-hover:text-primary transition-colors">{sanitizeTextField(evento.evento_titulo, 200)}</h4>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs sm:text-sm text-gray-600 mb-2">
                              {evento.evento_hora && (<div className="flex items-center gap-1.5"><Clock className="w-3 h-4 flex-shrink-0" style={{ color: primaryColor }} /><span className="truncate">{evento.evento_hora.substring(0, 5)}</span></div>)}
                              {evento.evento_lugar && (<div className="flex items-center gap-1.5"><MapPin className="w-3 h-4 flex-shrink-0" style={{ color: primaryColor }} /><span className="truncate">{sanitizeTextField(evento.evento_lugar, 50)}</span></div>)}
                            </div>
                            {evento.evento_descripcion && (<p className="text-xs sm:text-sm text-gray-600 line-clamp-2" dangerouslySetInnerHTML={{ __html: sanitizeHTML(evento.evento_descripcion || '') }} />)}
                            <div className="mt-3 flex items-center gap-1 text-xs font-medium" style={{ color: primaryColor }}><span>Ver detalles</span><ArrowRight className="w-3 h-3 transform group-hover:translate-x-1 transition-transform" /></div>
                          </div>
                        </div>
                      </article>
                    </Link>
                  );
                })}
                {(!data?.dinamico?.eventos || data.dinamico.eventos.length === 0) && (
                  <div className="text-center py-8 sm:py-12 bg-white/50 rounded-xl border border-dashed border-gray-300">
                    <Calendar className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-500 text-sm sm:text-base">No hay eventos programados</p>
                    <p className="text-gray-400 text-xs mt-1">Próximamente se anunciarán nuevas actividades</p>
                  </div>
                )}
                {data?.dinamico?.eventos && data.dinamico.eventos.length > 4 && (
                  <div className="text-center pt-4">
                    <Link href="/eventos" className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium border-2 transition-all hover:shadow-md" style={{ borderColor: primaryColor, color: primaryColor }} onMouseEnter={(e: any) => { e.currentTarget.style.backgroundColor = primaryColor; e.currentTarget.style.color = '#fff'; }} onMouseLeave={(e: any) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = primaryColor; }}>Ver todos los eventos <ArrowRight className="w-4 h-4" /></Link>
                  </div>
                )}
              </div>
              <div className="lg:sticky lg:top-24 h-fit">
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-xl border border-gray-200">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2"><Calendar className="w-5 h-6" style={{ color: primaryColor }} />Calendario de Actividades</h3>
                  <CalendarWidget colores={{ color_primario: primaryColor, color_secundario: secondaryColor }} eventos={data?.dinamico?.eventos || []} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {data?.institucional?.upea_videos && data.institucional.upea_videos.length > 0 && safeVideoUrl && (
          <section className="py-16 sm:py-20 bg-white">
            <div className="max-w-5xl mx-auto px-4">
              <div className="text-center mb-8 sm:mb-12">
                <h2 className="text-2xl sm:text-4xl font-bold mb-3 sm:mb-4" style={{ color: primaryColor, fontFamily: 'serif' }}>Conoce Nuestra Carrera</h2>
                <p className="text-gray-600 text-sm sm:text-lg">Descubre nuestras actividades y logros</p>
              </div>
              {(() => {
                const primerVideo = data.institucional.upea_videos[0];
                return (
                  <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="relative" style={{ paddingBottom: '56.25%' }}>
                      <iframe src={safeVideoUrl} title={sanitizeTextField(primerVideo.video_titulo, 100) || 'Video institucional'} className="absolute inset-0 w-full h-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" sandbox="allow-scripts allow-same-origin allow-popups" />
                    </div>
                    <div className="p-6 sm:p-8 bg-white">
                      <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full mb-3 sm:mb-4 uppercase tracking-wide" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>{sanitizeTextField(primerVideo.video_tipo, 50)}</span>
                      <h3 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-4 text-gray-900">{sanitizeTextField(primerVideo.video_titulo, 200)}</h3>
                      <p className="text-gray-600 text-sm sm:text-base leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitizeHTML(primerVideo.video_breve_descripcion || '') }} />
                    </div>
                  </div>
                );
              })()}
            </div>
          </section>
        )}

        <div className="flex-1 bg-white" />
      </div>
    </ThemeDynamicProvider>
  );
}

// ARTES PLASTICAS
function ModernDarkDesign({ data, institucionContext, institucionData, portadas, cursos, convocatorias, enlaces, primaryColor, secondaryColor, tertiaryColor, dynamicColors }: any) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide(index);
    setTimeout(() => setIsTransitioning(false), 600);
  }, [isTransitioning]);

  useEffect(() => {
    if (portadas.length <= 1) return;
    const interval = setInterval(() => setCurrentSlide((prev) => (prev + 1) % portadas.length), 5000);
    return () => clearInterval(interval);
  }, [portadas.length]);

  const isValidYouTubeUrl = (url: string): boolean => {
    try {
      const parsed = new URL(url);
      return (parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be')) && parsed.pathname.includes('/embed/');
    } catch {
      return false;
    }
  };

  const videoUrl = data?.institucional?.upea_videos?.[0]?.video_enlace;
  const safeVideoUrl = videoUrl && isValidYouTubeUrl(videoUrl) ? videoUrl : null;

  return (
    <ThemeDynamicProvider colors={dynamicColors}>
      <div className="flex flex-col min-h-screen bg-slate-950 text-white">
        <section className="relative min-h-screen flex items-center justify-center pt-20 pb-16 px-4">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20" style={{ backgroundColor: primaryColor }} />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-20" style={{ backgroundColor: secondaryColor }} />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/80 to-slate-950" />
          </div>
          
          <div className="max-w-6xl mx-auto w-full relative z-10">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 mb-8">
                <Sparkles className="w-4 h-4" style={{ color: primaryColor }} />
                <span className="text-sm font-medium text-slate-300">Bienvenido a la</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight leading-tight">
                <span className="text-white">Carrera de</span><br />
                <span style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`, backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {sanitizeTextField(institucionContext?.institucion_nombre || institucionData?.institucion_nombre, 100) || 'Institución'}
                </span>
              </h1>
              
              <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10">
                {institucionData?.institucion_mision ? 
                  sanitizeTextField(institucionData.institucion_mision.replace(/<[^>]*>/g, ''), 150) : 
                  'Formación de profesionales altamente competentes'}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="#cursos" className="group inline-flex items-center justify-center px-8 py-3 rounded-lg font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/50 text-white" style={{ backgroundColor: primaryColor }}>
                  Explorar Cursos <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="#convocatorias" className="inline-flex items-center justify-center px-8 py-3 rounded-lg font-semibold border border-slate-700 text-white hover:bg-slate-900/50 transition-all duration-300">
                  Ver Convocatorias
                </Link>
              </div>
            </div>

            {portadas.length > 0 && (
              <div className="mt-8 relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl h-[500px] md:h-[600px]">
                <div className="flex h-full transition-transform duration-700 ease-out" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                  {portadas.map((portada: any) => {
                    const bgUrl = getImageUrl(portada.portada_imagen);
                    return (
                      <div key={portada.portada_id} className="w-full flex-shrink-0 relative">
                        {bgUrl && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${bgUrl}')` }} />}
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/60 via-slate-950/30 to-transparent" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center px-4">
                            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">{sanitizeTextField(portada.portada_titulo, 100)}</h2>
                            <p className="text-lg md:text-xl text-white/90">{sanitizeTextField(portada.portada_subtitulo, 200)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {portadas.length > 1 && (
                  <>
                    <button onClick={() => goToSlide((currentSlide - 1 + portadas.length) % portadas.length)} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700 text-white hover:bg-slate-800 transition-all">
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button onClick={() => goToSlide((currentSlide + 1) % portadas.length)} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700 text-white hover:bg-slate-800 transition-all">
                      <ChevronRight className="w-6 h-6" />
                    </button>
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                      {portadas.map((_: any, index: number) => (
                        <button 
                          key={index} 
                          onClick={() => goToSlide(index)} 
                          className="rounded-full transition-all duration-300" 
                          style={{ 
                            width: currentSlide === index ? '32px' : '8px', 
                            height: '6px', 
                            backgroundColor: currentSlide === index ? primaryColor : 'rgba(255,255,255,0.3)' 
                          }} 
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="py-20 px-4 relative bg-slate-900/50">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="relative">
                <div className="relative h-auto min-h-[400px] rounded-2xl overflow-visible shadow-2xl">
                  <img 
                    src="/imagenes/imagen_upea.jpg" 
                    alt={`Sobre ${institucionContext?.institucion_nombre || 'la institución'}`} 
                    className="w-full h-full object-contain" 
                    loading="lazy" 
                  />
                </div>
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: primaryColor }}>
                  {sanitizeTextField(institucionContext?.institucion_nombre|| institucionData?.institucion_iniciales, 20) || 'INSTITUCIÓN'}
                </h2>
                <div className="w-20 h-1 mb-6 rounded-full" style={{ backgroundColor: primaryColor }} />
                <div className="text-slate-300 leading-relaxed space-y-4 mb-8" dangerouslySetInnerHTML={{ __html: sanitizeHTML(institucionData?.institucion_mision || '') }} />
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800">
                    <div className="text-2xl font-bold mb-1" style={{ color: primaryColor }}>15+</div>
                    <p className="text-xs text-slate-400">Años de trayectoria</p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800">
                    <div className="text-2xl font-bold mb-1" style={{ color: primaryColor }}>5000+</div>
                    <p className="text-xs text-slate-400">Estudiantes activos</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {cursos.length > 0 && (
          <section id="cursos" className="py-20 px-4 relative">
            <div className="max-w-6xl mx-auto">
              <div className="mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Cursos Destacados</h2>
                <p className="text-slate-400">Programas diseñados para tu desarrollo profesional</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cursos.map((curso: any) => {
                  const cursoImagen = curso.det_img_portada 
                    ? getImageUrl(curso.det_img_portada)
                    : null;
                  
                  return (
                    <Link 
                      key={curso.iddetalle_cursos_academicos} 
                      href={`/cursos/${curso.iddetalle_cursos_academicos}`}
                      className="group rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 overflow-hidden transition-all duration-300 hover:-translate-y-2 block"
                    >
                      <div className="flex flex-col sm:flex-row">
                        <div className="sm:w-2/5 h-48 sm:h-auto relative overflow-hidden">
                          {cursoImagen ? (
                            <img 
                              src={cursoImagen} 
                              alt={sanitizeTextField(curso.det_titulo, 100)}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%231e293b" width="400" height="300"/%3E%3Ctext fill="%23475569" font-family="sans-serif" font-size="18" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ESin imagen%3C/text%3E%3C/svg%3E';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                              <Code className="w-12 h-12 text-cyan-400/50" />
                            </div>
                          )}
                        </div>
                        
                        <div className="sm:w-3/5 p-5 flex flex-col justify-between">
                          <div>
                            <h3 className="font-bold text-base mb-2 line-clamp-2 group-hover:text-cyan-400 transition-colors">
                              {sanitizeTextField(curso.det_titulo, 150)}
                            </h3>
                            <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                              {sanitizeTextField(curso.det_descripcion, 120)}
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-800">
                            <div className="flex items-center gap-1 text-cyan-400">
                              <Clock className="w-3 h-3" />
                              <span>{curso.det_carga_horaria}h</span>
                            </div>
                            <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-xs">
                              {sanitizeTextField(curso.det_modalidad, 20) || 'VIRTUAL'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {convocatorias.length > 0 && (
          <section id="convocatorias" className="py-20 px-4 relative bg-slate-900/30">
            <div className="max-w-6xl mx-auto">
              <div className="mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Convocatorias Abiertas</h2>
                <p className="text-slate-400">No esperes más, inscríbete ahora</p>
              </div>
              <div className="space-y-4">
                {convocatorias.slice(0, 3).map((conv: any) => {
                  const convImagen = conv.con_foto_portada 
                    ? getImageUrl(conv.con_foto_portada)
                    : null;
                  
                  return (
                    <Link
                      key={conv.idconvocatorias} 
                      href={`/comunicados/${conv.idconvocatorias}`}
                      className="group block rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="flex flex-col sm:flex-row">
                        <div className="sm:w-1/3 h-48 sm:h-auto relative overflow-hidden">
                          {convImagen ? (
                            <img 
                              src={convImagen} 
                              alt={sanitizeTextField(conv.con_titulo, 100)}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%231e293b" width="400" height="300"/%3E%3Ctext fill="%23475569" font-family="sans-serif" font-size="18" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ESin imagen%3C/text%3E%3C/svg%3E';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                              <FileText className="w-12 h-12 text-cyan-400/50" />
                            </div>
                          )}
                        </div>
                        <div className="sm:w-2/3 p-5 flex flex-col justify-center">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-bold text-lg mb-2 group-hover:text-cyan-400 transition-colors line-clamp-2">
                              {sanitizeTextField(conv.con_titulo, 200)}
                            </h3>
                            <TrendingUp className="w-5 h-5 text-cyan-400 flex-shrink-0 ml-2" />
                          </div>
                          
                          <div className="mb-3">
                            <span className="inline-block px-3 py-1 text-xs rounded-full bg-cyan-500/10 text-cyan-400 font-medium">
                              {sanitizeTextField(conv.tipo_conv_comun?.tipo_conv_comun_titulo, 50) || 'CONVOCATORIA'}
                            </span>
                          </div>
                          
                          <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                            {sanitizeTextField(conv.con_descripcion, 150)}
                          </p>
                          
                          <div className="flex flex-wrap gap-4 text-xs text-slate-400 pt-3 border-t border-slate-800">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>
                                <strong className="text-slate-300">Inicia:</strong> {new Date(conv.con_fecha_inicio).toLocaleDateString('es-BO')}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>
                                <strong className="text-slate-300">Finaliza:</strong> {new Date(conv.con_fecha_fin).toLocaleDateString('es-BO')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {data?.dinamico?.eventos && data.dinamico.eventos.length > 0 && (
          <section className="py-20 px-4 relative">
            <div className="max-w-6xl mx-auto">
              <div className="mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Calendario de Actividades</h2>
                <p className="text-slate-400">Próximos eventos y actividades académicas</p>
              </div>
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                  {data.dinamico.eventos.slice(0, 5).map((evento: any) => (
                    <Link 
                      key={evento.evento_id} 
                      href={`/eventos/${evento.evento_id}`}
                      className="block group"
                    >
                      <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 transition-all duration-300">
                        <div className="flex gap-4">
                          <div className="flex-shrink-0 w-16 h-16 rounded-lg flex flex-col items-center justify-center text-white" style={{ backgroundColor: primaryColor }}>
                            <span className="text-xs font-bold uppercase">{new Date(evento.evento_fecha).toLocaleDateString('es-BO', { month: 'short' })}</span>
                            <span className="text-2xl font-bold">{new Date(evento.evento_fecha).getDate()}</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-lg mb-1 group-hover:text-cyan-400 transition-colors">{sanitizeTextField(evento.evento_titulo, 150)}</h3>
                            <div className="flex gap-4 text-xs text-slate-400 mb-2">
                              {evento.evento_hora && <span>🕐 {evento.evento_hora.substring(0, 5)}</span>}
                              {evento.evento_lugar && <span>📍 {sanitizeTextField(evento.evento_lugar, 50)}</span>}
                            </div>
                            {evento.evento_descripcion && (
                              <p className="text-sm text-slate-400 line-clamp-2" dangerouslySetInnerHTML={{ __html: sanitizeHTML(evento.evento_descripcion) }} />
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="lg:sticky lg:top-24 h-fit">
                  <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5" style={{ color: primaryColor }} />
                      Vista del Mes
                    </h3>
                    <CalendarWidget 
                      colores={{ color_primario: primaryColor, color_secundario: secondaryColor }} 
                      eventos={data.dinamico.eventos} 
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {enlaces.length > 0 && (
          <section className="py-20 px-4 relative bg-slate-900/30">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Accesos Rápidos</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {enlaces.map((link: any) => (
                  <a 
                    key={link.id_link} 
                    href={isValidResourceUrl(link.url_link) ? link.url_link : '#'} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="group p-4 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-900 transition-all duration-300 hover:border-cyan-500/30 flex items-center justify-between"
                  >
                    <span className="font-medium text-white group-hover:text-cyan-400 transition-colors">{sanitizeTextField(link.nombre, 50)}</span>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        {safeVideoUrl && (
          <section className="py-20 px-4 relative bg-slate-950">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Conoce Nuestra Carrera</h2>
                <p className="text-slate-400">Descubre nuestras actividades y logros</p>
              </div>
              <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-2xl">
                <div className="relative" style={{ paddingBottom: '56.25%' }}>
                  <iframe 
                    src={safeVideoUrl} 
                    title="Video institucional" 
                    className="absolute inset-0 w-full h-full border-0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen 
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                    sandbox="allow-scripts allow-same-origin allow-popups"
                  />
                </div>
              </div>
            </div>
          </section>
        )}

      </div>
    </ThemeDynamicProvider>
  );
}

// MEDICINA VETERINARIA
function DiseñoDesign({ data, institucionContext, institucionData, portadas, cursos, convocatorias, enlaces, primaryColor, secondaryColor, tertiaryColor, dynamicColors }: any) {
  const hasPortadas = portadas && portadas.length > 0;
  const convocatoriasActivas = convocatorias.filter((c: any) => c.con_estado === '1' || c.con_estado === 'activo');
  const cursosActivos = cursos.filter((c: any) => c.det_estado === '1' || c.det_estado === 'activo');

  const isValidYouTubeUrl = (url: string): boolean => {
    try {
      const parsed = new URL(url);
      return (parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be')) && parsed.pathname.includes('/embed/');
    } catch {
      return false;
    }
  };

  const videoUrl = data?.institucional?.upea_videos?.[0]?.video_enlace;
  const safeVideoUrl = videoUrl && isValidYouTubeUrl(videoUrl) ? videoUrl : null;

  const CarouselSection = ({ portadas, primaryColor }: { portadas: any[]; primaryColor: string }) => {
    const [current, setCurrent] = useState(0);
    const next = () => setCurrent((prev) => (prev + 1) % portadas.length);
    const prev = () => setCurrent((prev) => (prev - 1 + portadas.length) % portadas.length);
    
    useEffect(() => { 
      if (portadas.length <= 1) return;
      const timer = setInterval(next, 5000); 
      return () => clearInterval(timer); 
    }, [portadas.length]);
    
    const currentPortada = portadas[current];
    const imageUrl = getImageUrl(currentPortada?.portada_imagen);
    
    return (
      <section className="relative w-full h-[500px] md:h-[600px] overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-700" 
          style={{ 
            backgroundImage: imageUrl ? `url('${imageUrl}')` : `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}10)`,
            backgroundPosition: 'center' 
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/40 to-transparent" />
        </div>
        
        <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 max-w-4xl drop-shadow-lg">
            {sanitizeTextField(institucionContext?.institucion_nombre, 200) || 'Bienvenido'}
          </h1>

          <Link 
            href="#cursos"
            className="px-8 py-3 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg"
            style={{ backgroundColor: primaryColor }}
          >
            Explorar Cursos <ArrowRight size={20} />
          </Link>
        </div>
        
        {portadas.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 p-2 rounded-full transition-colors z-10 backdrop-blur-sm">
              <ChevronLeft size={24} className="text-white" />
            </button>
            <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 p-2 rounded-full transition-colors z-10 backdrop-blur-sm">
              <ChevronRight size={24} className="text-white" />
            </button>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {portadas.map((_, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setCurrent(idx)} 
                  className={`w-2 h-2 rounded-full transition-all ${idx === current ? 'bg-white w-8' : 'bg-white/50'}`}
                  aria-label={`Ir a portada ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </section>
    );
  };

  return (
    <ThemeDynamicProvider colors={dynamicColors}>
      <main className="bg-white min-h-screen">
        {hasPortadas && <CarouselSection portadas={portadas} primaryColor={primaryColor} />}

        <section className="py-16 px-4 md:px-8 bg-gradient-to-br from-white to-gray-50/50">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="relative">
                <div className="relative h-[300px] sm:h-[400px] rounded-2xl overflow-hidden shadow-2xl">
                  <img 
                    src="/imagenes/imagen_upea.jpg" 
                    alt="Sobre la institución" 
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div 
                    className="absolute inset-0 opacity-20"
                    style={{ backgroundColor: primaryColor }}
                  />
                </div>
                <div 
                  className="absolute -bottom-6 -right-6 w-32 h-32 rounded-2xl -z-10 shadow-xl hidden md:block"
                  style={{ backgroundColor: `${primaryColor}20` }}
                />
              </div>

              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: primaryColor }}>
                  {sanitizeTextField(institucionContext?.institucion_nombre || institucionData?.institucion_nombre, 100) || 'Nuestra Institución'}
                </h2>
                <div 
                  className="w-20 h-1 mb-6 rounded-full"
                  style={{ backgroundColor: secondaryColor }}
                />
                <div className="text-gray-700 text-base leading-relaxed space-y-4 mb-8">
                  <p dangerouslySetInnerHTML={{ __html: sanitizeHTML(institucionData?.institucion_mision || '') }} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-gray-200 shadow-sm">
                    <div className="text-2xl font-bold mb-1" style={{ color: primaryColor }}>15+</div>
                    <p className="text-xs text-gray-600">Años de experiencia</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-gray-200 shadow-sm">
                    <div className="text-2xl font-bold mb-1" style={{ color: secondaryColor }}>5000+</div>
                    <p className="text-xs text-gray-600">Estudiantes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {convocatoriasActivas.length > 0 && (
          <section id="convocatorias" className="py-24 px-4 md:px-8 relative overflow-hidden">
            <div className="absolute inset-0 z-0">
              <div 
                className="absolute inset-0 opacity-95"
                style={{ 
                  background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` 
                }}
              />
              <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-[-10%] left-[-5%] w-80 h-80 bg-black/10 rounded-full blur-3xl" />
              <div className="absolute top-[40%] left-[20%] w-64 h-64 bg-white/5 rounded-full blur-2xl" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
              <div className="text-center mb-16 relative">
                <span className="inline-block px-5 py-2 rounded-full text-sm font-bold uppercase tracking-widest mb-4 border border-white/30 bg-white/10 text-white backdrop-blur-md">
                  No te pierdas esto
                </span>
                <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-4 drop-shadow-lg tracking-tight">
                  Convocatorias Activas
                </h2>
                <p className="text-white/80 text-lg max-w-2xl mx-auto font-medium">
                  Oportunidades académicas, becas y procesos de selección abiertos para ti
                </p>
              </div>
              
              <div className="flex justify-center">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 w-full max-w-7xl">
                  {convocatoriasActivas.slice(0, 6).map((conv: any) => {
                    const daysLeft = Math.ceil((new Date(conv.con_fecha_fin).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    
                    return (
                      <Link
                        key={conv.idconvocatorias} 
                        href={`/comunicados/${conv.idconvocatorias}`}
                        className="group block h-full"
                      >
                        <div 
                          className="relative h-full bg-white rounded-[2rem] overflow-hidden border border-white/40 shadow-xl transition-all duration-500 group-hover:-translate-y-3 group-hover:shadow-2xl flex flex-col"
                        >
                          <div 
                            className="absolute top-0 left-0 right-0 h-2 z-20"
                            style={{ background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})` }}
                          />

                          {conv.con_foto_portada && isValidResourceUrl(conv.con_foto_portada) ? (
                            <div className="relative h-48 overflow-hidden bg-gray-100">
                              <img 
                                src={getImageUrl(conv.con_foto_portada)} 
                                alt={sanitizeTextField(conv.con_titulo, 100)} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                loading="lazy" 
                              />
                              {daysLeft > 0 && daysLeft <= 7 && (
                                <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold text-white bg-red-600 shadow-lg animate-bounce z-30 border border-red-400">
                                  ¡Solo {daysLeft} días!
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="h-32 bg-gray-50 flex items-center justify-center">
                              <BookOpen className="w-12 h-12 text-gray-300" />
                            </div>
                          )}
                          
                          <div className="p-6 flex-1 flex flex-col relative z-10">
                            {conv.tipo_conv_comun && (
                              <div className="mb-4">
                                <span 
                                  className="inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide text-white shadow-sm"
                                  style={{ background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})` }}
                                >
                                  {sanitizeTextField(conv.tipo_conv_comun.tipo_conv_comun_titulo, 25)}
                                </span>
                              </div>
                            )}
                            
                            <h3 className="font-extrabold text-xl md:text-2xl text-gray-900 mb-3 group-hover:text-current transition-colors leading-tight line-clamp-2">
                              {sanitizeTextField(conv.con_titulo, 150)}
                            </h3>
                            
                            <p className="text-gray-600 text-sm mb-6 line-clamp-3 leading-relaxed" 
                              dangerouslySetInnerHTML={{ __html: sanitizeHTML(conv.con_descripcion || '') }} 
                            />
                            
                            <div className="mt-auto pt-5 border-t border-gray-100">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                                  <Calendar size={14} style={{ color: primaryColor }} />
                                  <span>{new Date(conv.con_fecha_inicio).toLocaleDateString('es-BO', { day: 'numeric', month: 'short' })}</span>
                                </div>
                                
                                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 group-hover:bg-primaryColor group-hover:text-white transition-all duration-300" style={{ color: primaryColor }}>
                                  <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
                                </div>
                              </div>
                              
                              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                                Cierra el: {new Date(conv.con_fecha_fin).toLocaleDateString('es-BO')}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
              
              {convocatoriasActivas.length > 6 && (
                <div className="text-center mt-16">
                  <Link 
                    href="/comunicados?tipo=CONVOCATORIAS"
                    className="group inline-flex items-center gap-3 px-10 py-5 rounded-full font-bold text-lg shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                    style={{ 
                      backgroundColor: 'white', 
                      color: primaryColor,
                      boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
                    }}
                  >
                    Ver todas las convocatorias 
                    <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}

        {enlaces.length > 0 && (
          <section className="py-24 px-4 md:px-8 relative overflow-hidden" style={{ backgroundColor: `${secondaryColor}08` }}>
            <div className="absolute inset-0 opacity-30 pointer-events-none" 
              style={{ 
                backgroundImage: `radial-gradient(${secondaryColor}20 1px, transparent 1px)`, 
                backgroundSize: '40px 40px' 
              }} 
            />
            
            <div className="max-w-7xl mx-auto relative z-10">
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-3 mb-4">
                  <div className="w-1 h-6 rounded-full" style={{ backgroundColor: secondaryColor }} />
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Accesos Rápidos</h2>
                  <div className="w-1 h-6 rounded-full" style={{ backgroundColor: secondaryColor }} />
                </div>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Enlaces directos a las plataformas y recursos más importantes de la institución
                </p>
              </div>
              
              <div className="flex justify-center">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 w-full max-w-5xl">
                  {enlaces.slice(0, 8).map((link: any) => (
                    <a
                      key={link.id_link}
                      href={isValidResourceUrl(link.url_link) ? link.url_link : '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative p-5 bg-white rounded-2xl border border-gray-200 hover:border-transparent hover:shadow-xl transition-all duration-300 flex items-center gap-4 overflow-hidden"
                      style={{ 
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                      }}
                    >
                      <div 
                        className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 group-hover:w-1.5"
                        style={{ backgroundColor: secondaryColor }}
                      />
                      
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                        style={{ backgroundColor: `${secondaryColor}10` }}
                      >
                        {link.imagen && isValidResourceUrl(link.imagen) ? (
                          <img 
                            src={getImageUrl(link.imagen)} 
                            alt={sanitizeTextField(link.nombre, 30)} 
                            className="w-6 h-6 object-contain" 
                            loading="lazy"
                          />
                        ) : (
                          <ExternalLink size={18} style={{ color: secondaryColor, opacity: 0.8 }} />
                        )}
                      </div>
                      
                      <span className="font-semibold text-gray-800 text-sm group-hover:text-current transition-colors line-clamp-2 flex-1">
                        {sanitizeTextField(link.nombre, 40)}
                      </span>
                      
                      <ArrowRight 
                        size={16} 
                        className="text-gray-300 group-hover:text-current group-hover:translate-x-1 transition-all duration-300 opacity-0 group-hover:opacity-100" 
                        style={{ color: secondaryColor }}
                      />
                    </a>
                  ))}
                </div>
              </div>
              
              {enlaces.length > 8 && (
                <div className="text-center mt-12">
                  <Link 
                    href="/enlaces"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all hover:shadow-md"
                    style={{ 
                      backgroundColor: 'white', 
                      color: secondaryColor,
                      border: `2px solid ${secondaryColor}`
                    }}
                  >
                    Ver todos los enlaces <ArrowRight size={16} />
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}

        <section id="cursos" className="py-24 px-4 md:px-8 relative overflow-hidden bg-gray-50">
          <div className="max-w-[90rem] mx-auto relative z-10 px-4">
            <div 
              className="relative rounded-[2.5rem] overflow-hidden shadow-2xl p-8 md:p-12 lg:p-16"
              style={{ 
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
              }}
            >
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none animate-pulse" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
              <div className="absolute top-[40%] left-[20%] w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 mb-12 text-center md:text-left">
                <span className="inline-block px-5 py-2 rounded-full text-sm font-bold uppercase tracking-widest mb-4 border border-white/30 bg-white/10 text-white backdrop-blur-md">
                  Formación de Excelencia
                </span>
                <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 drop-shadow-lg">
                  Programas Académicos
                </h2>
                <p className="text-white/80 text-lg max-w-2xl mx-auto md:mx-0 font-medium">
                  Cursos, talleres y seminarios diseñados para tu desarrollo profesional
                </p>
                <div className="h-1.5 w-24 rounded-full bg-white shadow-md mx-auto md:mx-0 mt-6" />
              </div>

              <div className="grid lg:grid-cols-12 gap-10 relative z-10">
                <div className="lg:col-span-8 space-y-6">
                  {cursosActivos.slice(0, 4).map((curso: any) => (
                    <Link 
                      key={curso.iddetalle_cursos_academicos} 
                      href={`/cursos/${curso.iddetalle_cursos_academicos}`}
                      className="group block transform transition-all duration-300 hover:-translate-y-2"
                    >
                      <div className="flex flex-col sm:flex-row bg-white rounded-[2rem] overflow-hidden shadow-xl hover:shadow-2xl border border-white/40 transition-all duration-500">
                        <div className="sm:w-56 h-56 sm:h-auto relative overflow-hidden flex-shrink-0 bg-gray-100">
                          {curso.det_img_portada && isValidResourceUrl(curso.det_img_portada) ? (
                            <img 
                              src={getImageUrl(curso.det_img_portada)} 
                              alt={sanitizeTextField(curso.det_titulo, 100)} 
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                              loading="lazy" 
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                              <BookOpen className="w-16 h-16 opacity-20" style={{ color: primaryColor }} />
                            </div>
                          )}
                          
                          <div className="absolute top-4 left-4">
                            <span 
                              className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white rounded-lg shadow-lg backdrop-blur-md"
                              style={{ backgroundColor: `${primaryColor}dd` }}
                            >
                              {sanitizeTextField(curso.tipo_curso_otro?.tipo_conv_curso_nombre || curso.det_modalidad, 20) || 'Académico'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="p-6 md:p-8 flex-1 flex flex-col justify-between relative">
                          <div className="absolute top-6 right-6 p-2 rounded-full bg-gray-50 text-gray-300 group-hover:bg-primaryColor group-hover:text-white transition-all duration-300 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0">
                            <ArrowRight className="w-5 h-5" />
                          </div>

                          <div>
                            <h3 className="font-extrabold text-xl md:text-2xl text-gray-900 mb-3 group-hover:text-current transition-colors leading-tight line-clamp-2">
                              {sanitizeTextField(curso.det_titulo, 120)}
                            </h3>
                            
                            <p className="text-gray-600 text-sm mb-6 line-clamp-2 leading-relaxed">
                              {sanitizeTextField(curso.det_descripcion, 150)}
                            </p>
                          </div>

                          <div className="grid grid-cols-3 gap-4 pt-5 border-t border-gray-100">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-gray-50" style={{ color: primaryColor }}>
                                <Clock size={18} />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400 font-bold uppercase">Duración</span>
                                <span className="text-sm font-bold text-gray-700">{curso.det_carga_horaria} horas</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-gray-50" style={{ color: primaryColor }}>
                                <Users size={18} />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400 font-bold uppercase">Modalidad</span>
                                <span className="text-sm font-bold text-gray-700">{sanitizeTextField(curso.det_modalidad, 15) || 'Presencial'}</span>
                              </div>
                            </div>

                            {curso.det_costo > 0 && (
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg" style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}>
                                  <DollarSign size={18} />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-gray-400 font-bold uppercase">Inversión</span>
                                  <span className="text-lg font-extrabold" style={{ color: primaryColor }}>Bs. {curso.det_costo}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                  
                  {cursosActivos.length > 4 && (
                    <div className="text-center pt-6">
                      <Link 
                        href="/cursos"
                        className="group inline-flex items-center gap-3 px-10 py-5 rounded-full font-bold text-lg shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                        style={{ 
                          backgroundColor: 'white', 
                          color: primaryColor,
                          boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
                        }}
                      >
                        Ver todos los programas <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                      </Link>
                    </div>
                  )}
                </div>
                
                <div className="lg:col-span-4">
                  <div className="sticky top-24">
                    <div className="bg-white rounded-[2rem] p-6 shadow-2xl border border-white/40 overflow-hidden relative">
                      <div className="absolute top-0 left-0 w-full h-1.5" style={{ background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})` }} />
                      
                      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3 mt-2">
                        <div className="p-2.5 rounded-xl shadow-sm" style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}>
                          <Calendar className="w-6 h-6" />
                        </div>
                        Calendario Académico
                      </h3>
                      
                      {data?.dinamico?.eventos && data.dinamico.eventos.length > 0 ? (
                        <div className="rounded-2xl overflow-hidden border border-gray-100">
                          <CalendarWidget 
                            colores={{ color_primario: primaryColor, color_secundario: secondaryColor }} 
                            eventos={data.dinamico.eventos.slice(0, 5)} 
                          />
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl">
                          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
                          <p className="font-medium text-gray-500">Sin eventos próximos</p>
                          <p className="text-sm mt-1">Revisa más adelante</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {safeVideoUrl && (
          <section className="py-20 px-4 md:px-8 bg-gradient-to-br from-slate-900 to-slate-800">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Conoce Nuestra Carrera</h2>
                <p className="text-white/80 text-lg max-w-2xl mx-auto">
                  Descubre nuestras instalaciones, actividades y testimonios de estudiantes
                </p>
              </div>
              
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <div className="relative" style={{ paddingBottom: '56.25%' }}>
                  <iframe 
                    src={safeVideoUrl} 
                    title="Video institucional" 
                    className="absolute inset-0 w-full h-full border-0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen 
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                    sandbox="allow-scripts allow-same-origin allow-popups"
                  />
                </div>
                
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{ 
                    background: `linear-gradient(135deg, ${primaryColor}20, transparent 50%, ${secondaryColor}20)`,
                    opacity: 0.3 
                  }} 
                />
              </div>
              
              {data?.institucional?.upea_videos?.[0] && (
                <div className="mt-6 text-center">
                  <p className="text-white/90 font-medium">
                    {sanitizeTextField(data.institucional.upea_videos[0].video_titulo, 150)}
                  </p>
                  {data.institucional.upea_videos[0].video_breve_descripcion && (
                    <p className="text-white/60 text-sm mt-2 max-w-2xl mx-auto">
                      {sanitizeTextField(data.institucional.upea_videos[0].video_breve_descripcion.replace(/<[^>]*>/g, ''), 200)}
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </ThemeDynamicProvider>
  );
}