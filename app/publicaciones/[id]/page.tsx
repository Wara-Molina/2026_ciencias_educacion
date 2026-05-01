// app/publicaciones/[id]/page.tsx
'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Calendar, User, Download, Share2, ExternalLink,
  BookOpen, FileText, Printer, Maximize2, X, ZoomIn
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

import api from '@/lib/axios';
import { getStorageUrl } from '@/lib/utils';
import { sanitizeHTML } from '@/lib/sanitize';
import ThemeDynamicProvider from '@/components/providers/ThemeDynamicProvider';

interface Publicacion {
  publicaciones_id: number;
  publicaciones_titulo: string;
  publicaciones_imagen?: string;
  publicaciones_descripcion?: string;
  publicaciones_documento?: string;
  publicaciones_fecha: string;
  publicaciones_autor?: string;
  publicaciones_tipo?: string;
}

interface InstitucionData {
  colorinstitucion: Array<{
    color_primario: string;
    color_secundario: string;
    color_terciario: string;
  }>;
}

const isValidDocumentUrl = (url: string | undefined): boolean => {
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

const sanitizeForShare = (text: string | undefined): string => {
  if (!text) return '';
  return sanitizeHTML(text).replace(/<[^>]*>/g, '').trim().slice(0, 300);
};

function PublicacionDetalleContent() {
  const params = useParams();
  const router = useRouter();
 
  const rawPublicacionId = Number(params.id);
  const publicacionId = Number.isInteger(rawPublicacionId) && rawPublicacionId > 0 && rawPublicacionId < 10000000 
    ? rawPublicacionId 
    : null;
  
  const [publicacion, setPublicacion] = useState<Publicacion | null>(null);
  const [institucion, setInstitucion] = useState<InstitucionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);

  useEffect(() => {
    if (publicacionId === null) {
      setLoading(false);
      setError('ID de publicación inválido');
      return;
    }

    const fetchPublicacion = async () => {
      try {
        setLoading(true);
        setError(null);
        const institucionId = Number(process.env.NEXT_PUBLIC_INSTITUCION_ID) || 12;

        // ✅ CORRECCIÓN: Usar rutas relativas (axios tiene baseURL configurado)
        const [publiRes, instRes] = await Promise.all([
          api.get(`/institucion/${institucionId}/recursos`),
          api.get(`/institucionesPrincipal/${institucionId}`)
        ]);

        const publicacionEncontrada = publiRes.data.upea_publicaciones?.find(
          (p: any) => p.publicaciones_id === publicacionId
        );

        if (!publicacionEncontrada) {
          setError('Publicación no encontrada');
          return;
        }

        setPublicacion({
          publicaciones_id: publicacionEncontrada.publicaciones_id,
          publicaciones_titulo: sanitizeHTML(publicacionEncontrada.publicaciones_titulo || 'Sin título'),
          publicaciones_imagen: publicacionEncontrada.publicaciones_imagen,
          publicaciones_descripcion: publicacionEncontrada.publicaciones_descripcion,
          publicaciones_documento: publicacionEncontrada.publicaciones_documento,
          publicaciones_fecha: publicacionEncontrada.publicaciones_fecha,
          publicaciones_autor: sanitizeHTML(publicacionEncontrada.publicaciones_autor || ''),
          publicaciones_tipo: sanitizeHTML(publicacionEncontrada.publicaciones_tipo || '')
        });
        setInstitucion(instRes.data.Descripcion);

      } catch (err: any) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Error cargando publicación:', err);
        }
        setError('No se pudo cargar la información de la publicación');
      } finally {
        setLoading(false);
      }
    };

    fetchPublicacion();
  }, [publicacionId]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setImageModalOpen(false);
        setPdfModalOpen(false);
      }
    };
    
    if (imageModalOpen || pdfModalOpen) {
      window.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [imageModalOpen, pdfModalOpen]);

  const colores = institucion?.colorinstitucion?.[0];
  const primaryColor = colores?.color_primario || '#04246C';
  const secondaryColor = colores?.color_secundario || '#FC0102';

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Fecha no disponible';
    try {
      return new Date(dateString).toLocaleDateString('es-BO', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
    } catch {
      return 'Fecha no disponible';
    }
  };

  const imageUrl = useMemo(() => {
    if (!publicacion?.publicaciones_imagen) return '';
    const url = getStorageUrl(publicacion.publicaciones_imagen);
    return isValidDocumentUrl(url) ? url : '';
  }, [publicacion?.publicaciones_imagen]);

  const pdfUrl = useMemo(() => {
    if (!publicacion?.publicaciones_documento) return '';
    const url = getStorageUrl(publicacion.publicaciones_documento);
    return isValidDocumentUrl(url) ? url : '';
  }, [publicacion?.publicaciones_documento]);

  const handleShare = async () => {
    if (!publicacion) return;
    const safeDescription = sanitizeForShare(publicacion.publicaciones_descripcion);
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: publicacion.publicaciones_titulo,
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
  const openPdfModal = () => setPdfModalOpen(true);
  const closePdfModal = () => setPdfModalOpen(false);
  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando publicación...</p>
        </div>
      </div>
    );
  }

  if (error || !publicacion || publicacionId === null) {
    return (
      <ThemeDynamicProvider colors={{ primary: primaryColor, secondary: secondaryColor }}>
        <div className="min-h-screen bg-background flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-2xl font-bold mb-2">{error || 'Publicación no encontrada'}</h2>
            <p className="text-muted-foreground mb-6">La publicación que buscas no existe o ha sido eliminada</p>
            <Link href="/publicaciones" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white" style={{ backgroundColor: primaryColor }}>
              <ArrowLeft className="w-4 h-4" /> Volver a publicaciones
            </Link>
          </div>
        </div>
      </ThemeDynamicProvider>
    );
  }

  return (
    <ThemeDynamicProvider colors={{ primary: primaryColor, secondary: secondaryColor }}>
      <div className="min-h-screen bg-background">
        
        <div className="relative h-64 md:h-80 group cursor-pointer" onClick={publicacion.publicaciones_imagen ? openImageModal : undefined}>
          {publicacion.publicaciones_imagen && imageUrl ? (
            <>
              <Image src={imageUrl} alt={publicacion.publicaciones_titulo} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" priority />
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
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}10)` }}>
              <BookOpen className="w-24 h-24 text-white/30" />
            </div>
          )}

          <button onClick={(e) => { e.stopPropagation(); router.back(); }} className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-lg text-sm font-medium hover:bg-white transition-colors shadow-lg z-10" aria-label="Volver">
            <ArrowLeft className="w-4 h-4" /> Volver
          </button>

          <button onClick={(e) => { e.stopPropagation(); handleShare(); }} className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors shadow-lg z-10" title="Compartir" aria-label="Compartir publicación">
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {imageModalOpen && publicacion.publicaciones_imagen && imageUrl && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm" onClick={closeImageModal} role="dialog" aria-modal="true" aria-label="Vista ampliada de imagen">
            <button onClick={(e) => { e.stopPropagation(); closeImageModal(); }} className="absolute top-4 right-4 z-[110] p-3 bg-white/20 hover:bg-white/30 rounded-full transition-all hover:scale-110 shadow-xl" title="Cerrar (ESC)" aria-label="Cerrar modal">
              <X className="w-6 h-6 text-white" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); closeImageModal(); }} className="absolute top-4 left-4 z-[110] p-3 bg-white/20 hover:bg-white/30 rounded-full transition-all hover:scale-110 shadow-xl" aria-label="Volver">
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-8" onClick={(e) => e.stopPropagation()}>
              <div className="relative w-full max-w-md max-h-[80vh] sm:max-h-[85vh]">
                <Image src={imageUrl} alt={publicacion.publicaciones_titulo} width={1200} height={900} className="w-full h-full object-contain rounded-lg shadow-2xl" unoptimized />
              </div>
            </div>
            <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none">
              <p className="text-white text-lg font-semibold bg-black/60 backdrop-blur-md inline-block px-6 py-3 rounded-full">{publicacion.publicaciones_titulo}</p>
            </div>
          </div>
        )}

        {pdfModalOpen && publicacion.publicaciones_documento && pdfUrl && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm" onClick={closePdfModal} role="dialog" aria-modal="true" aria-label="Vista de documento PDF">
            <button onClick={(e) => { e.stopPropagation(); closePdfModal(); }} className="absolute top-4 right-4 z-[110] p-3 bg-white/20 hover:bg-white/30 rounded-full transition-all hover:scale-110 shadow-xl" title="Cerrar (ESC)" aria-label="Cerrar modal">
              <X className="w-6 h-6 text-white" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); closePdfModal(); }} className="absolute top-4 left-4 z-[110] p-3 bg-white/20 hover:bg-white/30 rounded-full transition-all hover:scale-110 shadow-xl flex items-center gap-2" aria-label="Volver">
              <ArrowLeft className="w-6 h-6 text-white" />
              <span className="text-white text-sm font-medium hidden sm:inline">Volver</span>
            </button>
            <a href={pdfUrl} download target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="absolute bottom-4 right-4 z-[110] flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full transition-all text-white font-medium text-sm shadow-xl">
              <Download className="w-4 h-4" /> Descargar
            </a>
            <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-8" onClick={(e) => e.stopPropagation()}>
              <div className="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-lg shadow-2xl overflow-hidden">
                <iframe src={`${pdfUrl}#toolbar=0&navpanes=0`} className="w-full h-[85vh]" title={publicacion.publicaciones_titulo} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />
              </div>
            </div>
            <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none">
              <p className="text-white text-lg font-semibold bg-black/60 backdrop-blur-md inline-block px-6 py-3 rounded-full">
                <FileText className="w-5 h-5 inline mr-2" /> {publicacion.publicaciones_titulo}
              </p>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto px-4 -mt-20 relative z-10 pb-20">
          <div className="bg-card rounded-2xl shadow-xl border overflow-hidden">
            <div className="p-6 md:p-8">
              {publicacion.publicaciones_tipo && (
                <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-4 uppercase tracking-wide" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                  {publicacion.publicaciones_tipo}
                </span>
              )}

              <h1 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">{publicacion.publicaciones_titulo}</h1>

              <div className="flex flex-wrap gap-6 mb-8 pb-6 border-b">
                {publicacion.publicaciones_autor && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="w-4 h-4" style={{ color: primaryColor }} aria-hidden="true" />
                    <span>{publicacion.publicaciones_autor}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" style={{ color: primaryColor }} aria-hidden="true" />
                  <span>{formatDate(publicacion.publicaciones_fecha)}</span>
                </div>
              </div>

              {publicacion.publicaciones_descripcion && (
                <div className="prose prose-lg max-w-none text-muted-foreground leading-relaxed mb-8" dangerouslySetInnerHTML={{ __html: sanitizeHTML(publicacion.publicaciones_descripcion) }} />
              )}

              <div className="space-y-4 mb-8">
                {publicacion.publicaciones_imagen && imageUrl && (
                  <div className="p-6 rounded-xl bg-muted/50 border cursor-pointer group" onClick={openImageModal} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && openImageModal()} aria-label="Ver imagen en tamaño completo">
                    <div className="flex items-start gap-4">
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                        <Image src={imageUrl} alt={publicacion.publicaciones_titulo} fill className="object-cover" sizes="(max-width: 768px) 96px, 96px" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1 flex items-center gap-2">
                          <FileText className="w-5 h-5" style={{ color: primaryColor }} aria-hidden="true" />
                          Imagen de la publicación
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">Haz click para ver en tamaño completo</p>
                        <button onClick={(e) => { e.stopPropagation(); openImageModal(); }} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all hover:shadow-md" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                          <Maximize2 className="w-4 h-4" aria-hidden="true" /> Ver imagen completa
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {publicacion.publicaciones_documento && pdfUrl && (
                  <div className="p-6 rounded-xl bg-muted/50 border cursor-pointer group" onClick={openPdfModal} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && openPdfModal()} aria-label="Ver documento PDF">
                    <div className="flex items-start gap-4">
                      <div className="w-24 h-24 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-12 h-12 text-red-500" aria-hidden="true" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1 flex items-center gap-2">
                          <FileText className="w-5 h-5" style={{ color: primaryColor }} aria-hidden="true" />
                          Documento PDF adjunto
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">Haz click para visualizar el documento</p>
                        <div className="flex gap-2">
                          <button onClick={(e) => { e.stopPropagation(); openPdfModal(); }} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all hover:shadow-md" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                            <Maximize2 className="w-4 h-4" aria-hidden="true" /> Ver documento
                          </button>
                          <a href={pdfUrl} download target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all hover:shadow-md" style={{ backgroundColor: `${secondaryColor}15`, color: secondaryColor }}>
                            <Download className="w-4 h-4" aria-hidden="true" /> Descargar
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3 pt-6 border-t">
                <button onClick={handlePrint} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all hover:shadow-md" style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}>
                  <Printer className="w-4 h-4" aria-hidden="true" /> Imprimir
                </button>
                {publicacion.publicaciones_documento && pdfUrl && (
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all hover:shadow-md" style={{ backgroundColor: `${secondaryColor}10`, color: secondaryColor }}>
                    <ExternalLink className="w-4 h-4" aria-hidden="true" /> Abrir en nueva pestaña
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <Link href="/publicaciones" className="inline-flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Ver todas las publicaciones
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    }>
      <PublicacionDetalleContent />
    </Suspense>
  );
}