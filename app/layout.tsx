// app/layout.tsx
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { InstitucionProvider } from '@/context/InstitucionContext';
import './globals.css';

const geist = Geist({ subsets: ['latin'] });
const geistMono = Geist_Mono({ subsets: ['latin'] });

// Valores por defecto (fallback seguro)
const DEFAULTS = {
  nombre: 'Ciencias de la Educación',
  iniciales: 'UPEA',
  mision: 'Programas académicos de excelencia en educación',
  logo: '/logo_upea.png', // ← Archivo estático en /public
};

// Función segura para obtener datos (sin proxies, sin CORS issues en server)
async function getInstitucionData(institucionId: number) {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://apiadministrador.upea.bo/api/v2';
    
    const response = await fetch(`${API_URL}/institucionesPrincipal/${institucionId}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'force-cache',
      next: { revalidate: 3600 }
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.Descripcion || null;
  } catch {
    return null;
  }
}

// Metadata DINÁMICO (se ejecuta en servidor - sin CORS)
export async function generateMetadata(): Promise<Metadata> {
  const INSTITUCION_ID = Number(process.env.NEXT_PUBLIC_INSTITUCION_ID) || 12;
  const institucion = await getInstitucionData(INSTITUCION_ID);
  
  // Datos dinámicos o fallback
  const nombre = institucion?.institucion_nombre || DEFAULTS.nombre;
  const iniciales = institucion?.institucion_iniciales || DEFAULTS.iniciales;
  const mision = institucion?.institucion_mision?.replace(/<[^>]*>/g, '').slice(0, 160) || DEFAULTS.mision;
  
  // Logo: desde API o fallback estático
  const STORAGE_URL = process.env.NEXT_PUBLIC_STORAGE_URL || 'https://apiadministrador.upea.bo/storage';
  const logoUrl = institucion?.institucion_logo 
    ? `${STORAGE_URL}/${institucion.institucion_logo}`
    : DEFAULTS.logo;

  return {
    title: {
      default: `${nombre} - ${iniciales}`,
      template: `%s | ${nombre} - ${iniciales}`,
    },
    description: mision,
    keywords: ['educación', iniciales, 'carrera', 'universidad', 'El Alto', 'Bolivia'],
    authors: [{ name: `${nombre} - ${iniciales}` }],
    creator: nombre,
    publisher: iniciales,
    formatDetection: { email: false, address: false, telephone: false },
    metadataBase: new URL(process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'),
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      locale: 'es_BO',
      url: process.env.NEXT_PUBLIC_URL || 'http://localhost:3000',
      siteName: `${nombre} - ${iniciales}`,
      title: `${nombre} - ${iniciales}`,
      description: mision,
      images: [{ url: logoUrl, width: 1200, height: 630, alt: `Logo ${nombre}` }],
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
      googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
    icons: {
      icon: logoUrl,
      shortcut: logoUrl,
      apple: logoUrl,
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const INSTITUCION_ID = Number(process.env.NEXT_PUBLIC_INSTITUCION_ID) || 12;

  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://archivosminio.upea.bo" />
        <link rel="preconnect" href="https://apiadministrador.upea.bo" />
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