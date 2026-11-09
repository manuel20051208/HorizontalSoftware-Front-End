'use client'

import { Check, CircleAlert, Clock, Send } from 'lucide-react'
import { Fragment, useRef, useState, type CSSProperties } from 'react'
import { Chip } from '@/components/ui/chip'
import { Plate } from '@/components/ui/plate'
import {
  APTOS_POR_PISO,
  cop,
  ESTADO_TEXTO,
  PISOS,
  TORRES,
  TOTAL_UNIDADES,
  TOTALES,
  UNIDADES,
  type Estado,
  type Torre,
  type Unidad,
} from '@/lib/complex'
import styles from './tower-plan.module.css'

const ESTADOS: Estado[] = ['al-dia', 'por-vencer', 'vencida']
const TONO = { 'al-dia': 'ok', 'por-vencer': 'wait', vencida: 'alert' } as const
const ICONO_CHIP = { 'al-dia': Check, 'por-vencer': Clock, vencida: CircleAlert } as const
const POR_ID = new Map(UNIDADES.map((u) => [`${u.torre}-${u.apto}`, u]))
const FILAS = Array.from({ length: PISOS }, (_, i) => PISOS - i)
const CON_SALDO = UNIDADES.filter((u) => u.estado !== 'al-dia').sort(
  (a, b) => Number(b.estado === 'vencida') - Number(a.estado === 'vencida') || a.torre.localeCompare(b.torre) || a.apto - b.apto,
)

type Vista = 'plano' | 'lista'
type Pista = { u: Unidad; x: number; y: number; abajo: boolean }

function textoFecha(u: Unidad) {
  if (u.estado === 'al-dia') return `Último pago el ${u.fecha}`
  if (u.estado === 'por-vencer') return `Vence el ${u.fecha}`
  return `Venció el ${u.fecha}`
}

/** Un recuadro de color con el ícono de su estado: la leyenda y las celdas hablan igual. */
function Marca({ estado }: { estado: Estado }) {
  return (
    <span className={styles.marca} data-estado={estado} aria-hidden="true">
      {estado === 'al-dia' && <Check strokeWidth={3} />}
      {estado === 'por-vencer' && <Clock strokeWidth={2.8} />}
      {estado === 'vencida' && <span className={styles.signo}>!</span>}
    </span>
  )
}

