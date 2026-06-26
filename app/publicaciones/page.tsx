// app/publicaciones/page.tsx
'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  BookOpen, Search, Filter, ArrowLeft, Calendar, User, 
  Download, ExternalLink, ChevronLeft, ChevronRight, FileText
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

import api from '@/lib/axios';
import { getStorageUrl } from '@/lib/utils';
import { sanitizeHTML } from '@/lib/sanitize';
import ThemeDynamicProvider from '@/components/providers/ThemeDynamicProvider';

interface ColorInstitucion {
  color_primario: string;
  color_secundario: string;
  color_terciario: string;
}

interface Publicacion {
  publicaciones_id: number;
  publicaciones_titulo: string;
  publicaciones_imagen?: string;
  publicaciones_descripcion?: string;
  publicaciones_documento?: string;
  publicaciones_fecha: string;
  publicaciones_autor?: string;
  publicaciones_tipo?: string;
  publicaciones_estado?: string;
}

interface InstitucionData {
  institucion_nombre?: string;
  institucion_iniciales?: string;
  institucion_logo_url?: string;
  institucion_direccion?: string;
  institucion_correo1?: string;
  institucion_celular1?: number;
  colorinstitucion: ColorInstitucion[];
}

const isValidDocumentUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    const validProtocol = ['http:', 'https:'].includes(parsed.protocol);
    const safeDomain = parsed.hostname.includes('upea.bo') || 
                      parsed.hostname.includes('localhost') ||
                      parsed.hostname.includes('127.0.0.1');
    const safePath = !parsed.pathname.includes('<') && !parsed.pathname.includes('>');
    return validProtocol && safeDomain && safePath;
  } catch {
    return false;
  }
};

