'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { errorDeApi, exito, numero, texto, type EstadoAccion } from '@/lib/api/acciones'
import type { ResultadoMasiva } from '@/lib/api/tipos'
import { apiConSesion } from '@/lib/auth/sesion'
import { RUTAS_API } from '@/lib/auth/config'

function refrescarAdmin() {
  revalidatePath('/admin')
  revalidatePath('/admin/liquidaciones')
  revalidatePath('/admin/inmuebles')
  revalidatePath('/admin/pagos')
  revalidatePath('/admin/zonas-comunes')
  revalidatePath('/admin/reglas-reserva')
  revalidatePath('/admin/parqueaderos')
}

// ---------- Liquidaciones ----------

export async function generarLiquidacion(_previo: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  const inmuebleId = numero(datos, 'inmuebleId')
  const periodo = texto(datos, 'periodo')
  if (!inmuebleId || !periodo) return { estado: 'error', mensaje: 'Elige el inmueble y el periodo.' }

  const r = await apiConSesion('admin', RUTAS_API.liquidaciones, {
    body: {
      inmuebleId,
      periodo,
      fechaLimite: texto(datos, 'fechaLimite') || null,
      cuotaAdministracion: numero(datos, 'cuotaAdministracion') ?? null,
      valorServiciosComunes: numero(datos, 'valorServiciosComunes') ?? null,
    },
  })
  if (!r.ok) return errorDeApi(r, 'No se pudo generar la liquidación.')
  refrescarAdmin()
  return exito('Liquidación generada.')
}

export async function generarLiquidacionMasiva(_previo: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  const periodo = texto(datos, 'periodo')
  if (!periodo) return { estado: 'error', mensaje: 'Indica el periodo.' }

  const r = await apiConSesion<ResultadoMasiva>('admin', RUTAS_API.liquidacionesMasiva, {
    body: { periodo, fechaLimite: texto(datos, 'fechaLimite') || null },
  })
  if (!r.ok) return errorDeApi(r, 'No se pudo generar la liquidación masiva.')
  refrescarAdmin()
  const omitidas = r.datos.omitidas.length
  return exito(
    `Liquidaciones generadas: ${r.datos.generadas}` + (omitidas ? `. Omitidas: ${omitidas}.` : '.'),
  )
}

export async function cambiarEstadoLiquidacion(id: number, aMora: boolean): Promise<EstadoAccion> {
  const r = await apiConSesion('admin', aMora ? RUTAS_API.liquidacionMora(id) : RUTAS_API.liquidacionAlDia(id), {
    metodo: 'PATCH',
  })
  if (!r.ok) return errorDeApi(r, 'No se pudo cambiar el estado de la liquidación.')
  refrescarAdmin()
  return exito(aMora ? 'Liquidación marcada en mora.' : 'Liquidación marcada al día.')
}

// ---------- Inmuebles ----------

export async function crearInmueble(_previo: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  const direccionInmueble = texto(datos, 'direccionInmueble').toUpperCase()
  if (!/^[A-Z0-9]+-\d+$/.test(direccionInmueble)) {
    return { estado: 'error', mensaje: 'La dirección debe tener el formato TORRE-APTO, por ejemplo A-302.' }
  }
  const r = await apiConSesion('admin', RUTAS_API.inmuebles, {
    body: { direccionInmueble, valorParqueadero: numero(datos, 'valorParqueadero') ?? null },
  })
  if (!r.ok) return errorDeApi(r, 'No se pudo crear el inmueble.')
  refrescarAdmin()
  return exito(`Inmueble ${direccionInmueble} creado.`)
}

export async function guardarTarifas(inmuebleId: number, _previo: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  const cuota = numero(datos, 'cuotaAdministracion')
  const servicios = numero(datos, 'valorServiciosComunes')
  if (cuota === undefined || servicios === undefined) {
    return { estado: 'error', mensaje: 'Escribe la cuota de administración y los servicios comunes.' }
  }
  const r = await apiConSesion('admin', RUTAS_API.tarifas(inmuebleId), {
    metodo: 'PUT',
    body: {
      cuotaAdministracion: cuota,
      valorServiciosComunes: servicios,
      valorParqueadero: numero(datos, 'valorParqueadero') ?? null,
    },
  })
  if (!r.ok) return errorDeApi(r, 'No se pudieron guardar las tarifas. Verifica que el inmueble tenga una liquidación pendiente.')
  refrescarAdmin()
  return exito('Tarifas actualizadas en la liquidación vigente.')
}

