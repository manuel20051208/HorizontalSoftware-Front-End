'use client'

import { ArrowLeft, CircleAlert, CircleCheck, Mail } from 'lucide-react'
import Link from 'next/link'
import { useActionState } from 'react'
import type { EstadoAccion } from '@/lib/api/acciones'
import styles from './login-form.module.css'

/** Pide una contraseña temporal por correo. El back responde igual exista o no el correo. */
export function RecuperarForm({
  accion,
}: {
  accion: (previo: EstadoAccion, datos: FormData) => Promise<EstadoAccion>
}) {
  const [estado, enviar, enviando] = useActionState(accion, undefined)
  const enviado = estado?.estado === 'ok'

  return (
    <>
      <div className={styles.encabezado}>
        <div>
          <p className={styles.antetitulo}>Torres del Parque</p>
          <h1 className={`t-display ${styles.titulo}`}>Recuperar contraseña</h1>
        </div>
      </div>

      {enviado ? (
        <div className={styles.formulario}>
          <p className={styles.exito} role="status">
            <CircleCheck aria-hidden="true" />
            <span>
              {estado.mensaje} Entra con ella y luego cámbiala en <strong>Mi cuenta</strong>.
            </span>
          </p>
          <Link href="/ingresar" className={`btn ${styles.enviar}`} data-variant="primary" data-size="lg">
            Volver a ingresar
          </Link>
        </div>
      ) : (
        <form action={enviar} className={styles.formulario}>
          <p className={styles.lead}>Escribe el correo de tu cuenta y te enviaremos una contraseña temporal.</p>
          <div className={styles.grupo}>
            <label htmlFor="correo" className={styles.etiqueta}>
              Correo
            </label>
            <div className={`campo ${styles.campo}`}>
              <Mail aria-hidden="true" />
              <input
                id="correo"
                name="correo"
                type="email"
                autoComplete="username"
                inputMode="email"
                required
                aria-invalid={estado?.estado === 'error' ? true : undefined}
                aria-describedby={estado?.estado === 'error' ? 'error-recuperar' : undefined}
              />
            </div>
          </div>

          {estado?.estado === 'error' && (
            <p id="error-recuperar" className={styles.error} role="alert">
              <CircleAlert aria-hidden="true" />
              <span>{estado.mensaje}</span>
            </p>
          )}

          <button type="submit" className={`btn ${styles.enviar}`} data-variant="primary" data-size="lg" disabled={enviando}>
            {enviando ? 'Enviando…' : 'Enviar contraseña temporal'}
          </button>
        </form>
      )}

      <p className={styles.ayuda}>
        <Link href="/ingresar" className={styles.enlace}>
          <ArrowLeft aria-hidden="true" />
          Volver al ingreso
        </Link>
      </p>
    </>
  )
}
