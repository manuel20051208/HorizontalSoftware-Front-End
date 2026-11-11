import { Check, CircleAlert, Clock, RotateCcw, XCircle } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { BotonAccion } from '@/components/gestion/acciones-cliente'
import { Encabezado, EstadoResultado, Panel, Vacio } from '@/components/gestion/piezas'
import styles from '@/components/gestion/gestion.module.css'
import { fechaLarga, pesos } from '@/lib/api/acciones'
import {
  ESTADO_TRANSACCION_TEXTO,
  type EstadoTransaccion,
  type InmuebleResumen,
  type Pago,
} from '@/lib/api/tipos'
import { anularPago, reembolsarPago } from '@/lib/admin/acciones'
import { listaDe, listado, type Listado } from '@/lib/api/paginacion'
import { RUTAS_API } from '@/lib/auth/config'
import { apiConSesion, requerirSesion } from '@/lib/auth/sesion'

export const metadata: Metadata = { title: 'Pagos' }

type Props = { searchParams: Promise<{ estado?: string; inmuebleId?: string }> }

const ESTADOS: EstadoTransaccion[] = ['PENDIENTE', 'APROBADO', 'RECHAZADO', 'ANULADO', 'REEMBOLSADO']

function tono(estado: EstadoTransaccion) {
  return estado === 'APROBADO'
    ? 'ok'
    : estado === 'PENDIENTE'
      ? 'wait'
      : estado === 'RECHAZADO' || estado === 'ANULADO'
        ? 'alert'
        : 'neutral'
}

export default async function PagosPage({ searchParams }: Props) {
  await requerirSesion('admin')
  const params = await searchParams
  const estado = ESTADOS.includes(params.estado as EstadoTransaccion) ? (params.estado as EstadoTransaccion) : undefined
  const inmuebleId = Number(params.inmuebleId)

  const consulta = new URLSearchParams()
  if (inmuebleId > 0) consulta.set('inmuebleId', String(inmuebleId))
  if (estado) consulta.set('estado', estado)

  const [pagosR, inmueblesR] = await Promise.all([
    apiConSesion<Listado<Pago>>('admin', listado(consulta.size ? `${RUTAS_API.pagosAdmin}?${consulta}` : RUTAS_API.pagosAdmin), {
      metodo: 'GET',
    }),
    apiConSesion<Listado<InmuebleResumen>>('admin', listado(RUTAS_API.inmuebles), { metodo: 'GET' }),
  ])
  const pagos = listaDe(pagosR)
  const inmuebles = listaDe(inmueblesR)

  return (
    <div className={styles.pagina}>
      <Encabezado
        titulo="Pagos"
        descripcion="Historial de pagos del conjunto, anulaciones y reembolsos."
        acciones={
          <Link href="/admin/inmuebles" prefetch={false} className="btn" data-variant="secondary">
            Conciliar pago
          </Link>
        }
      />

      <Panel
        titulo="Pagos recibidos"
        nota={`${pagos.length} ${pagos.length === 1 ? 'pago' : 'pagos'} con los filtros actuales.`}
      >
        <form method="get" className={styles.filtros}>
          <div className={`${styles.grupo} ${styles.filtroCampo}`}>
            <label htmlFor="filtro-inmueble" className={styles.etiqueta}>
              Inmueble
            </label>
            <select id="filtro-inmueble" name="inmuebleId" className={styles.entrada} defaultValue={inmuebleId > 0 ? String(inmuebleId) : ''}>
              <option value="">Todos</option>
              {inmuebles.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.direccionInmueble}
                </option>
              ))}
            </select>
          </div>
          <div className={`${styles.grupo} ${styles.filtroCampo}`}>
            <label htmlFor="filtro-estado" className={styles.etiqueta}>
              Estado
            </label>
            <select id="filtro-estado" name="estado" className={styles.entrada} defaultValue={estado ?? ''}>
              <option value="">Todos</option>
              {ESTADOS.map((e) => (
                <option key={e} value={e}>
                  {ESTADO_TRANSACCION_TEXTO[e]}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn" data-variant="secondary">
            Filtrar
          </button>
        </form>

        {!pagosR.ok ? (
          <EstadoResultado resultado={pagosR} porDefecto="No se pudieron cargar los pagos." />
        ) : pagos.length === 0 ? (
          <Vacio>No hay pagos con estos filtros.</Vacio>
        ) : (
          <div className={styles.tablaMarco}>
            <table className={styles.tabla} data-cards>
              <caption className="sr-only">Pagos del conjunto</caption>
              <thead>
                <tr>
                  <th scope="col">Fecha</th>
                  <th scope="col">Inmueble</th>
                  <th scope="col">Concepto</th>
                  <th scope="col">Método</th>
                  <th scope="col" className={styles.derecha}>
                    Monto
                  </th>
                  <th scope="col">Estado</th>
                  <th scope="col">Referencia</th>
                  <th scope="col">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((p) => (
                  <tr key={p.id}>
                    <td className={`t-nota ${styles.ahora}`} data-label="Fecha">{fechaLarga(p.fechaPago)}</td>
                    <td className={`t-voz ${styles.nombre} ${styles.celdaPrincipal}`} data-label="Inmueble">
                      {p.direccionInmueble}
                    </td>
                    <td className="t-nota" data-label="Concepto">{p.concepto}</td>
                    <td data-label="Método">{p.metodoPago}</td>
                    <td className={`t-columna ${styles.derecha} ${styles.ahora}`} data-label="Monto">
                      <strong>{pesos(p.monto)}</strong>
                    </td>
                    <td data-label="Estado">
                      <span className="chip" data-tone={tono(p.estado)}>
                        {p.estado === 'APROBADO' ? (
                          <Check aria-hidden="true" />
                        ) : p.estado === 'PENDIENTE' ? (
                          <Clock aria-hidden="true" />
                        ) : p.estado === 'REEMBOLSADO' ? (
                          <RotateCcw aria-hidden="true" />
                        ) : (
                          <XCircle aria-hidden="true" />
                        )}
                        {ESTADO_TRANSACCION_TEXTO[p.estado]}
                      </span>
                    </td>
                    <td className={`t-nota ${styles.ahora}`} data-label="Referencia">{p.referencia}</td>
                    <td className={styles.celdaAccion}>
                      <div className={styles.accionesCabecera}>
                        {(p.estado === 'APROBADO' || p.estado === 'REEMBOLSADO') && (
                          <Link
                            href={`/admin/pagos/${p.id}/comprobante`}
                            prefetch={false}
                            className="btn"
                            data-variant="quiet"
                            data-size="sm"
                          >
                            Comprobante
                          </Link>
                        )}
                        {p.estado === 'PENDIENTE' && (
                          <BotonAccion
                            accion={anularPago.bind(null, p.id)}
                            variante="quiet"
                            confirmar={`¿Anular el pago ${p.referencia}?`}
                          >
                            Anular
                          </BotonAccion>
                        )}
                        {p.estado === 'APROBADO' && (
                          <BotonAccion
                            accion={reembolsarPago.bind(null, p.id)}
                            variante="secondary"
                            confirmar={`¿Reembolsar el pago ${p.referencia}? Se reabrirá la liquidación.`}
                          >
                            Reembolsar
                          </BotonAccion>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <p className={`t-nota ${styles.notaIcono}`}>
        <CircleAlert aria-hidden="true" /> Un pago solo se anula si está PENDIENTE y solo se reembolsa si está APROBADO.
      </p>
    </div>
  )
}
