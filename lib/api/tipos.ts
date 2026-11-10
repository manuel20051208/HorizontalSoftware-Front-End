import type { Usuario } from '@/lib/usuarios/tipos'

/**
 * Tipos de las respuestas del backend (ENDPOINTS.md).
 * Las fechas viajan como texto: yyyy-MM-dd, las horas como HH:mm[:ss] y
 * los instantes como yyyy-MM-ddTHH:mm:ss.
 */

// ---------- Inmuebles ----------

export type EstadoCartera = 'AL_DIA' | 'POR_VENCER' | 'VENCIDA' | 'SIN_LIQUIDACION'

export const ESTADO_CARTERA_TEXTO: Record<EstadoCartera, string> = {
  AL_DIA: 'Al día',
  POR_VENCER: 'Por vencer',
  VENCIDA: 'Vencida',
  SIN_LIQUIDACION: 'Sin liquidación',
}

export type InmuebleResumen = {
  id: number
  direccionInmueble: string
  isActive: boolean | null
  estadoPago: EstadoCartera
  saldoPendiente: number
  fechaLimitePendiente: string | null
  valorParqueadero: number | null
  totalLiquidaciones: number
}

export type InmuebleDetalle = InmuebleResumen & {
  nombresUsuarios: string[]
  usuarios: Usuario[]
  zonasComunes: Zona[]
  liquidacionVigente: Liquidacion | null
}

export type ResumenAdmin = {
  periodo: string
  totalInmuebles: number
  alDia: number
  porVencer: number
  vencidas: number
  sinLiquidacion: number
  porCobrar: number
  recaudoMes: number
}

export type EstadoCuenta = {
  inmuebleId: number
  direccionInmueble: string
  estadoPago: EstadoCartera
  saldoPendiente: number
  pazYSalvo: boolean
  liquidacionVigente: Liquidacion | null
}

// ---------- Liquidaciones ----------

export type EstadoLiquidacion = 'PENDIENTE' | 'AL_DIA' | 'EN_MORA'

export const ESTADO_LIQUIDACION_TEXTO: Record<EstadoLiquidacion, string> = {
  PENDIENTE: 'Pendiente',
  AL_DIA: 'Al día',
  EN_MORA: 'En mora',
}

export type Liquidacion = {
  id: number
  inmuebleId: number
  direccionInmueble: string
  periodo: string
  fechaGeneracion: string
  fechaLimite: string
  cuotaAdministracion: number
  valorServiciosComunes: number
  valorMultas: number
  total: number
  estado: EstadoLiquidacion
  vencida: boolean
}

export type LiquidacionOmitida = { inmuebleId: number; motivo: string }
export type ResultadoMasiva = { generadas: number; omitidas: LiquidacionOmitida[] }

// ---------- Zonas y reglas ----------

export type Zona = {
  id: number
  nombreZonaComun: string
  capacidad: number
  horaInicio: string
  horaFin: string
  isActive: boolean | null
  reservasActuales: number
}

export type Rompimiento = {
  id: number
  zonaComunId: number
  nombreZonaComun: string
  reglaReservaId: number
  fechaAplicacion: string
  activa: boolean
  observaciones: string | null
}

export type Regla = {
  id: number
  anticipacionMinimaHoras: number
  duracionMaximaHoras: number
  horasAntelacionPenalidad: number | null
  tarifaPenalidad: number | null
  adminId: number
  zonas: Rompimiento[]
}

// ---------- Notificaciones ----------

export type Notificacion = {
  id: number
  mensaje: string
  tipoNotificacion: string
  fechaEnvio: string
}

export type Destinatario = { usuarioId: number; nombreCompleto: string }
export type LecturaNotificacion = {
  notificacionId: number
  leidos: Destinatario[]
  pendientes: Destinatario[]
}

// ---------- Pagos y pasarela ----------

export type EstadoTransaccion = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'ANULADO' | 'REEMBOLSADO'

export const ESTADO_TRANSACCION_TEXTO: Record<EstadoTransaccion, string> = {
  PENDIENTE: 'Pendiente',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
  ANULADO: 'Anulado',
  REEMBOLSADO: 'Reembolsado',
}

