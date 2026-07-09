// app/cursos/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Clock, Users, BookOpen, Search, Calendar as CalendarIcon,
  ChevronLeft, ChevronRight, ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import CalendarWidget from '@/app/CalendarWidget';

import api from '@/lib/axios';
import { getStorageUrl } from '@/lib/utils';
import ThemeDynamicProvider from '@/components/providers/ThemeDynamicProvider';

import { sanitizeHTML, sanitizeText, sanitizeQueryParam } from '@/lib/security';

// ==================== TIPOS ====================
interface ColorInstitucion {
  color_primario: string;
  color_secundario: string;
  color_terciario: string;
}

interface Curso {
  iddetalle_cursos_academicos: number;
  det_img_portada?: string;
  det_titulo: string;
  det_descripcion?: string;
  det_costo: number;
  det_cupo_max: number;
  det_carga_horaria?: number;
  det_modalidad: string;
  det_fecha_ini?: string;
  det_fecha_fin?: string;
  det_estado: string;
  tipo_curso_otro?: {
    tipo_conv_curso_nombre: string;
  };
}

interface Evento {
  evento_id: number;
  evento_titulo: string;
  evento_fecha: string;
  evento_hora?: string;
  evento_lugar?: string;
  evento_estado?: string;
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

// ==================== COMPONENTE PRINCIPAL ====================
function CursosContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  
  const paginaActual = Number(searchParams.get('pagina')) || 1;
  const itemsPorPagina = 4;
  

