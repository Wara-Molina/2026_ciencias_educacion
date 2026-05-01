// app/gacetas/[id]/page.tsx
'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Calendar, Download, FileText, ExternalLink,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

import api from '@/lib/axios';
import { getStorageUrl } from '@/lib/utils';
import { sanitizeHTML } from '@/lib/sanitize';
import ThemeDynamicProvider from '@/components/providers/ThemeDynamicProvider';

interface GacetaDetalle {
  gaceta_id: number;
  gaceta_titulo: string;
  gaceta_fecha: string;
  gaceta_documento?: string;
  gaceta_tipo?: string;
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

const sanitizeTextField = (text: string | undefined, maxLength = 300): string => {
  if (!text) return '';
  return sanitizeHTML(text)
    .replace(/<[^>]*>/g, '')
    .trim()
    .slice(0, maxLength);
};

function GacetaDetalleContent() {
  const params = useParams();
  const router = useRouter();
  
  const rawGacetaId = Number(params.id);
  const gacetaId = Number.isInteger(rawGacetaId) && rawGacetaId > 0 && rawGacetaId < 10000000 ? rawGacetaId : null;
  
  if (gacetaId === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold mb-4">ID inválido</p>
          <Link href="/gacetas" className="text-primary hover:underline">← Volver</Link>
        </div>
      </div>
    );
  }

  const [gaceta, setGaceta] = useState<GacetaDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [primaryColor, setPrimaryColor] = useState('#04246C');
  const institucionId = Number(process.env.NEXT_PUBLIC_INSTITUCION_ID) || 12;

  useEffect(() => {
    let isMounted = true;

    const fetchGaceta = async () => {
      try {
        setLoading(true);
        
        // ✅ CORRECCIÓN: Usar rutas relativas (axios tiene baseURL configurado)
        const [gacetaRes, instRes] = await Promise.all([
          api.get(`/institucion/${institucionId}/gacetaEventos`),
          api.get(`/institucionesPrincipal/${institucionId}`)
        ]);

        if (!isMounted) return;

        const encontrada = gacetaRes.data.upea_gaceta_universitaria?.find(
          (g: any) => g.gaceta_id === gacetaId
        );

        if (encontrada) {
          setGaceta({
            gaceta_id: encontrada.gaceta_id,
            gaceta_titulo: sanitizeTextField(encontrada.gaceta_titulo, 200),
            gaceta_fecha: encontrada.gaceta_fecha,
            gaceta_documento: encontrada.gaceta_documento,
            gaceta_tipo: sanitizeTextField(encontrada.gaceta_tipo, 50)
          });
          
          if (instRes.data.Descripcion?.colorinstitucion?.[0]) {
            const colors = instRes.data.Descripcion.colorinstitucion[0];
            setPrimaryColor(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(colors.color_primario) ? colors.color_primario : '#04246C');
          }
        } else {
          setError('Gaceta no encontrada');
        }
      } catch (err) {
        if (isMounted) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Error cargando gaceta:', err);
          }
          setError('Error al cargar el documento');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchGaceta();
    return () => { isMounted = false; };
  }, [gacetaId, institucionId]);

  const documentoUrl = useMemo(() => {
    if (!gaceta?.gaceta_documento) return '';
    const url = getStorageUrl(gaceta.gaceta_documento);
    return isValidDocumentUrl(url) ? url : '';
  }, [gaceta?.gaceta_documento]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !gaceta) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-5xl mb-4">📄</div>
          <h2 className="text-2xl font-bold mb-2">{error || 'Documento no encontrado'}</h2>
          <Link href="/gacetas" className="text-primary hover:underline mt-4 inline-block">
            ← Volver a la lista
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ThemeDynamicProvider colors={{ primary: primaryColor }}>
      <div className="min-h-screen bg-background flex flex-col">
        
        <div className="bg-card border-b px-4 py-4 mt-8 sm:mt-12">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="p-2 hover:bg-muted rounded-lg transition-colors" aria-label="Volver">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="font-bold text-lg line-clamp-1">{gaceta.gaceta_titulo}</h1>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" aria-hidden="true" />
                  <span>{new Date(gaceta.gaceta_fecha).toLocaleDateString('es-BO')}</span>
                  {gaceta.gaceta_tipo && (
                    <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                      {gaceta.gaceta_tipo}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {documentoUrl && (
              <div className="flex gap-2">
                <a href={documentoUrl} target="_blank" rel="noopener noreferrer" className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm bg-primary text-white hover:opacity-90 transition-opacity">
                  <ExternalLink className="w-4 h-4" aria-hidden="true" /> Abrir
                </a>
                <a href={documentoUrl} download className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm border hover:bg-muted transition-colors">
                  <Download className="w-4 h-4" aria-hidden="true" /> Descargar
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 bg-muted/30 p-2 sm:p-4">
          {documentoUrl ? (
            <div className="max-w-7xl mx-auto h-[calc(100vh-160px)] bg-white rounded-lg shadow-lg overflow-hidden">
<iframe
  src={`${documentoUrl}#toolbar=1`}
  className="w-full h-full border-0"
  title={`Visor de ${gaceta.gaceta_titulo}`}
  loading="lazy"
/>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto h-96 flex flex-col items-center justify-center bg-white rounded-lg">
              <FileText className="w-20 h-20 text-muted-foreground mb-4" aria-hidden="true" />
              <p className="text-muted-foreground">Este documento no tiene archivo adjunto.</p>
            </div>
          )}
        </div>

        <div className="sm:hidden fixed bottom-4 right-4 z-40">
           {documentoUrl && (
            <a href={documentoUrl} download className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-white shadow-xl" aria-label="Descargar documento">
              <Download className="w-6 h-6" aria-hidden="true" />
            </a>
           )}
        </div>

      </div>
    </ThemeDynamicProvider>
  );
}

export default function GacetaDetallePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    }>
      <GacetaDetalleContent />
    </Suspense>
  );
}