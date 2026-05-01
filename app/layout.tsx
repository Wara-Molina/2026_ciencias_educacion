// app/layout.tsx
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react'; 
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { InstitucionProvider } from '@/context/InstitucionContext';
import './globals.css';


const geist = Geist({ subsets: ['latin'] });
const geistMono = Geist_Mono({ subsets: ['latin'] });

// ✅ Logo ESTÁTICO (no viene de la API)
const STATIC_LOGO = '/logo_upea.png';

// ✅ Fallback solo si la API falla completamente
const FALLBACK = {
  nombre: 'Institución',
  iniciales: 'UPEA',
  mision: 'Programas académicos de excelencia',
};

// ✅ Validar URL básica
const isValidUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

// ✅ Sanitizar campo para metadata (previene XSS)
const sanitizeField = (text: string | undefined, maxLength = 160): string => {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/[<>\"'&]/g, '')
    .trim()
    .slice(0, maxLength);
};

// ✅ Obtener datos de institución desde API
async function getInstitucionData(id: number) {
  // ✅ Usar SOLO las variables que tienes en tu .env
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_ROOT;
  
  if (!baseUrl || !Number.isInteger(id) || id <= 0) {
    return null;
  }
  
  try {
    const res = await fetch(`${baseUrl}/institucionesPrincipal/${id}`, {
      headers: { 'Accept': 'application/json' },
      cache: 'force-cache',
      next: { revalidate: 3600 }
    });
    
    if (!res.ok) return null;
    
    const data = await res.json();
    return data.Descripcion || null;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Error obteniendo institución:', error);
    }
    return null;
  }
}

// ✅ Metadata con nombre DINÁMICO desde API + logo ESTÁTICO
export async function generateMetadata(): Promise<Metadata> {
  const rawId = Number(process.env.NEXT_PUBLIC_INSTITUCION_ID) || 12;
  const INSTITUCION_ID = Number.isInteger(rawId) && rawId > 0 ? rawId : 12;
  
  // ✅ Fetch dinámico desde API
  const institucion = await getInstitucionData(INSTITUCION_ID);
  
  // ✅ Nombre DINÁMICO desde API (con fallback)
  const nombre = institucion?.institucion_nombre 
    ? sanitizeField(institucion.institucion_nombre, 100) 
    : FALLBACK.nombre;
    
  const iniciales = institucion?.institucion_iniciales 
    ? sanitizeField(institucion.institucion_iniciales, 20) 
    : FALLBACK.iniciales;
    
  const mision = institucion?.institucion_mision 
    ? sanitizeField(institucion.institucion_mision.replace(/<[^>]*>/g, ''), 160) 
    : FALLBACK.mision;
  
  // ✅ Logo ESTÁTICO (no de la API)
  const logoUrl = STATIC_LOGO;
  
  // ✅ URL base para metadata
  const appUrl = process.env.NEXT_PUBLIC_URL || 
                 (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://example.com');
  const safeBaseUrl = isValidUrl(appUrl) ? appUrl : 'https://example.com';

  return {

    title: {
      default: `${nombre} - ${iniciales}`,
      template: `%s | ${nombre} - ${iniciales}`,
    },
    description: mision,
    keywords: ['educación', iniciales, 'carrera', 'universidad', 'El Alto', 'Bolivia'].join(', '),
    authors: [{ name: `${nombre} - ${iniciales}` }],
    creator: nombre,
    publisher: iniciales,
    formatDetection: { email: false, address: false, telephone: false },
    metadataBase: new URL(safeBaseUrl),
    alternates: { canonical: '/' },

    openGraph: {
      type: 'website',
      locale: 'es_BO',
      url: safeBaseUrl,
      siteName: `${nombre} - ${iniciales}`,
      title: `${nombre} - ${iniciales}`,
      description: mision,
      images: [{ 
        url: logoUrl, 
        width: 1200, 
        height: 630, 
        alt: `Logo de ${nombre}`,
        type: 'image/png'
      }],
    },
    
    twitter: {
      card: 'summary_large_image',
      title: `${nombre} - ${iniciales}`,
      description: mision,
      images: [logoUrl],
    },
    
    robots: {
      index: true,
      follow: true,
      googleBot: { 
        index: true, 
        follow: true, 
        'max-image-preview': 'large' 
      },
    },

    icons: {
      icon: logoUrl,
      shortcut: logoUrl,
      apple: logoUrl,
    },
  };
}

export default function RootLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const rawId = Number(process.env.NEXT_PUBLIC_INSTITUCION_ID) || 12;
  const INSTITUCION_ID = Number.isInteger(rawId) && rawId > 0 ? rawId : 12;

  return (
    <html lang="es">
      <head>
        {process.env.NEXT_PUBLIC_STORAGE_URL && (
          <>
            <link rel="preconnect" href={process.env.NEXT_PUBLIC_STORAGE_URL} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_STORAGE_URL} />
          </>
        )}
      </head>
      <body className={`${geist.className} ${geistMono.className} antialiased`}>
        <InstitucionProvider institucionId={INSTITUCION_ID}>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </InstitucionProvider>

        {process.env.NODE_ENV === 'production' && <Analytics />}
        
      </body>
    </html>
  );
}