export async function guardarMultas(inmuebleId: number, _previo: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  const valor = numero(datos, 'valorMultas')
  if (valor === undefined) return { estado: 'error', mensaje: 'Escribe el valor de las multas.' }
  const r = await apiConSesion('admin', RUTAS_API.multas(inmuebleId), { metodo: 'PUT', body: { valorMultas: valor } })
  if (!r.ok) return errorDeApi(r, 'No se pudieron guardar las multas.')
  refrescarAdmin()
  return exito('Multas actualizadas en la liquidación vigente.')
}

export async function asignarZonas(inmuebleId: number, _previo: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  const zonaComunIds = datos
    .getAll('zonaComunIds')
    .map((v) => Number(v))
    .filter((n) => Number.isSafeInteger(n) && n > 0)
  if (!zonaComunIds.length) return { estado: 'error', mensaje: 'Elige al menos una zona común.' }
  const r = await apiConSesion('admin', RUTAS_API.zonasDeInmueble(inmuebleId), {
    metodo: 'PUT',
    body: { zonaComunIds },
  })
  if (!r.ok) return errorDeApi(r, 'No se pudieron asignar las zonas comunes.')
  refrescarAdmin()
  revalidatePath(`/admin/inmuebles/${inmuebleId}`)
  return exito('Zonas comunes actualizadas.')
}

export async function enviarRecordatorio(inmuebleId: number): Promise<EstadoAccion> {
  const r = await apiConSesion('admin', RUTAS_API.recordatorio(inmuebleId))
  if (!r.ok) return errorDeApi(r, 'No se pudo enviar el recordatorio.')
  revalidatePath('/admin')
  revalidatePath(`/admin/inmuebles/${inmuebleId}`)
  return exito('Recordatorio de pago enviado.')
}

/** Variante para el botón del plano, que envía el id dentro del formulario. */
export async function enviarRecordatorioForm(_previo: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  const inmuebleId = numero(datos, 'inmuebleId')
  if (!inmuebleId) return { estado: 'error', mensaje: 'No se identificó el inmueble.' }
  return enviarRecordatorio(inmuebleId)
}

export async function conciliarPago(inmuebleId: number, _previo: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  const monto = numero(datos, 'monto')
  const metodoPago = texto(datos, 'metodoPago')
  if (monto === undefined || !metodoPago) return { estado: 'error', mensaje: 'Indica el monto y el método de pago.' }
  const r = await apiConSesion('admin', RUTAS_API.conciliar(inmuebleId), {
    body: { monto, metodoPago, referencia: texto(datos, 'referencia') || null },
  })
  if (!r.ok) return errorDeApi(r, 'No se pudo conciliar el pago. El monto debe ser igual al saldo pendiente.')
  refrescarAdmin()
  revalidatePath(`/admin/inmuebles/${inmuebleId}`)
  return exito('Pago conciliado: el inmueble quedó al día.')
}

// ---------- Zonas comunes ----------

export async function crearZona(_previo: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  const nombreZonaComun = texto(datos, 'nombreZonaComun')
  const capacidad = numero(datos, 'capacidad')
  const horaInicio = texto(datos, 'horaInicio')
  const horaFin = texto(datos, 'horaFin')
  if (!nombreZonaComun || !capacidad || !horaInicio || !horaFin) {
    return { estado: 'error', mensaje: 'Completa el nombre, la capacidad y el horario.' }
  }
  const r = await apiConSesion('admin', RUTAS_API.zonasComunes, {
    body: {
      nombreZonaComun,
      capacidad,
      horaInicio,
      horaFin,
      aplicarATodosLosInmuebles: datos.get('aplicarATodosLosInmuebles') === 'on',
    },
  })
  if (!r.ok) return errorDeApi(r, 'No se pudo crear la zona común.')
  refrescarAdmin()
  return exito(`Zona ${nombreZonaComun} creada.`)
}

