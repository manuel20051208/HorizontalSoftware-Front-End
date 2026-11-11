import { CalendarCheck, Check, Clock, type LucideIcon } from 'lucide-react'
import { ESTADO_RESERVA_TEXTO, type EstadoReserva } from '@/lib/api/tipos'
import { Chip, type Tono } from './chip'

const TONO: Record<EstadoReserva, Tono> = { PROGRAMADA: 'ok', EN_CURSO: 'info', FINALIZADA: 'neutral' }
const ICONO: Record<EstadoReserva, LucideIcon> = { PROGRAMADA: CalendarCheck, EN_CURSO: Clock, FINALIZADA: Check }

/** El estado de una reserva tal como lo calcula el servidor (Programada, En curso, Finalizada). */
export function ChipReserva({ estado }: { estado: EstadoReserva }) {
  return (
    <Chip tono={TONO[estado] ?? 'neutral'} icono={ICONO[estado]}>
      {ESTADO_RESERVA_TEXTO[estado] ?? estado}
    </Chip>
  )
}
