import type { Metadata } from 'next'
import { ResidentDashboard } from '@/components/modules/resident-dashboard'
import { AppShell } from '@/components/shell/app-shell'
import { requerirSesion } from '@/lib/auth/sesion'

export const metadata: Metadata = { title: 'Mi apartamento' }

export default async function ResidentPage() {
  const { nombre } = await requerirSesion('residente')
  return (
    <AppShell usuario={{ nombre, rol: 'Residente' }}>
      <ResidentDashboard />
    </AppShell>
  )
}
