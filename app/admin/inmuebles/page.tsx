import { Check, CircleAlert, Clock, Plus, Send } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { BotonAccion } from '@/components/gestion/acciones-cliente'
import { Encabezado, EstadoResultado, Panel, Vacio } from '@/components/gestion/piezas'
import styles from '@/components/gestion/gestion.module.css'
import { fechaLarga, pesos } from '@/lib/api/acciones'
import { ESTADO_CARTERA_TEXTO, type InmuebleResumen } from '@/lib/api/tipos'
import { listaDe, listado, type Listado } from '@/lib/api/paginacion'
import { RUTAS_API } from '@/lib/auth/config'
import { apiConSesion, requerirSesion } from '@/lib/auth/sesion'
import { enviarRecordatorio } from '@/lib/admin/acciones'

export const metadata: Metadata = { title: 'Inmuebles' }

const TONO = {
  AL_DIA: 'ok',
  POR_VENCER: 'wait',
  VENCIDA: 'alert',
  SIN_LIQUIDACION: 'neutral',
} as const

export default async function InmueblesPage() {
  const { nombre } = await requerirSesion('admin')
  const r = await apiConSesion<Listado<InmuebleResumen>>('admin', listado(RUTAS_API.inmuebles), { metodo: 'GET' })
  const inmuebles = listaDe(r)

  return (
    <div className={styles.pagina}>
      <Encabezado
        titulo="Inmuebles"
        descripcion={`Apartamentos del conjunto y su estado de cartera. ${nombre}, aquí también se configuran tarifas, multas y zonas comunes.`}
        acciones={
          <Link href="/admin/inmuebles/nuevo" prefetch={false} className="btn" data-variant="primary">
            <Plus aria-hidden="true" />
            Nuevo inmueble
          </Link>
        }
      />

      {!r.ok ? (
        <EstadoResultado resultado={r} porDefecto="No se pudieron cargar los inmuebles." />
      ) : (
        <Panel titulo="Apartamentos" nota={inmuebles.length === 1 ? '1 inmueble' : `${inmuebles.length} inmuebles`}>
          {inmuebles.length === 0 ? (
            <Vacio>Aún no hay inmuebles. Crea el primero para empezar a liquidar.</Vacio>
          ) : (
            <div className={styles.tablaMarco}>
              <table className={styles.tabla} data-cards>
                <caption className="sr-only">Inmuebles del conjunto</caption>
                <thead>
                  <tr>
                    <th scope="col">Apartamento</th>
                    <th scope="col">Estado</th>
                    <th scope="col" className={styles.derecha}>
                      Saldo
                    </th>
                    <th scope="col">Vence</th>
                    <th scope="col" className={styles.derecha}>
                      Parqueadero
                    </th>
                    <th scope="col">Liquidaciones</th>
                    <th scope="col">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {inmuebles.map((i) => (
                    <tr key={i.id}>
                      <td className={styles.celdaPrincipal}>
                        <Link href={`/admin/inmuebles/${i.id}`} prefetch={false} className={`t-voz ${styles.nombre}`}>
                          {i.direccionInmueble}
                        </Link>
                        {i.isActive === false && <span className={styles.nota}>Inactivo</span>}
                      </td>
                      <td data-label="Estado">
                        <span className="chip" data-tone={TONO[i.estadoPago]}>
                          {i.estadoPago === 'AL_DIA' ? (
                            <Check aria-hidden="true" />
                          ) : i.estadoPago === 'VENCIDA' ? (
                            <CircleAlert aria-hidden="true" />
                          ) : i.estadoPago === 'POR_VENCER' ? (
                            <Clock aria-hidden="true" />
                          ) : null}
                          {ESTADO_CARTERA_TEXTO[i.estadoPago]}
                        </span>
                      </td>
                      <td className={`t-columna ${styles.derecha} ${styles.ahora}`} data-label="Saldo">{pesos(i.saldoPendiente)}</td>
                      <td className={`t-nota ${styles.ahora}`} data-label="Vence">{fechaLarga(i.fechaLimitePendiente)}</td>
                      <td className={`t-columna ${styles.derecha}`} data-label="Parqueadero">{pesos(i.valorParqueadero)}</td>
                      <td className={`t-columna ${styles.derecha}`} data-label="Liquidaciones">{i.totalLiquidaciones}</td>
                      <td className={styles.celdaAccion}>
                        <div className={styles.accionesCabecera}>
                          <Link
                            href={`/admin/inmuebles/${i.id}`}
                            prefetch={false}
                            className="btn"
                            data-variant="quiet"
                            data-size="sm"
                          >
                            Ver detalle
                          </Link>
                          <BotonAccion
                            accion={enviarRecordatorio.bind(null, i.id)}
                            variante="secondary"
                            ariaLabel={`Enviar recordatorio de pago a ${i.direccionInmueble}`}
                          >
                            <Send aria-hidden="true" />
                            Recordar
                          </BotonAccion>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}
    </div>
  )
}
