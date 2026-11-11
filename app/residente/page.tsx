import type { Metadata } from 'next'
import { ResidentDashboard } from '@/components/modules/resident-dashboard'
import type {
  Auto,
  EstadoCuenta,
  Invitado,
  Notificacion,
  Pago,
  Reserva,
} from '@/lib/api/tipos'
import { consultaPagina, leerPagina, listaDe, listado, type Listado } from '@/lib/api/paginacion'
import { porInicio } from '@/lib/api/reservas'
import { RUTAS_API } from '@/lib/auth/config'
import { apiConSesion, requerirSesion } from '@/lib/auth/sesion'

export const metadata: Metadata = { title: 'Mi apartamento' }

export default async function ResidentPage() {
  const { nombre } = await requerirSesion('residente')

  const [cuentaR, pagosR, invitadosR, reservasR, notificacionesR, autoR] = await Promise.all([
    apiConSesion<EstadoCuenta>('residente', RUTAS_API.miCuenta, { metodo: 'GET' }),
    // Solo los últimos pagos: el historial completo (paginado) está en /residente/pagos
    apiConSesion<Listado<Pago>>('residente', `${RUTAS_API.misPagos}?${consultaPagina(1, 3)}`, { metodo: 'GET' }),
    apiConSesion<Listado<Invitado>>('residente', listado(RUTAS_API.invitados), { metodo: 'GET' }),
    apiConSesion<Listado<Reserva>>('residente', listado(RUTAS_API.reservas), { metodo: 'GET' }),
    apiConSesion<Listado<Notificacion>>('residente', listado(RUTAS_API.notificaciones), { metodo: 'GET' }),
    apiConSesion<Auto>('residente', RUTAS_API.auto, { metodo: 'GET' }),
  ])

  const cuenta = cuentaR.ok ? cuentaR.datos : null
  const pagos = leerPagina(pagosR, 1, 3, (a, b) => b.id - a.id).items
  const invitados =
    listaDe(invitadosR).sort(
          (a, b) => Number(b.vigente) - Number(a.vigente) || a.nombreCompleto.localeCompare(b.nombreCompleto),
        )
  const reservas =
    // Las que vienen o están en curso, la más próxima primero (las finalizadas quedan en Mis reservas)
    listaDe(reservasR)
      .filter((r) => r.estado !== 'FINALIZADA')
      .sort(porInicio)
  const notificaciones =
    listaDe(notificacionesR).sort((a, b) => b.id - a.id)
  const auto = autoR.ok ? autoR.datos : null

  return (
    <ResidentDashboard
      nombre={nombre}
      cuenta={cuenta}
      pagos={pagos}
      invitados={invitados}
      reservas={reservas}
      notificaciones={notificaciones}
      auto={auto}
    />
  )
}