const sanitizeSearchQuery = (query: string): string => {
  return query.replace(/[<>\"'&]/g, '').trim().slice(0, 200);
};

function PublicacionesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const rawPagina = Number(searchParams.get('pagina'));
  const paginaActual = Number.isInteger(rawPagina) && rawPagina > 0 && rawPagina < 10000 ? rawPagina : 1;
  
  const itemsPorPagina = 6;
  
  const [busqueda, setBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState<string>('TODAS');
  
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [publicacionesFiltradas, setPublicacionesFiltradas] = useState<Publicacion[]>([]);
  const [institucion, setInstitucion] = useState<InstitucionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [categorias, setCategorias] = useState<string[]>([]);
  
  const [primaryColor, setPrimaryColor] = useState('#04246C');
  const [secondaryColor, setSecondaryColor] = useState('#FC0102');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const institucionId = Number(process.env.NEXT_PUBLIC_INSTITUCION_ID) || 12;
        
        // ✅ CORRECCIÓN: Usar rutas relativas (axios tiene baseURL configurado)
        const [publiRes, instRes] = await Promise.all([
          api.get(`/institucion/${institucionId}/recursos`),
          api.get(`/institucionesPrincipal/${institucionId}`)
        ]);

        const publicacionesData: Publicacion[] = (publiRes.data.upea_publicaciones || [])
          .filter((p: any) => p.publicaciones_estado !== "0" && p.publicaciones_tipo !== "SEDES");
          
        setPublicaciones(publicacionesData);
        setPublicacionesFiltradas(publicacionesData);
        setInstitucion(instRes.data.Descripcion);

        const categoriasUnicas = Array.from(
          new Set(
            publicacionesData
              .map(p => p.publicaciones_tipo)
              .filter((tipo): tipo is string => Boolean(tipo) && tipo !== 'SEDES')
          )
        ).sort();
        
        setCategorias(['TODAS', ...categoriasUnicas]);
        
        if (instRes.data.Descripcion?.colorinstitucion?.[0]) {
          setPrimaryColor(instRes.data.Descripcion.colorinstitucion[0].color_primario || '#04246C');
          setSecondaryColor(instRes.data.Descripcion.colorinstitucion[0].color_secundario || '#FC0102');
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Error cargando publicaciones:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const sanitizedBusqueda = useMemo(() => sanitizeSearchQuery(busqueda), [busqueda]);

useEffect(() => {
  let filtradas = [...publicaciones];

  if (categoriaActiva !== 'TODAS') {
    filtradas = filtradas.filter(
      p => p.publicaciones_tipo === categoriaActiva
    );
  }

  if (sanitizedBusqueda) {
    const query = sanitizedBusqueda.toLowerCase();

    filtradas = filtradas.filter(
      p =>
        p.publicaciones_titulo.toLowerCase().includes(query) ||
        p.publicaciones_descripcion?.toLowerCase().includes(query) ||
        p.publicaciones_autor?.toLowerCase().includes(query)
    );
  }

  setPublicacionesFiltradas(filtradas);

}, [publicaciones, categoriaActiva, sanitizedBusqueda]);

useEffect(() => {
  const params = new URLSearchParams(searchParams.toString());

  params.set('pagina', '1');

  router.replace(
    `/publicaciones?${params.toString()}`,
    { scroll: false }
  );

}, [categoriaActiva, sanitizedBusqueda]);
  const cambiarPagina = (nuevaPagina: number) => {
    const safePagina = Number.isInteger(nuevaPagina) && nuevaPagina > 0 && nuevaPagina < 10000 ? nuevaPagina : 1;
    const params = new URLSearchParams(searchParams.toString());
    params.set('pagina', safePagina.toString());
    router.push(`/publicaciones?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalPaginas = Math.max(1, Math.ceil(publicacionesFiltradas.length / itemsPorPagina));
  const inicio = (paginaActual - 1) * itemsPorPagina;
  const fin = Math.min(inicio + itemsPorPagina, publicacionesFiltradas.length);
  const publicacionesPagina = publicacionesFiltradas.slice(inicio, fin);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando publicaciones...</p>
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
    className="absolute inset-0"
    style={{
      backgroundImage: "url('/imagenes/imagen_upea.jpg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    }}
  />

  {/* Overlay oscuro */}
  <div className="absolute inset-0 bg-black/65" />

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
        <BookOpen className="w-10 h-10 text-white" />
      </div>

      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white">
        Publicaciones
      </h1>
    </div>

    <p className="text-lg md:text-xl text-white/90 max-w-3xl leading-relaxed">
      Artículos, investigaciones y documentos académicos de{' '}
      <span className="font-semibold text-white">
        {institucion?.institucion_nombre || 'nuestra institución'}
      </span>
    </p>

    <div className="mt-8 inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      <span className="text-sm text-white/90">
        {publicaciones.length} publicaciones disponibles
      </span>
    </div>

  </div>
</section>

        <div className="bg-background border-b border-border py-4 sticky top-16 z-40">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-4">
              
              <div className="flex flex-wrap gap-2">
                {categorias.map((categoria) => (
                  <button
                    key={categoria}
                    onClick={() => setCategoriaActiva(categoria)}
                    className={`px-4 py-2 rounded-full font-medium text-sm transition-all ${
                      categoriaActiva === categoria ? 'text-white shadow-md' : 'bg-muted text-foreground hover:bg-muted/80'
                    }`}
                    style={categoriaActiva === categoria ? { backgroundColor: primaryColor } : {}}
                    aria-pressed={categoriaActiva === categoria}
                  >
                    {categoria === 'TODAS' ? 'Todas' : categoria}
                  </button>
                ))}
              </div>

              <div className="relative w-full lg:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Buscar publicaciones..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  style={{ borderColor: `${primaryColor}30` }}
                  aria-label="Buscar publicaciones"
                />
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              {publicacionesFiltradas.length} publicación{publicacionesFiltradas.length !== 1 ? 'es' : ''} encontrada{publicacionesFiltradas.length !== 1 ? 's' : ''}
              {categoriaActiva !== 'TODAS' && ` en ${categoriaActiva}`}
              {busqueda && ` para "${busqueda}"`}
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-12">
          
          {publicacionesPagina.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4" aria-hidden="true">📭</div>
              <h3 className="text-xl font-bold mb-2">No se encontraron publicaciones</h3>
              <p className="text-muted-foreground mb-6">Intenta con otros filtros o términos de búsqueda</p>
              <button
                onClick={() => { setBusqueda(''); setCategoriaActiva('TODAS'); }}
                className="px-6 py-3 rounded-lg font-medium text-white"
                style={{ backgroundColor: primaryColor }}
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {publicacionesPagina.map((publicacion) => (
                  <Link key={publicacion.publicaciones_id} href={`/publicaciones/${publicacion.publicaciones_id}`} className="block group">
                    <div className="bg-card rounded-xl border border-border hover:shadow-xl transition-all hover:-translate-y-1 h-full flex flex-col overflow-hidden">
                      <div className="relative h-48 bg-muted">
                        {publicacion.publicaciones_imagen ? (
                          <Image
                            src={getStorageUrl(publicacion.publicaciones_imagen)}
                            alt={publicacion.publicaciones_titulo}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover transition-transform group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-16 h-16 text-muted-foreground" aria-hidden="true" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                        
                        {publicacion.publicaciones_tipo && (
                          <div className="absolute top-3 left-3">
                            <span className="px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: primaryColor }}>
                              {publicacion.publicaciones_tipo}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-5 flex-1 flex flex-col">
                        <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {publicacion.publicaciones_titulo}
                        </h3>

                        <p className="text-muted-foreground text-sm mb-4 line-clamp-3 flex-1"
                          dangerouslySetInnerHTML={{ __html: sanitizeHTML(publicacion.publicaciones_descripcion || '') }}
                        />

                        <div className="space-y-2 pt-4 border-t border-border">
                          {publicacion.publicaciones_autor && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <User className="w-3 h-3" style={{ color: primaryColor }} aria-hidden="true" />
                              <span className="line-clamp-1">{publicacion.publicaciones_autor}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" style={{ color: primaryColor }} aria-hidden="true" />
                            <span>{formatDate(publicacion.publicaciones_fecha)}</span>
                          </div>
                        </div>

                        <button className="w-full mt-4 px-4 py-2 rounded-lg font-semibold text-xs transition-all hover:opacity-90 flex items-center justify-center gap-2"
                          style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}
                          onClick={(e) => e.preventDefault()}
                          aria-label={`Ver detalles de ${publicacion.publicaciones_titulo}`}
                        >
                          Ver Publicación
                          <ArrowLeft className="w-3 h-3 rotate-180" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {totalPaginas > 1 && (
                <div className="flex items-center justify-center gap-2" role="navigation" aria-label="Paginación de publicaciones">
                  <button
                    onClick={() => cambiarPagina(paginaActual - 1)}
                    disabled={paginaActual === 1}
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
                        pagina === paginaActual ? 'text-white' : 'border border-border hover:bg-muted'
                      }`}
                      style={pagina === paginaActual ? { backgroundColor: primaryColor } : {}}
                      aria-current={pagina === paginaActual ? 'page' : undefined}
                      aria-label={`Ir a página ${pagina}`}
                    >
                      {pagina}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => cambiarPagina(paginaActual + 1)}
                    disabled={paginaActual === totalPaginas}
                    className="p-2 rounded-lg border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                    aria-label="Página siguiente"
                  >
                    <ChevronRight className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>
              )}

              <p className="text-center text-sm text-muted-foreground mt-4">
                Página {paginaActual} de {totalPaginas} - Mostrando {publicacionesPagina.length} de {publicacionesFiltradas.length} publicaciones
              </p>
            </>
          )}
        </div>

      </div>
    </ThemeDynamicProvider>
  );
}

export default function PublicacionesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando publicaciones...</p>
        </div>
      </div>
    }>
      <PublicacionesContent />
    </Suspense>
  );
}