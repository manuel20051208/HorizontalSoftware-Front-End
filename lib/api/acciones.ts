import type { Resultado } from '@/lib/auth/api'

/** Estado común de las Server Actions: error visible o confirmación breve. */
export type EstadoAccion =
  | { estado: 'error'; mensaje: string; errores?: Record<string, string> }
  | { estado: 'ok'; mensaje: string }
  | undefined

export function errorDeApi(
  r: Extract<Resultado<unknown>, { ok: false }>,
  porDefecto = 'No se pudo completar la operación.',
): Extract<EstadoAccion, { estado: 'error' }> {
  if (r.status === 0) {
    return { estado: 'error', mensaje: 'No pudimos conectar con el servidor. Intenta de nuevo en un momento.' }
  }
  if (r.status === 401) return { estado: 'error', mensaje: 'Tu sesión venció. Vuelve a ingresar.' }
  if (r.status === 403) return { estado: 'error', mensaje: r.mensaje || 'Tu cuenta no tiene permiso para esta acción.' }
  return { estado: 'error', mensaje: r.mensaje || porDefecto, errores: r.errores }
}

export function exito(mensaje: string): Extract<EstadoAccion, { estado: 'ok' }> {
  return { estado: 'ok', mensaje }
}

export function texto(datos: FormData, campo: string) {
  return String(datos.get(campo) ?? '').trim()
}

export function numero(datos: FormData, campo: string): number | undefined {
  const valor = texto(datos, campo)
  if (!valor) return undefined
  const n = Number(valor)
  return Number.isFinite(n) ? n : undefined
}

export function enteroPositivo(valor: string): number | undefined {
  if (!/^\d+$/.test(valor)) return undefined
  const n = Number(valor)
  return Number.isSafeInteger(n) && n > 0 ? n : undefined
}

export function hoyBogota() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())
}

export function primerDiaDelMes(fecha = hoyBogota()) {
  return `${fecha.slice(0, 7)}-01`
}

/** 485000 -> «$ 485.000». */
export function pesos(valor: number | null | undefined) {
  if (valor === null || valor === undefined) return '—'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(valor)
}

/** yyyy-MM-dd -> «10 de noviembre de 2026» (sin desfase de zona horaria). */
export function fechaLarga(valor: string | null | undefined) {
  if (!valor) return '—'
  const fecha = new Date(`${valor.slice(0, 10)}T00:00:00Z`)
  if (Number.isNaN(fecha.getTime())) return valor
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(fecha)
}

/** HH:mm[:ss] -> «4:00 p. m.» */
export function horaLegible(valor: string | null | undefined) {
  if (!valor) return '—'
  const [h, m] = valor.split(':').map(Number)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return valor
  return new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit', hour12: true }).format(
    new Date(2000, 0, 1, h, m),
  )
}
