import { useSyncExternalStore } from 'react'

const sinSuscripcion = () => () => {}

function fechaDeHoy() {
  const texto = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
    .format(new Date())
    .replace(',', '')
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

/**
 * «Domingo 8 de noviembre». Vacío en el servidor y real en el navegador, así el
 * HTML prerenderizado nunca queda con un día viejo ni hay desajuste al hidratar.
 */
export function useHoy() {
  return useSyncExternalStore(sinSuscripcion, fechaDeHoy, () => '')
}
