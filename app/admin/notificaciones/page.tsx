import { Bell, Send, TriangleAlert } from 'lucide-react'
import type { Metadata } from 'next'
import { FormularioAccion } from '@/components/gestion/acciones-cliente'
import { Campo, CampoArea, CampoSelect } from '@/components/gestion/campos'
import { Eliminar } from '@/components/gestion/crud'
import { Encabezado, EstadoResultado, Paginacion, Panel, Vacio } from '@/components/gestion/piezas'
import { PanelPreferencias } from '@/components/gestion/preferencias'
import styles from '@/components/gestion/gestion.module.css'
import {
  TIPO_NOTIFICACION_TEXTO,
  TIPOS_COMUNICADO,
  textoTipoNotificacion,
  type InmuebleResumen,
  type LecturaNotificacion,
  type Notificacion,
  type Preferencias,
} from '@/lib/api/tipos'
import { eliminarNotificacion, enviarNotificacion } from '@/lib/admin/acciones'
import { consultaPagina, leerPagina, listaDe, listado, paginaDeUrl, type Listado } from '@/lib/api/paginacion'
import { RUTAS_API } from '@/lib/auth/config'
import { apiConSesion, requerirSesion } from '@/lib/auth/sesion'

export const metadata: Metadata = { title: 'Comunicados' }

type Props = { searchParams: Promise<{ notificacion?: string; pagina?: string; todas?: string }> }

const INCIDENCIAS_POR_PAGINA = 10
const TODAS_POR_PAGINA = 10

/** Página del listado general de notificaciones, sin perder la consulta de lectura. */
function enlaceTodas(notificacionId: number, pagina: number) {
  const q = new URLSearchParams()
  if (notificacionId > 0) q.set('notificacion', String(notificacionId))
  if (pagina > 1) q.set('todas', String(pagina))
  return `${q.size ? `/admin/notificaciones?${q}` : '/admin/notificaciones'}#todas`
}

