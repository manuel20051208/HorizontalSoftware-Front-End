'use client'

import { CircleAlert, LockKeyhole } from 'lucide-react'
import { useActionState } from 'react'
import { pesos } from '@/lib/api/acciones'
import { iniciarPago } from '@/lib/residente/acciones'
import styles from './pagos.module.css'

const METODOS = [
  { valor: 'PSE', texto: 'PSE' },
  { valor: 'TARJETA', texto: 'Tarjeta' },
  { valor: 'NEQUI', texto: 'Nequi' },
]

/** Elige el método y paga el saldo por la pasarela. Vive dentro de la tarjeta de saldo. */
export function TalonPago({ saldo }: { saldo: number }) {
  const [estado, enviar, enviando] = useActionState(iniciarPago, undefined)

  return (
    <form action={enviar} className={styles.form}>
      <p className={styles.formLabel}>¿Con qué quieres pagar?</p>
      <fieldset className={styles.metodos}>
        <legend className="sr-only">Método de pago</legend>
        {METODOS.map((m, i) => (
          <label key={m.valor} className={styles.metodo}>
            <input type="radio" name="metodoPago" value={m.valor} defaultChecked={i === 0} required />
            <span className={styles.metodoCara}>{m.texto}</span>
          </label>
        ))}
      </fieldset>

      <button type="submit" className={styles.cta} disabled={enviando}>
        {enviando ? 'Redirigiendo…' : `Pagar ${pesos(saldo)}`}
      </button>

      {estado?.estado === 'error' && (
        <p className={styles.formError} role="alert">
          <CircleAlert aria-hidden="true" />
          <span>{estado.mensaje}</span>
        </p>
      )}

      <p className={styles.seguro}>
        <LockKeyhole aria-hidden="true" />
        Pago seguro con
        <span className={styles.wompiPill}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/wompi.svg" alt="Wompi" width={120} height={60} className={styles.wompi} />
        </span>
      </p>
    </form>
  )
}
