import { horaLegible } from './acciones'
import type { Reserva } from './tipos'

/**
 * Reservas con fecha y hora (contrato nuevo). El backend trabaja en hora de Colombia y
 * manda/recibe fechas locales sin zona: `yyyy-MM-ddTHH:mm[:ss]`. Aquí se tratan como texto
 * de pared (no se convierten con la zona del navegador ni del servidor).
 */

const FECHA = /^\d{4}-\d{2}-\d{2}$/
const HORA = /^\d{2}:\d{2}$/

/** Hoy en Colombia, como yyyy-MM-dd. */
export function hoyColombia(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())
}

function diaSiguiente(fecha: string): string {
  const d = new Date(`${fecha}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

/**
 * Arma el intervalo de una reserva a partir del formulario (día, hora de inicio, hora de fin).
 * Si la hora de fin es menor o igual a la de inicio, termina al día siguiente: así se reservan
 * las zonas cuyo horario cruza la medianoche (p. ej. 20:00–02:00).
 */
export function intervaloReserva(
  fecha: string,
  inicio: string,
  fin: string,
): { inicio: string; fin: string } | null {
  if (!FECHA.test(fecha) || !HORA.test(inicio) || !HORA.test(fin)) return null
  const fechaFin = fin <= inicio ? diaSiguiente(fecha) : fecha
  return { inicio: `${fecha}T${inicio}`, fin: `${fechaFin}T${fin}` }
}

/** «jueves, 20 de noviembre» (o «Hoy» / «Mañana»). */
export function diaReserva(valor: string | null | undefined, hoy = hoyColombia()): string {
  if (!valor) return '—'
  const fecha = valor.slice(0, 10)
  if (fecha === hoy) return 'Hoy'
  if (fecha === diaSiguiente(hoy)) return 'Mañana'
  const d = new Date(`${fecha}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return fecha
  const texto = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(d)
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

/** La hora de una fecha-hora local: «10:00 a. m.». */
export function horaReserva(valor: string | null | undefined): string {
  return valor ? horaLegible(valor.slice(11, 16)) : '—'
}

/** «10:00 a. m. a 12:00 p. m.»; si termina otro día, lo dice. */
export function horarioReserva(r: Pick<Reserva, 'fechaHoraInicio' | 'fechaHoraFin'>): string {
  if (!r.fechaHoraInicio || !r.fechaHoraFin) return '—'
  const otroDia = r.fechaHoraFin.slice(0, 10) !== r.fechaHoraInicio.slice(0, 10)
  return `${horaReserva(r.fechaHoraInicio)} a ${horaReserva(r.fechaHoraFin)}${otroDia ? ' del día siguiente' : ''}`
}

/** Orden por inicio: la más próxima primero. */
export function porInicio(a: Reserva, b: Reserva) {
  return (a.fechaHoraInicio ?? '').localeCompare(b.fechaHoraInicio ?? '') || a.id - b.id
}
