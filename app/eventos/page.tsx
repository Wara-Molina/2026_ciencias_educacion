// app/eventos/page.tsx
'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Calendar, MapPin, Clock, Loader2, ArrowLeft, Search,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import Link from 'next/link';

import api from '@/lib/axios';
import { getStorageUrl } from '@/lib/utils';
import { sanitizeHTML } from '@/lib/sanitize';
import ThemeDynamicProvider from '@/components/providers/ThemeDynamicProvider';
import CalendarWidget from '@/app/CalendarWidget';

interface Evento {
  evento_id: number;
  evento_titulo: string;
  evento_imagen?: string;
  evento_descripcion?: string;
  evento_fecha: string;
  evento_hora?: string;
  evento_lugar?: string;
  tipo_evento: string;
}

interface InstitucionData {
  institucion_nombre?: string;
  institucion_iniciales?: string;
  institucion_logo_url?: string;
  institucion_direccion?: string;
  institucion_correo1?: string;
  institucion_celular1?: number;
  colorinstitucion: Array<{
    color_primario: string;
    color_secundario: string;
  }>;
}

const isValidImageUrl = (url: string | undefined): boolean => {
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

const sanitizeSearchQuery = (query: string): string => {
  return query.replace(/[<>\"'&]/g, '').trim().slice(0, 200);
};

const isValidHexColor = (color: string | undefined): boolean => {
  if (!color) return false;
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
};

function EventosContent() {
  const institucionId = Number(process.env.NEXT_PUBLIC_INSTITUCION_ID) || 12;
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawPagina = Number(searchParams.get('pagina'));
  const paginaActual = Number.isInteger(rawPagina) && rawPagina > 0 && rawPagina < 10000 ? rawPagina : 1;
  
  const itemsPorPagina = 5;
  
  const [busqueda, setBusqueda] = useState('');
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [institucion, setInstitucion] = useState<InstitucionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [primaryColor, setPrimaryColor] = useState('#04246C');
  const [secondaryColor, setSecondaryColor] = useState('#FC0102');

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // ✅ CORRECCIÓN: Usar rutas relativas (axios tiene baseURL configurado)
        const [eventoRes, instRes] = await Promise.all([
          api.get(`/institucion/${institucionId}/gacetaEventos`),
          api.get(`/institucionesPrincipal/${institucionId}`)
        ]);

        if (!isMounted) return;

        const eventosData = (eventoRes.data.upea_evento || [])
          .filter((e: any) => e.evento_id)
          .map((e: any) => ({
            evento_id: e.evento_id,
            evento_titulo: sanitizeTextField(e.evento_titulo, 200),
            evento_imagen: e.evento_imagen,
            evento_descripcion: sanitizeHTML(e.evento_descripcion || ''),
            evento_fecha: e.evento_fecha,
            evento_hora: e.evento_hora,
            evento_lugar: sanitizeTextField(e.evento_lugar, 150),
            tipo_evento: sanitizeTextField(e.tipo_evento, 50)
          })) as Evento[];

        setEventos(eventosData);
        setInstitucion(instRes.data.Descripcion || null);

        if (instRes.data.Descripcion?.colorinstitucion?.[0]) {
          const colors = instRes.data.Descripcion.colorinstitucion[0];
          setPrimaryColor(isValidHexColor(colors.color_primario) ? colors.color_primario : '#04246C');
          setSecondaryColor(isValidHexColor(colors.color_secundario) ? colors.color_secundario : '#FC0102');
        }
      } catch (err: any) {
        if (isMounted) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Error cargando eventos:', err);
          }
          setError('No se pudieron cargar los eventos. Intente más tarde.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [institucionId]);

  const formatDateFull = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    }).format(date);
  };

  const getTypeStyle = (type: string) => {
    const t = type?.toUpperCase() || '';
    const safePrimary = isValidHexColor(primaryColor) ? primaryColor : '#04246C';
    const safeSecondary = isValidHexColor(secondaryColor) ? secondaryColor : '#FC0102';
    
    if (t.includes('TALLER') || t.includes('WORKSHOP')) return { backgroundColor: `${safeSecondary}15`, color: safeSecondary };
    if (t.includes('SEMINARIO')) return { backgroundColor: '#f59e0b15', color: '#f59e0b' };
    return { backgroundColor: `${safePrimary}15`, color: safePrimary };
  };

  const sanitizedBusqueda = useMemo(() => sanitizeSearchQuery(busqueda), [busqueda]);
  const eventosFiltrados = useMemo(() => eventos.filter((evento) => {
    if (!sanitizedBusqueda) return true;
    const query = sanitizedBusqueda.toLowerCase();
    return (
      evento.evento_titulo.toLowerCase().includes(query) ||
      (evento.evento_descripcion?.toLowerCase().includes(query) || false) ||
      evento.tipo_evento.toLowerCase().includes(query) ||
      (evento.evento_lugar?.toLowerCase().includes(query) || false)
    );
  }), [eventos, sanitizedBusqueda]);

  const totalPaginas = Math.max(1, Math.ceil(eventosFiltrados.length / itemsPorPagina));
  const safePaginaActual = Math.min(Math.max(1, paginaActual), totalPaginas);
  const inicio = (safePaginaActual - 1) * itemsPorPagina;
  const fin = Math.min(inicio + itemsPorPagina, eventosFiltrados.length);
  const eventosPagina = eventosFiltrados.slice(inicio, fin);

  const cambiarPagina = (nuevaPagina: number) => {
    const safePagina = Number.isInteger(nuevaPagina) && nuevaPagina > 0 && nuevaPagina <= totalPaginas ? nuevaPagina : 1;
    const params = new URLSearchParams(searchParams.toString());
    params.set('pagina', safePagina.toString());
    router.push(`/eventos?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (safePaginaActual > 1) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('pagina', '1');
      router.replace(`/eventos?${params.toString()}`, { scroll: false });
    }
  }, [sanitizedBusqueda]);

  const eventosParaCalendario = useMemo(() => eventos.map(evento => ({
    evento_id: evento.evento_id,
    evento_titulo: evento.evento_titulo,
    evento_fecha: evento.evento_fecha,
    evento_hora: evento.evento_hora,
    evento_lugar: evento.evento_lugar,
    evento_estado: '1'
  })), [eventos]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: primaryColor }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-muted-foreground">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 rounded-lg text-white" style={{ backgroundColor: primaryColor }}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <ThemeDynamicProvider colors={{ primary: primaryColor, secondary: secondaryColor }}>
      <div className="flex flex-col min-h-screen bg-background">
        
<section className="relative py-20 overflow-hidden">

  {/* Imagen de fondo */}
  <div
    className="absolute inset-0 bg-cover bg-center"
    style={{
      backgroundImage: "url('/imagenes/imagen_upea.jpg')"
    }}
  />

  {/* Capa oscura para mejorar lectura */}
  <div className="absolute inset-0 bg-black/60" />

  {/* Patrón decorativo */}
  <div className="absolute inset-0 opacity-10">
    <div
      className="absolute inset-0"
      style={{
        backgroundImage:
          "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
        backgroundSize: "40px 40px",
      }}
    />
  </div>

  {/* Efectos decorativos */}
  <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
  <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

  {/* Línea inferior */}
  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

  {/* Contenido */}
  <div className="relative max-w-6xl mx-auto px-4">
    <Link
      href="/"
      className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white mb-8 transition-colors group"
    >
      <div className="p-2 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors">
        <ArrowLeft className="w-4 h-4" />
      </div>
      <span className="font-medium">Volver al inicio</span>
    </Link>

    <div className="flex items-center gap-4 mb-6">
      <div className="p-4 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20">
        <Calendar className="w-10 h-10 text-white" />
      </div>

      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white">
        Próximos Eventos
      </h1>
    </div>

    <p className="text-lg md:text-xl text-white/90 max-w-3xl leading-relaxed">
      Participa en conferencias, talleres y eventos de networking con la
      comunidad educativa de{" "}
      <span className="font-semibold text-white">
        {institucion?.institucion_nombre || "nuestra institución"}
      </span>
    </p>

    <div className="mt-8 inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      <span className="text-sm text-white/90">
        {eventos.length} eventos disponibles
      </span>
    </div>
  </div>

</section>

        <section className="bg-background border-b py-4 sticky top-16 z-40">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              
              <div className="relative w-full lg:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Buscar eventos por título, lugar o tipo..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  style={{ borderColor: `${primaryColor}30` }}
                  aria-label="Buscar eventos"
                />
              </div>

              <div className="text-sm text-muted-foreground">
                {eventosFiltrados.length} evento{eventosFiltrados.length !== 1 ? 's' : ''} encontrado{eventosFiltrados.length !== 1 ? 's' : ''}
                {busqueda && ` para "${busqueda}"`}
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-background">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-3 gap-8">

              <div className="lg:col-span-2">
                
                {eventosPagina.length === 0 ? (
                  <div className="text-center py-16">
                    <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" aria-hidden="true" />
                    <h3 className="text-xl font-bold mb-2">No se encontraron eventos</h3>
                    <p className="text-muted-foreground mb-6">Intenta con otros términos de búsqueda</p>
                    <button onClick={() => setBusqueda('')} className="px-6 py-3 rounded-lg font-medium text-white" style={{ backgroundColor: primaryColor }}>
                      Limpiar búsqueda
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-6">
                      {eventosPagina.map((event) => (
                        <Link key={event.evento_id} href={`/eventos/${event.evento_id}`} className="block group">
                          <div className="bg-card rounded-xl border border-border p-6 hover:shadow-lg transition-shadow">
                            <div className="flex flex-col md:flex-row md:items-start gap-6">
                              
                              <div className="flex-shrink-0">
                                <div className="rounded-lg p-4 text-center w-20" style={{ backgroundColor: `${primaryColor}15` }}>
                                  <div className="text-xs uppercase text-muted-foreground font-semibold">
                                    {new Date(event.evento_fecha).toLocaleDateString('es-ES', { month: 'short' })}
                                  </div>
                                  <div className="text-2xl font-bold" style={{ color: primaryColor }}>
                                    {new Date(event.evento_fecha).getDate()}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(event.evento_fecha).getFullYear()}
                                  </div>
                                </div>
                              </div>

                              <div className="flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                                  <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                                    {event.evento_titulo}
                                  </h3>
                                  <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold w-fit" style={getTypeStyle(event.tipo_evento)}>
                                    {event.tipo_evento}
                                  </div>
                                </div>

                                <p className="text-muted-foreground mb-4 line-clamp-2" dangerouslySetInnerHTML={{ __html: sanitizeHTML(event.evento_descripcion || '') }} />

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Clock className="w-4 h-4" style={{ color: primaryColor }} aria-hidden="true" />
                                    <span>{event.evento_hora ? event.evento_hora.substring(0, 5) : 'Hora por confirmar'}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <MapPin className="w-4 h-4" style={{ color: primaryColor }} aria-hidden="true" />
                                    <span>{event.evento_lugar || 'Lugar por confirmar'}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="w-4 h-4" style={{ color: primaryColor }} aria-hidden="true" />
                                    <span>{formatDateFull(event.evento_fecha)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>

                    {totalPaginas > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-12" role="navigation" aria-label="Paginación de eventos">
                        <button
                          onClick={() => cambiarPagina(safePaginaActual - 1)}
                          disabled={safePaginaActual === 1}
                          className="p-2 rounded-lg border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                          aria-label="Página anterior"
                        >
                          <ChevronLeft className="w-5 h-5" aria-hidden="true" />
                        </button>
                        
                        {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => (
                          <button
                            key={pagina}
                            onClick={() => cambiarPagina(pagina)}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                              pagina === safePaginaActual ? 'text-white' : 'border border-border hover:bg-muted'
                            }`}
                            style={pagina === safePaginaActual ? { backgroundColor: primaryColor } : {}}
                            aria-current={pagina === safePaginaActual ? 'page' : undefined}
                            aria-label={`Ir a página ${pagina}`}
                          >
                            {pagina}
                          </button>
                        ))}
                        
                        <button
                          onClick={() => cambiarPagina(safePaginaActual + 1)}
                          disabled={safePaginaActual === totalPaginas}
                          className="p-2 rounded-lg border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                          aria-label="Página siguiente"
                        >
                          <ChevronRight className="w-5 h-5" aria-hidden="true" />
                        </button>
                      </div>
                    )}

                    <p className="text-center text-sm text-muted-foreground mt-4">
                      Página {safePaginaActual} de {totalPaginas} - Mostrando {eventosPagina.length} de {eventosFiltrados.length} eventos
                    </p>
                  </>
                )}
              </div>

              <div className="lg:col-span-1">
                <div className="sticky top-24 space-y-8">
                  
                  <div className="bg-card rounded-2xl shadow-lg border overflow-hidden">
                    <div className="p-4 border-b bg-muted/30">
                      <h2 className="font-bold text-lg flex items-center gap-2" style={{ color: primaryColor }}>
                        <Calendar className="w-5 h-5" aria-hidden="true" />
                        Calendario de Eventos
                      </h2>
                    </div>
                    <div className="p-4">
                      <CalendarWidget 
                        colores={{ color_primario: primaryColor, color_secundario: secondaryColor }} 
                        eventos={eventosParaCalendario} 
                      />
                    </div>
                  </div>

                  {eventos.length > 0 && (
                    <div>
                      <h3 className="font-bold mb-4 text-lg px-2" style={{ color: primaryColor }}>
                        Próximos Eventos
                      </h3>
                      <div className="space-y-3">
                        {eventos.slice(0, 4).map((evento) => (
                          <Link key={evento.evento_id} href={`/eventos/${evento.evento_id}`} className="block group">
                            <div className="p-4 rounded-lg border hover:shadow-md transition-shadow bg-card cursor-pointer">
                              <h4 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                                {evento.evento_titulo}
                              </h4>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3" aria-hidden="true" />
                                <span>{new Date(evento.evento_fecha).toLocaleDateString('es-BO')}</span>
                              </div>
                              {evento.evento_lugar && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                  <MapPin className="w-3 h-3" aria-hidden="true" />
                                  <span className="line-clamp-1">{evento.evento_lugar}</span>
                                </div>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>

            </div>
          </div>
        </section>

      </div>
    </ThemeDynamicProvider>
  );
}

export default function EventosPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    }>
      <EventosContent />
    </Suspense>
  );
}