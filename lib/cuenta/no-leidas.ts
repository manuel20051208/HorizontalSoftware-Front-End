import type { Notificacion } from '@/lib/api/tipos'

/**
 * Cookie con la última notificación que el usuario ya vio, como «usuarioId:notificacionId».
 * Lleva el id del usuario para que, si otra persona entra en el mismo navegador, no herede la cuenta.
 */
export const COOKIE_VISTAS = 'tp_notif_vistas'

/**
 * Cuántas notificaciones sin leer mostrar en la campana.
 *
 * El back solo dice si el usuario tiene algo sin leer (notificacionLeida), no cuántas. Así que:
 * - si el back dice que todo está leído (o no respondió), 0;
 * - si no, las que llegaron después de la última que vio. Sin cookie, todas las que llegaron.
 *
 * notificacionLeida arranca en false al crear la cuenta: por eso, sin notificaciones, también es 0
 * (antes la campana mostraba el punto rojo a toda cuenta nueva).
 */
export function contarSinLeer(
  notificaciones: Notificacion[],
  notificacionLeida: boolean | null | undefined,
  usuarioId: number | undefined,
  cookie: string | undefined,
): number {
  if (notificacionLeida !== false || usuarioId === undefined) return 0
  const [deUsuario, ultimaVista] = (cookie ?? '').split(':').map(Number)
  const vista = deUsuario === usuarioId && Number.isFinite(ultimaVista) ? ultimaVista : 0
  return notificaciones.filter((n) => n.id > vista).length
}
