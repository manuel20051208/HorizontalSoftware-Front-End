'use client'

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react'
import styles from './usuarios.module.css'

const CerrarPopover = createContext<() => void>(() => {})

/** Para el contenido del panel: cierra el popover (p. ej. al terminar con éxito o con «Cancelar»). */
export function useCerrarPopover() {
  return useContext(CerrarPopover)
}

/** Cierra el popover cuando la acción del formulario responde bien. */
export function useCerrarAlTerminar(estado: { estado: string } | undefined, ok = 'ok') {
  const cerrar = useCerrarPopover()
  useEffect(() => {
    if (estado?.estado === ok) cerrar()
  }, [estado, ok, cerrar])
}

/**
 * Botón que abre un panel flotante anclado a él (ancho fijo, no estira la fila de la tabla). Es un
 * <details>: sin JavaScript igual se abre y el formulario de dentro se envía. Con JavaScript se cierra al
 * pulsar fuera o con Escape (el foco vuelve al botón) y al abrir el foco va al primer campo.
 * `alinear` = de qué lado del botón crece el panel ('fin' para la última columna de una tabla).
 */
export function Popover({
  boton,
  ariaLabel,
  titulo,
  variante = 'secondary',
  alinear = 'inicio',
  children,
}: {
  boton: React.ReactNode
  ariaLabel?: string
  titulo: string
  variante?: 'primary' | 'secondary' | 'quiet'
  alinear?: 'inicio' | 'fin'
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDetailsElement>(null)
  const resumen = useRef<HTMLElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const [abierto, setAbierto] = useState(false)
  const id = useId()

  const cerrar = useCallback(() => {
    if (ref.current?.open) ref.current.open = false
  }, [])

  useEffect(() => {
    if (!abierto) return
    const detalles = ref.current
    panel.current
      ?.querySelector<HTMLElement>("input:not([type='hidden']), select, textarea, button[type='submit']")
      ?.focus()

    const fuera = (e: PointerEvent) => {
      if (detalles && !detalles.contains(e.target as Node)) cerrar()
    }
    const tecla = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      cerrar()
      resumen.current?.focus()
    }
    document.addEventListener('pointerdown', fuera)
    document.addEventListener('keydown', tecla)
    return () => {
      document.removeEventListener('pointerdown', fuera)
      document.removeEventListener('keydown', tecla)
    }
  }, [abierto, cerrar])

  return (
    <details
      ref={ref}
      className={styles.popover}
      data-alinear={alinear}
      onToggle={(e) => setAbierto(e.currentTarget.open)}
    >
      <summary
        ref={resumen}
        className="btn"
        data-variant={variante}
        data-size="sm"
        aria-label={ariaLabel}
        aria-expanded={abierto}
        aria-controls={id}
      >
        {boton}
      </summary>
      <div ref={panel} id={id} className={styles.popoverPanel} role="group" aria-label={titulo}>
        <p className={styles.popoverTitulo}>{titulo}</p>
        <CerrarPopover.Provider value={cerrar}>{children}</CerrarPopover.Provider>
      </div>
    </details>
  )
}
