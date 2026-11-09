'use client'

import { Info } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import styles from './notice.module.css'

/** Aviso temporal: confirma una acción sin sacar a la persona de la pantalla. */
export function useAviso() {
  const [mensaje, setMensaje] = useState('')
  const temporizador = useRef<ReturnType<typeof setTimeout>>(undefined)

  const avisar = useCallback((texto: string) => {
    clearTimeout(temporizador.current)
    setMensaje(texto)
    temporizador.current = setTimeout(() => setMensaje(''), 4500)
  }, [])

  useEffect(() => () => clearTimeout(temporizador.current), [])

  return { mensaje, avisar }
}

export function Aviso({ mensaje }: { mensaje: string }) {
  return (
    <div className={styles.region} role="status" aria-live="polite">
      {mensaje && (
        <p key={mensaje} className={styles.aviso}>
          <Info aria-hidden="true" />
          <span>{mensaje}</span>
        </p>
      )}
    </div>
  )
}
