import { ArrowLeft, CalendarDays, Check, Clock, Inbox, RotateCcw, XCircle } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { EstadoResultado, Paginacion } from '@/components/gestion/piezas'
import { TalonPago } from '@/components/modules/pagos/talon-pago'
import styles from '@/components/modules/pagos/pagos.module.css'
import { fechaLarga, pesos } from '@/lib/api/acciones'
import { consultaPagina, leerPagina, paginaDeUrl, type Listado } from '@/lib/api/paginacion'
import {
  ESTADO_CARTERA_TEXTO,
  ESTADO_TRANSACCION_TEXTO,
  type EstadoCuenta,
  type EstadoTransaccion,
  type Pago,
} from '@/lib/api/tipos'
import { RUTAS_API } from '@/lib/auth/config'
import { apiConSesion, requerirSesion } from '@/lib/auth/sesion'

export const metadata: Metadata = { title: 'Pagos' }

/** Pagos por página del historial: la tarjeta no crece sin límite. */
const POR_PAGINA = 5

type Props = { searchParams: Promise<{ pagina?: string }> }

function mesLargo(periodo: string) {
  const fecha = new Date(`${periodo.slice(0, 10)}T00:00:00Z`)
  if (Number.isNaN(fecha.getTime())) return periodo
  return new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(fecha)
}

function tonoPago(estado: EstadoTransaccion) {
  return estado === 'APROBADO'
    ? 'ok'
    : estado === 'PENDIENTE'
      ? 'wait'
      : estado === 'RECHAZADO' || estado === 'ANULADO'
        ? 'alert'
        : 'neutral'
}

function IconoPago({ estado }: { estado: EstadoTransaccion }) {
  if (estado === 'APROBADO') return <Check aria-hidden="true" />
  if (estado === 'PENDIENTE') return <Clock aria-hidden="true" />
  if (estado === 'REEMBOLSADO') return <RotateCcw aria-hidden="true" />
  return <XCircle aria-hidden="true" />
}

