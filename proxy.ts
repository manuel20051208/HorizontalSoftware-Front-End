import { type NextRequest, NextResponse } from 'next/server'
import { esSesion, guardarSesion, llamarApi, type Sesion } from '@/lib/auth/api'
import { COOKIE_ACCESS, COOKIE_REFRESH, esModulo, MODULOS, RUTAS_API } from '@/lib/auth/config'
import { leerToken } from '@/lib/auth/token'

/**
 * Antes de cada página de módulo:
 * - /admin, /residente, /vigilante: sin sesión de ese rol, al formulario de ingreso del módulo.
 * - /ingresar/<módulo>: si ya hay sesión de ese rol, directo al módulo.
 * Si el access token (15 min) venció pero queda el refresh token (7 días), renueva la sesión aquí.
 * Solo lee cookies: no consulta la base de datos.
 */
export async function proxy(request: NextRequest) {
  const [, primero, segundo] = request.nextUrl.pathname.split('/')
  const esIngreso = primero === 'ingresar'
  const modulo = esIngreso ? segundo : primero
  if (!esModulo(modulo)) return NextResponse.next()

  let identidad = leerToken(request.cookies.get(COOKIE_ACCESS)?.value)
  const refresh = request.cookies.get(COOKIE_REFRESH)?.value
  let renovada: Sesion | null = null
  let refreshInvalido = false

  if (!identidad && refresh) {
    const r = await llamarApi(RUTAS_API.refresh, { body: { refreshToken: refresh } })
    if (r.ok && esSesion(r.datos)) {
      renovada = r.datos
      identidad = leerToken(renovada.access_token)
      // La página que se va a renderizar debe ver ya el token nuevo
      request.cookies.set(COOKIE_ACCESS, renovada.access_token)
      request.cookies.set(COOKIE_REFRESH, renovada.refresh_token)
    } else if (!r.ok && (r.status === 401 || r.status === 403)) {
      refreshInvalido = true // vencido, revocado o la cuenta fue desactivada
    }
  }

  const tieneAcceso = identidad?.rol === MODULOS[modulo].rol
  let respuesta: NextResponse
  if (esIngreso) {
    respuesta = tieneAcceso
      ? NextResponse.redirect(new URL(`/${modulo}`, request.url))
      : NextResponse.next({ request: { headers: request.headers } })
  } else {
    respuesta = tieneAcceso
      ? NextResponse.next({ request: { headers: request.headers } })
      : NextResponse.redirect(new URL(`/ingresar/${modulo}`, request.url))
  }

  if (renovada) guardarSesion(respuesta.cookies, renovada)
  if (refreshInvalido) {
    respuesta.cookies.delete(COOKIE_ACCESS)
    respuesta.cookies.delete(COOKIE_REFRESH)
  }
  return respuesta
}

export const config = {
  matcher: ['/ingresar/:path*', '/admin/:path*', '/residente/:path*', '/vigilante/:path*'],
}
