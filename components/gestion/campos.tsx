import styles from './gestion.module.css'

type Base = {
  nombre: string
  etiqueta: string
  ayuda?: React.ReactNode
  opcional?: boolean
  ancho?: boolean
  requerido?: boolean
}

/** Campo de texto/número/fecha/hora. El id y el htmlFor se derivan del nombre. */
export function Campo({
  nombre,
  etiqueta,
  tipo = 'text',
  valor,
  ...resto
}: Base & {
  tipo?: 'text' | 'number' | 'date' | 'time' | 'email' | 'tel' | 'password' | 'search'
  valor?: string | number
  min?: string | number
  max?: string | number
  step?: string | number
  placeholder?: string
  inputMode?: 'numeric' | 'decimal' | 'email' | 'tel' | 'text'
  autoComplete?: string
  disabled?: boolean
  maxLength?: number
  minLength?: number
  spellCheck?: boolean
}) {
  const id = `campo-${nombre}`
  return (
    <div className={`${styles.grupo} ${resto.ancho ? styles.ancho : ''}`}>
      <label htmlFor={id} className={styles.etiqueta}>
        {etiqueta}
        {resto.opcional && <span className={styles.opcional}> (opcional)</span>}
      </label>
      <input
        id={id}
        name={nombre}
        type={tipo}
        className={styles.entrada}
        defaultValue={valor}
        required={resto.requerido}
        min={resto.min}
        max={resto.max}
        step={resto.step}
        placeholder={resto.placeholder}
        inputMode={resto.inputMode}
        autoComplete={resto.autoComplete}
        disabled={resto.disabled}
        maxLength={resto.maxLength}
        minLength={resto.minLength}
        spellCheck={resto.spellCheck}
      />
      {resto.ayuda && <p className={styles.ayudaCampo}>{resto.ayuda}</p>}
    </div>
  )
}

export function CampoArea({
  nombre,
  etiqueta,
  valor,
  filas = 4,
  ...resto
}: Base & { valor?: string; filas?: number; placeholder?: string; maxLength?: number }) {
  const id = `campo-${nombre}`
  return (
    <div className={`${styles.grupo} ${resto.ancho ? styles.ancho : ''}`}>
      <label htmlFor={id} className={styles.etiqueta}>
        {etiqueta}
        {resto.opcional && <span className={styles.opcional}> (opcional)</span>}
      </label>
      <textarea
        id={id}
        name={nombre}
        rows={filas}
        className={styles.entrada}
        defaultValue={valor}
        placeholder={resto.placeholder}
        maxLength={resto.maxLength}
        required={resto.requerido}
      />
      {resto.ayuda && <p className={styles.ayudaCampo}>{resto.ayuda}</p>}
    </div>
  )
}

export function CampoSelect({
  nombre,
  etiqueta,
  opciones,
  valor,
  ...resto
}: Base & {
  opciones: { valor: string | number; texto: string }[]
  valor?: string | number
  disabled?: boolean
  multiple?: boolean
  tamano?: number
}) {
  const id = `campo-${nombre}`
  return (
    <div className={`${styles.grupo} ${resto.ancho ? styles.ancho : ''}`}>
      <label htmlFor={id} className={styles.etiqueta}>
        {etiqueta}
        {resto.opcional && <span className={styles.opcional}> (opcional)</span>}
      </label>
      <select
        id={id}
        name={nombre}
        className={styles.entrada}
        defaultValue={valor}
        required={resto.requerido}
        disabled={resto.disabled}
        multiple={resto.multiple}
        size={resto.tamano}
      >
        {!resto.multiple && <option value="">Elige…</option>}
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.texto}
          </option>
        ))}
      </select>
      {resto.ayuda && <p className={styles.ayudaCampo}>{resto.ayuda}</p>}
    </div>
  )
}

export function CampoCheck({
  nombre,
  etiqueta,
  ayuda,
  marcado = false,
}: {
  nombre: string
  etiqueta: string
  ayuda?: React.ReactNode
  marcado?: boolean
}) {
  const id = `campo-${nombre}`
  return (
    <div className={`${styles.grupo} ${styles.ancho}`}>
      <label htmlFor={id} className={styles.etiqueta} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <input id={id} name={nombre} type="checkbox" defaultChecked={marcado} />
        {etiqueta}
      </label>
      {ayuda && <p className={styles.ayudaCampo}>{ayuda}</p>}
    </div>
  )
}
