import type { Metadata } from 'next'
import { ResidentDashboard } from '@/components/modules/resident-dashboard'
import { AppShell } from '@/components/shell/app-shell'
import type {
  Auto,
  EstadoCuenta,
  Invitado,
  Notificacion,
  Pago,
  Reserva,
} from '@/lib/api/tipos'
import { RUTAS_API } from '@/lib/auth/config'
import { apiConSesion, requerirSesion } from '@/lib/auth/sesion'

export const metadata: Metadata = { title: 'Mi apartamento' }

export default async function ResidentPage() {
  const { nombre } = await requerirSesion('residente')

  const [cuentaR, pagosR, invitadosR, reservasR, notificacionesR, autoR] = await Promise.all([
    apiConSesion<EstadoCuenta>('residente', RUTAS_API.miCuenta, { metodo: 'GET' }),
    apiConSesion<Pago[]>('residente', RUTAS_API.misPagos, { metodo: 'GET' }),
    apiConSesion<Invitado[]>('residente', RUTAS_API.invitados, { metodo: 'GET' }),
    apiConSesion<Reserva[]>('residente', RUTAS_API.reservas, { metodo: 'GET' }),
    apiConSesion<Notificacion[]>('residente', RUTAS_API.notificaciones, { metodo: 'GET' }),
    apiConSesion<Auto>('residente', RUTAS_API.auto, { metodo: 'GET' }),
  ])

  const cuenta = cuentaR.ok ? cuentaR.datos : null
  const pagos = pagosR.ok && Array.isArray(pagosR.datos) ? [...pagosR.datos].sort((a, b) => b.id - a.id) : []
  const invitados =
    invitadosR.ok && Array.isArray(invitadosR.datos)
      ? [...invitadosR.datos].sort(
          (a, b) => Number(b.vigente) - Number(a.vigente) || a.nombreCompleto.localeCompare(b.nombreCompleto),
        )
      : []
  const reservas =
    reservasR.ok && Array.isArray(reservasR.datos)
      ? [...reservasR.datos].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
      : []
  const notificaciones =
    notificacionesR.ok && Array.isArray(notificacionesR.datos)
      ? [...notificacionesR.datos].sort((a, b) => b.id - a.id)
      : []
  const auto = autoR.ok ? autoR.datos : null

  return (
    <AppShell usuario={{ nombre, rol: 'Residente' }}>
      <ResidentDashboard
        nombre={nombre}
        cuenta={cuenta}
        pagos={pagos}
        invitados={invitados}
        reservas={reservas}
        notificaciones={notificaciones}
        auto={auto}
      />
    </AppShell>
  )
}