export async function alternarZona(id: number): Promise<EstadoAccion> {
  const r = await apiConSesion('admin', RUTAS_API.zonaEstado(id), { metodo: 'PATCH' })
  if (!r.ok) return errorDeApi(r, 'No se pudo cambiar el estado de la zona.')
  refrescarAdmin()
  return exito('Estado de la zona actualizado.')
}

// ---------- Reglas de reserva ----------

export async function crearRegla(_previo: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  const anticipacion = numero(datos, 'anticipacionMinimaHoras')
  const duracion = numero(datos, 'duracionMaximaHoras')
  const zonaComunIds = datos
    .getAll('zonaComunIds')
    .map((v) => Number(v))
    .filter((n) => Number.isSafeInteger(n) && n > 0)
  if (anticipacion === undefined || duracion === undefined || !zonaComunIds.length) {
    return { estado: 'error', mensaje: 'Completa los tiempos y elige al menos una zona.' }
  }
  const r = await apiConSesion('admin', RUTAS_API.reglas, {
    body: {
      anticipacionMinimaHoras: anticipacion,
      duracionMaximaHoras: duracion,
      horasAntelacionPenalidad: numero(datos, 'horasAntelacionPenalidad') ?? null,
      tarifaPenalidad: numero(datos, 'tarifaPenalidad') ?? null,
      zonaComunIds,
      observaciones: texto(datos, 'observaciones') || null,
    },
  })
  if (!r.ok) return errorDeApi(r, 'No se pudo crear la regla.')
  refrescarAdmin()
  return exito('Regla de reserva creada.')
}

export async function actualizarRegla(id: number, _previo: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  const anticipacion = numero(datos, 'anticipacionMinimaHoras')
  const duracion = numero(datos, 'duracionMaximaHoras')
  if (anticipacion === undefined || duracion === undefined) {
    return { estado: 'error', mensaje: 'Escribe los tiempos de anticipación y duración.' }
  }
  const r = await apiConSesion('admin', RUTAS_API.regla(id), {
    metodo: 'PUT',
    body: { anticipacionMinimaHoras: anticipacion, duracionMaximaHoras: duracion },
  })
  if (!r.ok) return errorDeApi(r, 'No se pudo actualizar la regla.')
  refrescarAdmin()
  return exito('Regla actualizada.')
}

export async function alternarRompimiento(id: number, aplicar: boolean): Promise<EstadoAccion> {
  const r = await apiConSesion(
    'admin',
    aplicar ? RUTAS_API.rompimientoAplicar(id) : RUTAS_API.rompimientoInactivar(id),
    { metodo: 'PATCH' },
  )
  if (!r.ok) return errorDeApi(r, 'No se pudo cambiar la asignación de la regla.')
  refrescarAdmin()
  return exito(aplicar ? 'Regla aplicada a la zona.' : 'Regla inactivada en la zona.')
}

// ---------- Notificaciones ----------

export async function enviarNotificacion(_previo: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  const mensaje = texto(datos, 'mensaje')
  if (!mensaje) return { estado: 'error', mensaje: 'Escribe el mensaje del comunicado.' }
  const usuarioIds = texto(datos, 'usuarioIds')
    .split(',')
    .map((v) => Number(v.trim()))
    .filter((n) => Number.isSafeInteger(n) && n > 0)
  const inmuebleId = numero(datos, 'inmuebleId')

  const r = await apiConSesion('admin', RUTAS_API.notificacionesAdmin, {
    body: {
      mensaje,
      tipoNotificacion: texto(datos, 'tipoNotificacion') || null,
      usuarioIds: usuarioIds.length ? usuarioIds : null,
      inmuebleId: inmuebleId ?? null,
    },
  })
  if (!r.ok) {
    // 409: ningún destinatario acepta ese tipo en sus preferencias (o la cuenta está inactiva).
    if (r.status === 409) {
      return {
        estado: 'error',
        mensaje:
          r.mensaje ||
          'Ningún destinatario acepta este tipo de notificación en sus preferencias. Prueba con otro tipo o con otros destinatarios.',
      }
    }
    return errorDeApi(r, 'No se pudo enviar el comunicado.')
  }
  revalidatePath('/admin/notificaciones')
  revalidatePath('/admin')
  return exito('Comunicado enviado.')
}

