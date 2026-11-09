'use client'

import { Clock, LogIn, LogOut, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { Aviso, useAviso } from '@/components/ui/notice'
import { Chip } from '@/components/ui/chip'
import { Plate } from '@/components/ui/plate'
import type { Torre } from '@/lib/complex'
import { useHoy } from '@/lib/use-hoy'
import styles from './security-dashboard.module.css'

type Rol = 'Visitante' | 'Residente' | 'Proveedor'

interface Evento {
  id: string
  hora: string
  nombre: string
  rol: Rol
  detalle?: string
  torre?: Torre
  apto?: number
  tipo: 'entrada' | 'salida'
  temporal?: boolean
  /** Una entrada que ya tiene su salida registrada. */
  yaSalio?: boolean
}

interface Esperado {
  id: string
  nombre: string
  detalle: string
  torre: Torre
  apto: number
}

// Datos de ejemplo hasta conectar el backend. La minuta va de la más reciente a la más antigua.
const EVENTOS_INICIALES: Evento[] = [
  { id: 'm1', hora: '10:42 a. m.', nombre: 'Mariana López', rol: 'Visitante', torre: 'A', apto: 302, tipo: 'entrada' },
  { id: 'm2', hora: '10:36 a. m.', nombre: 'Diego Ramírez', rol: 'Residente', torre: 'B', apto: 504, tipo: 'entrada' },
  {
    id: 'm3',
    hora: '10:21 a. m.',
    nombre: 'Jorge Gómez',
    rol: 'Proveedor',
    detalle: 'Mantenimiento del ascensor, torre B',
    tipo: 'entrada',
    temporal: true,
  },
  { id: 'm4', hora: '10:08 a. m.', nombre: 'Ana Salazar', rol: 'Visitante', torre: 'C', apto: 801, tipo: 'salida' },
]

const ESPERADOS_INICIALES: Esperado[] = [
  { id: 'e1', nombre: 'Andrés Rojas', detalle: 'Autorización permanente', torre: 'A', apto: 302 },
  { id: 'e2', nombre: 'Paula Giraldo', detalle: 'Visita autorizada hasta las 6:00 p. m.', torre: 'C', apto: 604 },
  { id: 'e3', nombre: 'Camilo Soto', detalle: 'Invitado al salón social desde las 2:00 p. m.', torre: 'B', apto: 806 },
]

const RESERVAS = [
  { id: 'r1', hora: '11:00 a. m.', lugar: 'Gimnasio', nombre: 'Carlos Ruiz', torre: 'A', apto: 204, enCurso: true },
  { id: 'r2', hora: '2:00 p. m.', lugar: 'Salón social', nombre: 'Laura Torres', torre: 'B', apto: 806, enCurso: false },
  { id: 'r3', hora: '6:00 p. m.', lugar: 'Zona BBQ', nombre: 'Felipe Mora', torre: 'C', apto: 601, enCurso: false },
] as const

const quitarTildes = (texto: string) => texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

/** Busca por nombre, detalle o apartamento: «mariana», «302», «a-302» o «a 302». */
function coincide(consulta: string, p: { nombre: string; detalle?: string; torre?: Torre; apto?: number }) {
  const q = quitarTildes(consulta).trim()
  if (!q) return true
  const texto = quitarTildes(`${p.nombre} ${p.detalle ?? ''} ${p.torre ?? ''}-${p.apto ?? ''} ${p.torre ?? ''} ${p.apto ?? ''}`)
  return q.split(/\s+/).every((parte) => texto.includes(parte))
}

function ahora() {
  return new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date())
}

function partesHora(hora: string) {
  const [numero, ...resto] = hora.split(/\s/)
  return { numero, sufijo: resto.join(' ') }
}

function descripcion(ev: Evento) {
  if (!ev.detalle) return ev.rol
  return `${ev.rol}, ${ev.detalle.charAt(0).toLowerCase()}${ev.detalle.slice(1)}`
}

function Hora({ hora }: { hora: string }) {
  const { numero, sufijo } = partesHora(hora)
  return (
    <time className={styles.hora}>
      <span className={styles.horaNumero}>{numero}</span>
      <span className={styles.horaSufijo}>{sufijo}</span>
    </time>
  )
}

