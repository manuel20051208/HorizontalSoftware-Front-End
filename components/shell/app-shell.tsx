import { LogOut } from 'lucide-react'
import Link from 'next/link'
import { Logo } from '@/components/brand/logo'
import { listaDe, listado, type Listado } from '@/lib/api/paginacion'
import type { Notificacion } from '@/lib/api/tipos'
import { cerrarSesion } from '@/lib/auth/acciones'
import { RUTAS_API, type Modulo } from '@/lib/auth/config'
import { apiConSesion } from '@/lib/auth/sesion'
import type { Usuario } from '@/lib/usuarios/tipos'
import styles from './app-shell.module.css'
import { Campana } from './campana'
import { MenuModulos } from './menu-modulos'

/** Cuántas notificaciones muestra el panel de la campana. */
const EN_CAMPANA = 6

function iniciales(nombre: string) {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase()
}

export async function AppShell({
  modulo,
  usuario,
  menu,
  children,
}: {
  modulo: Modulo
  usuario: { nombre: string; rol: string }
  /** Módulo cuyo menú horizontal va bajo la barra; portería no lleva (es una sola pantalla). */
  menu?: 'admin' | 'residente'
  children: React.ReactNode
}) {
  // La campana: las últimas notificaciones y, de /api/auth/me, si hay alguna sin leer
  const [notificacionesR, meR] = await Promise.all([
    apiConSesion<Listado<Notificacion>>(modulo, listado(RUTAS_API.notificaciones, EN_CAMPANA), { metodo: 'GET' }),
    apiConSesion<Usuario>(modulo, RUTAS_API.me, { metodo: 'GET' }),
  ])
  const notificaciones = listaDe(notificacionesR)
    .sort((a, b) => b.id - a.id)
    .slice(0, EN_CAMPANA)
  const sinLeer = meR.ok ? meR.datos.notificacionLeida === false : false
  // Portería no tiene pantalla de notificaciones: su campana solo muestra el panel
  const verTodasHref = modulo === 'vigilante' ? undefined : `/${modulo}/notificaciones`

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
            <Campana modulo={modulo} notificaciones={notificaciones} sinLeer={sinLeer} verTodasHref={verTodasHref} />
            <Link
              href={`/${modulo}/cuenta`}
              prefetch={false}
              className={styles.usuario}
              aria-label={`Mi cuenta: ${usuario.nombre}, ${usuario.rol}`}
            >
              <span className={styles.avatar} aria-hidden="true">
                {iniciales(usuario.nombre)}
              </span>
              <span className={styles.usuarioTexto}>
                <span className={styles.nombre}>{usuario.nombre}</span>
                <span className={styles.rol}>{usuario.rol}</span>
              </span>
            </Link>
          </div>
        </div>
        {menu && <MenuModulos modulo={menu} />}
      </header>

      <main id="contenido" className={styles.main}>
        <div className="contenedor">{children}</div>
      </main>
    </div>
  )
}
