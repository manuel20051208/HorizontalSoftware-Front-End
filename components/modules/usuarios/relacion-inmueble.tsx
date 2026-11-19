'use client'

import { ArrowRightLeft, Check, CircleAlert, House, HousePlus, UserMinus, UserPlus } from 'lucide-react'
import { useActionState, useId } from 'react'
import {
  agregarResidente,
  cambiarInmueble,
  desvincularInmueble,
  type EstadoRelacion,
  vincularInmueble,
} from '@/lib/usuarios/acciones'
import type { Inmueble } from '@/lib/usuarios/tipos'
import styles from './usuarios.module.css'

/** Lo que pasa al mudar o quitar a un residente (lo hace el back en la misma operación). */
const EFECTOS_CAMBIAR =
  'Sus invitados que no tengan otro anfitrión se mudan con él, el parqueadero de su auto queda libre y se cancelan sus reservas futuras de zonas que el apartamento nuevo no tenga.'
const EFECTOS_QUITAR =
  'Su cuenta queda inactiva y se cierra su sesión. Sus invitados que no tengan otro anfitrión se desactivan, el parqueadero de su auto queda libre y se cancelan todas sus reservas futuras.'
const NO_ACTIVA = 'La cuenta no se activa sola: después actívala o verifica su correo.'

function Resultado({ estado, id }: { estado: EstadoRelacion; id?: string }) {
  if (!estado) return null
  if (estado.estado === 'ok') {
    return (
      <p className={styles.okRelacion} role="status">
        <Check aria-hidden="true" />
        {estado.mensaje}
      </p>
    )
  }
  return (
    <p id={id} className={styles.errorCampo} role="alert">
      <CircleAlert aria-hidden="true" />
      {estado.mensaje}
    </p>
  )
}

/** Select + botón que envía un apartamento (asignar o cambiar). Funciona sin JavaScript: es un form. */
function FormularioApartamento({
  accion,
  inmuebles,
  etiqueta,
  boton,
  aviso,
}: {
  accion: (previo: EstadoRelacion, datos: FormData) => Promise<EstadoRelacion>
  inmuebles: Inmueble[]
  etiqueta: string
  boton: string
  aviso: string
}) {
  const [estado, enviar, enviando] = useActionState(accion, undefined)
  const id = useId()

  return (
    <form action={enviar} className={styles.desplegableCuerpo}>
      <div className={styles.grupo}>
        <label htmlFor={`${id}-inmueble`} className={styles.etiqueta}>
          {etiqueta}
        </label>
        <select
          id={`${id}-inmueble`}
          name="inmuebleId"
          required
          defaultValue=""
          className={`${styles.entrada} ${styles.entradaFila}`}
          aria-invalid={estado?.estado === 'error' ? true : undefined}
          aria-describedby={estado?.estado === 'error' ? `${id}-error` : undefined}
        >
          <option value="" disabled>
            Elige…
          </option>
          {inmuebles.map((i) => (
            <option key={i.id} value={i.id}>
              {i.direccionInmueble}
            </option>
          ))}
        </select>
      </div>
      <p className={styles.aviso}>{aviso}</p>
      <button type="submit" className="btn" data-variant="primary" data-size="sm" disabled={enviando}>
        {enviando ? 'Guardando…' : boton}
      </button>
      <Resultado estado={estado} id={`${id}-error`} />
    </form>
  )
}

/**
 * «Quitar del apartamento» con la confirmación dentro de la misma UI (nada de window.confirm): el botón
 * despliega el aviso de lo que pasa y el botón que de verdad envía el DELETE.
 */
export function QuitarDelApartamento({
  identificacion,
  nombre,
  direccion,
}: {
  identificacion: number
  nombre: string
  direccion: string
}) {
  const [estado, enviar, enviando] = useActionState(desvincularInmueble.bind(null, identificacion), undefined)

  return (
    <details className={styles.desplegable}>
      <summary className="btn" data-variant="quiet" data-size="sm" aria-label={`Quitar a ${nombre} de ${direccion}`}>
        <UserMinus aria-hidden="true" />
        Quitar del apartamento
      </summary>
      <form action={enviar} className={`${styles.desplegableCuerpo} ${styles.desplegablePeligro}`}>
        <p className={styles.aviso}>
          <strong>
            ¿Quitar a {nombre} de {direccion}?
          </strong>{' '}
          {EFECTOS_QUITAR}
        </p>
        <button type="submit" className="btn" data-variant="primary" data-size="sm" disabled={enviando}>
          {enviando ? 'Quitando…' : 'Sí, quitar del apartamento'}
        </button>
        <Resultado estado={estado} />
      </form>
    </details>
  )
}