export function SecurityDashboard() {
  const { mensaje, avisar } = useAviso()
  const hoy = useHoy()
  const [consulta, setConsulta] = useState('')
  const [esperados, setEsperados] = useState(ESPERADOS_INICIALES)
  const [eventos, setEventos] = useState(EVENTOS_INICIALES)
  const [conteo, setConteo] = useState({ visitantes: 12, residentes: 26, ingresosHoy: 84 })
  const [nuevos, setNuevos] = useState<string[]>([])
  const [hayCambios, setHayCambios] = useState(false)

  const dentro = conteo.visitantes + conteo.residentes
  const esperadosVisibles = esperados.filter((e) => coincide(consulta, e))
  const eventosVisibles = eventos.filter((ev) => coincide(consulta, ev))

  function registrarIngreso(e: Esperado) {
    const id = `n${Date.now()}`
    setEsperados((lista) => lista.filter((x) => x.id !== e.id))
    setEventos((lista) => [
      { id, hora: ahora(), nombre: e.nombre, rol: 'Visitante', detalle: e.detalle, torre: e.torre, apto: e.apto, tipo: 'entrada' },
      ...lista,
    ])
    setConteo((c) => ({ ...c, visitantes: c.visitantes + 1, ingresosHoy: c.ingresosHoy + 1 }))
    setNuevos((lista) => [...lista, id])
    setHayCambios(true)
    avisar(`Ingreso registrado: ${e.nombre}`)
  }

  function registrarSalida(ev: Evento) {
    const id = `n${Date.now()}`
    setEventos((lista) => [
      { ...ev, id, hora: ahora(), tipo: 'salida', yaSalio: undefined },
      ...lista.map((x) => (x.id === ev.id ? { ...x, yaSalio: true } : x)),
    ])
    setConteo((c) => ({ ...c, visitantes: Math.max(0, c.visitantes - 1) }))
    setNuevos((lista) => [...lista, id])
    setHayCambios(true)
    avisar(`Salida registrada: ${ev.nombre}`)
  }

  return (
    <div className={styles.pagina}>
      <header className={styles.cabecera}>
        <div>
          <h1 className="t-title">Portería</h1>
          <p className={styles.sub}>
            <strong className="fecha-hoy">{hoy}</strong>
            Turno de la mañana, de 6:00 a. m. a 2:00 p. m.
          </p>
        </div>
        <p className={styles.turno}>
          <span className={styles.punto} aria-hidden="true" />
          Turno activo
        </p>
      </header>

      <section className={`hoja ${styles.resumen}`} aria-label="Resumen del turno">
        <div className={styles.dentro}>
          <p key={dentro} className={`t-hero ${styles.numero}`} data-cambio={hayCambios}>
            {dentro}
          </p>
          <div>
            <p className={styles.rotulo}>personas dentro</p>
            <p className="t-nota">
              {conteo.visitantes} visitantes y {conteo.residentes} residentes
            </p>
          </div>
        </div>
        <dl className={styles.cifras}>
          <div className={styles.cifra}>
            <dt>Ingresos hoy</dt>
            <dd className="t-cifra">{conteo.ingresosHoy}</dd>
          </div>
          <div className={styles.cifra}>
            <dt>Reservas hoy</dt>
            <dd className="t-cifra">6</dd>
            <dd className="t-nota">1 en curso ahora</dd>
          </div>
        </dl>
      </section>

      <div className={styles.herramientas}>
        <label className={`campo ${styles.buscar}`}>
          <Search aria-hidden="true" />
          <input
            type="search"
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
            placeholder="Nombre o apartamento"
            aria-label="Buscar por nombre o apartamento"
          />
        </label>
        <button
          type="button"
          className={`btn ${styles.registrar}`}
          data-variant="primary"
          data-size="lg"
          onClick={() => avisar('Acción lista para conectar con tu backend: Registrar acceso')}
        >
          <Plus aria-hidden="true" />
          Registrar acceso
        </button>
      </div>

      <div className={styles.columnas}>
        <div className={styles.izquierda}>
          <section className={`hoja ${styles.panel}`} aria-labelledby="esperados-titulo">
            <header className={styles.panelCabecera}>
              <h2 id="esperados-titulo" className="t-section">
                Esperados
              </h2>
              <p className="t-nota">Autorizados por residentes y aún sin entrar</p>
            </header>
            {esperadosVisibles.length === 0 ? (
              <p className={styles.vacio}>
                {esperados.length === 0 ? 'No hay más visitas esperadas por ahora.' : 'Nadie esperado coincide con la búsqueda.'}
              </p>
            ) : (
              <ul>
                {esperadosVisibles.map((e) => (
                  <li key={e.id} className={styles.esperado}>
                    <div>
                      <h3 className={`t-voz ${styles.nombre}`}>{e.nombre}</h3>
                      <p className="t-nota">{e.detalle}</p>
                    </div>
                    <Plate torre={e.torre} apto={e.apto} />
                    <button
                      type="button"
                      className={`btn ${styles.accion}`}
                      data-variant="primary"
                      onClick={() => registrarIngreso(e)}
                    >
                      <LogIn aria-hidden="true" />
                      Registrar ingreso
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={`hoja ${styles.panel}`} aria-labelledby="minuta-titulo">
            <header className={styles.panelCabecera}>
              <h2 id="minuta-titulo" className="t-section">
                Minuta de hoy
              </h2>
              <p className="t-nota">Entradas y salidas, de la más reciente a la más antigua</p>
            </header>
            {eventosVisibles.length === 0 ? (
              <p className={styles.vacio}>Ningún registro coincide con la búsqueda.</p>
            ) : (
              <ol className={styles.minuta}>
                {eventosVisibles.map((ev) => (
                  <li key={ev.id} className={styles.registro} data-nuevo={nuevos.includes(ev.id)}>
                    <Hora hora={ev.hora} />
                    <div className={styles.registroTexto}>
                      <h3 className={`t-voz ${styles.nombre}`}>{ev.nombre}</h3>
                      <p className="t-nota">{descripcion(ev)}</p>
                      {ev.tipo === 'entrada' && ev.rol !== 'Residente' && !ev.yaSalio && (
                        <button
                          type="button"
                          className={`btn ${styles.salida}`}
                          data-variant="secondary"
                          data-size="sm"
                          onClick={() => registrarSalida(ev)}
                        >
                          <LogOut aria-hidden="true" />
                          Registrar salida
                        </button>
                      )}
                    </div>
                    <div className={styles.registroMeta}>
                      {ev.torre && ev.apto && <Plate torre={ev.torre} apto={ev.apto} />}
                      <Chip icono={ev.tipo === 'entrada' ? LogIn : LogOut}>{ev.tipo === 'entrada' ? 'Entrada' : 'Salida'}</Chip>
                      {ev.temporal && (
                        <Chip tono="wait" icono={Clock}>
                          Temporal
                        </Chip>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <section className={`hoja ${styles.panel}`} aria-labelledby="reservas-titulo">
          <header className={styles.panelCabecera}>
            <h2 id="reservas-titulo" className="t-section">
              Reservas de hoy
            </h2>
            <p className="t-nota">Uso de zonas comunes</p>
          </header>
          <ol className={styles.reservas}>
            {RESERVAS.map((r) => (
              <li key={r.id} className={styles.reserva} data-en-curso={r.enCurso}>
                <Hora hora={r.hora} />
                <span className={styles.riel} aria-hidden="true" />
                <div>
                  <h3 className={styles.lugar}>{r.lugar}</h3>
                  <p className={`t-voz ${styles.reservante}`}>{r.nombre}</p>
                  <div className={styles.reservaPlaca}>
                    <Plate torre={r.torre} apto={r.apto} />
                  </div>
                </div>
                {r.enCurso ? (
                  <Chip tono="info" icono={Clock}>
                    En curso
                  </Chip>
                ) : (
                  <Chip>Próxima</Chip>
                )}
              </li>
            ))}
          </ol>
          <p className={`t-nota ${styles.terminadas}`}>Las otras 3 reservas de hoy ya terminaron.</p>
        </section>
      </div>

      <Aviso mensaje={mensaje} />
    </div>
  )
}