export default async function MisPagosPage({ searchParams }: Props) {
  await requerirSesion('residente')
  const paginaPedida = paginaDeUrl((await searchParams).pagina)

  const [cuentaR, pagosR] = await Promise.all([
    apiConSesion<EstadoCuenta>('residente', RUTAS_API.miCuenta, { metodo: 'GET' }),
    apiConSesion<Listado<Pago>>('residente', `${RUTAS_API.misPagos}?${consultaPagina(paginaPedida, POR_PAGINA)}`, {
      metodo: 'GET',
    }),
  ])
  const cuenta = cuentaR.ok ? cuentaR.datos : null
  const historial = leerPagina(pagosR, paginaPedida, POR_PAGINA, (a, b) => b.id - a.id)
  const pagos = historial.items

  const liquidacion = cuenta?.liquidacionVigente ?? null
  const saldo = cuenta?.saldoPendiente ?? 0
  const puedePagar = !!cuenta && !cuenta.pazYSalvo && saldo > 0
  const previos = liquidacion ? saldo - liquidacion.total : 0

  const items = liquidacion
    ? [
        { label: 'Cuota de administración', valor: liquidacion.cuotaAdministracion },
        { label: 'Servicios comunes', valor: liquidacion.valorServiciosComunes },
        ...(liquidacion.valorMultas > 0 ? [{ label: 'Multas', valor: liquidacion.valorMultas }] : []),
      ]
    : []

  return (
    <div className={styles.pagina}>
      <Link href="/residente" prefetch={false} className={`btn ${styles.volver}`} data-variant="quiet" data-size="sm">
        <ArrowLeft aria-hidden="true" />
        Mi apartamento
      </Link>

      <header className={styles.cabecera}>
        <div>
          <h1 className={styles.titulo}>Pagos</h1>
          <p className={styles.sub}>
            {cuenta ? `Administración · apartamento ${cuenta.direccionInmueble}` : 'Administración de tu apartamento'}
          </p>
        </div>
      </header>

      {!cuentaR.ok ? (
        <EstadoResultado resultado={cuentaR} porDefecto="No se pudo cargar el estado de tu cuenta." />
      ) : cuenta ? (
        <div className={styles.layout}>
          {puedePagar ? (
            <section className={styles.hero} aria-labelledby="saldo-titulo">
              <p id="saldo-titulo" className={styles.heroLabel}>
                Saldo pendiente
              </p>
              <p className={styles.heroMonto}>{pesos(saldo)}</p>
              <div className={styles.heroMeta}>
                {liquidacion && (
                  <span>
                    <CalendarDays aria-hidden="true" />
                    Vence {fechaLarga(liquidacion.fechaLimite)}
                  </span>
                )}
                <span>Apartamento {cuenta.direccionInmueble}</span>
              </div>
              <TalonPago saldo={saldo} />
            </section>
          ) : (
            <section className={`${styles.hero} ${styles.heroOk}`} aria-labelledby="saldo-titulo">
              <span className={styles.okBadge} aria-hidden="true">
                <Check />
              </span>
              <p id="saldo-titulo" className={styles.heroLabel}>
                Tu apartamento
              </p>
              <p className={styles.heroMonto}>Al día</p>
              <p className={styles.heroNota}>No tienes saldo pendiente con la administración. ¡Gracias por tu pago!</p>
            </section>
          )}

          <section className={`hoja ${styles.tarjeta}`} aria-labelledby="desglose-titulo">
            <h2 id="desglose-titulo" className={styles.tarjetaTitulo}>
              {liquidacion ? 'Desglose del periodo' : 'Estado de cuenta'}
            </h2>
            <p className={styles.tarjetaConcepto}>
              {liquidacion ? `Administración de ${mesLargo(liquidacion.periodo)}` : ESTADO_CARTERA_TEXTO[cuenta.estadoPago]}
            </p>

            {liquidacion ? (
              <>
                {items.map((it) => (
                  <div key={it.label} className={styles.fila}>
                    <span className={styles.filaLabel}>{it.label}</span>
                    <span className={styles.filaValor}>{pesos(it.valor)}</span>
                  </div>
                ))}
                <div className={`${styles.fila} ${styles.filaTotal}`}>
                  <span className={styles.filaLabel}>Total del periodo</span>
                  <span className={styles.filaValor}>{pesos(liquidacion.total)}</span>
                </div>
              </>
            ) : (
              <div className={`${styles.fila} ${styles.filaTotal}`}>
                <span className={styles.filaLabel}>Saldo pendiente</span>
                <span className={styles.filaValor}>{pesos(saldo)}</span>
              </div>
            )}

            {previos > 0 && (
              <p className={styles.previos}>
                Incluye {pesos(previos)} de periodos anteriores sin pagar.
              </p>
            )}
          </section>
        </div>
      ) : null}

      <section id="historial" className={`hoja ${styles.historial}`} aria-labelledby="historial-titulo">
        <div className={styles.histCabecera}>
          <h2 id="historial-titulo" className={styles.histTitulo}>
            Historial de pagos
          </h2>
          <p className="t-nota">
            {historial.total === 1 ? '1 pago' : `${historial.total} pagos`}
            {historial.totalPaginas > 1 && ` · página ${historial.pagina} de ${historial.totalPaginas}`}
          </p>
        </div>

        {!pagosR.ok ? (
          <EstadoResultado resultado={pagosR} porDefecto="No se pudo cargar el historial de pagos." />
        ) : pagos.length === 0 ? (
          <div className={styles.vacio}>
            <Inbox aria-hidden="true" />
            <p>Todavía no tienes pagos registrados.</p>
          </div>
        ) : (
          <ul className={styles.recibos}>
            {pagos.map((p) => (
              <li key={p.id} className={styles.recibo}>
                <span className={styles.recIcono} data-tono={tonoPago(p.estado)} aria-hidden="true">
                  <IconoPago estado={p.estado} />
                </span>
                <div>
                  <p className={styles.recConcepto}>{p.concepto}</p>
                  <p className={styles.recMeta}>
                    {fechaLarga(p.fechaPago)} · {p.metodoPago}
                  </p>
                </div>
                <div className={styles.recDerecha}>
                  <span className={styles.recMonto}>{pesos(p.monto)}</span>
                  <div className={styles.recAcciones}>
                    <Link href={`/residente/pagos/${p.id}`} prefetch={false} className="btn" data-variant="quiet" data-size="sm">
                      Detalle
                    </Link>
                    {(p.estado === 'APROBADO' || p.estado === 'REEMBOLSADO') && (
                      <Link
                        href={`/residente/pagos/${p.id}/comprobante`}
                        prefetch={false}
                        className="btn"
                        data-variant="secondary"
                        data-size="sm"
                      >
                        Comprobante
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <Paginacion
          pagina={historial.pagina}
          totalPaginas={historial.totalPaginas}
          href={(n) => (n === 1 ? '/residente/pagos#historial' : `/residente/pagos?pagina=${n}#historial`)}
          etiqueta="Páginas del historial de pagos"
        />
      </section>
    </div>
  )
}
