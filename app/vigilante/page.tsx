import { Car, Check, Clock, LogIn, Search, ShieldCheck, ShieldX, UserCheck } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { BotonAccion } from '@/components/gestion/acciones-cliente'
import { EstadoResultado, Panel, Vacio } from '@/components/gestion/piezas'
import { AppShell } from '@/components/shell/app-shell'
import gestion from '@/components/gestion/gestion.module.css'
import { horaLegible } from '@/lib/api/acciones'
import type { Acceso, Anfitrion, Duenos, InvitadoConsulta, Reserva } from '@/lib/api/tipos'
import { registrarIngreso } from '@/lib/vigilante/acciones'
import { RUTAS_API } from '@/lib/auth/config'
import { apiConSesion, requerirSesion } from '@/lib/auth/sesion'

export const metadata: Metadata = { title: 'Portería' }

type Props = { searchParams: Promise<{ identificacion?: string; autoId?: string; inmuebleId?: string }> }

export default async function SecurityPage({ searchParams }: Props) {
  const { nombre } = await requerirSesion('vigilante')
  const params = await searchParams

  const identificacion = /^\d+$/.test(params.identificacion ?? '') ? Number(params.identificacion) : 0
  const autoId = /^\d+$/.test(params.autoId ?? '') ? Number(params.autoId) : 0
  const inmuebleId = /^\d+$/.test(params.inmuebleId ?? '') ? Number(params.inmuebleId) : 0

  // Siempre: las reservas de hoy. Bajo demanda: la consulta de acceso y la de dueños de un auto.
  const [reservasR, accesoR, invitadoR, duenosR] = await Promise.all([
    apiConSesion<Reserva[]>('vigilante', RUTAS_API.vigilanteReservas, { metodo: 'GET' }),
    identificacion
      ? apiConSesion<Acceso>('vigilante', RUTAS_API.vigilanteAcceso(identificacion), { metodo: 'GET' })
      : Promise.resolve(null),
    identificacion
      ? apiConSesion<InvitadoConsulta>('vigilante', RUTAS_API.vigilanteInvitado(identificacion), { metodo: 'GET' })
      : Promise.resolve(null),
    autoId
      ? apiConSesion<Duenos>('vigilante', RUTAS_API.autoDuenos(autoId, inmuebleId || undefined), { metodo: 'GET' })
      : Promise.resolve(null),
  ])

  const reservas =
    reservasR.ok && Array.isArray(reservasR.datos)
      ? [...reservasR.datos].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
      : []
  const acceso = accesoR?.ok ? accesoR.datos : null
  const invitado = invitadoR?.ok ? invitadoR.datos : null

  // Si la persona consultada es un invitado conocido, mostramos a qué residentes visita.
  const anfitrionesR =
    invitado?.invitado?.id
      ? await apiConSesion<Anfitrion[]>('vigilante', RUTAS_API.invitadoAnfitriones(invitado.invitado.id), {
          metodo: 'GET',
        })
      : null
  const anfitriones = anfitrionesR?.ok && Array.isArray(anfitrionesR.datos) ? anfitrionesR.datos : []
  const duenos = duenosR?.ok ? duenosR.datos : null

  return (
    <AppShell usuario={{ nombre, rol: 'Vigilante' }}>
      <div className={gestion.pagina}>
        <header className={gestion.cabecera}>
          <div className={gestion.titulo}>
            <h1 className="t-title">Portería</h1>
            <p className={gestion.sub}>
              Consulta si una persona puede ingresar, registra el ingreso de invitados y revisa las reservas de hoy.
            </p>
          </div>
        </header>

        {/* ---------- Control de acceso ---------- */}
        <Panel titulo="Control de acceso" nota="Escribe la identificación de la persona en la entrada.">
          <form method="get" className={gestion.enLinea} style={{ marginBottom: acceso || invitado ? '1.25rem' : 0 }}>
            <div className={gestion.grupo}>
              <label htmlFor="acceso-id" className={gestion.etiqueta}>
                Identificación
              </label>
              <input
                id="acceso-id"
                name="identificacion"
                type="text"
                inputMode="numeric"
                pattern="\d*"
                className={gestion.entrada}
                defaultValue={identificacion || ''}
                placeholder="Número de documento"
                required
              />
            </div>
            <button type="submit" className="btn" data-variant="primary">
              <Search aria-hidden="true" />
              Consultar
            </button>
            {(identificacion > 0 || autoId > 0) && (
              <Link href="/vigilante" prefetch={false} className="btn" data-variant="quiet">
                Limpiar
              </Link>
            )}
          </form>

          {accesoR && !accesoR.ok && accesoR.status !== 404 && (
            <EstadoResultado resultado={accesoR} porDefecto="No se pudo consultar el acceso." />
          )}

          {identificacion > 0 && accesoR && (accesoR.ok || accesoR.status === 404) && (
            <div className={gestion.consulta} data-permitido={acceso?.permitido ?? false} style={{ marginBottom: '1rem' }}>
              <p style={{ fontWeight: 650, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {acceso?.permitido ? (
                  <>
                    <ShieldCheck aria-hidden="true" style={{ width: '1.25rem' }} />
                    Puede ingresar{acceso.nombreCompleto ? `: ${acceso.nombreCompleto}` : ''}
                  </>
                ) : (
                  <>
                    <ShieldX aria-hidden="true" style={{ width: '1.25rem' }} />
                    No puede ingresar ahora{acceso?.nombreCompleto ? `: ${acceso.nombreCompleto}` : ''}
                  </>
                )}
              </p>
              <p className="t-nota">{acceso?.motivo || 'No se encontró una autorización de acceso para este documento.'}</p>
              {acceso && acceso.zonasPermitidas.length > 0 && (
                <ul className="t-nota" style={{ display: 'grid', gap: '0.25rem', paddingLeft: '1.125rem', listStyle: 'disc' }}>
                  {acceso.zonasPermitidas.map((z) => (
                    <li key={z.zonaComunId}>
                      {z.nombreZonaComun}: {horaLegible(z.horaInicio)} a {horaLegible(z.horaFin)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {invitado && (
            <div className="hoja" style={{ padding: '1rem 1.25rem' }}>
              <div className={gestion.panelCabecera}>
                <div>
                  <h3 className="t-section">Invitado</h3>
                  <p className="t-nota">
                    {invitado.existe
                      ? invitado.vigente
                        ? 'Registrado y con autorización vigente.'
                        : 'Registrado, pero su autorización no está vigente.'
                      : 'No figura como invitado de ningún residente.'}
                  </p>
                </div>
                {invitado.existe && (
                  <span className="chip" data-tone={invitado.vigente ? 'ok' : 'neutral'}>
                    {invitado.vigente ? <UserCheck aria-hidden="true" /> : <Clock aria-hidden="true" />}
                    {invitado.vigente ? 'Vigente' : 'Inactiva'}
                  </span>
                )}
              </div>

              {invitado.invitado && (
                <dl className={gestion.datos}>
                  <div>
                    <dt>Nombre</dt>
                    <dd>{invitado.invitado.nombreCompleto}</dd>
                  </div>
                  <div>
                    <dt>Identificación</dt>
                    <dd>{invitado.invitado.identificacion}</dd>
                  </div>
                  {anfitriones.length > 0 && (
                    <div>
                      <dt>Visita a</dt>
                      <dd>{anfitriones.map((a) => `${a.nombreCompleto} (${a.direccionInmueble})`).join(', ')}</dd>
                    </div>
                  )}
                </dl>
              )}

              {invitado.existe && (
                <div className={gestion.pie}>
                  <BotonAccion accion={registrarIngreso.bind(null, identificacion)} variante="primary" tamano="sm">
                    <LogIn aria-hidden="true" />
                    Registrar ingreso
                  </BotonAccion>
                </div>
              )}
            </div>
          )}
        </Panel>

        {/* ---------- Dueños de un auto ---------- */}
        <Panel titulo="¿De quién es este auto?" nota="Consulta los dueños registrados de un vehículo por su identificador.">
          <form method="get" className={gestion.enLinea} style={{ marginBottom: duenos ? '1.25rem' : 0 }}>
            <div className={gestion.grupo}>
              <label htmlFor="auto-id" className={gestion.etiqueta}>
                Id del auto
              </label>
              <input
                id="auto-id"
                name="autoId"
                type="text"
                inputMode="numeric"
                pattern="\d*"
                className={gestion.entrada}
                defaultValue={autoId || ''}
                required
              />
            </div>
            <div className={gestion.grupo}>
              <label htmlFor="auto-inmueble" className={gestion.etiqueta}>
                Inmueble <span className={gestion.opcional}>(opcional)</span>
              </label>
              <input
                id="auto-inmueble"
                name="inmuebleId"
                type="text"
                inputMode="numeric"
                pattern="\d*"
                className={gestion.entrada}
                defaultValue={inmuebleId || ''}
              />
            </div>
            <button type="submit" className="btn" data-variant="secondary">
              <Car aria-hidden="true" />
              Consultar
            </button>
          </form>

          {duenosR && !duenosR.ok && duenosR.status !== 404 && (
            <EstadoResultado resultado={duenosR} porDefecto="No se pudo consultar el auto." />
          )}
          {duenos &&
            (duenos.duenos.length > 0 ? (
              <ul style={{ display: 'grid', gap: '0.5rem' }}>
                {duenos.duenos.map((d) => (
                  <li key={d.id} className="hoja" style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                    <span className="t-voz">{d.nombreCompleto}</span>
                    <span className="t-nota">{d.direccionInmueble}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <Vacio>Ese auto no tiene dueños registrados.</Vacio>
            ))}
        </Panel>

        {/* ---------- Reservas de hoy ---------- */}
        <Panel titulo="Reservas de hoy" nota={`${reservas.length} ${reservas.length === 1 ? 'reserva' : 'reservas'} en las zonas comunes.`}>
          {!reservasR.ok ? (
            <EstadoResultado resultado={reservasR} porDefecto="No se pudieron cargar las reservas." />
          ) : reservas.length === 0 ? (
            <Vacio>No hay reservas registradas.</Vacio>
          ) : (
            <div className={gestion.tablaMarco}>
              <table className={gestion.tabla}>
                <caption className="sr-only">Reservas de zonas comunes</caption>
                <thead>
                  <tr>
                    <th scope="col">Horario</th>
                    <th scope="col">Zona</th>
                    <th scope="col">Reservó</th>
                    <th scope="col">Apartamento</th>
                    <th scope="col">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {reservas.map((r) => (
                    <tr key={r.id}>
                      <td className={gestion.ahora}>
                        {horaLegible(r.horaInicio)} a {horaLegible(r.horaFin)}
                      </td>
                      <td className={`t-voz ${gestion.nombre}`}>{r.nombreZonaComun}</td>
                      <td>{r.nombreDueno}</td>
                      <td className={gestion.ahora}>{r.direccionInmueble}</td>
                      <td>
                        {r.enCurso ? (
                          <span className="chip" data-tone="info">
                            <Clock aria-hidden="true" />
                            En curso
                          </span>
                        ) : (
                          <span className="chip" data-tone="neutral">
                            <Check aria-hidden="true" />
                            Programada
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </AppShell>
  )
}
