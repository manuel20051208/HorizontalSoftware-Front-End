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
  fechaCreacionCuenta: string | null
  inmuebleId: number | null
  direccionInmueble: string | null
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
