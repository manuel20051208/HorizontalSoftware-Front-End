'use server'

import { revalidatePath } from 'next/cache'
import { errorDeApi, exito, texto, type EstadoAccion } from '@/lib/api/acciones'

import { llamarApi } from '@/lib/auth/api'
import { apiConSesion } from '@/lib/auth/sesion'
import { RUTAS_API, type Modulo } from '@/lib/auth/config'

/** Público: envía una contraseña temporal si el correo existe (la respuesta es siempre la misma). */
export async function recuperarContrasena(_previo: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  const correo = texto(datos, 'correo')
  if (!correo) return { estado: 'error', mensaje: 'Escribe tu correo.' }
  const r = await llamarApi<{ mensaje: string }>(RUTAS_API.recuperar, { body: { correo } })
  if (!r.ok) return errorDeApi(r, 'No se pudo enviar la solicitud.')
  return exito('Si el correo está registrado, recibirás una contraseña temporal.')
}

export async function cambiarContrasena(
  modulo: Modulo,
  _previo: EstadoAccion,
  datos: FormData,
): Promise<EstadoAccion> {
  const contrasenaActual = texto(datos, 'contrasenaActual')
  const contrasenaNueva = texto(datos, 'contrasenaNueva')
  if (!contrasenaActual || !contrasenaNueva) {
    return { estado: 'error', mensaje: 'Escribe tu contraseña actual y la nueva.' }
  }
  if (contrasenaNueva.length < 8 || !/\p{L}/u.test(contrasenaNueva) || !/\d/.test(contrasenaNueva)) {
    return { estado: 'error', mensaje: 'La nueva contraseña debe tener mínimo 8 caracteres, con letras y números.' }
  }
  const r = await apiConSesion(modulo, RUTAS_API.cambiarContrasena, {
    metodo: 'PUT',
    body: { contrasenaActual, contrasenaNueva },
  })
  if (!r.ok) return errorDeApi(r, 'No se pudo cambiar la contraseña.')
  return exito('Contraseña actualizada.')
}

/** La campana del shell marca como leídas las notificaciones del usuario. */
export async function marcarNotificacionesLeidas(modulo: Modulo): Promise<EstadoAccion> {
  const r = await apiConSesion(modulo, RUTAS_API.notificacionesLeidas, { metodo: 'PUT' })
  if (!r.ok) return errorDeApi(r, 'No se pudieron marcar las notificaciones.')
  revalidatePath(`/${modulo}/notificaciones`)
  revalidatePath(`/${modulo}`)
  return exito('Notificaciones marcadas como leídas.')
}
