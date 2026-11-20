import type { Metadata } from 'next'
import { UsuariosVista } from '@/components/modules/usuarios/usuarios-vista'
import { listaDe, listado, type Listado } from '@/lib/api/paginacion'
import { RUTAS_API } from '@/lib/auth/config'
import { apiConSesion, requerirSesion } from '@/lib/auth/sesion'
import { type Inmueble, INVITADO, tipoDeFiltro, type Usuario } from '@/lib/usuarios/tipos'

export const metadata: Metadata = { title: 'Usuarios' }

type Props = { searchParams: Promise<{ tipo?: string; estado?: string }> }

export default async function UsuariosPage({ searchParams }: Props) {
  await requerirSesion('admin')
  const params = await searchParams
  const tipo = params.tipo === INVITADO.filtro ? INVITADO.tipo : tipoDeFiltro(params.tipo)
  const estado = params.estado === 'activas' || params.estado === 'inactivas' ? params.estado : undefined

  const consulta = new URLSearchParams()
  if (tipo) consulta.set('tipo', tipo)
  if (estado) consulta.set('active', String(estado === 'activas'))
  // Los apartamentos activos, para agregar o mudar los de residentes e invitados (igual que en «Nueva cuenta»)
  const verResidentes = !tipo || tipo === 'RESIDENTE' || tipo === INVITADO.tipo
  const [resultado, inmueblesR] = await Promise.all([
    apiConSesion<Listado<Usuario>>(
      'admin',
      listado(consulta.size ? `${RUTAS_API.usuarios}?${consulta}` : RUTAS_API.usuarios),
      { metodo: 'GET' },
    ),
    verResidentes ? apiConSesion<Listado<Inmueble>>('admin', listado(RUTAS_API.inmuebles), { metodo: 'GET' }) : null,
  ])
  const inmuebles = inmueblesR?.ok
    ? listaDe(inmueblesR)
        .filter((i) => i.isActive !== false)
        .sort((a, b) => a.direccionInmueble.localeCompare(b.direccionInmueble, 'es', { numeric: true }))
    : null

  return <UsuariosVista resultado={resultado} tipo={tipo} estado={estado} inmuebles={inmuebles} />
}
