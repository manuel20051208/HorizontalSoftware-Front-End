'use client'

import { ArrowLeft, CircleAlert, CircleCheck, KeyRound, LockKeyhole, Mail } from 'lucide-react'
import Link from 'next/link'
import { useActionState } from 'react'
import type { EstadoAccion } from '@/lib/api/acciones'
import styles from './login-form.module.css'

type Accion = (previo: EstadoAccion, datos: FormData) => Promise<EstadoAccion>

/**
 * Activar una cuenta nueva: correo, contraseña inicial y el código de 4 cifras del correo.
 * «Reenviar código» usa el mismo formulario (solo necesita el correo) con su propia acción.
 */
export function ActivarForm({ activar, reenviar }: { activar: Accion; reenviar: Accion }) {
  const [estado, enviar, enviando] = useActionState(activar, undefined)
  const [reenvio, pedirCodigo, pidiendo] = useActionState(reenviar, undefined)
  const activada = estado?.estado === 'ok'
  const errores = estado?.estado === 'error' ? estado.errores : undefined

  return (
    <>
      <div className={styles.encabezado}>
        <div>
          <p className={styles.antetitulo}>Torres del Parque</p>
          <h1 className={`t-display ${styles.titulo}`}>Activar cuenta</h1>
        </div>
      </div>

      {activada ? (
        <div className={styles.formulario}>
          <p className={styles.exito} role="status">
            <CircleCheck aria-hidden="true" />
            <span>{estado.mensaje}</span>
          </p>
          <Link href="/ingresar" className={`btn ${styles.enviar}`} data-variant="primary" data-size="lg">
            Ingresar
          </Link>
        </div>
      ) : (
        <form action={enviar} className={styles.formulario}>
          <p className={styles.lead}>
            Usa el correo y la contraseña que te dio la administración, y el código de 4 cifras que te llegó al correo.
          </p>

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
                aria-invalid={errores?.correo ? true : undefined}
              />
            </div>
          </div>

          <div className={styles.grupo}>
            <label htmlFor="contrasena" className={styles.etiqueta}>
              Contraseña inicial
            </label>
            <div className={`campo ${styles.campo}`}>
              <LockKeyhole aria-hidden="true" />
              <input
                id="contrasena"
                name="contrasena"
                type="password"
                autoComplete="current-password"
                required
                aria-invalid={errores?.contrasena ? true : undefined}
              />
            </div>
          </div>

          <div className={styles.grupo}>
            <div className={styles.filaEtiqueta}>
              <label htmlFor="codigo" className={styles.etiqueta}>
                Código de verificación
              </label>
              {/* Solo necesita el correo: no valida el resto del formulario */}
              <button
                type="submit"
                formAction={pedirCodigo}
                formNoValidate
                className={styles.enlaceBoton}
                disabled={pidiendo}
              >
                {pidiendo ? 'Enviando…' : 'Reenviar código'}
              </button>
            </div>
            <div className={`campo ${styles.campo}`}>
              <KeyRound aria-hidden="true" />
              <input
                id="codigo"
                name="codigo"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{4}"
                maxLength={4}
                minLength={4}
                required
                placeholder="0000"
                className={styles.codigo}
                aria-describedby="ayuda-codigo"
                aria-invalid={errores?.codigo ? true : undefined}
              />
            </div>
            <p id="ayuda-codigo" className={styles.ayudaCampo}>
              4 cifras. Vence a los 7 días y admite 5 intentos; después pide uno nuevo.
            </p>
          </div>

          {reenvio && (
            <p className={reenvio.estado === 'ok' ? styles.exito : styles.error} role="status">
              {reenvio.estado === 'ok' ? <CircleCheck aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}
              <span>{reenvio.mensaje}</span>
            </p>
          )}

          {estado?.estado === 'error' && (
            <p className={styles.error} role="alert">
              <CircleAlert aria-hidden="true" />
              <span>{estado.mensaje}</span>
            </p>
          )}

          <button type="submit" className={`btn ${styles.enviar}`} data-variant="primary" data-size="lg" disabled={enviando}>
            {enviando ? 'Activando…' : 'Activar cuenta'}
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
