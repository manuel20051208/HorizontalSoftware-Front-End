import type { Metadata } from 'next'
import { ActivarForm } from '@/components/gateway/activar-form'
import { PantallaAcceso } from '@/components/gateway/gateway'
import { activarCuenta, reenviarCodigo } from '@/lib/cuenta/acciones'

export const metadata: Metadata = { title: 'Activar cuenta' }

/** Pública: proxy.ts no la intercepta (su matcher solo cubre el ingreso y los módulos). */
export default function ActivarPage() {
  return (
    <PantallaAcceso>
      <ActivarForm activar={activarCuenta} reenviar={reenviarCodigo} />
    </PantallaAcceso>
  )
}
