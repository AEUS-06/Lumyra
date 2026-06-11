import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title:       'Lumyra — donde la física se convierte en experiencia',
  description: 'Laboratorio electromagnético interactivo. Arte, ciencia y percepción a través de las ecuaciones de Maxwell.',
  keywords:    ['electromagnetismo', 'física', 'arte generativo', 'sintetizador', 'campo eléctrico'],
  openGraph: {
    title:       'Lumyra',
    description: 'donde la física se convierte en experiencia',
    type:        'website',
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

// Script inline que arranca el tema ANTES del primer paint —
// sin este bloque, al recargar con tema claro se vería un flash oscuro.
const themeScript = `
(function() {
  try {
    var t = localStorage.getItem('lumyra-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', t);
  } catch(e) {}
})();
`;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es" data-theme="dark">
      <head>
        {/* Inyectado antes del CSS para que el atributo esté listo */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}