export function TowerPlan({ onAviso }: { onAviso: (texto: string) => void }) {
  const [vista, setVista] = useState<Vista>('plano')
  const [filtro, setFiltro] = useState<Estado | null>(null)
  const [torreMovil, setTorreMovil] = useState<Torre>('A')
  const [seleccion, setSeleccion] = useState<Unidad | null>(null)
  const [pista, setPista] = useState<Pista | null>(null)
  const lienzo = useRef<HTMLDivElement>(null)

  const esSeleccion = (u: Unidad) => seleccion?.torre === u.torre && seleccion.apto === u.apto
  const recordar = (u: Unidad) =>
    onAviso(`Acción lista para conectar con tu backend: Enviar recordatorio a la torre ${u.torre}, apartamento ${u.apto}`)

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

  const filasLista = CON_SALDO.filter((u) => filtro === null || u.estado === filtro)

  return (
    <section className={`hoja ${styles.plano}`} aria-labelledby="plano-titulo">
      <header className={styles.cabecera}>
        <div>
          <h2 id="plano-titulo" className="t-section">
            Cartera de noviembre
          </h2>
          <p className={`t-nota ${styles.nota}`}>
            Cada recuadro es un apartamento. La lista muestra los {TOTAL_UNIDADES - TOTALES['al-dia']} que tienen saldo.
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

      <div className={styles.resumen}>
        <div
          className={styles.barra}
          role="img"
          aria-label={`${TOTALES['al-dia']} al día, ${TOTALES['por-vencer']} por vencer, ${TOTALES.vencida} vencidas, de ${TOTAL_UNIDADES} apartamentos`}
        >
          {ESTADOS.map((e) => (
            <span key={e} data-estado={e} style={{ flexGrow: TOTALES[e] }} />
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
                <span>{ESTADO_TEXTO[e]}</span>
                <span className={styles.total}>{TOTALES[e]}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {vista === 'plano' ? (
        <div className={styles.lienzo} ref={lienzo}>
          <div className={styles.torres} role="group" aria-label="Torre que se muestra">
            {TORRES.map((t) => (
              <button key={t} type="button" className={styles.torreTab} aria-pressed={torreMovil === t} onClick={() => setTorreMovil(t)}>
                Torre {t}
              </button>
            ))}
          </div>

          <div className={styles.rejilla}>
            <span className={styles.pisoTitulo} aria-hidden="true">
              Piso
            </span>
            {TORRES.map((t, i) => (
              <h3 key={t} className={styles.torreNombre} style={{ '--col': 2 + i * 7 } as CSSProperties}>
                Torre {t}
              </h3>
            ))}

            {FILAS.map((piso, fila) => (
              <Fragment key={piso}>
                <span className={styles.piso} style={{ '--fila': fila + 2 } as CSSProperties} aria-hidden="true">
                  {piso}
                </span>
                {TORRES.flatMap((torre, i) =>
                  Array.from({ length: APTOS_POR_PISO }, (_, n) => {
                    const u = POR_ID.get(`${torre}-${piso * 100 + n + 1}`)!
                    const activa = filtro === null || filtro === u.estado
                    return (
                      <button
                        key={`${torre}${u.apto}`}
                        type="button"
                        className={styles.celda}
                        data-estado={u.estado}
                        data-activa={activa ? 'true' : 'false'}
                        data-visible-movil={torre === torreMovil ? 'true' : 'false'}
                        style={{ '--fila': fila + 2, '--col': 2 + i * 7 + n, '--col-movil': 2 + n } as CSSProperties}
                        // Los apartamentos al día son recuadros clicables; el teclado va directo a los que tienen saldo.
                        tabIndex={u.estado === 'al-dia' ? -1 : 0}
                        aria-label={`Torre ${u.torre}, apartamento ${u.apto}: ${ESTADO_TEXTO[u.estado]}`}
                        aria-pressed={esSeleccion(u)}
                        onClick={() => setSeleccion((actual) => (actual && esSeleccion(u) ? null : u))}
                        onPointerEnter={(e) => mostrarPista(u, e.currentTarget)}
                        onPointerLeave={() => setPista(null)}
                        onFocus={(e) => mostrarPista(u, e.currentTarget)}
                        onBlur={() => setPista(null)}
                      >
                        {u.estado === 'por-vencer' && <Clock aria-hidden="true" strokeWidth={2.8} />}
                        {u.estado === 'vencida' && (
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
                <Chip tono={TONO[pista.u.estado]} icono={ICONO_CHIP[pista.u.estado]}>
                  {ESTADO_TEXTO[pista.u.estado]}
                </Chip>
              </div>
              <p className={styles.pistaValor}>{pista.u.debe > 0 ? cop(pista.u.debe) : 'Sin saldo'}</p>
              {pista.u.residente && <p className={`t-voz ${styles.pistaNombre}`}>{pista.u.residente}</p>}
              <p className={styles.pistaFecha}>{textoFecha(pista.u)}</p>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.listaMarco}>
          {filasLista.length === 0 ? (
            <p className={styles.vacia}>Ningún apartamento con saldo en este estado.</p>
          ) : (
            <table className={styles.tabla}>
              <caption className="sr-only">Apartamentos con saldo pendiente en noviembre</caption>
              <thead>
                <tr>
                  <th scope="col">Apartamento</th>
                  <th scope="col">Residente</th>
                  <th scope="col">Estado</th>
                  <th scope="col" className={styles.derecha}>
                    Debe
                  </th>
                  <th scope="col">Vencimiento</th>
                  <th scope="col">
                    <span className="sr-only">Acción</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filasLista.map((u) => (
                  <tr key={`${u.torre}${u.apto}`}>
                    <td className={styles.cPlaca}>
                      <Plate torre={u.torre} apto={u.apto} />
                    </td>
                    <td className={`t-voz ${styles.cNombre}`}>{u.residente}</td>
                    <td className={styles.cEstado}>
                      <Chip tono={TONO[u.estado]} icono={ICONO_CHIP[u.estado]}>
                        {ESTADO_TEXTO[u.estado]}
                      </Chip>
                    </td>
                    <td className={`t-columna ${styles.derecha} ${styles.cValor}`}>{cop(u.debe)}</td>
                    <td className={`t-nota ${styles.cFecha}`}>
                      <span className={styles.soloMovil}>{u.estado === 'vencida' ? 'Venció el ' : 'Vence el '}</span>
                      {u.fecha}
                    </td>
                    <td className={styles.cAccion}>
                      <button
                        type="button"
                        className="btn"
                        data-variant="quiet"
                        data-size="sm"
                        onClick={() => recordar(u)}
                        aria-label={`Enviar recordatorio a la torre ${u.torre}, apartamento ${u.apto}`}
                      >
                        <Send aria-hidden="true" />
                        Recordar
                      </button>
                    </td>
                  </tr>
                ))}
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
                <p className="t-voz">{seleccion.residente ?? 'Residente sin nombre en el ejemplo'}</p>
                <p className="t-nota">{textoFecha(seleccion)}</p>
              </div>
              <Chip tono={TONO[seleccion.estado]} icono={ICONO_CHIP[seleccion.estado]}>
                {ESTADO_TEXTO[seleccion.estado]}
              </Chip>
              <p className={styles.deuda}>
                {seleccion.debe > 0 ? (
                  <>
                    <span className="t-cifra">{cop(seleccion.debe)}</span>
                    <span className="t-nota">por pagar</span>
                  </>
                ) : (
                  <span className="t-nota">Sin saldo</span>
                )}
              </p>
              {seleccion.estado !== 'al-dia' && (
                <button type="button" className="btn" data-variant="secondary" data-size="sm" onClick={() => recordar(seleccion)}>
                  <Send aria-hidden="true" />
                  Enviar recordatorio
                </button>
              )}
            </div>
          ) : (
            <p className="t-nota">Toca un apartamento para ver su estado de cuenta.</p>
          )}
        </footer>
      )}
    </section>
  )
}
