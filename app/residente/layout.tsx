import { AppShell } from '@/components/shell/app-shell'
import { SelectorApartamento } from '@/components/shell/selector-apartamento'
import { inmuebleElegido, inmueblesDelResidente, requerirSesion } from '@/lib/auth/sesion'

// Barra superior y contenedor comunes a todas las pantallas de /residente/*. Con varios apartamentos, arriba va
// el selector: todo lo de abajo (cuenta, pagos, reservas, invitados, auto) es del apartamento elegido.
export default async function ResidenteLayout({ children }: { children: React.ReactNode }) {
  const { nombre } = await requerirSesion('residente')
  const [inmuebles, elegido] = await Promise.all([inmueblesDelResidente(), inmuebleElegido()])

  return (
    <AppShell modulo="residente" usuario={{ nombre, rol: 'Residente' }} menu="residente">
      {inmuebles.length > 1 && elegido && <SelectorApartamento key={elegido.id} inmuebles={inmuebles} elegido={elegido.id} />}
      {children}
    </AppShell>
  )
}
