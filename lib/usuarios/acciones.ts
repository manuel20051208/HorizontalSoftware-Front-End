'use server'

import { revalidatePath } from 'next/cache'
import type { Resultado } from '@/lib/auth/api'
import { RUTAS_API } from '@/lib/auth/config'
import { apiConSesion } from '@/lib/auth/sesion'
import { esTipoCuenta, hoyBogota, type RelacionInmueble, type TipoCuenta, type Usuario } from './tipos'

export type CampoCuenta =
  | 'tipoUsuario'
  | 'nombreCompleto'
  | 'identificacion'
  | 'correoElectronico'
  | 'fechaNacimiento'
  | 'inmuebleId'
  | 'inicioContrato'
  | 'venceContrato'
  | 'contrasena'

const CAMPOS: CampoCuenta[] = [
  'tipoUsuario',
  'nombreCompleto',
  'identificacion',
  'correoElectronico',
  'fechaNacimiento',
  'inmuebleId',
  'inicioContrato',
  'venceContrato',
  'contrasena',
]

export type EstadoCrear =
  | {
      estado: 'error'
      mensaje?: string
      errores: Partial<Record<CampoCuenta, string>>
      valores: Partial<Record<CampoCuenta, string>>
    }
  | {
      estado: 'creada'
      identificacion: number
      nombre: string
      correo: string
      contrasena: string
      tipo: TipoCuenta
      activa: boolean
    }
  | undefined

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Las mismas reglas del backend (UsuarioFactory, PoliticaContrasena), para avisar antes de enviar. */
function validar(v: Partial<Record<CampoCuenta, string>>) {
  const e: Partial<Record<CampoCuenta, string>> = {}
  const hoy = hoyBogota()

  if (!esTipoCuenta(v.tipoUsuario)) e.tipoUsuario = 'Elige el tipo de cuenta.'
  if (!v.nombreCompleto) e.nombreCompleto = 'Escribe el nombre completo.'
  else if (v.nombreCompleto.length > 150) e.nombreCompleto = 'Máximo 150 caracteres.'
  if (!v.identificacion) e.identificacion = 'Escribe el número de documento.'
  else if (!/^\d{1,15}$/.test(v.identificacion) || Number(v.identificacion) <= 0)
    e.identificacion = 'Solo números, sin puntos ni espacios.'
  if (!v.correoElectronico) e.correoElectronico = 'Escribe el correo.'
  else if (!CORREO.test(v.correoElectronico)) e.correoElectronico = 'Revisa el correo: falta algo, como la @.'
  if (v.fechaNacimiento && v.fechaNacimiento >= hoy) e.fechaNacimiento = 'Debe ser una fecha pasada.'

  if (v.tipoUsuario === 'RESIDENTE') {
    if (!v.inmuebleId) e.inmuebleId = 'Elige el apartamento.'
  } else if (esTipoCuenta(v.tipoUsuario)) {
    if (!v.inicioContrato) e.inicioContrato = 'Escribe la fecha de inicio.'
    if (!v.venceContrato) e.venceContrato = 'Escribe la fecha de vencimiento.'
    else if (v.inicioContrato && v.venceContrato < v.inicioContrato)
      e.venceContrato = 'No puede ser antes del inicio.'
  }

  const c = v.contrasena ?? ''
  if (c.length < 8) e.contrasena = 'Mínimo 8 caracteres.'
  else if (!/\p{L}/u.test(c) || !/\d/.test(c)) e.contrasena = 'Debe tener al menos una letra y un número.'
  return e
}

/** Ubica el error del backend en su campo; lo que no tiene campo va arriba del formulario. */
function errorDelBackend(r: Extract<Resultado<unknown>, { ok: false }>) {
  const errores: Partial<Record<CampoCuenta, string>> = {}
  const m = r.mensaje.toLowerCase()

  if (r.status === 0) return { errores, mensaje: 'No pudimos conectar con el servidor. Intenta de nuevo en un momento.' }
  if (r.status === 403) return { errores, mensaje: 'Tu cuenta no tiene permiso para crear usuarios.' }

  if (r.errores) {
    for (const [campo, texto] of Object.entries(r.errores)) {
      if ((CAMPOS as string[]).includes(campo)) errores[campo as CampoCuenta] = texto
    }
  }
  if (r.status === 409 && m.includes('correo')) errores.correoElectronico = 'Ya existe una cuenta con ese correo.'
  else if (r.status === 409 && m.includes('identificacion')) errores.identificacion = 'Ya existe una cuenta con ese documento.'
  else if (m.includes('contrasena')) errores.contrasena = 'Debe tener mínimo 8 caracteres, con letras y números.'
  else if (m.includes('inmueble')) errores.inmuebleId = 'Ese apartamento no existe. Recarga la página.'
  else if (m.includes('vencecontrato')) errores.venceContrato = 'No puede ser antes del inicio.'

  if (Object.keys(errores).length) return { errores, mensaje: undefined }
  return { errores, mensaje: 'No se pudo crear la cuenta. Revisa los datos e intenta de nuevo.' }
}

