import { Check, CircleAlert, X } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { BotonAccion, FormularioAccion } from '@/components/gestion/acciones-cliente'
import { Campo, CampoSelect } from '@/components/gestion/campos'
import { Encabezado, EstadoResultado, Paginacion, Panel, Vacio } from '@/components/gestion/piezas'
import styles from '@/components/gestion/gestion.module.css'
import { ChipReserva } from '@/components/ui/chip-reserva'
import { horaLegible } from '@/lib/api/acciones'
import { consultaPagina, leerPagina, listaDe, listado, paginaDeUrl, type Listado } from '@/lib/api/paginacion'
import { diaReserva, horarioReserva, hoyColombia, intervaloReserva, porInicio } from '@/lib/api/reservas'
import { type Disponibilidad, type EstadoReserva, type Reserva, type Zona } from '@/lib/api/tipos'
import { cancelarReserva, reservar } from '@/lib/residente/acciones'
import { RUTAS_API } from '@/lib/auth/config'
import { apiConSesion, requerirSesion } from '@/lib/auth/sesion'

export const metadata: Metadata = { title: 'Mis reservas' }

/** Reservas por página: la lista incluye las finalizadas, así que crece con el tiempo. */
const POR_PAGINA = 8

const ESTADOS: EstadoReserva[] = ['PROGRAMADA', 'EN_CURSO', 'FINALIZADA']

const FILTRO_TEXTO: Record<EstadoReserva, string> = {
  PROGRAMADA: 'Programadas',
  EN_CURSO: 'En curso',
  FINALIZADA: 'Finalizadas',
}

type Params = {
  zonaComunId?: string
  fecha?: string
  inicio?: string
  fin?: string
  estado?: string
  pagina?: string
}

type Props = { searchParams: Promise<Params> }

/** URL de esta página conservando los demás parámetros. */
function enlace(params: Params, cambios: Partial<Params>) {
  const q = new URLSearchParams()
  for (const [clave, valor] of Object.entries({ ...params, ...cambios })) {
    if (valor) q.set(clave, valor)
  }
  return q.size ? `/residente/reservas?${q}` : '/residente/reservas'
}

