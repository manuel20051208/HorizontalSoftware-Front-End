import type { Metadata } from 'next'
import { SecurityDashboard } from '@/components/modules/security-dashboard'
import { AppShell } from '@/components/shell/app-shell'
import { requerirSesion } from '@/lib/auth/sesion'

export const metadata: Metadata = { title: 'Portería' }

export default async function SecurityPage() {
  const { nombre } = await requerirSesion('vigilante')
  return (
    <AppShell usuario={{ nombre, rol: 'Vigilante' }}>
      <SecurityDashboard />
    </AppShell>
  )
}
