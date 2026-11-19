'use server'

import { revalidatePath } from 'next/cache'
import { errorDeApi, exito, texto, type EstadoAccion } from '@/lib/api/acciones'
import type { Ingreso, Notificacion } from '@/lib/api/tipos'
import { apiConSesion } from '@/lib/auth/sesion'
import { RUTAS_API } from '@/lib/auth/config'

export async function registrarIngreso(identificacion: number): Promise<EstadoAccion> {
  const r = await apiConSesion<Ingreso>('vigilante', RUTAS_API.vigilanteIngreso(identificacion))
  if (!r.ok) return errorDeApi(r, 'No se pudo registrar el ingreso.')
  revalidatePath('/vigilante')
  const notificados = r.datos.inmueblesNotificados.length
  return exito(
    r.datos.mensaje ||
      `Ingreso registrado: ${r.datos.visitante}.` + (notificados ? ` Se notificó a ${notificados} inmueble(s).` : ''),
  )
}

/** Máximo que acepta el backend para la descripción de una incidencia. */
const MAXIMO_INCIDENCIA = 300

/** Incidencia operativa: le llega a todos los administradores activos como notificación INCIDENCIA. */
export async function registrarIncidencia(_previo: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  const descripcion = texto(datos, 'descripcion')
  if (!descripcion) return { estado: 'error', mensaje: 'Describe la incidencia.' }
  if (descripcion.length > MAXIMO_INCIDENCIA) {
    return { estado: 'error', mensaje: `La descripción admite máximo ${MAXIMO_INCIDENCIA} caracteres.` }
  }

  const r = await apiConSesion<Notificacion>('vigilante', RUTAS_API.vigilanteIncidencias, { body: { descripcion } })
  if (!r.ok) {
    if (r.status === 409) {
      return { estado: 'error', mensaje: r.mensaje || 'No hay administradores activos que puedan recibir la incidencia.' }
    }
    return errorDeApi(r, 'No se pudo registrar la incidencia.')
  }
  return exito('Incidencia enviada a la administración.')
}