  const [tipoActivo, setTipoActivo] = useState<string>(
    sanitizeQueryParam(searchParams.get('tipo')) || 'TODOS'
  );
  const [busqueda, setBusqueda] = useState('');
  
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [institucion, setInstitucion] = useState<InstitucionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tiposConCursos, setTiposConCursos] = useState<string[]>([]);
  const colores = institucion?.colorinstitucion?.[0];
  const primaryColor = colores?.color_primario || '#04246C';
  const secondaryColor = colores?.color_secundario || '#FC0102';
  const tertiaryColor = colores?.color_terciario || '#020733';

  const getHeroBackground = () => {
  const institucionId = Number(process.env.NEXT_PUBLIC_INSTITUCION_ID) || 12;
  if (institucionId === 12) {
    return `
      linear-gradient(135deg,
        ${primaryColor} 0%,
        ${primaryColor}cc 35%,
        ${secondaryColor}88 100%
      )
    `;
  }

  if (institucionId === 20) {
    return `
      linear-gradient(170deg,
        ${primaryColor} 0%,
        ${primaryColor}cc 40%,
        ${primaryColor}99 60%,
        ${secondaryColor}88 78%,
        ${secondaryColor}66 90%,
        ${secondaryColor}44 100%
      )
    `;
  }

  return `
    linear-gradient(150deg,
      ${primaryColor} 0%,
      ${primaryColor}cc 50%,
      ${secondaryColor}88 100%
    )
  `;
};
  // ==================== FETCH DATOS ====================
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const institucionId = process.env.NEXT_PUBLIC_INSTITUCION_ID || 12;

        const gacetaEventosRes = await api.get(`/institucion/${institucionId}/gacetaEventos`);
        const cursosData: Curso[] = gacetaEventosRes.data.cursos?.filter((c: any) => c.det_estado === "1") || [];
        const eventosData: Evento[] = gacetaEventosRes.data.upea_evento?.filter((e: any) => e.evento_estado === "1") || [];
        
        setCursos(cursosData);
        setEventos(eventosData);

        //  Detectar qué tipos de cursos existen realmente en la API
        const tiposUnicos = new Set<string>();
        cursosData.forEach((curso) => {
          const tipo = curso.tipo_curso_otro?.tipo_conv_curso_nombre?.toUpperCase();
          if (tipo) tiposUnicos.add(tipo);
        });
        setTiposConCursos(Array.from(tiposUnicos));
        const instRes = await api.get(`/institucionesPrincipal/${institucionId}`);
        setInstitucion(instRes.data.Descripcion);

      } catch (err: any) {
        console.error(' Error cargando cursos:', err);
  
        setError(process.env.NODE_ENV === 'production' 
          ? 'No se pudieron cargar los cursos.' 
          : 'No se pudieron cargar los cursos. Intenta más tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ==================== FILTROS ====================
  useEffect(() => {
    const currentTipo = searchParams.get('tipo') || 'TODOS';
    
    if (currentTipo !== tipoActivo) {
      const params = new URLSearchParams(searchParams);
      if (tipoActivo !== 'TODOS') {
        params.set('tipo', sanitizeQueryParam(tipoActivo)); 
      } else {
        params.delete('tipo');
      }
      router.replace(`/cursos?${params.toString()}`, { scroll: false });
    }
  }, [tipoActivo, router, searchParams]);

  const cursosFiltrados = cursos.filter((curso) => {
    if (tipoActivo !== 'TODOS') {
      const cursoTipo = curso.tipo_curso_otro?.tipo_conv_curso_nombre?.toUpperCase();
      if (cursoTipo !== tipoActivo) return false;
    }
    
    if (busqueda) {

      const query = sanitizeText(busqueda.toLowerCase());
      const coincideTitulo = curso.det_titulo.toLowerCase().includes(query);
      const coincideDescripcion = curso.det_descripcion?.toLowerCase().includes(query);
      if (!coincideTitulo && !coincideDescripcion) return false;
    }
    
    return true;
  });


  const totalPaginas = Math.ceil(cursosFiltrados.length / itemsPorPagina);
  const inicio = (paginaActual - 1) * itemsPorPagina;
  const fin = inicio + itemsPorPagina;
  const cursosPagina = cursosFiltrados.slice(inicio, fin);


  const cambiarPagina = (nuevaPagina: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('pagina', nuevaPagina.toString());
    router.push(`/cursos?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  useEffect(() => {
    if (paginaActual > 1) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('pagina', '1');
      router.replace(`/cursos?${params.toString()}`, { scroll: false });
    }
  }, [busqueda, tipoActivo]);

  // ==================== HELPERS ====================
  const getColorClasses = (tipo: string) => {
    const tipoUpper = tipo.toUpperCase();
    if (tipoUpper === 'CURSOS' || tipoUpper === 'PRESENCIAL') {
      return { bg: `${primaryColor}15`, border: `${primaryColor}30`, text: primaryColor };
    }
    if (tipoUpper === 'SEMINARIOS') {
      return { bg: `${secondaryColor}15`, border: `${secondaryColor}30`, text: secondaryColor };
    }
    if (tipoUpper === 'TALLERES') {
      return { bg: `${tertiaryColor}15`, border: `${tertiaryColor}30`, text: tertiaryColor };
    }
    return { bg: `${primaryColor}10`, border: `${primaryColor}20`, text: primaryColor };
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="bg-gradient-to-b from-primary/10 to-background py-12">
          <div className="max-w-6xl mx-auto px-4">
            <div className="h-10 w-64 bg-muted rounded animate-pulse mb-4" />
            <div className="h-5 w-96 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 py-20">
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-6 bg-card rounded-xl border animate-pulse">
                <div className="w-12 h-12 bg-muted rounded-lg mb-4" />
                <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Error al cargar cursos</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-lg font-medium text-white"
            style={{ backgroundColor: primaryColor }}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <ThemeDynamicProvider colors={{ primary: primaryColor, secondary: secondaryColor, tertiary: tertiaryColor }}>
      <div className="flex flex-col min-h-screen bg-background text-foreground">

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
        Oferta Académica
      </h1>
    </div>

    <p className="text-lg md:text-xl text-white/90 max-w-3xl leading-relaxed">
      Explora nuestros cursos, seminarios y talleres de{" "}
      <span className="font-semibold text-white">
        {institucion?.institucion_nombre || "nuestra institución"}
      </span>
    </p>

    <div className="mt-8 inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      <span className="text-sm text-white/90">
        {cursos.length} cursos disponibles
      </span>
    </div>
  </div>

</section>

        <section className="bg-background border-b border-border py-6 sticky top-16 z-40 shadow-sm">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setTipoActivo('TODOS')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    tipoActivo === 'TODOS' ? 'text-white shadow-md' : 'bg-muted text-foreground hover:bg-muted/80'
                  }`}
                  style={tipoActivo === 'TODOS' ? { backgroundColor: primaryColor } : {}}
                >
                  Todos
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-white/20">
                    {cursos.length}
                  </span>
                </button>

                {tiposConCursos.map((tipo) => {
                  const isActive = tipoActivo === tipo;
                  const colors = getColorClasses(tipo);
                  const count = cursos.filter(c => c.tipo_curso_otro?.tipo_conv_curso_nombre?.toUpperCase() === tipo).length;
                  
                  const label = tipo === 'CURSOS' ? 'Cursos' : 
                                tipo === 'SEMINARIOS' ? 'Seminarios' : 
                                tipo.charAt(0) + tipo.slice(1).toLowerCase();

                  return (
                    <button
                      key={tipo}
                      onClick={() => setTipoActivo(tipo)}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                        isActive ? 'text-white shadow-md' : 'bg-muted text-foreground hover:bg-muted/80'
                      }`}
                      style={isActive ? { backgroundColor: colors.text } : {}}
                    >
                      {label}
                      <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-white/20">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Búsqueda */}
              <div className="relative w-full lg:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar cursos..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(sanitizeText(e.target.value, 100))} 
                  className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  style={{ borderColor: `${primaryColor}30` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Contenido: Grid + Calendario */}
        <section className="py-20 bg-background">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid lg:grid-cols-3 gap-8">
              
              {/* Columna Izquierda: Grid de Cursos */}
              <div className="lg:col-span-2">
                <div className="mb-6 flex items-center justify-between">
                  <p className="text-muted-foreground">
                    Mostrando {cursosPagina.length} de {cursosFiltrados.length} resultados
                  </p>
                </div>

                {cursosPagina.length === 0 ? (
                  <div className="text-center py-20 bg-card rounded-xl border">
                    <div className="text-6xl mb-4">📭</div>
                    <h3 className="text-xl font-bold mb-2">No se encontraron cursos</h3>
                    <p className="text-muted-foreground mb-6">Intenta con otros filtros o términos de búsqueda</p>
                    <button
                      onClick={() => { setTipoActivo('TODOS'); setBusqueda(''); }}
                      className="px-6 py-3 rounded-lg font-medium text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Ver todos los cursos
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Grid de Cursos */}
                    <div className="grid md:grid-cols-2 gap-6">
                      {cursosPagina.map((curso) => {
                        const tipoSeguro = curso.tipo_curso_otro?.tipo_conv_curso_nombre || 'CURSOS';
                        const colors = getColorClasses(tipoSeguro);
                        const tipoCurso = curso.tipo_curso_otro?.tipo_conv_curso_nombre || 'CURSO';
                        
                        return (
                          <Link
                            key={curso.iddetalle_cursos_academicos}
                            href={`/cursos/${curso.iddetalle_cursos_academicos}`}
                            className="block group"
                          >
                            <div 
                              className="p-6 bg-card rounded-xl border hover:shadow-xl transition-all hover:-translate-y-1 h-full flex flex-col"
                              style={{ borderColor: colors.border }}
                            >
                              {/* Imagen o Icono */}
                              <div className="mb-4">
                                {curso.det_img_portada ? (
                                  <div className="relative h-40 rounded-lg overflow-hidden">
                                    <Image
                                      src={getStorageUrl(curso.det_img_portada)}
                                      alt={curso.det_titulo}
                                      fill
                                      className="object-cover transition-transform group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity" style={{ backgroundColor: colors.text }} />
                                  </div>
                                ) : (
                                  <div className="w-14 h-14 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.bg }}>
                                    <BookOpen className="w-7 h-7" style={{ color: colors.text }} />
                                  </div>
                                )}
                              </div>

                              <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4" style={{ backgroundColor: colors.bg, color: colors.text }}>
                                {tipoCurso.charAt(0) + tipoCurso.slice(1).toLowerCase()}
                              </div>

  
                              <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                                {sanitizeText(curso.det_titulo, 100)} 
                              </h3>

                              <p className="text-muted-foreground text-sm mb-4 line-clamp-2 flex-1" 
                                dangerouslySetInnerHTML={{ 
                                  __html: sanitizeHTML(curso.det_descripcion || '') 
                                }} 
                              />

                              <div className="space-y-2 pt-4 border-t border-border">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3" style={{ color: colors.text }} />
                                  <span>{curso.det_carga_horaria || 'Por definir'} horas</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Users className="w-3 h-3" style={{ color: colors.text }} />
                                  <span>{curso.det_cupo_max} cupos</span>
                                </div>
                                {curso.det_costo > 0 && (
                                  <div className="text-xs font-bold" style={{ color: colors.text }}>
                                    Bs. {curso.det_costo}
                                  </div>
                                )}
                              </div>

                              <button 
                                className="w-full mt-4 px-4 py-2 rounded-lg font-semibold text-xs transition-all hover:opacity-90"
                                style={{ backgroundColor: colors.bg, color: colors.text }}
                                onClick={(e) => e.preventDefault()}
                              >
                                Ver Detalles
                              </button>
                            </div>
                          </Link>
                        );
                      })}
                    </div>

                    {/* Paginación */}
                    {totalPaginas > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-8">
                        <button
                          onClick={() => cambiarPagina(paginaActual - 1)}
                          disabled={paginaActual === 1}
                          className="p-2 rounded-lg border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                          aria-label="Página anterior"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
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
                      Página {paginaActual} de {totalPaginas}
                    </p>
                  </>
                )}
              </div>

              <div className="lg:col-span-1">
                <div className="sticky top-32 space-y-8">
                  
                  {/* Calendario */}
                  <div className="bg-card rounded-2xl shadow-lg border overflow-hidden">
                    <div className="p-4 border-b bg-muted/30">
                      <h2 className="font-bold text-lg flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5" style={{ color: primaryColor }} />
                        Calendario
                      </h2>
                    </div>
                    <div className="p-4">
                      <CalendarWidget colores={colores} eventos={eventos} />
                    </div>
                  </div>
                  {eventos.length > 0 && (
                    <div>
                      <h3 className="font-bold mb-4 text-lg px-2">Próximos Eventos</h3>
                      <div className="space-y-3">
                        {eventos.slice(0, 3).map((evento) => (
                          <div key={evento.evento_id} className="p-4 rounded-lg border hover:shadow-md transition-shadow bg-card group cursor-pointer">
                            <h4 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                              {sanitizeText(evento.evento_titulo, 80)} 
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <CalendarIcon className="w-3 h-3" />
                              <span>{new Date(evento.evento_fecha).toLocaleDateString('es-BO')}</span>
                            </div>
                            {evento.evento_lugar && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <Users className="w-3 h-3" />
                                <span className="line-clamp-1">{sanitizeText(evento.evento_lugar, 50)}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>

            </div>
          </div>
        </section>

      </div>
    </ThemeDynamicProvider>
  );
}

export default function CursosPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando cursos...</p>
        </div>
      </div>
    }>
      <CursosContent />
    </Suspense>
  );
}