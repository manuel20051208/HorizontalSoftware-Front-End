'use client'

import { Check, CircleAlert } from 'lucide-react'
import { useActionState } from 'react'
import type { EstadoAccion } from '@/lib/api/acciones'
import styles from './gestion.module.css'

type AccionFormulario = (previo: EstadoAccion, datos: FormData) => Promise<EstadoAccion>
type AccionBoton = (previo: EstadoAccion) => Promise<EstadoAccion>

function Mensaje({ estado }: { estado: EstadoAccion }) {
  if (!estado) return null
  if (estado.estado === 'ok') {
    return (
      <p className={styles.confirmacion} role="status">
        <Check aria-hidden="true" />
        <span>{estado.mensaje}</span>
      </p>
    )
  }
  return (
    <div className={styles.problema} role="alert">
      <CircleAlert aria-hidden="true" />
      <div>
        <p>{estado.mensaje}</p>
        {estado.errores && Object.keys(estado.errores).length > 0 && (
          <ul style={{ marginTop: '0.375rem', paddingLeft: '1.125rem', listStyle: 'disc' }}>
            {Object.entries(estado.errores).map(([campo, mensaje]) => (
              <li key={campo}>{mensaje}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

/** Formulario que envía una Server Action y muestra su resultado. */
export function FormularioAccion({
  accion,
  children,
  texto,
  textoEnviando,
  variante = 'primary',
  tamano,
  className,
  noValidate = true,
  pie,
  sinPie = false,
}: {
  accion: AccionFormulario
  children: React.ReactNode
  texto: string
  textoEnviando?: string
  variante?: 'primary' | 'secondary'
  tamano?: 'lg'
  className?: string
  noValidate?: boolean
  pie?: React.ReactNode
  sinPie?: boolean
}) {
  const [estado, enviar, enviando] = useActionState(accion, undefined)
  return (
    <form action={enviar} className={`${styles.formulario} ${className ?? ''}`} noValidate={noValidate}>
      {children}
      <Mensaje estado={estado} />
      {!sinPie && (
        <div className={styles.pie}>
          <button type="submit" className="btn" data-variant={variante} data-size={tamano} disabled={enviando}>
            {enviando ? (textoEnviando ?? 'Guardando…') : texto}
          </button>
          {pie}
        </div>
      )}
    </form>
  )
}

/** Botón de fila que ejecuta una Server Action ya enlazada con sus argumentos. */
export function BotonAccion({
  accion,
  children,
  variante = 'secondary',
  tamano = 'sm',
  confirmar,
  ariaLabel,
  disabled,
}: {
  accion: AccionBoton
  children: React.ReactNode
  variante?: 'primary' | 'secondary' | 'quiet'
  tamano?: 'sm'
  confirmar?: string
  ariaLabel?: string
  disabled?: boolean
}) {
  const [estado, enviar, enviando] = useActionState(accion, undefined)
  return (
    <form action={enviar} className={styles.accionForm}>
      <button
        type="submit"
        className="btn"
        data-variant={variante}
        data-size={tamano}
        disabled={enviando || disabled}
        aria-label={ariaLabel}
        onClick={(e) => {
          if (confirmar && !window.confirm(confirmar)) e.preventDefault()
        }}
      >
        {enviando ? 'Guardando…' : children}
      </button>
      {estado?.estado === 'error' && (
        <p className={styles.errorFila} role="alert">
          {estado.mensaje}
        </p>
      )}
      {estado?.estado === 'ok' && (
        <p className={styles.okFila} role="status">
          {estado.mensaje}
        </p>
      )}
    </form>
  )
}
