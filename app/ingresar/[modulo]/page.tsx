import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PantallaAcceso } from '@/components/gateway/gateway'
import { LoginForm } from '@/components/gateway/login-form'
import { iniciarSesion } from '@/lib/auth/acciones'
import { esModulo, MODULOS } from '@/lib/auth/config'

type Props = { params: Promise<{ modulo: string }> }

// Solo existen /ingresar/admin, /ingresar/residente y /ingresar/vigilante
export const dynamicParams = false

export function generateStaticParams() {
  return Object.keys(MODULOS).map((modulo) => ({ modulo }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { modulo } = await params
  return { title: esModulo(modulo) ? `Ingresar · ${MODULOS[modulo].nombre}` : 'Ingresar' }
}

export default async function IngresarPage({ params }: Props) {
  const { modulo } = await params
  if (!esModulo(modulo)) notFound()

  return (
    <PantallaAcceso>
      <LoginForm modulo={modulo} accion={iniciarSesion.bind(null, modulo)} />
    </PantallaAcceso>
  )
}
