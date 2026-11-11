'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { errorDeApi, exito, numero, texto, type EstadoAccion } from '@/lib/api/acciones'
import { intervaloReserva } from '@/lib/api/reservas'
import type { IniciarPago } from '@/lib/api/tipos'
import { apiConSesion } from '@/lib/auth/sesion'
import { RUTAS_API } from '@/lib/auth/config'

function refrescarResidente() {
  revalidatePath('/residente')
  revalidatePath('/residente/pagos')
  revalidatePath('/residente/invitados')
  revalidatePath('/residente/reservas')
  revalidatePath('/residente/auto')
}

// ---------- Pagos ----------

export async function iniciarPago(_previo: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  const metodoPago = texto(datos, 'metodoPago')
  if (!metodoPago) return { estado: 'error', mensaje: 'Elige el método de pago.' }

  const r = await apiConSesion<IniciarPago>('residente', RUTAS_API.iniciarPago, { body: { metodoPago } })
  if (!r.ok) return errorDeApi(r, 'No se pudo iniciar el pago.')
  if (!r.datos.urlCheckout) return { estado: 'error', mensaje: 'La pasarela no devolvió una dirección de pago.' }

  // El pago nace PENDIENTE: se lleva al residente al checkout de la pasarela.
  redirect(r.datos.urlCheckout)
}

// ---------- Invitados ----------

export async function crearInvitado(_previo: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  const identificacion = numero(datos, 'identificacion')
  const nombreCompleto = texto(datos, 'nombreCompleto')
  if (!identificacion || !nombreCompleto) {
    return { estado: 'error', mensaje: 'Escribe la identificación y el nombre del invitado.' }
  }
  const r = await apiConSesion('residente', RUTAS_API.invitados, {
    body: {
      identificacion,
      nombreCompleto,
      fechaNacimiento: texto(datos, 'fechaNacimiento') || null,
      correoElectronico: texto(datos, 'correoElectronico') || null,
      venceAutorizacion: texto(datos, 'venceAutorizacion') || null,
    },
  })
  if (!r.ok) return errorDeApi(r, 'No se pudo registrar el invitado.')
  refrescarResidente()
  return exito(`Invitado ${nombreCompleto} registrado.`)
}

export async function alternarInvitado(id: number): Promise<EstadoAccion> {
  const r = await apiConSesion('residente', RUTAS_API.invitadoEstado(id), { metodo: 'PATCH' })
  if (!r.ok) return errorDeApi(r, 'No se pudo cambiar la autorización del invitado.')
  refrescarResidente()
  return exito('Autorización actualizada.')
}

export async function alternarInvitados(_previo: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  const invitadoIds = datos
    .getAll('invitadoIds')
    .map((v) => Number(v))
    .filter((n) => Number.isSafeInteger(n) && n > 0)
  if (!invitadoIds.length) return { estado: 'error', mensaje: 'Elige al menos un invitado.' }
  const r = await apiConSesion('residente', RUTAS_API.invitadosEstado, {
    metodo: 'PATCH',
    body: { invitadoIds },
  })
  if (!r.ok) return errorDeApi(r, 'No se pudo cambiar la autorización de los invitados.')
  refrescarResidente()
  return exito('Autorizaciones actualizadas.')
}

// ---------- Auto ----------

export async function registrarAuto(_previo: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  const placa = numero(datos, 'placa')
  if (!placa || placa <= 0) return { estado: 'error', mensaje: 'Escribe la placa numérica del auto.' }
  const r = await apiConSesion('residente', RUTAS_API.auto, {
    body: { placa, parqueaderoId: numero(datos, 'parqueaderoId') ?? null },
  })
  if (!r.ok) return errorDeApi(r, 'No se pudo registrar el auto.')
  refrescarResidente()
  return exito('Auto registrado.')
}

// ---------- Reservas ----------

export async function reservar(_previo: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  const zonaComunId = numero(datos, 'zonaComunId')
  const intervalo = intervaloReserva(texto(datos, 'fecha'), texto(datos, 'inicio'), texto(datos, 'fin'))
  if (!zonaComunId || !intervalo) {
    return { estado: 'error', mensaje: 'Elige la zona, el día y las horas de inicio y fin.' }
  }

  const r = await apiConSesion('residente', RUTAS_API.reservas, {
    body: { zonaComunId, fechaHoraInicio: intervalo.inicio, fechaHoraFin: intervalo.fin },
  })
  if (!r.ok) return errorDeApi(r, 'No se pudo hacer la reserva.')
  refrescarResidente()
  return exito('Reserva confirmada.')
}

export async function cancelarReserva(id: number): Promise<EstadoAccion> {
  const r = await apiConSesion('residente', RUTAS_API.reserva(id), { metodo: 'DELETE' })
  if (!r.ok) return errorDeApi(r, 'No se pudo cancelar la reserva.')
  refrescarResidente()
  return exito('Reserva cancelada.')
}
