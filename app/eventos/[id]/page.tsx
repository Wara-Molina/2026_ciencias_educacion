// app/eventos/[id]/page.tsx
'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Calendar, MapPin, Clock, Users, Share2, 
  Maximize2, X, ZoomIn, Loader2, ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

import api from '@/lib/axios';
import { getStorageUrl } from '@/lib/utils';
import { sanitizeHTML } from '@/lib/sanitize';
import ThemeDynamicProvider from '@/components/providers/ThemeDynamicProvider';

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
  institucion_nombre: string;
  colorinstitucion: Array<{
    color_primario: string;
    color_secundario: string;
    color_terciario: string;
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

const isValidHexColor = (color: string | undefined): boolean => {
  if (!color) return false;
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
};

function EventoDetalleContent() {
  const params = useParams();
  const router = useRouter();

  const rawEventoId = Number(params.id);
  const eventoId = Number.isInteger(rawEventoId) && rawEventoId > 0 && rawEventoId < 10000000 ? rawEventoId : null;
  
  if (eventoId === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">ID de evento inválido</h2>
          <Link href="/eventos" className="text-primary hover:underline">← Volver a eventos</Link>
        </div>
      </div>
    );
  }

  const [evento, setEvento] = useState<Evento | null>(null);
  const [institucion, setInstitucion] = useState<InstitucionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  const institucionId = Number(process.env.NEXT_PUBLIC_INSTITUCION_ID) || 12;
  const [primaryColor, setPrimaryColor] = useState('#04246C');
  const [secondaryColor, setSecondaryColor] = useState('#FC0102');

  useEffect(() => {
    let isMounted = true;

    const fetchEvento = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // ✅ CORRECCIÓN: Usar rutas relativas (axios tiene baseURL configurado)
        const [eventoRes, instRes] = await Promise.all([
          api.get(`/institucion/${institucionId}/gacetaEventos`),
          api.get(`/institucionesPrincipal/${institucionId}`)
        ]);

        if (!isMounted) return;

        const eventoEncontrado = eventoRes.data.upea_evento?.find(
          (e: any) => e.evento_id === eventoId
        );

        if (!eventoEncontrado) {
          setError('Evento no encontrado');
          return;
        }

        setEvento({
          evento_id: eventoEncontrado.evento_id,
          evento_titulo: sanitizeTextField(eventoEncontrado.evento_titulo, 200),
          evento_imagen: eventoEncontrado.evento_imagen,
          evento_descripcion: eventoEncontrado.evento_descripcion,
          evento_fecha: eventoEncontrado.evento_fecha,
          evento_hora: eventoEncontrado.evento_hora,
          evento_lugar: sanitizeTextField(eventoEncontrado.evento_lugar, 150),
          tipo_evento: sanitizeTextField(eventoEncontrado.tipo_evento, 50)
        });

        setInstitucion(instRes.data.Descripcion || null);

        if (instRes.data.Descripcion?.colorinstitucion?.[0]) {
          const colors = instRes.data.Descripcion.colorinstitucion[0];
          setPrimaryColor(isValidHexColor(colors.color_primario) ? colors.color_primario : '#04246C');
          setSecondaryColor(isValidHexColor(colors.color_secundario) ? colors.color_secundario : '#FC0102');
        }
      } catch (err: any) {
        if (isMounted) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Error cargando evento:', err);
          }
          setError('No se pudo cargar la información del evento');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchEvento();
    return () => { isMounted = false; };
  }, [eventoId, institucionId]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setImageModalOpen(false);
    };
    
    if (imageModalOpen) {
      window.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [imageModalOpen]);

  const formatDateFull = (dateString?: string) => {
    if (!dateString) return 'Fecha por confirmar';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    }).format(date);
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return 'Hora por confirmar';
    return timeString.substring(0, 5);
  };

  const getTypeStyle = (type: string) => {
    const t = type?.toUpperCase() || '';
    const safePrimary = isValidHexColor(primaryColor) ? primaryColor : '#04246C';
    const safeSecondary = isValidHexColor(secondaryColor) ? secondaryColor : '#FC0102';
    
    if (t.includes('TALLER') || t.includes('WORKSHOP')) 
      return { backgroundColor: `${safeSecondary}15`, color: safeSecondary };
    if (t.includes('SEMINARIO')) 
      return { backgroundColor: '#f59e0b15', color: '#f59e0b' };
    return { backgroundColor: `${safePrimary}15`, color: safePrimary };
  };

  const imageUrl = useMemo(() => {
    if (!evento?.evento_imagen) return '';
    const url = getStorageUrl(evento.evento_imagen);
    return isValidImageUrl(url) ? url : '';
  }, [evento?.evento_imagen]);

  const sanitizeForShare = (text: string | undefined): string => {
    if (!text) return '';
    return sanitizeHTML(text).replace(/<[^>]*>/g, '').trim().slice(0, 300);
  };

  const handleShare = async () => {
    if (!evento) return;
    const safeDescription = sanitizeForShare(evento.evento_descripcion);
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: evento.evento_titulo,
          text: safeDescription,
          url: window.location.href,
        });
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Share cancelado o error:', err);
        }
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const openImageModal = () => setImageModalOpen(true);
  const closeImageModal = () => setImageModalOpen(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin" style={{ color: primaryColor }} />
      </div>
    );
  }

  if (error || !evento) {
    return (
      <ThemeDynamicProvider colors={{ primary: primaryColor, secondary: secondaryColor }}>
        <div className="min-h-screen bg-background flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-2xl font-bold mb-2">{error || 'Evento no encontrado'}</h2>
            <p className="text-muted-foreground mb-6">El evento que buscas no existe o ha sido cancelado</p>
            <div className="flex gap-4 justify-center">
              <Link href="/eventos" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition-all hover:shadow-md" style={{ backgroundColor: primaryColor }}>
                <ArrowLeft className="w-4 h-4" /> Volver a eventos
              </Link>
            </div>
          </div>
        </div>
      </ThemeDynamicProvider>
    );
  }

  return (
    <ThemeDynamicProvider colors={{ primary: primaryColor, secondary: secondaryColor }}>
      <div className="min-h-screen bg-background">
        
        {evento.evento_imagen && imageUrl ? (
          <div className="relative h-64 md:h-80 group cursor-pointer" onClick={openImageModal} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && openImageModal()} aria-label="Ver imagen en tamaño completo">
            <Image src={imageUrl} alt={evento.evento_titulo} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/40 backdrop-blur-[2px]">
              <div className="text-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                <div className="bg-white/90 backdrop-blur-md rounded-full p-4 shadow-2xl mb-3 inline-flex items-center gap-2">
                  <ZoomIn className="w-6 h-6" style={{ color: primaryColor }} />
                  <span className="text-white font-semibold text-sm">Ver imagen completa</span>
                </div>
                <p className="text-white/90 text-sm font-medium drop-shadow-lg">Haz click para ampliar</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative py-16 bg-gradient-to-br from-primary/10 to-background">
            <div className="max-w-4xl mx-auto px-4">
              <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6" aria-label="Volver">
                <ArrowLeft className="w-4 h-4" /> Volver
              </button>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
                  <Calendar className="w-7 h-7" style={{ color: primaryColor }} aria-hidden="true" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold" style={{ color: primaryColor }}>{evento.evento_titulo}</h1>
              </div>
            </div>
          </div>
        )}

        {evento.evento_imagen && (
          <>
            <button onClick={(e) => { e.stopPropagation(); router.back(); }} className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-lg text-sm font-medium hover:bg-white transition-colors shadow-lg z-10" aria-label="Volver">
              <ArrowLeft className="w-4 h-4" /> Volver
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleShare(); }} className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors shadow-lg z-10" title="Compartir" aria-label="Compartir evento">
              <Share2 className="w-5 h-5" />
            </button>
          </>
        )}

        {imageModalOpen && evento.evento_imagen && imageUrl && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm" onClick={closeImageModal} role="dialog" aria-modal="true" aria-label="Vista ampliada de imagen">
            <button onClick={(e) => { e.stopPropagation(); closeImageModal(); }} className="absolute top-4 right-4 z-[110] p-3 bg-white/20 hover:bg-white/30 rounded-full transition-all hover:scale-110 shadow-xl" title="Cerrar (ESC)" aria-label="Cerrar modal">
              <X className="w-6 h-6 text-white" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); closeImageModal(); }} className="absolute top-4 left-4 z-[110] p-3 bg-white/20 hover:bg-white/30 rounded-full transition-all hover:scale-110 shadow-xl" aria-label="Volver">
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-8" onClick={(e) => e.stopPropagation()}>
              <div className="relative w-full max-w-md max-h-[80vh] sm:max-h-[85vh]">
                <Image src={imageUrl} alt={evento.evento_titulo} width={1200} height={900} className="w-full h-full object-contain rounded-lg shadow-2xl" unoptimized />
              </div>
            </div>
            <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none">
              <p className="text-white text-lg font-semibold bg-black/60 backdrop-blur-md inline-block px-6 py-3 rounded-full">{evento.evento_titulo}</p>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto px-4 -mt-20 relative z-10 pb-20">
          <div className="bg-card rounded-2xl shadow-xl border overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide" style={getTypeStyle(evento.tipo_evento)}>
                  {evento.tipo_evento}
                </span>
                <span className="text-sm text-muted-foreground">{institucion?.institucion_nombre || 'Universidad'}</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">{evento.evento_titulo}</h1>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 p-6 rounded-xl bg-muted/50 border">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${primaryColor}15` }}>
                    <Calendar className="w-5 h-5" style={{ color: primaryColor }} aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Fecha</p>
                    <p className="font-semibold text-foreground">{formatDateFull(evento.evento_fecha)}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${primaryColor}15` }}>
                    <Clock className="w-5 h-5" style={{ color: primaryColor }} aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Hora</p>
                    <p className="font-semibold text-foreground">{formatTime(evento.evento_hora)}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${primaryColor}15` }}>
                    <MapPin className="w-5 h-5" style={{ color: primaryColor }} aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Lugar</p>
                    <p className="font-semibold text-foreground">{evento.evento_lugar || 'Por confirmar'}</p>
                  </div>
                </div>
              </div>

              {evento.evento_descripcion && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold mb-4">Descripción del Evento</h2>
                  <div className="prose prose-lg max-w-none text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitizeHTML(evento.evento_descripcion) }} />
                </div>
              )}

              {evento.evento_imagen && imageUrl && (
                <div className="mb-8 p-6 rounded-xl bg-muted/50 border cursor-pointer group" onClick={openImageModal} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && openImageModal()} aria-label="Ver imagen en tamaño completo">
                  <div className="flex items-start gap-4">
                    <div className="relative w-32 h-24 rounded-lg overflow-hidden flex-shrink-0">
                      <Image src={imageUrl} alt={evento.evento_titulo} fill className="object-cover" sizes="(max-width: 768px) 128px, 128px" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1 flex items-center gap-2">
                        <Maximize2 className="w-5 h-5" style={{ color: primaryColor }} aria-hidden="true" />
                        Imagen del evento
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">Haz click para ver en tamaño completo</p>
                      <button onClick={(e) => { e.stopPropagation(); openImageModal(); }} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all hover:shadow-md" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                        <ZoomIn className="w-4 h-4" aria-hidden="true" /> Ver imagen completa
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8">
            <Link href="/eventos" className="inline-flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Ver todos los eventos
            </Link>
          </div>
        </div>

      </div>
    </ThemeDynamicProvider>
  );
}

export default function EventoDetallePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    }>
      <EventoDetalleContent />
    </Suspense>
  );
}