import { AppShell } from '@/components/shell/app-shell'
import { requerirSesion } from '@/lib/auth/sesion'

// Barra superior y contenedor comunes a todas las pantallas de /residente/*.
export default async function ResidenteLayout({ children }: { children: React.ReactNode }) {
  const { nombre } = await requerirSesion('residente')
  return <AppShell usuario={{ nombre, rol: 'Residente' }} menu="residente">{children}</AppShell>
}
