import styles from './cargando.module.css'

/** Qué lleva dentro cada panel de la pantalla real. */
export type BloqueCarga = 'tabla' | 'lista' | 'formulario' | 'datos'

const T = ({ className = '' }: { className?: string }) => <span className={`${styles.t} ${className}`} />

function Bloque({ tipo }: { tipo: BloqueCarga }) {
  if (tipo === 'tabla') {
    return (
      <div className={styles.filas}>
        {[0, 1, 2, 3, 4].map((f) => (
          <div key={f} className={styles.fila}>
            <T />
            <T />
            <T />
            <T />
          </div>
        ))}
      </div>
    )
  }
  if (tipo === 'lista') {
    return (
      <div className={styles.items}>
        {[0, 1, 2].map((i) => (
          <div key={i} className={styles.item}>
            <T />
            <T />
          </div>
        ))}
      </div>
    )
  }
  if (tipo === 'formulario') {
    return (
      <>
        <div className={styles.campos}>
          {[0, 1, 2, 3].map((c) => (
            <div key={c} className={styles.campo}>
              <T className={styles.etiqueta} />
              <T className={styles.entrada} />
            </div>
          ))}
        </div>
        <T className={styles.boton} />
      </>
    )
  }
  return (
    <div className={styles.datos}>
      {[0, 1, 2, 3].map((d) => (
        <div key={d} className={styles.dato}>
          <T />
          <T />
        </div>
      ))}
    </div>
  )
}

function PanelCarga({ tipo }: { tipo: BloqueCarga }) {
  return (
    <div className={`hoja ${styles.panel}`}>
      <div className={styles.panelCabecera}>
        <T className={styles.h2} />
        <T className={styles.nota} />
      </div>
      <Bloque tipo={tipo} />
    </div>
  )
}

function Cabecera({ volver, accion }: { volver?: boolean; accion?: boolean }) {
  return (
    <>
      {volver && <T className={styles.volver} />}
      <div className={styles.cabecera}>
        <div className={styles.titulo}>
          <T className={styles.h1} />
          <T className={styles.sub} />
        </div>
        {accion && <T className={styles.boton} />}
      </div>
    </>
  )
}

/**
 * Esqueleto de las pantallas de gestión (kit Encabezado + Panel): se describe con
 * los mismos bloques, y en el mismo orden, que la página real.
 */
export function Cargando({
  volver = true,
  accion,
  filtros,
  bloques = ['tabla'],
}: {
  /** El enlace «← Panel» que Encabezado pone por defecto. */
  volver?: boolean
  accion?: boolean
  /** Fila de filtros tipo píldora sobre el primer panel. */
  filtros?: boolean
  bloques?: BloqueCarga[]
}) {
  return (
    <div className={styles.pagina} role="status" aria-label="Cargando">
      <Cabecera volver={volver} accion={accion} />
      {filtros && (
        <div className={styles.chips}>
          {[0, 1, 2, 3, 4].map((f) => (
            <T key={f} className={styles.filtro} />
          ))}
        </div>
      )}
      {bloques.map((tipo, i) => (
        <PanelCarga key={i} tipo={tipo} />
      ))}
    </div>
  )
}

/** Inicio del administrador: accesos, plano + resumen y los dos paneles de abajo. */
export function CargandoPanelAdmin() {
  return (
    <div className={styles.pagina} role="status" aria-label="Cargando">
      <Cabecera />
      <div className={styles.adminPrincipal}>
        <div className={`hoja ${styles.panel}`}>
          <div className={styles.panelCabecera}>
            <T className={styles.h2} />
            <T className={styles.nota} />
          </div>
          <T className={styles.plano} />
        </div>
        <div className={`hoja ${styles.panel}`}>
          <T className={styles.nota} />
          <T className={styles.cifraGrande} />
          <Bloque tipo="lista" />
        </div>
      </div>
      <div className={styles.adminInferior}>
        <PanelCarga tipo="lista" />
        <PanelCarga tipo="tabla" />
      </div>
    </div>
  )
}

/** Dos columnas arriba y dos abajo: inicio del residente y su pantalla de pagos. */
export function CargandoDosColumnas({ volver }: { volver?: boolean }) {
  return (
    <div className={styles.pagina} role="status" aria-label="Cargando">
      <Cabecera volver={volver} />
      <div className={styles.dosColumnas}>
        <div className={`hoja ${styles.panel}`}>
          <T className={styles.nota} />
          <T className={styles.cifraGrande} />
          <Bloque tipo="datos" />
        </div>
        <PanelCarga tipo="lista" />
      </div>
      <div className={styles.dosColumnas}>
        <PanelCarga tipo="lista" />
        <PanelCarga tipo="lista" />
      </div>
    </div>
  )
}
