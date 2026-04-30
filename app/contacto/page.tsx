// app/contacto/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { 
  MapPin, Phone, Mail, Clock, Send, Loader2, ArrowLeft,
  Facebook, Twitter, Instagram, Linkedin, Youtube, CheckCircle
} from 'lucide-react';
import Link from 'next/link';

import api from '@/lib/axios';
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
  institucion_direccion?: string;
  institucion_correo1?: string;
  institucion_correo2?: string;
  institucion_celular1?: number;
  institucion_celular2?: number;
  institucion_telefono1?: number;
  institucion_telefono2?: number;
  institucion_facebook?: string;
  institucion_twitter?: string;
  institucion_youtube?: string;
  institucion_api_google_map?: string;
  institucion_horario_atencion?: string;
  colorinstitucion: ColorInstitucion[];
}

interface FormData {
  nombre: string;
  email: string;
  asunto: string;
  mensaje: string;
}

interface FormErrors {
  nombre?: string;
  email?: string;
  asunto?: string;
  mensaje?: string;
}

// ==================== COMPONENTE PRINCIPAL ====================
function ContactoContent() {
  const institucionId = Number(process.env.NEXT_PUBLIC_INSTITUCION_ID) || 12;
  
  const [institucion, setInstitucion] = useState<InstitucionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados del formulario
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    email: '',
    asunto: '',
    mensaje: ''
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // Colores dinámicos
  const [primaryColor, setPrimaryColor] = useState('#04246C');
  const [secondaryColor, setSecondaryColor] = useState('#FC0102');
  const [tertiaryColor, setTertiaryColor] = useState('#020733');

  // ==================== FETCH DATOS ====================
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const instRes = await api.get(`/institucionesPrincipal/${institucionId}`);
        const instData = instRes.data.Descripcion;
        
        if (!isMounted) return;
        
        setInstitucion(instData);
        
        if (instData.colorinstitucion?.[0]) {
          setPrimaryColor(instData.colorinstitucion[0].color_primario || '#04246C');
          setSecondaryColor(instData.colorinstitucion[0].color_secundario || '#FC0102');
          setTertiaryColor(instData.colorinstitucion[0].color_terciario || '#020733');
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('❌ Error cargando contacto:', err);
          setError('No se pudieron cargar los datos de contacto.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [institucionId]);

  // ==================== VALIDACIÓN DE FORMULARIO ====================
  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    
    if (!formData.nombre.trim()) {
      errors.nombre = 'El nombre es requerido';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Ingresa un email válido';
    }
    
    if (!formData.asunto.trim()) {
      errors.asunto = 'El asunto es requerido';
    }
    
    if (!formData.mensaje.trim()) {
      errors.mensaje = 'El mensaje es requerido';
    } else if (formData.mensaje.length < 10) {
      errors.mensaje = 'El mensaje debe tener al menos 10 caracteres';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ==================== HANDLERS ====================
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar error al escribir
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // ✅ Aquí iría la llamada a tu API para enviar el formulario
      // await api.post('/contacto', { ...formData, institucionId });
      
      // Simular envío exitoso
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSubmitSuccess(true);
      setFormData({ nombre: '', email: '', asunto: '', mensaje: '' });
      
      // Resetear mensaje de éxito después de 5 segundos
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (err) {
      console.error('❌ Error enviando formulario:', err);
      setError('No se pudo enviar el mensaje. Intente más tarde.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helpers
  const formatPhone = (phone?: number) => phone ? phone.toString() : null;

  const socialLinks = [
    { name: 'Facebook', url: institucion?.institucion_facebook, icon: Facebook, color: '#1877F2' },
    { name: 'Twitter/X', url: institucion?.institucion_twitter, icon: Twitter, color: '#1DA1F2' },
    { name: 'YouTube', url: institucion?.institucion_youtube, icon: Youtube, color: '#FF0000' },
    { name: 'Instagram', url: null, icon: Instagram, color: '#E4405F' },
    { name: 'LinkedIn', url: null, icon: Linkedin, color: '#0A66C2' },
  ].filter(link => link.url && link.url.trim() !== '');

  // ==================== RENDER LOADING ====================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: primaryColor }} />
      </div>
    );
  }

  // ==================== RENDER ERROR ====================
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Error de conexión</h2>
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
      <div className="min-h-screen bg-background">
        
        {/* 🎨 Header Elegante con Degradado */}
        <section className="relative py-20 overflow-hidden">
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
          
          <div className="absolute inset-0 opacity-10">
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                backgroundSize: '40px 40px'
              }}
            />
          </div>
          
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          
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
                <Mail className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white">
                Contáctanos
              </h1>
            </div>
            
            <p className="text-lg md:text-xl text-white/90 max-w-3xl leading-relaxed">
              Estamos aquí para ayudarte. Escríbenos, llámanos o visítanos en{' '}
              <span className="font-semibold text-white">
                {institucion?.institucion_nombre || 'nuestra institución'}
              </span>
            </p>
          </div>
        </section>

        {/* Contenido Principal */}
        <section className="py-16 bg-background">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12">
              
              {/* ==================== COLUMNA IZQUIERDA ==================== */}
              <div className="space-y-8">
                
                {/* Información de Contacto */}
                <div className="bg-card rounded-2xl p-8 border shadow-lg">
                  <h2 className="text-2xl font-bold mb-6" style={{ color: primaryColor }}>
                    Información de Contacto
                  </h2>
                  
                  <div className="space-y-6">
                    
                    {/* Dirección */}
                    {institucion?.institucion_direccion && (
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
                            {institucion.institucion_direccion}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Teléfonos */}
                    {(institucion?.institucion_celular1 || institucion?.institucion_telefono1) && (
                      <div className="flex items-start gap-4">
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${secondaryColor}15` }}
                        >
                          <Phone className="w-6 h-6" style={{ color: secondaryColor }} />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">Teléfonos</h3>
                          <div className="space-y-1">
                            {institucion.institucion_celular1 && (
                              <a 
                                href={`tel:+591${institucion.institucion_celular1}`}
                                className="block text-muted-foreground hover:text-primary transition-colors"
                              >
                                +591 {formatPhone(institucion.institucion_celular1)}
                              </a>
                            )}
                            {institucion.institucion_celular2 && institucion.institucion_celular2 !== institucion.institucion_celular1 && (
                              <a 
                                href={`tel:+591${institucion.institucion_celular2}`}
                                className="block text-muted-foreground hover:text-primary transition-colors"
                              >
                                +591 {formatPhone(institucion.institucion_celular2)}
                              </a>
                            )}
                            {institucion.institucion_telefono1 && (
                              <span className="block text-muted-foreground">
                                {institucion.institucion_telefono1}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Emails */}
                    {(institucion?.institucion_correo1 || institucion?.institucion_correo2) && (
                      <div className="flex items-start gap-4">
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${primaryColor}15` }}
                        >
                          <Mail className="w-6 h-6" style={{ color: primaryColor }} />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">Correos Electrónicos</h3>
                          <div className="space-y-1">
                            {institucion.institucion_correo1 && (
                              <a 
                                href={`mailto:${institucion.institucion_correo1}`}
                                className="block text-muted-foreground hover:text-primary transition-colors"
                              >
                                {institucion.institucion_correo1}
                              </a>
                            )}
                            {institucion.institucion_correo2 && institucion.institucion_correo2 !== institucion.institucion_correo1 && (
                              <a 
                                href={`mailto:${institucion.institucion_correo2}`}
                                className="block text-muted-foreground hover:text-primary transition-colors"
                              >
                                {institucion.institucion_correo2}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

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
                          {institucion?.institucion_horario_atencion || 'Lunes a Viernes: 8:00 - 12:00 y 14:00 - 18:00'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>


              </div>

              {/* ==================== COLUMNA DERECHA ==================== */}
              <div className="space-y-8">
                
                {/* ✅ Redes Sociales */}
                {socialLinks.length > 0 && (
                  <div className="bg-card rounded-2xl p-8 border shadow-lg">
                    <h3 className="text-xl font-bold mb-4" style={{ color: primaryColor }}>
                      Síguenos en Redes
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {socialLinks.map((social) => (
                        <a
                          key={social.name}
                          href={social.url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors group"
                          title={social.name}
                          style={{ color: social.color }}
                        >
                          <social.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* ✅ Mapa de Ubicación */}
                {institucion?.institucion_api_google_map && (
                  <div className="bg-card rounded-2xl overflow-hidden border shadow-lg">
                    <div className="p-4 border-b">
                      <h3 className="font-bold flex items-center gap-2" style={{ color: primaryColor }}>
                        <MapPin className="w-5 h-5" />
                        Nuestra Ubicación
                      </h3>
                    </div>
                    <iframe
                      src={institucion.institucion_api_google_map}
                      width="100%"
                      height="350"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="w-full"
                      title="Ubicación de la institución"
                    />
                    {/* Botón de directions */}
                    <div className="p-4 border-t">
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${institucion.institucion_direccion || ''}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 w-full justify-center px-4 py-2 rounded-lg font-medium text-white transition-all hover:shadow-md"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <MapPin className="w-4 h-4" />
                        Cómo llegar con Google Maps
                      </a>
                    </div>
                  </div>
                )}


              </div>

            </div>
          </div>
        </section>

      </div>
    </ThemeDynamicProvider>
  );
}

export default function ContactoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    }>
      <ContactoContent />
    </Suspense>
  );
}