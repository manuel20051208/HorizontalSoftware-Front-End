import { Bell, LogOut } from 'lucide-react'
import Link from 'next/link'
import { Logo } from '@/components/brand/logo'
import { cerrarSesion } from '@/lib/auth/acciones'
import styles from './app-shell.module.css'

function iniciales(nombre: string) {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase()
}

export function AppShell({
  usuario,
  children,
}: {
  usuario: { nombre: string; rol: string }
  children: React.ReactNode
}) {
  return (
    <div className={styles.shell}>
      <a className="salto" href="#contenido">
        Saltar al contenido
      </a>

      <header className={styles.bar}>
        <div className={`contenedor ${styles.barInner}`}>
          <Link href="/" prefetch={false} className={styles.brand} aria-label="habita., volver al inicio">
            <Logo />
          </Link>
          <span className={styles.sep} aria-hidden="true" />
          <span className={styles.conjunto}>Torres del Parque</span>

          <div className={styles.fin}>
            <form action={cerrarSesion}>
              <button type="submit" className={`btn ${styles.salir}`} data-variant="quiet">
                <LogOut aria-hidden="true" />
                <span className={styles.salirTexto}>Cerrar sesión</span>
              </button>
            </form>
            <button type="button" className={styles.campana} aria-label="Notificaciones, hay mensajes nuevos">
              <Bell aria-hidden="true" />
              <i aria-hidden="true" />
            </button>
            <div className={styles.usuario}>
              <span className={styles.avatar} aria-hidden="true">
                {iniciales(usuario.nombre)}
              </span>
              <span className={styles.usuarioTexto}>
                <span className={styles.nombre}>{usuario.nombre}</span>
                <span className={styles.rol}>{usuario.rol}</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      <main id="contenido" className={styles.main}>
        <div className="contenedor">{children}</div>
      </main>
    </div>
  )
}
