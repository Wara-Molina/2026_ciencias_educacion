// app/cursos/[id]/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Clock, 
  Users, 
  Calendar, 
  MapPin, 
  BookOpen, 
  CheckCircle,
  DollarSign,
  Share2,
  Maximize2,
  X,
  ZoomIn
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

import api from '@/lib/axios';
import { getStorageUrl } from '@/lib/utils';
import ThemeDynamicProvider from '@/components/providers/ThemeDynamicProvider';

// ==================== TIPOS ====================
interface Curso {
  iddetalle_cursos_academicos: number;
  det_img_portada?: string;
  det_titulo: string;
  det_descripcion?: string;
  det_costo: number;
  det_costo_ext?: number;
  det_cupo_max: number;
  det_carga_horaria?: number;
  det_lugar_curso?: string;
  det_modalidad: string;
  det_fecha_ini?: string;
  det_fecha_fin?: string;
  det_hora_ini?: string;
  det_codigo?: string;
  det_version?: string;
  det_estado: string;
  tipo_curso_otro?: {
    tipo_conv_curso_nombre: string;
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
function CursoDetalleContent() {
  const params = useParams();
  const router = useRouter();
  
  const [curso, setCurso] = useState<Curso | null>(null);
  const [institucion, setInstitucion] = useState<InstitucionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  // Fetch datos
  useEffect(() => {
    const fetchCurso = async () => {
      try {
        setLoading(true);
        setError(null);
        const institucionId = process.env.NEXT_PUBLIC_INSTITUCION_ID || 12;
        const cursoId = params.id;

        const [cursosRes, instRes] = await Promise.all([
          api.get(`/institucion/${institucionId}/gacetaEventos`),
          api.get(`/institucionesPrincipal/${institucionId}`)
        ]);

        const cursoEncontrado = cursosRes.data.cursos?.find(
          (c: any) => c.iddetalle_cursos_academicos === Number(cursoId)
        );

        if (!cursoEncontrado) {
          setError('Curso no encontrado');
          return;
        }

        setCurso(cursoEncontrado);
        setInstitucion(instRes.data.Descripcion);

      } catch (err: any) {
        console.error('❌ Error cargando curso:', err);
        setError('No se pudo cargar la información del curso');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchCurso();
    }
  }, [params.id]);

  // Cerrar modal con tecla ESC
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

  // Share handler
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: curso?.det_titulo,
          text: curso?.det_descripcion?.replace(/<[^>]*>/g, '') || '',
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

  const colores = institucion?.colorinstitucion?.[0];
  const primaryColor = colores?.color_primario || '#04246C';
  const secondaryColor = colores?.color_secundario || '#FC0102';

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Por definir';
    return new Date(dateString).toLocaleDateString('es-BO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTipoColor = () => {
    const tipo = curso?.tipo_curso_otro?.tipo_conv_curso_nombre?.toUpperCase();
    if (tipo === 'CURSOS') return { bg: `${primaryColor}15`, text: primaryColor };
    if (tipo === 'SEMINARIOS') return { bg: `${secondaryColor}15`, text: secondaryColor };
    return { bg: `${primaryColor}10`, text: primaryColor };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando curso...</p>
        </div>
      </div>
    );
  }

  if (error || !curso) {
    return (
      <ThemeDynamicProvider colors={{ primary: primaryColor, secondary: secondaryColor }}>
        <div className="min-h-screen bg-background flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-2xl font-bold mb-2">
              {error || 'Curso no encontrado'}
            </h2>
            <p className="text-muted-foreground mb-6">
              El curso que buscas no existe o ha sido eliminado
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/cursos"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white"
                style={{ backgroundColor: primaryColor }}
              >
                <ArrowLeft className="w-4 h-4" />
                Volver a cursos
              </Link>
            </div>
          </div>
        </div>
      </ThemeDynamicProvider>
    );
  }

  const imageUrl = curso.det_img_portada ? getStorageUrl(curso.det_img_portada) : '';

  return (
    <ThemeDynamicProvider colors={{ primary: primaryColor, secondary: secondaryColor }}>
      <div className="min-h-screen bg-background">
        
        {/* 🖼️ Header con imagen */}
        <div className="relative h-64 md:h-80 lg:h-96 group cursor-pointer" onClick={openImageModal}>
          {curso.det_img_portada ? (
            <>
              <Image
                src={imageUrl}
                alt={curso.det_titulo}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
              
              {/*Overlay con indicador claro */}
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

              {/* Badge flotante siempre visible en móvil */}
              <div className="absolute bottom-4 right-4 md:hidden">
                <div className="bg-white/90 backdrop-blur-md rounded-full p-2 shadow-lg">
                  <ZoomIn className="w-5 h-5" style={{ color: primaryColor }} />
                </div>
              </div>
            </>
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${primaryColor}30, ${secondaryColor}20)` }}
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

        {/* MODAL DE IMAGEN COMPLETA */}
        {imageModalOpen && curso.det_img_portada && (
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

{/* Imagen - AHORA (más compacta) */}
<div 
  className="relative w-full h-full flex items-center justify-center p-4"
  onClick={(e) => e.stopPropagation()}
>
  <div className="relative w-full max-w-md max-h-[80vh] sm:max-h-[100vh]">
    <Image
      src={imageUrl}
      alt={curso.det_titulo}
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

            {/* Título del curso */}
            <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none">
              <p className="text-white text-lg font-semibold bg-black/60 backdrop-blur-md inline-block px-6 py-3 rounded-full">
                {curso.det_titulo}
              </p>
            </div>
          </div>
        )}

        {/* 📄 Contenido */}
        <div className="max-w-4xl mx-auto px-4 -mt-20 relative z-10 pb-20">
          <div className="bg-card rounded-2xl shadow-xl border overflow-hidden">
            
            <div className="p-6 md:p-8">
              <span 
                className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-4 uppercase tracking-wide"
                style={{ 
                  backgroundColor: getTipoColor().bg, 
                  color: getTipoColor().text 
                }}
              >
                {curso.tipo_curso_otro?.tipo_conv_curso_nombre || 'CURSO'}
              </span>

              <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                {curso.det_titulo}
              </h1>

              {curso.det_descripcion && (
                <div 
                  className="text-muted-foreground leading-relaxed mb-8 text-lg"
                  dangerouslySetInnerHTML={{ __html: curso.det_descripcion }}
                />
              )}

              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${primaryColor}15` }}>
                    <Clock className="w-5 h-5" style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Duración</p>
                    <p className="font-semibold text-foreground">
                      {curso.det_carga_horaria ? `${curso.det_carga_horaria} horas` : 'Por definir'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${primaryColor}15` }}>
                    <Users className="w-5 h-5" style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Cupos disponibles</p>
                    <p className="font-semibold text-foreground">{curso.det_cupo_max}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${primaryColor}15` }}>
                    <MapPin className="w-5 h-5" style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Modalidad</p>
                    <p className="font-semibold text-foreground">
                      {curso.det_modalidad === 'VIRTUAL' ? '💻 Virtual' : 
                       curso.det_modalidad === 'PRESENCIAL' ? '🏫 Presencial' : '🔄 Híbrido'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${primaryColor}15` }}>
                    <Calendar className="w-5 h-5" style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Fechas</p>
                    <p className="font-semibold text-foreground">
                      {curso.det_fecha_ini ? formatDate(curso.det_fecha_ini) : 'Por definir'}
                    </p>
                  </div>
                </div>
              </div>

              {(curso.det_lugar_curso || curso.det_hora_ini || curso.det_version) && (
                <div className="mb-8 p-4 rounded-xl bg-muted/30 border">
                  <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">
                    Detalles adicionales
                  </h3>
                  <div className="space-y-2 text-sm">
                    {curso.det_lugar_curso && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{curso.det_lugar_curso}</span>
                      </div>
                    )}
                    {curso.det_hora_ini && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>Hora de inicio: {curso.det_hora_ini.substring(0, 5)}</span>
                      </div>
                    )}
                    {curso.det_version && (
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                        <span>Versión: {curso.det_version}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t">
                <div>
                  {curso.det_costo > 0 ? (
                    <>
                      <p className="text-sm text-muted-foreground mb-1">Inversión</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold" style={{ color: primaryColor }}>
                          Bs. {curso.det_costo}
                        </span>
                        {curso.det_costo_ext && curso.det_costo_ext !== curso.det_costo && (
                          <span className="text-sm text-muted-foreground">
                            (Ext. Bs. {curso.det_costo_ext})
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-6 h-6 text-green-500" />
                      <p className="text-xl font-bold text-green-600">Gratuito</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 w-full sm:w-auto">
                  
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-between">
            <Link
              href="/cursos"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Ver todos los cursos
            </Link>
          </div>
        </div>

      </div>
    </ThemeDynamicProvider>
  );
}

// ==================== WRAPPER CON SUSPENSE ====================
export default function CursoDetallePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    }>
      <CursoDetalleContent />
    </Suspense>
  );
}