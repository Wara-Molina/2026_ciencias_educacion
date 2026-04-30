// app/institutoInvestigacion/gacetas/[id]/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Calendar, Download, FileText, ExternalLink,
  Loader2, FlaskConical
} from 'lucide-react';
import Link from 'next/link';

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
  institucion_nombre: string;
  colorinstitucion: Array<{
    color_primario: string;
    color_secundario: string;
  }>;
}

// ==================== COMPONENTE ====================
function GacetaInvestigacionDetalleContent() {
  const params = useParams();
  const router = useRouter();
  
  const gacetaId = Number(params.id);
  if (isNaN(gacetaId)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-2xl font-bold mb-4">ID inválido</p>
          <Link href="/institutoInvestigacion" className="text-primary hover:underline">
            ← Volver al instituto
          </Link>
        </div>
      </div>
    );
  }

  const [gaceta, setGaceta] = useState<GacetaInvestigacion | null>(null);
  const [institucion, setInstitucion] = useState<InstitucionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [primaryColor, setPrimaryColor] = useState('#04246C');
  const [secondaryColor, setSecondaryColor] = useState('#FC0102');
  
  const institucionId = Number(process.env.NEXT_PUBLIC_INSTITUCION_ID) || 12;

  useEffect(() => {
    let isMounted = true;

    const fetchGaceta = async () => {
      try {
        setLoading(true);
        const [gacetaRes, instRes] = await Promise.all([
          api.get(`/institucion/${institucionId}/gacetaEventos`),
          api.get(`/institucionesPrincipal/${institucionId}`)
        ]);

        if (!isMounted) return;

        //  Función helper robusta para filtrar "INSTITUTO DE INVESTIGACION"
        const esTipoInvestigacion = (valor: any): boolean => {
          if (!valor) return false;
          const normalized = String(valor)
            .trim()
            .toUpperCase()
            .replace(/[ÁÀÂÄ]/g, 'A')
            .replace(/[ÉÈÊË]/g, 'E')
            .replace(/[ÍÌÎÏ]/g, 'I')
            .replace(/[ÓÒÔÖ]/g, 'O')
            .replace(/[ÚÙÛÜ]/g, 'U')
            .replace(/Ñ/g, 'N');
          
          return normalized === 'INSTITUTO DE INVESTIGACION' || 
                 (normalized.includes('INSTITUTO') && normalized.includes('INVESTIGACION'));
        };

        // ✅ Buscar gaceta con filtrado robusto
        const encontrada = gacetaRes.data.upea_gaceta_universitaria?.find(
          (g: any) => g.gaceta_id === gacetaId && esTipoInvestigacion(g.gaceta_tipo)
        );

        if (encontrada) {
          setGaceta({
            gaceta_id: encontrada.gaceta_id,
            gaceta_titulo: encontrada.gaceta_titulo || 'Sin título',
            gaceta_fecha: encontrada.gaceta_fecha,
            gaceta_documento: encontrada.gaceta_documento,
            gaceta_tipo: 'INSTITUTO DE INVESTIGACION'
          });
          
          if (instRes.data.Descripcion?.colorinstitucion?.[0]) {
            setPrimaryColor(instRes.data.Descripcion.colorinstitucion[0].color_primario || '#04246C');
            setSecondaryColor(instRes.data.Descripcion.colorinstitucion[0].color_secundario || '#FC0102');
          }
          setInstitucion(instRes.data.Descripcion || null);
        } else {
          setError('Gaceta no encontrada o no pertenece al Instituto de Investigación');
        }
      } catch (err) {
        if (isMounted) setError('Error al cargar el documento');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchGaceta();
    return () => { isMounted = false; };
  }, [gacetaId, institucionId]);

  const documentoUrl = gaceta?.gaceta_documento ? getStorageUrl(gaceta.gaceta_documento) : '';

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Fecha no disponible';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    return date.toLocaleDateString('es-BO', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: primaryColor }} />
      </div>
    );
  }

  if (error || !gaceta) {
    return (
      <ThemeDynamicProvider colors={{ primary: primaryColor, secondary: secondaryColor }}>
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="text-center max-w-md">
            <div className="text-5xl mb-4">📄</div>
            <h2 className="text-2xl font-bold mb-2">{error || 'Documento no encontrado'}</h2>
            <p className="text-muted-foreground mb-6 text-sm">
              ID buscado: #{gacetaId}
            </p>
            <Link 
              href="/institutoInvestigacion" 
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white"
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
      <div className="min-h-screen bg-background flex flex-col">
        
        {/* Header MOVIDO MÁS ABAJO - mt-8 en móvil, mt-12 en desktop */}
        <div className="bg-card border-b px-4 py-4 mt-8 sm:mt-12">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.back()} 
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="font-bold text-lg line-clamp-1">{gaceta.gaceta_titulo}</h1>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(gaceta.gaceta_fecha)}</span>
                  {gaceta.gaceta_tipo && (
                    <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-xs">
                      {gaceta.gaceta_tipo}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {documentoUrl && (
              <div className="flex gap-2">
                <a 
                  href={documentoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm bg-primary text-white hover:opacity-90 transition-opacity"
                >
                  <ExternalLink className="w-4 h-4" />
                  Abrir
                </a>
                <a 
                  href={documentoUrl}
                  download
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm border hover:bg-muted transition-colors"
                  style={{ borderColor: primaryColor }}
                >
                  <Download className="w-4 h-4" />
                  Descargar
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Visor de PDF - Altura ajustada */}
        <div className="flex-1 bg-muted/30 p-2 sm:p-4">
          {documentoUrl ? (
            <div className="max-w-7xl mx-auto h-[calc(100vh-160px)] bg-white rounded-lg shadow-lg overflow-hidden">
              <iframe
                src={`${documentoUrl}#toolbar=1`}
                className="w-full h-full border-0"
                title={`Visor de ${gaceta.gaceta_titulo}`}
              />
            </div>
          ) : (
            <div className="max-w-7xl mx-auto h-96 flex flex-col items-center justify-center bg-white rounded-lg">
              <FileText className="w-20 h-20 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Esta gaceta no tiene documento adjunto disponible
              </p>
            </div>
          )}
        </div>

        {/* Botones Móviles Fijos */}
        <div className="sm:hidden fixed bottom-4 right-4 z-40">
           {documentoUrl && (
            <a 
              href={documentoUrl}
              download
              className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-white shadow-xl"
              style={{ backgroundColor: primaryColor }}
            >
              <Download className="w-6 h-6" />
            </a>
           )}
        </div>

      </div>
    </ThemeDynamicProvider>
  );
}

export default function GacetaInvestigacionDetallePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    }>
      <GacetaInvestigacionDetalleContent />
    </Suspense>
  );
}