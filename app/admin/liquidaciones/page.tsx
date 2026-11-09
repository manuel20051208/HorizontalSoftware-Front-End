import { Check, CircleAlert, Clock } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { BotonAccion, FormularioAccion } from '@/components/gestion/acciones-cliente'
import { Campo, CampoSelect } from '@/components/gestion/campos'
import { Encabezado, EstadoResultado, Panel, Vacio } from '@/components/gestion/piezas'
import styles from '@/components/gestion/gestion.module.css'
import { fechaLarga, hoyBogota, pesos, primerDiaDelMes } from '@/lib/api/acciones'
import {
  ESTADO_LIQUIDACION_TEXTO,
  type EstadoLiquidacion,
  type InmuebleResumen,
  type Liquidacion,
} from '@/lib/api/tipos'
import { cambiarEstadoLiquidacion, generarLiquidacion, generarLiquidacionMasiva } from '@/lib/admin/acciones'
import { RUTAS_API } from '@/lib/auth/config'
import { apiConSesion, requerirSesion } from '@/lib/auth/sesion'

export const metadata: Metadata = { title: 'Liquidaciones' }

type Props = { searchParams: Promise<{ inmuebleId?: string; estado?: string; periodo?: string }> }

const ESTADOS: EstadoLiquidacion[] = ['PENDIENTE', 'AL_DIA', 'EN_MORA']

function tono(estado: EstadoLiquidacion) {
  return estado === 'AL_DIA' ? 'ok' : estado === 'EN_MORA' ? 'alert' : 'wait'
}

