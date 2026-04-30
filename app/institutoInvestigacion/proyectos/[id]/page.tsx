// app/institutoInvestigacion/proyectos/[id]/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Calendar, FileText, Download, Share2, ExternalLink,
  Clock, MapPin, User, BookOpen, FlaskConical, Loader2
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

import api from '@/lib/axios';
import { getStorageUrl } from '@/lib/utils';
import ThemeDynamicProvider from '@/components/providers/ThemeDynamicProvider';

// ==================== TIPOS ====================
interface GacetaInvestigacion {
  gaceta_id: number;
  gaceta_titulo: string;
  gaceta_fecha: string;
  gaceta_documento?: string;
  gaceta_tipo: string;
}

interface InstitucionData {
  colorinstitucion: Array<{
    color_primario: string;
    color_secundario: string;
    color_terciario: string;
  }>;
}

// ==================== COMPONENTE CONTENIDO ====================
function ProyectoDetalleContent() {
  const params = useParams();
  const router = useRouter();
  
  // ✅ SEGURIDAD: Validar ID numérico
  const proyectoId = Number(params.id);
  if (isNaN(proyectoId)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">ID de proyecto inválido</h2>
          <Link href="/institutoInvestigacion" className="text-primary hover:underline">
            ← Volver al instituto
          </Link>
        </div>
      </div>
    );
  }

  const [proyecto, setProyecto] = useState<GacetaInvestigacion | null>(null);
  const [institucion, setInstitucion] = useState<InstitucionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const institucionId = Number(process.env.NEXT_PUBLIC_INSTITUCION_ID) || 12;

    const fetchProyecto = async () => {
      try {
        setLoading(true);
        setError(null);

        // ✅ Debug: Log de la solicitud
        console.log('🔍 Buscando proyecto ID:', proyectoId, 'para institución:', institucionId);

        const [gacetaRes, instRes] = await Promise.all([
          api.get(`/institucion/${institucionId}/gacetaEventos`),
          api.get(`/institucionesPrincipal/${institucionId}`)
        ]);

        if (!isMounted) return;

        // ✅ Función helper para comparación flexible de tipo
        const esTipoInvestigacion = (valor: any): boolean => {
          if (!valor) return false;
          const normalized = String(valor).trim().toUpperCase();
          return normalized === 'INSTITUTO DE INVESTIGACION';
        };

        // ✅ Buscar proyecto con filtrado flexible + debug
        const todosLosProyectos = gacetaRes.data.upea_gaceta_universitaria || [];
        console.log('📦 Total de gacetas en API:', todosLosProyectos.length);
        
        // Log de todos los IDs y tipos para debug
        todosLosProyectos.forEach((g: any) => {
          console.log(`🔎 Gaceta ID: ${g.gaceta_id}, Tipo: "${g.gaceta_tipo}", Match: ${esTipoInvestigacion(g.gaceta_tipo)}`);
        });

        const proyectoEncontrado = todosLosProyectos.find(
          (g: any) => g.gaceta_id === proyectoId && esTipoInvestigacion(g.gaceta_tipo)
        );

        if (!proyectoEncontrado) {
          // ✅ Error más descriptivo
          const existePeroNoEsInvestigacion = todosLosProyectos.find((g: any) => g.gaceta_id === proyectoId);
          
          if (existePeroNoEsInvestigacion) {
            console.warn('⚠️ Proyecto encontrado pero no es de tipo INVESTIGACION:', existePeroNoEsInvestigacion);
            setError(`El proyecto existe pero no pertenece al Instituto de Investigación`);
          } else {
            console.warn('⚠️ Proyecto no encontrado con ID:', proyectoId);
            setError(`No se encontró ningún proyecto con ID #${proyectoId}`);
          }
          return;
        }

        console.log('✅ Proyecto encontrado:', proyectoEncontrado.gaceta_titulo);
        setProyecto(proyectoEncontrado);
        setInstitucion(instRes.data.Descripcion || null);

      } catch (err: any) {
        if (isMounted) {
          console.error('❌ Error cargando proyecto:', err);
          
          // ✅ Manejo específico para error 404 de API
          if (err.response?.status === 404) {
            setError('La API no respondió. Verifica la conexión o el ID de institución.');
          } else {
            setError('No se pudo cargar la información del proyecto');
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProyecto();
    return () => { isMounted = false; };
  }, [proyectoId]);

  // Colores dinámicos seguros
  const colores = institucion?.colorinstitucion?.[0];
  const primaryColor = colores?.color_primario || '#04246C';
  const secondaryColor = colores?.color_secundario || '#FC0102';

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Fecha no disponible';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    return date.toLocaleDateString('es-BO', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: proyecto?.gaceta_titulo,
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
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Cargando proyecto...</p>
        </div>
      </div>
    );
  }

  if (error || !proyecto) {
    return (
      <ThemeDynamicProvider colors={{ primary: primaryColor, secondary: secondaryColor }}>
        <div className="min-h-screen bg-background flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-2xl font-bold mb-2">
              {error || 'Proyecto no encontrado'}
            </h2>
            <p className="text-muted-foreground mb-6 text-sm">
              {proyectoId && `ID buscado: #${proyectoId}`}
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/institutoInvestigacion"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition-all hover:shadow-md"
                style={{ backgroundColor: primaryColor }}
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al instituto
              </Link>
            </div>
          </div>
        </div>
      </ThemeDynamicProvider>
    );
  }

  const documentoUrl = proyecto.gaceta_documento ? getStorageUrl(proyecto.gaceta_documento) : '';

  return (
    <ThemeDynamicProvider colors={{ primary: primaryColor, secondary: secondaryColor }}>
      <div className="min-h-screen bg-background">
        
        {/* Header */}
        <div className="relative py-16 bg-gradient-to-br from-primary/10 to-background">
          <div className="max-w-4xl mx-auto px-4">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Volver
            </button>
            
            <div className="flex items-center gap-4 mb-4">
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <FlaskConical className="w-7 h-7" style={{ color: primaryColor }} />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold" style={{ color: primaryColor }}>
                {proyecto.gaceta_titulo}
              </h1>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(proyecto.gaceta_fecha)}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                {proyecto.gaceta_tipo}
              </span>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-card rounded-2xl shadow-xl border overflow-hidden">
            <div className="p-6 md:p-8">
              
              {/* Documento del proyecto */}
              {documentoUrl ? (
                <div className="mb-8 p-6 rounded-xl bg-muted/50 border">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5" style={{ color: primaryColor }} />
                    Documento del proyecto
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href={documentoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all hover:shadow-md"
                      style={{ backgroundColor: primaryColor, color: '#ffffff' }}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Ver documento
                    </a>
                    <a
                      href={documentoUrl}
                      download
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all hover:shadow-md"
                      style={{ backgroundColor: `${secondaryColor}15`, color: secondaryColor }}
                    >
                      <Download className="w-4 h-4" />
                      Descargar
                    </a>
                  </div>
                </div>
              ) : (
                <div className="mb-8 p-6 rounded-xl bg-muted/50 border text-center">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">Este proyecto no tiene documento adjunto disponible</p>
                </div>
              )}

              {/* Acciones */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all hover:shadow-md"
                  style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}
                >
                  <Share2 className="w-4 h-4" />
                  Compartir
                </button>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all hover:shadow-md"
                  style={{ backgroundColor: `${secondaryColor}10`, color: secondaryColor }}
                >
                  <FileText className="w-4 h-4" />
                  Imprimir
                </button>
              </div>
            </div>
          </div>

          {/* Navegación */}
          <div className="mt-8">
            <Link
              href="/institutoInvestigacion"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-primary transition-colors"
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

// ==================== WRAPPER CON SUSPENSE ====================
export default function ProyectoDetallePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    }>
      <ProyectoDetalleContent />
    </Suspense>
  );
}