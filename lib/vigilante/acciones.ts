'use server'

import { revalidatePath } from 'next/cache'
import { errorDeApi, exito, type EstadoAccion } from '@/lib/api/acciones'
import type { Ingreso } from '@/lib/api/tipos'
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
