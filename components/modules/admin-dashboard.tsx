'use client'

import {
  Bell,
  Check,
  CircleAlert,
  Clock,
  Receipt,
  RotateCcw,
  Wallet,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import { Chip } from '@/components/ui/chip'
import { fechaLarga, pesos } from '@/lib/api/acciones'
import {
  ESTADO_TRANSACCION_TEXTO,
  type EstadoTransaccion,
  type InmuebleResumen,
  type Notificacion,
  type Pago,
  type ResumenAdmin,
} from '@/lib/api/tipos'
import { useHoy } from '@/lib/use-hoy'
import styles from './admin-dashboard.module.css'
import { TowerPlan } from './tower-plan'

const TONO_PAGO: Record<EstadoTransaccion, 'ok' | 'wait' | 'alert' | 'neutral'> = {
  APROBADO: 'ok',
  PENDIENTE: 'wait',
  RECHAZADO: 'alert',
  ANULADO: 'alert',
  REEMBOLSADO: 'neutral',
}

const ICONO_PAGO = {
  APROBADO: Check,
  PENDIENTE: Clock,
  RECHAZADO: XCircle,
  ANULADO: XCircle,
  REEMBOLSADO: RotateCcw,
} as const

function mesDelPeriodo(periodo: string) {
  const fecha = new Date(`${periodo.slice(0, 10)}T00:00:00Z`)
  if (Number.isNaN(fecha.getTime())) return periodo
  const texto = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(fecha)
  return texto.charAt(0).toUpperCase() + texto.slice(1)
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

export function AdminDashboard({
  resumen,
  inmuebles,
  pagos,
  usuariosInactivos,
  notificaciones,
  resumenError,
}: {
  resumen: ResumenAdmin
  inmuebles: InmuebleResumen[]
  pagos: Pago[]
  usuariosInactivos: number
  notificaciones: Notificacion[]
  resumenError: boolean
}) {
  const hoy = useHoy()
  const recaudo = pesos(resumen.recaudoMes)
  const ultimosPagos = pagos.slice(0, 6)
  const ultimosAvisos = notificaciones.slice(0, 4)

  return (
    <div className={styles.pagina}>
      <header className={styles.cabecera}>
        <div className={styles.titulo}>
          <p className="t-rotulo">{hoy || 'Panel de administración'}</p>
          <h1 className="t-title">Tu conjunto, en orden.</h1>
          <p className={styles.sub}>
            Recaudo, cartera y movimientos del periodo <strong>{mesDelPeriodo(resumen.periodo)}</strong>.
          </p>
        </div>

      </header>

      {resumenError && (
        <p className={styles.problema} role="alert">
          <CircleAlert aria-hidden="true" />
          <span>No pudimos cargar el resumen del periodo. Los totales pueden aparecer en cero.</span>
        </p>
      )}

      <div className={styles.principal}>
        <TowerPlan inmuebles={inmuebles} />

        <aside className={`hoja ${styles.resumen}`} aria-label="Resumen del mes">
          <div className={styles.recaudo}>
            <p className={styles.rotulo}>Recaudo de {mesDelPeriodo(resumen.periodo)}</p>
            <p className={`t-hero ${styles.hero}`} style={{ '--caracteres': recaudo.length } as CSSProperties}>
              {recaudo}
            </p>
            <p className={styles.delta}>
              <Wallet aria-hidden="true" strokeWidth={2.4} />
              {resumen.alDia} de {resumen.totalInmuebles} inmuebles al día
            </p>
          </div>

          <dl className={styles.cifras}>
            <div className={styles.cifra}>
              <dt>Por cobrar</dt>
              <dd className="t-cifra">{pesos(resumen.porCobrar)}</dd>
              <dd className="t-nota">
                {resumen.vencidas} vencidas, {resumen.porVencer} por vencer y {resumen.sinLiquidacion} sin liquidación
              </dd>
            </div>
            <div className={styles.cifra}>
              <dt>Por autorizar</dt>
              <dd className="t-cifra">{usuariosInactivos}</dd>
              <dd className="t-nota">
                cuentas esperando aprobación ·{' '}
                <Link href="/admin/usuarios?estado=inactivas" prefetch={false} className={styles.enlace}>
                  Revisar
                </Link>
              </dd>
            </div>
            <div className={styles.cifra}>
              <dt>Avisos recibidos</dt>
              <dd className="t-cifra">{notificaciones.length}</dd>
              <dd className="t-nota">
                en tu cuenta ·{' '}
                <Link href="/admin/notificaciones" prefetch={false} className={styles.enlace}>
                  Ver comunicados
                </Link>
              </dd>
            </div>
          </dl>
        </aside>
      </div>

      <div className={styles.inferior}>
        <section className={`hoja ${styles.panel}`} aria-labelledby="avisos-titulo">
          <header className={styles.panelCabecera}>
            <div>
              <h2 id="avisos-titulo" className="t-section">
                Avisos recientes
              </h2>
              <p className="t-nota">Mensajes recibidos por tu cuenta</p>
            </div>
            <Link href="/admin/notificaciones" prefetch={false} className="btn" data-variant="quiet" data-size="sm">
              Ver todos
            </Link>
          </header>

          {ultimosAvisos.length === 0 ? (
            <p className={styles.vacio}>
              <Bell aria-hidden="true" />
              No tienes avisos todavía.
            </p>
          ) : (
            <ul>
              {ultimosAvisos.map((n) => (
                <li key={n.id} className={styles.comunicado}>
                  <div>
                    <h3 className={`t-voz ${styles.comunicadoTitulo}`}>{n.mensaje}</h3>
                    <p className="t-nota">{fechaHora(n.fechaEnvio)}</p>
                  </div>
                  <Chip tono="info" icono={Bell}>
                    {n.tipoNotificacion}
                  </Chip>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={`hoja ${styles.panel}`} aria-labelledby="pagos-titulo">
          <header className={styles.panelCabecera}>
            <div>
              <h2 id="pagos-titulo" className="t-section">
                Últimos pagos
              </h2>
              <p className="t-nota">Movimientos registrados en el conjunto</p>
            </div>
            <Link href="/admin/pagos" prefetch={false} className="btn" data-variant="quiet" data-size="sm">
              Ver todos
            </Link>
          </header>

          {ultimosPagos.length === 0 ? (
            <p className={styles.vacio}>
              <Receipt aria-hidden="true" />
              Aún no hay pagos registrados.
            </p>
          ) : (
            <table className={styles.tabla}>
              <caption className="sr-only">Últimos pagos de administración recibidos</caption>
              <thead>
                <tr>
                  <th scope="col">Inmueble</th>
                  <th scope="col">Método</th>
                  <th scope="col" className={styles.derecha}>
                    Valor
                  </th>
                  <th scope="col">Estado</th>
                  <th scope="col">Cuándo</th>
                </tr>
              </thead>
              <tbody>
                {ultimosPagos.map((p) => (
                  <tr key={p.id}>
                    <td className={`t-voz ${styles.cPlaca}`}>{p.direccionInmueble}</td>
                    <td className={`t-nota ${styles.cMetodo}`}>{p.metodoPago}</td>
                    <td className={`t-columna ${styles.derecha} ${styles.cValor}`}>{pesos(p.monto)}</td>
                    <td className={styles.cEstado}>
                      <Chip tono={TONO_PAGO[p.estado]} icono={ICONO_PAGO[p.estado]}>
                        {ESTADO_TRANSACCION_TEXTO[p.estado]}
                      </Chip>
                    </td>
                    <td className={`t-nota ${styles.cCuando}`}>{fechaLarga(p.fechaPago)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  )
}
