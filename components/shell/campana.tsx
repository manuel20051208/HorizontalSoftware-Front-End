'use client'

import { Bell, CheckCheck } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useId, useRef, useState, useTransition } from 'react'
import type { Notificacion } from '@/lib/api/tipos'
import { textoTipoNotificacion } from '@/lib/api/tipos'
import type { Modulo } from '@/lib/auth/config'
import { marcarNotificacionesLeidas } from '@/lib/cuenta/acciones'
import styles from './campana.module.css'

function cuando(valor: string) {
  if (!valor) return ''
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Bogota',
  }).format(new Date(valor))
}

/**
 * Campana de la barra superior: abre un panel con las últimas notificaciones.
 * El punto rojo sale de /api/auth/me (notificacionLeida = false) y se apaga al marcarlas.
 */
export function Campana({
  modulo,
  notificaciones,
  sinLeer,
  verTodasHref,
}: {
  modulo: Modulo
  notificaciones: Notificacion[]
  /** Cuántas sin leer; 0 = sin globo. */
  sinLeer: number
  verTodasHref?: string
}) {
  const [abierta, setAbierta] = useState(false)
  const [marcando, iniciar] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const zona = useRef<HTMLDivElement>(null)
  const boton = useRef<HTMLButtonElement>(null)
  const idPanel = useId()

  // Se cierra con Escape o al tocar fuera del panel
  useEffect(() => {
    if (!abierta) return
    function fuera(e: PointerEvent) {
      if (zona.current && !zona.current.contains(e.target as Node)) setAbierta(false)
    }
    function tecla(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setAbierta(false)
        boton.current?.focus()
      }
    }
    document.addEventListener('pointerdown', fuera)
    document.addEventListener('keydown', tecla)
    return () => {
      document.removeEventListener('pointerdown', fuera)
      document.removeEventListener('keydown', tecla)
    }
  }, [abierta])

  function marcar() {
    setError(null)
    iniciar(async () => {
      const r = await marcarNotificacionesLeidas(modulo)
      if (r?.estado === 'error') setError(r.mensaje)
    })
  }

  return (
    <div ref={zona} className={styles.zona}>
      <button
        ref={boton}
        type="button"
        className={styles.boton}
        aria-label={
          sinLeer ? `Notificaciones, ${sinLeer} sin leer` : 'Notificaciones'
        }
        aria-expanded={abierta}
        aria-controls={idPanel}
        onClick={() => setAbierta((v) => !v)}
      >
        <Bell aria-hidden="true" />
        {sinLeer > 0 && (
          <span className={styles.contador} aria-hidden="true">
            {sinLeer > 9 ? '9+' : sinLeer}
          </span>
        )}
      </button>

      <div id={idPanel} className={styles.panel} hidden={!abierta} role="region" aria-label="Notificaciones">
        <div className={styles.cabecera}>
          <p className={styles.titulo}>Notificaciones</p>
          {sinLeer > 0 && (
            <button type="button" className={styles.marcar} onClick={marcar} disabled={marcando}>
              <CheckCheck aria-hidden="true" />
              {marcando ? 'Marcando…' : 'Marcar como leídas'}
            </button>
          )}
        </div>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        {notificaciones.length === 0 ? (
          <p className={styles.vacio}>No tienes notificaciones.</p>
        ) : (
          <ul className={styles.lista}>
            {notificaciones.map((n) => (
              <li key={n.id} className={styles.item}>
                <p className={styles.mensaje}>{n.mensaje}</p>
                <p className={styles.meta}>
                  <span className={styles.tipo}>{textoTipoNotificacion(n.tipoNotificacion)}</span>
                  <span aria-hidden="true">·</span>
                  <time dateTime={n.fechaEnvio}>{cuando(n.fechaEnvio)}</time>
                </p>
              </li>
            ))}
          </ul>
        )}

        {verTodasHref && (
          <Link href={verTodasHref} prefetch={false} className={styles.todas} onClick={() => setAbierta(false)}>
            Ver todas las notificaciones
          </Link>
        )}
      </div>
    </div>
  )
}
