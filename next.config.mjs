/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Los ingresos por módulo se unificaron en /ingresar
  async redirects() {
    return [{ source: '/ingresar/:modulo', destination: '/ingresar', permanent: true }]
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
