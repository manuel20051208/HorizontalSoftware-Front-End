import styles from './logo.module.css'

/** Cuatro ventanas, una encendida: «alguien vive aquí». También es el favicon. */
export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="32" height="32" rx="8" fill="#1b1548" />
      <rect x="6.5" y="6.5" width="8" height="9" rx="1.6" fill="#ffffff" fillOpacity="0.26" />
      <rect x="17.5" y="6.5" width="8" height="9" rx="1.6" fill="#f5b83d" />
      <rect x="6.5" y="17.5" width="8" height="9" rx="1.6" fill="#ffffff" fillOpacity="0.26" />
      <rect x="17.5" y="17.5" width="8" height="9" rx="1.6" fill="#ffffff" fillOpacity="0.26" />
    </svg>
  )
}

export function Logo() {
  return (
    <span className={styles.logo}>
      <LogoMark />
      <span className={styles.word}>habita.</span>
    </span>
  )
}
