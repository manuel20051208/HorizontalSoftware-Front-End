/** Datos del access token (JWT HS256 que emite JwtTokenService en el backend). */
export type Identidad = {
  id: string
  rol: string
  nombre: string
  exp: number
}

/**
 * Lee el access token sin verificar la firma: sirve para decidir a qué pantalla mandar
 * a la persona y para mostrar su nombre. La verificación real la hace el backend en cada
 * petición al API, que es donde están los datos.
 */
export function leerToken(token: string | undefined): Identidad | null {
  if (!token) return null
  const partes = token.split('.')
  if (partes.length !== 3) return null

  try {
    const datos = JSON.parse(Buffer.from(partes[1], 'base64url').toString('utf8'))
    if (datos.tipo_token !== 'access') return null
    if (typeof datos.exp !== 'number' || datos.exp * 1000 <= Date.now()) return null
    if (typeof datos.rol !== 'string') return null
    return { id: String(datos.sub), rol: datos.rol, nombre: String(datos.nombre ?? ''), exp: datos.exp }
  } catch {
    return null
  }
}
