// app/sedes/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Building2, MapPin, Phone, Users, ArrowLeft, Loader2 } from 'lucide-react';

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
  estado: string;
}

export default function SedesPage() {
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [loading, setLoading] = useState(true);
  const [primaryColor, setPrimaryColor] = useState('#04246C');
  const [secondaryColor, setSecondaryColor] = useState('#FC0102');

  useEffect(() => {
    const fetchSedes = async () => {
      try {
        setLoading(true);
        const institucionId = Number(process.env.NEXT_PUBLIC_INSTITUCION_ID) || 12;
        const recursosRes = await api.get(`/institucion/${institucionId}/recursos`);
        const instRes = await api.get(`/institucionesPrincipal/${institucionId}`);
        

        const sedesFiltradas = (recursosRes.data.upea_publicaciones || [])
          .filter((pub: any) => pub.publicaciones_tipo === 'SEDES');

        const sedesMapeadas = sedesFiltradas.map((pub: any) => ({
          sede_id: pub.publicaciones_id,
          sede_nombre: pub.publicaciones_titulo.replace('Sede Academica de ', '').replace('Sede Academica ', ''),
          sede_direccion: sanitizeHTML(pub.publicaciones_descripcion || '').replace(/<[^>]*>/g, '') || 'Por definir',
          sede_telefono: '',
          sede_coordinador: sanitizeHTML(pub.publicaciones_autor || 'Coordinación'),
          sede_imagen: pub.publicaciones_imagen,
          estado: '1'
        })) as Sede[];
        
        const sedesCompletas = [
          {
            sede_id: 0,
            sede_nombre: 'Sede Central',
            sede_direccion: sanitizeHTML(instRes.data.Descripcion?.institucion_direccion || 'Por definir'),
            sede_telefono: instRes.data.Descripcion?.institucion_celular1?.toString() || '',
            sede_coordinador: 'Dirección General',
            sede_imagen: instRes.data.Descripcion?.institucion_logo,
            estado: '1'
          },
          ...sedesMapeadas
        ];

        setSedes(sedesCompletas);

        if (instRes.data.Descripcion?.colorinstitucion?.[0]) {
          setPrimaryColor(instRes.data.Descripcion.colorinstitucion[0].color_primario || '#04246C');
          setSecondaryColor(instRes.data.Descripcion.colorinstitucion[0].color_secundario || '#FC0102');
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
         //
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSedes();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: primaryColor }} />
      </div>
    );
  }

  return (
    <ThemeDynamicProvider colors={{ primary: primaryColor, secondary: secondaryColor }}>
      <div className="min-h-screen bg-background">
        
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 25%, ${secondaryColor}99 60%, ${secondaryColor}44 100%)` }} />
          <div className="relative max-w-6xl mx-auto px-4">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white mb-8 transition-colors">
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              Volver al inicio
            </Link>
            
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20">
                <Building2 className="w-10 h-10 text-white" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">Nuestras Sedes</h1>
                <p className="text-white/90 mt-2">
                  {sedes.length} sede{sedes.length !== 1 ? 's' : ''} disponible{sedes.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sedes.map((sede) => (
                <Link key={sede.sede_id} href={`/sedes/${sede.sede_id}`} className="group">
                  <div className="bg-card rounded-2xl border shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 overflow-hidden">
                    <div className="relative h-48 bg-muted">
                      {sede.sede_imagen ? (
                        <Image
                          src={getStorageUrl(sede.sede_imagen)}
                          alt={sede.sede_nombre}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover transition-transform group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 className="w-16 h-16 text-muted-foreground" aria-hidden="true" />
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors" style={{ color: primaryColor }}>
                        {sede.sede_nombre}
                      </h3>
                      
                      {sede.sede_coordinador && (
                        <p className="text-sm text-muted-foreground mb-4">
                          {sede.sede_coordinador}
                        </p>
                      )}

                      <div className="space-y-2 text-sm">
                        {sede.sede_direccion && (
                          <div className="flex items-start gap-2 text-muted-foreground">
                            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: primaryColor }} aria-hidden="true" />
                            <span className="line-clamp-2">{sede.sede_direccion}</span>
                          </div>
                        )}
                        {sede.sede_telefono && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="w-4 h-4 flex-shrink-0" style={{ color: primaryColor }} aria-hidden="true" />
                            <span>{sede.sede_telefono}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t">
                        <span className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: primaryColor }}>
                          Ver más detalles →
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {sedes.length === 0 && (
              <div className="text-center py-20">
                <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" aria-hidden="true" />
                <p className="text-muted-foreground">No hay sedes registradas</p>
              </div>
            )}
          </div>
        </section>

      </div>
    </ThemeDynamicProvider>
  );
}