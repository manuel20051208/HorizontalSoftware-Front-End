import type { Metadata } from 'next'
import { PantallaAcceso } from '@/components/gateway/gateway'
import { LoginForm } from '@/components/gateway/login-form'
import { iniciarSesion } from '@/lib/auth/acciones'

export const metadata: Metadata = { title: 'Ingresar' }

/** Un solo ingreso para administrador, residente y vigilante. */
export default function IngresarPage() {
  return (
    <PantallaAcceso>
      <LoginForm accion={iniciarSesion} />
    </PantallaAcceso>
  )
}
