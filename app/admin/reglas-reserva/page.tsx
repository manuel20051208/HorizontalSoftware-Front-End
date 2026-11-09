import { Check, Clock } from 'lucide-react'
import type { Metadata } from 'next'
import { BotonAccion, FormularioAccion } from '@/components/gestion/acciones-cliente'
import { Campo, CampoArea } from '@/components/gestion/campos'
import { Encabezado, EstadoResultado, Panel, Vacio } from '@/components/gestion/piezas'
import styles from '@/components/gestion/gestion.module.css'
import { fechaLarga, pesos } from '@/lib/api/acciones'
import type { Regla, Zona } from '@/lib/api/tipos'
import { actualizarRegla, alternarRompimiento, crearRegla } from '@/lib/admin/acciones'
import { RUTAS_API } from '@/lib/auth/config'
import { apiConSesion, requerirSesion } from '@/lib/auth/sesion'

export const metadata: Metadata = { title: 'Reglas de reserva' }

export default async function ReglasPage() {
  await requerirSesion('admin')
  const [reglasR, zonasR] = await Promise.all([
    apiConSesion<Regla[]>('admin', RUTAS_API.reglas, { metodo: 'GET' }),
    apiConSesion<Zona[]>('admin', RUTAS_API.zonasComunes, { metodo: 'GET' }),
  ])
  const reglas = reglasR.ok && Array.isArray(reglasR.datos) ? reglasR.datos : []
  const zonas = zonasR.ok && Array.isArray(zonasR.datos) ? zonasR.datos : []

  return (
    <div className={styles.pagina}>
      <Encabezado
        titulo="Reglas de reserva"
        descripcion="Anticipación mínima, duración máxima y penalidades. Cada regla se aplica a una o varias zonas comunes mediante un rompimiento."
      />

      <Panel titulo="Nueva regla" nota="Elige al menos una zona.">
        <FormularioAccion accion={crearRegla} texto="Crear regla">
          <div className={styles.rejillaTres}>
            <Campo
              nombre="anticipacionMinimaHoras"
              etiqueta="Anticipación mínima (horas)"
              tipo="number"
              min={0}
              step={1}
              valor={0}
              requerido
              inputMode="numeric"
            />
            <Campo
              nombre="duracionMaximaHoras"
              etiqueta="Duración máxima (horas)"
              tipo="number"
              min={1}
              step={1}
              valor={2}
              requerido
              inputMode="numeric"
            />
            <Campo
              nombre="horasAntelacionPenalidad"
              etiqueta="Horas de antelación para penalidad"
              tipo="number"
              min={0}
              step={1}
              opcional
              inputMode="numeric"
            />
            <Campo
              nombre="tarifaPenalidad"
              etiqueta="Tarifa de penalidad"
              tipo="number"
              min={0}
              step="any"
              opcional
              inputMode="decimal"
            />
          </div>

          {zonas.length === 0 ? (
            <Vacio>No hay zonas comunes. Crea una antes de definir reglas.</Vacio>
          ) : (
            <fieldset className={styles.seccion}>
              <legend className={`t-section ${styles.leyenda}`}>Zonas a las que aplica</legend>
              <div className={styles.checks}>
                {zonas.map((z) => (
                  <label key={z.id} className={styles.check}>
                    <input type="checkbox" name="zonaComunIds" value={z.id} />
                    <span className={styles.checkNombre}>{z.nombreZonaComun}</span>
                    <span className={styles.nota}>{z.isActive ? 'Activa' : 'Inactiva'}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <CampoArea
            nombre="observaciones"
            etiqueta="Observaciones"
            opcional
            maxLength={500}
            placeholder="Por ejemplo: solo se permite una reserva por familia al mes."
          />
        </FormularioAccion>
      </Panel>

      <Panel titulo="Reglas configuradas" nota={reglas.length === 1 ? '1 regla' : `${reglas.length} reglas`}>
        {!reglasR.ok ? (
          <EstadoResultado resultado={reglasR} porDefecto="No se pudieron cargar las reglas." />
        ) : reglas.length === 0 ? (
          <Vacio>Aún no hay reglas de reserva.</Vacio>
        ) : (
          <div className={styles.listaReglas}>
            {reglas.map((regla) => (
              <section key={regla.id} className={styles.consulta} aria-label={`Regla ${regla.id}`}>
                <div className={styles.panelCabecera}>
                  <div>
                    <h3 className="t-section">Regla {regla.id}</h3>
                    <p className="t-nota">
                      Anticipación {regla.anticipacionMinimaHoras} h · duración máxima {regla.duracionMaximaHoras} h
                      {regla.tarifaPenalidad ? ` · penalidad ${pesos(regla.tarifaPenalidad)}` : ''}
                    </p>
                  </div>
                  <span className="chip">{regla.zonas.filter((z) => z.activa).length} zonas activas</span>
                </div>

                <FormularioAccion
                  accion={actualizarRegla.bind(null, regla.id)}
                  texto="Actualizar tiempos"
                  variante="secondary"
                  sinPie={false}
                >
                  <div className={styles.rejilla}>
                    <Campo
                      nombre="anticipacionMinimaHoras"
                      etiqueta="Anticipación mínima (horas)"
                      tipo="number"
                      min={0}
                      step={1}
                      valor={regla.anticipacionMinimaHoras}
                      requerido
                      inputMode="numeric"
                    />
                    <Campo
                      nombre="duracionMaximaHoras"
                      etiqueta="Duración máxima (horas)"
                      tipo="number"
                      min={1}
                      step={1}
                      valor={regla.duracionMaximaHoras}
                      requerido
                      inputMode="numeric"
                    />
                  </div>
                </FormularioAccion>

                <div className={styles.tablaMarco}>
                  <table className={styles.tabla} data-cards>
                    <caption className="sr-only">Zonas de la regla {regla.id}</caption>
                    <thead>
                      <tr>
                        <th scope="col">Zona</th>
                        <th scope="col">Aplicada desde</th>
                        <th scope="col">Estado</th>
                        <th scope="col">Observaciones</th>
                        <th scope="col">
                          <span className="sr-only">Acción</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {regla.zonas.map((z) => (
                        <tr key={z.id}>
                          <td className={`t-voz ${styles.nombre} ${styles.celdaPrincipal}`} data-label="Zona">
                            {z.nombreZonaComun}
                          </td>
                          <td className="t-nota" data-label="Aplicada desde">{fechaLarga(z.fechaAplicacion)}</td>
                          <td data-label="Estado">
                            <span className="chip" data-tone={z.activa ? 'ok' : 'wait'}>
                              {z.activa ? <Check aria-hidden="true" /> : <Clock aria-hidden="true" />}
                              {z.activa ? 'Activa' : 'Inactiva'}
                            </span>
                          </td>
                          <td className="t-nota" data-label="Observaciones">{z.observaciones ?? '—'}</td>
                          <td className={styles.celdaAccion}>
                            {z.activa ? (
                              <BotonAccion accion={alternarRompimiento.bind(null, z.id, false)} variante="quiet">
                                Inactivar
                              </BotonAccion>
                            ) : (
                              <BotonAccion accion={alternarRompimiento.bind(null, z.id, true)} variante="secondary">
                                Aplicar
                              </BotonAccion>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}
