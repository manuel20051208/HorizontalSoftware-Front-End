'use client'

import { Check, CircleAlert, Clock, ExternalLink, Send } from 'lucide-react'
import Link from 'next/link'
import { Fragment, useActionState, useRef, useState, type CSSProperties } from 'react'
import { Chip } from '@/components/ui/chip'
import { Plate } from '@/components/ui/plate'
import type { EstadoAccion } from '@/lib/api/acciones'
import { pesos } from '@/lib/api/acciones'
import {
  ESTADO_CARTERA_TEXTO,
  type EstadoCartera,
  type InmuebleResumen,
} from '@/lib/api/tipos'
import { enviarRecordatorioForm } from '@/lib/admin/acciones'
import styles from './tower-plan.module.css'

const ESTADOS: EstadoCartera[] = ['AL_DIA', 'POR_VENCER', 'VENCIDA', 'SIN_LIQUIDACION']
// A partir de aquí el plano pasa a pestañas por torre (una a la vez), para no desbordar ni dejar huecos
const MAX_TORRES_ANCHAS = 3
const MAX_COLUMNAS_ANCHAS = 20
const TONO = { AL_DIA: 'ok', POR_VENCER: 'wait', VENCIDA: 'alert', SIN_LIQUIDACION: 'neutral' } as const
const ICONO_CHIP = { AL_DIA: Check, POR_VENCER: Clock, VENCIDA: CircleAlert, SIN_LIQUIDACION: Clock } as const
const MARCA = { AL_DIA: 'al-dia', POR_VENCER: 'por-vencer', VENCIDA: 'vencida', SIN_LIQUIDACION: 'sin' } as const

type Unidad = { inmueble: InmuebleResumen; torre: string; apto: number; piso: number }
type Vista = 'plano' | 'lista'
type Pista = { u: Unidad; x: number; y: number; abajo: boolean }

function partes(direccion: string) {
  const m = /^([A-Z0-9]+)-(\d+)$/.exec(direccion.toUpperCase())
  if (!m) return null
  const apto = Number(m[2])
  const piso = Math.floor(apto / 100)
  const posicion = apto % 100
  if (!Number.isFinite(piso) || piso < 1 || piso > 99 || posicion < 1 || posicion > 99) return null
  return { torre: m[1], apto, piso }
}

function textoFecha(u: Unidad) {
  if (u.inmueble.estadoPago === 'SIN_LIQUIDACION') return 'Sin liquidación generada'
  if (!u.inmueble.fechaLimitePendiente) return 'Sin fecha límite'
  const fecha = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(
    new Date(`${u.inmueble.fechaLimitePendiente}T00:00:00Z`),
  )
  if (u.inmueble.estadoPago === 'VENCIDA') return `Venció el ${fecha}`
  if (u.inmueble.estadoPago === 'POR_VENCER') return `Vence el ${fecha}`
  return `Último vencimiento: ${fecha}`
}

function Marca({ estado }: { estado: EstadoCartera }) {
  return (
    <span className={styles.marca} data-estado={MARCA[estado]} aria-hidden="true">
      {estado === 'AL_DIA' && <Check strokeWidth={3} />}
      {(estado === 'POR_VENCER' || estado === 'SIN_LIQUIDACION') && <Clock strokeWidth={2.8} />}
      {estado === 'VENCIDA' && <span className={styles.signo}>!</span>}
    </span>
  )
}

function BotonRecordar({ inmuebleId, direccion }: { inmuebleId: number; direccion: string }) {
  const [estado, enviar, enviando] = useActionState<EstadoAccion, FormData>(enviarRecordatorioForm, undefined)
  return (
    <form action={enviar} style={{ display: 'grid', gap: '0.25rem', justifyItems: 'end' }}>
      <input type="hidden" name="inmuebleId" value={inmuebleId} />
      <button
        type="submit"
        className="btn"
        data-variant="quiet"
        data-size="sm"
        disabled={enviando}
        aria-label={`Enviar recordatorio de pago a ${direccion}`}
      >
        <Send aria-hidden="true" />
        {enviando ? 'Enviando…' : 'Recordar'}
      </button>
      {estado?.estado === 'error' && (
        <p style={{ color: 'var(--alerta)', fontSize: '0.75rem', maxWidth: '12rem' }} role="alert">
          {estado.mensaje}
        </p>
      )}
      {estado?.estado === 'ok' && (
        <p style={{ color: 'var(--ok)', fontSize: '0.75rem', maxWidth: '12rem' }} role="status">
          {estado.mensaje}
        </p>
      )}
    </form>
  )
}

