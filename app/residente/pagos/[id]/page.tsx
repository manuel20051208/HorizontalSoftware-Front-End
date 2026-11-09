import { Check, Clock, RotateCcw, XCircle } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Encabezado, EstadoResultado, Panel } from '@/components/gestion/piezas'
import styles from '@/components/gestion/gestion.module.css'
import { fechaLarga, pesos } from '@/lib/api/acciones'
import { ESTADO_TRANSACCION_TEXTO, type EstadoPago, type EstadoTransaccion, type Pago } from '@/lib/api/tipos'
import { RUTAS_API } from '@/lib/auth/config'
import { apiConSesion, requerirSesion } from '@/lib/auth/sesion'

export const metadata: Metadata = { title: 'Detalle del pago' }

type Props = { params: Promise<{ id: string }> }

function tono(estado: EstadoTransaccion) {
  return estado === 'APROBADO'
    ? 'ok'
    : estado === 'PENDIENTE'
      ? 'wait'
      : estado === 'RECHAZADO' || estado === 'ANULADO'
        ? 'alert'
        : 'neutral'
}

function Icono({ estado }: { estado: EstadoTransaccion }) {
  if (estado === 'APROBADO') return <Check aria-hidden="true" />
  if (estado === 'PENDIENTE') return <Clock aria-hidden="true" />
  if (estado === 'REEMBOLSADO') return <RotateCcw aria-hidden="true" />
  return <XCircle aria-hidden="true" />
}

export default async function DetallePagoPage({ params }: Props) {
  await requerirSesion('residente')
  const { id } = await params
  const pagoId = Number(id)
  if (!Number.isSafeInteger(pagoId) || pagoId <= 0) notFound()

  const pagoR = await apiConSesion<Pago>('residente', RUTAS_API.miPago(pagoId), { metodo: 'GET' })
  if (!pagoR.ok && pagoR.status === 404) notFound()
  const pago = pagoR.ok ? pagoR.datos : null

  // Estado vivo en la pasarela: útil cuando el pago sigue PENDIENTE y el webhook aún no llega.
  const estadoR = pago?.referencia
    ? await apiConSesion<EstadoPago>('residente', RUTAS_API.estadoPago(pago.referencia), { metodo: 'GET' })
    : null
  const estadoVivo = estadoR?.ok ? estadoR.datos.estado : null

  return (
    <div className={styles.pagina}>
      <Encabezado
        titulo="Detalle del pago"
        descripcion="Información de la transacción y su estado actual en la pasarela."
        volverHref="/residente/pagos"
        volverTexto="Mis pagos"
      />

      {!pagoR.ok ? (
        <EstadoResultado resultado={pagoR} porDefecto="No se pudo cargar el pago." />
      ) : pago ? (
        <Panel titulo={pago.concepto} nota={`Referencia ${pago.referencia}`}>
          <dl className={styles.datos}>
            <div>
              <dt>Monto</dt>
              <dd>{pesos(pago.monto)}</dd>
            </div>
            <div>
              <dt>Fecha</dt>
              <dd>{fechaLarga(pago.fechaPago)}</dd>
            </div>
            <div>
              <dt>Método</dt>
              <dd>{pago.metodoPago}</dd>
            </div>
            <div>
              <dt>Apartamento</dt>
              <dd>{pago.direccionInmueble}</dd>
            </div>
            <div>
              <dt>Estado registrado</dt>
              <dd>
                <span className="chip" data-tone={tono(pago.estado)}>
                  <Icono estado={pago.estado} />
                  {ESTADO_TRANSACCION_TEXTO[pago.estado]}
                </span>
              </dd>
            </div>
            {estadoVivo && estadoVivo !== pago.estado && (
              <div>
                <dt>Estado en la pasarela</dt>
                <dd>
                  <span className="chip" data-tone={tono(estadoVivo)}>
                    <Icono estado={estadoVivo} />
                    {ESTADO_TRANSACCION_TEXTO[estadoVivo]}
                  </span>
                </dd>
              </div>
            )}
          </dl>

          {(pago.estado === 'APROBADO' || pago.estado === 'REEMBOLSADO') && (
            <div className={styles.pie}>
              <Link href={`/residente/pagos/${pago.id}/comprobante`} prefetch={false} className="btn" data-variant="primary">
                Ver comprobante
              </Link>
            </div>
          )}
          {pago.estado === 'PENDIENTE' && (
            <p className="t-nota" style={{ marginTop: '1rem' }}>
              Este pago está pendiente de confirmación de la pasarela. Recarga esta página en unos minutos para ver el
              resultado.
            </p>
          )}
        </Panel>
      ) : null}
    </div>
  )
}
