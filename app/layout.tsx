import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Archivo, Bitter } from 'next/font/google'
import './globals.css'

// Archivo (Omnibus-Type, Buenos Aires) lleva la interfaz y las cifras. Su eje de
// ancho permite cifras tipo placa (ancho 125) sin cargar una segunda familia.
const archivo = Archivo({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--font-archivo',
  display: 'swap',
})

// Bitter (Sol Matas, Huerta Tipográfica) lleva lo que escribe una persona:
// saludos, nombres y títulos de comunicados.
const bitter = Bitter({
  subsets: ['latin'],
  // Solo se usa en peso 600: pedir ese peso evita bajar la fuente variable completa.
  weight: '600',
  variable: '--font-bitter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'habita. · Gestión residencial',
    template: '%s | habita.',
  },
  description: 'Pagos, reservas y accesos para tu inmueble.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#e9e8ee',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${archivo.variable} ${bitter.variable}`}>
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
