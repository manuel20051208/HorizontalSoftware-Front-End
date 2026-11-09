import { AppShell } from '@/components/shell/app-shell'
import { requerirSesion } from '@/lib/auth/sesion'

// Todas las pantallas de /admin/* comparten la misma barra superior y el
// contenedor con aire lateral. requerirSesion está memoizado (cache), así que
// correrlo aquí y en cada página no repite trabajo.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { nombre } = await requerirSesion('admin')
  return <AppShell usuario={{ nombre, rol: 'Administrador' }}>{children}</AppShell>
}
