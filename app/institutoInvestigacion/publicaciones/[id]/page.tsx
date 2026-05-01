// app/institutoInvestigacion/publicaciones/[id]/page.tsx
'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Calendar, BookOpen, Download, Share2, ExternalLink,
  User, FileText, Loader2, X, ZoomIn
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

import api from '@/lib/axios';
import { getStorageUrl } from '@/lib/utils';
import { sanitizeHTML } from '@/lib/sanitize';
import ThemeDynamicProvider from '@/components/providers/ThemeDynamicProvider';

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
  colorinstitucion: Array<{
    color_primario: string;
    color_secundario: string;
  }>;
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

function PublicacionDetalleContent() {
  const params = useParams();
  const router = useRouter();
  
  const rawPublicacionId = Number(params.id);
  const publicacionId = Number.isInteger(rawPublicacionId) && rawPublicacionId > 0 && rawPublicacionId < 10000000 
    ? rawPublicacionId 
    : null;
  
  const [publicacion, setPublicacion] = useState<PublicacionInvestigacion | null>(null);
  const [institucion, setInstitucion] = useState<InstitucionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState('#04246C');
  const [secondaryColor, setSecondaryColor] = useState('#FC0102');
  const [imageModalOpen, setImageModalOpen] = useState(false);

  useEffect(() => {
    if (publicacionId === null) {
      setLoading(false);
      setError('ID de publicación inválido');
      return;
    }

    let isMounted = true;
    const institucionId = Number(process.env.NEXT_PUBLIC_INSTITUCION_ID) || 12;

    const fetchPublicacion = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [publiRes, instRes] = await Promise.all([
          api.get(`/institucion/${institucionId}/recursos`),
          api.get(`/institucionesPrincipal/${institucionId}`)
        ]);

        if (!isMounted) return;

        // ✅ Filtro flexible: acepta múltiples variaciones del tipo
        const esTipoInvestigacion = (valor: any): boolean => {
          if (!valor) return false;
          const normalized = String(valor).trim().toUpperCase();
          return normalized.includes('INVESTIGACION') || 
                 normalized.includes('INSTITUTO') ||
                 normalized === 'UPEA' ||
                 normalized === 'ENF' ||
                 normalized === 'SOCIEDAD CIENTIFICA';
        };

        // ✅ Buscar por ID + tipo, con fallback solo por ID
        const publicacionEncontrada = publiRes.data.upea_publicaciones?.find(
          (p: any) => p.publicaciones_id === publicacionId && esTipoInvestigacion(p.publicaciones_tipo)
        );

        const publicacionFallback = !publicacionEncontrada 
          ? publiRes.data.upea_publicaciones?.find((p: any) => p.publicaciones_id === publicacionId)
          : null;

        const publicacionFinal = publicacionEncontrada || publicacionFallback;

        if (!publicacionFinal) {
          setError(`Publicación #${publicacionId} no encontrada`);
          return;
        }

        setPublicacion({
          publicaciones_id: publicacionFinal.publicaciones_id,
          publicaciones_titulo: sanitizeTextField(publicacionFinal.publicaciones_titulo, 200),
          publicaciones_imagen: publicacionFinal.publicaciones_imagen,
          publicaciones_descripcion: publicacionFinal.publicaciones_descripcion,
          publicaciones_documento: publicacionFinal.publicaciones_documento,
          publicaciones_fecha: publicacionFinal.publicaciones_fecha,
          publicaciones_autor: sanitizeTextField(publicacionFinal.publicaciones_autor, 100),
          publicaciones_tipo: sanitizeTextField(publicacionFinal.publicaciones_tipo, 50)
        });
        setInstitucion(instRes.data.Descripcion || null);

        if (instRes.data.Descripcion?.colorinstitucion?.[0]) {
          const colors = instRes.data.Descripcion.colorinstitucion[0];
          setPrimaryColor(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(colors.color_primario) ? colors.color_primario : '#04246C');
          setSecondaryColor(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(colors.color_secundario) ? colors.color_secundario : '#FC0102');
        }
      } catch (err: any) {
        if (isMounted) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Error cargando publicación:', err);
          }
          const errorMessage = err.response?.status === 404 
            ? 'La publicación no existe en el servidor'
            : err.response?.status === 401
            ? 'Error de autenticación con la API'
            : 'Error al cargar la publicación';
          setError(errorMessage);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPublicacion();
    return () => { isMounted = false; };
  }, [publicacionId]);

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
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const documentoUrl = useMemo(() => {
    if (!publicacion?.publicaciones_documento) return '';
    const url = getStorageUrl(publicacion.publicaciones_documento);
    return isValidResourceUrl(url) ? url : '';
  }, [publicacion?.publicaciones_documento]);

  const imageUrl = useMemo(() => {
    if (!publicacion?.publicaciones_imagen) return '';
    const url = getStorageUrl(publicacion.publicaciones_imagen);
    return isValidResourceUrl(url) ? url : '';
  }, [publicacion?.publicaciones_imagen]);

  const handleShare = async () => {
    if (!publicacion) return;
    const safeTitle = sanitizeTextField(publicacion.publicaciones_titulo, 100);
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: safeTitle,
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
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !publicacion || publicacionId === null) {
    return (
      <ThemeDynamicProvider colors={{ primary: primaryColor, secondary: secondaryColor }}>
        <div className="min-h-screen flex items-center justify-center bg-background p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold mb-2">{error || 'Publicación no encontrada'}</h2>
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

  return (
    <ThemeDynamicProvider colors={{ primary: primaryColor, secondary: secondaryColor }}>
      <div className="min-h-screen bg-background">

        {publicacion.publicaciones_imagen && imageUrl ? (
          <div 
            className="relative h-64 md:h-80 group cursor-pointer"
            onClick={openImageModal}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && openImageModal()}
            aria-label="Ver imagen en tamaño completo"
          >
            <Image
              src={imageUrl}
              alt={publicacion.publicaciones_titulo}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

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

            <div className="absolute bottom-4 right-4 md:hidden">
              <div className="bg-white/90 backdrop-blur-md rounded-full p-2 shadow-lg">
                <ZoomIn className="w-5 h-5" style={{ color: primaryColor }} />
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                router.back();
              }}
              className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-lg text-sm font-medium hover:bg-white transition-colors shadow-lg z-10"
              aria-label="Volver a la página anterior"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleShare();
              }}
              className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors shadow-lg z-10"
              title="Compartir"
              aria-label="Compartir publicación"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="relative py-16 bg-gradient-to-br from-primary/10 to-background">
            <div className="max-w-4xl mx-auto px-4">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6"
                aria-label="Volver"
              >
                <ArrowLeft className="w-4 h-4" /> Volver
              </button>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
                  <BookOpen className="w-7 h-7" style={{ color: primaryColor }} aria-hidden="true" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold" style={{ color: primaryColor }}>
                  {publicacion.publicaciones_titulo}
                </h1>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" style={{ color: primaryColor }} aria-hidden="true" />
                  <span>{formatDate(publicacion.publicaciones_fecha)}</span>
                </div>
                {publicacion.publicaciones_autor && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" style={{ color: primaryColor }} aria-hidden="true" />
                    <span>{publicacion.publicaciones_autor}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {imageModalOpen && publicacion.publicaciones_imagen && imageUrl && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm"
            onClick={closeImageModal}
            role="dialog"
            aria-modal="true"
            aria-label="Vista ampliada de imagen"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeImageModal();
              }}
              className="absolute top-4 right-4 z-[110] p-3 bg-white/20 hover:bg-white/30 rounded-full transition-all hover:scale-110 shadow-xl group"
              title="Cerrar (ESC)"
              aria-label="Cerrar modal"
            >
              <X className="w-6 h-6 text-white" />
              <span className="absolute -bottom-8 right-0 text-white/70 text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Cerrar
              </span>
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeImageModal();
              }}
              className="absolute top-4 left-4 z-[110] p-3 bg-white/20 hover:bg-white/30 rounded-full transition-all hover:scale-110 shadow-xl flex items-center gap-2"
              aria-label="Volver"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
              <span className="text-white text-sm font-medium hidden sm:inline">Volver</span>
            </button>

            <div 
              className="relative w-full h-full flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-full max-w-md max-h-[80vh] sm:max-h-[100vh]">
                <Image
                  src={imageUrl}
                  alt={publicacion.publicaciones_titulo}
                  width={600}
                  height={400}
                  className="w-full h-full object-contain rounded-lg shadow-2xl"
                  unoptimized
                />
              
                <div className="absolute -bottom-10 left-0 right-0 text-center hidden sm:block">
                  <p className="text-white/60 text-xs">
                    Click fuera o ESC para cerrar
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none">
              <p className="text-white text-lg font-semibold bg-black/60 backdrop-blur-md inline-block px-6 py-3 rounded-full">
                {publicacion.publicaciones_titulo}
              </p>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-card rounded-2xl shadow-xl border overflow-hidden">

            {!publicacion.publicaciones_imagen && (
              <div className="p-6 md:p-8 border-b">
                <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: primaryColor }}>
                  {publicacion.publicaciones_titulo}
                </h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" style={{ color: primaryColor }} aria-hidden="true" />
                    <span>{formatDate(publicacion.publicaciones_fecha)}</span>
                  </div>
                  {publicacion.publicaciones_autor && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" style={{ color: primaryColor }} aria-hidden="true" />
                      <span>{publicacion.publicaciones_autor}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="p-6 md:p-8">
              {publicacion.publicaciones_descripcion && (
                <div className="mb-8">
                  <h3 className="font-semibold mb-3 text-lg">Descripción</h3>
                  <div 
                    className="prose prose-sm max-w-none text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: sanitizeHTML(publicacion.publicaciones_descripcion) }}
                  />
                </div>
              )}

              {documentoUrl && (
                <div className="mb-8 p-6 rounded-xl bg-muted/50 border">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5" style={{ color: primaryColor }} aria-hidden="true" />
                    Documento
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href={documentoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <ExternalLink className="w-4 h-4" aria-hidden="true" />
                      Ver documento
                    </a>
                    <a
                      href={documentoUrl}
                      download
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm"
                      style={{ backgroundColor: `${secondaryColor}15`, color: secondaryColor }}
                    >
                      <Download className="w-4 h-4" aria-hidden="true" />
                      Descargar
                    </a>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm"
                  style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}
                >
                  <Share2 className="w-4 h-4" aria-hidden="true" />
                  Compartir
                </button>

                {publicacion.publicaciones_imagen && imageUrl && (
                  <button
                    onClick={openImageModal}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm"
                    style={{ backgroundColor: `${secondaryColor}10`, color: secondaryColor }}
                  >
                    <ZoomIn className="w-4 h-4" aria-hidden="true" />
                    Ver imagen
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <Link
              href="/institutoInvestigacion"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              Volver al instituto de investigación
            </Link>
          </div>
        </div>

      </div>
    </ThemeDynamicProvider>
  );
}

export default function PublicacionDetallePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    }>
      <PublicacionDetalleContent />
    </Suspense>
  );
}