// app/sedes/[id]/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  MapPin, Phone, Mail, Clock, ArrowLeft, Building2, 
  Loader2, User
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

import api from '@/lib/axios';
import { getStorageUrl } from '@/lib/utils';
import { sanitizeHTML } from '@/lib/sanitize';
import ThemeDynamicProvider from '@/components/providers/ThemeDynamicProvider';

interface Sede {
  sede_id: number;
  sede_nombre: string;
  sede_direccion?: string;
  sede_telefono?: string;
  sede_coordinador?: string;
  sede_imagen?: string;
}

const isValidEmail = (email: string | undefined): boolean => {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !email.includes('<') && !email.includes('>');
};

const sanitizeEmail = (email: string | undefined): string => {
  if (!email || !isValidEmail(email)) return '';
  return email.replace(/[<>\"'&]/g, '');
};

function SedeDetalleContent() {
  const params = useParams();
  const router = useRouter();
  const rawSedeId = Number(params.id);
  const sedeId = Number.isInteger(rawSedeId) && rawSedeId >= 0 && rawSedeId < 10000000 ? rawSedeId : null;
  
  const [sede, setSede] = useState<Sede | null>(null);
  const [institucion, setInstitucion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [primaryColor, setPrimaryColor] = useState('#04246C');
  const [secondaryColor, setSecondaryColor] = useState('#FC0102');

  useEffect(() => {
    if (sedeId === null) {
      setLoading(false);
      return;
    }

    const fetchSede = async () => {
      try {
        setLoading(true);
        const institucionId = Number(process.env.NEXT_PUBLIC_INSTITUCION_ID) || 12;
        
        const recursosRes = await api.get(`/institucion/${institucionId}/recursos`);
        const instRes = await api.get(`/institucionesPrincipal/${institucionId}`);
        
        setInstitucion(instRes.data.Descripcion);

        if (sedeId === 0) {
          setSede({
            sede_id: 0,
            sede_nombre: 'Sede Central',
            sede_direccion: sanitizeHTML(instRes.data.Descripcion?.institucion_direccion || 'Por definir'),
            sede_telefono: instRes.data.Descripcion?.institucion_celular1?.toString() || '',
            sede_coordinador: 'Dirección General',
            sede_imagen: instRes.data.Descripcion?.institucion_logo
          });
        } else {
          const publicacion = recursosRes.data.upea_publicaciones?.find(
            (p: any) => p.publicaciones_id === sedeId && p.publicaciones_tipo === 'SEDES'
          );

          if (publicacion) {
            setSede({
              sede_id: publicacion.publicaciones_id,
              sede_nombre: sanitizeHTML(publicacion.publicaciones_titulo
                .replace('Sede Academica de ', '')
                .replace('Sede Academica ', '')),
              sede_direccion: sanitizeHTML(publicacion.publicaciones_descripcion || '').replace(/<[^>]*>/g, '') || 'Por definir',
              sede_telefono: '',
              sede_coordinador: sanitizeHTML(publicacion.publicaciones_autor || 'Coordinación'),
              sede_imagen: publicacion.publicaciones_imagen
            });
          }
        }

        if (instRes.data.Descripcion?.colorinstitucion?.[0]) {
          setPrimaryColor(instRes.data.Descripcion.colorinstitucion[0].color_primario || '#04246C');
          setSecondaryColor(instRes.data.Descripcion.colorinstitucion[0].color_secundario || '#FC0102');
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Error cargando sede:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSede();
  }, [sedeId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin" style={{ color: primaryColor }} />
      </div>
    );
  }

  if (!sede || sedeId === null) {
    return (
      <ThemeDynamicProvider colors={{ primary: primaryColor, secondary: secondaryColor }}>
        <div className="min-h-screen flex items-center justify-center p-8 bg-background">
          <div className="text-center">
            <div className="text-6xl mb-4" aria-hidden="true">🏛️</div>
            <h2 className="text-2xl font-bold mb-2">Sede no encontrada</h2>
            <p className="text-muted-foreground mb-6">La sede que buscas no existe o ha sido eliminada</p>
            <Link href="/sedes" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white" style={{ backgroundColor: primaryColor }}>
              <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Volver a sedes
            </Link>
          </div>
        </div>
      </ThemeDynamicProvider>
    );
  }

  return (
    <ThemeDynamicProvider colors={{ primary: primaryColor, secondary: secondaryColor }}>
      <div className="min-h-screen bg-background">
        
        <div className="relative h-64 md:h-96">
          {sede.sede_imagen ? (
            <>
              <Image
                src={getStorageUrl(sede.sede_imagen)}
                alt={sede.sede_nombre}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${primaryColor}30, ${secondaryColor}20)` }}>
              <Building2 className="w-24 h-24 text-white/30" aria-hidden="true" />
            </div>
          )}

          <button
            onClick={() => router.back()}
            className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-lg text-sm font-medium hover:bg-white transition-colors shadow-lg"
            aria-label="Volver"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Volver
          </button>
        </div>

        <div className="max-w-4xl mx-auto px-4 -mt-20 relative z-10 pb-20">
          <div className="bg-card rounded-2xl shadow-xl border overflow-hidden">
            
            <div className="p-6 md:p-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-6" style={{ color: primaryColor }}>
                {sede.sede_nombre}
              </h1>

              {sede.sede_coordinador && (
                <div className="mb-8 p-4 rounded-xl bg-muted/50 border">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: primaryColor }} aria-hidden="true" />
                    <div>
                      <p className="text-sm font-medium mb-1">Coordinador/a</p>
                      <p className="text-muted-foreground">{sede.sede_coordinador}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4 mb-8">
                {sede.sede_direccion && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border">
                    <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: primaryColor }} aria-hidden="true" />
                    <div>
                      <p className="text-sm font-medium mb-1">Ubicación</p>
                      <p className="text-muted-foreground">{sede.sede_direccion}</p>
                    </div>
                  </div>
                )}

                {sede.sede_id === 0 && institucion && (
                  <>
                    {institucion.institucion_correo1 && isValidEmail(institucion.institucion_correo1) && (
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border">
                        <Mail className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: primaryColor }} aria-hidden="true" />
                        <div>
                          <p className="text-sm font-medium mb-1">Correo electrónico</p>
                          <a href={`mailto:${sanitizeEmail(institucion.institucion_correo1)}`} className="text-primary hover:underline">
                            {institucion.institucion_correo1}
                          </a>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border">
                      <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: primaryColor }} aria-hidden="true" />
                      <div>
                        <p className="text-sm font-medium mb-1">Horario de atención</p>
                        <p className="text-muted-foreground">Lunes a Viernes: 8:00 - 12:00 y 14:00 - 18:00</p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/contacto"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium border-2 transition-all hover:shadow-lg"
                  style={{ borderColor: primaryColor, color: primaryColor }}
                >
                  <Mail className="w-5 h-5" aria-hidden="true" />
                  Contacto General
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <Link href="/sedes" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Ver todas las sedes
            </Link>
          </div>
        </div>

      </div>
    </ThemeDynamicProvider>
  );
}

export default function SedeDetallePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    }>
      <SedeDetalleContent />
    </Suspense>
  );
}