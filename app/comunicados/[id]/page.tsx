// app/comunicados/[id]/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Calendar, Clock, FileText, Download, Share2,
  ExternalLink, MapPin, Bell, X, ZoomIn
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

import api from '@/lib/axios';
import { getStorageUrl } from '@/lib/utils';
import ThemeDynamicProvider from '@/components/providers/ThemeDynamicProvider';
import { sanitizeHTML, sanitizeText, validateNumericId } from '@/lib/security';

// ==================== TIPOS ====================
interface Comunicado {
  idconvocatorias: number;
  con_foto_portada?: string;
  con_titulo: string;
  con_descripcion?: string;
  con_estado: string;
  con_fecha_inicio?: string;
  con_fecha_fin?: string;
  tipo_conv_comun?: {
    idtipo_conv_comun: number;
    tipo_conv_comun_titulo: string;
    tipo_conv_comun_estado: string;
  };
}

interface InstitucionData {
  colorinstitucion: Array<{
    color_primario: string;
    color_secundario: string;
    color_terciario: string;
  }>;
}

// ==================== COMPONENTE CONTENIDO ====================
function ComunicadoDetalleContent() {
  const params = useParams();
  const router = useRouter();
  
  const [comunicado, setComunicado] = useState<Comunicado | null>(null);
  const [institucion, setInstitucion] = useState<InstitucionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  // Fetch datos
  useEffect(() => {
    const fetchComunicado = async () => {
      try {
        const safeId = validateNumericId(params.id);
        if (!safeId) {
          setError('ID de comunicado inválido');
          setLoading(false);
          return;
        }
        
        setLoading(true);
        setError(null);
        const institucionId = process.env.NEXT_PUBLIC_INSTITUCION_ID || 12;

        const [comunicadosRes, instRes] = await Promise.all([
          api.get(`/institucion/${institucionId}/gacetaEventos`),
          api.get(`/institucionesPrincipal/${institucionId}`)
        ]);

        const comunicadoEncontrado = comunicadosRes.data.convocatorias?.find(
          (c: any) => c.idconvocatorias === safeId
        );

        if (!comunicadoEncontrado) {
          setError('Comunicado no encontrado');
          return;
        }

        setComunicado(comunicadoEncontrado);
        setInstitucion(instRes.data.Descripcion);

      } catch (err: any) {
        console.error(' Error cargando comunicado:', err);
        setError(process.env.NODE_ENV === 'production' 
          ? 'No se pudo cargar el comunicado' 
          : 'No se pudo cargar la información del comunicado');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchComunicado();
    }
  }, [params.id]);

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

  const colores = institucion?.colorinstitucion?.[0];
  const primaryColor = colores?.color_primario || '#04246C';
  const secondaryColor = colores?.color_secundario || '#FC0102';
  const getTipoColor = () => {
    const tipo = comunicado?.tipo_conv_comun?.tipo_conv_comun_titulo?.toUpperCase();
    if (tipo === 'CONVOCATORIAS') return { bg: `${primaryColor}15`, text: primaryColor };
    if (tipo === 'AVISOS') return { bg: '#f59e0b15', text: '#f59e0b' };
    if (tipo === 'COMUNICADOS') return { bg: `${secondaryColor}15`, text: secondaryColor };
    return { bg: `${primaryColor}10`, text: primaryColor };
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Por definir';
    return new Date(dateString).toLocaleDateString('es-BO', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };
  const handleShare = async () => {
    if (!comunicado) return;
    const safeTitle = sanitizeText(comunicado.con_titulo, 150);
    const safeDescription = sanitizeText(
      comunicado.con_descripcion?.replace(/<[^>]*>/g, '') || '', 
      300
    );
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: safeTitle,
          text: safeDescription,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error compartiendo:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Enlace copiado');
    }
  };

  const openImageModal = () => setImageModalOpen(true);
  const closeImageModal = () => setImageModalOpen(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando comunicado...</p>
        </div>
      </div>
    );
  }

  if (error || !comunicado) {
    return (
      <ThemeDynamicProvider colors={{ primary: primaryColor, secondary: secondaryColor }}>
        <div className="min-h-screen bg-background flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-2xl font-bold mb-2">
              {error || 'Comunicado no encontrado'}
            </h2>
            <p className="text-muted-foreground mb-6">
              El comunicado que buscas no existe o ha sido eliminado
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/comunicados"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white"
                style={{ backgroundColor: primaryColor }}
              >
                <ArrowLeft className="w-4 h-4" />
                Volver a comunicados
              </Link>
            </div>
          </div>
        </div>
      </ThemeDynamicProvider>
    );
  }

  const colors = getTipoColor();
  const tipoLabel = comunicado.tipo_conv_comun?.tipo_conv_comun_titulo || 'COMUNICADO';
  const imageUrl = comunicado.con_foto_portada ? getStorageUrl(comunicado.con_foto_portada) : '';

  return (
    <ThemeDynamicProvider colors={{ primary: primaryColor, secondary: secondaryColor }}>
      <div className="min-h-screen bg-background">

        <div 
          className="relative h-48 md:h-64 group cursor-pointer"
          onClick={openImageModal}
        >
          {comunicado.con_foto_portada ? (
            <>
              <Image
                src={imageUrl}
                alt={sanitizeText(comunicado.con_titulo, 150)} 
                fill
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
            </>
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${colors.bg}, ${primaryColor}10)` }}
            >
              {tipoLabel === 'CONVOCATORIAS' ? <Calendar className="w-16 h-16 text-white/30" /> :
               tipoLabel === 'AVISOS' ? <Bell className="w-16 h-16 text-white/30" /> :
               <FileText className="w-16 h-16 text-white/30" />}
            </div>
          )}

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

        {imageModalOpen && comunicado.con_foto_portada && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm"
            onClick={closeImageModal}
          >

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
            <div 
              className="relative w-full h-full flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-full max-w-md max-h-[80vh] sm:max-h-[100vh]">
                <Image
                  src={imageUrl}
                  alt={sanitizeText(comunicado.con_titulo, 150)} 
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
                {sanitizeText(comunicado.con_titulo, 100)}
              </p>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-10 pb-20">
          <div className="bg-card rounded-2xl shadow-xl border overflow-hidden">
            
            <div className="p-6 md:p-8">

              <span 
                className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-4 uppercase tracking-wide"
                style={{ backgroundColor: colors.bg, color: colors.text }}
              >
                {tipoLabel.charAt(0) + tipoLabel.slice(1).toLowerCase()}
              </span>
              <h1 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
                {sanitizeText(comunicado.con_titulo, 200)}
              </h1>

              {/* Fechas */}
              {(comunicado.con_fecha_inicio || comunicado.con_fecha_fin) && (
                <div className="flex flex-wrap gap-4 mb-8 pb-6 border-b">
                  {comunicado.con_fecha_inicio && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" style={{ color: primaryColor }} />
                      <span>Inicio: {formatDate(comunicado.con_fecha_inicio)}</span>
                    </div>
                  )}
                  {comunicado.con_fecha_fin && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" style={{ color: primaryColor }} />
                      <span>Fin: {formatDate(comunicado.con_fecha_fin)}</span>
                    </div>
                  )}
                </div>
              )}

              {comunicado.con_descripcion && (
                <div 
                  className="prose prose-lg max-w-none text-muted-foreground leading-relaxed mb-8"
                  dangerouslySetInnerHTML={{ 
                    __html: sanitizeHTML(comunicado.con_descripcion) 
                  }}
                />
              )}

              {/* Acciones */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t">
                <div className="flex gap-3">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all hover:shadow-md"
                    style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}
                  >
                    <Download className="w-4 h-4" />
                    Imprimir
                  </button>
                  {imageUrl && (
                    <button
                      onClick={openImageModal}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all hover:shadow-md"
                      style={{ backgroundColor: `${secondaryColor}10`, color: secondaryColor }}
                    >
                      <ZoomIn className="w-4 h-4" />
                      Ver imagen
                    </button>
                  )}
                </div>
                
                <Link
                  href="/contacto"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-all hover:shadow-lg hover:-translate-y-0.5"
                  style={{ backgroundColor: primaryColor }}
                >
                  <FileText className="w-4 h-4" />
                  Consultar
                </Link>
              </div>
            </div>
          </div>

          {/* Navegación */}
          <div className="mt-8 flex justify-between">
            <Link
              href="/comunicados"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Ver todos los comunicados
            </Link>
          </div>
        </div>

      </div>
    </ThemeDynamicProvider>
  );
}

export default function ComunicadoDetallePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    }>
      <ComunicadoDetalleContent />
    </Suspense>
  );
}