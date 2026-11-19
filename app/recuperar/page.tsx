import type { Metadata } from 'next'
import { PantallaAcceso } from '@/components/gateway/gateway'
import { RecuperarForm } from '@/components/gateway/recuperar-form'
import { recuperarContrasena } from '@/lib/cuenta/acciones'

export const metadata: Metadata = { title: 'Recuperar contraseña' }

/** Pública: proxy.ts no la intercepta (su matcher solo cubre el ingreso y los módulos). */
export default function RecuperarPage() {
  return (
    <PantallaAcceso>
      <RecuperarForm accion={recuperarContrasena} />
    </PantallaAcceso>
  )
}