// ---------- Pagos y pasarela ----------

export async function anularPago(id: number): Promise<EstadoAccion> {
  const r = await apiConSesion('admin', RUTAS_API.pagoAnular(id))
  if (!r.ok) return errorDeApi(r, 'No se pudo anular el pago.')
  refrescarAdmin()
  return exito('Pago anulado.')
}

export async function reembolsarPago(id: number): Promise<EstadoAccion> {
  const r = await apiConSesion('admin', RUTAS_API.pagoReembolso(id))
  if (!r.ok) return errorDeApi(r, 'No se pudo reembolsar el pago.')
  refrescarAdmin()
  return exito('Pago reembolsado y liquidación reabierta.')
}

/** Por API solo se activa o desactiva: nombre, URLs y llaves viven en el .env del back. */
export async function guardarPasarela(_previo: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  const estado = texto(datos, 'estado')
  if (estado !== 'ACTIVA' && estado !== 'INACTIVA') {
    return { estado: 'error', mensaje: 'Elige si la pasarela queda activa o inactiva.' }
  }
  const r = await apiConSesion('admin', RUTAS_API.pasarela, { metodo: 'PUT', body: { estado } })
  if (!r.ok) return errorDeApi(r, 'No se pudo cambiar el estado de la pasarela.')
  revalidatePath('/admin/pagos')
  return exito(estado === 'ACTIVA' ? 'Pasarela activada.' : 'Pasarela desactivada.')
}

// ---------- Editar y eliminar (CRUD completo del diagrama de clases) ----------

export async function actualizarInmueble(id: number, _previo: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  const direccionInmueble = texto(datos, 'direccionInmueble').toUpperCase()
  if (!/^[A-Z0-9]+-\d+$/.test(direccionInmueble)) {
    return { estado: 'error', mensaje: 'La dirección debe tener el formato TORRE-APTO, por ejemplo A-302.' }
  }
  const r = await apiConSesion('admin', RUTAS_API.inmueble(id), {
    metodo: 'PUT',
    body: { direccionInmueble, isActive: datos.get('isActive') === 'on' },
  })
  if (!r.ok) return errorDeApi(r, 'No se pudo actualizar el inmueble.')
  refrescarAdmin()
  revalidatePath(`/admin/inmuebles/${id}`)
  return exito('Inmueble actualizado.')
}

/** Borra el inmueble con sus pagos, parqueadero y liquidaciones; sus residentes siguen existiendo. */
export async function eliminarInmueble(id: number): Promise<EstadoAccion> {
  const r = await apiConSesion('admin', RUTAS_API.inmueble(id), { metodo: 'DELETE' })
  if (!r.ok) return errorDeApi(r, 'No se pudo eliminar el inmueble.')
  refrescarAdmin()
  redirect('/admin/inmuebles')
}

export async function actualizarZona(id: number, _previo: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  const nombreZonaComun = texto(datos, 'nombreZonaComun')
  const capacidad = numero(datos, 'capacidad')
  const horaInicio = texto(datos, 'horaInicio')
  const horaFin = texto(datos, 'horaFin')
  if (!nombreZonaComun || !capacidad || !horaInicio || !horaFin) {
    return { estado: 'error', mensaje: 'Completa el nombre, la capacidad y el horario.' }
  }
  const r = await apiConSesion('admin', RUTAS_API.zona(id), {
    metodo: 'PUT',
    body: { nombreZonaComun, capacidad, horaInicio, horaFin },
  })
  if (!r.ok) return errorDeApi(r, 'No se pudo actualizar la zona común.')
  refrescarAdmin()
  return exito('Zona actualizada.')
}

export async function eliminarZona(id: number): Promise<EstadoAccion> {
  const r = await apiConSesion('admin', RUTAS_API.zona(id), { metodo: 'DELETE' })
  if (!r.ok) return errorDeApi(r, 'No se pudo eliminar la zona común.')
  refrescarAdmin()
  return exito('Zona eliminada.')
}

export async function eliminarRegla(id: number): Promise<EstadoAccion> {
  const r = await apiConSesion('admin', RUTAS_API.regla(id), { metodo: 'DELETE' })
  if (!r.ok) return errorDeApi(r, 'No se pudo eliminar la regla.')
  refrescarAdmin()
  return exito('Regla eliminada.')
}

