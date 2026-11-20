import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { llamarApi, type MetodoHttp, type Resultado } from './api'
import { COOKIE_ACCESS, COOKIE_INMUEBLE, MODULOS, type Modulo, RUTAS_API } from './config'
import { leerToken } from './token'
import type { InmuebleBasico } from '@/lib/usuarios/tipos'

/**
 * Para las páginas de cada módulo: devuelve quién inició sesión o manda al ingreso. El proxy ya hizo este filtro; esto es la segunda barrera, por si
 * alguna ruta queda fuera de su matcher.
 */
export const requerirSesion = cache(async (modulo: Modulo) => {
  const identidad = leerToken((await cookies()).get(COOKIE_ACCESS)?.value)
  if (!identidad || identidad.rol !== MODULOS[modulo].rol) {
    redirect('/ingresar')
  }
  return identidad
})

/**
 * Los apartamentos del residente que inició sesión (GET /api/residente/inmuebles), una vez por petición.
 * Usa llamarApi directo: apiConSesion los necesita para elegir el apartamento y no debe llamarse a sí mismo.
 */
export const inmueblesDelResidente = cache(async (): Promise<InmuebleBasico[]> => {
  await requerirSesion('residente')
  const token = (await cookies()).get(COOKIE_ACCESS)?.value
  const r = await llamarApi<InmuebleBasico[]>(RUTAS_API.misInmuebles, { metodo: 'GET', token })
  if (!r.ok && r.status === 401) redirect('/ingresar')
  if (!r.ok || !Array.isArray(r.datos)) return []
  return [...r.datos].sort((a, b) => a.direccionInmueble.localeCompare(b.direccionInmueble, 'es', { numeric: true }))
})

/**
 * El apartamento sobre el que trabaja el residente: el de la cookie del selector si sigue siendo suyo; si no
 * (cookie vieja, apartamento quitado, otra cuenta en el mismo navegador), el primero de sus apartamentos.
 */
export const inmuebleElegido = cache(async (): Promise<InmuebleBasico | undefined> => {
  const inmuebles = await inmueblesDelResidente()
  const guardado = Number((await cookies()).get(COOKIE_INMUEBLE)?.value)
  return inmuebles.find((i) => i.id === guardado) ?? inmuebles[0]
})

/** /api/residente/** y /api/pagos/** trabajan sobre un apartamento: se les agrega ?inmuebleId= del elegido. */
async function conInmueble(modulo: Modulo, ruta: string) {
  if (modulo !== 'residente' || ruta.startsWith(RUTAS_API.misInmuebles)) return ruta
  if (!ruta.startsWith('/api/residente/') && !ruta.startsWith('/api/pagos/')) return ruta
  const elegido = await inmuebleElegido()
  if (!elegido) return ruta
  const [base, query = ''] = ruta.split('?')
  const params = new URLSearchParams(query)
  params.set('inmuebleId', String(elegido.id))
  return `${base}?${params}`
}

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
  const r = await llamarApi<T>(await conInmueble(modulo, ruta), { ...opciones, token })
  if (!r.ok && r.status === 401) redirect('/ingresar')
  return r
}
