import type { Metadata } from 'next'
import { AdminDashboard } from '@/components/modules/admin-dashboard'
import { hoyBogota, primerDiaDelMes } from '@/lib/api/acciones'
import type {
  InmuebleResumen,
  Notificacion,
  Pago,
  ResumenAdmin,
} from '@/lib/api/tipos'
import { listaDe, listado, totalDe, type Listado } from '@/lib/api/paginacion'
import { RUTAS_API } from '@/lib/auth/config'
import { apiConSesion, requerirSesion } from '@/lib/auth/sesion'
import type { Usuario } from '@/lib/usuarios/tipos'

export const metadata: Metadata = { title: 'Administración' }

export default async function AdminPage() {
  await requerirSesion('admin')
  const periodo = primerDiaDelMes(hoyBogota())

  const [resumenR, inmueblesR, pagosR, inactivosR, notificacionesR] = await Promise.all([
    apiConSesion<ResumenAdmin>('admin', `${RUTAS_API.resumen}?${new URLSearchParams({ periodo })}`, {
      metodo: 'GET',
    }),
    apiConSesion<Listado<InmuebleResumen>>('admin', listado(RUTAS_API.inmuebles), { metodo: 'GET' }),
    apiConSesion<Listado<Pago>>('admin', listado(RUTAS_API.pagosAdmin), {
      metodo: 'GET',
    }),
    apiConSesion<Listado<Usuario>>('admin', listado(`${RUTAS_API.usuarios}?${new URLSearchParams({ active: 'false' })}`), {
      metodo: 'GET',
    }),
    apiConSesion<Listado<Notificacion>>('admin', listado(RUTAS_API.notificaciones), { metodo: 'GET' }),
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
  const inmuebles = listaDe(inmueblesR)
  const pagos =
    listaDe(pagosR).sort((a, b) => b.id - a.id).slice(0, 6)
  // El total de la consulta, no solo las filas que llegaron en esta página
  const usuariosInactivos = totalDe(inactivosR)
  const notificaciones =
    listaDe(notificacionesR).sort((a, b) => b.id - a.id).slice(0, 8)

  return (
    <AdminDashboard
      resumen={resumen}
      inmuebles={inmuebles}
      pagos={pagos}
      usuariosInactivos={usuariosInactivos}
      notificaciones={notificaciones}
      resumenError={!resumenR.ok}
    />
  )
}