export async function asignarZonaARegla(reglaId: number, _previo: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  const zonaComunId = numero(datos, 'zonaComunId')
  if (!zonaComunId) return { estado: 'error', mensaje: 'Elige la zona común.' }
  const r = await apiConSesion('admin', RUTAS_API.zonasDeRegla(reglaId), {
    body: { zonaComunId, observaciones: texto(datos, 'observaciones') || null },
  })
  if (!r.ok) return errorDeApi(r, 'No se pudo aplicar la regla a esa zona.')
  refrescarAdmin()
  return exito('Regla aplicada a la zona.')
}

export async function eliminarRompimiento(id: number): Promise<EstadoAccion> {
  const r = await apiConSesion('admin', RUTAS_API.rompimiento(id), { metodo: 'DELETE' })
  if (!r.ok) return errorDeApi(r, 'No se pudo quitar la regla de la zona.')
  refrescarAdmin()
  return exito('Regla quitada de la zona.')
}

export async function actualizarLiquidacion(id: number, _previo: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  const fechaLimite = texto(datos, 'fechaLimite')
  const cuota = numero(datos, 'cuotaAdministracion')
  const servicios = numero(datos, 'valorServiciosComunes')
  const multas = numero(datos, 'valorMultas')
  if (!fechaLimite || cuota === undefined || servicios === undefined || multas === undefined) {
    return { estado: 'error', mensaje: 'Completa la fecha límite y los tres valores.' }
  }
  const r = await apiConSesion('admin', RUTAS_API.liquidacion(id), {
    metodo: 'PUT',
    body: { fechaLimite, cuotaAdministracion: cuota, valorServiciosComunes: servicios, valorMultas: multas },
  })
  if (!r.ok) return errorDeApi(r, 'No se pudo actualizar la liquidación.')
  refrescarAdmin()
  return exito('Liquidación actualizada.')
}

export async function eliminarLiquidacion(id: number): Promise<EstadoAccion> {
  const r = await apiConSesion('admin', RUTAS_API.liquidacion(id), { metodo: 'DELETE' })
  if (!r.ok) return errorDeApi(r, 'No se pudo eliminar la liquidación.')
  refrescarAdmin()
  return exito('Liquidación eliminada.')
}

export async function eliminarNotificacion(id: number): Promise<EstadoAccion> {
  const r = await apiConSesion('admin', RUTAS_API.notificacionAdmin(id), { metodo: 'DELETE' })
  if (!r.ok) return errorDeApi(r, 'No se pudo eliminar la notificación.')
  revalidatePath('/admin/notificaciones')
  revalidatePath('/admin')
  return exito('Notificación eliminada.')
}

export async function crearParqueadero(_previo: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  const inmuebleId = numero(datos, 'inmuebleId')
  const valorMensual = numero(datos, 'valorMensual')
  if (!inmuebleId || valorMensual === undefined) {
    return { estado: 'error', mensaje: 'Elige el inmueble y escribe el valor mensual.' }
  }
  const r = await apiConSesion('admin', RUTAS_API.parqueaderos, { body: { inmuebleId, valorMensual } })
  if (!r.ok) return errorDeApi(r, 'No se pudo crear el parqueadero.')
  refrescarAdmin()
  return exito('Parqueadero creado.')
}

export async function actualizarParqueadero(id: number, _previo: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  const valorMensual = numero(datos, 'valorMensual')
  if (valorMensual === undefined) return { estado: 'error', mensaje: 'Escribe el valor mensual.' }
  const r = await apiConSesion('admin', RUTAS_API.parqueadero(id), { metodo: 'PUT', body: { valorMensual } })
  if (!r.ok) return errorDeApi(r, 'No se pudo actualizar el parqueadero.')
  refrescarAdmin()
  return exito('Parqueadero actualizado.')
}

export async function eliminarParqueadero(id: number): Promise<EstadoAccion> {
  const r = await apiConSesion('admin', RUTAS_API.parqueadero(id), { metodo: 'DELETE' })
  if (!r.ok) return errorDeApi(r, 'No se pudo eliminar el parqueadero.')
  refrescarAdmin()
  return exito('Parqueadero eliminado.')
}
