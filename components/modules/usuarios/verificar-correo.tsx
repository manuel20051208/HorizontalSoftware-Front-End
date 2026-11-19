'use client'

import { Check, CircleAlert, MailCheck, RefreshCw } from 'lucide-react'
import { useActionState, useId } from 'react'
import { reenviarCodigo, verificarCorreo } from '@/lib/usuarios/acciones'
import { Popover, useCerrarAlTerminar } from './popover'
import styles from './usuarios.module.css'

/**
 * La administración escribe el código de 4 cifras que llegó al correo del usuario. Con el código correcto el
 * correo queda verificado y la cuenta activa; es la única forma de activar una cuenta nueva.
 * `compacto` = dentro de una fila de la lista: «Verificar correo» abre un panel flotante anclado al botón.
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
  if (compacto) {
    return (
      <Popover
        boton={
          <>
            <MailCheck aria-hidden="true" />
            Verificar correo
          </>
        }
        ariaLabel={`Verificar el correo de ${nombre}`}
        titulo={`Verificar el correo de ${nombre}`}
        alinear="fin"
      >
        <VerificarCompacto identificacion={identificacion} correo={correo} />
      </Popover>
    )
  }
  return <VerificarTarjeta identificacion={identificacion} correo={correo} />
}

/** Tarjeta de «Cuenta creada»: el formulario completo con la explicación. */
function VerificarTarjeta({ identificacion, correo }: { identificacion: number; correo: string }) {
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
    <form action={verificar} className={styles.activarCodigo}>
      <p className={styles.activacion}>
        Se envió un código de 4 cifras a <strong>{correo}</strong>. Pídeselo y escríbelo aquí: solo así se activa
        la cuenta. Vence en 15 minutos y admite 5 intentos.
      </p>

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

  return formulario
}

/**
 * Dentro del popover de la fila: código y «Verificar» en una fila, «Reenviar código» como acción discreta
 * debajo y los mensajes dentro del panel. Al verificar con éxito el popover se cierra (la fila pasa a activa).
 */
function VerificarCompacto({ identificacion, correo }: { identificacion: number; correo: string }) {
  const [verificacion, verificar, verificando] = useActionState(verificarCorreo.bind(null, identificacion), undefined)
  const [reenvio, reenviar, reenviando] = useActionState(reenviarCodigo.bind(null, identificacion), undefined)
  const id = useId()
  useCerrarAlTerminar(verificacion, 'verificada')

  return (
    <form action={verificar} className={styles.popoverForm}>
      <p className={styles.popoverAyuda}>
        Escribe el código de 4 cifras que llegó a <strong>{correo}</strong>.
      </p>
      <label htmlFor={`${id}-codigo`} className="sr-only">
        Código del correo
      </label>
      <div className={styles.popoverFila}>
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
          className={`${styles.entrada} ${styles.codigo} ${styles.popoverCodigo}`}
          aria-invalid={verificacion?.estado === 'error' ? true : undefined}
          aria-describedby={verificacion?.estado === 'error' ? `${id}-error` : undefined}
        />
        <button type="submit" className="btn" data-variant="primary" data-size="sm" disabled={verificando}>
          {verificando ? 'Verificando…' : 'Verificar y activar'}
        </button>
      </div>

      {verificacion?.estado === 'error' && (
        <p id={`${id}-error`} className={styles.errorCampo} role="alert">
          <CircleAlert aria-hidden="true" />
          {verificacion.mensaje}
        </p>
      )}
      {reenvio && (
        <p className={reenvio.estado === 'error' ? styles.errorCampo : styles.okRelacion} role="status">
          {reenvio.estado === 'error' ? <CircleAlert aria-hidden="true" /> : <Check aria-hidden="true" />}
          {reenvio.mensaje}
        </p>
      )}

      <div className={styles.popoverPie}>
        <span className={styles.popoverNota}>Vence en 15 min · 5 intentos</span>
        {/* Reenviar no necesita el código */}
        <button
          type="submit"
          formAction={reenviar}
          formNoValidate
          className="btn"
          data-variant="quiet"
          data-size="sm"
          disabled={reenviando}
          aria-label={`Reenviar el código a ${correo}`}
        >
          <RefreshCw aria-hidden="true" />
          {reenviando ? 'Enviando…' : 'Reenviar código'}
        </button>
      </div>
    </form>
  )
}
