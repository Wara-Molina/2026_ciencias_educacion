// app/institutoInvestigacion/page.tsx
'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  FlaskConical, BookOpen, Calendar, Users, Target, 
  TrendingUp, Award, FileText, ArrowLeft,
  ChevronRight, Microscope, GraduationCap, Loader2,
  ChevronLeft, ChevronRight as ChevronRightIcon
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

import api from '@/lib/axios';
import { getStorageUrl } from '@/lib/utils';
import { sanitizeHTML } from '@/lib/sanitize';
import ThemeDynamicProvider from '@/components/providers/ThemeDynamicProvider';

interface ColorInstitucion {
  color_primario: string;
  color_secundario: string;
  color_terciario: string;
}

interface GacetaInvestigacion {
  gaceta_id: number;
  gaceta_titulo: string;
  gaceta_fecha: string;
  gaceta_documento?: string;
  gaceta_tipo: string;
}

interface EventoInvestigacion {
  evento_id: number;
  evento_titulo: string;
  evento_imagen?: string;
  evento_descripcion?: string;
  evento_fecha: string;
  evento_hora?: string;
  evento_lugar?: string;
  tipo_evento: string;
}

interface PublicacionInvestigacion {
  publicaciones_id: number;
  publicaciones_titulo: string;
  publicaciones_imagen?: string;
  publicaciones_descripcion?: string;
  publicaciones_documento?: string;
  publicaciones_fecha: string;
  publicaciones_autor?: string;
  publicaciones_tipo: string;
}

interface InstitucionData {
  institucion_nombre: string;
  institucion_iniciales: string;
  colorinstitucion: ColorInstitucion[];
}

const isValidResourceUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  try {
    const urlToParse = url.startsWith('http') ? url : `https://${url}`;
    const parsed = new URL(urlToParse);
    const validProtocol = ['https:'].includes(parsed.protocol);
    const safeDomain = parsed.hostname.includes('upea.bo') || 
                      parsed.hostname.includes('localhost') ||
                      parsed.hostname.includes('127.0.0.1');
    const safePath = !parsed.pathname.includes('<') && 
                    !parsed.pathname.includes('>') &&
                    !parsed.pathname.includes('javascript:');
    return validProtocol && safeDomain && safePath;
  } catch {
    return false;
  }
};

const sanitizeTextField = (text: string | undefined, maxLength = 500): string => {
  if (!text) return '';
  return sanitizeHTML(text)
    .replace(/<[^>]*>/g, '')
    .trim()
    .slice(0, maxLength);
};