export default async function LiquidacionesPage({ searchParams }: Props) {
  await requerirSesion('admin')
  const params = await searchParams
  const hoy = hoyBogota()
  const periodo = /^\d{4}-\d{2}-\d{2}$/.test(params.periodo ?? '') ? params.periodo : undefined
  const estado = ESTADOS.includes(params.estado as EstadoLiquidacion) ? (params.estado as EstadoLiquidacion) : undefined
  const inmuebleId = Number(params.inmuebleId)

  const consulta = new URLSearchParams()
  if (inmuebleId > 0) consulta.set('inmuebleId', String(inmuebleId))
  if (estado) consulta.set('estado', estado)
  if (periodo) consulta.set('periodo', periodo)

  const [liquidacionesR, inmueblesR] = await Promise.all([
    apiConSesion<Liquidacion[]>(
      'admin',
      consulta.size ? `${RUTAS_API.liquidaciones}?${consulta}` : RUTAS_API.liquidaciones,
      { metodo: 'GET' },
    ),
    apiConSesion<InmuebleResumen[]>('admin', RUTAS_API.inmuebles, { metodo: 'GET' }),
  ])
  const liquidaciones = liquidacionesR.ok && Array.isArray(liquidacionesR.datos) ? liquidacionesR.datos : []
  const inmuebles = inmueblesR.ok && Array.isArray(inmueblesR.datos) ? inmueblesR.datos : []

  return (
    <div className={styles.pagina}>
      <Encabezado
        titulo="Liquidaciones"
        descripcion="Genera la administración del periodo, revisa la cartera y ajusta el estado de cada liquidación."
        acciones={
          <Link href="/admin/inmuebles" prefetch={false} className="btn" data-variant="secondary">
            Configurar inmuebles
          </Link>
        }
      />

      <div className={styles.rejilla}>
        <Panel titulo="Generar una liquidación" nota="Para el primer periodo de un inmueble debes indicar la cuota; los siguientes la copian.">
          <FormularioAccion accion={generarLiquidacion} texto="Generar liquidación" className={styles.formularioEstrecho}>
            <div className={styles.rejilla}>
              <CampoSelect
                nombre="inmuebleId"
                etiqueta="Inmueble"
                opciones={inmuebles.map((i) => ({ valor: i.id, texto: i.direccionInmueble }))}
                requerido
                disabled={inmuebles.length === 0}
                ayuda={inmuebles.length === 0 ? 'Crea primero un inmueble.' : undefined}
              />
              <Campo nombre="periodo" etiqueta="Periodo" tipo="date" valor={primerDiaDelMes(hoy)} requerido />
              <Campo nombre="fechaLimite" etiqueta="Fecha límite" tipo="date" opcional ayuda="Por defecto, el día 10 del periodo." />
              <Campo
                nombre="cuotaAdministracion"
                etiqueta="Cuota de administración"
                tipo="number"
                min={0}
                step="any"
                opcional
                inputMode="decimal"
                ayuda="Obligatoria solo si el inmueble no tiene liquidación anterior."
              />
              <Campo
                nombre="valorServiciosComunes"
                etiqueta="Servicios comunes"
                tipo="number"
                min={0}
                step="any"
                opcional
                inputMode="decimal"
                ancho
              />
            </div>
          </FormularioAccion>
        </Panel>

        <Panel titulo="Generar para todos" nota="Genera el periodo en todos los inmuebles activos con las tarifas de su liquidación anterior.">
          <FormularioAccion accion={generarLiquidacionMasiva} texto="Generar masiva" variante="secondary">
            <div className={styles.rejilla}>
              <Campo nombre="periodo" etiqueta="Periodo" tipo="date" valor={primerDiaDelMes(hoy)} requerido />
              <Campo nombre="fechaLimite" etiqueta="Fecha límite" tipo="date" opcional ayuda="Por defecto, el día 10." />
            </div>
            <p className={`t-nota ${styles.notaSuelta}`}>
              Los inmuebles sin liquidación previa se omiten con su motivo: genera la primera de forma individual.
            </p>
          </FormularioAccion>
        </Panel>
      </div>

      <Panel
        titulo="Cartera liquidada"
        nota={`${liquidaciones.length} ${liquidaciones.length === 1 ? 'liquidación' : 'liquidaciones'} con los filtros actuales.`}
      >
        <form method="get" className={styles.filtros}>
          <div className={`${styles.grupo} ${styles.filtroCampo}`}>
            <label htmlFor="filtro-inmueble" className={styles.etiqueta}>
              Inmueble
            </label>
            <select id="filtro-inmueble" name="inmuebleId" className={styles.entrada} defaultValue={inmuebleId > 0 ? String(inmuebleId) : ''}>
              <option value="">Todos</option>
              {inmuebles.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.direccionInmueble}
                </option>
              ))}
            </select>
          </div>
          <div className={`${styles.grupo} ${styles.filtroCampo}`}>
            <label htmlFor="filtro-estado" className={styles.etiqueta}>
              Estado
            </label>
            <select id="filtro-estado" name="estado" className={styles.entrada} defaultValue={estado ?? ''}>
              <option value="">Todos</option>
              {ESTADOS.map((e) => (
                <option key={e} value={e}>
                  {ESTADO_LIQUIDACION_TEXTO[e]}
                </option>
              ))}
            </select>
          </div>
          <div className={`${styles.grupo} ${styles.filtroCampo}`}>
            <label htmlFor="filtro-periodo" className={styles.etiqueta}>
              Periodo
            </label>
            <input id="filtro-periodo" name="periodo" type="date" className={styles.entrada} defaultValue={periodo ?? ''} />
          </div>
          <button type="submit" className="btn" data-variant="secondary">
            Filtrar
          </button>
          {consulta.size > 0 && (
            <Link href="/admin/liquidaciones" prefetch={false} className="btn" data-variant="quiet">
              Limpiar
            </Link>
          )}
        </form>

        {!liquidacionesR.ok ? (
          <EstadoResultado resultado={liquidacionesR} porDefecto="No se pudieron cargar las liquidaciones." />
        ) : liquidaciones.length === 0 ? (
          <Vacio>No hay liquidaciones con estos filtros.</Vacio>
        ) : (
          <div className={styles.tablaMarco}>
            <table className={styles.tabla} data-cards>
              <caption className="sr-only">Liquidaciones del conjunto</caption>
              <thead>
                <tr>
                  <th scope="col">Inmueble</th>
                  <th scope="col">Periodo</th>
                  <th scope="col">Vence</th>
                  <th scope="col" className={styles.derecha}>
                    Cuota
                  </th>
                  <th scope="col" className={styles.derecha}>
                    Servicios
                  </th>
                  <th scope="col" className={styles.derecha}>
                    Multas
                  </th>
                  <th scope="col" className={styles.derecha}>
                    Total
                  </th>
                  <th scope="col">Estado</th>
                  <th scope="col">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {liquidaciones.map((l) => (
                  <tr key={l.id}>
                    <td className={`t-voz ${styles.nombre} ${styles.celdaPrincipal}`} data-label="Inmueble">
                      {l.direccionInmueble}
                    </td>
                    <td className={`t-columna ${styles.ahora}`} data-label="Periodo">{l.periodo.slice(0, 7)}</td>
                    <td className={`t-nota ${styles.ahora}`} data-label="Vence">{fechaLarga(l.fechaLimite)}</td>
                    <td className={`t-columna ${styles.derecha}`} data-label="Cuota">{pesos(l.cuotaAdministracion)}</td>
                    <td className={`t-columna ${styles.derecha}`} data-label="Servicios">{pesos(l.valorServiciosComunes)}</td>
                    <td className={`t-columna ${styles.derecha}`} data-label="Multas">{pesos(l.valorMultas)}</td>
                    <td className={`t-columna ${styles.derecha} ${styles.ahora}`} data-label="Total">
                      <strong>{pesos(l.total)}</strong>
                    </td>
                    <td data-label="Estado">
                      <span className="chip" data-tone={tono(l.estado)}>
                        {l.estado === 'AL_DIA' ? (
                          <Check aria-hidden="true" />
                        ) : l.estado === 'EN_MORA' ? (
                          <CircleAlert aria-hidden="true" />
                        ) : (
                          <Clock aria-hidden="true" />
                        )}
                        {ESTADO_LIQUIDACION_TEXTO[l.estado]}
                        {l.vencida && l.estado === 'PENDIENTE' ? ' · vencida' : ''}
                      </span>
                    </td>
                    <td className={styles.celdaAccion}>
                      <div className={styles.accionesCabecera}>
                        {l.estado !== 'EN_MORA' && (
                          <BotonAccion
                            accion={cambiarEstadoLiquidacion.bind(null, l.id, true)}
                            variante="quiet"
                            confirmar={`¿Marcar en mora la liquidación de ${l.direccionInmueble}?`}
                          >
                            Marcar en mora
                          </BotonAccion>
                        )}
                        {l.estado !== 'AL_DIA' && (
                          <BotonAccion
                            accion={cambiarEstadoLiquidacion.bind(null, l.id, false)}
                            variante="secondary"
                            confirmar={`¿Marcar al día la liquidación de ${l.direccionInmueble}?`}
                          >
                            Marcar al día
                          </BotonAccion>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  )
}
