'use client'

import { ArrowRightLeft, Check, CircleAlert, House, HousePlus, UserMinus, UserPlus } from 'lucide-react'
import { useActionState, useId } from 'react'
import {
  agregarInmueble,
  agregarPersona,
  type EstadoRelacion,
  mudarInmueble,
  quitarInmueble,
} from '@/lib/usuarios/acciones'
import { INVITADO, type InmuebleBasico } from '@/lib/usuarios/tipos'
import { Popover, useCerrarAlTerminar, useCerrarPopover } from './popover'
import styles from './usuarios.module.css'

/* Lo que hace el back en la misma operación, dicho antes de confirmar. */
function efectosMudar(esInvitado: boolean, origen: string) {
  return esInvitado
    ? `Deja ${origen} y queda en el apartamento nuevo. Conserva sus otros apartamentos.`
    : `Sus reservas futuras de ${origen} pasan al apartamento nuevo si la zona existe allí; si no, se cancelan. El parqueadero de su auto en ${origen} queda libre y sus invitados se mudan solo si ningún otro anfitrión sigue en ${origen}.`
}

function efectosQuitar(esInvitado: boolean, direccion: string, ultimo: boolean | undefined) {
  const efectos = esInvitado
    ? `Deja de estar relacionado con ${direccion}.`
    : `Se cancelan sus reservas futuras de ${direccion}, el parqueadero de su auto en ${direccion} queda libre y sus invitados pierden ${direccion} si ningún otro anfitrión sigue allí.`
  const cuenta =
    ultimo === true
      ? 'Es su único apartamento: la cuenta quedará inactiva y se cerrará su sesión.'
      : ultimo === false
        ? 'Conserva sus otros apartamentos.'
        : 'Si es su único apartamento, la cuenta quedará inactiva y se cerrará su sesión.'
  return { efectos, cuenta, alerta: ultimo !== false }
}

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
 * Contenido del popover para agregar o mudar: select y botón en una fila, aviso debajo. Funciona sin
 * JavaScript (es un form). Al guardar con éxito el popover se cierra y la celda muestra el cambio.
 */
