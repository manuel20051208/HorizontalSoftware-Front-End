'use client'

import { CircleAlert, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { useActionState, useState } from 'react'
import type { EstadoIngreso } from '@/lib/auth/acciones'
import styles from './login-form.module.css'

/** Un solo ingreso para todos los roles: el backend dice quién es y se va a su módulo.
 *  No hay registro: las cuentas las crea la administración. */
export function LoginForm({
  accion,
}: {
  accion: (previo: EstadoIngreso, datos: FormData) => Promise<EstadoIngreso>
}) {
  const [estado, enviar, enviando] = useActionState(accion, undefined)
  const [verContrasena, setVerContrasena] = useState(false)

  return (
    <>
      <div className={styles.encabezado}>
        <div>
          <p className={styles.antetitulo}>Torres del Parque</p>
          <h1 className={`t-display ${styles.titulo}`}>Ingresar</h1>
        </div>
      </div>

      <form action={enviar} className={styles.formulario}>
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
              defaultValue={estado?.correo}
              aria-invalid={estado ? true : undefined}
              aria-describedby={estado ? 'error-ingreso' : undefined}
            />
          </div>
        </div>

        <div className={styles.grupo}>
          <label htmlFor="contrasena" className={styles.etiqueta}>
            Contraseña
          </label>
          <div className={`campo ${styles.campo}`}>
            <LockKeyhole aria-hidden="true" />
            <input
              id="contrasena"
              name="contrasena"
              type={verContrasena ? 'text' : 'password'}
              autoComplete="current-password"
              required
              aria-invalid={estado ? true : undefined}
              aria-describedby={estado ? 'error-ingreso' : undefined}
            />
            <button
              type="button"
              className={styles.ojo}
              onClick={() => setVerContrasena((v) => !v)}
              aria-label={verContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              aria-pressed={verContrasena}
            >
              {verContrasena ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            </button>
          </div>
        </div>

        {estado && (
          <p id="error-ingreso" className={styles.error} role="alert">
            <CircleAlert aria-hidden="true" />
            <span>{estado.error}</span>
          </p>
        )}

        <button type="submit" className={`btn ${styles.enviar}`} data-variant="primary" data-size="lg" disabled={enviando}>
          {enviando ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>

      <p className={styles.ayuda}>¿No tienes cuenta? La administración la crea por ti.</p>
    </>
  )
}
