/**
 * Configuración de la sesión. Lo comparten el proxy, las Server Actions y las páginas,
 * así que aquí no se importa nada exclusivo de React ni de next/headers.
 */

/** Cada módulo del front-end y el tipoUsuario del backend que puede entrar en él. */
export const MODULOS = {
  admin: { nombre: 'Administrador', rol: 'ADMINISTRADOR' },
  residente: { nombre: 'Residente', rol: 'RESIDENTE' },
  vigilante: { nombre: 'Vigilante', rol: 'VIGILANTE' },
} as const

export type Modulo = keyof typeof MODULOS

export function esModulo(valor: unknown): valor is Modulo {
  return typeof valor === 'string' && Object.hasOwn(MODULOS, valor)
}

export function moduloDeRol(rol: unknown): Modulo | undefined {
  return (Object.keys(MODULOS) as Modulo[]).find((m) => MODULOS[m].rol === rol)
}

/**
 * Back-end Spring Boot. `pnpm dev` usa el backend local y el build de producción el desplegado.
 * API_URL manda sobre ambos (p. ej. API_URL=https://horizontal-proyect.duckdns.org en .env.local
 * para desarrollar el front contra el backend desplegado).
 */
const API_POR_DEFECTO =
  process.env.NODE_ENV === 'production' ? 'https://horizontal-proyect.duckdns.org' : 'http://localhost:8080'
export const API_URL = (process.env.API_URL || API_POR_DEFECTO).replace(/\/+$/, '')

