import { Bell, Send } from 'lucide-react'
import type { Metadata } from 'next'
import { FormularioAccion } from '@/components/gestion/acciones-cliente'
import { Campo, CampoArea, CampoSelect } from '@/components/gestion/campos'
import { Encabezado, EstadoResultado, Panel, Vacio } from '@/components/gestion/piezas'
import styles from '@/components/gestion/gestion.module.css'
import type {
  InmuebleResumen,
  LecturaNotificacion,
  Notificacion,
} from '@/lib/api/tipos'
import { enviarNotificacion } from '@/lib/admin/acciones'
import { listaDe, listado, type Listado } from '@/lib/api/paginacion'
import { RUTAS_API } from '@/lib/auth/config'
import { apiConSesion, requerirSesion } from '@/lib/auth/sesion'

export const metadata: Metadata = { title: 'Comunicados' }

type Props = { searchParams: Promise<{ notificacion?: string }> }

function fechaHora(valor: string) {
  if (!valor) return '—'
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return valor
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Bogota',
  }).format(fecha)
}

export default async function NotificacionesAdminPage({ searchParams }: Props) {
  await requerirSesion('admin')
  const params = await searchParams
  const notificacionId = Number(params.notificacion)

  const [inmueblesR, propiasR, lecturaR] = await Promise.all([
    apiConSesion<Listado<InmuebleResumen>>('admin', listado(RUTAS_API.inmuebles), { metodo: 'GET' }),
    apiConSesion<Listado<Notificacion>>('admin', listado(RUTAS_API.notificaciones), { metodo: 'GET' }),
    notificacionId > 0
      ? apiConSesion<LecturaNotificacion>('admin', RUTAS_API.notificacionLectura(notificacionId), {
          metodo: 'GET',
        })
      : Promise.resolve({ ok: true as const, datos: null }),
  ])

  const inmuebles = listaDe(inmueblesR)
  const propias = listaDe(propiasR)

  return (
    <div className={styles.pagina}>
      <Encabezado
        titulo="Comunicados y notificaciones"
        descripcion="Envía un mensaje a todos los residentes, a un inmueble o a usuarios concretos. Aquí también ves tus propias notificaciones."
      />

      <div className={styles.rejilla}>
        <Panel titulo="Nuevo comunicado" nota="Si no indicas destinatarios, lo reciben todos los residentes activos.">
          <FormularioAccion accion={enviarNotificacion} texto="Enviar comunicado">
            <CampoArea
              nombre="mensaje"
              etiqueta="Mensaje"
              requerido
              maxLength={500}
              filas={4}
              placeholder="Escribe el comunicado para la comunidad."
            />
            <div className={styles.rejilla}>
              <CampoSelect
                nombre="tipoNotificacion"
                etiqueta="Tipo"
                valor="GENERAL"
                opciones={[
                  { valor: 'GENERAL', texto: 'General' },
                  { valor: 'PAGO', texto: 'Pago' },
                  { valor: 'RESERVA', texto: 'Reserva' },
                  { valor: 'SEGURIDAD', texto: 'Seguridad' },
                ]}
              />
              <CampoSelect
                nombre="inmuebleId"
                etiqueta="Un inmueble"
                opciones={inmuebles.map((i) => ({ valor: i.id, texto: i.direccionInmueble }))}
                opcional
                ayuda="Sus residentes activos recibirán el mensaje."
              />
              <Campo
                nombre="usuarioIds"
                etiqueta="Usuarios concretos"
                opcional
                ancho
                placeholder="1, 2, 3"
                ayuda="IDs de usuario separados por comas. Tiene prioridad sobre el inmueble."
              />
            </div>
          </FormularioAccion>
        </Panel>

        <Panel titulo="Confirmación de lectura" nota="Consulta cuántos destinatarios leyeron un comunicado.">
          <form method="get" className={styles.enLinea}>
            <div className={styles.grupo}>
              <label htmlFor="notificacion" className={styles.etiqueta}>
                ID del comunicado
              </label>
              <input
                id="notificacion"
                name="notificacion"
                type="number"
                min={1}
                className={styles.entrada}
                defaultValue={notificacionId > 0 ? notificacionId : ''}
                placeholder="Por ejemplo 12"
              />
            </div>
            <button type="submit" className="btn" data-variant="secondary">
              Consultar
            </button>
          </form>

          {notificacionId > 0 &&
            (lecturaR.ok && lecturaR.datos ? (
              <div className={styles.consulta} style={{ marginTop: '1rem' }}>
                <h3 className="t-section">Comunicado {lecturaR.datos.notificacionId}</h3>
                <div className={styles.rejilla}>
                  <div>
                    <p className={styles.etiqueta}>Leídos ({lecturaR.datos.leidos.length})</p>
                    {lecturaR.datos.leidos.length ? (
                      <ul className="t-nota" style={{ paddingLeft: '1.125rem', listStyle: 'disc' }}>
                        {lecturaR.datos.leidos.map((d) => (
                          <li key={d.usuarioId}>{d.nombreCompleto}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="t-nota">Nadie lo ha leído todavía.</p>
                    )}
                  </div>
                  <div>
                    <p className={styles.etiqueta}>Pendientes ({lecturaR.datos.pendientes.length})</p>
                    {lecturaR.datos.pendientes.length ? (
                      <ul className="t-nota" style={{ paddingLeft: '1.125rem', listStyle: 'disc' }}>
                        {lecturaR.datos.pendientes.map((d) => (
                          <li key={d.usuarioId}>{d.nombreCompleto}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="t-nota">Todos lo leyeron.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              !lecturaR.ok && <EstadoResultado resultado={lecturaR} porDefecto="No se pudo consultar la lectura." />
            ))}
        </Panel>
      </div>

      <Panel titulo="Tus notificaciones" nota="Mensajes que ha recibido tu cuenta.">
        {!propiasR.ok ? (
          <EstadoResultado resultado={propiasR} porDefecto="No se pudieron cargar tus notificaciones." />
        ) : propias.length === 0 ? (
          <Vacio>No tienes notificaciones.</Vacio>
        ) : (
          <ul className={styles.fichas}>
            {propias.map((n) => (
              <li key={n.id} className={styles.consulta}>
                <div className={styles.panelCabecera} style={{ marginBottom: 0 }}>
                  <p className={styles.etiqueta}>
                    <Bell aria-hidden="true" style={{ display: 'inline', width: '1rem', height: '1rem' }} />{' '}
                    {n.tipoNotificacion}
                  </p>
                  <p className="t-nota">{fechaHora(n.fechaEnvio)}</p>
                </div>
                <p>{n.mensaje}</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <p className="t-nota">
        <Send aria-hidden="true" style={{ display: 'inline', width: '1rem', height: '1rem' }} /> Los recordatorios de
        pago también se envían desde el detalle de cada inmueble.
      </p>
    </div>
  )
}
