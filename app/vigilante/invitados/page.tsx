import { Clock, Search, UserCheck } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Encabezado, EstadoResultado, Paginacion, Panel, Vacio } from '@/components/gestion/piezas'
import gestion from '@/components/gestion/gestion.module.css'
import { fechaLarga } from '@/lib/api/acciones'
import { consultaPagina, leerPagina, paginaDeUrl, type Listado } from '@/lib/api/paginacion'
import type { Invitado } from '@/lib/api/tipos'
import { RUTAS_API } from '@/lib/auth/config'
import { apiConSesion, requerirSesion } from '@/lib/auth/sesion'

export const metadata: Metadata = { title: 'Invitados registrados' }

const POR_PAGINA = 20

type Props = { searchParams: Promise<{ pagina?: string }> }

function porNombre(a: Invitado, b: Invitado) {
  return a.nombreCompleto.localeCompare(b.nombreCompleto, 'es') || a.id - b.id
}

export default async function InvitadosVigilantePage({ searchParams }: Props) {
  await requerirSesion('vigilante')
  const params = await searchParams
  const pagina = paginaDeUrl(params.pagina)

  const r = await apiConSesion<Listado<Invitado>>(
    'vigilante',
    `${RUTAS_API.vigilanteInvitados}?${consultaPagina(pagina, POR_PAGINA)}`,
    { metodo: 'GET' },
  )
  const invitados = leerPagina(r, pagina, POR_PAGINA, porNombre)

  return (
    <div className={gestion.pagina}>
      <Encabezado
        titulo="Invitados registrados"
        descripcion="Todas las personas que los residentes han autorizado, vigentes o no. Para registrar un ingreso, consulta su acceso."
        volverHref="/vigilante"
        volverTexto="Portería"
      />

      <Panel
        titulo="Invitados"
        nota={r.ok ? `${invitados.total} ${invitados.total === 1 ? 'invitado' : 'invitados'}, por nombre.` : undefined}
      >
        {!r.ok ? (
          <EstadoResultado resultado={r} porDefecto="No se pudieron cargar los invitados." />
        ) : invitados.items.length === 0 ? (
          <Vacio>Ningún residente ha registrado invitados.</Vacio>
        ) : (
          <>
            <div className={gestion.tablaMarco}>
              <table className={gestion.tabla} data-cards>
                <caption className="sr-only">Invitados registrados en el conjunto</caption>
                <thead>
                  <tr>
                    <th scope="col">Nombre</th>
                    <th scope="col">Identificación</th>
                    <th scope="col">Autorizado hasta</th>
                    <th scope="col">Estado</th>
                    <th scope="col">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invitados.items.map((i) => (
                    <tr key={i.id}>
                      <td className={`t-voz ${gestion.nombre} ${gestion.celdaPrincipal}`}>{i.nombreCompleto}</td>
                      <td className="t-columna" data-label="Identificación">
                        {i.identificacion}
                      </td>
                      <td className="t-nota" data-label="Autorizado hasta">
                        {i.venceAutorizacion ? fechaLarga(i.venceAutorizacion) : 'Sin vencimiento'}
                      </td>
                      <td data-label="Estado">
                        <span className="chip" data-tone={i.vigente ? 'ok' : 'neutral'}>
                          {i.vigente ? <UserCheck aria-hidden="true" /> : <Clock aria-hidden="true" />}
                          {i.vigente ? 'Vigente' : i.active === false ? 'Inactivo' : 'Vencido'}
                        </span>
                      </td>
                      <td className={gestion.celdaAccion}>
                        <Link
                          href={`/vigilante?identificacion=${i.identificacion}`}
                          prefetch={false}
                          className="btn"
                          data-variant="quiet"
                          data-size="sm"
                          aria-label={`Consultar el acceso de ${i.nombreCompleto}`}
                        >
                          <Search aria-hidden="true" />
                          Consultar acceso
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Paginacion
              pagina={invitados.pagina}
              totalPaginas={invitados.totalPaginas}
              href={(n) => (n === 1 ? '/vigilante/invitados' : `/vigilante/invitados?pagina=${n}`)}
              etiqueta="Páginas de invitados"
            />
          </>
        )}
      </Panel>
    </div>
  )
}
