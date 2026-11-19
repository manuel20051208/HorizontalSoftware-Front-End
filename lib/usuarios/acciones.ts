'use server'

import { revalidatePath } from 'next/cache'
import { llamarApi, type Resultado } from '@/lib/auth/api'
import { RUTAS_API } from '@/lib/auth/config'
import { apiConSesion, requerirSesion } from '@/lib/auth/sesion'
import { esTipoCuenta, hoyBogota, type TipoCuenta, type Usuario } from './tipos'

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

  // El backend crea la cuenta inactiva y envía un código de 4 cifras a su correo. La administración
  // la activa desde la tarjeta de éxito con ese código (activarConCodigo); la contraseña se queda en
  // el estado del formulario hasta entonces.
  const activa = r.datos?.active === true

  revalidatePath('/admin/usuarios')
  return {
    estado: 'creada',
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
    return { error: 'No se pudo cambiar. Intenta de nuevo.' }
  }
  revalidatePath('/admin/usuarios')
  return undefined
}

export type EstadoActivacion =
  | { estado: 'activa'; mensaje: string }
  | { estado: 'error'; mensaje: string }
  | { estado: 'reenviado'; mensaje: string }
  | undefined

const SIN_CONEXION = 'No pudimos conectar con el servidor. Intenta de nuevo en un momento.'

/**
 * Solo administración: activa la cuenta recién creada con el código de 4 cifras que el back envió al
 * correo del usuario. Llama al endpoint público /api/auth/activar con el correo y la contraseña que el
 * admin escribió al crearla. Los errores del back se muestran tal cual (intentos restantes, código
 * vencido, plazo vencido): por eso no pasa por errorDeApi, cuyo 401 diría «tu sesión venció».
 */
export async function activarConCodigo(_previo: EstadoActivacion, datos: FormData): Promise<EstadoActivacion> {
  await requerirSesion('admin')
  const correo = String(datos.get('correo') ?? '').trim()
  const contrasena = String(datos.get('contrasena') ?? '')
  const codigo = String(datos.get('codigo') ?? '').trim()
  if (!correo || !contrasena) return { estado: 'error', mensaje: 'Faltan el correo o la contraseña de la cuenta.' }
  if (!/^[0-9]{4}$/.test(codigo)) return { estado: 'error', mensaje: 'El código tiene 4 cifras.' }

  const r = await llamarApi<{ active: boolean; mensaje?: string }>(RUTAS_API.activar, {
    body: { correo, contrasena, codigo },
  })
  if (!r.ok) {
    if (r.status === 0) return { estado: 'error', mensaje: SIN_CONEXION }
    return { estado: 'error', mensaje: r.mensaje || 'No se pudo activar la cuenta.' }
  }
  revalidatePath('/admin/usuarios')
  return { estado: 'activa', mensaje: 'La cuenta quedó activa: ya puede ingresar.' }
}

/** Solo administración: pide un código nuevo para la cuenta (reemplaza al anterior y reinicia los intentos). */
export async function reenviarCodigo(_previo: EstadoActivacion, datos: FormData): Promise<EstadoActivacion> {
  await requerirSesion('admin')
  const correo = String(datos.get('correo') ?? '').trim()
  if (!correo) return { estado: 'error', mensaje: 'Falta el correo de la cuenta.' }
  const r = await llamarApi<{ mensaje: string }>(RUTAS_API.reenviarCodigo, { body: { correo } })
  if (!r.ok) {
    if (r.status === 0) return { estado: 'error', mensaje: SIN_CONEXION }
    return { estado: 'error', mensaje: r.mensaje || 'No se pudo reenviar el código.' }
  }
  return { estado: 'reenviado', mensaje: `Se envió un código nuevo a ${correo}. El anterior ya no sirve.` }
}