export type Pago = {
  id: number
  inmuebleId: number
  direccionInmueble: string
  monto: number
  fechaPago: string
  concepto: string
  metodoPago: string
  estado: EstadoTransaccion
  referencia: string
}

export type IniciarPago = { pago: Pago; urlCheckout: string }

export type Pasarela = {
  id: number
  nombrePasarela: string
  urlApi: string
  apiKey: string
  estado: 'ACTIVA' | 'INACTIVA'
}

export type Comprobante = { referencia: string; comprobante: string }
export type EstadoPago = { referencia: string; estado: EstadoTransaccion }

// ---------- Invitados y autos ----------

export type Invitado = {
  id: number
  identificacion: number
  nombreCompleto: string
  correoElectronico: string | null
  active: boolean | null
  venceAutorizacion: string | null
  vigente: boolean
}

export type Anfitrion = {
  id: number
  identificacion: number
  nombreCompleto: string
  inmuebleId: number
  direccionInmueble: string
}

export type Auto = {
  id: number
  duenoId: number
  nombreDueno: string
  placa: number
  parqueaderoId: number | null
  inmuebleId: number
  direccionInmueble: string
}

export type Dueno = Anfitrion
export type Duenos = { autoId: number; inmuebleId: number; duenos: Dueno[] }

// ---------- Reservas ----------

export type Reserva = {
  id: number
  zonaComunId: number
  nombreZonaComun: string
  horaInicio: string
  horaFin: string
  enCurso: boolean
  duenoReservaId: number
  nombreDueno: string
  inmuebleId: number
  direccionInmueble: string
}

export type Disponibilidad = {
  zonaComunId: number
  hora: string
  horarioValido: boolean
  disponible: boolean
  habilitado: boolean
  mensaje: string
}

// ---------- Vigilante ----------

export type ZonaPermitida = {
  zonaComunId: number
  nombreZonaComun: string
  horaInicio: string
  horaFin: string
}

export type Acceso = {
  identificacion: number
  nombreCompleto: string
  permitido: boolean
  motivo: string
  zonasPermitidas: ZonaPermitida[]
}

export type InvitadoConsulta = {
  existe: boolean
  vigente: boolean
  invitado: Invitado | null
}

export type Ingreso = {
  permitido: boolean
  mensaje: string
  visitante: string
  inmueblesNotificados: string[]
}

// ---------- Cuenta ----------

export type Activacion = { active: boolean; mensaje: string }
export type EstadoActivo = { id: number; nombreCompleto: string; active: boolean }

// ---------- Formularios ----------

export type CrearInmueble = { direccionInmueble: string; valorParqueadero?: number | null }
export type Tarifas = {
  cuotaAdministracion: number
  valorServiciosComunes: number
  valorParqueadero?: number | null
}
export type CrearZona = {
  nombreZonaComun: string
  capacidad: number
  horaInicio: string
  horaFin: string
  aplicarATodosLosInmuebles?: boolean
}
export type CrearRegla = {
  anticipacionMinimaHoras: number
  duracionMaximaHoras: number
  horasAntelacionPenalidad?: number | null
  tarifaPenalidad?: number | null
  zonaComunIds: number[]
  observaciones?: string | null
}
export type EnviarNotificacion = {
  mensaje: string
  tipoNotificacion?: string
  usuarioIds?: number[]
  inmuebleId?: number | null
}
export type CrearInvitado = {
  identificacion: number
  nombreCompleto: string
  fechaNacimiento?: string | null
  correoElectronico?: string | null
  venceAutorizacion?: string | null
}
export type RegistrarAuto = { placa: number; parqueaderoId?: number | null }
export type GenerarLiquidacion = {
  inmuebleId: number
  periodo: string
  fechaLimite?: string | null
  cuotaAdministracion?: number | null
  valorServiciosComunes?: number | null
}
export type ConciliarPago = { monto: number; metodoPago: string; referencia?: string | null }
/** Solo el estado: nombre, URLs y llaves de la pasarela se configuran en el .env del back. */
export type ConfigurarPasarela = {
  estado: 'ACTIVA' | 'INACTIVA'
}
