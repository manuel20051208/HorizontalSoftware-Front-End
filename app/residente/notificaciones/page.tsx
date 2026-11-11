import { Bell } from 'lucide-react'
import type { Metadata } from 'next'
import { BotonAccion } from '@/components/gestion/acciones-cliente'
import { Encabezado, EstadoResultado, Panel, Vacio } from '@/components/gestion/piezas'
import styles from '@/components/gestion/gestion.module.css'
import type { Notificacion } from '@/lib/api/tipos'
import { marcarNotificacionesLeidas } from '@/lib/cuenta/acciones'
import { listaDe, listado, type Listado } from '@/lib/api/paginacion'
import { RUTAS_API } from '@/lib/auth/config'
import { apiConSesion, requerirSesion } from '@/lib/auth/sesion'

export const metadata: Metadata = { title: 'Mis avisos' }

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

export default async function NotificacionesResidentePage() {
  await requerirSesion('residente')
  const r = await apiConSesion<Listado<Notificacion>>('residente', listado(RUTAS_API.notificaciones), { metodo: 'GET' })
  const notificaciones = listaDe(r).sort((a, b) => b.id - a.id)

  return (
    <div className={styles.pagina}>
      <Encabezado
        titulo="Avisos de la administración"
        descripcion="Mensajes y comunicados que la administración ha enviado a tu cuenta."
        volverHref="/residente"
        volverTexto="Mi apartamento"
      />

      <Panel
        titulo="Todos tus avisos"
        nota={`${notificaciones.length} ${notificaciones.length === 1 ? 'aviso' : 'avisos'}.`}
        acciones={
          notificaciones.length > 0 ? (
            <BotonAccion accion={marcarNotificacionesLeidas.bind(null, 'residente')} variante="secondary">
              Marcar todo como leído
            </BotonAccion>
          ) : undefined
        }
      >
        {!r.ok ? (
          <EstadoResultado resultado={r} porDefecto="No se pudieron cargar tus avisos." />
        ) : notificaciones.length === 0 ? (
          <Vacio>No tienes avisos todavía.</Vacio>
        ) : (
          <ul className={styles.fichas}>
            {notificaciones.map((n) => (
              <li key={n.id} className={`hoja ${styles.ficha}`}>
                <Bell aria-hidden="true" />
                <div className={styles.fichaCuerpo}>
                  <p>{n.mensaje}</p>
                  <p className="t-nota" style={{ marginTop: '0.25rem' }}>
                    {fechaHora(n.fechaEnvio)}
                  </p>
                </div>
                <span className="chip" data-tone="info">
                  {n.tipoNotificacion}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
