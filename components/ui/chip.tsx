import type { LucideIcon } from 'lucide-react'

export type Tono = 'ok' | 'wait' | 'alert' | 'info' | 'neutral'

/** Estado con ícono y etiqueta: el color acompaña, nunca es el único canal. */
export function Chip({
  tono = 'neutral',
  icono: Icono,
  children,
}: {
  tono?: Tono
  icono?: LucideIcon
  children: React.ReactNode
}) {
  return (
    <span className="chip" data-tone={tono}>
      {Icono && <Icono aria-hidden="true" strokeWidth={2.4} />}
      {children}
    </span>
  )
}
