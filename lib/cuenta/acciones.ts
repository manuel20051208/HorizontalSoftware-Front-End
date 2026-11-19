'use server'

import { revalidatePath } from 'next/cache'
import { errorDeApi, exito, texto, type EstadoAccion } from '@/lib/api/acciones'
import type { Preferencias } from '@/lib/api/tipos'
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

/**
 * Activa o desactiva un tipo de notificación.
 *
 * El back guarda la lista de tipos que el usuario acepta (vacía = todos) y su PUT solo alterna
 * un tipo dentro de esa lista. Por eso aquí se calcula la lista deseada y se mandan los PUT
 * necesarios para llegar a ella. Si al final se aceptan todos los tipos, la lista queda vacía.
 */
export async function cambiarPreferencia(
  modulo: Modulo,
  tipos: readonly string[],
  tipo: string,
  recibir: boolean,
): Promise<EstadoAccion> {
  const actual = await apiConSesion<Preferencias>(modulo, RUTAS_API.preferencias, { metodo: 'GET' })
  if (!actual.ok) return errorDeApi(actual, 'No se pudieron leer tus preferencias.')

  const guardadas = new Set(actual.datos.preferenciasNotificacion.map((t) => t.toUpperCase()))
  const aceptadas = new Set(guardadas.size ? guardadas : tipos)
  if (recibir) aceptadas.add(tipo)
  else aceptadas.delete(tipo)

  if (![...aceptadas].some((t) => tipos.includes(t))) {
    return { estado: 'error', mensaje: 'Deja al menos un tipo de aviso activo.' }
  }

  // Todos los tipos aceptados = lista vacía (así también llegan los tipos que se agreguen después).
  const deseadas = tipos.every((t) => aceptadas.has(t)) ? new Set<string>() : aceptadas
  const cambios = [...new Set([...guardadas, ...deseadas])].filter((t) => guardadas.has(t) !== deseadas.has(t))

  for (const tipoNotificacion of cambios) {
    const r = await apiConSesion<Preferencias>(modulo, RUTAS_API.preferencias, {
      metodo: 'PUT',
      body: { tipoNotificacion },
    })
    if (!r.ok) return errorDeApi(r, 'No se pudieron guardar tus preferencias.')
  }

  revalidatePath(`/${modulo}/notificaciones`)
  return exito(recibir ? 'Volverás a recibir estos avisos.' : 'Ya no recibirás estos avisos.')
}

/** La campana del shell marca como leídas las notificaciones del usuario. */
export async function marcarNotificacionesLeidas(modulo: Modulo): Promise<EstadoAccion> {
  const r = await apiConSesion(modulo, RUTAS_API.notificacionesLeidas, { metodo: 'PUT' })
  if (!r.ok) return errorDeApi(r, 'No se pudieron marcar las notificaciones.')
  revalidatePath(`/${modulo}/notificaciones`)
  revalidatePath(`/${modulo}`)
  return exito('Notificaciones marcadas como leídas.')
}
