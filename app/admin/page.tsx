import type { Metadata } from 'next'
import { AdminDashboard } from '@/components/modules/admin-dashboard'
import { AppShell } from '@/components/shell/app-shell'
import { hoyBogota, primerDiaDelMes } from '@/lib/api/acciones'
import type {
  InmuebleResumen,
  Notificacion,
  Pago,
  ResumenAdmin,
} from '@/lib/api/tipos'
import { RUTAS_API } from '@/lib/auth/config'
import { apiConSesion, requerirSesion } from '@/lib/auth/sesion'
import type { Usuario } from '@/lib/usuarios/tipos'

export const metadata: Metadata = { title: 'Administración' }

export default async function AdminPage() {
  const { nombre } = await requerirSesion('admin')
  const periodo = primerDiaDelMes(hoyBogota())

  const [resumenR, inmueblesR, pagosR, inactivosR, notificacionesR] = await Promise.all([
    apiConSesion<ResumenAdmin>('admin', `${RUTAS_API.resumen}?${new URLSearchParams({ periodo })}`, {
      metodo: 'GET',
    }),
    apiConSesion<InmuebleResumen[]>('admin', RUTAS_API.inmuebles, { metodo: 'GET' }),
    apiConSesion<Pago[]>('admin', RUTAS_API.pagosAdmin, {
      metodo: 'GET',
    }),
    apiConSesion<Usuario[]>('admin', `${RUTAS_API.usuarios}?${new URLSearchParams({ active: 'false' })}`, {
      metodo: 'GET',
    }),
    apiConSesion<Notificacion[]>('admin', RUTAS_API.notificaciones, { metodo: 'GET' }),
  ])

  const resumen: ResumenAdmin = resumenR.ok
    ? resumenR.datos
    : {
        periodo,
        totalInmuebles: 0,
        alDia: 0,
        porVencer: 0,
        vencidas: 0,
        sinLiquidacion: 0,
        porCobrar: 0,
        recaudoMes: 0,
      }
  const inmuebles = inmueblesR.ok && Array.isArray(inmueblesR.datos) ? inmueblesR.datos : []
  const pagos =
    pagosR.ok && Array.isArray(pagosR.datos)
      ? [...pagosR.datos].sort((a, b) => b.id - a.id).slice(0, 6)
      : []
  const usuariosInactivos = inactivosR.ok && Array.isArray(inactivosR.datos) ? inactivosR.datos.length : 0
  const notificaciones =
    notificacionesR.ok && Array.isArray(notificacionesR.datos)
      ? [...notificacionesR.datos].sort((a, b) => b.id - a.id).slice(0, 8)
      : []

  return (
    <AppShell usuario={{ nombre, rol: 'Administrador' }}>
      <AdminDashboard
        resumen={resumen}
        inmuebles={inmuebles}
        pagos={pagos}
        usuariosInactivos={usuariosInactivos}
        notificaciones={notificaciones}
        resumenError={!resumenR.ok}
      />
    </AppShell>
  )
}
