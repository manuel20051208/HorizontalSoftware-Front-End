import { ArrowLeft, CircleAlert, Inbox } from 'lucide-react'
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
