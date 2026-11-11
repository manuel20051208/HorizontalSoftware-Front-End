import { ArrowLeft, ChevronLeft, ChevronRight, CircleAlert, Inbox } from 'lucide-react'
import Link from 'next/link'
import type { Resultado } from '@/lib/auth/api'
import styles from './gestion.module.css'

export function Encabezado({
  titulo,
  descripcion,
  volverHref = '/admin',
  volverTexto = 'Panel',
  acciones,
}: {
  titulo: string
  descripcion?: React.ReactNode
  volverHref?: string
  volverTexto?: string
  acciones?: React.ReactNode
}) {
  return (
    <>
      <Link href={volverHref} prefetch={false} className={`btn ${styles.volver}`} data-variant="quiet" data-size="sm">
        <ArrowLeft aria-hidden="true" />
        {volverTexto}
      </Link>
      <header className={styles.cabecera}>
        <div className={styles.titulo}>
          <h1 className="t-title">{titulo}</h1>
          {descripcion && <p className={styles.sub}>{descripcion}</p>}
        </div>
        {acciones && <div className={styles.accionesCabecera}>{acciones}</div>}
      </header>
    </>
  )
}

export function Panel({
  titulo,
  nota,
  acciones,
  children,
  id,
}: {
  titulo: string
  nota?: React.ReactNode
  acciones?: React.ReactNode
  children: React.ReactNode
  id?: string
}) {
  return (
    <section className={`hoja ${styles.panel}`} aria-labelledby={id}>
      <header className={styles.panelCabecera}>
        <div>
          <h2 id={id} className="t-section">
            {titulo}
          </h2>
          {nota && <p className="t-nota">{nota}</p>}
        </div>
        {acciones}
      </header>
      {children}
    </section>
  )
}

export function EstadoResultado({
  resultado,
  porDefecto = 'No se pudo cargar la información. Intenta de nuevo en un momento.',
}: {
  resultado: Extract<Resultado<unknown>, { ok: false }>
  porDefecto?: string
}) {
  const mensaje =
    resultado.status === 0
      ? 'No pudimos conectar con el servidor. Intenta de nuevo en un momento.'
      : resultado.status === 403
        ? resultado.mensaje || 'Tu cuenta no tiene permiso para ver esta información.'
        : resultado.status === 404
          ? resultado.mensaje || 'No encontramos lo que buscabas.'
          : resultado.mensaje || porDefecto
  return (
    <p className={styles.problema} role="alert">
      <CircleAlert aria-hidden="true" />
      <span>{mensaje}</span>
    </p>
  )
}

export function Vacio({ children }: { children: React.ReactNode }) {
  return (
    <p className={styles.vacio}>
      <Inbox aria-hidden="true" className={styles.vacioIcono} />
      {children}
    </p>
  )
}

/**
 * Navegación entre páginas de una lista larga. Son enlaces (?pagina=N), así que funciona
 * sin JavaScript y cada página se puede compartir o recargar.
 */
export function Paginacion({
  pagina,
  totalPaginas,
  href,
  etiqueta = 'Páginas',
}: {
  pagina: number
  totalPaginas: number
  /** Arma la URL de una página, conservando los demás filtros. */
  href: (pagina: number) => string
  etiqueta?: string
}) {
  if (totalPaginas <= 1) return null

  // Primera, última y las vecinas de la actual; el resto se resume con «…».
  const numeros = [...new Set([1, pagina - 1, pagina, pagina + 1, totalPaginas])]
    .filter((n) => n >= 1 && n <= totalPaginas)
    .sort((a, b) => a - b)

  return (
    <nav className={styles.paginacion} aria-label={etiqueta}>
      {pagina > 1 ? (
        <Link href={href(pagina - 1)} prefetch={false} className={styles.paginaPaso} rel="prev">
          <ChevronLeft aria-hidden="true" />
          <span className={styles.paginaPasoTexto}>Anterior</span>
        </Link>
      ) : (
        <span className={styles.paginaPaso} aria-disabled="true">
          <ChevronLeft aria-hidden="true" />
          <span className={styles.paginaPasoTexto}>Anterior</span>
        </span>
      )}

      <ol className={styles.paginaNumeros}>
        {numeros.map((n, i) => (
          <li key={n} className={styles.paginaItem}>
            {i > 0 && n - numeros[i - 1] > 1 && (
              <span className={styles.paginaHueco} aria-hidden="true">
                …
              </span>
            )}
            <Link
              href={href(n)}
              prefetch={false}
              className={styles.paginaNumero}
              aria-current={n === pagina ? 'page' : undefined}
              aria-label={`Página ${n}`}
            >
              {n}
            </Link>
          </li>
        ))}
      </ol>

      {pagina < totalPaginas ? (
        <Link href={href(pagina + 1)} prefetch={false} className={styles.paginaPaso} rel="next">
          <span className={styles.paginaPasoTexto}>Siguiente</span>
          <ChevronRight aria-hidden="true" />
        </Link>
      ) : (
        <span className={styles.paginaPaso} aria-disabled="true">
          <span className={styles.paginaPasoTexto}>Siguiente</span>
          <ChevronRight aria-hidden="true" />
        </span>
      )}
    </nav>
  )
}
