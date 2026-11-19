import { BellOff, BellRing } from 'lucide-react'
import { BotonAccion } from '@/components/gestion/acciones-cliente'
import { EstadoResultado, Panel } from '@/components/gestion/piezas'
import styles from '@/components/gestion/gestion.module.css'
import type { Resultado } from '@/lib/auth/api'
import type { Modulo } from '@/lib/auth/config'
import { cambiarPreferencia } from '@/lib/cuenta/acciones'
import { TIPO_NOTIFICACION_TEXTO, type Preferencias, type TipoNotificacion } from '@/lib/api/tipos'

const DESCRIPCION: Record<TipoNotificacion, string> = {
  GENERAL: 'Comunicados de la administración para el conjunto.',
  RESERVA: 'Confirmaciones y recordatorios de reservas de zonas comunes.',
  PAGO_PENDIENTE: 'Recordatorios de cobro y aviso de mora.',
  PAGO_ACTUALIZADO: 'Cuando un pago se aprueba, se rechaza o se reembolsa.',
  VISITA: 'Cuando portería registra el ingreso de tu invitado.',
  INCIDENCIA: 'Incidencias que reporta portería.',
}

/**
 * Qué tipos de aviso recibe el usuario. Lista vacía en el back = recibe todos.
 * `tipos` son los que tiene sentido elegir en ese rol.
 */
export function PanelPreferencias({
  modulo,
  resultado,
  tipos,
  nota,
}: {
  modulo: Modulo
  resultado: Resultado<Preferencias>
  tipos: readonly TipoNotificacion[]
  nota?: string
}) {
  if (!resultado.ok) {
    return (
      <Panel titulo="Qué avisos recibes" id="preferencias">
        <EstadoResultado resultado={resultado} porDefecto="No se pudieron cargar tus preferencias." />
      </Panel>
    )
  }

  const guardadas = resultado.datos.preferenciasNotificacion.map((t) => t.toUpperCase())
  const recibe = (t: string) => guardadas.length === 0 || guardadas.includes(t)
  const activos = tipos.filter(recibe).length

  return (
    <Panel
      titulo="Qué avisos recibes"
      id="preferencias"
      nota={
        nota ??
        (activos === tipos.length
          ? 'Recibes todos los tipos de aviso. Apaga los que no quieras.'
          : `Recibes ${activos} de ${tipos.length} tipos de aviso.`)
      }
    >
      <ul className={styles.fichas}>
        {tipos.map((t) => {
          const activo = recibe(t)
          return (
            <li key={t} className={`hoja ${styles.ficha}`}>
              {activo ? <BellRing aria-hidden="true" /> : <BellOff aria-hidden="true" />}
              <div className={styles.fichaCuerpo}>
                <p className="t-voz">{TIPO_NOTIFICACION_TEXTO[t]}</p>
                <p className="t-nota">{DESCRIPCION[t]}</p>
              </div>
              <BotonAccion
                accion={cambiarPreferencia.bind(null, modulo, tipos, t, !activo)}
                variante={activo ? 'quiet' : 'secondary'}
                ariaLabel={`${activo ? 'Desactivar' : 'Activar'} avisos de tipo ${TIPO_NOTIFICACION_TEXTO[t]}`}
              >
                {activo ? 'Desactivar' : 'Activar'}
              </BotonAccion>
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}
