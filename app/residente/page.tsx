import type { Metadata } from 'next'
import { ResidentDashboard } from '@/components/modules/resident-dashboard'
import { AppShell } from '@/components/shell/app-shell'

export const metadata: Metadata = { title: 'Mi apartamento' }

export default function ResidentPage() {
  return (
    <AppShell usuario={{ nombre: 'Santiago Méndez', rol: 'Residente' }}>
      <ResidentDashboard />
    </AppShell>
  )
}
