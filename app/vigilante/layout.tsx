import { AppShell } from '@/components/shell/app-shell'
import { requerirSesion } from '@/lib/auth/sesion'

// Barra superior y contenedor comunes a todas las pantallas de /vigilante/*.
export default async function VigilanteLayout({ children }: { children: React.ReactNode }) {
  const { nombre } = await requerirSesion('vigilante')
  return <AppShell usuario={{ nombre, rol: 'Vigilante' }}>{children}</AppShell>
}