function enlaceIncidencias(notificacionId: number, pagina: number) {
  const q = new URLSearchParams()
  if (notificacionId > 0) q.set('notificacion', String(notificacionId))
  if (pagina > 1) q.set('pagina', String(pagina))
  return `${q.size ? `/admin/notificaciones?${q}` : '/admin/notificaciones'}#incidencias`
}

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
  const paginaIncidencias = paginaDeUrl(params.pagina)
  const paginaTodas = paginaDeUrl(params.todas)

  const [inmueblesR, propiasR, lecturaR, incidenciasR, preferenciasR, todasR] = await Promise.all([
    apiConSesion<Listado<InmuebleResumen>>('admin', listado(RUTAS_API.inmuebles), { metodo: 'GET' }),
    apiConSesion<Listado<Notificacion>>('admin', listado(RUTAS_API.notificaciones), { metodo: 'GET' }),
    notificacionId > 0
      ? apiConSesion<LecturaNotificacion>('admin', RUTAS_API.notificacionLectura(notificacionId), {
          metodo: 'GET',
        })
      : Promise.resolve({ ok: true as const, datos: null }),
    apiConSesion<Listado<Notificacion>>(
      'admin',
      `${RUTAS_API.incidencias}?${consultaPagina(paginaIncidencias, INCIDENCIAS_POR_PAGINA)}`,
      { metodo: 'GET' },
    ),
    apiConSesion<Preferencias>('admin', RUTAS_API.preferencias, { metodo: 'GET' }),
    apiConSesion<Listado<Notificacion>>(
      'admin',
      `${RUTAS_API.notificacionesAdmin}?${consultaPagina(paginaTodas, TODAS_POR_PAGINA)}`,
      { metodo: 'GET' },
    ),
  ])

  const inmuebles = listaDe(inmueblesR)
  const propias = listaDe(propiasR)
  const incidencias = leerPagina(incidenciasR, paginaIncidencias, INCIDENCIAS_POR_PAGINA, (a, b) => b.id - a.id)
  const todas = leerPagina(todasR, paginaTodas, TODAS_POR_PAGINA, (a, b) => b.id - a.id)

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
                opciones={TIPOS_COMUNICADO.map((t) => ({ valor: t, texto: TIPO_NOTIFICACION_TEXTO[t] }))}
                ayuda="Solo lo reciben quienes aceptan este tipo en sus preferencias."
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

      <Panel
        titulo="Todas las notificaciones"
        id="todas"
        nota={
          todasR.ok
            ? `${todas.total} ${todas.total === 1 ? 'notificación enviada' : 'notificaciones enviadas'} en el conjunto, las más recientes primero.`
            : 'Comunicados, recordatorios y avisos automáticos del conjunto.'
        }
      >
        {!todasR.ok ? (
          <EstadoResultado resultado={todasR} porDefecto="No se pudieron cargar las notificaciones." />
        ) : todas.items.length === 0 ? (
          <Vacio>Todavía no se ha enviado ninguna notificación.</Vacio>
        ) : (
          <>
            <ul className={styles.fichas}>
              {todas.items.map((n) => (
                <li key={n.id} className={styles.consulta}>
                  <div className={styles.panelCabecera} style={{ marginBottom: 0 }}>
                    <p className={styles.etiqueta}>
                      <Bell aria-hidden="true" style={{ display: 'inline', width: '1rem', height: '1rem' }} />{' '}
                      {textoTipoNotificacion(n.tipoNotificacion)} · N.º {n.id}
                    </p>
                    <div className={styles.accionesCabecera}>
                      <p className="t-nota">{fechaHora(n.fechaEnvio)}</p>
                      <a
                        href={`/admin/notificaciones?notificacion=${n.id}`}
                        className="btn"
                        data-variant="quiet"
                        data-size="sm"
                      >
                        Ver lectura
                      </a>
                      <Eliminar
                        titulo={`Eliminar la notificación N.º ${n.id}`}
                        accion={eliminarNotificacion.bind(null, n.id)}
                        efectos="Desaparece de la bandeja de todos sus destinatarios. Los usuarios e inmuebles siguen existiendo."
                      />
                    </div>
                  </div>
                  <p>{n.mensaje}</p>
                </li>
              ))}
            </ul>
            <Paginacion
              pagina={todas.pagina}
              totalPaginas={todas.totalPaginas}
              href={(n) => enlaceTodas(notificacionId, n)}
              etiqueta="Páginas de notificaciones"
            />
          </>
        )}
      </Panel>

      <Panel
        titulo="Incidencias de portería"
        id="incidencias"
        nota={
          incidenciasR.ok
            ? `${incidencias.total} ${incidencias.total === 1 ? 'incidencia reportada' : 'incidencias reportadas'} por los vigilantes, las más recientes primero.`
            : 'Lo que reportan los vigilantes desde portería.'
        }
      >
        {!incidenciasR.ok ? (
          <EstadoResultado resultado={incidenciasR} porDefecto="No se pudieron cargar las incidencias." />
        ) : incidencias.items.length === 0 ? (
          <Vacio>Portería no ha reportado incidencias.</Vacio>
        ) : (
          <>
            <ul className={styles.fichas}>
              {incidencias.items.map((n) => (
                <li key={n.id} className={`hoja ${styles.ficha}`}>
                  <TriangleAlert aria-hidden="true" />
                  <div className={styles.fichaCuerpo}>
                    <p>{n.mensaje}</p>
                    <p className="t-nota" style={{ marginTop: '0.25rem' }}>
                      {fechaHora(n.fechaEnvio)}
                    </p>
                  </div>
                  <div className={styles.accionesCabecera}>
                    <span className="chip" data-tone="alert">
                      Incidencia
                    </span>
                    <Eliminar
                      titulo="Eliminar la incidencia"
                      accion={eliminarNotificacion.bind(null, n.id)}
                      efectos="La incidencia se borra para todos los administradores."
                    />
                  </div>
                </li>
              ))}
            </ul>
            <Paginacion
              pagina={incidencias.pagina}
              totalPaginas={incidencias.totalPaginas}
              href={(n) => enlaceIncidencias(notificacionId, n)}
              etiqueta="Páginas de incidencias"
            />
          </>
        )}
      </Panel>

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
                    {textoTipoNotificacion(n.tipoNotificacion)}
                  </p>
                  <p className="t-nota">{fechaHora(n.fechaEnvio)}</p>
                </div>
                <p>{n.mensaje}</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <PanelPreferencias
        modulo="admin"
        resultado={preferenciasR}
        tipos={TIPOS_COMUNICADO}
        nota="Las incidencias de portería te llegan siempre, sin importar lo que elijas aquí."
      />

      <p className="t-nota">
        <Send aria-hidden="true" style={{ display: 'inline', width: '1rem', height: '1rem' }} /> Los recordatorios de
        pago también se envían desde el detalle de cada inmueble.
      </p>
    </div>
  )
}
