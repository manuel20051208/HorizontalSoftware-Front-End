import Link from 'next/link'
import { Logo } from '@/components/brand/logo'
import styles from './documento-legal.module.css'

/**
 * Correo al que se dirigen las consultas de privacidad y de los términos.
 * Debe ser el mismo «correo de asistencia» de la pantalla de consentimiento OAuth de Google.
 * NEXT_PUBLIC_CORREO_CONTACTO permite cambiarlo sin tocar el código.
 */
export const CORREO_CONTACTO = process.env.NEXT_PUBLIC_CORREO_CONTACTO || 'manuelramos09544@gmail.com'

/** Fecha de la última revisión de la política y de los términos. */
export const FECHA_ACTUALIZACION = '19 de noviembre de 2026'

/**
 * Marco de las páginas públicas de texto legal (privacidad y términos):
 * papel sobre el concreto, sin sesión ni JavaScript propio.
 */
export function DocumentoLegal({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <main className={styles.pagina}>
      <header className={styles.cabecera}>
        <Link href="/ingresar" aria-label="habita., ir al ingreso">
          <Logo />
        </Link>
      </header>

      <article className={styles.hoja}>
        <h1 className={styles.titulo}>{titulo}</h1>
        <p className={styles.fecha}>Última actualización: {FECHA_ACTUALIZACION}</p>
        <div className={styles.cuerpo}>{children}</div>
      </article>

      <EnlacesLegales />
    </main>
  )
}

/** Enlaces a la política y a los términos; se repiten en el pie del ingreso. */
export function EnlacesLegales() {
  return (
    <nav className={styles.enlaces} aria-label="Documentos legales">
      <Link href="/privacidad">Política de privacidad</Link>
      <span aria-hidden="true">·</span>
      <Link href="/terminos">Condiciones del servicio</Link>
    </nav>
  )
}
