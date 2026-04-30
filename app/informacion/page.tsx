// app/informacion/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Target, Eye, Award, Users, BookOpen, TrendingUp,
  User, Mail, Phone, Facebook, Linkedin, Calendar, MapPin, Clock, Navigation,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

import api from '@/lib/axios';
import { getStorageUrl } from '@/lib/utils';
import ThemeDynamicProvider from '@/components/providers/ThemeDynamicProvider';

// ==================== TIPOS ====================
interface ColorInstitucion {
  color_primario: string;
  color_secundario: string;
  color_terciario: string;
}

interface InstitucionData {
  institucion_id: number;
  institucion_nombre: string;
  institucion_iniciales: string;
  institucion_mision?: string;
  institucion_vision?: string;
  institucion_historia?: string;
  institucion_objetivos?: string;
  institucion_direccion?: string;
  institucion_correo1?: string;
  institucion_celular1?: number;
  institucion_celular2?: number;
  institucion_api_google_map?: string;
  colorinstitucion: ColorInstitucion[];
}

interface Autoridad {
  id_autoridad: number;
  foto_autoridad?: string;
  nombre_autoridad: string;
  cargo_autoridad: string;
  facebook_autoridad?: string;
  celular_autoridad?: string;
  twiter_autoridad?: string;
}

interface UbicacionData {
  ubicacion_imagen?: string;
  ubicacion_titulo?: string;
  ubicacion_descripcion?: string;
  ubicacion_latitud?: string;
  ubicacion_longitud?: string;
}

type SeccionInfo = 'mision-vision' | 'autoridades' | 'historia' | 'ubicacion';

// ==================== COMPONENTE PRINCIPAL ====================
function InformacionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Sección activa (por defecto: mision-vision)
  const [seccionActiva, setSeccionActiva] = useState<SeccionInfo>(
    (searchParams.get('section') as SeccionInfo) || 'mision-vision'
  );
  
  // Estados de datos
  const [institucion, setInstitucion] = useState<InstitucionData | null>(null);
  const [autoridades, setAutoridades] = useState<Autoridad[]>([]);
  const [ubicacion, setUbicacion] = useState<UbicacionData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Colores dinámicos
  const [primaryColor, setPrimaryColor] = useState('#04246C');
  const [secondaryColor, setSecondaryColor] = useState('#FC0102');

  // Opciones del menú
  const secciones: Array<{ id: SeccionInfo; label: string; icon: any }> = [
    { id: 'mision-vision', label: 'Misión y Visión', icon: Target },
    { id: 'autoridades', label: 'Autoridades', icon: Users },
    { id: 'historia', label: 'Historia', icon: BookOpen },
    { id: 'ubicacion', label: 'Ubicación', icon: MapPin },
  ];

  // ==================== FETCH DATOS ====================
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const institucionId = process.env.NEXT_PUBLIC_INSTITUCION_ID || 12;
        
        const [instRes, contenidoRes] = await Promise.all([
          api.get(`/institucionesPrincipal/${institucionId}`),
          api.get(`/institucion/${institucionId}/contenido`)
        ]);

        const instData = instRes.data.Descripcion;
        setInstitucion(instData);
        setAutoridades(contenidoRes.data.autoridad || []);
        setUbicacion(contenidoRes.data.ubicacion?.[0] || null);
        
        if (instData.colorinstitucion?.[0]) {
          setPrimaryColor(instData.colorinstitucion[0].color_primario);
          setSecondaryColor(instData.colorinstitucion[0].color_secundario);
        }
      } catch (error) {
        console.error('❌ Error cargando información:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

useEffect(() => {
  const currentSection = searchParams.get('section');
  
  if (currentSection !== seccionActiva) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('section', seccionActiva);
    router.replace(`/informacion?${params.toString()}`);
  }
}, [seccionActiva]);

  // ==================== RENDER LOADING ====================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando información...</p>
        </div>
      </div>
    );
  }

  // ==================== RENDER SECCIONES ====================
  const renderSeccion = () => {
    switch (seccionActiva) {
      case 'mision-vision':
        return <SeccionMisionVision institucion={institucion} primaryColor={primaryColor} secondaryColor={secondaryColor} />;
      case 'autoridades':
        return <SeccionAutoridades autoridades={autoridades} primaryColor={primaryColor} />;
      case 'historia':
        return <SeccionHistoria institucion={institucion} primaryColor={primaryColor} secondaryColor={secondaryColor} />;
      case 'ubicacion':
        return <SeccionUbicacion institucion={institucion} ubicacion={ubicacion} primaryColor={primaryColor} secondaryColor={secondaryColor} />;
      default:
        return <SeccionMisionVision institucion={institucion} primaryColor={primaryColor} secondaryColor={secondaryColor} />;
    }
  };

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
        <Target className="w-10 h-10 text-white" />
      </div>
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white">
        Información Institucional
      </h1>
    </div>
    
    <p className="text-lg md:text-xl text-white/90 max-w-3xl leading-relaxed">
      Conoce nuestra misión, visión, historia, autoridades y ubicación de{' '}
      <span className="font-semibold text-white">
        {institucion?.institucion_nombre || 'nuestra institución'}
      </span>
    </p>
  </div>