function FormularioApartamento({
  accion,
  inmuebles,
  etiqueta,
  boton,
  aviso,
}: {
  accion: (previo: EstadoRelacion, datos: FormData) => Promise<EstadoRelacion>
  inmuebles: InmuebleBasico[]
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

/** Confirmación de «Quitar» dentro del popover (nada de window.confirm). */
function ConfirmarQuitar({
  accion,
  efectos,
  cuenta,
  alerta,
}: {
  accion: (previo: EstadoRelacion) => Promise<EstadoRelacion>
  efectos: string
  cuenta: string
  alerta: boolean
}) {
  const [estado, enviar, enviando] = useActionState(accion, undefined)
  const cerrar = useCerrarPopover()
  useCerrarAlTerminar(estado)

  return (
    <form action={enviar} className={styles.popoverForm}>
      <p className={styles.popoverAyuda}>{efectos}</p>
      <p className={alerta ? styles.popoverAlerta : styles.popoverAyuda}>{cuenta}</p>
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

/**
 * «Quitar» a una persona de un apartamento. `ultimo` = es su único apartamento (la cuenta queda inactiva);
 * undefined si no se sabe (el aviso lo dice como condición).
 */
export function QuitarDeApartamento({
  identificacion,
  nombre,
  tipoUsuario,
  inmuebleId,
  direccion,
  ultimo,
  alinear = 'inicio',
}: {
  identificacion: number
  nombre: string
  tipoUsuario: string
  inmuebleId: number
  direccion: string
  ultimo: boolean | undefined
  alinear?: 'inicio' | 'fin'
}) {
  const { efectos, cuenta, alerta } = efectosQuitar(tipoUsuario === INVITADO.tipo, direccion, ultimo)
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
      <ConfirmarQuitar
        accion={quitarInmueble.bind(null, identificacion, inmuebleId)}
        efectos={efectos}
        cuenta={cuenta}
        alerta={alerta}
      />
    </Popover>
  )
}

/**
 * Celda «Apartamentos» de un residente o invitado en la lista de usuarios: cada apartamento con «Mudar» y
 * «Quitar», y «Agregar apartamento» al final.
 */
export function ApartamentosUsuario({
  identificacion,
  nombre,
  tipoUsuario,
  inmuebles,
  disponibles,
}: {
  identificacion: number
  nombre: string
  tipoUsuario: string
  inmuebles: InmuebleBasico[]
  /** Apartamentos activos del conjunto (null = no se pudieron cargar). */
  disponibles: InmuebleBasico[] | null
}) {
  const esInvitado = tipoUsuario === INVITADO.tipo
  const suyos = new Set(inmuebles.map((i) => i.id))
  const otros = (disponibles ?? []).filter((i) => !suyos.has(i.id))
  const ultimo = inmuebles.length === 1

  return (
    <div className={styles.relacion}>
      {inmuebles.length === 0 ? (
        <span className={`${styles.relacionApto} ${styles.sinDato}`}>Sin apartamento</span>
      ) : (
        <ul className={styles.aptos} aria-label={`Apartamentos de ${nombre}`}>
          {inmuebles.map((i) => (
            <li key={i.id} className={styles.aptoFila}>
              <span className={styles.aptoChip}>
                <House aria-hidden="true" />
                {i.direccionInmueble}
              </span>
              {otros.length > 0 && (
                <Popover
                  boton={
                    <>
                      <ArrowRightLeft aria-hidden="true" />
                      Mudar
                    </>
                  }
                  ariaLabel={`Mudar a ${nombre} de ${i.direccionInmueble} a otro apartamento`}
                  titulo={`Mudar a ${nombre} de ${i.direccionInmueble}`}
                  variante="quiet"
                >
                  <FormularioApartamento
                    accion={mudarInmueble.bind(null, identificacion, i.id)}
                    inmuebles={otros}
                    etiqueta="Apartamento nuevo"
                    boton="Mudar"
                    aviso={efectosMudar(esInvitado, i.direccionInmueble)}
                  />
                </Popover>
              )}
              <QuitarDeApartamento
                identificacion={identificacion}
                nombre={nombre}
                tipoUsuario={tipoUsuario}
                inmuebleId={i.id}
                direccion={i.direccionInmueble}
                ultimo={ultimo}
              />
            </li>
          ))}
        </ul>
      )}

      {disponibles === null ? (
        <span className={`t-nota ${styles.sinDato}`}>No se cargaron los apartamentos.</span>
      ) : otros.length > 0 ? (
        <Popover
          boton={
            <>
              <HousePlus aria-hidden="true" />
              Agregar apartamento
            </>
          }
          ariaLabel={`Agregar un apartamento a ${nombre}`}
          titulo={`Agregar un apartamento a ${nombre}`}
        >
          <FormularioApartamento
            accion={agregarInmueble.bind(null, identificacion)}
            inmuebles={otros}
            etiqueta="Apartamento"
            boton="Agregar"
            aviso={inmuebles.length === 0 ? NO_ACTIVA : 'Conserva sus otros apartamentos.'}
          />
        </Popover>
      ) : (
        inmuebles.length === 0 && <span className={`t-nota ${styles.sinDato}`}>No hay apartamentos activos.</span>
      )}
    </div>
  )
}

export type Candidato = { identificacion: number; nombreCompleto: string; sinApartamento: boolean }

/** En el detalle del inmueble: elige a un residente o invitado que no esté en este apartamento y lo agrega. */
export function AgregarPersona({
  inmuebleId,
  residentes,
  invitados,
}: {
  inmuebleId: number
  residentes: Candidato[]
  invitados: Candidato[]
}) {
  const [estado, enviar, enviando] = useActionState(agregarPersona.bind(null, inmuebleId), undefined)
  const id = useId()
  const opcion = (c: Candidato) => (
    <option key={c.identificacion} value={c.identificacion}>
      {`${c.nombreCompleto} · ${c.identificacion}${c.sinApartamento ? ' (sin apartamento)' : ''}`}
    </option>
  )

  return (
    <form action={enviar} className={styles.agregarResidente}>
      <div className={styles.activarFila}>
        <div className={`${styles.grupo} ${styles.grupoAncho}`}>
          <label htmlFor={`${id}-persona`} className={styles.etiqueta}>
            Agregar a este apartamento
          </label>
          <select
            id={`${id}-persona`}
            name="identificacion"
            required
            defaultValue=""
            className={styles.entrada}
            aria-invalid={estado?.estado === 'error' ? true : undefined}
            aria-describedby={estado?.estado === 'error' ? `${id}-error` : `${id}-ayuda`}
          >
            <option value="" disabled>
              Elige a la persona…
            </option>
            {residentes.length > 0 && <optgroup label="Residentes">{residentes.map(opcion)}</optgroup>}
            {invitados.length > 0 && <optgroup label="Invitados">{invitados.map(opcion)}</optgroup>}
          </select>
        </div>
        <button type="submit" className="btn" data-variant="primary" disabled={enviando}>
          <UserPlus aria-hidden="true" />
          {enviando ? 'Agregando…' : 'Agregar'}
        </button>
      </div>
      <p id={`${id}-ayuda`} className={styles.ayudaCampo}>
        Conserva sus otros apartamentos. Una cuenta sin apartamento no se activa sola: después actívala o verifica
        su correo.
      </p>
      <Resultado estado={estado} id={`${id}-error`} />
    </form>
  )
}
