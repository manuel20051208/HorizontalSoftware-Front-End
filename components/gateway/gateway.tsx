import { ChevronRight, ClipboardList, KeyRound, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { Logo } from '@/components/brand/logo'
import styles from './gateway.module.css'

const MODULOS = [
  {
    id: 'admin',
    href: '/admin',
    nombre: 'Administrador',
    descripcion: 'Cobra la administración, publica comunicados y autoriza usuarios.',
    icono: ClipboardList,
  },
  {
    id: 'residente',
    href: '/residente',
    nombre: 'Residente',
    descripcion: 'Paga la administración, reserva zonas comunes e invita visitantes.',
    icono: KeyRound,
  },
  {
    id: 'vigilante',
    href: '/vigilante',
    nombre: 'Vigilante',
    descripcion: 'Registra entradas y salidas y revisa las reservas del día.',
    icono: ShieldCheck,
  },
] as const

/**
 * Inicio de sesión: el acceso a la izquierda y, en pantallas anchas, la ilustración
 * a la derecha. Es un Server Component, sin JavaScript propio. Cada persona usa un
 * solo módulo, así que los enlaces no precargan las otras rutas.
 */
export function Gateway() {
  return (
    <main className={styles.pagina}>
      <header className={styles.cabecera}>
        <Logo />
      </header>

      <div className={styles.lado}>
        <div className={styles.copia}>
          <h1 className={`t-display ${styles.titulo}`}>Torres del Parque</h1>
          <p className={styles.lead}>Pagos, reservas y accesos del conjunto. Elige tu módulo para ingresar.</p>

          <ul className={styles.roles} aria-label="Módulos">
            {MODULOS.map(({ id, href, nombre, descripcion, icono: Icono }) => (
              <li key={id}>
                <Link href={href} prefetch={false} className={styles.rol}>
                  <Icono className={styles.rolIcono} aria-hidden="true" strokeWidth={1.75} />
                  <span>
                    <span className={styles.rolNombre}>{nombre}</span>
                    <span className={styles.rolDescripcion}>{descripcion}</span>
                  </span>
                  <ChevronRight className={styles.chevron} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>

          <p className={styles.ayuda}>¿Aún no tienes usuario? La administración te autoriza desde su panel.</p>
        </div>
      </div>

      {/* Decorativa: es un fondo de CSS, así que en el teléfono ni siquiera se descarga */}
      <div className={styles.arte} aria-hidden="true" />
    </main>
  )
}