function InstitutoInvestigacionContent() {
  const rawInstitucionId = Number(process.env.NEXT_PUBLIC_INSTITUCION_ID);
  const institucionId = Number.isInteger(rawInstitucionId) && rawInstitucionId > 0 && rawInstitucionId < 1000000 
    ? rawInstitucionId 
    : 12;
    
  const searchParams = useSearchParams();
  const router = useRouter();

  const [paginaProyectos, setPaginaProyectos] = useState(1);
  const [paginaPublicaciones, setPaginaPublicaciones] = useState(1);
  const [paginaEventos, setPaginaEventos] = useState(1);
  const itemsPorPagina = 6;
  
  const [gacetas, setGacetas] = useState<GacetaInvestigacion[]>([]);
  const [eventos, setEventos] = useState<EventoInvestigacion[]>([]);
  const [publicaciones, setPublicaciones] = useState<PublicacionInvestigacion[]>([]);
  const [institucion, setInstitucion] = useState<InstitucionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'proyectos' | 'publicaciones' | 'eventos'>('proyectos');
  const [error, setError] = useState<string | null>(null);
  
  const [primaryColor, setPrimaryColor] = useState('#04246C');
  const [secondaryColor, setSecondaryColor] = useState('#FC0102');

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [gacetaEventosRes, recursosRes, instRes] = await Promise.all([
          api.get(`/institucion/${institucionId}/gacetaEventos`),
          api.get(`/institucion/${institucionId}/recursos`),
          api.get(`/institucionesPrincipal/${institucionId}`)
        ]);

        if (!isMounted) return;

        // ✅ Filtro ESTRICTO: Solo "INSTITUTO DE INVESTIGACION" exacto (con normalización)
        const esTipoInvestigacion = (valor: any): boolean => {
          if (!valor) return false;
          // Normalizar: quitar tildes, mayúsculas, espacios extra
          const normalized = String(valor)
            .trim()
            .toUpperCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
            .replace(/\s+/g, ' '); // Espacios únicos
          
          return normalized === 'INSTITUTO DE INVESTIGACION';
        };

        // ✅ Gacetas: filtrar ESTRICTAMENTE
        const gacetasData = (gacetaEventosRes.data.upea_gaceta_universitaria || [])
          .filter((g: any) => esTipoInvestigacion(g.gaceta_tipo))
          .map((g: any) => ({
            gaceta_id: g.gaceta_id,
            gaceta_titulo: sanitizeTextField(g.gaceta_titulo, 200),
            gaceta_fecha: g.gaceta_fecha,
            gaceta_documento: isValidResourceUrl(g.gaceta_documento) ? g.gaceta_documento : undefined,
            gaceta_tipo: sanitizeTextField(g.gaceta_tipo, 50)
          })) as GacetaInvestigacion[];
        
        // ✅ Eventos: filtrar ESTRICTAMENTE
        const eventosData = (gacetaEventosRes.data.upea_evento || [])
          .filter((e: any) => esTipoInvestigacion(e.tipo_evento))
          .map((e: any) => ({
            evento_id: e.evento_id,
            evento_titulo: sanitizeTextField(e.evento_titulo, 200),
            evento_imagen: isValidResourceUrl(e.evento_imagen) ? e.evento_imagen : undefined,
            evento_descripcion: sanitizeHTML(e.evento_descripcion || ''),
            evento_fecha: e.evento_fecha,
            evento_hora: e.evento_hora?.substring(0, 5) || '',
            evento_lugar: sanitizeTextField(e.evento_lugar, 100),
            tipo_evento: sanitizeTextField(e.tipo_evento, 50)
          })) as EventoInvestigacion[];
        
        // ✅ Publicaciones: filtrar ESTRICTAMENTE
        const publicacionesData = (recursosRes.data.upea_publicaciones || [])
          .filter((p: any) => esTipoInvestigacion(p.publicaciones_tipo))
          .map((p: any) => ({
            publicaciones_id: p.publicaciones_id,
            publicaciones_titulo: sanitizeTextField(p.publicaciones_titulo, 200),
            publicaciones_imagen: isValidResourceUrl(p.publicaciones_imagen) ? p.publicaciones_imagen : undefined,
            publicaciones_descripcion: sanitizeHTML(p.publicaciones_descripcion || ''),
            publicaciones_documento: isValidResourceUrl(p.publicaciones_documento) ? p.publicaciones_documento : undefined,
            publicaciones_fecha: p.publicaciones_fecha,
            publicaciones_autor: sanitizeTextField(p.publicaciones_autor, 100),
            publicaciones_tipo: sanitizeTextField(p.publicaciones_tipo, 50)
          })) as PublicacionInvestigacion[];

        setGacetas(gacetasData);
        setEventos(eventosData);
        setPublicaciones(publicacionesData);
        setInstitucion(instRes.data.Descripcion || null);

        if (instRes.data.Descripcion?.colorinstitucion?.[0]) {
          const colors = instRes.data.Descripcion.colorinstitucion[0];
          setPrimaryColor(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(colors.color_primario) ? colors.color_primario : '#04246C');
          setSecondaryColor(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(colors.color_secundario) ? colors.color_secundario : '#FC0102');
        }
      } catch (err: any) {
        if (isMounted) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Error cargando datos del instituto:', err);
          }
          setError('No se pudieron cargar los datos del instituto. Intente más tarde.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [institucionId]);

  useEffect(() => {
    setPaginaProyectos(1);
    setPaginaPublicaciones(1);
    setPaginaEventos(1);
  }, [activeTab]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Fecha no disponible';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    return date.toLocaleDateString('es-BO', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const totalPaginasProyectos = Math.max(1, Math.ceil(gacetas.length / itemsPorPagina));
  const totalPaginasPublicaciones = Math.max(1, Math.ceil(publicaciones.length / itemsPorPagina));
  const totalPaginasEventos = Math.max(1, Math.ceil(eventos.length / itemsPorPagina));

  const gacetasPagina = useMemo(() => 
    gacetas.slice((paginaProyectos - 1) * itemsPorPagina, paginaProyectos * itemsPorPagina),
    [gacetas, paginaProyectos]
  );
  
  const publicacionesPagina = useMemo(() => 
    publicaciones.slice((paginaPublicaciones - 1) * itemsPorPagina, paginaPublicaciones * itemsPorPagina),
    [publicaciones, paginaPublicaciones]
  );
  
  const eventosPagina = useMemo(() => 
    eventos.slice((paginaEventos - 1) * itemsPorPagina, paginaEventos * itemsPorPagina),
    [eventos, paginaEventos]
  );

  const cambiarPagina = (setter: React.Dispatch<React.SetStateAction<number>>, nuevaPagina: number, totalPaginas: number) => {
    const safePagina = Number.isInteger(nuevaPagina) && nuevaPagina > 0 && nuevaPagina <= totalPaginas 
      ? nuevaPagina 
      : 1;
    setter(safePagina);
  };

  const renderPagination = (paginaActual: number, totalPaginas: number, onPageChange: (page: number) => void) => {
    if (totalPaginas <= 1) return null;
    
    return (
      <div className="flex items-center justify-center gap-2 mt-8" role="navigation" aria-label="Paginación">
        <button
          onClick={() => onPageChange(paginaActual - 1)}
          disabled={paginaActual === 1}
          className="p-2 rounded-lg border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
          aria-label="Página anterior"
        >
          <ChevronLeft className="w-5 h-5" aria-hidden="true" />
        </button>
        
        {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => (
          <button
            key={pagina}
            onClick={() => onPageChange(pagina)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              pagina === paginaActual 
                ? 'text-white' 
                : 'border border-border hover:bg-muted'
            }`}
            style={pagina === paginaActual ? { backgroundColor: primaryColor } : {}}
            aria-current={pagina === paginaActual ? 'page' : undefined}
            aria-label={`Ir a página ${pagina}`}
          >
            {pagina}
          </button>
        ))}
        
        <button
          onClick={() => onPageChange(paginaActual + 1)}
          disabled={paginaActual === totalPaginas}
          className="p-2 rounded-lg border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
          aria-label="Página siguiente"
        >
          <ChevronRightIcon className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Cargando instituto de investigación...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2">Error de conexión</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-lg font-medium text-white transition-all hover:shadow-md"
            style={{ backgroundColor: primaryColor }}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <ThemeDynamicProvider colors={{ primary: primaryColor, secondary: secondaryColor }}>
      <div className="min-h-screen bg-background">
        
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
                <FlaskConical className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white">Instituto de Investigación</h1>
            </div>
            
            <p className="text-lg md:text-xl text-white/90 max-w-3xl leading-relaxed">
              {institucion?.institucion_nombre || 'Carrera'} - Generando conocimiento científico e innovación
            </p>
            
            <div className="mt-8 flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                <FlaskConical className="w-4 h-4 text-white" />
                <span className="text-sm text-white/90">{gacetas.length} proyectos</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                <BookOpen className="w-4 h-4 text-white" />
                <span className="text-sm text-white/90">{publicaciones.length} publicaciones</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                <Calendar className="w-4 h-4 text-white" />
                <span className="text-sm text-white/90">{eventos.length} eventos</span>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 -mt-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card rounded-xl p-6 border shadow-lg">
              <FlaskConical className="w-8 h-8 mb-3" style={{ color: primaryColor }} />
              <p className="text-3xl font-bold" style={{ color: primaryColor }}>{gacetas.length}</p>
              <p className="text-sm text-muted-foreground">Proyectos</p>
            </div>
            <div className="bg-card rounded-xl p-6 border shadow-lg">
              <BookOpen className="w-8 h-8 mb-3" style={{ color: secondaryColor }} />
              <p className="text-3xl font-bold" style={{ color: secondaryColor }}>{publicaciones.length}</p>
              <p className="text-sm text-muted-foreground">Publicaciones</p>
            </div>
            <div className="bg-card rounded-xl p-6 border shadow-lg">
              <Calendar className="w-8 h-8 mb-3" style={{ color: primaryColor }} />
              <p className="text-3xl font-bold" style={{ color: primaryColor }}>{eventos.length}</p>
              <p className="text-sm text-muted-foreground">Eventos</p>
            </div>
            <div className="bg-card rounded-xl p-6 border shadow-lg">
              <Award className="w-8 h-8 mb-3" style={{ color: secondaryColor }} />
              <p className="text-3xl font-bold" style={{ color: secondaryColor }}>15+</p>
              <p className="text-sm text-muted-foreground">Líneas de Investigación</p>
            </div>
          </div>
        </div>

        <div className="bg-background border-b border-border py-4 sticky top-16 z-40">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab('proyectos')}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
                  activeTab === 'proyectos' ? 'text-white shadow-md' : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
                style={activeTab === 'proyectos' ? { backgroundColor: primaryColor } : {}}
                aria-pressed={activeTab === 'proyectos'}
              >
                <FlaskConical className="w-5 h-5" aria-hidden="true" />
                Proyectos de Investigación
              </button>
              <button
                onClick={() => setActiveTab('publicaciones')}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
                  activeTab === 'publicaciones' ? 'text-white shadow-md' : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
                style={activeTab === 'publicaciones' ? { backgroundColor: primaryColor } : {}}
                aria-pressed={activeTab === 'publicaciones'}
              >
                <BookOpen className="w-5 h-5" aria-hidden="true" />
                Publicaciones
              </button>
              <button
                onClick={() => setActiveTab('eventos')}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
                  activeTab === 'eventos' ? 'text-white shadow-md' : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
                style={activeTab === 'eventos' ? { backgroundColor: primaryColor } : {}}
                aria-pressed={activeTab === 'eventos'}
              >
                <Calendar className="w-5 h-5" aria-hidden="true" />
                Eventos
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-12">
          
          {activeTab === 'proyectos' && (
            <div>
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-4" style={{ color: primaryColor }}>Proyectos de Investigación</h2>
                <p className="text-muted-foreground">Conoce los proyectos de investigación que estamos desarrollando</p>
              </div>

              {gacetas.length === 0 ? (
                <div className="text-center py-20">
                  <FlaskConical className="w-16 h-16 mx-auto mb-4 text-muted-foreground" aria-hidden="true" />
                  <h3 className="text-xl font-bold mb-2">No hay proyectos registrados</h3>
                  <p className="text-muted-foreground">Próximamente se publicarán nuevos proyectos de investigación</p>
                </div>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {gacetasPagina.map((gaceta) => (
                      <Link key={gaceta.gaceta_id} href={`/institutoInvestigacion/gacetas/${gaceta.gaceta_id}`} className="block group">
                        <div className="bg-card rounded-xl border border-border hover:shadow-xl transition-all hover:-translate-y-1 p-6">
                          <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: `${primaryColor}15` }}>
                            <FileText className="w-6 h-6" style={{ color: primaryColor }} aria-hidden="true" />
                          </div>
                          <h3 className="text-lg font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">{gaceta.gaceta_titulo}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" style={{ color: primaryColor }} aria-hidden="true" />
                            <span>{formatDate(gaceta.gaceta_fecha)}</span>
                          </div>
                          {gaceta.gaceta_documento && (
                            <div className="mt-4 pt-4 border-t border-border">
                              <span className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: primaryColor }}>
                                Ver proyecto <ChevronRight className="w-4 h-4" aria-hidden="true" />
                              </span>
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>

                  {renderPagination(paginaProyectos, totalPaginasProyectos, (page) => cambiarPagina(setPaginaProyectos, page, totalPaginasProyectos))}
                  {totalPaginasProyectos > 1 && (
                    <p className="text-center text-sm text-muted-foreground mt-4">Página {paginaProyectos} de {totalPaginasProyectos}</p>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'publicaciones' && (
            <div>
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-4" style={{ color: primaryColor }}>Publicaciones Científicas</h2>
                <p className="text-muted-foreground">Artículos, papers y documentos académicos producidos por el instituto</p>
              </div>

              {publicaciones.length === 0 ? (
                <div className="text-center py-20">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" aria-hidden="true" />
                  <h3 className="text-xl font-bold mb-2">No hay publicaciones disponibles</h3>
                  <p className="text-muted-foreground">Las publicaciones del instituto aparecerán aquí</p>
                </div>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {publicacionesPagina.map((publi) => (
                      <Link key={publi.publicaciones_id} href={`/institutoInvestigacion/publicaciones/${publi.publicaciones_id}`} className="block group">
                        <div className="bg-card rounded-xl border border-border hover:shadow-xl transition-all hover:-translate-y-1 overflow-hidden">
                          {publi.publicaciones_imagen ? (
                            <div className="relative h-40 bg-muted">
                              <Image
                                src={getStorageUrl(publi.publicaciones_imagen)}
                                alt={publi.publicaciones_titulo}
                                fill
                                className="object-cover transition-transform group-hover:scale-105"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                loading="lazy"
                              />
                            </div>
                          ) : (
                            <div className="relative h-40 flex items-center justify-center" style={{ backgroundColor: `${primaryColor}10` }}>
                              <BookOpen className="w-16 h-16" style={{ color: primaryColor }} aria-hidden="true" />
                            </div>
                          )}
                          <div className="p-5">
                            <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">{publi.publicaciones_titulo}</h3>
                            {publi.publicaciones_autor && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                <Users className="w-3 h-3" style={{ color: primaryColor }} aria-hidden="true" />
                                <span>{publi.publicaciones_autor}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" style={{ color: primaryColor }} aria-hidden="true" />
                              <span>{formatDate(publi.publicaciones_fecha)}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {renderPagination(paginaPublicaciones, totalPaginasPublicaciones, (page) => cambiarPagina(setPaginaPublicaciones, page, totalPaginasPublicaciones))}
                  {totalPaginasPublicaciones > 1 && (
                    <p className="text-center text-sm text-muted-foreground mt-4">Página {paginaPublicaciones} de {totalPaginasPublicaciones}</p>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'eventos' && (
            <div>
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-4" style={{ color: primaryColor }}>Eventos de Investigación</h2>
                <p className="text-muted-foreground">Congresos, seminarios, talleres y actividades académicas</p>
              </div>

              {eventos.length === 0 ? (
                <div className="text-center py-20">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" aria-hidden="true" />
                  <h3 className="text-xl font-bold mb-2">No hay eventos programados</h3>
                  <p className="text-muted-foreground">Próximamente se anunciarán nuevos eventos de investigación</p>
                </div>
              ) : (
                <>
                  <div className="space-y-6">
                    {eventosPagina.map((evento) => (
                      <Link key={evento.evento_id} href={`/institutoInvestigacion/eventos/${evento.evento_id}`} className="block group">
                        <div className="bg-card rounded-xl border border-border hover:shadow-xl transition-all hover:-translate-y-1 overflow-hidden">
                          <div className="flex flex-col md:flex-row">
                            {evento.evento_imagen && (
                              <div className="relative w-full md:w-72 h-48 md:h-auto">
                                <Image
                                  src={getStorageUrl(evento.evento_imagen)}
                                  alt={evento.evento_titulo}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 768px) 100vw, 288px"
                                  loading="lazy"
                                />
                              </div>
                            )}
                            <div className="flex-1 p-6">
                              <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{evento.evento_titulo}</h3>
                              {evento.evento_descripcion && (
                                <p className="text-muted-foreground text-sm mb-4 line-clamp-2" dangerouslySetInnerHTML={{ __html: sanitizeHTML(evento.evento_descripcion) }} />
                              )}
                              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" style={{ color: primaryColor }} aria-hidden="true" />
                                  <span>{formatDate(evento.evento_fecha)}</span>
                                </div>
                                {evento.evento_hora && (
                                  <div className="flex items-center gap-2">
                                    <Target className="w-4 h-4" style={{ color: primaryColor }} aria-hidden="true" />
                                    <span>{evento.evento_hora}</span>
                                  </div>
                                )}
                                {evento.evento_lugar && (
                                  <div className="flex items-center gap-2">
                                    <GraduationCap className="w-4 h-4" style={{ color: primaryColor }} aria-hidden="true" />
                                    <span>{evento.evento_lugar}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {renderPagination(paginaEventos, totalPaginasEventos, (page) => cambiarPagina(setPaginaEventos, page, totalPaginasEventos))}
                  {totalPaginasEventos > 1 && (
                    <p className="text-center text-sm text-muted-foreground mt-4">Página {paginaEventos} de {totalPaginasEventos}</p>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="bg-muted/50 py-16 border-t">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12" style={{ color: primaryColor }}>Líneas de Investigación</h2>
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[
                { icon: Microscope, title: 'Ciencias de la Salud', desc: 'Investigación en salud pública y clínica' },
                { icon: Target, title: 'Educación', desc: 'Innovación educativa y pedagogía' },
                { icon: TrendingUp, title: 'Ciencias Sociales', desc: 'Desarrollo comunitario y social' },
                { icon: BookOpen, title: 'Humanidades', desc: 'Estudios culturales y lingüísticos' },
                { icon: FlaskConical, title: 'Ciencias Básicas', desc: 'Investigación científica fundamental' },
                { icon: Award, title: 'Tecnología', desc: 'Innovación tecnológica y digital' },
                { icon: Users, title: 'Gestión Pública', desc: 'Administración y políticas públicas' },
                { icon: GraduationCap, title: 'Formación Docente', desc: 'Desarrollo profesional docente' },
              ].map((linea, idx) => (
                <div key={idx} className="bg-card rounded-xl p-6 border text-center hover:shadow-lg transition-shadow">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${primaryColor}15` }}>
                    <linea.icon className="w-7 h-7" style={{ color: primaryColor }} aria-hidden="true" />
                  </div>
                  <h3 className="font-bold mb-2">{linea.title}</h3>
                  <p className="text-sm text-muted-foreground">{linea.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </ThemeDynamicProvider>
  );
}

export default function InstitutoInvestigacionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Cargando instituto...</p>
        </div>
      </div>
    }>
      <InstitutoInvestigacionContent />
    </Suspense>
  );
}