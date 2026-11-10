import { Check, CircleAlert, Clock } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { BotonAccion, FormularioAccion } from '@/components/gestion/acciones-cliente'
import { Campo, CampoSelect } from '@/components/gestion/campos'
import { Encabezado, EstadoResultado, Panel, Vacio } from '@/components/gestion/piezas'
import styles from '@/components/gestion/gestion.module.css'
import { horaLegible } from '@/lib/api/acciones'
import type { Disponibilidad, Reserva, Zona } from '@/lib/api/tipos'
import { cancelarReserva, reservar } from '@/lib/residente/acciones'
import { RUTAS_API } from '@/lib/auth/config'
import { apiConSesion, requerirSesion } from '@/lib/auth/sesion'

export const metadata: Metadata = { title: 'Mis reservas' }

type Props = { searchParams: Promise<{ zonaComunId?: string; hora?: string }> }

export default async function ReservasPage({ searchParams }: Props) {
  await requerirSesion('residente')
  const params = await searchParams
  const zonaConsulta = Number(params.zonaComunId)
  const horaConsulta = /^\d{2}:\d{2}$/.test(params.hora ?? '') ? params.hora! : ''

  const [zonasR, reservasR] = await Promise.all([
    apiConSesion<Zona[]>('residente', RUTAS_API.zonasResidente, { metodo: 'GET' }),
    apiConSesion<Reserva[]>('residente', RUTAS_API.reservas, { metodo: 'GET' }),
  ])
  const zonas = zonasR.ok && Array.isArray(zonasR.datos) ? zonasR.datos : []
  const reservas =
    reservasR.ok && Array.isArray(reservasR.datos)
      ? [...reservasR.datos].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
      : []

  // Consulta de disponibilidad (opcional): solo si el residente eligió zona y hora.
  const disponibilidadR =
    zonaConsulta > 0 && horaConsulta
      ? await apiConSesion<Disponibilidad>('residente', RUTAS_API.disponibilidad(zonaConsulta, horaConsulta), {
          metodo: 'GET',
        })
      : null
  const disponibilidad = disponibilidadR?.ok ? disponibilidadR.datos : null

  return (
    <div className={styles.pagina}>
      <Encabezado
        titulo="Reservas de zonas comunes"
        descripcion="Reserva las zonas comunes de tu torre. Debes estar al día y la zona debe tener cupo en el horario."
        volverHref="/residente"
        volverTexto="Mi apartamento"
      />

      <div className={styles.rejilla}>
        <Panel titulo="Reservar una zona" nota="La hora debe caer dentro del horario de la zona.">
          {!zonasR.ok ? (
            <EstadoResultado resultado={zonasR} porDefecto="No se pudieron cargar las zonas comunes." />
          ) : zonas.length === 0 ? (
            <Vacio>No hay zonas comunes activas asignadas a tu apartamento.</Vacio>
          ) : (
            <FormularioAccion accion={reservar} texto="Reservar">
              <div className={styles.rejilla}>
                <CampoSelect
                  nombre="zonaComunId"
                  etiqueta="Zona común"
                  opciones={zonas.map((z) => ({
                    valor: z.id,
                    texto: `${z.nombreZonaComun} (${horaLegible(z.horaInicio)}–${horaLegible(z.horaFin)})`,
                  }))}
                  requerido
                  ancho
                />
                <Campo nombre="hora" etiqueta="Hora" tipo="time" requerido ancho />
              </div>
            </FormularioAccion>
          )}
        </Panel>

        <Panel titulo="Consultar disponibilidad" nota="Verifica cupo y horario antes de reservar.">
          <form method="get" className={styles.formulario} style={{ padding: 0, boxShadow: 'none', background: 'transparent' }}>
            <div className={styles.rejilla}>
              <div className={styles.grupo}>
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
              <div className={styles.grupo}>
                <label htmlFor="consulta-hora" className={styles.etiqueta}>
                  Hora
                </label>
                <input
                  id="consulta-hora"
                  name="hora"
                  type="time"
                  className={styles.entrada}
                  defaultValue={horaConsulta}
                  required
                />
              </div>
            </div>
            <div className={styles.pie}>
              <button type="submit" className="btn" data-variant="secondary" disabled={zonas.length === 0}>
                Consultar
              </button>
              {disponibilidad && (
                <Link href="/residente/reservas" prefetch={false} className="btn" data-variant="quiet">
                  Limpiar
                </Link>
              )}
            </div>
          </form>

          {disponibilidadR && !disponibilidadR.ok ? (
            <EstadoResultado resultado={disponibilidadR} porDefecto="No se pudo consultar la disponibilidad." />
          ) : disponibilidad ? (
            <div className={styles.consulta} data-permitido={disponibilidad.disponible && disponibilidad.habilitado}>
              <p style={{ fontWeight: 650 }}>
                {disponibilidad.disponible && disponibilidad.habilitado ? (
                  <>
                    <Check aria-hidden="true" style={{ display: 'inline', width: '1.1rem', verticalAlign: '-0.2rem' }} />{' '}
                    Puedes reservar a las {horaLegible(disponibilidad.hora)}
                  </>
                ) : (
                  <>
                    <CircleAlert aria-hidden="true" style={{ display: 'inline', width: '1.1rem', verticalAlign: '-0.2rem' }} />{' '}
                    No disponible a las {horaLegible(disponibilidad.hora)}
                  </>
                )}
              </p>
              <p className="t-nota">{disponibilidad.mensaje}</p>
            </div>
          ) : null}
        </Panel>
      </div>

      <Panel titulo="Mis reservas" nota={`${reservas.length} ${reservas.length === 1 ? 'reserva' : 'reservas'}.`}>
        {!reservasR.ok ? (
          <EstadoResultado resultado={reservasR} porDefecto="No se pudieron cargar tus reservas." />
        ) : reservas.length === 0 ? (
          <Vacio>No tienes reservas activas.</Vacio>
        ) : (
          <div className={styles.tablaMarco}>
            <table className={styles.tabla} data-cards>
              <caption className="sr-only">Tus reservas</caption>
              <thead>
                <tr>
                  <th scope="col">Zona</th>
                  <th scope="col">Horario</th>
                  <th scope="col">Estado</th>
                  <th scope="col">
                    <span className="sr-only">Acción</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {reservas.map((r) => (
                  <tr key={r.id}>
                    <td className={`t-voz ${styles.nombre} ${styles.celdaPrincipal}`}>{r.nombreZonaComun}</td>
                    <td className={styles.ahora} data-label="Horario">
                      {horaLegible(r.horaInicio)} a {horaLegible(r.horaFin)}
                    </td>
                    <td data-label="Estado">
                      {r.enCurso ? (
                        <span className="chip" data-tone="info">
                          <Clock aria-hidden="true" />
                          En curso
                        </span>
                      ) : (
                        <span className="chip" data-tone="ok">
                          <Check aria-hidden="true" />
                          Confirmada
                        </span>
                      )}
                    </td>
                    <td className={styles.celdaAccion}>
                      <BotonAccion
                        accion={cancelarReserva.bind(null, r.id)}
                        variante="quiet"
                        confirmar={`¿Cancelar tu reserva de ${r.nombreZonaComun}?`}
                      >
                        Cancelar
                      </BotonAccion>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  )
}
