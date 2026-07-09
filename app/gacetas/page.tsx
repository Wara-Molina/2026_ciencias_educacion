// app/gacetas/page.tsx
'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  FileText, Calendar, Download, Search, ArrowLeft, 
  Filter, Loader2, Eye, ChevronLeft, ChevronRight
} from 'lucide-react';
import Link from 'next/link';

import api from '@/lib/axios';
import { getStorageUrl } from '@/lib/utils';
import { sanitizeHTML } from '@/lib/sanitize';
import ThemeDynamicProvider from '@/components/providers/ThemeDynamicProvider';

interface Gaceta {
  gaceta_id: number;
  gaceta_titulo: string;
  gaceta_fecha: string;
  gaceta_documento?: string;
  gaceta_tipo?: string;
}

interface InstitucionData {
  institucion_nombre: string;
  colorinstitucion: Array<{
    color_primario: string;
    color_secundario: string;
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

const sanitizeTextField = (text: string | undefined, maxLength = 300): string => {
  if (!text) return '';
  return sanitizeHTML(text)
    .replace(/<[^>]*>/g, '')
    .trim()
    .slice(0, maxLength);
};

const sanitizeSearchQuery = (query: string): string => {
  return query.replace(/[<>\"'&]/g, '').trim().slice(0, 200);
};

function GacetasContent() {
  const institucionId = Number(process.env.NEXT_PUBLIC_INSTITUCION_ID) || 12;
  const searchParams = useSearchParams();
  const router = useRouter();
 
  const rawPagina = Number(searchParams.get('pagina'));
  const paginaActual = Number.isInteger(rawPagina) && rawPagina > 0 && rawPagina < 10000 ? rawPagina : 1;
  
  const itemsPorPagina = 6;
  
  const [busqueda, setBusqueda] = useState('');
  const [gacetas, setGacetas] = useState<Gaceta[]>([]);
  const [institucion, setInstitucion] = useState<InstitucionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [tiposDisponibles, setTiposDisponibles] = useState<string[]>([]);

  const [primaryColor, setPrimaryColor] = useState('#04246C');
  const [secondaryColor, setSecondaryColor] = useState('#FC0102');

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [gacetaRes, instRes] = await Promise.all([
          api.get(`/institucion/${institucionId}/gacetaEventos`),
          api.get(`/institucionesPrincipal/${institucionId}`)
        ]);

        if (!isMounted) return;

        const gacetasData = (gacetaRes.data.upea_gaceta_universitaria || [])
          .filter((g: any) => g.gaceta_id)
          .map((g: any) => ({
            gaceta_id: g.gaceta_id,
            gaceta_titulo: sanitizeTextField(g.gaceta_titulo, 200),
            gaceta_fecha: g.gaceta_fecha,
            gaceta_documento: g.gaceta_documento,
            gaceta_tipo: sanitizeTextField(g.gaceta_tipo, 50)
          })) as Gaceta[];

        setGacetas(gacetasData);
        setInstitucion(instRes.data.Descripcion || null);

        const tipos = Array.from(new Set(gacetasData.map(g => g.gaceta_tipo))).filter(Boolean);
        setTiposDisponibles(['TODOS', ...tipos as string[]]);

        if (instRes.data.Descripcion?.colorinstitucion?.[0]) {
          const colors = instRes.data.Descripcion.colorinstitucion[0];
          setPrimaryColor(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(colors.color_primario) ? colors.color_primario : '#04246C');
          setSecondaryColor(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(colors.color_secundario) ? colors.color_secundario : '#FC0102');
        }
      } catch (err: any) {
        if (isMounted) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Error cargando gacetas:', err);
          }
          setError('No se pudieron cargar las gacetas. Intente más tarde.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [institucionId]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const sanitizedBusqueda = useMemo(() => sanitizeSearchQuery(busqueda), [busqueda]);

  const gacetasFiltradas = useMemo(() => gacetas.filter((gaceta) => {
    const coincideTipo = filtroTipo === 'TODOS' || gaceta.gaceta_tipo === filtroTipo;
    const coincideBusqueda = sanitizedBusqueda === '' || 
      gaceta.gaceta_titulo.toLowerCase().includes(sanitizedBusqueda.toLowerCase());
    return coincideTipo && coincideBusqueda;
  }), [gacetas, filtroTipo, sanitizedBusqueda]);

  const totalPaginas = Math.max(1, Math.ceil(gacetasFiltradas.length / itemsPorPagina));
  const safePaginaActual = Math.min(Math.max(1, paginaActual), totalPaginas);
  const inicio = (safePaginaActual - 1) * itemsPorPagina;
  const fin = Math.min(inicio + itemsPorPagina, gacetasFiltradas.length);
  const gacetasPagina = gacetasFiltradas.slice(inicio, fin);

  const cambiarPagina = (nuevaPagina: number) => {
    const safePagina = Number.isInteger(nuevaPagina) && nuevaPagina > 0 && nuevaPagina <= totalPaginas ? nuevaPagina : 1;
    const params = new URLSearchParams(searchParams.toString());
    params.set('pagina', safePagina.toString());
    router.push(`/gacetas?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (safePaginaActual > 1) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('pagina', '1');
      router.replace(`/gacetas?${params.toString()}`, { scroll: false });
    }
  }, [sanitizedBusqueda, filtroTipo]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="text-muted-foreground">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-primary text-white rounded-md">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <ThemeDynamicProvider colors={{ primary: primaryColor, secondary: secondaryColor }}>
      <div className="min-h-screen bg-background">
        
<section className="relative py-20 overflow-hidden">

  {/* Imagen de fondo */}
  <div
    className="absolute inset-0 bg-cover bg-center"
    style={{
      backgroundImage: "url('/imagenes/imagen_upea.jpg')"
    }}
  />

  {/* Overlay oscuro */}
  <div className="absolute inset-0 bg-black/60" />

  {/* Patrón decorativo */}
  <div className="absolute inset-0 opacity-10">
    <div
      className="absolute inset-0"
      style={{
        backgroundImage:
          "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
        backgroundSize: "40px 40px",
      }}
    />
  </div>

  {/* Efectos visuales */}
  <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
  <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

  {/* Línea inferior */}
  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

  {/* Contenido */}
  <div className="relative max-w-6xl mx-auto px-4">
    <Link
      href="/"
      className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white mb-8 transition-colors group"
    >
      <div className="p-2 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors">
        <ArrowLeft className="w-4 h-4" />
      </div>
      <span className="font-medium">Volver al inicio</span>
    </Link>

    <div className="flex items-center gap-4 mb-6">
      <div className="p-4 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20">
        <FileText className="w-10 h-10 text-white" />
      </div>

      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white">
        Gaceta Universitaria
      </h1>
    </div>

    <p className="text-lg md:text-xl text-white/90 max-w-3xl leading-relaxed">
      Documentos oficiales, resoluciones y noticias de{" "}
      <span className="font-semibold text-white">
        {institucion?.institucion_nombre || "nuestra universidad"}
      </span>
    </p>

    <div className="mt-8 inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      <span className="text-sm text-white/90">
        {gacetas.length} documentos disponibles
      </span>
    </div>
  </div>

</section>

        <div className="bg-background border-b py-4 sticky top-16 z-40">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-4">
              
              <div className="flex flex-wrap gap-2">
                <Filter className="w-5 h-5 text-muted-foreground self-center mr-2" aria-hidden="true" />
                {tiposDisponibles.map((tipo) => (
                  <button
                    key={tipo}
                    onClick={() => setFiltroTipo(tipo)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      filtroTipo === tipo ? 'text-white shadow-md' : 'bg-muted text-foreground hover:bg-muted/80'
                    }`}
                    style={filtroTipo === tipo ? { backgroundColor: primaryColor } : {}}
                    aria-pressed={filtroTipo === tipo}
                  >
                    {tipo === 'TODOS' ? 'Todas' : tipo}
                  </button>
                ))}
              </div>

              <div className="relative w-full lg:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Buscar gacetas..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  style={{ borderColor: `${primaryColor}30` }}
                  aria-label="Buscar gacetas"
                />
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              {gacetasFiltradas.length} documento{gacetasFiltradas.length !== 1 ? 's' : ''} encontrado{gacetasFiltradas.length !== 1 ? 's' : ''}
              {filtroTipo !== 'TODOS' && ` en ${filtroTipo}`}
              {busqueda && ` para "${busqueda}"`}
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-12">
          {gacetasPagina.length === 0 ? (
            <div className="text-center py-20">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" aria-hidden="true" />
              <h3 className="text-xl font-bold mb-2">No se encontraron gacetas</h3>
              <p className="text-muted-foreground mb-6">Intenta con otros filtros o términos de búsqueda</p>
              <button onClick={() => { setBusqueda(''); setFiltroTipo('TODOS'); }} className="px-6 py-3 rounded-lg font-medium text-white" style={{ backgroundColor: primaryColor }}>
                Limpiar filtros
              </button>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {gacetasPagina.map((gaceta) => (
                  <Link key={gaceta.gaceta_id} href={`/gacetas/${gaceta.gaceta_id}`} className="block group">
                    <div className="bg-card rounded-xl border border-border hover:shadow-xl transition-all hover:-translate-y-1 overflow-hidden h-full flex flex-col">
                      <div className="relative h-32 flex items-center justify-center" style={{ backgroundColor: `${primaryColor}10` }}>
                        <FileText className="w-16 h-16 transition-transform group-hover:scale-110" style={{ color: primaryColor }} aria-hidden="true" />
                        <div className="absolute bottom-2 right-2 px-2 py-1 bg-white/90 rounded text-xs font-bold shadow-sm text-muted-foreground">PDF</div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-medium mb-3 w-fit" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                          {gaceta.gaceta_tipo}
                        </span>
                        
                        <h3 className="text-lg font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                          {gaceta.gaceta_titulo}
                        </h3>
                        
                        <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" style={{ color: primaryColor }} aria-hidden="true" />
                            <span>{formatDate(gaceta.gaceta_fecha)}</span>
                          </div>
                          <Eye className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {totalPaginas > 1 && (
                <div className="flex items-center justify-center gap-2" role="navigation" aria-label="Paginación de gacetas">
                  <button
                    onClick={() => cambiarPagina(safePaginaActual - 1)}
                    disabled={safePaginaActual === 1}
                    className="p-2 rounded-lg border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="w-5 h-5" aria-hidden="true" />
                  </button>
                  
                  {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => (
                    <button
                      key={pagina}
                      onClick={() => cambiarPagina(pagina)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        pagina === safePaginaActual ? 'text-white' : 'border border-border hover:bg-muted'
                      }`}
                      style={pagina === safePaginaActual ? { backgroundColor: primaryColor } : {}}
                      aria-current={pagina === safePaginaActual ? 'page' : undefined}
                      aria-label={`Ir a página ${pagina}`}
                    >
                      {pagina}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => cambiarPagina(safePaginaActual + 1)}
                    disabled={safePaginaActual === totalPaginas}
                    className="p-2 rounded-lg border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                    aria-label="Página siguiente"
                  >
                    <ChevronRight className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>
              )}

              <p className="text-center text-sm text-muted-foreground mt-4">
                Página {safePaginaActual} de {totalPaginas} - Mostrando {gacetasPagina.length} de {gacetasFiltradas.length} documentos
              </p>
            </>
          )}
        </div>

      </div>
    </ThemeDynamicProvider>
  );
}

export default function GacetasPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    }>
      <GacetasContent />
    </Suspense>
  );
}