import type { Resultado } from '@/lib/auth/api'

/**
 * Listados del backend. El contrato nuevo pagina todos los GET de listas:
 *   petición  ?pagina=0&tamano=20   (pagina desde 0; tamano de 1 a 100, por defecto 20)
 *   respuesta { contenido, pagina, tamano, totalElementos, totalPaginas }
 * El backend desplegado todavía responde la lista completa (T[]), así que aquí se aceptan
 * las dos formas: nada en las pantallas depende de cuál llegue.
 *
 * En la URL del front la página va como ?pagina=N desde 1, para que se lea bien.
 */

/** Respuesta paginada del backend (`Pagina<T>` en el back). */
export type PaginaApi<T> = {
  contenido: T[]
  pagina: number
  tamano: number
  totalElementos: number
  totalPaginas: number
}

/** Lo que responde un GET de lista: la página nueva o la lista completa de antes. */
export type Listado<T> = T[] | PaginaApi<T>

/** Máximo de filas que el backend entrega por página. */
export const TAMANO_MAXIMO = 100

export type Pagina<T> = {
  items: T[]
  /** Página actual, desde 1. */
  pagina: number
  totalPaginas: number
  total: number
}

function esPaginaApi<T>(datos: unknown): datos is PaginaApi<T> {
  return (
    typeof datos === 'object' &&
    datos !== null &&
    Array.isArray((datos as PaginaApi<T>).contenido) &&
    typeof (datos as PaginaApi<T>).totalElementos === 'number'
  )
}

/** Lee ?pagina= de la URL: un entero desde 1; cualquier otra cosa es la página 1. */
export function paginaDeUrl(valor: string | string[] | undefined): number {
  const n = Number(Array.isArray(valor) ? valor[0] : valor)
  return Number.isInteger(n) && n >= 1 ? n : 1
}

/** Parámetros para pedirle una página al backend (pagina desde 0, tamano). */
export function consultaPagina(pagina: number, tamano: number) {
  return new URLSearchParams({ pagina: String(pagina - 1), tamano: String(Math.min(tamano, TAMANO_MAXIMO)) })
}

/**
 * Ruta de un listado que la pantalla muestra entero (selectores, tablas sin paginar): pide la
 * página más grande para que el tamaño por defecto (20) no recorte la lista sin avisar.
 */
export function listado(ruta: string, tamano = TAMANO_MAXIMO) {
  const [base, query = ''] = ruta.split('?')
  const params = new URLSearchParams(query)
  params.set('pagina', '0')
  params.set('tamano', String(Math.min(tamano, TAMANO_MAXIMO)))
  return `${base}?${params}`
}

/** Las filas de un listado (siempre un arreglo nuevo, se puede ordenar sin tocar el original). */
export function listaDe<T>(r: Resultado<Listado<T>> | null | undefined): T[] {
  if (!r?.ok) return []
  if (esPaginaApi<T>(r.datos)) return [...r.datos.contenido]
  return Array.isArray(r.datos) ? [...r.datos] : []
}

/** Cuántas filas cumplen el filtro en todas las páginas (no solo las que llegaron). */
export function totalDe<T>(r: Resultado<Listado<T>> | null | undefined): number {
  if (!r?.ok) return 0
  if (esPaginaApi<T>(r.datos)) return r.datos.totalElementos
  return Array.isArray(r.datos) ? r.datos.length : 0
}

/**
 * Una página para mostrar. Si el backend ya pagina, se usa tal cual (su orden manda); si
 * responde la lista completa, se ordena y se corta aquí.
 */
export function leerPagina<T>(
  r: Resultado<Listado<T>> | null | undefined,
  pagina: number,
  tamano: number,
  ordenar?: (a: T, b: T) => number,
): Pagina<T> {
  if (r?.ok && esPaginaApi<T>(r.datos)) {
    return {
      items: r.datos.contenido,
      pagina: r.datos.pagina + 1,
      totalPaginas: Math.max(1, r.datos.totalPaginas),
      total: r.datos.totalElementos,
    }
  }

  const lista = listaDe(r)
  if (ordenar) lista.sort(ordenar)
  const totalPaginas = Math.max(1, Math.ceil(lista.length / tamano))
  const actual = Math.min(pagina, totalPaginas)
  return {
    items: lista.slice((actual - 1) * tamano, actual * tamano),
    pagina: actual,
    totalPaginas,
    total: lista.length,
  }
}
