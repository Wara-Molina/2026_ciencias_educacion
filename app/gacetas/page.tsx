// app/gacetas/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  FileText, Calendar, Download, Search, ArrowLeft, 
  Filter, Loader2, Eye, ChevronLeft, ChevronRight
} from 'lucide-react';
import Link from 'next/link';

import api from '@/lib/axios';
import { getStorageUrl } from '@/lib/utils';
import ThemeDynamicProvider from '@/components/providers/ThemeDynamicProvider';

// ==================== TIPOS ====================
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

// ==================== COMPONENTE PRINCIPAL ====================
function GacetasContent() {
  const institucionId = Number(process.env.NEXT_PUBLIC_INSTITUCION_ID) || 12;
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // ✅ Estados para búsqueda y paginación
  const [busqueda, setBusqueda] = useState('');
  const paginaActual = Number(searchParams.get('pagina')) || 1;
  const itemsPorPagina = 6;
  
  const [gacetas, setGacetas] = useState<Gaceta[]>([]);
  const [institucion, setInstitucion] = useState<InstitucionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
  const [tiposDisponibles, setTiposDisponibles] = useState<string[]>([]);

  const [primaryColor, setPrimaryColor] = useState('#04246C');
  const [secondaryColor, setSecondaryColor] = useState('#FC0102');

  // ==================== FETCH DATOS ====================
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
            gaceta_titulo: g.gaceta_titulo || 'Sin título',
            gaceta_fecha: g.gaceta_fecha,
            gaceta_documento: g.gaceta_documento,
            gaceta_tipo: g.gaceta_tipo || 'General'
          })) as Gaceta[];

        setGacetas(gacetasData);
        setInstitucion(instRes.data.Descripcion || null);

        const tipos = Array.from(new Set(gacetasData.map(g => g.gaceta_tipo))).filter(Boolean);
        setTiposDisponibles(['TODOS', ...tipos as string[]]);

        if (instRes.data.Descripcion?.colorinstitucion?.[0]) {
          setPrimaryColor(instRes.data.Descripcion.colorinstitucion[0].color_primario || '#04246C');
          setSecondaryColor(instRes.data.Descripcion.colorinstitucion[0].color_secundario || '#FC0102');
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('❌ Error cargando gacetas:', err);
          setError('No se pudieron cargar las gacetas. Intente más tarde.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [institucionId]);

  // Helpers
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  // ✅ Filtrar por tipo + búsqueda
  const gacetasFiltradas = gacetas.filter((gaceta) => {
    const coincideTipo = filtroTipo === 'TODOS' || gaceta.gaceta_tipo === filtroTipo;
    const coincideBusqueda = busqueda === '' || 
      gaceta.gaceta_titulo.toLowerCase().includes(busqueda.toLowerCase());
    return coincideTipo && coincideBusqueda;
  });

  // ✅ Cálculos de paginación
  const totalPaginas = Math.ceil(gacetasFiltradas.length / itemsPorPagina);
  const inicio = (paginaActual - 1) * itemsPorPagina;
  const fin = inicio + itemsPorPagina;
  const gacetasPagina = gacetasFiltradas.slice(inicio, fin);

  // ✅ Cambiar página y actualizar URL
  const cambiarPagina = (nuevaPagina: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('pagina', nuevaPagina.toString());
    router.push(`/gacetas?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ✅ Resetear a página 1 al cambiar filtros o búsqueda
  useEffect(() => {
    if (paginaActual > 1) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('pagina', '1');
      router.replace(`/gacetas?${params.toString()}`, { scroll: false });
    }
  }, [busqueda, filtroTipo]);

  // ==================== RENDER LOADING ====================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  // ==================== RENDER ERROR ====================
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
        
{/* 🎨 Header Elegante con Degradado */}
<section className="relative py-20 overflow-hidden">
  {/* Fondo con degradado elegante */}
  <div 
    className="absolute inset-0"
    style={{ 
      background: `
        linear-gradient(135deg, 
          ${primaryColor} 0%, 
          ${primaryColor}cc 25%, 
          ${secondaryColor}99 60%, 
          ${secondaryColor}44 100%
        )
      ` 
    }}
  />
  
  {/* Overlay de patrón sutil */}
  <div className="absolute inset-0 opacity-10">
    <div 
      className="absolute inset-0"
      style={{
        backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
        backgroundSize: '40px 40px'
      }}
    />
  </div>
  
  {/* Orbes decorativos para profundidad */}
  <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
  <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
  
  {/* Línea decorativa inferior */}
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
      Documentos oficiales, resoluciones y noticias de{' '}
      <span className="font-semibold text-white">
        {institucion?.institucion_nombre || 'nuestra universidad'}
      </span>
    </p>
    
    {/* Badge decorativo con contador */}
    <div className="mt-8 inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      <span className="text-sm text-white/90">
        {gacetas.length} documentos disponibles
      </span>
    </div>
  </div>
</section>

        {/* Filtros + Búsqueda */}
        <div className="bg-background border-b py-4 sticky top-16 z-40">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-4">
              
              {/* Filtros por tipo */}
              <div className="flex flex-wrap gap-2">
                <Filter className="w-5 h-5 text-muted-foreground self-center mr-2" />
                {tiposDisponibles.map((tipo) => (
                  <button
                    key={tipo}
                    onClick={() => setFiltroTipo(tipo)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      filtroTipo === tipo ? 'text-white shadow-md' : 'bg-muted text-foreground hover:bg-muted/80'
                    }`}
                    style={filtroTipo === tipo ? { backgroundColor: primaryColor } : {}}
                  >
                    {tipo === 'TODOS' ? 'Todas' : tipo}
                  </button>
                ))}
              </div>

              {/* ✅ Búsqueda */}
              <div className="relative w-full lg:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar gacetas..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  style={{ borderColor: `${primaryColor}30` }}
                />
              </div>
            </div>

            {/* Resultados count */}
            <div className="text-sm text-muted-foreground">
              {gacetasFiltradas.length} documento{gacetasFiltradas.length !== 1 ? 's' : ''} encontrado{gacetasFiltradas.length !== 1 ? 's' : ''}
              {filtroTipo !== 'TODOS' && ` en ${filtroTipo}`}
              {busqueda && ` para "${busqueda}"`}
            </div>
          </div>
        </div>

        {/* Lista de Gacetas */}
        <div className="max-w-6xl mx-auto px-4 py-12">
          {gacetasPagina.length === 0 ? (
            <div className="text-center py-20">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-bold mb-2">No se encontraron gacetas</h3>
              <p className="text-muted-foreground mb-6">
                Intenta con otros filtros o términos de búsqueda
              </p>
              <button
                onClick={() => { setBusqueda(''); setFiltroTipo('TODOS'); }}
                className="px-6 py-3 rounded-lg font-medium text-white"
                style={{ backgroundColor: primaryColor }}
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <>
              {/* Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {gacetasPagina.map((gaceta) => (
                  <Link
                    key={gaceta.gaceta_id}
                    href={`/gacetas/${gaceta.gaceta_id}`}
                    className="block group"
                  >
                    <div className="bg-card rounded-xl border border-border hover:shadow-xl transition-all hover:-translate-y-1 overflow-hidden h-full flex flex-col">
                      {/* Icono/Imagen de cabecera */}
                      <div 
                        className="relative h-32 flex items-center justify-center"
                        style={{ backgroundColor: `${primaryColor}10` }}
                      >
                        <FileText className="w-16 h-16 transition-transform group-hover:scale-110" style={{ color: primaryColor }} />
                        <div className="absolute bottom-2 right-2 px-2 py-1 bg-white/90 rounded text-xs font-bold shadow-sm text-muted-foreground">
                          PDF
                        </div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col">
                        <span 
                          className="inline-block px-2 py-0.5 rounded text-xs font-medium mb-3 w-fit"
                          style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                        >
                          {gaceta.gaceta_tipo}
                        </span>
                        
                        <h3 className="text-lg font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                          {gaceta.gaceta_titulo}
                        </h3>
                        
                        <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(gaceta.gaceta_fecha)}</span>
                          </div>
                          <Eye className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* ✅ Paginación */}
              {totalPaginas > 1 && (
                <div className="flex items-center justify-center gap-2">
                  {/* Botón Anterior */}
                  <button
                    onClick={() => cambiarPagina(paginaActual - 1)}
                    disabled={paginaActual === 1}
                    className="p-2 rounded-lg border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  {/* Números de página */}
                  {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => (
                    <button
                      key={pagina}
                      onClick={() => cambiarPagina(pagina)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        pagina === paginaActual 
                          ? 'text-white' 
                          : 'border border-border hover:bg-muted'
                      }`}
                      style={pagina === paginaActual ? { backgroundColor: primaryColor } : {}}
                    >
                      {pagina}
                    </button>
                  ))}
                  
                  {/* Botón Siguiente */}
                  <button
                    onClick={() => cambiarPagina(paginaActual + 1)}
                    disabled={paginaActual === totalPaginas}
                    className="p-2 rounded-lg border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                    aria-label="Página siguiente"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Info de paginación */}
              <p className="text-center text-sm text-muted-foreground mt-4">
                Página {paginaActual} de {totalPaginas} - Mostrando {gacetasPagina.length} de {gacetasFiltradas.length} documentos
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