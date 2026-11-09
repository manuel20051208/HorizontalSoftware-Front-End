import type { Metadata } from 'next'
import { SecurityDashboard } from '@/components/modules/security-dashboard'
import { AppShell } from '@/components/shell/app-shell'

export const metadata: Metadata = { title: 'Portería' }

export default function SecurityPage() {
  return (
    <AppShell usuario={{ nombre: 'Hernando Cardona', rol: 'Vigilante' }}>
      <SecurityDashboard />
    </AppShell>
  )
}