export async function crearCuenta(_previo: EstadoCrear, datos: FormData): Promise<EstadoCrear> {
  const valores: Partial<Record<CampoCuenta, string>> = {}
  for (const campo of CAMPOS) valores[campo] = String(datos.get(campo) ?? '').trim()

  const errores = validar(valores)
  if (Object.keys(errores).length) return { estado: 'error', errores, valores }

  const tipo = valores.tipoUsuario as TipoCuenta
  const esResidente = tipo === 'RESIDENTE'
  const r = await apiConSesion<Usuario>('admin', RUTAS_API.usuarios, {
    body: {
      tipoUsuario: tipo,
      identificacion: Number(valores.identificacion),
      nombreCompleto: valores.nombreCompleto,
      fechaNacimiento: valores.fechaNacimiento || null,
      correoElectronico: valores.correoElectronico,
      contrasena: valores.contrasena,
      inmuebleId: esResidente ? Number(valores.inmuebleId) : null,
      inicioContrato: esResidente ? null : valores.inicioContrato,
      venceContrato: esResidente ? null : valores.venceContrato,
    },
  })
  if (!r.ok) return { estado: 'error', ...errorDelBackend(r), valores }

  // El backend crea la cuenta inactiva y envía un código de 4 cifras al correo. La cuenta solo se activa
  // cuando la administración confirma ese código (verificarCorreo), desde la tarjeta de éxito o la lista.
  const activa = r.datos?.active === true

  revalidatePath('/admin/usuarios')
  return {
    estado: 'creada',
    identificacion: Number(valores.identificacion),
    nombre: valores.nombreCompleto!,
    correo: valores.correoElectronico!.toLowerCase(),
    contrasena: valores.contrasena!,
    tipo,
    activa,
  }
}

export type EstadoActivo = { error: string } | undefined

/** Activa o desactiva la cuenta (el backend alterna el estado). Desactivar cierra su sesión. */
export async function alternarActivo(identificacion: number, _previo: EstadoActivo): Promise<EstadoActivo> {
  const r = await apiConSesion('admin', RUTAS_API.activo(identificacion), { metodo: 'PATCH' })
  if (!r.ok) {
    if (r.status === 0) return { error: 'Sin conexión con el servidor.' }
    if (r.status === 403) return { error: 'Esta cuenta no se puede cambiar desde aquí.' }
    // 409: correo sin verificar o residente sin apartamento («Primero relacione la cuenta con un inmueble»)
    if (r.status === 409) return { error: r.mensaje || 'Primero verifica el correo con el código que le llegó.' }
    return { error: 'No se pudo cambiar. Intenta de nuevo.' }
  }
  revalidatePath('/admin/usuarios')
  return undefined
}

export type EstadoVerificacion =
  | { estado: 'verificada'; mensaje: string }
  | { estado: 'error'; mensaje: string }
  | { estado: 'reenviado'; mensaje: string }
  | undefined

const SIN_CONEXION = 'No pudimos conectar con el servidor. Intenta de nuevo en un momento.'

/**
 * Confirma el código de 4 cifras que llegó al correo del usuario (se lo dicta a la administración). Con el
 * código correcto el correo queda verificado y la cuenta activa. Los mensajes del back se muestran tal cual:
 * intentos que quedan, código vencido o agotado.
 */
export async function verificarCorreo(
  identificacion: number,
  _previo: EstadoVerificacion,
  datos: FormData,
): Promise<EstadoVerificacion> {
  const codigo = String(datos.get('codigo') ?? '').trim()
  if (!/^[0-9]{4}$/.test(codigo)) return { estado: 'error', mensaje: 'El código tiene 4 cifras.' }

  const r = await apiConSesion<Usuario>('admin', RUTAS_API.verificarCorreo(identificacion), { body: { codigo } })
  if (!r.ok) {
    if (r.status === 0) return { estado: 'error', mensaje: SIN_CONEXION }
    if (r.status === 403) return { estado: 'error', mensaje: 'Esta cuenta no tiene correo que verificar.' }
    return { estado: 'error', mensaje: r.errores?.codigo ?? (r.mensaje || 'No se pudo verificar el correo.') }
  }
  revalidatePath('/admin/usuarios')
  return { estado: 'verificada', mensaje: 'Correo verificado: la cuenta quedó activa y ya puede ingresar.' }
}

