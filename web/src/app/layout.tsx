import type { Metadata } from 'next';
import './globals.css';

// Metadata de la aplicación para SEO y redes sociales
export const metadata: Metadata = {
  title:       'Lumyra — where physics becomes experience',
  description: 'Laboratorio electromagnético interactivo. Arte, ciencia y percepción a través de las ecuaciones de Maxwell.',
  keywords:    ['electromagnetismo', 'física', 'arte generativo', 'sintetizador', 'campo eléctrico'],
  openGraph: {
    title:       'Lumyra',
    description: 'where physics becomes experience',
    type:        'website',
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

// Layout raíz de Next.js.
// Responsabilidad única: proveer el shell HTML y los estilos globales.
// No monta componentes de UI — eso es responsabilidad de cada página.
// TopBar y ParameterStrip se montan en lab/page.tsx porque solo
// existen en el laboratorio, no en la pantalla inicial.
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  );
}