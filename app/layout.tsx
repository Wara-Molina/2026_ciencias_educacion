import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { InstitucionProvider } from '@/context/InstitucionContext';
import './globals.css';

const geist = Geist({ subsets: ['latin'] });
const geistMono = Geist_Mono({ subsets: ['latin'] });

const STATIC_LOGO = '/logo_upea.png';

const isValidUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

const sanitizeField = (text: string | undefined, maxLength = 160): string => {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/[<>\"'&]/g, '')
    .trim()
    .slice(0, maxLength);
};

const getInstitucionNombreById = (id: number): { nombre: string; iniciales: string; mision: string } => {
  if (id === 12) {
    return {
      nombre: 'Ciencias de la Educación',
      iniciales: 'UPEA',
      mision: 'Formación de profesionales en educación de excelencia'
    };
  }
  if (id === 18) {
    return {
      nombre: 'Artes Plásticas',
      iniciales: 'UPEA',
      mision: 'La formación de profesionales en artes plásticas altamente competentes'
    };
  }
  if (id === 20) {
    return {
      nombre: 'Medicina Veterinaria',
      iniciales: 'UPEA',
      mision: 'Formación de profesionales en medicina veterinaria de excelencia'
    };
  }
  return {
    nombre: 'Institución',
    iniciales: 'UPEA',
    mision: 'Programas académicos de excelencia'
  };
};

export async function generateMetadata(): Promise<Metadata> {
  const institucionId = Number(process.env.NEXT_PUBLIC_INSTITUCION_ID) || 12;
  
  const datosInstitucion = getInstitucionNombreById(institucionId);
  
  const nombre = sanitizeField(datosInstitucion.nombre, 100);
  const iniciales = sanitizeField(datosInstitucion.iniciales, 20);
  const mision = sanitizeField(datosInstitucion.mision, 160);
  
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
        url: STATIC_LOGO, 
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
      images: [STATIC_LOGO],
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
      icon: STATIC_LOGO,
      shortcut: STATIC_LOGO,
      apple: STATIC_LOGO,
    },
  };
}

export default function RootLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const institucionId = Number(process.env.NEXT_PUBLIC_INSTITUCION_ID) || 12;

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
        <InstitucionProvider institucionId={institucionId}>
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