</section>
      {/*  Navegación de Pestañas - Debajo del header */}
      <div className="bg-background border-b border-border sticky top-20 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <nav className="flex flex-wrap gap-2 py-4">
            {secciones.map((seccion) => {
              const isActive = seccionActiva === seccion.id;
              return (
                <button
                  key={seccion.id}
                  onClick={() => setSeccionActiva(seccion.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-full font-medium text-sm transition-all ${
                    isActive 
                      ? 'text-white shadow-lg' 
                      : 'bg-muted text-foreground hover:bg-muted/80'
                  }`}
                  style={isActive ? { backgroundColor: primaryColor } : {}}
                >
                  <seccion.icon className="w-4 h-4" />
                  {seccion.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Contenido de la sección activa */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {renderSeccion()}
      </div>

      </div>
    </ThemeDynamicProvider>
  );
}

// ==================== SECCIÓN: MISIÓN Y VISIÓN ====================
function SeccionMisionVision({ institucion, primaryColor, secondaryColor }: {
  institucion: InstitucionData | null;
  primaryColor: string;
  secondaryColor: string;
}) {
  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 gap-8">
        
        {/* Misión */}
        <div className="bg-card rounded-2xl p-8 border shadow-lg hover:shadow-xl transition-shadow">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <Target className="w-8 h-8" style={{ color: primaryColor }} />
          </div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: primaryColor }}>Misión</h2>
          <div 
            className="text-muted-foreground leading-relaxed"
            dangerouslySetInnerHTML={{ __html: institucion?.institucion_mision || '<p>Formar profesionales competentes con enfoque holístico en las áreas clínicas, comunitarias, administrativas, docencia e investigación.</p>' }}
          />
        </div>

        {/* Visión */}
        <div className="bg-card rounded-2xl p-8 border shadow-lg hover:shadow-xl transition-shadow">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
            style={{ backgroundColor: `${secondaryColor}15` }}
          >
            <Eye className="w-8 h-8" style={{ color: secondaryColor }} />
          </div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: secondaryColor }}>Visión</h2>
          <div 
            className="text-muted-foreground leading-relaxed"
            dangerouslySetInnerHTML={{ __html: institucion?.institucion_vision || '<p>Ser referentes en educación superior con profesionales que respondan a las exigencias de la sociedad, manteniendo la más alta calidad educativa.</p>' }}
          />
        </div>
      </div>

      {/* Objetivos */}
      {institucion?.institucion_objetivos && (
        <div className="bg-card rounded-2xl p-8 border shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <Award className="w-6 h-6" style={{ color: primaryColor }} />
            </div>
            <h2 className="text-2xl font-bold" style={{ color: primaryColor }}>
              Objetivos Institucionales
            </h2>
          </div>
          <div 
            className="text-muted-foreground leading-relaxed space-y-4"
            dangerouslySetInnerHTML={{ __html: institucion.institucion_objetivos }}
          />
        </div>
      )}

      {/* Valores */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
        {[
          { icon: Users, title: 'Compromiso', desc: 'Dedicación total a la excelencia educativa' },
          { icon: BookOpen, title: 'Calidad', desc: 'Estándares académicos de excelencia' },
          { icon: Target, title: 'Innovación', desc: 'Metodologías educativas modernas' },
          { icon: TrendingUp, title: 'Crecimiento', desc: 'Desarrollo continuo y mejora' },
        ].map((item, idx) => (
          <div key={idx} className="text-center p-6 rounded-xl bg-muted/50 border">
            <item.icon className="w-10 h-10 mx-auto mb-3" style={{ color: primaryColor }} />
            <h3 className="font-bold mb-2">{item.title}</h3>
            <p className="text-sm text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== SECCIÓN: AUTORIDADES ====================
function SeccionAutoridades({ autoridades, primaryColor }: {
  autoridades: Autoridad[];
  primaryColor: string;
}) {
  return (
    <div>
      {autoridades.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {autoridades.map((autoridad) => (
            <div 
              key={autoridad.id_autoridad}
              className="bg-card rounded-2xl overflow-hidden border shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1"
            >
              {/* Foto */}
              <div className="relative h-64 bg-muted">
                {autoridad.foto_autoridad ? (
                  <Image
                    src={getStorageUrl(autoridad.foto_autoridad)}
                    alt={autoridad.nombre_autoridad}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-20 h-20 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
              </div>

              {/* Info */}
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{autoridad.nombre_autoridad}</h3>
                <p 
                  className="text-sm font-medium mb-4"
                  style={{ color: primaryColor }}
                >
                  {autoridad.cargo_autoridad}
                </p>

                {/* Contacto */}
                <div className="space-y-2 pt-4 border-t">
                  {autoridad.celular_autoridad && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{autoridad.celular_autoridad}</span>
                    </div>
                  )}
                  {(autoridad.facebook_autoridad || autoridad.twiter_autoridad) && (
                    <div className="flex gap-2 pt-2">
                      {autoridad.facebook_autoridad && (
                        <a 
                          href={autoridad.facebook_autoridad}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-full bg-muted hover:bg-primary/10 transition-colors"
                          style={{ color: primaryColor }}
                        >
                          <Facebook className="w-4 h-4" />
                        </a>
                      )}
                      {autoridad.twiter_autoridad && (
                        <a 
                          href={autoridad.twiter_autoridad}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-full bg-muted hover:bg-primary/10 transition-colors"
                          style={{ color: primaryColor }}
                        >
                          <Linkedin className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-bold mb-2">No hay autoridades registradas</h3>
          <p className="text-muted-foreground">
            La información de autoridades estará disponible próximamente
          </p>
        </div>
      )}
    </div>
  );
}

// ==================== SECCIÓN: HISTORIA ====================
function SeccionHistoria({ institucion, primaryColor, secondaryColor }: {
  institucion: InstitucionData | null;
  primaryColor: string;
  secondaryColor: string;
}) {
  // Hitos históricos de ejemplo
  const hitos = [
    { year: '1990', title: 'Fundación', desc: 'Creación de la institución', icon: Calendar },
    { year: '2000', title: 'Acreditación', desc: 'Primera acreditación nacional', icon: Award },
    { year: '2010', title: 'Expansión', desc: 'Ampliación de infraestructura', icon: TrendingUp },
    { year: '2020', title: 'Innovación', desc: 'Implementación de tecnologías educativas', icon: BookOpen },
  ];

  return (
    <div className="space-y-12">
      
      {/* Historia principal */}
      <div className="bg-card rounded-2xl p-8 border shadow-lg">
        <h2 className="text-2xl font-bold mb-4" style={{ color: primaryColor }}>
          {institucion?.institucion_nombre} - {institucion?.institucion_iniciales}
        </h2>
        {institucion?.institucion_historia ? (
          <div 
            className="text-muted-foreground leading-relaxed space-y-4"
            dangerouslySetInnerHTML={{ __html: institucion.institucion_historia }}
          />
        ) : (
          <>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Somos una institución comprometida con la excelencia académica y la formación integral 
              de nuestros estudiantes. A lo largo de los años, hemos trabajado incansablemente para 
              ofrecer una educación de calidad que responda a las necesidades de la sociedad.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Nuestra trayectoria se caracteriza por la innovación pedagógica, el compromiso social 
              y la búsqueda constante de la mejora continua en todos nuestros procesos académicos 
              y administrativos.
            </p>
          </>
        )}
      </div>

{/* Objetivos Estratégicos - Datos reales de la API */}
{institucion?.institucion_objetivos ? (
  <div className="bg-card rounded-2xl p-8 border shadow-lg">
    <div className="flex items-center gap-3 mb-6">
      <div 
        className="w-12 h-12 rounded-full flex items-center justify-center"
        style={{ backgroundColor: `${primaryColor}15` }}
      >
        <Target className="w-6 h-6" style={{ color: primaryColor }} />
      </div>
      <h2 className="text-2xl font-bold" style={{ color: primaryColor }}>
        Objetivos Estratégicos
      </h2>
    </div>
    <div 
      className="text-muted-foreground leading-relaxed space-y-4 prose prose-sm max-w-none"
      dangerouslySetInnerHTML={{ __html: institucion.institucion_objetivos }}
    />
  </div>
) : (
  /* ✅ Valores Institucionales - Fallback elegante */
  <div>
    <h2 className="text-3xl font-bold text-center mb-12" style={{ color: primaryColor }}>
      Valores Institucionales
    </h2>
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[
        { 
          icon: Users, 
          title: 'Compromiso Social', 
          desc: 'Servicio a la comunidad con responsabilidad y ética profesional',
          color: primaryColor 
        },
        { 
          icon: BookOpen, 
          title: 'Excelencia Académica', 
          desc: 'Formación de calidad con estándares internacionales',
          color: secondaryColor 
        },
        { 
          icon: TrendingUp, 
          title: 'Innovación', 
          desc: 'Adaptación constante a las nuevas tecnologías y metodologías',
          color: '#f59e0b' 
        },
        { 
          icon: Award, 
          title: 'Integridad', 
          desc: 'Transparencia, honestidad y respeto en todas nuestras acciones',
          color: primaryColor 
        },
      ].map((valor, idx) => (
        <div 
          key={idx} 
          className="bg-card p-6 rounded-xl border shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 text-center group"
        >
          <div 
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 transition-transform group-hover:scale-110"
            style={{ backgroundColor: `${valor.color}15` }}
          >
            <valor.icon className="w-7 h-7" style={{ color: valor.color }} />
          </div>
          <h3 className="font-bold mb-2 text-foreground">{valor.title}</h3>
          <p className="text-sm text-muted-foreground">{valor.desc}</p>
        </div>
      ))}
    </div>
  </div>
)}

    </div>
  );
}

// ==================== SECCIÓN: UBICACIÓN ====================
function SeccionUbicacion({ institucion, ubicacion, primaryColor, secondaryColor }: {
  institucion: InstitucionData | null;
  ubicacion: UbicacionData | null;
  primaryColor: string;
  secondaryColor: string;
}) {
  return (
    <div className="grid lg:grid-cols-2 gap-8">
      
      {/* Info de contacto */}
      <div className="space-y-6">
        <div className="bg-card rounded-2xl p-8 border shadow-lg">
          <h2 className="text-2xl font-bold mb-6" style={{ color: primaryColor }}>
            Información de Contacto
          </h2>
          
          <div className="space-y-4">
            {/* Dirección */}
            <div className="flex items-start gap-4">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <MapPin className="w-6 h-6" style={{ color: primaryColor }} />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Dirección</h3>
                <p className="text-muted-foreground">
                  {institucion?.institucion_direccion || 'Av. Sucre Z. Villa Esperanza, Campus UPEA Bloque B Piso 3'}
                </p>
              </div>
            </div>

            {/* Teléfono */}
            <div className="flex items-start gap-4">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${secondaryColor}15` }}
              >
                <Phone className="w-6 h-6" style={{ color: secondaryColor }} />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Teléfonos</h3>
                <p className="text-muted-foreground">
                  {institucion?.institucion_celular1 && `${institucion.institucion_celular1}`}
                  {institucion?.institucion_celular2 && ` / ${institucion.institucion_celular2}`}
                </p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-4">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <Mail className="w-6 h-6" style={{ color: primaryColor }} />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Correo Electrónico</h3>
                <p className="text-muted-foreground">
                  {institucion?.institucion_correo1 || 'info@institucion.edu.bo'}
                </p>
              </div>
            </div>

            {/* Horario */}
            <div className="flex items-start gap-4">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${secondaryColor}15` }}
              >
                <Clock className="w-6 h-6" style={{ color: secondaryColor }} />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Horario de Atención</h3>
                <p className="text-muted-foreground">
                  Lunes a Viernes: 8:00 - 12:00 y 14:00 - 18:00
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Descripción adicional */}
        {ubicacion?.ubicacion_descripcion && (
          <div className="bg-card rounded-2xl p-8 border shadow-lg">
            <h3 className="text-xl font-bold mb-4" style={{ color: primaryColor }}>
              {ubicacion.ubicacion_titulo || 'Información Adicional'}
            </h3>
            <p 
              className="text-muted-foreground leading-relaxed"
              dangerouslySetInnerHTML={{ __html: ubicacion.ubicacion_descripcion }}
            />
          </div>
        )}
      </div>

      {/* Mapa */}
      <div className="bg-card rounded-2xl overflow-hidden border shadow-lg">
        {institucion?.institucion_api_google_map ? (
          <iframe
            src={institucion.institucion_api_google_map}
            width="100%"
            height="500"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full"
          />
        ) : (
          <div className="w-full h-96 bg-muted flex items-center justify-center">
            <div className="text-center">
              <Navigation className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Mapa no disponible</p>
            </div>
          </div>
        )}
      </div>

      {/* Botón de directions - Full width en móvil */}
      <div className="lg:col-span-2 text-center pt-4">
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${ubicacion?.ubicacion_latitud || '-16.489549430458553'},${ubicacion?.ubicacion_longitud || '-68.19329917301572'}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-white transition-all hover:shadow-lg hover:-translate-y-0.5"
          style={{ backgroundColor: primaryColor }}
        >
          <Navigation className="w-5 h-5" />
          Cómo llegar con Google Maps
        </a>
      </div>
    </div>
  );
}

// ==================== WRAPPER CON SUSPENSE ====================
export default function InformacionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando información...</p>
        </div>
      </div>
    }>
      <InformacionContent />
    </Suspense>
  );
}