// app/informacion/page.tsx
'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Target, Eye, Award, Users, BookOpen, TrendingUp,
  User, Mail, Phone, Facebook, Linkedin, Calendar, MapPin, Clock, Navigation,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

import api from '@/lib/axios';
import { getStorageUrl } from '@/lib/utils';
import { sanitizeHTML } from '@/lib/sanitize';
import ThemeDynamicProvider from '@/components/providers/ThemeDynamicProvider';

// ==================== TIPOS ====================
interface ColorInstitucion {
  color_primario: string;
  color_secundario: string;
  color_terciario: string;
}

interface InstitucionData {
  institucion_id: number;
  institucion_nombre: string;
  institucion_iniciales: string;
  institucion_mision?: string;
  institucion_vision?: string;
  institucion_historia?: string;
  institucion_objetivos?: string;
  institucion_direccion?: string;
  institucion_correo1?: string;
  institucion_celular1?: number;
  institucion_celular2?: number;
  institucion_api_google_map?: string;
  colorinstitucion: ColorInstitucion[];
}

interface Autoridad {
  id_autoridad: number;
  foto_autoridad?: string;
  nombre_autoridad: string;
  cargo_autoridad: string;
  facebook_autoridad?: string;
  celular_autoridad?: string;
  twiter_autoridad?: string;
}

interface UbicacionData {
  ubicacion_imagen?: string;
  ubicacion_titulo?: string;
  ubicacion_descripcion?: string;
  ubicacion_latitud?: string;
  ubicacion_longitud?: string;
}

type SeccionInfo = 'mision-vision' | 'autoridades' | 'historia' | 'ubicacion';

const SECCIONES_VALIDAS: SeccionInfo[] = ['mision-vision', 'autoridades', 'historia', 'ubicacion'];

const isValidSeccion = (seccion: string | null): seccion is SeccionInfo => {
  return seccion !== null && (SECCIONES_VALIDAS as string[]).includes(seccion);
};

const isValidExternalUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    const validProtocol = ['https:'].includes(parsed.protocol);
    const safeDomains = [
      'facebook.com', 'www.facebook.com',
      'twitter.com', 'www.twitter.com', 'x.com', 'www.x.com',
      'linkedin.com', 'www.linkedin.com',
      'maps.google.com', 'www.google.com', 'google.com',
      'upea.bo', 'localhost', '127.0.0.1'
    ];
    const safeDomain = safeDomains.some(domain => parsed.hostname.includes(domain));
    const safePath = !parsed.pathname.includes('<') && !parsed.pathname.includes('>') && !parsed.pathname.includes('javascript:');
    return validProtocol && safeDomain && safePath;
  } catch {
    return false;
  }
};

const isValidHexColor = (color: string | undefined): boolean => {
  if (!color) return false;
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
};

const sanitizeTextField = (text: string | undefined, maxLength = 1000): string => {
  if (!text) return '';
  return sanitizeHTML(text).trim().slice(0, maxLength);
};