export function TowerPlan({ inmuebles }: { inmuebles: InmuebleResumen[] }) {
  const [vista, setVista] = useState<Vista>('plano')
  const [filtro, setFiltro] = useState<EstadoCartera | null>(null)
  const [torreMovil, setTorreMovil] = useState<string>('')
  const [seleccion, setSeleccion] = useState<Unidad | null>(null)
  const [pista, setPista] = useState<Pista | null>(null)
  const lienzo = useRef<HTMLDivElement>(null)

  const unidades = inmuebles
    .map((inmueble) => {
      const p = partes(inmueble.direccionInmueble)
      return p ? { inmueble, ...p } : null
    })
    .filter((u): u is Unidad => u !== null)

  const porId = new Map(unidades.map((u) => [`${u.torre}-${u.apto}`, u]))
  const totales = Object.fromEntries(
    ESTADOS.map((e) => [e, inmuebles.filter((i) => i.estadoPago === e).length]),
  ) as Record<EstadoCartera, number>
  const conSaldo = inmuebles
    .filter((i) => i.estadoPago !== 'AL_DIA')
    .sort(
      (a, b) =>
        Number(b.estadoPago === 'VENCIDA') - Number(a.estadoPago === 'VENCIDA') ||
        a.direccionInmueble.localeCompare(b.direccionInmueble),
    )
  const filasLista = conSaldo.filter((i) => filtro === null || i.estadoPago === filtro)
  // Todo se deriva de los inmuebles reales: sin torres/pisos/aptos cableados
  const torres = [...new Set(unidades.map((u) => u.torre))].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true }),
  )
  const aptos = Math.max(1, ...unidades.map((u) => u.apto % 100))
  const pisosAlto = Math.max(1, ...unidades.map((u) => u.piso))
  const filas = Array.from({ length: pisosAlto }, (_, i) => pisosAlto - i)
  const modoTabs = torres.length > MAX_TORRES_ANCHAS || torres.length * aptos > MAX_COLUMNAS_ANCHAS
  const torreSel = torres.includes(torreMovil) ? torreMovil : (torres[0] ?? '')
  // Rejilla por variables CSS: columna de piso + un bloque de `aptos` por torre (celdas de tamaño fijo), separados por un hueco
  const gridAnchos =
    '1.75rem ' + torres.map(() => `repeat(${aptos}, var(--tam-celda))`).join(' clamp(0.75rem, 3vw, 2.25rem) ')
  const gridUno = `1.75rem repeat(${aptos}, var(--tam-celda))`
  const esSeleccion = (u: Unidad) => seleccion?.inmueble.id === u.inmueble.id

  function mostrarPista(u: Unidad, el: HTMLElement) {
    const caja = lienzo.current?.getBoundingClientRect()
    if (!caja) return
    const r = el.getBoundingClientRect()
    const abajo = r.top - caja.top < 170
    setPista({
      u,
      abajo,
      x: Math.min(Math.max(r.left - caja.left + r.width / 2, 120), caja.width - 120),
      y: (abajo ? r.bottom : r.top) - caja.top,
    })
  }

  return (
    <section className={`hoja ${styles.plano}`} aria-labelledby="plano-titulo">
      <header className={styles.cabecera}>
        <div>
          <h2 id="plano-titulo" className="t-section">
            Cartera del periodo
          </h2>
          <p className={`t-nota ${styles.nota}`}>
            Cada recuadro es un inmueble registrado. La lista muestra los {conSaldo.length} que tienen saldo o están sin
            liquidación.
          </p>
        </div>
        <div className={styles.vistas} role="group" aria-label="Vista de la cartera">
          {(['plano', 'lista'] as const).map((v) => (
            <button key={v} type="button" className={styles.vista} aria-pressed={vista === v} onClick={() => setVista(v)}>
              {v === 'plano' ? 'Plano' : 'Lista'}
            </button>
          ))}
        </div>
      </header>

      {inmuebles.length === 0 ? (
        <p className={styles.vacia}>
          Aún no hay inmuebles registrados.{' '}
          <Link href="/admin/inmuebles/nuevo" className="btn" data-variant="quiet" data-size="sm">
            Crear el primero
          </Link>
        </p>
      ) : (
        <>
          <div className={styles.resumen}>
            <div
              className={styles.barra}
              role="img"
              aria-label={`${totales.AL_DIA} al día, ${totales.POR_VENCER} por vencer, ${totales.VENCIDA} vencidas y ${totales.SIN_LIQUIDACION} sin liquidación, de ${inmuebles.length} inmuebles`}
            >
              {ESTADOS.map((e) => (
                <span key={e} data-estado={MARCA[e]} style={{ flexGrow: totales[e] }} />
              ))}
            </div>
            <ul className={styles.leyenda} aria-label="Filtrar por estado">
              {ESTADOS.map((e) => (
                <li key={e}>
                  <button
                    type="button"
                    className={styles.filtro}
                    aria-pressed={filtro === e}
                    onClick={() => setFiltro((actual) => (actual === e ? null : e))}
                  >
                    <Marca estado={e} />
                    <span>{ESTADO_CARTERA_TEXTO[e]}</span>
                    <span className={styles.total}>{totales[e]}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {vista === 'plano' ? (
            <div className={styles.lienzo} ref={lienzo}>
              <div
                className={styles.torres}
                data-modo={modoTabs ? 'tabs' : 'anchos'}
                role="group"
                aria-label="Torre que se muestra"
              >
                {torres.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={styles.torreTab}
                    aria-pressed={torreSel === t}
                    onClick={() => setTorreMovil(t)}
                  >
                    Torre {t}
                  </button>
                ))}
              </div>

              <div
                className={styles.rejilla}
                data-modo={modoTabs ? 'tabs' : 'anchos'}
                style={
                  {
                    '--grid-anchos': gridAnchos,
                    '--grid-uno': gridUno,
                  } as CSSProperties
                }
              >
                <span className={styles.pisoTitulo} aria-hidden="true">
                  Piso
                </span>
                {torres.map((t, i) => (
                  <h3
                    key={t}
                    className={styles.torreNombre}
                    style={{ '--col': 2 + i * (aptos + 1), '--span': aptos } as CSSProperties}
                  >
                    Torre {t}
                  </h3>
                ))}

                {filas.map((piso, fila) => (
                  <Fragment key={piso}>
                    <span className={styles.piso} style={{ '--fila': fila + 2 } as CSSProperties} aria-hidden="true">
                      {piso}
                    </span>
                    {torres.flatMap((torre, i) =>
                      Array.from({ length: aptos }, (_, n) => {
                        const apto = piso * 100 + n + 1
                        const u = porId.get(`${torre}-${apto}`)
                        if (!u) {
                          return (
                            <span
                              key={`${torre}${apto}`}
                              className={styles.celda}
                              data-estado="vacia"
                              data-activa="false"
                              data-visible={torre === torreSel ? 'true' : 'false'}
                              style={
                                { '--fila': fila + 2, '--col': 2 + i * (aptos + 1) + n, '--col-uno': 2 + n } as CSSProperties
                              }
                              aria-hidden="true"
                            />
                          )
                        }
                        const activa = filtro === null || filtro === u.inmueble.estadoPago
                        return (
                          <button
                            key={`${torre}${apto}`}
                            type="button"
                            className={styles.celda}
                            data-estado={MARCA[u.inmueble.estadoPago]}
                            data-activa={activa ? 'true' : 'false'}
                            data-visible={torre === torreSel ? 'true' : 'false'}
                            style={
                              { '--fila': fila + 2, '--col': 2 + i * (aptos + 1) + n, '--col-uno': 2 + n } as CSSProperties
                            }
                            tabIndex={u.inmueble.estadoPago === 'AL_DIA' ? -1 : 0}
                            aria-label={`${u.inmueble.direccionInmueble}: ${ESTADO_CARTERA_TEXTO[u.inmueble.estadoPago]}`}
                            aria-pressed={esSeleccion(u)}
                            onClick={() => setSeleccion((actual) => (actual && esSeleccion(u) ? null : u))}
                            onPointerEnter={(e) => mostrarPista(u, e.currentTarget)}
                            onPointerLeave={() => setPista(null)}
                            onFocus={(e) => mostrarPista(u, e.currentTarget)}
                            onBlur={() => setPista(null)}
                          >
                            {u.inmueble.estadoPago === 'VENCIDA' && (
                              <span className={styles.signo} aria-hidden="true">
                                !
                              </span>
                            )}
                          </button>
                        )
                      }),
                    )}
                  </Fragment>
                ))}
              </div>

              {pista && (
                <div
                  className={styles.pista}
                  data-abajo={pista.abajo}
                  style={{ left: pista.x, top: pista.y }}
                  role="tooltip"
                >
                  <div className={styles.pistaCabecera}>
                    <Plate torre={pista.u.torre} apto={pista.u.apto} />
                    <Chip tono={TONO[pista.u.inmueble.estadoPago]} icono={ICONO_CHIP[pista.u.inmueble.estadoPago]}>
                      {ESTADO_CARTERA_TEXTO[pista.u.inmueble.estadoPago]}
                    </Chip>
                  </div>
                  <p className={styles.pistaValor}>
                    {pista.u.inmueble.saldoPendiente > 0 ? pesos(pista.u.inmueble.saldoPendiente) : 'Sin saldo'}
                  </p>
                  <p className={styles.pistaFecha}>{textoFecha(pista.u)}</p>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.listaMarco}>
              {filasLista.length === 0 ? (
                <p className={styles.vacia}>Ningún inmueble con saldo en este estado.</p>
              ) : (
                <table className={styles.tabla}>
                  <caption className="sr-only">Inmuebles con saldo pendiente</caption>
                  <thead>
                    <tr>
                      <th scope="col">Apartamento</th>
                      <th scope="col">Estado</th>
                      <th scope="col" className={styles.derecha}>
                        Debe
                      </th>
                      <th scope="col">Vencimiento</th>
                      <th scope="col">
                        <span className="sr-only">Acciones</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filasLista.map((i) => {
                      const p = partes(i.direccionInmueble)
                      const u = p ? porId.get(`${p.torre}-${p.apto}`) : undefined
                      return (
                        <tr key={i.id}>
                          <td className={styles.cPlaca}>
                            {p ? <Plate torre={p.torre} apto={p.apto} /> : i.direccionInmueble}
                          </td>
                          <td className={styles.cEstado}>
                            <Chip tono={TONO[i.estadoPago]} icono={ICONO_CHIP[i.estadoPago]}>
                              {ESTADO_CARTERA_TEXTO[i.estadoPago]}
                            </Chip>
                          </td>
                          <td className={`t-columna ${styles.derecha} ${styles.cValor}`}>{pesos(i.saldoPendiente)}</td>
                          <td className={`t-nota ${styles.cFecha}`}>{u ? textoFecha(u) : '—'}</td>
                          <td className={styles.cAccion}>
                            <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                              <Link
                                href={`/admin/inmuebles/${i.id}`}
                                prefetch={false}
                                className="btn"
                                data-variant="quiet"
                                data-size="sm"
                                aria-label={`Ver ${i.direccionInmueble}`}
                              >
                                <ExternalLink aria-hidden="true" />
                                Detalle
                              </Link>
                              <BotonRecordar inmuebleId={i.id} direccion={i.direccionInmueble} />
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {vista === 'plano' && (
            <footer className={styles.cajetin} data-seleccion={seleccion ? 'true' : 'false'} aria-live="polite">
              {seleccion ? (
                <div className={styles.detalle}>
                  <Plate torre={seleccion.torre} apto={seleccion.apto} />
                  <div className={styles.detalleTexto}>
                    <p className={`t-voz ${styles.pistaNombre}`}>{seleccion.inmueble.direccionInmueble}</p>
                    <p className="t-nota">{textoFecha(seleccion)}</p>
                  </div>
                  <Chip tono={TONO[seleccion.inmueble.estadoPago]} icono={ICONO_CHIP[seleccion.inmueble.estadoPago]}>
                    {ESTADO_CARTERA_TEXTO[seleccion.inmueble.estadoPago]}
                  </Chip>
                  <p className={styles.deuda}>
                    {seleccion.inmueble.saldoPendiente > 0 ? (
                      <>
                        <span className="t-cifra">{pesos(seleccion.inmueble.saldoPendiente)}</span>
                        <span className="t-nota">por pagar</span>
                      </>
                    ) : (
                      <span className="t-nota">Sin saldo</span>
                    )}
                  </p>
                  <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                    <Link
                      href={`/admin/inmuebles/${seleccion.inmueble.id}`}
                      prefetch={false}
                      className="btn"
                      data-variant="secondary"
                      data-size="sm"
                    >
                      Ver detalle
                    </Link>
                    {seleccion.inmueble.estadoPago !== 'AL_DIA' && (
                      <BotonRecordar inmuebleId={seleccion.inmueble.id} direccion={seleccion.inmueble.direccionInmueble} />
                    )}
                  </div>
                </div>
              ) : (
                <p className="t-nota">Toca un inmueble para ver su estado de cuenta.</p>
              )}
            </footer>
          )}
        </>
      )}
    </section>
  )
}
