'use client'

import { CalendarDays, Check, Download, FileText, Infinity as Siempre, UserCheck, UserPlus } from 'lucide-react'
import { Aviso, useAviso } from '@/components/ui/notice'
import { Chip } from '@/components/ui/chip'
import { Plate } from '@/components/ui/plate'
import { cop, CUOTA } from '@/lib/complex'
import { useHoy } from '@/lib/use-hoy'
import styles from './resident-dashboard.module.css'

const ACCIONES = [
  { texto: 'Invitar visitante', icono: UserPlus },
  { texto: 'Reservar zona común', icono: CalendarDays },
  { texto: 'Ver mis recibos', icono: FileText },
] as const

const ACTIVIDADES = [
  {
    cuando: 'Sáb 14',
    mes: 'nov',
    titulo: 'Salón social',
    esPersona: false,
    detalle: '4:00 p. m. a 8:00 p. m.',
    estado: 'Confirmada',
  },
  {
    cuando: 'Hoy',
    mes: '',
    titulo: 'Mariana López',
    esPersona: true,
    detalle: 'Visita autorizada hasta las 11:00 p. m.',
    estado: 'Activa',
  },
  {
    cuando: 'Siempre',
    mes: '',
    titulo: 'Andrés Rojas',
    esPersona: true,
    detalle: 'Autorización permanente',
    estado: 'Permanente',
  },
] as const

export function ResidentDashboard() {
  const { mensaje, avisar } = useAviso()
  const hoy = useHoy()
  const pendiente = (texto: string) => avisar(`Acción lista para conectar con tu backend: ${texto}`)

  return (
    <div className={styles.pagina}>
      <header>
        <h1 className={`t-voz ${styles.saludo}`}>Hola, Santiago</h1>
        <p className={styles.sub}>
          <strong className="fecha-hoy">{hoy}</strong>
          Tienes una cuenta de cobro por pagar.
        </p>
      </header>

      <div className={styles.principal}>
        {/* La cuenta de cobro: papel con perforación y talón de pago */}
        <div className={styles.cuentaMarco}>
          <section className={styles.cuenta} aria-labelledby="cuenta-titulo">
            <div className={styles.cuerpo}>
              <p className={styles.tipo}>Cuenta de cobro</p>
              <h2 id="cuenta-titulo" className={`t-voz ${styles.concepto}`}>
                Administración de noviembre
              </h2>
              <p className={`t-hero ${styles.importe}`}>{cop(CUOTA)}</p>
              <dl className={styles.datos}>
                <div>
                  <dt>Vence</dt>
                  <dd>10 de noviembre</dd>
                </div>
                <div>
                  <dt>Apartamento</dt>
                  <dd>
                    <Plate torre="A" apto={302} />
                  </dd>
                </div>
                <div>
                  <dt>Coeficiente</dt>
                  <dd>0,5051&nbsp;%</dd>
                </div>
              </dl>
            </div>

            <div className={styles.perforacion} aria-hidden="true" />

            <div className={styles.talon}>
              <button
                type="button"
                className="btn"
                data-variant="primary"
                data-size="lg"
                onClick={() => pendiente('Pagar con Wompi')}
              >
                Pagar {cop(CUOTA)}
              </button>
              <p className={styles.talonNota}>Pago seguro con Wompi: PSE, tarjeta o Nequi.</p>
            </div>
          </section>
        </div>

        <div className={styles.lateral}>
          <section className={styles.estado} aria-labelledby="estado-titulo">
            <h2 id="estado-titulo" className="t-section">
              Estado de cuenta
            </h2>
            <div className={styles.estadoFila}>
              <p className={styles.sello}>Paz y salvo</p>
              <p className="t-nota">Estás al día. Tu último pago fue el 10 de octubre.</p>
            </div>
            <button
              type="button"
              className="btn"
              data-variant="quiet"
              onClick={() => pendiente('Descargar paz y salvo')}
            >
              <Download aria-hidden="true" />
              Descargar paz y salvo
            </button>
          </section>

          <section className={styles.acciones} aria-labelledby="acciones-titulo">
            <h2 id="acciones-titulo" className="t-section">
              Qué quieres hacer
            </h2>
            <ul>
              {ACCIONES.map(({ texto, icono: Icono }) => (
                <li key={texto}>
                  <button type="button" className={`btn ${styles.accion}`} data-variant="secondary" onClick={() => pendiente(texto)}>
                    <Icono aria-hidden="true" />
                    {texto}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <section className={`hoja ${styles.proximas}`} aria-labelledby="proximas-titulo">
        <header className={styles.proximasCabecera}>
          <h2 id="proximas-titulo" className="t-section">
            Reservas e invitaciones
          </h2>
          <p className="t-nota">4 invitados registrados, 2 activos hoy</p>
        </header>
        <ul>
          {ACTIVIDADES.map((a) => (
            <li key={a.titulo} className={styles.actividad}>
              <p className={styles.cuando}>
                {a.cuando}
                {a.mes && <span className={styles.mes}>{a.mes}</span>}
              </p>
              <div>
                <h3 className={a.esPersona ? `t-voz ${styles.persona}` : styles.lugar}>{a.titulo}</h3>
                <p className="t-nota">{a.detalle}</p>
              </div>
              {a.estado === 'Confirmada' && (
                <Chip tono="ok" icono={Check}>
                  Confirmada
                </Chip>
              )}
              {a.estado === 'Activa' && (
                <Chip tono="info" icono={UserCheck}>
                  Activa
                </Chip>
              )}
              {a.estado === 'Permanente' && (
                <Chip tono="neutral" icono={Siempre}>
                  Permanente
                </Chip>
              )}
            </li>
          ))}
        </ul>
      </section>

      <Aviso mensaje={mensaje} />
    </div>
  )
}
