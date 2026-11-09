import { Check, CircleAlert, Clock, Send } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BotonAccion, FormularioAccion } from '@/components/gestion/acciones-cliente'
import { Campo, CampoSelect } from '@/components/gestion/campos'
import { Encabezado, EstadoResultado, Panel, Vacio } from '@/components/gestion/piezas'
import styles from '@/components/gestion/gestion.module.css'
import { fechaLarga, pesos } from '@/lib/api/acciones'
import {
  ESTADO_CARTERA_TEXTO,
  ESTADO_LIQUIDACION_TEXTO,
  type InmuebleDetalle,
  type Zona,
} from '@/lib/api/tipos'
import { RUTAS_API } from '@/lib/auth/config'
import { apiConSesion, requerirSesion } from '@/lib/auth/sesion'
import {
  asignarZonas,
  conciliarPago,
  enviarRecordatorio,
  guardarMultas,
  guardarTarifas,
} from '@/lib/admin/acciones'

export const metadata: Metadata = { title: 'Detalle del inmueble' }

type Props = { params: Promise<{ id: string }> }

export default async function InmueblePage({ params }: Props) {
  await requerirSesion('admin')
  const { id } = await params
  const inmuebleId = Number(id)
  if (!Number.isSafeInteger(inmuebleId) || inmuebleId <= 0) notFound()

  const [detalleR, zonasR] = await Promise.all([
    apiConSesion<InmuebleDetalle>('admin', RUTAS_API.inmueble(inmuebleId), { metodo: 'GET' }),
    apiConSesion<Zona[]>('admin', RUTAS_API.zonasComunes, { metodo: 'GET' }),
  ])

  if (!detalleR.ok && detalleR.status === 404) notFound()

  if (!detalleR.ok) {
    return (
      <div className={styles.pagina}>
        <Encabezado titulo="Detalle del inmueble" volverHref="/admin/inmuebles" volverTexto="Inmuebles" />
        <EstadoResultado resultado={detalleR} porDefecto="No se pudo cargar el inmueble." />
      </div>
    )
  }

  const inmueble = detalleR.datos
  const zonas = zonasR.ok && Array.isArray(zonasR.datos) ? zonasR.datos : []
  const asignadas = new Set(inmueble.zonasComunes.map((z) => z.id))
  const liquidacion = inmueble.liquidacionVigente

  return (
    <div className={styles.pagina}>
      <Encabezado
        titulo={inmueble.direccionInmueble}
        descripcion="Estado de cartera, personas del inmueble y configuración de la liquidación vigente."
        volverHref="/admin/inmuebles"
        volverTexto="Inmuebles"
        acciones={
          <>
            <BotonAccion accion={enviarRecordatorio.bind(null, inmuebleId)} variante="secondary">
              <Send aria-hidden="true" />
              Enviar recordatorio
            </BotonAccion>
            <Link
              href={`/admin/liquidaciones?inmuebleId=${inmuebleId}`}
              prefetch={false}
              className="btn"
              data-variant="primary"
            >
              Ver liquidaciones
            </Link>
          </>
        }
      />

      <dl className={styles.cifras}>
        <div className={styles.cifra}>
          <dt>Estado de pago</dt>
          <dd className={styles.valorChip}>
            <span className="chip" data-tone={inmueble.estadoPago === 'AL_DIA' ? 'ok' : inmueble.estadoPago === 'VENCIDA' ? 'alert' : 'wait'}>
              {inmueble.estadoPago === 'AL_DIA' ? (
                <Check aria-hidden="true" />
              ) : inmueble.estadoPago === 'VENCIDA' ? (
                <CircleAlert aria-hidden="true" />
              ) : (
                <Clock aria-hidden="true" />
              )}
              {ESTADO_CARTERA_TEXTO[inmueble.estadoPago]}
            </span>
          </dd>
        </div>
        <div className={styles.cifra}>
          <dt>Saldo pendiente</dt>
          <dd>{pesos(inmueble.saldoPendiente)}</dd>
          <dd className={styles.detalle}>Vence {fechaLarga(inmueble.fechaLimitePendiente)}</dd>
        </div>
        <div className={styles.cifra}>
          <dt>Parqueadero</dt>
          <dd>{pesos(inmueble.valorParqueadero)}</dd>
          <dd className={styles.detalle}>{inmueble.isActive === false ? 'Inmueble inactivo' : 'Inmueble activo'}</dd>
        </div>
        <div className={styles.cifra}>
          <dt>Liquidaciones</dt>
          <dd>{inmueble.totalLiquidaciones}</dd>
          <dd className={styles.detalle}>{liquidacion ? `Vigente: ${liquidacion.periodo.slice(0, 7)}` : 'Sin liquidación vigente'}</dd>
        </div>
      </dl>

      <div className={styles.rejilla}>
        <Panel titulo="Personas del inmueble" nota={inmueble.nombresUsuarios.length ? inmueble.nombresUsuarios.join(', ') : 'Sin residentes asignados'}>
          {inmueble.usuarios.length === 0 ? (
            <Vacio>Este inmueble aún no tiene usuarios.</Vacio>
          ) : (
            <div className={styles.tablaMarco}>
              <table className={styles.tabla} data-cards>
                <thead>
                  <tr>
                    <th scope="col">Nombre</th>
                    <th scope="col">Documento</th>
                    <th scope="col">Correo</th>
                    <th scope="col">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {inmueble.usuarios.map((u) => (
                    <tr key={u.id}>
                      <td className={`t-voz ${styles.nombre} ${styles.celdaPrincipal}`} data-label="Nombre">
                        {u.nombreCompleto}
                      </td>
                      <td className="t-columna" data-label="Documento">{u.identificacion}</td>
                      <td className={styles.nota} data-label="Correo">{u.correoElectronico}</td>
                      <td data-label="Estado">
                        <span className="chip" data-tone={u.active ? 'ok' : 'wait'}>
                          {u.active ? <Check aria-hidden="true" /> : <Clock aria-hidden="true" />}
                          {u.active ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel
          titulo="Liquidación vigente"
          nota={liquidacion ? `Periodo ${liquidacion.periodo}, vence ${fechaLarga(liquidacion.fechaLimite)}` : 'Genera una liquidación para configurar tarifas y multas.'}
        >
          {liquidacion ? (
            <dl className={styles.datos}>
              <div>
                <dt>Estado</dt>
                <dd>{ESTADO_LIQUIDACION_TEXTO[liquidacion.estado]}</dd>
              </div>
              <div>
                <dt>Cuota</dt>
                <dd>{pesos(liquidacion.cuotaAdministracion)}</dd>
              </div>
              <div>
                <dt>Servicios</dt>
                <dd>{pesos(liquidacion.valorServiciosComunes)}</dd>
              </div>
              <div>
                <dt>Multas</dt>
                <dd>{pesos(liquidacion.valorMultas)}</dd>
              </div>
              <div>
                <dt>Total</dt>
                <dd>{pesos(liquidacion.total)}</dd>
              </div>
            </dl>
          ) : (
            <Vacio>
              <Link href={`/admin/liquidaciones?inmuebleId=${inmuebleId}`} className={styles.filtro}>
                Ir a liquidaciones
              </Link>
            </Vacio>
          )}
        </Panel>
      </div>

      <div className={styles.rejilla}>
        <Panel titulo="Tarifas de la liquidación vigente" nota="Solo aplican a una liquidación en estado PENDIENTE.">
          <FormularioAccion
            accion={guardarTarifas.bind(null, inmuebleId)}
            texto="Guardar tarifas"
            className={styles.formularioEstrecho}
            sinPie={false}
          >
            <div className={styles.rejilla}>
              <Campo
                nombre="cuotaAdministracion"
                etiqueta="Cuota de administración"
                tipo="number"
                min={0}
                step="any"
                valor={liquidacion?.cuotaAdministracion ?? ''}
                requerido
                inputMode="decimal"
              />
              <Campo
                nombre="valorServiciosComunes"
                etiqueta="Servicios comunes"
                tipo="number"
                min={0}
                step="any"
                valor={liquidacion?.valorServiciosComunes ?? ''}
                requerido
                inputMode="decimal"
              />
              <Campo
                nombre="valorParqueadero"
                etiqueta="Parqueadero"
                tipo="number"
                min={0}
                step="any"
                valor={inmueble.valorParqueadero ?? ''}
                opcional
                inputMode="decimal"
              />
            </div>
          </FormularioAccion>
        </Panel>

        <Panel titulo="Multas" nota="Valor adicional que se suma al total de la liquidación vigente.">
          <FormularioAccion
            accion={guardarMultas.bind(null, inmuebleId)}
            texto="Guardar multas"
            variante="secondary"
            className={styles.formularioEstrecho}
          >
            <Campo
              nombre="valorMultas"
              etiqueta="Valor de las multas"
              tipo="number"
              min={0}
              step="any"
              valor={liquidacion?.valorMultas ?? 0}
              requerido
              inputMode="decimal"
            />
          </FormularioAccion>
        </Panel>
      </div>

      <div className={styles.rejilla}>
        <Panel titulo="Zonas comunes asignadas" nota="El residente solo puede reservar las zonas activas asignadas a su inmueble.">
          <FormularioAccion
            accion={asignarZonas.bind(null, inmuebleId)}
            texto="Guardar zonas"
            variante="secondary"
            className={styles.formularioEstrecho}
          >
            {zonas.length === 0 ? (
              <Vacio>No hay zonas comunes creadas.</Vacio>
            ) : (
              <fieldset className={styles.seccion}>
                <legend className={`${styles.etiqueta} ${styles.leyenda}`}>Zonas</legend>
                <div className={styles.checks}>
                  {zonas.map((z) => (
                    <label key={z.id} className={styles.check}>
                      <input type="checkbox" name="zonaComunIds" value={z.id} defaultChecked={asignadas.has(z.id)} />
                      <span className={styles.checkNombre}>{z.nombreZonaComun}</span>
                      <span className={styles.nota}>
                        {z.horaInicio.slice(0, 5)}–{z.horaFin.slice(0, 5)} · {z.isActive ? 'activa' : 'inactiva'}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
          </FormularioAccion>
        </Panel>

        <Panel titulo="Conciliar pago" nota="Registra un pago en efectivo o transferencia. El monto debe ser igual al saldo pendiente.">
          <FormularioAccion
            accion={conciliarPago.bind(null, inmuebleId)}
            texto="Conciliar pago"
            variante="secondary"
            className={styles.formularioEstrecho}
          >
            <div className={styles.rejilla}>
              <Campo
                nombre="monto"
                etiqueta="Monto"
                tipo="number"
                min={0}
                step="any"
                valor={inmueble.saldoPendiente || ''}
                requerido
                inputMode="decimal"
                ayuda={`Saldo pendiente actual: ${pesos(inmueble.saldoPendiente)}`}
              />
              <CampoSelect
                nombre="metodoPago"
                etiqueta="Método de pago"
                opciones={[
                  { valor: 'EFECTIVO', texto: 'Efectivo' },
                  { valor: 'TRANSFERENCIA', texto: 'Transferencia' },
                  { valor: 'CONSIGNACION', texto: 'Consignación' },
                  { valor: 'OTRO', texto: 'Otro' },
                ]}
                requerido
              />
              <Campo nombre="referencia" etiqueta="Referencia" opcional ancho maxLength={100} />
            </div>
          </FormularioAccion>
        </Panel>
      </div>
    </div>
  )
}
