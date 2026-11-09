import type { Metadata } from 'next'
import { AdminDashboard } from '@/components/modules/admin-dashboard'
import { AppShell } from '@/components/shell/app-shell'

export const metadata: Metadata = { title: 'Administración' }

export default function AdminPage() {
  return (
    <AppShell usuario={{ nombre: 'Santiago Méndez', rol: 'Administrador' }}>
      <AdminDashboard />
    </AppShell>
  )
}
