'use client'

import { Check, CircleAlert, MailCheck, RefreshCw } from 'lucide-react'
import { useActionState, useId } from 'react'
import { reenviarCodigo, verificarCorreo } from '@/lib/usuarios/acciones'
import styles from './usuarios.module.css'

/**
 * La administración escribe el código de 4 cifras que llegó al correo del usuario. Con el código correcto el
 * correo queda verificado y la cuenta activa; es la única forma de activar una cuenta nueva.
 * `compacto` = dentro de una fila de la lista: el formulario se despliega al pulsar «Verificar correo».
 */
export function VerificarCorreo({
  identificacion,
  correo,
  nombre,
  compacto = false,
}: {
  identificacion: number
  correo: string
  nombre: string
  compacto?: boolean
}) {
  const [verificacion, verificar, verificando] = useActionState(verificarCorreo.bind(null, identificacion), undefined)
  const [reenvio, reenviar, reenviando] = useActionState(reenviarCodigo.bind(null, identificacion), undefined)
  const id = useId()

  if (verificacion?.estado === 'verificada') {
    return (
      <p className={styles.activada} role="status">
        <Check aria-hidden="true" />
        {verificacion.mensaje}
      </p>
    )
  }

  const formulario = (
    <form action={verificar} className={compacto ? styles.verificarCompacto : styles.activarCodigo}>
      {!compacto && (
        <p className={styles.activacion}>
          Se envió un código de 4 cifras a <strong>{correo}</strong>. Pídeselo y escríbelo aquí: solo así se activa
          la cuenta. Vence en 15 minutos y admite 5 intentos.
        </p>
      )}

      <div className={styles.activarFila}>
        <div className={styles.grupo}>
          <label htmlFor={`${id}-codigo`} className={styles.etiqueta}>
            Código del correo
          </label>
          <input
            id={`${id}-codigo`}
            name="codigo"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{4}"
            minLength={4}
            maxLength={4}
            required
            placeholder="0000"
            className={`${styles.entrada} ${styles.codigo}`}
            aria-invalid={verificacion?.estado === 'error' ? true : undefined}
            aria-describedby={verificacion?.estado === 'error' ? `${id}-error` : undefined}
          />
        </div>
        <button type="submit" className="btn" data-variant="primary" disabled={verificando}>
          <MailCheck aria-hidden="true" />
          {verificando ? 'Verificando…' : 'Verificar y activar'}
        </button>
        {/* Reenviar no necesita el código */}
        <button
          type="submit"
          formAction={reenviar}
          formNoValidate
          className="btn"
          data-variant="secondary"
          disabled={reenviando}
          aria-label={`Reenviar el código a ${correo}`}
        >
          <RefreshCw aria-hidden="true" />
          {reenviando ? 'Enviando…' : 'Reenviar código'}
        </button>
      </div>

      {verificacion?.estado === 'error' && (
        <p id={`${id}-error`} className={styles.errorCampo} role="alert">
          <CircleAlert aria-hidden="true" />
          {verificacion.mensaje}
        </p>
      )}
      {reenvio && (
        <p className={reenvio.estado === 'error' ? styles.errorCampo : styles.ayudaCampo} role="status">
          {reenvio.mensaje}
        </p>
      )}
    </form>
  )

  if (!compacto) return formulario

  return (
    <details className={styles.verificarDesplegable}>
      <summary className="btn" data-variant="secondary" data-size="sm" aria-label={`Verificar el correo de ${nombre}`}>
        <MailCheck aria-hidden="true" />
        Verificar correo
      </summary>
      {formulario}
    </details>
  )
}
