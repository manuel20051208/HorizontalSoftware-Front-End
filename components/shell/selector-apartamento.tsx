'use client'

import { Building2 } from 'lucide-react'
import { useActionState, useId } from 'react'
import { elegirInmueble } from '@/lib/residente/acciones'
import type { InmuebleBasico } from '@/lib/usuarios/tipos'
import styles from './selector-apartamento.module.css'

/**
 * Arriba del panel del residente con varios apartamentos: elige sobre cuál ve la cuenta, los pagos, las
 * reservas, los invitados y el auto. Con JavaScript cambia al elegir; sin él, con el botón «Ver». Con un solo
 * apartamento no se muestra.
 */
export function SelectorApartamento({ inmuebles, elegido }: { inmuebles: InmuebleBasico[]; elegido: number }) {
  const [estado, enviar, enviando] = useActionState(elegirInmueble, undefined)
  const id = useId()

  return (
    <form action={enviar} className={styles.selector} aria-busy={enviando || undefined}>
      <label htmlFor={`${id}-apto`} className={styles.etiqueta}>
        <Building2 aria-hidden="true" />
        Apartamento
      </label>
      <select
        id={`${id}-apto`}
        name="inmuebleId"
        defaultValue={elegido}
        className={styles.lista}
        disabled={enviando}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        aria-describedby={estado?.error ? `${id}-error` : undefined}
      >
        {inmuebles.map((i) => (
          <option key={i.id} value={i.id}>
            {i.direccionInmueble}
          </option>
        ))}
      </select>
      <noscript>
        <button type="submit" className="btn" data-variant="secondary" data-size="sm">
          Ver
        </button>
      </noscript>
      {enviando && <span className={styles.nota}>Cambiando…</span>}
      {estado?.error && (
        <p id={`${id}-error`} className={styles.error} role="alert">
          {estado.error}
        </p>
      )}
    </form>
  )
}
