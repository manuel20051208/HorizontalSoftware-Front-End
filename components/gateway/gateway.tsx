import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Logo } from '@/components/brand/logo'
import type { Modulo } from '@/lib/auth/config'
import styles from './gateway.module.css'
import { MODULOS_UI } from './modulos'

/**
 * Marco de las pantallas de acceso (portada y formularios de ingreso): la tarjeta de
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

/**
 * Portada: se elige el módulo y cada uno pide su correo y contraseña. Cada persona usa
 * un solo módulo, así que los enlaces no precargan las otras rutas.
 */
export function Gateway() {
  return (
    <PantallaAcceso>
      <h1 className={`t-display ${styles.titulo}`}>Torres del Parque</h1>
      <p className={styles.lead}>Pagos, reservas y accesos del conjunto. Elige tu módulo para ingresar.</p>

      <ul className={styles.roles} aria-label="Módulos">
        {(Object.keys(MODULOS_UI) as Modulo[]).map((id) => {
          const { nombre, descripcion, icono: Icono } = MODULOS_UI[id]
          return (
            <li key={id}>
              <Link href={`/ingresar/${id}`} prefetch={false} className={styles.rol}>
                <Icono className={styles.rolIcono} aria-hidden="true" strokeWidth={1.75} />
                <span>
                  <span className={styles.rolNombre}>{nombre}</span>
                  <span className={styles.rolDescripcion}>{descripcion}</span>
                </span>
                <ChevronRight className={styles.chevron} aria-hidden="true" />
              </Link>
            </li>
          )
        })}
      </ul>

      <p className={styles.ayuda}>¿Aún no tienes usuario? La administración te autoriza desde su panel.</p>
    </PantallaAcceso>
  )
}
