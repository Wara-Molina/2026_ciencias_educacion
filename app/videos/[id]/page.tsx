// app/videos/[id]/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Share2, ExternalLink, Loader2, Youtube, Play, Info
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
  }>;
}

// ==================== COMPONENTE ====================
function VideoDetalleContent() {
  const params = useParams();
  const router = useRouter();
  
  const videoId = Number(params.id);
  if (isNaN(videoId)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold mb-4">ID de video inválido</p>
          <Link href="/videos" className="text-primary hover:underline">
            ← Volver a videos
          </Link>
        </div>
      </div>
    );
  }

  const [video, setVideo] = useState<Video | null>(null);
  const [institucion, setInstitucion] = useState<InstitucionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [primaryColor, setPrimaryColor] = useState('#04246C');
  const [secondaryColor, setSecondaryColor] = useState('#FC0102');

  const institucionId = Number(process.env.NEXT_PUBLIC_INSTITUCION_ID) || 12;

  useEffect(() => {
    let isMounted = true;

    const fetchVideo = async () => {
      try {
        setLoading(true);
        const [videoRes, instRes] = await Promise.all([
          api.get(`/institucion/${institucionId}/contenido`),
          api.get(`/institucionesPrincipal/${institucionId}`)
        ]);

        if (!isMounted) return;

        const videoEncontrado = videoRes.data.upea_videos?.find(
          (v: any) => v.video_id === videoId && v.video_estado === 1
        );

        if (!videoEncontrado) {
          setError('Video no encontrado');
          return;
        }

        setVideo({
          video_id: videoEncontrado.video_id,
          video_titulo: videoEncontrado.video_titulo,
          video_breve_descripcion: videoEncontrado.video_breve_descripcion,
          video_enlace: videoEncontrado.video_enlace,
          video_estado: videoEncontrado.video_estado,
          video_tipo: videoEncontrado.video_tipo
        });

        setInstitucion(instRes.data.Descripcion || null);

        if (instRes.data.Descripcion?.colorinstitucion?.[0]) {
          setPrimaryColor(instRes.data.Descripcion.colorinstitucion[0].color_primario || '#04246C');
          setSecondaryColor(instRes.data.Descripcion.colorinstitucion[0].color_secundario || '#FC0102');
        }
      } catch (err) {
        if (isMounted) setError('Error al cargar el video');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchVideo();
    return () => { isMounted = false; };
  }, [videoId, institucionId]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: video?.video_titulo,
          text: video?.video_breve_descripcion?.replace(/<[^>]*>/g, '') || '',
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error compartiendo:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('¡Enlace copiado al portapapeles!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin" style={{ color: primaryColor }} />
      </div>
    );
  }

  if (error || !video) {
    return (
      <ThemeDynamicProvider colors={{ primary: primaryColor, secondary: secondaryColor }}>
        <div className="min-h-screen bg-background flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">🎥</div>
            <h2 className="text-2xl font-bold mb-2">{error || 'Video no encontrado'}</h2>
            <div className="flex gap-4 justify-center mt-6">
              <Link
                href="/videos"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white"
                style={{ backgroundColor: primaryColor }}
              >
                <ArrowLeft className="w-4 h-4" />
                Volver a videos
              </Link>
            </div>
          </div>
        </div>
      </ThemeDynamicProvider>
    );
  }

  // Extraer YouTube ID para embed
  const getYouTubeId = (url?: string) => {
    if (!url) return null;
    const match = url.match(/embed\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  };

  const youtubeId = getYouTubeId(video.video_enlace);
  const embedUrl = youtubeId ? `https://www.youtube.com/embed/${youtubeId}?autoplay=1` : '';
  const youtubeWatchUrl = video.video_enlace?.replace('embed/', 'watch?v=') || '#';

  return (
    <ThemeDynamicProvider colors={{ primary: primaryColor, secondary: secondaryColor }}>
      <div className="min-h-screen bg-background">
        
        {/* ✅ Header con más espacio - Debajo del navbar */}
        <div className="bg-card border-b px-4 py-6 mt-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <button 
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Volver
            </button>
            <button
              onClick={handleShare}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              title="Compartir"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenido Principal - Con padding adicional */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          
          {/* Reproductor de Video */}
          <div className="mb-8">
            <div className="bg-black rounded-xl overflow-hidden shadow-2xl aspect-video">
              {youtubeId ? (
                <iframe
                  width="100%"
                  height="100%"
                  src={embedUrl}
                  title={video.video_titulo}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted min-h-[400px]">
                  <div className="text-center">
                    <Youtube className="w-16 h-16 mx-auto mb-4 text-red-500" />
                    <p className="text-muted-foreground mb-4">Video de YouTube no disponible</p>
                    {video.video_enlace && (
                      <a 
                        href={video.video_enlace}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Abrir en YouTube
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info del Video - Layout de 2 columnas */}
          <div className="grid md:grid-cols-3 gap-8">
            
            {/* Columna Izquierda: Información (2/3) */}
            <div className="md:col-span-2">
              <div className="mb-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h1 className="text-2xl md:text-3xl font-bold">{video.video_titulo}</h1>
                  {video.video_tipo && (
                    <span 
                      className="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0"
                      style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                    >
                      {video.video_tipo}
                    </span>
                  )}
                </div>

                {video.video_breve_descripcion && (
                  <div className="prose prose-sm max-w-none text-muted-foreground">
                    <div dangerouslySetInnerHTML={{ __html: video.video_breve_descripcion }} />
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="flex flex-wrap gap-3 pt-6 border-t">
                <a
                  href={youtubeWatchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition-all hover:shadow-lg"
                  style={{ backgroundColor: '#FF0000' }}
                >
                  <Youtube className="w-5 h-5" />
                  Ver en YouTube
                  <ExternalLink className="w-4 h-4" />
                </a>
                
 
              </div>
            </div>

            {/* Columna Derecha: Sidebar (1/3) */}
            <div className="md:col-span-1">
              <div className="bg-card rounded-xl border p-6 sticky top-24">
                <div className="flex items-center gap-2 mb-4 pb-4 border-b">
                  <Info className="w-5 h-5" style={{ color: primaryColor }} />
                  <h3 className="font-bold text-lg">Información</h3>
                </div>
                
                <div className="space-y-4">
                  {video.video_tipo && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Categoría</p>
                      <p className="font-medium">{video.video_tipo}</p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Plataforma</p>
                    <div className="flex items-center gap-2">
                      <Youtube className="w-4 h-4 text-red-500" />
                      <p className="font-medium">YouTube</p>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </ThemeDynamicProvider>
  );
}

export default function VideoDetallePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    }>
      <VideoDetalleContent />
    </Suspense>
  );
}