import { Check, CircleAlert, Clock, Minus } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Encabezado, EstadoResultado, Panel, Vacio } from '@/components/gestion/piezas'
import styles from '@/components/gestion/gestion.module.css'
import { fechaLarga, pesos } from '@/lib/api/acciones'
import { ESTADO_CARTERA_TEXTO, type EstadoCartera, type ReporteConsolidado } from '@/lib/api/tipos'
import { RUTAS_API } from '@/lib/auth/config'
import { apiConSesion, requerirSesion } from '@/lib/auth/sesion'

export const metadata: Metadata = { title: 'Reporte consolidado' }

const TONO = {
  AL_DIA: 'ok',
  POR_VENCER: 'wait',
  VENCIDA: 'alert',
  SIN_LIQUIDACION: 'neutral',
} as const

/** Primero lo que más urge cobrar: vencidos, por vencer, sin liquidación y al día. */
const PRIORIDAD: Record<EstadoCartera, number> = { VENCIDA: 0, POR_VENCER: 1, SIN_LIQUIDACION: 2, AL_DIA: 3 }

function IconoEstado({ estado }: { estado: EstadoCartera }) {
  if (estado === 'AL_DIA') return <Check aria-hidden="true" />
  if (estado === 'VENCIDA') return <CircleAlert aria-hidden="true" />
  if (estado === 'POR_VENCER') return <Clock aria-hidden="true" />
  return <Minus aria-hidden="true" />
}

export default async function ReportesPage() {
  await requerirSesion('admin')
  const r = await apiConSesion<ReporteConsolidado>('admin', RUTAS_API.reportes, { metodo: 'GET' })

  if (!r.ok) {
    return (
      <div className={styles.pagina}>
        <Encabezado titulo="Reporte consolidado" />
        <EstadoResultado resultado={r} porDefecto="No se pudo generar el reporte." />
      </div>
    )
  }

  const reporte = r.datos
  const inmuebles = [...reporte.inmuebles].sort(
    (a, b) =>
      PRIORIDAD[a.estadoPago] - PRIORIDAD[b.estadoPago] ||
      b.saldoPendiente - a.saldoPendiente ||
      a.direccionInmueble.localeCompare(b.direccionInmueble, 'es', { numeric: true }),
  )
  const porCobrar = reporte.mora + reporte.pendiente

  return (
    <div className={styles.pagina}>
      <Encabezado
        titulo="Reporte consolidado"
        descripcion={`Recaudo, mora y saldos pendientes acumulados a la fecha (no solo de este mes). Generado el ${fechaLarga(reporte.fechaGeneracion)}.`}
      />

      <dl className={styles.cifras}>
        <div className={styles.cifra}>
          <dt>Recaudo</dt>
          <dd>{pesos(reporte.recaudo)}</dd>
        </div>
        <div className={styles.cifra}>
          <dt>En mora</dt>
          <dd>{pesos(reporte.mora)}</dd>
        </div>
        <div className={styles.cifra}>
          <dt>Por vencer</dt>
          <dd>{pesos(reporte.pendiente)}</dd>
        </div>
        <div className={styles.cifra}>
          <dt>Total por cobrar</dt>
          <dd>{pesos(porCobrar)}</dd>
        </div>
      </dl>

      <dl className={styles.cifras}>
        <div className={styles.cifra}>
          <dt>Inmuebles</dt>
          <dd>{reporte.totalInmuebles}</dd>
        </div>
        <div className={styles.cifra}>
          <dt>Al día</dt>
          <dd>{reporte.inmueblesAlDia}</dd>
        </div>
        <div className={styles.cifra}>
          <dt>En mora</dt>
          <dd>{reporte.inmueblesEnMora}</dd>
        </div>
        <div className={styles.cifra}>
          <dt>Por vencer</dt>
          <dd>{reporte.inmueblesPendientes}</dd>
        </div>
      </dl>

      <Panel
        titulo="Detalle por inmueble"
        nota="Ordenado por lo que más urge: primero los vencidos y los saldos más altos."
      >
        {inmuebles.length === 0 ? (
          <Vacio>No hay inmuebles en el reporte.</Vacio>
        ) : (
          <div className={styles.tablaMarco}>
            <table className={styles.tabla} data-cards>
              <caption className="sr-only">Recaudo y saldo pendiente de cada inmueble</caption>
              <thead>
                <tr>
                  <th scope="col">Inmueble</th>
                  <th scope="col">Estado</th>
                  <th scope="col" className={styles.derecha}>
                    Recaudado
                  </th>
                  <th scope="col" className={styles.derecha}>
                    Saldo pendiente
                  </th>
                </tr>
              </thead>
              <tbody>
                {inmuebles.map((i) => (
                  <tr key={i.inmuebleId}>
                    <td className={styles.celdaPrincipal}>
                      <Link href={`/admin/inmuebles/${i.inmuebleId}`} prefetch={false} className={`t-voz ${styles.nombre}`}>
                        {i.direccionInmueble}
                      </Link>
                    </td>
                    <td data-label="Estado">
                      <span className="chip" data-tone={TONO[i.estadoPago]}>
                        <IconoEstado estado={i.estadoPago} />
                        {ESTADO_CARTERA_TEXTO[i.estadoPago]}
                      </span>
                    </td>
                    <td className={`t-columna ${styles.derecha}`} data-label="Recaudado">
                      {pesos(i.recaudado)}
                    </td>
                    <td className={`t-columna ${styles.derecha}`} data-label="Saldo pendiente">
                      <strong>{pesos(i.saldoPendiente)}</strong>
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
