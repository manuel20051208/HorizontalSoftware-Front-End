'use client'

import { useActionState } from 'react'
import type { EstadoActivo } from '@/lib/usuarios/acciones'
import styles from './usuarios.module.css'

/** Activar o desactivar una cuenta desde su fila. Funciona también sin JavaScript (es un form). */
export function BotonActivo({
  activa,
  nombre,
  accion,
}: {
  activa: boolean
  nombre: string
  accion: (previo: EstadoActivo) => Promise<EstadoActivo>
}) {
  const [estado, enviar, enviando] = useActionState(accion, undefined)
  const verbo = activa ? 'Desactivar' : 'Activar'

  return (
    <form action={enviar} className={styles.formActivo}>
      <button
        type="submit"
        className="btn"
        data-variant={activa ? 'quiet' : 'secondary'}
        data-size="sm"
        disabled={enviando}
        aria-label={`${verbo} la cuenta de ${nombre}`}
      >
        {enviando ? 'Guardando…' : verbo}
      </button>
      {estado?.error && (
        <p className={styles.errorFila} role="alert">
          {estado.error}
        </p>
      )}
    </form>
  )
}
