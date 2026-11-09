'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { esSesion, guardarSesion, llamarApi, type Resultado } from './api'
import { COOKIE_ACCESS, COOKIE_REFRESH, esModulo, type Modulo, MODULOS, moduloDeRol, RUTAS_API } from './config'

export type EstadoIngreso = { error: string; correo: string } | undefined

/** Los mensajes del backend vienen sin tildes; aquí se dicen en el tono de la interfaz. */
function mensajeDeError(r: Extract<Resultado<unknown>, { ok: false }>) {
  if (r.status === 0) return 'No pudimos conectar con el servidor. Intenta de nuevo en un momento.'
  if (r.status === 400) return 'Revisa el correo y la contraseña.'
  if (r.status === 401) return 'Correo o contraseña incorrectos.'
  if (r.status === 403) {
    if (r.mensaje.includes('no esta activa')) return 'Tu cuenta aún no está activa. Pide a la administración que la active.'
    if (r.mensaje.includes('invitados')) return 'Los invitados no inician sesión en el sistema.'
    return r.mensaje || 'Esta cuenta no puede iniciar sesión.'
  }
  return 'Algo falló en el servidor. Intenta de nuevo en un momento.'
}

/** El formulario de cada módulo la recibe con el módulo ya fijado (bind). */
export async function iniciarSesion(modulo: Modulo, _previo: EstadoIngreso, datos: FormData): Promise<EstadoIngreso> {
  if (!esModulo(modulo)) return { error: 'Módulo no válido.', correo: '' }

  const correo = String(datos.get('correo') ?? '').trim()
  const contrasena = String(datos.get('contrasena') ?? '')
  if (!correo || !contrasena) return { error: 'Escribe tu correo y tu contraseña.', correo }

  const r = await llamarApi(RUTAS_API.login, { body: { correo, contrasena } })
  if (!r.ok) return { error: mensajeDeError(r), correo }
  if (!esSesion(r.datos)) return { error: 'El servidor respondió algo inesperado. Intenta de nuevo.', correo }
  const sesion = r.datos

  const suModulo = moduloDeRol(sesion.usuario?.tipoUsuario)
  if (suModulo !== modulo) {
    // Las credenciales son buenas pero de otro módulo: se cierra la sesión que el backend abrió.
    await llamarApi(RUTAS_API.logout, { token: sesion.access_token })
    return {
      error: suModulo
        ? `Esta cuenta es de ${MODULOS[suModulo].nombre}. Ingresa por ese módulo.`
        : 'Esta cuenta no tiene acceso a este módulo.',
      correo,
    }
  }

  guardarSesion(await cookies(), sesion)
  redirect(`/${modulo}`)
}

export async function cerrarSesion() {
  const galletas = await cookies()
  const token = galletas.get(COOKIE_ACCESS)?.value
  // Revoca el refresh token en el backend; si no responde, igual se borran las cookies.
  if (token) await llamarApi(RUTAS_API.logout, { token })
  galletas.delete(COOKIE_ACCESS)
  galletas.delete(COOKIE_REFRESH)
  redirect('/')
}
