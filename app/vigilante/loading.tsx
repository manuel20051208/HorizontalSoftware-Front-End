import { Cargando } from '@/components/shell/cargando'

export default function Loading() {
  return <Cargando volver={false} bloques={['formulario', 'formulario', 'tabla']} />
}
