/** Tipos de cuenta que el administrador puede crear (UsuarioRequests.CrearUsuario.tipoUsuario). */
export const TIPOS_CUENTA = {
  RESIDENTE: { nombre: 'Residente', plural: 'Residentes', filtro: 'residentes' },
  VIGILANTE: { nombre: 'Vigilante', plural: 'Vigilantes', filtro: 'vigilantes' },
  ADMINISTRADOR: { nombre: 'Administrador', plural: 'Administradores', filtro: 'administradores' },
} as const

export type TipoCuenta = keyof typeof TIPOS_CUENTA

export function esTipoCuenta(valor: unknown): valor is TipoCuenta {
  return typeof valor === 'string' && Object.hasOwn(TIPOS_CUENTA, valor)
}

/** Los invitados (USUARIO_AUTORIZADO) los crea cada residente; la administración solo maneja sus apartamentos. */
export const INVITADO = { tipo: 'USUARIO_AUTORIZADO', nombre: 'Invitado', plural: 'Invitados', filtro: 'invitados' } as const

/** Residentes e invitados son las cuentas que se relacionan con apartamentos (muchos a muchos). */
export function tieneApartamentos(tipoUsuario: string) {
  return tipoUsuario === 'RESIDENTE' || tipoUsuario === INVITADO.tipo
}

/** ?tipo=vigilante o ?tipo=vigilantes -> 'VIGILANTE' */
export function tipoDeFiltro(valor: string | undefined): TipoCuenta | undefined {
  if (!valor) return undefined
  return (Object.keys(TIPOS_CUENTA) as TipoCuenta[]).find(
    (t) => TIPOS_CUENTA[t].filtro === valor || TIPOS_CUENTA[t].nombre.toLowerCase() === valor,
  )
}

/** UsuarioResponses.Usuario */
export type Usuario = {
  id: number
  identificacion: number
  nombreCompleto: string
  correoElectronico: string
  tipoUsuario: string
  active: boolean | null
  /** false = tiene notificaciones sin leer (lo usa la campana del shell). */
  notificacionLeida?: boolean | null
  fechaCreacionCuenta: string | null
  /** Apartamentos de residentes e invitados, por dirección (vacío para administradores y vigilantes). */
  inmuebles?: InmuebleBasico[] | null
  /** false = el administrador aún no confirma el código enviado al correo: la cuenta no se puede activar. */
  correoVerificado?: boolean | null
}

/** Un apartamento de la cuenta: `inmuebles[]` de Usuario, Invitado y GET /api/residente/inmuebles. */
export type InmuebleBasico = { id: number; direccionInmueble: string }

/** UsuarioResponses.UsuarioInmuebles: un residente o invitado con todos sus apartamentos. */
export type UsuarioInmuebles = {
  id: number
  identificacion: number
  nombreCompleto: string
  tipoUsuario: string
  active: boolean | null
  inmuebles: InmuebleBasico[]
}

/** UsuarioResponses.UsuarioDeInmueble: una persona (residente o invitado) de un apartamento. */
export type UsuarioDeInmueble = {
  id: number
  identificacion: number
  nombreCompleto: string
  tipoUsuario: string
  active: boolean | null
}

/** InmuebleResponses.Resumen (solo lo que usa el formulario) */
export type Inmueble = {
  id: number
  direccionInmueble: string
  isActive: boolean | null
}

/** Fecha de hoy en Colombia como AAAA-MM-DD, el mismo formato de <input type="date">. */
export function hoyBogota() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())
}
