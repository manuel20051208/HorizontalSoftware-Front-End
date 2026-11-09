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

/** Back-end Spring Boot. En producción define API_URL. */
export const API_URL = (process.env.API_URL ?? 'http://localhost:8080').replace(/\/+$/, '')

/** Endpoints que usa el front. El contrato completo está en ENDPOINTS.md del backend. */
export const RUTAS_API = {
  login: '/api/auth/login', // Público · { correo, contrasena } -> Sesion
  refresh: '/api/auth/refresh', // Público · { refreshToken } -> Sesion
  logout: '/api/auth/logout', // Autenticado -> 204
  activar: '/api/auth/activar', // Público · { correo, contrasena } -> { active, mensaje }
  // Administrador
  usuarios: '/api/admin/usuarios', // GET ?tipo=&active= -> Usuario[] · POST CrearUsuario -> 201 Usuario
  activo: (identificacion: number) => `/api/admin/usuarios/${identificacion}/activo`, // PATCH, alterna
  inmuebles: '/api/admin/inmuebles', // GET -> Resumen[] (para elegir el apartamento)
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
