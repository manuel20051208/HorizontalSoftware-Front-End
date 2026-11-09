import { API_URL, COOKIE_ACCESS, COOKIE_REFRESH, opcionesCookie, REFRESH_MAX_AGE } from './config'

/** AuthResponses.Sesion del backend. */
export type Sesion = {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
  usuario: {
    id: number
    nombreCompleto: string
    correoElectronico: string
    tipoUsuario: string
  }
}

export type Resultado<T> =
  | { ok: true; datos: T }
  /**
   * status 0 = no hubo respuesta (backend apagado, sin red o tiempo agotado).
   * errores = validaciones de Bean Validation, campo -> mensaje (solo en 400).
   */
  | { ok: false; status: number; mensaje: string; errores?: Record<string, string> }

export type MetodoHttp = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/** Llamada al backend (POST por defecto). Nunca lanza: los errores vuelven como { ok: false }. */
export async function llamarApi<T = unknown>(
  ruta: string,
  { body, token, metodo = 'POST' }: { body?: unknown; token?: string; metodo?: MetodoHttp } = {},
): Promise<Resultado<T>> {
  let respuesta: Response
  try {
    respuesta = await fetch(API_URL + ruta, {
      method: metodo,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    })
  } catch {
    return { ok: false, status: 0, mensaje: '' }
  }

  // ErrorResponse del backend: { status, error, mensaje, errores? }
  const cuerpo = await respuesta.json().catch(() => null)
  if (!respuesta.ok) {
    return {
      ok: false,
      status: respuesta.status,
      mensaje: typeof cuerpo?.mensaje === 'string' ? cuerpo.mensaje : '',
      errores: cuerpo?.errores && typeof cuerpo.errores === 'object' ? cuerpo.errores : undefined,
    }
  }
  return { ok: true, datos: cuerpo as T }
}

export function esSesion(valor: unknown): valor is Sesion {
  const s = valor as Sesion | null
  return typeof s?.access_token === 'string' && typeof s.refresh_token === 'string' && typeof s.expires_in === 'number'
}

/** Sirve para cookies() de next/headers y para response.cookies del proxy. */
type Galletas = { set(nombre: string, valor: string, opciones: ReturnType<typeof opcionesCookie>): unknown }

export function guardarSesion(galletas: Galletas, sesion: Sesion) {
  galletas.set(COOKIE_ACCESS, sesion.access_token, opcionesCookie(sesion.expires_in))
  galletas.set(COOKIE_REFRESH, sesion.refresh_token, opcionesCookie(REFRESH_MAX_AGE))
}