/** Endpoints que usa el front. El contrato completo está en ENDPOINTS.md del backend. */
export const RUTAS_API = {
  // Cuenta y sesión
  login: '/api/auth/login', // Público · { correo, contrasena } -> Sesion
  refresh: '/api/auth/refresh', // Público · { refreshToken } -> Sesion
  logout: '/api/auth/logout', // Autenticado -> 204
  activar: '/api/auth/activar', // Público · { correo, contrasena } -> { active, mensaje }
  recuperar: '/api/auth/recuperar-contrasena', // Público · { correo } -> 202 { mensaje }
  cambiarContrasena: '/api/auth/contrasena', // Autenticado · PUT { contrasenaActual, contrasenaNueva } -> 204
  me: '/api/auth/me', // Autenticado -> Usuario

  // Administrador · liquidaciones y panel
  resumen: '/api/admin/resumen', // GET ?periodo=yyyy-MM-dd -> ResumenAdmin
  liquidaciones: '/api/admin/liquidaciones', // GET ?inmuebleId=&estado=&periodo= -> Liquidacion[]
  liquidacionesMasiva: '/api/admin/liquidaciones/masiva', // POST { periodo, fechaLimite? }
  liquidacionMora: (id: number) => `/api/admin/liquidaciones/${id}/mora`, // PATCH
  liquidacionAlDia: (id: number) => `/api/admin/liquidaciones/${id}/al-dia`, // PATCH

  // Administrador · inmuebles
  inmuebles: '/api/admin/inmuebles', // GET -> Resumen[] · POST CrearInmueble
  inmueble: (id: number) => `/api/admin/inmuebles/${id}`, // GET -> Detalle
  tarifas: (id: number) => `/api/admin/inmuebles/${id}/tarifas`, // PUT
  multas: (id: number) => `/api/admin/inmuebles/${id}/multas`, // PUT
  zonasDeInmueble: (id: number) => `/api/admin/inmuebles/${id}/zonas-comunes`, // PUT
  recordatorio: (id: number) => `/api/admin/inmuebles/${id}/recordatorio-pago`, // POST
  conciliar: (id: number) => `/api/admin/inmuebles/${id}/conciliar-pago`, // POST

  // Administrador · usuarios
  usuarios: '/api/admin/usuarios', // GET ?tipo=&active= -> Usuario[] · POST CrearUsuario -> 201 Usuario
  activo: (identificacion: number) => `/api/admin/usuarios/${identificacion}/activo`, // PATCH, alterna

  // Administrador · zonas comunes y reglas
  zonasComunes: '/api/admin/zonas-comunes', // GET -> Zona[] · POST CrearZona
  zonaEstado: (id: number) => `/api/admin/zonas-comunes/${id}/estado`, // PATCH, alterna
  reglas: '/api/admin/reglas-reserva', // GET -> Regla[] · POST CrearRegla
  regla: (id: number) => `/api/admin/reglas-reserva/${id}`, // PUT
  rompimientoAplicar: (id: number) => `/api/admin/rompimientos/${id}/aplicar`, // PATCH
  rompimientoInactivar: (id: number) => `/api/admin/rompimientos/${id}/inactivar`, // PATCH

  // Administrador · notificaciones, pagos y pasarela
  notificacionesAdmin: '/api/admin/notificaciones', // POST Enviar -> Notificacion
  notificacionLectura: (id: number) => `/api/admin/notificaciones/${id}/lectura`, // GET
  pagosAdmin: '/api/admin/pagos', // GET ?inmuebleId=&estado= -> Pago[]
  pagoAnular: (id: number) => `/api/admin/pagos/${id}/anular`, // POST
  pagoReembolso: (id: number) => `/api/admin/pagos/${id}/reembolso`, // POST
  pasarela: '/api/admin/pasarela', // GET · PUT

  // Residente · cuenta y pagos
  miCuenta: '/api/residente/mi-cuenta', // GET -> EstadoCuenta
  misPagos: '/api/residente/pagos', // GET -> Pago[] · POST { metodoPago } -> { pago, urlCheckout }
  miPago: (id: number) => `/api/residente/pagos/${id}`, // GET -> Pago
  iniciarPago: '/api/residente/pagos', // POST { metodoPago }
  invitados: '/api/residente/invitados', // GET · POST CrearInvitado
  invitadoEstado: (id: number) => `/api/residente/invitados/${id}/estado`, // PATCH, alterna
  invitadosEstado: '/api/residente/invitados/estado', // PATCH { invitadoIds }
  auto: '/api/residente/auto', // GET · POST { placa, parqueaderoId? }
  zonasResidente: '/api/residente/zonas-comunes', // GET -> Zona[]
  disponibilidad: (id: number, inicio: string, fin: string) =>
    `/api/residente/zonas-comunes/${id}/disponibilidad?${new URLSearchParams({ inicio, fin })}`, // GET · yyyy-MM-ddTHH:mm
  reservas: '/api/residente/reservas', // GET ?estado=&pagina=&tamano= · POST { zonaComunId, fechaHoraInicio, fechaHoraFin }
  reserva: (id: number) => `/api/residente/reservas/${id}`, // DELETE

  // Notificaciones del usuario
  notificaciones: '/api/notificaciones', // GET -> Notificacion[]
  notificacionesLeidas: '/api/notificaciones/leida', // PUT -> 204

  // Consultas compartidas
  comprobante: (id: number) => `/api/pagos/${id}/comprobante`, // GET -> { referencia, comprobante }
  estadoPago: (referencia: string) => `/api/pagos/estado/${encodeURIComponent(referencia)}`, // GET
  invitadoAnfitriones: (id: number) => `/api/invitados/${id}/residentes`, // GET -> Anfitrion[]
  autoDuenos: (id: number, inmuebleId?: number) =>
    `/api/autos/${id}/duenos${inmuebleId ? `?${new URLSearchParams({ inmuebleId: String(inmuebleId) })}` : ''}`,

  // Vigilante
  vigilanteReservas: '/api/vigilante/reservas', // GET ?estado=&pagina=&tamano= -> Pagina<Reserva>
  vigilanteAcceso: (identificacion: number | string) =>
    `/api/vigilante/zonas-comunes/acceso?${new URLSearchParams({ identificacion: String(identificacion) })}`,
  vigilanteInvitado: (identificacion: number | string) => `/api/vigilante/invitados/${identificacion}`,
  vigilanteIngreso: (identificacion: number | string) => `/api/vigilante/invitados/${identificacion}/ingreso`,
} as const

export const COOKIE_ACCESS = 'tp_access'
export const COOKIE_REFRESH = 'tp_refresh'

/** Igual a app.jwt.refresh-ttl del backend (7 días). */
export const REFRESH_MAX_AGE = 60 * 60 * 24 * 7

/** El JavaScript del navegador nunca ve los tokens: solo viajan en cookies httpOnly. */
export function opcionesCookie(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  }
}
