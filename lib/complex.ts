/**
 * Torres del Parque: 3 torres × 11 pisos × 6 apartamentos = 198 unidades.
 * El número de apartamento es piso × 100 + posición (302 = piso 3, apto 02).
 * Datos de ejemplo hasta conectar el backend.
 */

export type Torre = 'A' | 'B' | 'C'
export type Estado = 'al-dia' | 'por-vencer' | 'vencida'

export const TORRES: Torre[] = ['A', 'B', 'C']
export const PISOS = 11
export const APTOS_POR_PISO = 6
export const CUOTA = 485_000

export const ESTADO_TEXTO: Record<Estado, string> = {
  'al-dia': 'Al día',
  'por-vencer': 'Por vencer',
  vencida: 'Vencida',
}

export interface Unidad {
  torre: Torre
  piso: number
  apto: number
  estado: Estado
  residente?: string
  /** Lo que debe hoy. Una vencida debe octubre y noviembre. */
  debe: number
  /** Al día: último pago. Por vencer: vence. Vencida: venció. */
  fecha: string
}

const clave = (torre: Torre, apto: number) => `${torre}-${apto}`

/** Los apartamentos que no están al día este mes. Todos los demás pagaron. */
const PENDIENTES: Record<string, { residente: string; estado: Exclude<Estado, 'al-dia'> }> = {
  'A-201': { residente: 'Ana Torres', estado: 'por-vencer' },
  'A-302': { residente: 'Santiago Méndez', estado: 'por-vencer' },
  'A-1103': { residente: 'Sandra Quintero', estado: 'por-vencer' },
  'A-1002': { residente: 'Óscar Linares', estado: 'vencida' },
  'B-104': { residente: 'Felipe Cardona', estado: 'por-vencer' },
  'B-306': { residente: 'Daniela Ortiz', estado: 'por-vencer' },
  'B-602': { residente: 'Julián Vargas', estado: 'por-vencer' },
  'B-905': { residente: 'Natalia Bedoya', estado: 'por-vencer' },
  'B-403': { residente: 'Camila Restrepo', estado: 'vencida' },
  'C-205': { residente: 'Hernán Mejía', estado: 'por-vencer' },
  'C-704': { residente: 'Marcela Duarte', estado: 'por-vencer' },
  'C-1006': { residente: 'Iván Salcedo', estado: 'vencida' },
}

/** Pagos de hoy y de ayer que también aparecen en «Últimos pagos». */
const PAGOS_RECIENTES: Record<string, { residente: string; fecha: string }> = {
  'A-402': { residente: 'Laura Méndez', fecha: '8 de noviembre' },
  'B-803': { residente: 'Carlos Rojas', fecha: '8 de noviembre' },
  'C-504': { residente: 'Julián Castro', fecha: '7 de noviembre' },
}

function generarUnidades(): Unidad[] {
  const unidades: Unidad[] = []
  TORRES.forEach((torre, indiceTorre) => {
    for (let piso = PISOS; piso >= 1; piso--) {
      for (let n = 1; n <= APTOS_POR_PISO; n++) {
        const apto = piso * 100 + n
        const id = clave(torre, apto)
        const pendiente = PENDIENTES[id]
        if (pendiente?.estado === 'por-vencer') {
          unidades.push({ torre, piso, apto, estado: 'por-vencer', residente: pendiente.residente, debe: CUOTA, fecha: '10 de noviembre' })
        } else if (pendiente?.estado === 'vencida') {
          unidades.push({ torre, piso, apto, estado: 'vencida', residente: pendiente.residente, debe: CUOTA * 2, fecha: '10 de octubre' })
        } else {
          const reciente = PAGOS_RECIENTES[id]
          const dia = 1 + ((apto * 7 + indiceTorre * 3) % 8)
          unidades.push({
            torre,
            piso,
            apto,
            estado: 'al-dia',
            residente: reciente?.residente,
            debe: 0,
            fecha: reciente?.fecha ?? `${dia} de noviembre`,
          })
        }
      }
    }
  })
  return unidades
}

export const UNIDADES: Unidad[] = generarUnidades()

export const TOTALES: Record<Estado, number> = {
  'al-dia': UNIDADES.filter((u) => u.estado === 'al-dia').length,
  'por-vencer': UNIDADES.filter((u) => u.estado === 'por-vencer').length,
  vencida: UNIDADES.filter((u) => u.estado === 'vencida').length,
}

export const TOTAL_UNIDADES = UNIDADES.length
export const POR_COBRAR = UNIDADES.reduce((suma, u) => suma + u.debe, 0)
export const RECAUDO_MES = TOTALES['al-dia'] * CUOTA

/** $ 485.000: puntos de mil y espacio duro, como se escribe en Colombia. */
export function cop(valor: number) {
  return '$ ' + String(valor).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

/** $ 90,2 M: para cifras grandes. */
export function copMillones(valor: number) {
  return '$ ' + (valor / 1_000_000).toFixed(1).replace('.', ',') + ' M'
}
