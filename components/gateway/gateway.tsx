import { Logo } from '@/components/brand/logo'
import styles from './gateway.module.css'

/**
 * Marco de las pantallas de acceso (el ingreso): la tarjeta de
 * vidrio sobre la ilustración. Es un Server Component, sin JavaScript propio.
 */
export function PantallaAcceso({ children }: { children: React.ReactNode }) {
  return (
    <main className={styles.pagina}>
      <header className={styles.cabecera}>
        <Logo />
      </header>

      <div className={styles.lado}>
        <div className={styles.copia}>{children}</div>
      </div>

      {/* Decorativa: es un fondo de CSS, así que en el teléfono ni siquiera se descarga */}
      <div className={styles.arte} aria-hidden="true" />
    </main>
  )
}