// ==================== COMPONENTE PRINCIPAL ====================
function InformacionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const initialSeccion = useMemo(() => {
    const raw = searchParams.get('section');
    return isValidSeccion(raw) ? raw : 'mision-vision';
  }, []); 
  
  const [seccionActiva, setSeccionActiva] = useState<SeccionInfo>(initialSeccion);
  
  const [institucion, setInstitucion] = useState<InstitucionData | null>(null);
  const [autoridades, setAutoridades] = useState<Autoridad[]>([]);
  const [ubicacion, setUbicacion] = useState<UbicacionData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [primaryColor, setPrimaryColor] = useState('#04246C');
  const [secondaryColor, setSecondaryColor] = useState('#FC0102');

  const secciones: Array<{ id: SeccionInfo; label: string; icon: any }> = [
    { id: 'mision-vision', label: 'Misión y Visión', icon: Target },
    { id: 'autoridades', label: 'Autoridades', icon: Users },
    { id: 'historia', label: 'Historia', icon: BookOpen },
    { id: 'ubicacion', label: 'Ubicación', icon: MapPin },
  ];

  // ==================== FETCH DATOS ====================
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const institucionId = Number(process.env.NEXT_PUBLIC_INSTITUCION_ID) || 12;
        
        const [instRes, contenidoRes] = await Promise.all([
          api.get(`/institucionesPrincipal/${institucionId}`),
          api.get(`/institucion/${institucionId}/contenido`)
        ]);

        if (!isMounted) return;

        const instData = instRes.data.Descripcion;
        
        setInstitucion({
          ...instData,
          institucion_mision: sanitizeTextField(instData.institucion_mision),
          institucion_vision: sanitizeTextField(instData.institucion_vision),
          institucion_historia: sanitizeTextField(instData.institucion_historia),
          institucion_objetivos: sanitizeTextField(instData.institucion_objetivos),
          institucion_direccion: sanitizeTextField(instData.institucion_direccion, 300),
          institucion_correo1: instData.institucion_correo1?.replace(/[<>\"'&]/g, ''),
        });
        
        const autoridadesSanitizadas = (contenidoRes.data.autoridad || []).map((a: any) => ({
          ...a,
          nombre_autoridad: sanitizeTextField(a.nombre_autoridad, 100),
          cargo_autoridad: sanitizeTextField(a.cargo_autoridad, 100),
          facebook_autoridad: isValidExternalUrl(a.facebook_autoridad) ? a.facebook_autoridad : undefined,
          twiter_autoridad: isValidExternalUrl(a.twiter_autoridad) ? a.twiter_autoridad : undefined,
        }));
        setAutoridades(autoridadesSanitizadas);
        
        const ubicacionData = contenidoRes.data.ubicacion?.[0];
        setUbicacion(ubicacionData ? {
          ...ubicacionData,
          ubicacion_titulo: sanitizeTextField(ubicacionData.ubicacion_titulo, 100),
          ubicacion_descripcion: sanitizeTextField(ubicacionData.ubicacion_descripcion),
          ubicacion_latitud: ubicacionData.ubicacion_latitud?.replace(/[<>\"'&]/g, ''),
          ubicacion_longitud: ubicacionData.ubicacion_longitud?.replace(/[<>\"'&]/g, ''),
        } : null);
        
        if (instData.colorinstitucion?.[0]) {
          const colors = instData.colorinstitucion[0];
          setPrimaryColor(isValidHexColor(colors.color_primario) ? colors.color_primario : '#04246C');
          setSecondaryColor(isValidHexColor(colors.color_secundario) ? colors.color_secundario : '#FC0102');
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error(' Error cargando datos:', error);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    
    return () => { isMounted = false; };
  }, []); 
  useEffect(() => {

    const currentSection = searchParams.get('section');

    if (currentSection !== seccionActiva) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('section', seccionActiva);
      router.replace(`/informacion?${params.toString()}`, { scroll: false });
    }

  }, [seccionActiva, router]);

  // ==================== RENDER LOADING ====================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando información...</p>
        </div>
      </div>
    );
  }

  // ==================== RENDER SECCIONES ====================
  const renderSeccion = () => {
    switch (seccionActiva) {
      case 'mision-vision':
        return <SeccionMisionVision institucion={institucion} primaryColor={primaryColor} secondaryColor={secondaryColor} />;
      case 'autoridades':
        return <SeccionAutoridades autoridades={autoridades} primaryColor={primaryColor} />;
      case 'historia':
        return <SeccionHistoria institucion={institucion} primaryColor={primaryColor} secondaryColor={secondaryColor} />;
      case 'ubicacion':
        return <SeccionUbicacion institucion={institucion} ubicacion={ubicacion} primaryColor={primaryColor} secondaryColor={secondaryColor} />;
      default:
        return <SeccionMisionVision institucion={institucion} primaryColor={primaryColor} secondaryColor={secondaryColor} />;
    }
  };

  return (
    <ThemeDynamicProvider colors={{ primary: primaryColor, secondary: secondaryColor }}>
      <div className="min-h-screen bg-background">
        
        {/* Header */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 25%, ${secondaryColor}99 60%, ${secondaryColor}44 100%)` }} />
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`, backgroundSize: '40px 40px' }} />
          </div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          
          <div className="relative max-w-6xl mx-auto px-4">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white mb-8 transition-colors group">
              <div className="p-2 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </div>
              <span className="font-medium">Volver al inicio</span>
            </Link>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20">
                <Target className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white">Información Institucional</h1>
            </div>
            
            <p className="text-lg md:text-xl text-white/90 max-w-3xl leading-relaxed">
              Conoce nuestra misión, visión, historia, autoridades y ubicación de{' '}
              <span className="font-semibold text-white">{institucion?.institucion_nombre || 'nuestra institución'}</span>
            </p>
          </div>
        </section>

        {/* Navegación de Pestañas */}
        <div className="bg-background border-b border-border sticky top-20 z-30 shadow-sm">
          <div className="max-w-6xl mx-auto px-4">
            <nav className="flex flex-wrap gap-2 py-4" role="tablist" aria-label="Secciones de información">
              {secciones.map((seccion) => {
                const isActive = seccionActiva === seccion.id;
                return (
                  <button
                    key={seccion.id}
                    onClick={() => setSeccionActiva(seccion.id)}
                    className={`flex items-center gap-2 px-5 py-3 rounded-full font-medium text-sm transition-all ${
                      isActive ? 'text-white shadow-lg' : 'bg-muted text-foreground hover:bg-muted/80'
                    }`}
                    style={isActive ? { backgroundColor: primaryColor } : {}}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`panel-${seccion.id}`}
                  >
                    <seccion.icon className="w-4 h-4" aria-hidden="true" />
                    {seccion.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Contenido */}
        <div className="max-w-6xl mx-auto px-4 py-12">
          {renderSeccion()}
        </div>

      </div>
    </ThemeDynamicProvider>
  );
}

// ==================== SECCIÓN: MISIÓN Y VISIÓN ====================
function SeccionMisionVision({ institucion, primaryColor, secondaryColor }: {
  institucion: InstitucionData | null;
  primaryColor: string;
  secondaryColor: string;
}) {
  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-card rounded-2xl p-8 border shadow-lg hover:shadow-xl transition-shadow">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: `${primaryColor}15` }}>
            <Target className="w-8 h-8" style={{ color: primaryColor }} aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: primaryColor }}>Misión</h2>
          <div className="text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitizeHTML(institucion?.institucion_mision || '<p>Formar profesionales competentes con enfoque holístico.</p>') }} />
        </div>
        <div className="bg-card rounded-2xl p-8 border shadow-lg hover:shadow-xl transition-shadow">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: `${secondaryColor}15` }}>
            <Eye className="w-8 h-8" style={{ color: secondaryColor }} aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: secondaryColor }}>Visión</h2>
          <div className="text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitizeHTML(institucion?.institucion_vision || '<p>Ser referentes en educación superior.</p>') }} />
        </div>
      </div>
      {institucion?.institucion_objetivos && (
        <div className="bg-card rounded-2xl p-8 border shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
              <Award className="w-6 h-6" style={{ color: primaryColor }} aria-hidden="true" />
            </div>
            <h2 className="text-2xl font-bold" style={{ color: primaryColor }}>Objetivos Institucionales</h2>
          </div>
          <div className="text-muted-foreground leading-relaxed space-y-4" dangerouslySetInnerHTML={{ __html: sanitizeHTML(institucion.institucion_objetivos) }} />
        </div>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
        {[
          { icon: Users, title: 'Compromiso', desc: 'Dedicación total a la excelencia educativa' },
          { icon: BookOpen, title: 'Calidad', desc: 'Estándares académicos de excelencia' },
          { icon: Target, title: 'Innovación', desc: 'Metodologías educativas modernas' },
          { icon: TrendingUp, title: 'Crecimiento', desc: 'Desarrollo continuo y mejora' },
        ].map((item, idx) => (
          <div key={idx} className="text-center p-6 rounded-xl bg-muted/50 border">
            <item.icon className="w-10 h-10 mx-auto mb-3" style={{ color: primaryColor }} aria-hidden="true" />
            <h3 className="font-bold mb-2">{item.title}</h3>
            <p className="text-sm text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== SECCIÓN: AUTORIDADES ====================
function SeccionAutoridades({ autoridades, primaryColor }: {
  autoridades: Autoridad[];
  primaryColor: string;
}) {
  return (
    <div>
      {autoridades.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {autoridades.map((autoridad) => (
            <div key={autoridad.id_autoridad} className="bg-card rounded-2xl overflow-hidden border shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1">
              <div className="relative h-64 bg-muted">
                {autoridad.foto_autoridad ? (
                  <Image
                    src={getStorageUrl(autoridad.foto_autoridad)}
                    alt={autoridad.nombre_autoridad}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-20 h-20 text-muted-foreground" aria-hidden="true" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{autoridad.nombre_autoridad}</h3>
                <p className="text-sm font-medium mb-4" style={{ color: isValidHexColor(primaryColor) ? primaryColor : '#04246C' }}>
                  {autoridad.cargo_autoridad}
                </p>
                <div className="space-y-2 pt-4 border-t">
                  {autoridad.celular_autoridad && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4" style={{ color: primaryColor }} aria-hidden="true" />
                      <span>{autoridad.celular_autoridad}</span>
                    </div>
                  )}
                  {(autoridad.facebook_autoridad || autoridad.twiter_autoridad) && (
                    <div className="flex gap-2 pt-2">
                      {autoridad.facebook_autoridad && isValidExternalUrl(autoridad.facebook_autoridad) && (
                        <a href={autoridad.facebook_autoridad} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-muted hover:bg-primary/10 transition-colors" style={{ color: primaryColor }} aria-label={`Facebook de ${autoridad.nombre_autoridad}`}>
                          <Facebook className="w-4 h-4" />
                        </a>
                      )}
                      {autoridad.twiter_autoridad && isValidExternalUrl(autoridad.twiter_autoridad) && (
                        <a href={autoridad.twiter_autoridad} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-muted hover:bg-primary/10 transition-colors" style={{ color: primaryColor }} aria-label={`Twitter de ${autoridad.nombre_autoridad}`}>
                          <Linkedin className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground" aria-hidden="true" />
          <h3 className="text-xl font-bold mb-2">No hay autoridades registradas</h3>
          <p className="text-muted-foreground">La información de autoridades estará disponible próximamente</p>
        </div>
      )}
    </div>
  );
}

// ==================== SECCIÓN: HISTORIA ====================
function SeccionHistoria({ institucion, primaryColor, secondaryColor }: {
  institucion: InstitucionData | null;
  primaryColor: string;
  secondaryColor: string;
}) {
  return (
    <div className="space-y-12">
      <div className="bg-card rounded-2xl p-8 border shadow-lg">
        <h2 className="text-2xl font-bold mb-4" style={{ color: primaryColor }}>{institucion?.institucion_nombre} - {institucion?.institucion_iniciales}</h2>
        {institucion?.institucion_historia ? (
          <div className="text-muted-foreground leading-relaxed space-y-4" dangerouslySetInnerHTML={{ __html: sanitizeHTML(institucion.institucion_historia) }} />
        ) : (
          <>
            <p className="text-muted-foreground leading-relaxed mb-4">Somos una institución comprometida con la excelencia académica.</p>
            <p className="text-muted-foreground leading-relaxed">Nuestra trayectoria se caracteriza por la innovación pedagógica.</p>
          </>
        )}
      </div>
      {institucion?.institucion_objetivos ? (
        <div className="bg-card rounded-2xl p-8 border shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
              <Target className="w-6 h-6" style={{ color: primaryColor }} aria-hidden="true" />
            </div>
            <h2 className="text-2xl font-bold" style={{ color: primaryColor }}>Objetivos Estratégicos</h2>
          </div>
          <div className="text-muted-foreground leading-relaxed space-y-4 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHTML(institucion.institucion_objetivos) }} />
        </div>
      ) : (
        <div>
          <h2 className="text-3xl font-bold text-center mb-12" style={{ color: primaryColor }}>Valores Institucionales</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Users, title: 'Compromiso Social', desc: 'Servicio a la comunidad', color: primaryColor },
              { icon: BookOpen, title: 'Excelencia Académica', desc: 'Formación de calidad', color: secondaryColor },
              { icon: TrendingUp, title: 'Innovación', desc: 'Nuevas tecnologías', color: '#f59e0b' },
              { icon: Award, title: 'Integridad', desc: 'Transparencia', color: primaryColor },
            ].map((valor, idx) => (
              <div key={idx} className="bg-card p-6 rounded-xl border shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 text-center group">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 transition-transform group-hover:scale-110" style={{ backgroundColor: `${isValidHexColor(valor.color) ? valor.color : '#04246C'}15` }}>
                  <valor.icon className="w-7 h-7" style={{ color: isValidHexColor(valor.color) ? valor.color : '#04246C' }} aria-hidden="true" />
                </div>
                <h3 className="font-bold mb-2 text-foreground">{valor.title}</h3>
                <p className="text-sm text-muted-foreground">{valor.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== SECCIÓN: UBICACIÓN ====================
function SeccionUbicacion({ institucion, ubicacion, primaryColor, secondaryColor }: {
  institucion: InstitucionData | null;
  ubicacion: UbicacionData | null;
  primaryColor: string;
  secondaryColor: string;
}) {
  const safeMapUrl = useMemo(() => {
    if (!institucion?.institucion_api_google_map) return '';
    return isValidExternalUrl(institucion.institucion_api_google_map) ? institucion.institucion_api_google_map : '';
  }, [institucion?.institucion_api_google_map]);

  const safeCoords = useMemo(() => {
    const lat = ubicacion?.ubicacion_latitud?.replace(/[^0-9.\-]/g, '') || '-16.489549430458553';
    const lng = ubicacion?.ubicacion_longitud?.replace(/[^0-9.\-]/g, '') || '-68.19329917301572';
    return { lat, lng };
  }, [ubicacion?.ubicacion_latitud, ubicacion?.ubicacion_longitud]);

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div className="bg-card rounded-2xl p-8 border shadow-lg">
          <h2 className="text-2xl font-bold mb-6" style={{ color: primaryColor }}>Información de Contacto</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                <MapPin className="w-6 h-6" style={{ color: primaryColor }} aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Dirección</h3>
                <p className="text-muted-foreground">{institucion?.institucion_direccion || 'Av. Sucre Z. Villa Esperanza, Campus UPEA Bloque B Piso 3'}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${secondaryColor}15` }}>
                <Phone className="w-6 h-6" style={{ color: secondaryColor }} aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Teléfonos</h3>
                <p className="text-muted-foreground">
                  {institucion?.institucion_celular1 && `${institucion.institucion_celular1}`}
                  {institucion?.institucion_celular2 && ` / ${institucion.institucion_celular2}`}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                <Mail className="w-6 h-6" style={{ color: primaryColor }} aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Correo Electrónico</h3>
                <p className="text-muted-foreground">{institucion?.institucion_correo1 || 'info@institucion.edu.bo'}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${secondaryColor}15` }}>
                <Clock className="w-6 h-6" style={{ color: secondaryColor }} aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Horario de Atención</h3>
                <p className="text-muted-foreground">Lunes a Viernes: 8:00 - 12:00 y 14:00 - 18:00</p>
              </div>
            </div>
          </div>
        </div>
        {ubicacion?.ubicacion_descripcion && (
          <div className="bg-card rounded-2xl p-8 border shadow-lg">
            <h3 className="text-xl font-bold mb-4" style={{ color: primaryColor }}>{ubicacion.ubicacion_titulo || 'Información Adicional'}</h3>
            <p className="text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitizeHTML(ubicacion.ubicacion_descripcion) }} />
          </div>
        )}
      </div>
      <div className="bg-card rounded-2xl overflow-hidden border shadow-lg">
        {safeMapUrl ? (
          <iframe
            src={safeMapUrl}
            width="100%"
            height="500"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            sandbox="allow-scripts allow-same-origin allow-popups"
            className="w-full"
            title="Ubicación en Google Maps"
          />
        ) : (
          <div className="w-full h-96 bg-muted flex items-center justify-center">
            <div className="text-center">
              <Navigation className="w-16 h-16 mx-auto mb-4 text-muted-foreground" aria-hidden="true" />
              <p className="text-muted-foreground">Mapa no disponible</p>
            </div>
          </div>
        )}
      </div>
      <div className="lg:col-span-2 text-center pt-4">
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${safeCoords.lat},${safeCoords.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-white transition-all hover:shadow-lg hover:-translate-y-0.5"
          style={{ backgroundColor: isValidHexColor(primaryColor) ? primaryColor : '#04246C' }}
        >
          <Navigation className="w-5 h-5" aria-hidden="true" />
          Cómo llegar con Google Maps
        </a>
      </div>
    </div>
  );
}

// ==================== WRAPPER ====================
export default function InformacionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando información...</p>
        </div>
      </div>
    }>
      <InformacionContent />
    </Suspense>
  );
}