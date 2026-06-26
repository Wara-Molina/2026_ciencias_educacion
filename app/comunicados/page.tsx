// app/comunicados/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Calendar, FileText, Bell, Search, ArrowLeft, 
  Clock, ChevronLeft, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

import api from '@/lib/axios';
import { getStorageUrl } from '@/lib/utils';
import ThemeDynamicProvider from '@/components/providers/ThemeDynamicProvider';
import { sanitizeHTML, sanitizeText, sanitizeQueryParam } from '@/lib/security';

interface ColorInstitucion {
  color_primario: string;
  color_secundario: string;
  color_terciario: string;
}

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
  institucion_nombre?: string;
  institucion_iniciales?: string;
  institucion_logo_url?: string;
  institucion_direccion?: string;
  institucion_correo1?: string;
  institucion_celular1?: number;
  colorinstitucion: ColorInstitucion[];
}

type TipoComunicado = 'TODOS' | 'CONVOCATORIAS' | 'AVISOS' | 'COMUNICADOS';

function ComunicadosContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [tipoActivo, setTipoActivo] = useState<TipoComunicado>(
    sanitizeQueryParam(searchParams.get('tipo')) as TipoComunicado || 'TODOS'
  );
  const [busqueda, setBusqueda] = useState('');
  
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 6;
  
  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [institucion, setInstitucion] = useState<InstitucionData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [primaryColor, setPrimaryColor] = useState('#04246C');
  const [secondaryColor, setSecondaryColor] = useState('#FC0102');

  const tipos: Array<{ id: TipoComunicado; label: string; icon: any; color: string }> = [
    { id: 'TODOS', label: 'Todos', icon: FileText, color: '#6b7280' },
    { id: 'CONVOCATORIAS', label: 'Convocatorias', icon: Calendar, color: primaryColor },
    { id: 'AVISOS', label: 'Avisos', icon: Bell, color: '#f59e0b' },
    { id: 'COMUNICADOS', label: 'Comunicados', icon: FileText, color: secondaryColor },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const institucionId = process.env.NEXT_PUBLIC_INSTITUCION_ID || 12;
        
        const [comunicadosRes, instRes] = await Promise.all([
          api.get(`/institucion/${institucionId}/gacetaEventos`),
          api.get(`/institucionesPrincipal/${institucionId}`)
        ]);

        const comunicadosData: Comunicado[] = comunicadosRes.data.convocatorias?.filter((c: any) => c.con_estado === "1") || [];
        setComunicados(comunicadosData);
        setInstitucion(instRes.data.Descripcion);
        
        if (instRes.data.Descripcion.colorinstitucion?.[0]) {
          setPrimaryColor(instRes.data.Descripcion.colorinstitucion[0].color_primario);
          setSecondaryColor(instRes.data.Descripcion.colorinstitucion[0].color_secundario);
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error cargando comunicados:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const currentTipo = searchParams.get('tipo');
    
    if (currentTipo !== tipoActivo && tipoActivo !== 'TODOS') {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tipo', sanitizeQueryParam(tipoActivo));
      router.replace(`/comunicados?${params.toString()}`);
    } else if (tipoActivo === 'TODOS' && currentTipo) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('tipo');
      router.replace(`/comunicados?${params.toString()}`);
    }
    setPaginaActual(1);
  }, [tipoActivo, searchParams, router]);

  const comunicadosFiltrados = comunicados.filter((comunicado) => {
    if (tipoActivo !== 'TODOS') {
      const tipoComunicado = comunicado.tipo_conv_comun?.tipo_conv_comun_titulo?.toUpperCase();
      if (tipoComunicado !== tipoActivo) return false;
    }
    
    if (busqueda) {
      const query = sanitizeText(busqueda.toLowerCase(), 100);
      const coincideTitulo = comunicado.con_titulo.toLowerCase().includes(query);
      const coincideDescripcion = comunicado.con_descripcion?.toLowerCase().includes(query);
      if (!coincideTitulo && !coincideDescripcion) return false;
    }
    
    return true;
  });

  const totalPaginas = Math.ceil(comunicadosFiltrados.length / itemsPorPagina);
  const inicio = (paginaActual - 1) * itemsPorPagina;
  const comunicadosPagina = comunicadosFiltrados.slice(inicio, inicio + itemsPorPagina);

  const cambiarPagina = (pagina: number) => {
    if (pagina < 1 || pagina > totalPaginas) return;
    setPaginaActual(pagina);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getTipoColor = (tipo?: string) => {
    const tipoUpper = tipo?.toUpperCase();
    if (tipoUpper === 'CONVOCATORIAS') return { bg: `${primaryColor}15`, border: `${primaryColor}30`, text: primaryColor };
    if (tipoUpper === 'AVISOS') return { bg: '#f59e0b15', border: '#f59e0b30', text: '#f59e0b' };
    if (tipoUpper === 'COMUNICADOS') return { bg: `${secondaryColor}15`, border: `${secondaryColor}30`, text: secondaryColor };
    return { bg: `${primaryColor}10`, border: `${primaryColor}20`, text: primaryColor };
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Por definir';
    return new Date(dateString).toLocaleDateString('es-BO', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando comunicados...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeDynamicProvider colors={{ primary: primaryColor, secondary: secondaryColor }}>
      <div className="min-h-screen bg-background">
        
<section className="relative py-12 sm:py-20 overflow-hidden">

  {/* Imagen de fondo */}
  <div
    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
    style={{
      backgroundImage: "url('/imagenes/imagen_upea.jpg')"
    }}
  />

  {/* Capa oscura para mejorar la legibilidad */}
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

  {/* Efectos de luz */}
  <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
  <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

  {/* Línea inferior */}
  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

  {/* Contenido */}
  <div className="relative max-w-6xl mx-auto px-4">
    
    <Link
      href="/"
      className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white mb-6 sm:mb-8 transition-colors group"
    >
      <div className="p-2 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors">
        <ArrowLeft className="w-4 h-4" />
      </div>
      <span className="font-medium">Volver al inicio</span>
    </Link>

    <div className="flex items-center gap-4 mb-6">
      <div className="p-4 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20">
        <Bell className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
      </div>

      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white">
        Comunicados Institucionales
      </h1>
    </div>

    <p className="text-base sm:text-lg md:text-xl text-white/90 max-w-3xl leading-relaxed">
      Convocatorias, avisos y comunicados oficiales de{" "}
      <span className="font-semibold text-white">
        {sanitizeText(
          institucion?.institucion_nombre || "nuestra institución",
          100
        )}
      </span>
    </p>

    <div className="mt-6 sm:mt-8 inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      <span className="text-sm text-white/90">
        {comunicados.length} comunicados disponibles
      </span>
    </div>

  </div>
</section>

        <div className="bg-background border-b border-border py-3 sm:py-4 sticky top-16 z-40">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-col gap-4">
              
              {/* Filtros - Scroll horizontal en móvil */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible sm:pb-0 sm:flex-wrap">
                {tipos.map((tipo) => {
                  const isActive = tipoActivo === tipo.id;
                  const count = tipo.id === 'TODOS' 
                    ? comunicados.length 
                    : comunicados.filter(c => c.tipo_conv_comun?.tipo_conv_comun_titulo?.toUpperCase() === tipo.id).length;
                  
                  return (
                    <button
                      key={tipo.id}
                      onClick={() => setTipoActivo(tipo.id)}
                      className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm transition-all min-h-[44px] ${
                        isActive ? 'text-white shadow-md' : 'bg-muted text-foreground hover:bg-muted/80'
                      }`}
                      style={isActive ? { backgroundColor: tipo.color } : {}}
                    >
                      <tipo.icon className="w-4 h-4" />
                      {tipo.label}
                      <span className="px-2 py-0.5 text-xs rounded-full bg-white/20">{count}</span>
                    </button>
                  );
                })}
              </div>

              {/* Búsqueda - Full width en móvil */}
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar comunicados..."
                  value={busqueda}
                  onChange={(e) => { setBusqueda(sanitizeText(e.target.value, 100)); setPaginaActual(1); }}
                  className="w-full pl-12 pr-4 py-3 sm:py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[44px] text-base"
                  style={{ borderColor: `${primaryColor}30` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
          
          <div className="mb-6 flex items-center justify-between">
            <p className="text-muted-foreground text-sm sm:text-base">
              Mostrando {comunicadosPagina.length} de {comunicadosFiltrados.length} resultados
            </p>
            {totalPaginas > 1 && (
              <p className="text-sm text-muted-foreground">Página {paginaActual} de {totalPaginas}</p>
            )}
          </div>

          {comunicadosFiltrados.length === 0 ? (
            <div className="text-center py-16 sm:py-20">
              <div className="text-5xl sm:text-6xl mb-4">📭</div>
              <h3 className="text-lg sm:text-xl font-bold mb-2">No se encontraron comunicados</h3>
              <p className="text-muted-foreground mb-6 text-sm sm:text-base">Intenta con otros filtros o términos de búsqueda</p>
              <button
                onClick={() => { setTipoActivo('TODOS'); setBusqueda(''); setPaginaActual(1); }}
                className="px-6 py-3 rounded-lg font-medium text-white min-h-[44px]"
                style={{ backgroundColor: primaryColor }}
              >
                Ver todos los comunicados
              </button>
            </div>
          ) : (
            <>
              {/* Grid responsive: 1 col móvil, 2 tablet, 3 desktop */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {comunicadosPagina.map((comunicado) => {
                  const colors = getTipoColor(comunicado.tipo_conv_comun?.tipo_conv_comun_titulo);
                  const tipoLabel = comunicado.tipo_conv_comun?.tipo_conv_comun_titulo || 'COMUNICADO';
                  
                  return (
                    <Link
                      key={comunicado.idconvocatorias}
                      href={`/comunicados/${comunicado.idconvocatorias}`}
                      className="block group"
                    >
                      <div 
                        className="p-4 sm:p-6 bg-card rounded-xl border hover:shadow-xl transition-all hover:-translate-y-1 h-full flex flex-col min-h-[280px]"
                        style={{ borderColor: colors.border }}
                      >
                        <div className="mb-4">
                          {comunicado.con_foto_portada ? (
                            <div className="relative h-36 sm:h-40 rounded-lg overflow-hidden">
                              <Image
                                src={getStorageUrl(comunicado.con_foto_portada)}
                                alt={sanitizeText(comunicado.con_titulo, 150)}
                                fill
                                className="object-cover transition-transform group-hover:scale-105"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              />
                              <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity" style={{ backgroundColor: colors.text }} />
                            </div>
                          ) : (
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.bg }}>
                              {tipoLabel === 'CONVOCATORIAS' ? <Calendar className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: colors.text }} /> :
                               tipoLabel === 'AVISOS' ? <Bell className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: colors.text }} /> :
                               <FileText className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: colors.text }} />}
                            </div>
                          )}
                        </div>

                        <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 sm:mb-4" style={{ backgroundColor: colors.bg, color: colors.text }}>
                          {tipoLabel.charAt(0) + tipoLabel.slice(1).toLowerCase()}
                        </div>

                        <h3 className="text-base sm:text-lg font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {sanitizeText(comunicado.con_titulo, 150)}
                        </h3>
                        
                        <p className="text-muted-foreground text-xs sm:text-sm mb-4 line-clamp-2 flex-1" 
                          dangerouslySetInnerHTML={{ __html: sanitizeHTML(comunicado.con_descripcion || '') }} 
                        />

                        <div className="space-y-2 pt-4 border-t border-border">
                          {(comunicado.con_fecha_inicio || comunicado.con_fecha_fin) && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" style={{ color: colors.text }} />
                              <span>
                                {comunicado.con_fecha_inicio && formatDate(comunicado.con_fecha_inicio)}
                                {comunicado.con_fecha_fin && comunicado.con_fecha_inicio && ' - '}
                                {comunicado.con_fecha_fin && formatDate(comunicado.con_fecha_fin)}
                              </span>
                            </div>
                          )}
                        </div>

                        <button 
                          className="w-full mt-4 px-4 py-2.5 rounded-lg font-semibold text-xs transition-all hover:opacity-90 flex items-center justify-center gap-2 min-h-[40px]"
                          style={{ backgroundColor: colors.bg, color: colors.text }}
                          onClick={(e) => e.preventDefault()}
                        >
                          Ver Detalle
                          <ArrowLeft className="w-3 h-3 rotate-180" />
                        </button>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Paginación responsive */}
              {totalPaginas > 1 && (
                <div className="flex items-center justify-center gap-1 sm:gap-2 mt-8 sm:mt-12 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible sm:pb-0">
                  <button
                    onClick={() => cambiarPagina(paginaActual - 1)}
                    disabled={paginaActual === 1}
                    className="flex-shrink-0 p-2 sm:p-3 rounded-lg border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => (
                    <button
                      key={pagina}
                      onClick={() => cambiarPagina(pagina)}
                      className={`flex-shrink-0 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium text-sm transition-all min-w-[40px] min-h-[44px] flex items-center justify-center ${
                        pagina === paginaActual 
                          ? 'text-white' 
                          : 'border border-border hover:bg-muted'
                      }`}
                      style={pagina === paginaActual ? { backgroundColor: primaryColor } : {}}
                    >
                      {pagina}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => cambiarPagina(paginaActual + 1)}
                    disabled={paginaActual === totalPaginas}
                    className="flex-shrink-0 p-2 sm:p-3 rounded-lg border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="Página siguiente"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </ThemeDynamicProvider>
  );
}

export default function ComunicadosPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando comunicados...</p>
        </div>
      </div>
    }>
      <ComunicadosContent />
    </Suspense>
  );
}