/** Celda «Apartamento» de un residente en la lista de usuarios: ver, asignar, cambiar o quitar. */
export function ApartamentoResidente({
  identificacion,
  nombre,
  inmuebleId,
  direccion,
  inmuebles,
}: {
  identificacion: number
  nombre: string
  inmuebleId: number | null
  direccion: string | null
  /** null = no se pudieron cargar los apartamentos. */
  inmuebles: Inmueble[] | null
}) {
  const otros = (inmuebles ?? []).filter((i) => i.id !== inmuebleId)
  const tiene = inmuebleId !== null && direccion !== null

  return (
    <div className={styles.relacion}>
      {tiene ? (
        <span className={styles.relacionApto}>
          <House aria-hidden="true" />
          {direccion}
        </span>
      ) : (
        <span className={`${styles.relacionApto} ${styles.sinDato}`}>Sin apartamento</span>
      )}

      <div className={styles.relacionAcciones}>
        {inmuebles === null ? (
          <span className={`t-nota ${styles.sinDato}`}>No se cargaron los apartamentos.</span>
        ) : tiene ? (
          otros.length > 0 && (
            <details className={styles.desplegable}>
              <summary className="btn" data-variant="secondary" data-size="sm" aria-label={`Cambiar el apartamento de ${nombre}`}>
                <ArrowRightLeft aria-hidden="true" />
                Cambiar apartamento
              </summary>
              <FormularioApartamento
                accion={cambiarInmueble.bind(null, identificacion)}
                inmuebles={otros}
                etiqueta="Apartamento nuevo"
                boton="Cambiar apartamento"
                aviso={EFECTOS_CAMBIAR}
              />
            </details>
          )
        ) : otros.length > 0 ? (
          <details className={styles.desplegable}>
            <summary className="btn" data-variant="secondary" data-size="sm" aria-label={`Asignar un apartamento a ${nombre}`}>
              <HousePlus aria-hidden="true" />
              Asignar apartamento
            </summary>
            <FormularioApartamento
              accion={vincularInmueble.bind(null, identificacion)}
              inmuebles={otros}
              etiqueta="Apartamento"
              boton="Asignar apartamento"
              aviso={NO_ACTIVA}
            />
          </details>
        ) : (
          <span className={`t-nota ${styles.sinDato}`}>No hay apartamentos activos.</span>
        )}
        {tiene && <QuitarDelApartamento identificacion={identificacion} nombre={nombre} direccion={direccion} />}
      </div>
    </div>
  )
}

/** En el detalle del inmueble: elige a un residente sin apartamento y lo deja en este. */
export function AgregarResidente({
  inmuebleId,
  candidatos,
}: {
  inmuebleId: number
  candidatos: { identificacion: number; nombreCompleto: string }[]
}) {
  const [estado, enviar, enviando] = useActionState(agregarResidente.bind(null, inmuebleId), undefined)
  const id = useId()

  return (
    <form action={enviar} className={styles.agregarResidente}>
      <div className={styles.activarFila}>
        <div className={`${styles.grupo} ${styles.grupoAncho}`}>
          <label htmlFor={`${id}-residente`} className={styles.etiqueta}>
            Residente sin apartamento
          </label>
          <select
            id={`${id}-residente`}
            name="identificacion"
            required
            defaultValue=""
            className={styles.entrada}
            aria-invalid={estado?.estado === 'error' ? true : undefined}
            aria-describedby={estado?.estado === 'error' ? `${id}-error` : `${id}-ayuda`}
          >
            <option value="" disabled>
              Elige…
            </option>
            {candidatos.map((c) => (
              <option key={c.identificacion} value={c.identificacion}>
                {c.nombreCompleto} · {c.identificacion}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn" data-variant="primary" disabled={enviando}>
          <UserPlus aria-hidden="true" />
          {enviando ? 'Agregando…' : 'Agregar residente'}
        </button>
      </div>
      <p id={`${id}-ayuda`} className={styles.ayudaCampo}>
        {NO_ACTIVA}
      </p>
      <Resultado estado={estado} id={`${id}-error`} />
    </form>
  )
}
