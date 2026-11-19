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
import { Popover, useCerrarAlTerminar, useCerrarPopover } from './popover'
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

/**
 * Contenido del popover para asignar o cambiar: select y botón en una fila, aviso debajo. Funciona sin
 * JavaScript (es un form). Al guardar con éxito el popover se cierra y la celda muestra el apartamento nuevo.
 */
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
  useCerrarAlTerminar(estado)

  return (
    <form action={enviar} className={styles.popoverForm}>
      <label htmlFor={`${id}-inmueble`} className="sr-only">
        {etiqueta}
      </label>
      <div className={styles.popoverFila}>
        <select
          id={`${id}-inmueble`}
          name="inmuebleId"
          required
          defaultValue=""
          className={`${styles.entrada} ${styles.popoverEntrada}`}
          aria-invalid={estado?.estado === 'error' ? true : undefined}
          aria-describedby={estado?.estado === 'error' ? `${id}-error` : `${id}-aviso`}
        >
          <option value="" disabled>
            {etiqueta}…
          </option>
          {inmuebles.map((i) => (
            <option key={i.id} value={i.id}>
              {i.direccionInmueble}
            </option>
          ))}
        </select>
        <button type="submit" className="btn" data-variant="primary" data-size="sm" disabled={enviando}>
          {enviando ? 'Guardando…' : boton}
        </button>
      </div>
      <p id={`${id}-aviso`} className={styles.popoverAyuda}>
        {aviso}
      </p>
      <Resultado estado={estado} id={`${id}-error`} />
    </form>
  )
}

/** Confirmación de «Quitar del apartamento» dentro del popover (nada de window.confirm). */
function ConfirmarQuitar({ identificacion }: { identificacion: number }) {
  const [estado, enviar, enviando] = useActionState(desvincularInmueble.bind(null, identificacion), undefined)
  const cerrar = useCerrarPopover()

  return (
    <form action={enviar} className={styles.popoverForm}>
      <p className={styles.popoverAyuda}>{EFECTOS_QUITAR}</p>
      <Resultado estado={estado} />
      <div className={styles.popoverAcciones}>
        <button type="button" className="btn" data-variant="quiet" data-size="sm" onClick={cerrar}>
          Cancelar
        </button>
        <button
          type="submit"
          className={`btn ${styles.btnPeligro}`}
          data-variant="primary"
          data-size="sm"
          disabled={enviando}
        >
          {enviando ? 'Quitando…' : 'Sí, quitar'}
        </button>
      </div>
    </form>
  )
}

/** «Quitar del apartamento»: abre la confirmación con lo que pasa y el botón que envía el DELETE. */
export function QuitarDelApartamento({
  identificacion,
  nombre,
  direccion,
  alinear = 'inicio',
}: {
  identificacion: number
  nombre: string
  direccion: string
  alinear?: 'inicio' | 'fin'
}) {
  return (
    <Popover
      boton={
        <>
          <UserMinus aria-hidden="true" />
          Quitar
        </>
      }
      ariaLabel={`Quitar a ${nombre} de ${direccion}`}
      titulo={`¿Quitar a ${nombre} de ${direccion}?`}
      variante="quiet"
      alinear={alinear}
    >
      <ConfirmarQuitar identificacion={identificacion} />
    </Popover>
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
            <Popover
              boton={
                <>
                  <ArrowRightLeft aria-hidden="true" />
                  Cambiar
                </>
              }
              ariaLabel={`Cambiar el apartamento de ${nombre}`}
              titulo={`Cambiar el apartamento de ${nombre}`}
            >
              <FormularioApartamento
                accion={cambiarInmueble.bind(null, identificacion)}
                inmuebles={otros}
                etiqueta="Apartamento nuevo"
                boton="Cambiar"
                aviso={EFECTOS_CAMBIAR}
              />
            </Popover>
          )
        ) : otros.length > 0 ? (
          <Popover
            boton={
              <>
                <HousePlus aria-hidden="true" />
                Asignar apartamento
              </>
            }
            ariaLabel={`Asignar un apartamento a ${nombre}`}
            titulo={`Asignar un apartamento a ${nombre}`}
          >
            <FormularioApartamento
              accion={vincularInmueble.bind(null, identificacion)}
              inmuebles={otros}
              etiqueta="Apartamento"
              boton="Asignar"
              aviso={NO_ACTIVA}
            />
          </Popover>
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
