import { Car } from 'lucide-react'
import type { Metadata } from 'next'
import { FormularioAccion } from '@/components/gestion/acciones-cliente'
import { Campo } from '@/components/gestion/campos'
import { Encabezado, EstadoResultado, Panel } from '@/components/gestion/piezas'
import styles from '@/components/gestion/gestion.module.css'
import type { Auto } from '@/lib/api/tipos'
import { registrarAuto } from '@/lib/residente/acciones'
import { RUTAS_API } from '@/lib/auth/config'
import { apiConSesion, requerirSesion } from '@/lib/auth/sesion'

export const metadata: Metadata = { title: 'Mi auto' }

export default async function AutoPage() {
  await requerirSesion('residente')
  const r = await apiConSesion<Auto>('residente', RUTAS_API.auto, { metodo: 'GET' })
  const auto = r.ok ? r.datos : null
  // Un 404 solo significa que todavía no hay auto registrado; cualquier otro error sí se muestra.
  const errorReal = !r.ok && r.status !== 404 ? r : null

  return (
    <div className={styles.pagina}>
      <Encabezado
        titulo="Mi auto y parqueadero"
        descripcion="Registra la placa de tu vehículo para que la portería lo reconozca al ingresar."
        volverHref="/residente"
        volverTexto="Mi apartamento"
      />

      {errorReal && <EstadoResultado resultado={errorReal} porDefecto="No se pudo cargar tu auto." />}

      {auto && (
        <Panel titulo="Auto registrado" nota="Datos tal como los ve la portería.">
          <dl className={styles.datos}>
            <div>
              <dt>Placa</dt>
              <dd>
                <span className="chip" data-tone="info">
                  <Car aria-hidden="true" />
                  {auto.placa}
                </span>
              </dd>
            </div>
            <div>
              <dt>Dueño</dt>
              <dd>{auto.nombreDueno}</dd>
            </div>
            <div>
              <dt>Apartamento</dt>
              <dd>{auto.direccionInmueble}</dd>
            </div>
            <div>
              <dt>Parqueadero</dt>
              <dd>{auto.parqueaderoId ?? 'Sin asignar'}</dd>
            </div>
          </dl>
        </Panel>
      )}

      <Panel
        titulo={auto ? 'Actualizar el auto' : 'Registrar un auto'}
        nota="La placa es numérica, como figura en el registro del conjunto."
      >
        <FormularioAccion
          accion={registrarAuto}
          texto={auto ? 'Actualizar auto' : 'Registrar auto'}
          variante={auto ? 'secondary' : 'primary'}
          className={styles.formularioEstrecho}
        >
          <div className={styles.rejilla}>
            <Campo
              nombre="placa"
              etiqueta="Placa"
              tipo="number"
              min={1}
              step={1}
              valor={auto?.placa}
              requerido
              inputMode="numeric"
            />
            <Campo
              nombre="parqueaderoId"
              etiqueta="Número de parqueadero"
              tipo="number"
              min={1}
              step={1}
              valor={auto?.parqueaderoId ?? undefined}
              opcional
              inputMode="numeric"
            />
          </div>
        </FormularioAccion>
      </Panel>
    </div>
  )
}
