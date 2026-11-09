import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { llamarApi, type MetodoHttp, type Resultado } from './api'
import { COOKIE_ACCESS, MODULOS, type Modulo } from './config'
import { leerToken } from './token'

/**
 * Para las páginas de cada módulo: devuelve quién inició sesión o manda al formulario de
 * ingreso de ese módulo. El proxy ya hizo este filtro; esto es la segunda barrera, por si
 * alguna ruta queda fuera de su matcher.
 */
export const requerirSesion = cache(async (modulo: Modulo) => {
  const identidad = leerToken((await cookies()).get(COOKIE_ACCESS)?.value)
  if (!identidad || identidad.rol !== MODULOS[modulo].rol) {
    redirect(`/ingresar/${modulo}`)
  }
  return identidad
})

/**
 * Llamada al API con el token de la sesión del módulo. Si el backend dice que la sesión ya
 * no vale (401: vencida, revocada o cuenta desactivada), vuelve al formulario de ingreso.
 */
export async function apiConSesion<T>(
  modulo: Modulo,
  ruta: string,
  opciones: { body?: unknown; metodo?: MetodoHttp } = {},
): Promise<Resultado<T>> {
  await requerirSesion(modulo)
  const token = (await cookies()).get(COOKIE_ACCESS)?.value
  const r = await llamarApi<T>(ruta, { ...opciones, token })
  if (!r.ok && r.status === 401) redirect(`/ingresar/${modulo}`)
  return r
}
