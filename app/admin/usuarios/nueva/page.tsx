import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { NuevaCuentaForm } from '@/components/modules/usuarios/nueva-cuenta-form'
import styles from '@/components/modules/usuarios/usuarios.module.css'
import { listaDe, listado, type Listado } from '@/lib/api/paginacion'
import { RUTAS_API } from '@/lib/auth/config'
import { apiConSesion, requerirSesion } from '@/lib/auth/sesion'
import { hoyBogota, type Inmueble, tipoDeFiltro } from '@/lib/usuarios/tipos'

export const metadata: Metadata = { title: 'Nueva cuenta' }

type Props = { searchParams: Promise<{ tipo?: string }> }

export default async function NuevaCuentaPage({ searchParams }: Props) {
  await requerirSesion('admin')
  const { tipo } = await searchParams

  // Los apartamentos, para asignarle uno a la cuenta de un residente
  const r = await apiConSesion<Listado<Inmueble>>('admin', listado(RUTAS_API.inmuebles), { metodo: 'GET' })
  const inmuebles = r.ok
    ? listaDe(r)
        .filter((i) => i.isActive !== false)
        .sort((a, b) => a.direccionInmueble.localeCompare(b.direccionInmueble, 'es', { numeric: true }))
    : null

  return (
    <div className={styles.pagina}>
      <Link href="/admin" prefetch={false} className={`btn ${styles.volver}`} data-variant="quiet" data-size="sm">
        <ArrowLeft aria-hidden="true" />
        Panel
      </Link>

      <header className={styles.titulo}>
        <h1 className="t-title">Nueva cuenta</h1>
        <p className={styles.sub}>
          Crea el acceso de un residente, un vigilante u otro administrador. Al terminar verás los datos para
          entregárselos.
        </p>
      </header>

      <NuevaCuentaForm inmuebles={inmuebles} tipoInicial={tipoDeFiltro(tipo) ?? 'RESIDENTE'} hoy={hoyBogota()} />
    </div>
  )
}
