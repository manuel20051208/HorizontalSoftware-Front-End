'use client'

import {
  CalendarClock,
  Check,
  Clock,
  type LucideIcon,
  Megaphone,
  Receipt,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { Aviso, useAviso } from '@/components/ui/notice'
import { Chip } from '@/components/ui/chip'
import { Plate } from '@/components/ui/plate'
import { cop, copMillones, POR_COBRAR, RECAUDO_MES, TOTAL_UNIDADES, TOTALES, type Torre } from '@/lib/complex'
import { useHoy } from '@/lib/use-hoy'
import styles from './admin-dashboard.module.css'
import { TowerPlan } from './tower-plan'

const ACCIONES: { texto: string; icono: LucideIcon; variante: 'primary' | 'secondary'; href?: string }[] = [
  { texto: 'Nuevo comunicado', icono: Megaphone, variante: 'primary' },
  { texto: 'Crear cuenta', icono: UserPlus, variante: 'secondary', href: '/admin/usuarios/nueva' },
  { texto: 'Registrar pago', icono: Receipt, variante: 'secondary' },
  { texto: 'Usuarios', icono: Users, variante: 'secondary', href: '/admin/usuarios' },
]

const COMUNICADOS = [
  {
    titulo: 'Mantenimiento del ascensor de la Torre B',
    para: 'Todos los residentes',
    cuando: 'Hoy, 9:42 a. m.',
    estado: 'Publicado',
  },
  {
    titulo: 'Asamblea general ordinaria de copropietarios',
    para: 'Propietarios',
    cuando: 'Sale el lunes 9 de noviembre, 8:00 a. m.',
    estado: 'Programado',
  },
  {
    titulo: 'Cierre temporal de la piscina',
    para: 'Todos los residentes',
    cuando: '3 de noviembre, 11:20 a. m.',
    estado: 'Publicado',
  },
] as const

const PAGOS: { nombre: string; torre: Torre; apto: number; estado: 'Confirmado' | 'Pendiente'; cuando: string }[] = [
  { nombre: 'Laura Méndez', torre: 'A', apto: 402, estado: 'Confirmado', cuando: 'Hace 8 min' },
  { nombre: 'Ana Torres', torre: 'A', apto: 201, estado: 'Pendiente', cuando: 'Hace 35 min' },
  { nombre: 'Carlos Rojas', torre: 'B', apto: 803, estado: 'Confirmado', cuando: 'Hace 2 h' },
  { nombre: 'Julián Castro', torre: 'C', apto: 504, estado: 'Confirmado', cuando: 'Ayer' },
]

const VALOR_CUOTA = 485_000

export function AdminDashboard() {
  const { mensaje, avisar } = useAviso()
  const hoy = useHoy()

  return (
    <div className={styles.pagina}>
      <header className={styles.cabecera}>
        <div className={styles.titulo}>
          <h1 className="t-title">Panel administrativo</h1>
          <p className={styles.sub}>
            <strong className="fecha-hoy">{hoy}</strong>
            La administración de noviembre vence el martes 10.
          </p>
        </div>
        <div className={styles.acciones}>
          {ACCIONES.map(({ texto, icono: Icono, variante, href }) =>
            href ? (
              <Link key={texto} href={href} prefetch={false} className={`btn ${styles.accion}`} data-variant={variante}>
                <Icono aria-hidden="true" />
                {texto}
              </Link>
            ) : (
              <button
                key={texto}
                type="button"
                className={`btn ${styles.accion}`}
                data-variant={variante}
                onClick={() => avisar(`Acción lista para conectar con tu backend: ${texto}`)}
              >
                <Icono aria-hidden="true" />
                {texto}
              </button>
            ),
          )}
        </div>
      </header>

      <div className={styles.principal}>
        <TowerPlan onAviso={avisar} />

        <aside className={`hoja ${styles.resumen}`} aria-label="Resumen del mes">
          <div>
            <p className={styles.rotulo}>Recaudo de noviembre</p>
            <p className={`t-hero ${styles.hero}`}>{copMillones(RECAUDO_MES)}</p>
            <p className={styles.delta}>
              <TrendingUp aria-hidden="true" strokeWidth={2.4} />
              +12,8 % frente a octubre
            </p>
          </div>

          <dl className={styles.cifras}>
            <div className={styles.cifra}>
              <dt>Por cobrar</dt>
              <dd className="t-cifra">{copMillones(POR_COBRAR)}</dd>
              <dd className="t-nota">
                {TOTAL_UNIDADES - TOTALES['al-dia']} apartamentos, {TOTALES.vencida} con octubre sin pagar
              </dd>
            </div>
            <div className={styles.cifra}>
              <dt>Por autorizar</dt>
              <dd className="t-cifra">12</dd>
              <dd className="t-nota">
                usuarios nuevos esperando aprobación ·{' '}
                <Link href="/admin/usuarios?estado=inactivas" prefetch={false} className={styles.enlace}>
                  Revisar
                </Link>
              </dd>
            </div>
            <div className={styles.cifra}>
              <dt>Comunicados activos</dt>
              <dd className="t-cifra">8</dd>
              <dd className="t-nota">3 programados esta semana</dd>
            </div>
          </dl>
        </aside>
      </div>

      <div className={styles.inferior}>
        <section className={`hoja ${styles.panel}`} aria-labelledby="comunicados-titulo">
          <header className={styles.panelCabecera}>
            <div>
              <h2 id="comunicados-titulo" className="t-section">
                Comunicados recientes
              </h2>
              <p className="t-nota">Lo que ha recibido la comunidad</p>
            </div>
            <button
              type="button"
              className="btn"
              data-variant="quiet"
              data-size="sm"
              onClick={() => avisar('Acción lista para conectar con tu backend: Ver todos los comunicados')}
            >
              Ver todos
            </button>
          </header>
          <ul>
            {COMUNICADOS.map((c) => (
              <li key={c.titulo} className={styles.comunicado}>
                <div>
                  <h3 className={`t-voz ${styles.comunicadoTitulo}`}>{c.titulo}</h3>
                  <p className="t-nota">Para {c.para.toLowerCase()}</p>
                  <p className="t-nota">{c.cuando}</p>
                </div>
                {c.estado === 'Publicado' ? (
                  <Chip tono="ok" icono={Check}>
                    Publicado
                  </Chip>
                ) : (
                  <Chip tono="info" icono={CalendarClock}>
                    Programado
                  </Chip>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className={`hoja ${styles.panel}`} aria-labelledby="pagos-titulo">
          <header className={styles.panelCabecera}>
            <div>
              <h2 id="pagos-titulo" className="t-section">
                Últimos pagos
              </h2>
              <p className="t-nota">Recibidos por Wompi</p>
            </div>
          </header>
          <table className={styles.tabla}>
            <caption className="sr-only">Últimos pagos de administración recibidos</caption>
            <thead>
              <tr>
                <th scope="col">Apartamento</th>
                <th scope="col">Residente</th>
                <th scope="col" className={styles.derecha}>
                  Valor
                </th>
                <th scope="col">Estado</th>
                <th scope="col">Cuándo</th>
              </tr>
            </thead>
            <tbody>
              {PAGOS.map((p) => (
                <tr key={`${p.torre}${p.apto}`}>
                  <td className={styles.cPlaca}>
                    <Plate torre={p.torre} apto={p.apto} />
                  </td>
                  <td className={`t-voz ${styles.cNombre}`}>{p.nombre}</td>
                  <td className={`t-columna ${styles.derecha} ${styles.cValor}`}>{cop(VALOR_CUOTA)}</td>
                  <td className={styles.cEstado}>
                    {p.estado === 'Confirmado' ? (
                      <Chip tono="ok" icono={Check}>
                        Confirmado
                      </Chip>
                    ) : (
                      <Chip tono="wait" icono={Clock}>
                        Pendiente
                      </Chip>
                    )}
                  </td>
                  <td className={`t-nota ${styles.cCuando}`}>{p.cuando}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <Aviso mensaje={mensaje} />
    </div>
  )
}
