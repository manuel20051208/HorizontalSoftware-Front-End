import { Check, CircleAlert, Clock, RotateCcw, XCircle } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { BotonAccion, FormularioAccion } from '@/components/gestion/acciones-cliente'
import { Campo, CampoSelect } from '@/components/gestion/campos'
import { Encabezado, EstadoResultado, Panel, Vacio } from '@/components/gestion/piezas'
import styles from '@/components/gestion/gestion.module.css'
import { fechaLarga, pesos } from '@/lib/api/acciones'
import {
  ESTADO_TRANSACCION_TEXTO,
  type EstadoTransaccion,
  type InmuebleResumen,
  type Pago,
  type Pasarela,
} from '@/lib/api/tipos'
import { anularPago, guardarPasarela, reembolsarPago } from '@/lib/admin/acciones'
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

  const [pagosR, inmueblesR, pasarelaR] = await Promise.all([
    apiConSesion<Pago[]>('admin', consulta.size ? `${RUTAS_API.pagosAdmin}?${consulta}` : RUTAS_API.pagosAdmin, {
      metodo: 'GET',
    }),
    apiConSesion<InmuebleResumen[]>('admin', RUTAS_API.inmuebles, { metodo: 'GET' }),
    apiConSesion<Pasarela>('admin', RUTAS_API.pasarela, { metodo: 'GET' }),
  ])
  const pagos = pagosR.ok && Array.isArray(pagosR.datos) ? pagosR.datos : []
  const inmuebles = inmueblesR.ok && Array.isArray(inmueblesR.datos) ? inmueblesR.datos : []
  const pasarela = pasarelaR.ok ? pasarelaR.datos : null

  return (
    <div className={styles.pagina}>
      <Encabezado
        titulo="Pagos y pasarela"
        descripcion="Historial de pagos del conjunto, anulaciones, reembolsos y configuración de la pasarela."
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

      <Panel titulo="Pasarela de pagos" nota="La llave se guarda completa; el backend solo devuelve los últimos cuatro caracteres.">
        {!pasarelaR.ok ? (
          <EstadoResultado resultado={pasarelaR} porDefecto="No se pudo cargar la pasarela." />
        ) : (
          <>
            {pasarela && (
              <p className="t-nota" style={{ marginBottom: '0.75rem' }}>
                Configuración actual: <strong>{pasarela.nombrePasarela}</strong> · {pasarela.urlApi} · llave{' '}
                <span className="t-columna">{pasarela.apiKey}</span> · {pasarela.estado}
              </p>
            )}
            <FormularioAccion accion={guardarPasarela} texto="Guardar pasarela" variante="secondary">
              <div className={styles.rejilla}>
                <Campo nombre="nombrePasarela" etiqueta="Nombre" valor={pasarela?.nombrePasarela ?? 'Wompi'} maxLength={60} requerido />
                <CampoSelect
                  nombre="estado"
                  etiqueta="Estado"
                  valor={pasarela?.estado ?? 'ACTIVA'}
                  opciones={[
                    { valor: 'ACTIVA', texto: 'Activa' },
                    { valor: 'INACTIVA', texto: 'Inactiva' },
                  ]}
                  requerido
                />
                <Campo nombre="urlApi" etiqueta="URL de la API" valor={pasarela?.urlApi ?? ''} maxLength={300} requerido ancho />
                <Campo
                  nombre="apiKey"
                  etiqueta="Llave de la pasarela"
                  tipo="password"
                  maxLength={200}
                  requerido
                  ancho
                  autoComplete="off"
                  ayuda={
                    pasarela
                      ? `Llave actual enmascarada: ${pasarela.apiKey}. Escribe la llave completa para reemplazarla.`
                      : 'Escribe la llave pública del comercio.'
                  }
                />
              </div>
            </FormularioAccion>
          </>
        )}
      </Panel>

      <p className={`t-nota ${styles.notaIcono}`}>
        <CircleAlert aria-hidden="true" /> Un pago solo se anula si está PENDIENTE y solo se reembolsa si está APROBADO.
      </p>
    </div>
  )
}
