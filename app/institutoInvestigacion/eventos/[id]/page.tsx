// app/institutoInvestigacion/eventos/[id]/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Calendar, Clock, MapPin, Share2, ExternalLink,
  User, GraduationCap, Target, Loader2, X, ZoomIn
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

import api from '@/lib/axios';
import { getStorageUrl } from '@/lib/utils';
import ThemeDynamicProvider from '@/components/providers/ThemeDynamicProvider';

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

interface InstitucionData {
  colorinstitucion: Array<{
    color_primario: string;
    color_secundario: string;
  }>;
}

function EventoDetalleContent() {
  const params = useParams();
  const router = useRouter();
  const eventoId = Number(params.id);
  
  const [evento, setEvento] = useState<EventoInvestigacion | null>(null);
  const [institucion, setInstitucion] = useState<InstitucionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState('#04246C');
  const [secondaryColor, setSecondaryColor] = useState('#FC0102');
  
  // ✅ Estado para modal de imagen
  const [imageModalOpen, setImageModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const institucionId = Number(process.env.NEXT_PUBLIC_INSTITUCION_ID) || 12;

    const fetchEvento = async () => {
      try {
        setLoading(true);
        const [eventoRes, instRes] = await Promise.all([
          api.get(`/institucion/${institucionId}/gacetaEventos`),
          api.get(`/institucionesPrincipal/${institucionId}`)
        ]);

        if (!isMounted) return;

        const esTipoInvestigacion = (valor: any): boolean => {
          if (!valor) return false;
          return String(valor).trim().toUpperCase() === 'INSTITUTO DE INVESTIGACION';
        };

        const eventoEncontrado = eventoRes.data.upea_evento?.find(
          (e: any) => e.evento_id === eventoId && esTipoInvestigacion(e.tipo_evento)
        );

        if (!eventoEncontrado) {
          setError('Evento no encontrado');
          return;
        }

        setEvento(eventoEncontrado);
        setInstitucion(instRes.data.Descripcion || null);

        if (instRes.data.Descripcion?.colorinstitucion?.[0]) {
          setPrimaryColor(instRes.data.Descripcion.colorinstitucion[0].color_primario);
          setSecondaryColor(instRes.data.Descripcion.colorinstitucion[0].color_secundario);
        }
      } catch (err) {
        if (isMounted) setError('Error al cargar el evento');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchEvento();
    return () => { isMounted = false; };
  }, [eventoId]);

  // ✅ Cerrar modal con tecla ESC + Prevenir scroll
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Fecha no disponible';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    return date.toLocaleDateString('es-BO', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: evento?.evento_titulo,
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

  // ✅ Funciones para manejar el modal
  const openImageModal = () => setImageModalOpen(true);
  const closeImageModal = () => setImageModalOpen(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !evento) {
    return (
      <ThemeDynamicProvider colors={{ primary: primaryColor, secondary: secondaryColor }}>
        <div className="min-h-screen flex items-center justify-center bg-background p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">📅</div>
            <h2 className="text-2xl font-bold mb-2">{error || 'Evento no encontrado'}</h2>
            <Link
              href="/institutoInvestigacion"
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-lg font-medium text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al instituto
            </Link>
          </div>
        </div>
      </ThemeDynamicProvider>
    );
  }

  const imageUrl = evento.evento_imagen ? getStorageUrl(evento.evento_imagen) : '';

  return (
    <ThemeDynamicProvider colors={{ primary: primaryColor, secondary: secondaryColor }}>
      <div className="min-h-screen bg-background">
        
        {/* 🖼️ Header con imagen - Click para abrir modal */}
        {evento.evento_imagen ? (
          <div 
            className="relative h-64 md:h-80 group cursor-pointer"
            onClick={openImageModal}
          >
            <Image
              src={imageUrl}
              alt={evento.evento_titulo}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            
            {/* ✅ Overlay con indicador de zoom */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/40 backdrop-blur-[2px]">
              <div className="text-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                <div className="bg-white/90 backdrop-blur-md rounded-full p-4 shadow-2xl mb-3 inline-flex items-center gap-2">
                  <ZoomIn className="w-6 h-6" style={{ color: primaryColor }} />
                  <span className="text-black font-semibold text-sm">Ver imagen completa</span>
                </div>
                <p className="text-white/90 text-sm font-medium drop-shadow-lg">
                  Haz click para ampliar
                </p>
              </div>
            </div>

            {/* Badge flotante en móvil */}
            <div className="absolute bottom-4 right-4 md:hidden">
              <div className="bg-white/90 backdrop-blur-md rounded-full p-2 shadow-lg">
                <ZoomIn className="w-5 h-5" style={{ color: primaryColor }} />
              </div>
            </div>

            {/* Botón volver - Con stopPropagation */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.back();
              }}
              className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-lg text-sm font-medium hover:bg-white transition-colors shadow-lg z-10"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </button>

            {/* Botón compartir - Con stopPropagation */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleShare();
              }}
              className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors shadow-lg z-10"
              title="Compartir"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        ) : (
          /* Header sin imagen */
          <div className="relative py-16 bg-gradient-to-br from-primary/10 to-background">
            <div className="max-w-4xl mx-auto px-4">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6"
              >
                <ArrowLeft className="w-4 h-4" /> Volver
              </button>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
                  <Calendar className="w-7 h-7" style={{ color: primaryColor }} />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold" style={{ color: primaryColor }}>
                  {evento.evento_titulo}
                </h1>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(evento.evento_fecha)}</span>
                </div>
                {evento.evento_hora && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{evento.evento_hora.substring(0, 5)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ✅ MODAL DE IMAGEN COMPLETA - Estilo Cursos */}
        {imageModalOpen && evento.evento_imagen && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm"
            onClick={closeImageModal}
          >
            {/* Botón cerrar - ESQUINA SUPERIOR DERECHA */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeImageModal();
              }}
              className="absolute top-4 right-4 z-[110] p-3 bg-white/20 hover:bg-white/30 rounded-full transition-all hover:scale-110 shadow-xl group"
              title="Cerrar (ESC)"
            >
              <X className="w-6 h-6 text-white" />
              <span className="absolute -bottom-8 right-0 text-white/70 text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Cerrar
              </span>
            </button>
            
            {/* Botón cerrar - ESQUINA SUPERIOR IZQUIERDA */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeImageModal();
              }}
              className="absolute top-4 left-4 z-[110] p-3 bg-white/20 hover:bg-white/30 rounded-full transition-all hover:scale-110 shadow-xl flex items-center gap-2"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
              <span className="text-white text-sm font-medium hidden sm:inline">Volver</span>
            </button>

            {/* Imagen - Compacta y centrada */}
            <div 
              className="relative w-full h-full flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-full max-w-md max-h-[80vh] sm:max-h-[100vh]">
                <Image
                  src={imageUrl}
                  alt={evento.evento_titulo}
                  width={600}
                  height={400}
                  className="w-full h-full object-contain rounded-lg shadow-2xl"
                  unoptimized
                />
                
                {/* Indicador de cerrar */}
                <div className="absolute -bottom-10 left-0 right-0 text-center hidden sm:block">
                  <p className="text-white/60 text-xs">
                    Click fuera o ESC para cerrar
                  </p>
                </div>
              </div>
            </div>

            {/* Título del evento */}
            <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none">
              <p className="text-white text-lg font-semibold bg-black/60 backdrop-blur-md inline-block px-6 py-3 rounded-full">
                {evento.evento_titulo}
              </p>
            </div>
          </div>
        )}

        {/* 📄 Contenido */}
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-card rounded-2xl shadow-xl border overflow-hidden">
            
            {/* Si no hay imagen en header, mostrar título aquí */}
            {!evento.evento_imagen && (
              <div className="p-6 md:p-8 border-b">
                <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: primaryColor }}>
                  {evento.evento_titulo}
                </h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(evento.evento_fecha)}</span>
                  </div>
                  {evento.evento_hora && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{evento.evento_hora.substring(0, 5)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="p-6 md:p-8">
              {/* Descripción */}
              {evento.evento_descripcion && (
                <div className="mb-8">
                  <h3 className="font-semibold mb-3 text-lg">Descripción</h3>
                  <div 
                    className="prose prose-sm max-w-none text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: evento.evento_descripcion }}
                  />
                </div>
              )}

              {/* Info adicional */}
              <div className="grid md:grid-cols-2 gap-6 mb-8 p-6 rounded-xl bg-muted/50 border">
                {evento.evento_fecha && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 flex-shrink-0" style={{ color: primaryColor }} />
                    <div>
                      <p className="text-sm font-medium mb-1">Fecha</p>
                      <p className="text-sm text-muted-foreground">{formatDate(evento.evento_fecha)}</p>
                    </div>
                  </div>
                )}
                {evento.evento_hora && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 flex-shrink-0" style={{ color: primaryColor }} />
                    <div>
                      <p className="text-sm font-medium mb-1">Hora</p>
                      <p className="text-sm text-muted-foreground">{evento.evento_hora.substring(0, 5)}</p>
                    </div>
                  </div>
                )}
                {evento.evento_lugar && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 flex-shrink-0" style={{ color: primaryColor }} />
                    <div>
                      <p className="text-sm font-medium mb-1">Lugar</p>
                      <p className="text-sm text-muted-foreground">{evento.evento_lugar}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 flex-shrink-0" style={{ color: primaryColor }} />
                  <div>
                    <p className="text-sm font-medium mb-1">Tipo</p>
                    <p className="text-sm text-muted-foreground">{evento.tipo_evento}</p>
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm"
                  style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}
                >
                  <Share2 className="w-4 h-4" />
                  Compartir
                </button>
                
                {/* Botón para abrir modal si hay imagen */}
                {evento.evento_imagen && (
                  <button
                    onClick={openImageModal}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm"
                    style={{ backgroundColor: `${secondaryColor}10`, color: secondaryColor }}
                  >
                    <ZoomIn className="w-4 h-4" />
                    Ver imagen
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Navegación */}
          <div className="mt-8">
            <Link
              href="/institutoInvestigacion"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al instituto de investigación
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    }>
      <EventoDetalleContent />
    </Suspense>
  );
}