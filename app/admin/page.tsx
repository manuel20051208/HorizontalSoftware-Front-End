import type { Metadata } from 'next'
import { AdminDashboard } from '@/components/modules/admin-dashboard'
import { AppShell } from '@/components/shell/app-shell'
import { requerirSesion } from '@/lib/auth/sesion'

export const metadata: Metadata = { title: 'Administración' }

export default async function AdminPage() {
  const { nombre } = await requerirSesion('admin')
  return (
    <AppShell usuario={{ nombre, rol: 'Administrador' }}>
      <AdminDashboard />
    </AppShell>
  )
}
