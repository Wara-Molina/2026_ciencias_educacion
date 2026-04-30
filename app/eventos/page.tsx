// app/eventos/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Calendar, MapPin, Clock, Loader2, ArrowLeft, Search,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import Link from 'next/link';

import api from '@/lib/axios';
import { getStorageUrl } from '@/lib/utils';
import ThemeDynamicProvider from '@/components/providers/ThemeDynamicProvider';
import CalendarWidget from '@/app/CalendarWidget'; // ✅ Importar calendario

// ==================== TIPOS ====================
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

// ==================== COMPONENTE PRINCIPAL ====================
function EventosContent() {
  const institucionId = Number(process.env.NEXT_PUBLIC_INSTITUCION_ID) || 12;
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // ✅ Estados para búsqueda y paginación
  const [busqueda, setBusqueda] = useState('');
  const paginaActual = Number(searchParams.get('pagina')) || 1;
  const itemsPorPagina = 5;
  
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [institucion, setInstitucion] = useState<InstitucionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Colores dinámicos con fallback
  const [primaryColor, setPrimaryColor] = useState('#04246C');
  const [secondaryColor, setSecondaryColor] = useState('#FC0102');

  // ==================== FETCH DATOS ====================
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [eventoRes, instRes] = await Promise.all([
          api.get(`/institucion/${institucionId}/gacetaEventos`),
          api.get(`/institucionesPrincipal/${institucionId}`)
        ]);

        if (!isMounted) return;

        const eventosData = (eventoRes.data.upea_evento || [])
          .filter((e: any) => e.evento_id)
          .map((e: any) => ({
            evento_id: e.evento_id,
            evento_titulo: e.evento_titulo || 'Evento sin título',
            evento_imagen: e.evento_imagen,
            evento_descripcion: e.evento_descripcion || '',
            evento_fecha: e.evento_fecha,
            evento_hora: e.evento_hora,
            evento_lugar: e.evento_lugar,
            tipo_evento: e.tipo_evento || 'General'
          })) as Evento[];

        setEventos(eventosData);
        setInstitucion(instRes.data.Descripcion || null);

        if (instRes.data.Descripcion?.colorinstitucion?.[0]) {
          setPrimaryColor(instRes.data.Descripcion.colorinstitucion[0].color_primario || '#04246C');
          setSecondaryColor(instRes.data.Descripcion.colorinstitucion[0].color_secundario || '#FC0102');
        }
      } catch (err: any) {
        if (isMounted) setError('No se pudieron cargar los eventos. Intente más tarde.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [institucionId]);

  // Helpers
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
    if (t.includes('TALLER') || t.includes('WORKSHOP')) return { backgroundColor: `${secondaryColor}15`, color: secondaryColor };
    if (t.includes('SEMINARIO')) return { backgroundColor: '#f59e0b15', color: '#f59e0b' };
    return { backgroundColor: `${primaryColor}15`, color: primaryColor };
  };

  // ✅ Filtrar eventos por búsqueda
  const eventosFiltrados = eventos.filter((evento) => {
    if (!busqueda) return true;
    const query = busqueda.toLowerCase();
    return (
      evento.evento_titulo.toLowerCase().includes(query) ||
      evento.evento_descripcion?.toLowerCase().includes(query) ||
      evento.tipo_evento.toLowerCase().includes(query) ||
      evento.evento_lugar?.toLowerCase().includes(query)
    );
  });

  // ✅ Cálculos de paginación
  const totalPaginas = Math.ceil(eventosFiltrados.length / itemsPorPagina);
  const inicio = (paginaActual - 1) * itemsPorPagina;
  const fin = inicio + itemsPorPagina;
  const eventosPagina = eventosFiltrados.slice(inicio, fin);

  // ✅ Cambiar página y actualizar URL
  const cambiarPagina = (nuevaPagina: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('pagina', nuevaPagina.toString());
    router.push(`/eventos?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ✅ Resetear a página 1 al cambiar búsqueda
  useEffect(() => {
    if (paginaActual > 1) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('pagina', '1');
      router.replace(`/eventos?${params.toString()}`, { scroll: false });
    }
  }, [busqueda]);

  // ==================== RENDER LOADING ====================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: primaryColor }} />
      </div>
    );
  }

  // ==================== RENDER ERROR ====================
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-muted-foreground">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 rounded-lg text-white"
            style={{ backgroundColor: primaryColor }}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // ✅ Preparar eventos para el calendario (formato compatible con CalendarWidget)
  const eventosParaCalendario = eventos.map(evento => ({
    evento_id: evento.evento_id,
    evento_titulo: evento.evento_titulo,
    evento_fecha: evento.evento_fecha,
    evento_hora: evento.evento_hora,
    evento_lugar: evento.evento_lugar,
    evento_estado: '1' // Estado activo para mostrar en calendario
  }));

  // ==================== RENDER PRINCIPAL ====================
  return (
    <ThemeDynamicProvider colors={{ primary: primaryColor, secondary: secondaryColor }}>
      <div className="flex flex-col min-h-screen bg-background">
        
        {/* 🎨 Header Elegante con Degradado */}
        <section className="relative py-20 overflow-hidden">
          <div 
            className="absolute inset-0"
            style={{ 
              background: `
                linear-gradient(135deg, 
                  ${primaryColor} 0%, 
                  ${primaryColor}cc 25%, 
                  ${secondaryColor}99 60%, 
                  ${secondaryColor}44 100%
                )
              ` 
            }}
          />
          
          <div className="absolute inset-0 opacity-10">
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                backgroundSize: '40px 40px'
              }}
            />
          </div>
          
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          
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
              Participa en conferencias, talleres y eventos de networking con la comunidad educativa de{' '}
              <span className="font-semibold text-white">
                {institucion?.institucion_nombre || 'nuestra institución'}
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

        {/* 🔍 Búsqueda + Filtros */}
        <section className="bg-background border-b py-4 sticky top-16 z-40">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              
              {/* Búsqueda */}
              <div className="relative w-full lg:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar eventos por título, lugar o tipo..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  style={{ borderColor: `${primaryColor}30` }}
                />
              </div>

              {/* Resultados count */}
              <div className="text-sm text-muted-foreground">
                {eventosFiltrados.length} evento{eventosFiltrados.length !== 1 ? 's' : ''} encontrado{eventosFiltrados.length !== 1 ? 's' : ''}
                {busqueda && ` para "${busqueda}"`}
              </div>
            </div>
          </div>
        </section>

        {/* 📅 Contenido: Lista + Calendario */}
        <section className="py-20 bg-background">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-3 gap-8">
              
              {/* Columna Izquierda: Lista de Eventos */}
              <div className="lg:col-span-2">
                
                {eventosPagina.length === 0 ? (
                  <div className="text-center py-16">
                    <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-bold mb-2">No se encontraron eventos</h3>
                    <p className="text-muted-foreground mb-6">
                      Intenta con otros términos de búsqueda
                    </p>
                    <button
                      onClick={() => setBusqueda('')}
                      className="px-6 py-3 rounded-lg font-medium text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Limpiar búsqueda
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-6">
                      {eventosPagina.map((event) => (
                        <Link
                          key={event.evento_id}
                          href={`/eventos/${event.evento_id}`}
                          className="block group"
                        >
                          <div className="bg-card rounded-xl border border-border p-6 hover:shadow-lg transition-shadow">
                            <div className="flex flex-col md:flex-row md:items-start gap-6">
                              
                              {/* Date Box */}
                              <div className="flex-shrink-0">
                                <div 
                                  className="rounded-lg p-4 text-center w-20"
                                  style={{ backgroundColor: `${primaryColor}15` }}
                                >
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

                              {/* Event Info */}
                              <div className="flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                                  <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                                    {event.evento_titulo}
                                  </h3>
                                  <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold w-fit" style={getTypeStyle(event.tipo_evento)}>
                                    {event.tipo_evento}
                                  </div>
                                </div>

                                <p 
                                  className="text-muted-foreground mb-4 line-clamp-2"
                                  dangerouslySetInnerHTML={{ __html: event.evento_descripcion || '' }}
                                />

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Clock className="w-4 h-4" style={{ color: primaryColor }} />
                                    <span>{event.evento_hora ? event.evento_hora.substring(0, 5) : 'Hora por confirmar'}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <MapPin className="w-4 h-4" style={{ color: primaryColor }} />
                                    <span>{event.evento_lugar || 'Lugar por confirmar'}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="w-4 h-4" style={{ color: primaryColor }} />
                                    <span>{formatDateFull(event.evento_fecha)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>

                    {/* ✅ Paginación */}
                    {totalPaginas > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-12">
                        {/* Botón Anterior */}
                        <button
                          onClick={() => cambiarPagina(paginaActual - 1)}
                          disabled={paginaActual === 1}
                          className="p-2 rounded-lg border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                          aria-label="Página anterior"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        
                        {/* Números de página */}
                        {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => (
                          <button
                            key={pagina}
                            onClick={() => cambiarPagina(pagina)}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                              pagina === paginaActual 
                                ? 'text-white' 
                                : 'border border-border hover:bg-muted'
                            }`}
                            style={pagina === paginaActual ? { backgroundColor: primaryColor } : {}}
                          >
                            {pagina}
                          </button>
                        ))}
                        
                        {/* Botón Siguiente */}
                        <button
                          onClick={() => cambiarPagina(paginaActual + 1)}
                          disabled={paginaActual === totalPaginas}
                          className="p-2 rounded-lg border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                          aria-label="Página siguiente"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    )}

                    {/* Info de paginación */}
                    <p className="text-center text-sm text-muted-foreground mt-4">
                      Página {paginaActual} de {totalPaginas} - Mostrando {eventosPagina.length} de {eventosFiltrados.length} eventos
                    </p>
                  </>
                )}
              </div>

              {/* Columna Derecha: Calendario Sticky */}
              <div className="lg:col-span-1">
                <div className="sticky top-24 space-y-8">
                  
                  {/* Calendario Widget */}
                  <div className="bg-card rounded-2xl shadow-lg border overflow-hidden">
                    <div className="p-4 border-b bg-muted/30">
                      <h2 className="font-bold text-lg flex items-center gap-2" style={{ color: primaryColor }}>
                        <Calendar className="w-5 h-5" />
                        Calendario de Eventos
                      </h2>
                    </div>
                    <div className="p-4">
                      <CalendarWidget 
                        colores={{ 
                          color_primario: primaryColor, 
                          color_secundario: secondaryColor
                        }} 
                        eventos={eventosParaCalendario} 
                      />
                    </div>
                  </div>

                  {/* Próximos Eventos (Lista compacta) */}
                  {eventos.length > 0 && (
                    <div>
                      <h3 className="font-bold mb-4 text-lg px-2" style={{ color: primaryColor }}>
                        Próximos Eventos
                      </h3>
                      <div className="space-y-3">
                        {eventos.slice(0, 4).map((evento) => (
                          <Link
                            key={evento.evento_id}
                            href={`/eventos/${evento.evento_id}`}
                            className="block group"
                          >
                            <div className="p-4 rounded-lg border hover:shadow-md transition-shadow bg-card cursor-pointer">
                              <h4 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                                {evento.evento_titulo}
                              </h4>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                <span>{new Date(evento.evento_fecha).toLocaleDateString('es-BO')}</span>
                              </div>
                              {evento.evento_lugar && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                  <MapPin className="w-3 h-3" />
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