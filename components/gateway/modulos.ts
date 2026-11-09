import { ClipboardList, KeyRound, ShieldCheck } from 'lucide-react'
import { MODULOS, type Modulo } from '@/lib/auth/config'

/** Lo que la portada y el formulario de ingreso muestran de cada módulo. */
export const MODULOS_UI = {
  admin: {
    nombre: MODULOS.admin.nombre,
    descripcion: 'Cobra la administración, publica comunicados y autoriza usuarios.',
    icono: ClipboardList,
  },
  residente: {
    nombre: MODULOS.residente.nombre,
    descripcion: 'Paga la administración, reserva zonas comunes e invita visitantes.',
    icono: KeyRound,
  },
  vigilante: {
    nombre: MODULOS.vigilante.nombre,
    descripcion: 'Registra entradas y salidas y revisa las reservas del día.',
    icono: ShieldCheck,
  },
} satisfies Record<Modulo, unknown>
