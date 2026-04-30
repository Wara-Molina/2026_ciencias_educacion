// app/publicaciones/[id]/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Calendar, User, Download, Share2, ExternalLink,
  BookOpen, FileText, Printer, Maximize2, X, ZoomIn
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

import api from '@/lib/axios';
import { getStorageUrl } from '@/lib/utils';
import ThemeDynamicProvider from '@/components/providers/ThemeDynamicProvider';

// ==================== TIPOS ====================
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

// ==================== COMPONENTE CONTENIDO ====================
function PublicacionDetalleContent() {
  const params = useParams();
  const router = useRouter();
  
  const [publicacion, setPublicacion] = useState<Publicacion | null>(null);
  const [institucion, setInstitucion] = useState<InstitucionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // ✅ Estados para modales
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);

  // Fetch datos
  useEffect(() => {
    const fetchPublicacion = async () => {
      try {
        setLoading(true);
        setError(null);
        const institucionId = process.env.NEXT_PUBLIC_INSTITUCION_ID || 12;
        const publicacionId = params.id;

        const [publiRes, instRes] = await Promise.all([
          api.get(`/institucion/${institucionId}/recursos`),
          api.get(`/institucionesPrincipal/${institucionId}`)
        ]);

        const publicacionEncontrada = publiRes.data.upea_publicaciones?.find(
          (p: any) => p.publicaciones_id === Number(publicacionId)
        );

        if (!publicacionEncontrada) {
          setError('Publicación no encontrada');
          return;
        }

        setPublicacion(publicacionEncontrada);
        setInstitucion(instRes.data.Descripcion);

      } catch (err: any) {
        console.error('❌ Error cargando publicación:', err);
        setError('No se pudo cargar la información de la publicación');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchPublicacion();
    }
  }, [params.id]);

  // ✅ Cerrar modales con tecla ESC
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

  // Colores dinámicos
  const colores = institucion?.colorinstitucion?.[0];
  const primaryColor = colores?.color_primario || '#04246C';
  const secondaryColor = colores?.color_secundario || '#FC0102';

  // Helper para formatear fechas
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Fecha no disponible';
    return new Date(dateString).toLocaleDateString('es-BO', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  // Share handler
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: publicacion?.publicaciones_titulo,
          text: publicacion?.publicaciones_descripcion?.replace(/<[^>]*>/g, '') || '',
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

  // ✅ Funciones para manejar modales
  const openImageModal = () => setImageModalOpen(true);
  const closeImageModal = () => setImageModalOpen(false);
  const openPdfModal = () => setPdfModalOpen(true);
  const closePdfModal = () => setPdfModalOpen(false);

  // Print handler
  const handlePrint = () => {
    window.print();
  };

  // ==================== RENDER LOADING ====================
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

  // ==================== RENDER ERROR ====================
  if (error || !publicacion) {
    return (
      <ThemeDynamicProvider colors={{ primary: primaryColor, secondary: secondaryColor }}>
        <div className="min-h-screen bg-background flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-2xl font-bold mb-2">
              {error || 'Publicación no encontrada'}
            </h2>
            <p className="text-muted-foreground mb-6">
              La publicación que buscas no existe o ha sido eliminada
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/publicaciones"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white"
                style={{ backgroundColor: primaryColor }}
              >
                <ArrowLeft className="w-4 h-4" />
                Volver a publicaciones
              </Link>
            </div>
          </div>
        </div>
      </ThemeDynamicProvider>
    );
  }

  const imageUrl = publicacion.publicaciones_imagen ? getStorageUrl(publicacion.publicaciones_imagen) : '';
  const pdfUrl = publicacion.publicaciones_documento ? getStorageUrl(publicacion.publicaciones_documento) : '';

  return (
    <ThemeDynamicProvider colors={{ primary: primaryColor, secondary: secondaryColor }}>
      <div className="min-h-screen bg-background">
        
        {/* 🖼️ Header con imagen */}
        <div className="relative h-64 md:h-80 group cursor-pointer" onClick={publicacion.publicaciones_imagen ? openImageModal : undefined}>
          {publicacion.publicaciones_imagen ? (
            <>
              <Image
                src={imageUrl}
                alt={publicacion.publicaciones_titulo}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
              
              {/* ✅ Indicador para ver imagen */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/40 backdrop-blur-[2px]">
                <div className="text-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <div className="bg-white/90 backdrop-blur-md rounded-full p-4 shadow-2xl mb-3 inline-flex items-center gap-2">
                    <ZoomIn className="w-6 h-6" style={{ color: primaryColor }} />
                    <span className="text-white font-semibold text-sm">Ver imagen completa</span>
                  </div>
                  <p className="text-white/90 text-sm font-medium drop-shadow-lg">
                    Haz click para ampliar
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}10)` }}
            >
              <BookOpen className="w-24 h-24 text-white/30" />
            </div>
          )}

          {/* Botón volver */}
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

          {/* Botón compartir */}
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

        {/* ✅ MODAL DE IMAGEN */}
        {imageModalOpen && publicacion.publicaciones_imagen && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm"
            onClick={closeImageModal}
          >
            {/* Botón cerrar */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeImageModal();
              }}
              className="absolute top-4 right-4 z-[110] p-3 bg-white/20 hover:bg-white/30 rounded-full transition-all hover:scale-110 shadow-xl"
              title="Cerrar (ESC)"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            
            {/* Botón volver */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeImageModal();
              }}
              className="absolute top-4 left-4 z-[110] p-3 bg-white/20 hover:bg-white/30 rounded-full transition-all hover:scale-110 shadow-xl"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>

            {/* Imagen */}
            <div 
              className="relative w-full h-full flex items-center justify-center p-4 sm:p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-full max-w-5xl max-h-[85vh]">
                <Image
                  src={imageUrl}
                  alt={publicacion.publicaciones_titulo}
                  width={1200}
                  height={900}
                  className="w-full h-full object-contain rounded-lg shadow-2xl"
                  unoptimized
                />
              </div>
            </div>

            {/* Título de la publicación */}
            <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none">
              <p className="text-white text-lg font-semibold bg-black/60 backdrop-blur-md inline-block px-6 py-3 rounded-full">
                {publicacion.publicaciones_titulo}
              </p>
            </div>
          </div>
        )}

        {/* ✅ MODAL DE PDF */}
        {pdfModalOpen && publicacion.publicaciones_documento && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm"
            onClick={closePdfModal}
          >
            {/* Botón cerrar */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                closePdfModal();
              }}
              className="absolute top-4 right-4 z-[110] p-3 bg-white/20 hover:bg-white/30 rounded-full transition-all hover:scale-110 shadow-xl"
              title="Cerrar (ESC)"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            
            {/* Botón volver */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                closePdfModal();
              }}
              className="absolute top-4 left-4 z-[110] p-3 bg-white/20 hover:bg-white/30 rounded-full transition-all hover:scale-110 shadow-xl flex items-center gap-2"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
              <span className="text-white text-sm font-medium hidden sm:inline">Volver</span>
            </button>

            {/* Botón descargar */}
            <a
              href={pdfUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-4 right-4 z-[110] flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full transition-all text-white font-medium text-sm shadow-xl"
            >
              <Download className="w-4 h-4" />
              Descargar
            </a>

            {/* PDF Viewer */}
            <div 
              className="relative w-full h-full flex items-center justify-center p-4 sm:p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-lg shadow-2xl overflow-hidden">
                <iframe
                  src={`${pdfUrl}#toolbar=0&navpanes=0`}
                  className="w-full h-[85vh]"
                  title={publicacion.publicaciones_titulo}
                />
              </div>
            </div>

            {/* Título del documento */}
            <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none">
              <p className="text-white text-lg font-semibold bg-black/60 backdrop-blur-md inline-block px-6 py-3 rounded-full">
                <FileText className="w-5 h-5 inline mr-2" />
                {publicacion.publicaciones_titulo}
              </p>
            </div>
          </div>
        )}

        {/* 📄 Contenido */}
        <div className="max-w-4xl mx-auto px-4 -mt-20 relative z-10 pb-20">
          <div className="bg-card rounded-2xl shadow-xl border overflow-hidden">
            
            <div className="p-6 md:p-8">
              {/* Badge de tipo */}
              {publicacion.publicaciones_tipo && (
                <span 
                  className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-4 uppercase tracking-wide"
                  style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                >
                  {publicacion.publicaciones_tipo}
                </span>
              )}

              {/* Título */}
              <h1 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                {publicacion.publicaciones_titulo}
              </h1>

              {/* Meta info */}
              <div className="flex flex-wrap gap-6 mb-8 pb-6 border-b">
                {publicacion.publicaciones_autor && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="w-4 h-4" style={{ color: primaryColor }} />
                    <span>{publicacion.publicaciones_autor}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" style={{ color: primaryColor }} />
                  <span>{formatDate(publicacion.publicaciones_fecha)}</span>
                </div>
              </div>

              {/* Descripción */}
              {publicacion.publicaciones_descripcion && (
                <div 
                  className="prose prose-lg max-w-none text-muted-foreground leading-relaxed mb-8"
                  dangerouslySetInnerHTML={{ __html: publicacion.publicaciones_descripcion }}
                />
              )}

              {/* Documentos adjuntos */}
              <div className="space-y-4 mb-8">
                {/* Imagen adjunta */}
                {publicacion.publicaciones_imagen && (
                  <div 
                    className="p-6 rounded-xl bg-muted/50 border cursor-pointer group"
                    onClick={openImageModal}
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={imageUrl}
                          alt={publicacion.publicaciones_titulo}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1 flex items-center gap-2">
                          <FileText className="w-5 h-5" style={{ color: primaryColor }} />
                          Imagen de la publicación
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          Haz click para ver en tamaño completo
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openImageModal();
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all hover:shadow-md"
                          style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                        >
                          <Maximize2 className="w-4 h-4" />
                          Ver imagen completa
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Documento PDF adjunto */}
                {publicacion.publicaciones_documento && (
                  <div 
                    className="p-6 rounded-xl bg-muted/50 border cursor-pointer group"
                    onClick={openPdfModal}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-24 h-24 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-12 h-12 text-red-500" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1 flex items-center gap-2">
                          <FileText className="w-5 h-5" style={{ color: primaryColor }} />
                          Documento PDF adjunto
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          Haz click para visualizar el documento
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openPdfModal();
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all hover:shadow-md"
                            style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                          >
                            <Maximize2 className="w-4 h-4" />
                            Ver documento
                          </button>
                          <a
                            href={pdfUrl}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all hover:shadow-md"
                            style={{ backgroundColor: `${secondaryColor}15`, color: secondaryColor }}
                          >
                            <Download className="w-4 h-4" />
                            Descargar
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Acciones */}
              <div className="flex flex-wrap gap-3 pt-6 border-t">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all hover:shadow-md"
                  style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}
                >
                  <Printer className="w-4 h-4" />
                  Imprimir
                </button>
                
                {publicacion.publicaciones_documento && (
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all hover:shadow-md"
                    style={{ backgroundColor: `${secondaryColor}10`, color: secondaryColor }}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Abrir en nueva pestaña
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Navegación */}
          <div className="mt-8 flex justify-between">
            <Link
              href="/publicaciones"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Ver todas las publicaciones
            </Link>
          </div>
        </div>

      </div>
    </ThemeDynamicProvider>
  );
}

// ==================== WRAPPER CON SUSPENSE ====================
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