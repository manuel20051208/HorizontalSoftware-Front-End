'use client'

import {
  Bell,
  Car,
  Check,
  CircleAlert,
  Clock,
  RotateCcw,
  UserCheck,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { Chip, type Tono } from '@/components/ui/chip'
import { ChipReserva } from '@/components/ui/chip-reserva'
import { fechaLarga, pesos } from '@/lib/api/acciones'
import {
  ESTADO_CARTERA_TEXTO,
  ESTADO_TRANSACCION_TEXTO,
  type Auto,
  type EstadoCuenta,
  type EstadoTransaccion,
  type Invitado,
  type Notificacion,
  type Pago,
  type Reserva,
} from '@/lib/api/tipos'
import { diaReserva, horaReserva } from '@/lib/api/reservas'
import { useHoy } from '@/lib/use-hoy'
import styles from './resident-dashboard.module.css'

function mes(periodo: string) {
  const fecha = new Date(`${periodo.slice(0, 10)}T00:00:00Z`)
  if (Number.isNaN(fecha.getTime())) return periodo
  const texto = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(fecha)
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

const TONO_PAGO: Record<EstadoTransaccion, Tono> = {
  APROBADO: 'ok',
  PENDIENTE: 'wait',
  RECHAZADO: 'alert',
  ANULADO: 'alert',
  REEMBOLSADO: 'neutral',
}

const ICONO_PAGO: Record<EstadoTransaccion, LucideIcon> = {
  APROBADO: Check,
  PENDIENTE: Clock,
  RECHAZADO: XCircle,
  ANULADO: XCircle,
  REEMBOLSADO: RotateCcw,
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

export function ResidentDashboard({
  nombre,
  cuenta,
  pagos,
  invitados,
  reservas,
  notificaciones,
  auto,
}: {
  nombre: string
  cuenta: EstadoCuenta | null
  pagos: Pago[]
  invitados: Invitado[]
  reservas: Reserva[]
  notificaciones: Notificacion[]
  auto: Auto | null
}) {
  const hoy = useHoy()
  const liquidacion = cuenta?.liquidacionVigente ?? null
  const alDia = cuenta?.pazYSalvo === true
  const pendiente = cuenta?.saldoPendiente ?? 0
  const activos = invitados.filter((i) => i.vigente).length
  const ultimosPagos = pagos.slice(0, 3)
  const avisos = notificaciones.slice(0, 4)
  const nombreCorto = nombre.split(' ').filter(Boolean)[0] ?? nombre

  return (
    <div className={styles.pagina}>
      <header>
        <p className="t-rotulo">{hoy || 'Mi apartamento'}</p>
        <h1 className={`t-title ${styles.saludo}`}>Hola, {nombreCorto}.</h1>
        <p className={styles.sub}>
          {alDia
            ? 'Tu apartamento está al día. Estas son tus reservas y autorizaciones.'
            : cuenta
              ? `Tienes ${pesos(pendiente)} pendientes de administración.`
              : 'No pudimos cargar el estado de tu cuenta.'}
        </p>
      </header>

      <div className={styles.principal}>
        {/* La cuenta de cobro: papel con perforación y talón de pago */}
        <div className={styles.cuentaMarco}>
          <section className={styles.cuenta} aria-labelledby="cuenta-titulo">
            <div className={styles.cuerpo}>
              <p className={styles.tipo}>Cuenta de cobro</p>
              <h2 id="cuenta-titulo" className={`t-voz ${styles.concepto}`}>
                {liquidacion ? `Administración de ${mes(liquidacion.periodo)}` : cuenta ? 'Sin liquidación vigente' : 'Cuenta no disponible'}
              </h2>
              <p className={`t-hero ${styles.importe}`}>{liquidacion ? pesos(liquidacion.total) : '—'}</p>
              <dl className={styles.datos}>
                <div>
                  <dt>Vence</dt>
                  <dd>{fechaLarga(liquidacion?.fechaLimite ?? cuenta?.liquidacionVigente?.fechaLimite)}</dd>
                </div>
                <div>
                  <dt>Apartamento</dt>
                  <dd>{cuenta?.direccionInmueble ?? '—'}</dd>
                </div>
                <div>
                  <dt>Estado</dt>
                  <dd>{cuenta ? ESTADO_CARTERA_TEXTO[cuenta.estadoPago] : '—'}</dd>
                </div>
              </dl>
            </div>

            <div className={styles.perforacion} aria-hidden="true" />

            <div className={styles.talon}>
              <Link href="/residente/pagos" prefetch={false} className="btn" data-variant="primary" data-size="lg">
                {liquidacion ? `Pagar ${pesos(liquidacion.total)}` : 'Ir a mis pagos'}
              </Link>
              <p className={styles.talonNota}>Pago seguro con la pasarela: PSE, tarjeta o Nequi.</p>
            </div>
          </section>
        </div>

        <div className={styles.lateral}>
          <section className={`hoja ${styles.estado}`} aria-labelledby="estado-titulo">
            <header className={styles.proximasCabecera}>
              <h2 id="estado-titulo" className="t-section">
                Estado de cuenta
              </h2>
              <Link href="/residente/pagos#historial" prefetch={false} className="btn" data-variant="quiet" data-size="sm">
                Ver historial
              </Link>
            </header>

            <div className={styles.estadoFila}>
              {cuenta ? (
                alDia ? (
                  <p className={styles.sello}>Paz y salvo</p>
                ) : (
                  <Chip tono={cuenta.estadoPago === 'VENCIDA' ? 'alert' : 'wait'} icono={Clock}>
                    {ESTADO_CARTERA_TEXTO[cuenta.estadoPago]}
                  </Chip>
                )
              ) : (
                <Chip tono="alert" icono={CircleAlert}>
                  Sin conexión
                </Chip>
              )}
              <p className="t-nota">
                {cuenta
                  ? alDia
                    ? 'No tienes saldo pendiente con la administración.'
                    : `Saldo pendiente: ${pesos(pendiente)}.`
                  : 'Vuelve a intentarlo en un momento.'}
              </p>
            </div>

            {ultimosPagos.length > 0 && (
              <ul className={styles.pagos} aria-label="Últimos pagos">
                {ultimosPagos.map((p) => (
                  <li key={p.id}>
                    <span className={styles.pagoFecha}>
                      <span className="t-nota">{fechaLarga(p.fechaPago)}</span>
                      <Chip tono={TONO_PAGO[p.estado]} icono={ICONO_PAGO[p.estado]}>
                        {ESTADO_TRANSACCION_TEXTO[p.estado]}
                      </Chip>
                    </span>
                    <strong className={styles.pagoMonto}>{pesos(p.monto)}</strong>
                  </li>
                ))}
              </ul>
            )}

            {auto && (
              <p className={`t-nota ${styles.estadoPie}`}>
                <Car aria-hidden="true" />
                <span>
                  Auto registrado: placa <strong>{auto.placa}</strong>
                  {auto.parqueaderoId ? ` · parqueadero ${auto.parqueaderoId}` : ''}
                </span>
              </p>
            )}
          </section>
        </div>
      </div>

      <div className={styles.inferior}>
        <section className={`hoja ${styles.proximas}`} aria-labelledby="proximas-titulo">
          <header className={styles.proximasCabecera}>
            <div>
              <h2 id="proximas-titulo" className="t-section">
                Reservas e invitaciones
              </h2>
              <p className="t-nota">
                {reservas.length} {reservas.length === 1 ? 'reserva próxima' : 'reservas próximas'} · {activos} de {invitados.length}{' '}
                invitados con autorización vigente
              </p>
            </div>
            <Link href="/residente/reservas" prefetch={false} className="btn" data-variant="quiet" data-size="sm">
              Gestionar
            </Link>
          </header>

          {reservas.length === 0 && invitados.length === 0 ? (
            <p className={styles.vacio}>No tienes reservas ni invitados registrados todavía.</p>
          ) : (
            <ul>
              {reservas.slice(0, 3).map((r) => (
                <li key={`reserva-${r.id}`} className={styles.actividad}>
                  <p className={styles.cuando}>
                    {horaReserva(r.fechaHoraInicio)}
                    <span className={styles.mes}>
                      {diaReserva(r.fechaHoraInicio)} · hasta {horaReserva(r.fechaHoraFin)}
                    </span>
                  </p>
                  <div>
                    <h3 className={styles.lugar}>{r.nombreZonaComun}</h3>
                    <p className="t-nota">{r.direccionInmueble}</p>
                  </div>
                  <ChipReserva estado={r.estado} />
                </li>
              ))}
              {invitados.slice(0, 3).map((i) => (
                <li key={`invitado-${i.id}`} className={styles.actividad}>
                  <p className={styles.cuando}>
                    {i.vigente ? 'Visita' : 'Inactiva'}
                    <span className={styles.mes}>{i.venceAutorizacion ? fechaLarga(i.venceAutorizacion) : 'Sin vencimiento'}</span>
                  </p>
                  <div>
                    <h3 className={`t-voz ${styles.persona}`}>{i.nombreCompleto}</h3>
                    <p className="t-nota">Documento {i.identificacion}</p>
                  </div>
                  {i.vigente ? (
                    <Chip tono="info" icono={UserCheck}>
                      Autorizada
                    </Chip>
                  ) : (
                    <Chip tono="neutral" icono={Clock}>
                      Inactiva
                    </Chip>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={`hoja ${styles.proximas}`} aria-labelledby="avisos-titulo">
          <header className={styles.proximasCabecera}>
            <div>
              <h2 id="avisos-titulo" className="t-section">
                Avisos de la administración
              </h2>
              <p className="t-nota">Mensajes recibidos en tu cuenta</p>
            </div>
            <Link href="/residente/notificaciones" prefetch={false} className="btn" data-variant="quiet" data-size="sm">
              Ver todos
            </Link>
          </header>

          {avisos.length === 0 ? (
            <p className={styles.vacio}>
              <Bell aria-hidden="true" />
              No tienes avisos todavía.
            </p>
          ) : (
            <ul>
              {avisos.map((n) => (
                <li key={n.id} className={styles.aviso}>
                  <div>
                    <p>{n.mensaje}</p>
                    <p className="t-nota">{fechaHora(n.fechaEnvio)}</p>
                  </div>
                  <span className="chip" data-tone="info">
                    {n.tipoNotificacion}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