export default async function ReservasPage({ searchParams }: Props) {
  await requerirSesion('residente')
  const params = await searchParams
  const hoy = hoyColombia()

  const estado = ESTADOS.includes(params.estado as EstadoReserva) ? (params.estado as EstadoReserva) : undefined
  const pagina = paginaDeUrl(params.pagina)

  // Consulta de disponibilidad (opcional): solo si el residente eligió zona, día y horas.
  const zonaConsulta = Number(params.zonaComunId)
  const intervaloConsulta = intervaloReserva(params.fecha ?? '', params.inicio ?? '', params.fin ?? '')

  const consultaReservas = consultaPagina(pagina, POR_PAGINA)
  if (estado) consultaReservas.set('estado', estado)

  const [zonasR, reservasR, disponibilidadR] = await Promise.all([
    apiConSesion<Listado<Zona>>('residente', listado(RUTAS_API.zonasResidente), { metodo: 'GET' }),
    apiConSesion<Listado<Reserva>>('residente', `${RUTAS_API.reservas}?${consultaReservas}`, { metodo: 'GET' }),
    zonaConsulta > 0 && intervaloConsulta
      ? apiConSesion<Disponibilidad>(
          'residente',
          RUTAS_API.disponibilidad(zonaConsulta, intervaloConsulta.inicio, intervaloConsulta.fin),
          { metodo: 'GET' },
        )
      : Promise.resolve(null),
  ])
  const zonas = listaDe(zonasR)
  // Más reciente primero, como las ordena el backend
  const reservas = leerPagina(reservasR, pagina, POR_PAGINA, (a, b) => porInicio(b, a))
  const disponibilidad = disponibilidadR?.ok ? disponibilidadR.datos : null

  const opcionesZona = zonas.map((z) => ({
    valor: z.id,
    texto: `${z.nombreZonaComun} (${horaLegible(z.horaInicio)}–${horaLegible(z.horaFin)})`,
  }))

  return (
    <div className={styles.pagina}>
      <Encabezado
        titulo="Reservas de zonas comunes"
        descripcion="Reserva una zona común por día y horario. Debes estar al día y la zona debe tener cupo en ese intervalo."
        volverHref="/residente"
        volverTexto="Mi apartamento"
      />

      <div className={styles.rejilla}>
        <Panel titulo="Reservar una zona" nota="Todo el intervalo debe caber en el horario de la zona.">
          {!zonasR.ok ? (
            <EstadoResultado resultado={zonasR} porDefecto="No se pudieron cargar las zonas comunes." />
          ) : zonas.length === 0 ? (
            <Vacio>No hay zonas comunes activas asignadas a tu apartamento.</Vacio>
          ) : (
            <FormularioAccion accion={reservar} texto="Reservar">
              <div className={styles.rejilla}>
                <CampoSelect nombre="zonaComunId" etiqueta="Zona común" opciones={opcionesZona} requerido ancho />
                <Campo nombre="fecha" etiqueta="Día" tipo="date" min={hoy} valor={hoy} requerido ancho />
                <Campo nombre="inicio" etiqueta="Desde" tipo="time" requerido />
                <Campo
                  nombre="fin"
                  etiqueta="Hasta"
                  tipo="time"
                  requerido
                  ayuda="Si es más temprano que la hora de inicio, termina al día siguiente."
                />
              </div>
            </FormularioAccion>
          )}
        </Panel>

        <Panel titulo="Consultar disponibilidad" nota="Revisa horario, reglas y cupo sin reservar.">
          <form method="get" className={styles.formulario}>
            {estado && <input type="hidden" name="estado" value={estado} />}
            <div className={styles.rejilla}>
              <div className={`${styles.grupo} ${styles.ancho}`}>
                <label htmlFor="consulta-zona" className={styles.etiqueta}>
                  Zona común
                </label>
                <select
                  id="consulta-zona"
                  name="zonaComunId"
                  className={styles.entrada}
                  defaultValue={zonaConsulta > 0 ? String(zonaConsulta) : ''}
                  required
                  disabled={zonas.length === 0}
                >
                  <option value="">Elige…</option>
                  {zonas.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.nombreZonaComun}
                    </option>
                  ))}
                </select>
              </div>
              <div className={`${styles.grupo} ${styles.ancho}`}>
                <label htmlFor="consulta-fecha" className={styles.etiqueta}>
                  Día
                </label>
                <input
                  id="consulta-fecha"
                  name="fecha"
                  type="date"
                  min={hoy}
                  className={styles.entrada}
                  defaultValue={params.fecha ?? hoy}
                  required
                />
              </div>
              <div className={styles.grupo}>
                <label htmlFor="consulta-inicio" className={styles.etiqueta}>
                  Desde
                </label>
                <input
                  id="consulta-inicio"
                  name="inicio"
                  type="time"
                  className={styles.entrada}
                  defaultValue={params.inicio ?? ''}
                  required
                />
              </div>
              <div className={styles.grupo}>
                <label htmlFor="consulta-fin" className={styles.etiqueta}>
                  Hasta
                </label>
                <input
                  id="consulta-fin"
                  name="fin"
                  type="time"
                  className={styles.entrada}
                  defaultValue={params.fin ?? ''}
                  required
                />
              </div>
            </div>
            <div className={styles.pie}>
              <button type="submit" className="btn" data-variant="secondary" disabled={zonas.length === 0}>
                Consultar
              </button>
              {disponibilidadR && (
                <Link href={enlace({ estado }, {})} prefetch={false} className="btn" data-variant="quiet">
                  Limpiar
                </Link>
              )}
            </div>
          </form>

          {disponibilidadR && !disponibilidadR.ok ? (
            <EstadoResultado resultado={disponibilidadR} porDefecto="No se pudo consultar la disponibilidad." />
          ) : disponibilidad && intervaloConsulta ? (
            <div className={`${styles.consulta} ${styles.notaSuelta}`} data-permitido={disponibilidad.disponible}>
              <p className={styles.consultaTitulo}>
                {disponibilidad.disponible ? <Check aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}
                {disponibilidad.disponible ? 'Puedes reservar' : 'No disponible'} ·{' '}
                {diaReserva(intervaloConsulta.inicio, hoy)}, {horarioReserva({
                  fechaHoraInicio: intervaloConsulta.inicio,
                  fechaHoraFin: intervaloConsulta.fin,
                })}
              </p>
              {!disponibilidad.disponible && <p className="t-nota">{disponibilidad.mensaje}</p>}
              <ul className={styles.chequeos}>
                {[
                  ['Horario de la zona', disponibilidad.horarioValido],
                  ['Reglas de reserva', disponibilidad.cumpleReglas],
                  ['Cupo en ese horario', disponibilidad.hayCupo],
                  ['Tu cuenta habilitada', disponibilidad.habilitado],
                ].map(([texto, ok]) => (
                  <li key={String(texto)} data-ok={ok === true}>
                    {ok === true ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}
                    {texto}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Panel>
      </div>

      <Panel
        id="mis-reservas"
        titulo="Mis reservas"
        nota={`${reservas.total} ${reservas.total === 1 ? 'reserva' : 'reservas'}${estado ? ` · ${FILTRO_TEXTO[estado].toLowerCase()}` : ''}${reservas.totalPaginas > 1 ? ` · página ${reservas.pagina} de ${reservas.totalPaginas}` : ''}.`}
      >
        <nav className={`${styles.grupoFiltro} ${styles.filtros}`} aria-label="Filtrar reservas por estado">
          <Link
            href={`${enlace({ ...params, pagina: undefined }, { estado: undefined })}#mis-reservas`}
            prefetch={false}
            className={styles.filtro}
            aria-current={!estado ? 'page' : undefined}
          >
            Todas
          </Link>
          {ESTADOS.map((e) => (
            <Link
              key={e}
              href={`${enlace({ ...params, pagina: undefined }, { estado: e })}#mis-reservas`}
              prefetch={false}
              className={styles.filtro}
              aria-current={estado === e ? 'page' : undefined}
            >
              {FILTRO_TEXTO[e]}
            </Link>
          ))}
        </nav>

        {!reservasR.ok ? (
          <EstadoResultado resultado={reservasR} porDefecto="No se pudieron cargar tus reservas." />
        ) : reservas.items.length === 0 ? (
          <Vacio>{estado ? 'No tienes reservas con ese estado.' : 'Todavía no has hecho reservas.'}</Vacio>
        ) : (
          <div className={styles.tablaMarco}>
            <table className={styles.tabla} data-cards>
              <caption className="sr-only">Tus reservas</caption>
              <thead>
                <tr>
                  <th scope="col">Zona</th>
                  <th scope="col">Día</th>
                  <th scope="col">Horario</th>
                  <th scope="col">Estado</th>
                  <th scope="col">
                    <span className="sr-only">Acción</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {reservas.items.map((r) => (
                  <tr key={r.id}>
                    <td className={`t-voz ${styles.nombre} ${styles.celdaPrincipal}`}>{r.nombreZonaComun}</td>
                    <td className={styles.ahora} data-label="Día">
                      {diaReserva(r.fechaHoraInicio, hoy)}
                    </td>
                    <td className={`t-columna ${styles.ahora}`} data-label="Horario">
                      {horarioReserva(r)}
                    </td>
                    <td data-label="Estado">
                      <ChipReserva estado={r.estado} />
                    </td>
                    <td className={styles.celdaAccion}>
                      {r.cancelable && (
                        <BotonAccion
                          accion={cancelarReserva.bind(null, r.id)}
                          variante="quiet"
                          confirmar={`¿Cancelar tu reserva de ${r.nombreZonaComun}?`}
                        >
                          Cancelar
                        </BotonAccion>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Paginacion
          pagina={reservas.pagina}
          totalPaginas={reservas.totalPaginas}
          href={(n) => `${enlace(params, { pagina: n === 1 ? undefined : String(n) })}#mis-reservas`}
          etiqueta="Páginas de tus reservas"
        />
      </Panel>
    </div>
  )
}