/** Envía un código nuevo al correo de la cuenta; reemplaza al anterior y reinicia los intentos. */
export async function reenviarCodigo(identificacion: number, _previo: EstadoVerificacion): Promise<EstadoVerificacion> {
  const r = await apiConSesion<{ mensaje: string }>('admin', RUTAS_API.reenviarCodigo(identificacion), {})
  if (!r.ok) {
    if (r.status === 0) return { estado: 'error', mensaje: SIN_CONEXION }
    if (r.status === 403) return { estado: 'error', mensaje: 'Esta cuenta no tiene correo que verificar.' }
    return { estado: 'error', mensaje: r.mensaje || 'No se pudo reenviar el código.' }
  }
  return { estado: 'reenviado', mensaje: 'Se envió un código nuevo. El anterior ya no sirve.' }
}

// ---------- Relación de un residente con su inmueble ----------

export type EstadoRelacion = { estado: 'ok'; mensaje: string } | { estado: 'error'; mensaje: string } | undefined

/** La lista de usuarios y el detalle de cada inmueble muestran la relación: se refrescan los dos. */
function refrescarRelacion() {
  revalidatePath('/admin/usuarios')
  revalidatePath('/admin/inmuebles')
  revalidatePath('/admin/inmuebles/[id]', 'page')
}

/** 404, 403 y 409 traen el motivo exacto del back (ya tiene inmueble, inmueble inactivo, mismo inmueble...). */
function errorRelacion(r: Extract<Resultado<unknown>, { ok: false }>, porDefecto: string): EstadoRelacion {
  if (r.status === 0) return { estado: 'error', mensaje: SIN_CONEXION }
  if (r.status === 400) return { estado: 'error', mensaje: r.errores?.inmuebleId ?? (r.mensaje || 'Elige un apartamento.') }
  return { estado: 'error', mensaje: r.mensaje || porDefecto }
}

function idDe(datos: FormData, campo: string) {
  const n = Number(String(datos.get(campo) ?? '').trim())
  return Number.isSafeInteger(n) && n > 0 ? n : undefined
}

async function relacionar(
  identificacion: number,
  inmuebleId: number,
  metodo: 'POST' | 'PUT',
): Promise<EstadoRelacion> {
  const r = await apiConSesion<RelacionInmueble>('admin', RUTAS_API.relacionInmueble(identificacion), {
    metodo,
    body: { inmuebleId },
  })
  if (!r.ok) return errorRelacion(r, 'No se pudo guardar el apartamento. Intenta de nuevo.')
  refrescarRelacion()
  const nombre = r.datos?.nombreCompleto ?? 'La cuenta'
  const apto = r.datos?.direccionInmueble ?? 'el apartamento elegido'
  return { estado: 'ok', mensaje: `${nombre} quedó en ${apto}.` }
}

/** POST: asigna un apartamento a un residente que no tiene. No activa la cuenta. */
export async function vincularInmueble(
  identificacion: number,
  _previo: EstadoRelacion,
  datos: FormData,
): Promise<EstadoRelacion> {
  const inmuebleId = idDe(datos, 'inmuebleId')
  if (!inmuebleId) return { estado: 'error', mensaje: 'Elige el apartamento.' }
  return relacionar(identificacion, inmuebleId, 'POST')
}

/** POST desde el detalle del inmueble: el apartamento ya está fijo y se elige al residente. */
export async function agregarResidente(
  inmuebleId: number,
  _previo: EstadoRelacion,
  datos: FormData,
): Promise<EstadoRelacion> {
  const identificacion = idDe(datos, 'identificacion')
  if (!identificacion) return { estado: 'error', mensaje: 'Elige al residente.' }
  return relacionar(identificacion, inmuebleId, 'POST')
}

/**
 * PUT: muda al residente a otro apartamento. El back muda con él a sus invitados exclusivos, libera el
 * parqueadero de su auto y cancela sus reservas futuras de zonas que el apartamento nuevo no tiene.
 */
export async function cambiarInmueble(
  identificacion: number,
  _previo: EstadoRelacion,
  datos: FormData,
): Promise<EstadoRelacion> {
  const inmuebleId = idDe(datos, 'inmuebleId')
  if (!inmuebleId) return { estado: 'error', mensaje: 'Elige el apartamento nuevo.' }
  return relacionar(identificacion, inmuebleId, 'PUT')
}

/**
 * DELETE: quita al residente de su apartamento. La cuenta queda inactiva y sin sesión, sus invitados
 * exclusivos se desactivan, se libera el parqueadero y se cancelan sus reservas futuras.
 */
export async function desvincularInmueble(identificacion: number, _previo: EstadoRelacion): Promise<EstadoRelacion> {
  const r = await apiConSesion('admin', RUTAS_API.relacionInmueble(identificacion), { metodo: 'DELETE' })
  if (!r.ok) return errorRelacion(r, 'No se pudo quitar del apartamento. Intenta de nuevo.')
  refrescarRelacion()
  return { estado: 'ok', mensaje: 'Quedó sin apartamento y su cuenta inactiva.' }
}
