// app/videos/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Play, Calendar, Eye, Search, Filter, 
  ArrowLeft, Loader2, Video, Youtube,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import Link from 'next/link';

import api from '@/lib/axios';
import ThemeDynamicProvider from '@/components/providers/ThemeDynamicProvider';

// ==================== TIPOS ====================
interface Video {
  video_id: number;
  video_titulo: string;
  video_breve_descripcion?: string;
  video_enlace?: string;
  video_estado: number;
  video_tipo?: string;
}

interface InstitucionData {
  institucion_nombre: string;
  colorinstitucion: Array<{
    color_primario: string;
    color_secundario: string;
    color_terciario: string;
  }>;
}

// ==================== COMPONENTE PRINCIPAL ====================
function VideosContent() {
  const institucionId = Number(process.env.NEXT_PUBLIC_INSTITUCION_ID) || 12;
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // ✅ Estados para paginación
  const paginaActual = Number(searchParams.get('pagina')) || 1;
  const itemsPorPagina = 6;
  
  const [videos, setVideos] = useState<Video[]>([]);
  const [institucion, setInstitucion] = useState<InstitucionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [tiposDisponibles, setTiposDisponibles] = useState<string[]>([]);
  
  const [primaryColor, setPrimaryColor] = useState('#04246C');
  const [secondaryColor, setSecondaryColor] = useState('#FC0102');

  // Fetch datos
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [videosRes, instRes] = await Promise.all([
          api.get(`/institucion/${institucionId}/contenido`),
          api.get(`/institucionesPrincipal/${institucionId}`)
        ]);

        if (!isMounted) return;

        const videosData = (videosRes.data.upea_videos || [])
          .filter((v: any) => v.video_estado === 1)
          .map((v: any) => ({
            video_id: v.video_id,
            video_titulo: v.video_titulo || 'Sin título',
            video_breve_descripcion: v.video_breve_descripcion || '',
            video_enlace: v.video_enlace,
            video_estado: v.video_estado,
            video_tipo: v.video_tipo || 'General'
          })) as Video[];

        setVideos(videosData);
        setInstitucion(instRes.data.Descripcion || null);

        const tipos = Array.from(new Set(videosData.map(v => v.video_tipo))).filter(Boolean);
        setTiposDisponibles(['TODOS', ...tipos as string[]]);

        if (instRes.data.Descripcion?.colorinstitucion?.[0]) {
          setPrimaryColor(instRes.data.Descripcion.colorinstitucion[0].color_primario || '#04246C');
          setSecondaryColor(instRes.data.Descripcion.colorinstitucion[0].color_secundario || '#FC0102');
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('❌ Error cargando videos:', err);
          setError('No se pudieron cargar los videos. Intente más tarde.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [institucionId]);

  // Helpers
  const getYouTubeId = (url?: string) => {
    if (!url) return null;
    const match = url.match(/embed\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  };

  // ✅ Filtrar videos por tipo + búsqueda
  const videosFiltrados = videos.filter((video) => {
    const coincideTipo = filtroTipo === 'TODOS' || video.video_tipo === filtroTipo;
    const coincideBusqueda = busqueda === '' || 
      video.video_titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      video.video_breve_descripcion?.toLowerCase().includes(busqueda.toLowerCase());
    return coincideTipo && coincideBusqueda;
  });

  // ✅ Cálculos de paginación
  const totalPaginas = Math.ceil(videosFiltrados.length / itemsPorPagina);
  const inicio = (paginaActual - 1) * itemsPorPagina;
  const fin = inicio + itemsPorPagina;
  const videosPagina = videosFiltrados.slice(inicio, fin);

  // ✅ Cambiar página y actualizar URL
  const cambiarPagina = (nuevaPagina: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('pagina', nuevaPagina.toString());
    router.push(`/videos?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ✅ Resetear a página 1 al cambiar filtros o búsqueda
  useEffect(() => {
    if (paginaActual > 1) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('pagina', '1');
      router.replace(`/videos?${params.toString()}`, { scroll: false });
    }
  }, [busqueda, filtroTipo]);

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
          <div className="text-5xl mb-4">⚠️</div>
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

  return (
    <ThemeDynamicProvider colors={{ primary: primaryColor, secondary: secondaryColor }}>
      <div className="min-h-screen bg-background">
        
{/* 🎨 Header Elegante con Degradado */}
<section className="relative py-20 overflow-hidden">
  {/* ✅ Fondo con degradado elegante */}
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
  
  {/* ✅ Overlay de patrón sutil */}
  <div className="absolute inset-0 opacity-10">
    <div 
      className="absolute inset-0"
      style={{
        backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
        backgroundSize: '40px 40px'
      }}
    />
  </div>
  
  {/* ✅ Orbes decorativos para profundidad */}
  <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
  <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
  
  {/* ✅ Línea decorativa inferior */}
  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
  
  {/* ✅ Contenido */}
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
        <Video className="w-10 h-10 text-white" />
      </div>
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white">
        Videos Institucionales
      </h1>
    </div>
    
    <p className="text-lg md:text-xl text-white/90 max-w-3xl leading-relaxed">
      Conferences, clases grabadas y material audiovisual de{' '}
      <span className="font-semibold text-white">
        {institucion?.institucion_nombre || 'nuestra institución'}
      </span>
    </p>
    
    {/* ✅ Badge decorativo */}
    <div className="mt-8 inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      <span className="text-sm text-white/90">
        {videos.length} videos disponibles
      </span>
    </div>
  </div>
</section>

        {/* Filtros + Búsqueda */}
        <section className="bg-background border-b py-4 sticky top-16 z-40">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-4">
              
              {/* Filtros por tipo */}
              <div className="flex flex-wrap gap-2">
                <Filter className="w-5 h-5 text-muted-foreground self-center mr-2" />
                {tiposDisponibles.map((tipo) => (
                  <button
                    key={tipo}
                    onClick={() => setFiltroTipo(tipo)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      filtroTipo === tipo ? 'text-white shadow-md' : 'bg-muted text-foreground hover:bg-muted/80'
                    }`}
                    style={filtroTipo === tipo ? { backgroundColor: primaryColor } : {}}
                  >
                    {tipo === 'TODOS' ? 'Todos' : tipo}
                  </button>
                ))}
              </div>

              {/* Búsqueda */}
              <div className="relative w-full lg:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar videos..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  style={{ borderColor: `${primaryColor}30` }}
                />
              </div>
            </div>

            {/* Resultados count */}
            <div className="text-sm text-muted-foreground">
              {videosFiltrados.length} video{videosFiltrados.length !== 1 ? 's' : ''} encontrado{videosFiltrados.length !== 1 ? 's' : ''}
              {filtroTipo !== 'TODOS' && ` en ${filtroTipo}`}
              {busqueda && ` para "${busqueda}"`}
            </div>
          </div>
        </section>

        {/* Grid de Videos */}
        <section className="py-12">
          <div className="max-w-6xl mx-auto px-4">
            
            <div className="mb-6 flex items-center justify-between">
              <p className="text-muted-foreground">
                Mostrando {videosPagina.length} de {videosFiltrados.length} videos
              </p>
            </div>

            {videosPagina.length === 0 ? (
              <div className="text-center py-20">
                <Video className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-bold mb-2">No se encontraron videos</h3>
                <p className="text-muted-foreground mb-6">
                  Intenta con otros filtros o términos de búsqueda
                </p>
                <button
                  onClick={() => { setBusqueda(''); setFiltroTipo('TODOS'); }}
                  className="px-6 py-3 rounded-lg font-medium text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <>
                {/* Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {videosPagina.map((video) => {
                    const youtubeId = getYouTubeId(video.video_enlace);
                    
                    return (
                      <Link
                        key={video.video_id}
                        href={`/videos/${video.video_id}`}
                        className="block group"
                      >
                        <div className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1">
                          
                          {/* Thumbnail - YouTube */}
                          <div className="relative aspect-video bg-red-600">
                            {youtubeId ? (
                              <>
                                <img
                                  src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
                                  alt={video.video_titulo}
                                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                                    <Play className="w-8 h-8 ml-1 text-red-600" />
                                  </div>
                                </div>
                                <div className="absolute top-2 right-2 px-2 py-1 bg-red-600 rounded text-xs text-white font-medium flex items-center gap-1">
                                  <Youtube className="w-3 h-3" />
                                  YouTube
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Video className="w-16 h-16 text-white/50" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="p-5">
                            {video.video_tipo && (
                              <span 
                                className="inline-block px-2 py-1 rounded text-xs font-medium mb-2"
                                style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                              >
                                {video.video_tipo}
                              </span>
                            )}
                            
                            <h3 className="text-lg font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                              {video.video_titulo}
                            </h3>
                            
                            <p 
                              className="text-sm text-muted-foreground mb-4 line-clamp-2"
                              dangerouslySetInnerHTML={{ __html: video.video_breve_descripcion || '' }}
                            />

                            <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t">
                              <div className="flex items-center gap-1">
                                <Youtube className="w-3 h-3 text-red-500" />
                                <span>Ver en YouTube</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* ✅ Paginación */}
                {totalPaginas > 1 && (
                  <div className="flex items-center justify-center gap-2">
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
                  Página {paginaActual} de {totalPaginas}
                </p>
              </>
            )}
          </div>
        </section>

      </div>
    </ThemeDynamicProvider>
  );
}

export default function VideosPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    }>
      <VideosContent />
    </Suspense>
  );
}