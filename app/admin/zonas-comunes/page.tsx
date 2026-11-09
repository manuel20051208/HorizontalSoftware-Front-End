import { Check, Clock, Plus } from 'lucide-react'
import type { Metadata } from 'next'
import { BotonAccion, FormularioAccion } from '@/components/gestion/acciones-cliente'
import { Campo, CampoCheck } from '@/components/gestion/campos'
import { Encabezado, EstadoResultado, Panel, Vacio } from '@/components/gestion/piezas'
import styles from '@/components/gestion/gestion.module.css'
import { horaLegible } from '@/lib/api/acciones'
import type { Zona } from '@/lib/api/tipos'
import { alternarZona, crearZona } from '@/lib/admin/acciones'
import { RUTAS_API } from '@/lib/auth/config'
import { apiConSesion, requerirSesion } from '@/lib/auth/sesion'

export const metadata: Metadata = { title: 'Zonas comunes' }

export default async function ZonasPage() {
  await requerirSesion('admin')
  const r = await apiConSesion<Zona[]>('admin', RUTAS_API.zonasComunes, { metodo: 'GET' })
  const zonas = r.ok && Array.isArray(r.datos) ? r.datos : []

  return (
    <div className={styles.pagina}>
      <Encabezado
        titulo="Zonas comunes"
        descripcion="Salones, gimnasio, piscina y demás espacios reservables. Al crear una zona puedes asignarla a todos los inmuebles."
      />

      <div className={styles.rejilla}>
        <Panel titulo="Nueva zona" nota="La hora de inicio y la de fin no pueden ser iguales.">
          <FormularioAccion accion={crearZona} texto="Crear zona">
            <div className={styles.rejilla}>
              <Campo nombre="nombreZonaComun" etiqueta="Nombre" maxLength={100} requerido ancho />
              <Campo nombre="capacidad" etiqueta="Capacidad" tipo="number" min={1} step={1} requerido inputMode="numeric" />
              <Campo nombre="horaInicio" etiqueta="Hora de inicio" tipo="time" requerido />
              <Campo nombre="horaFin" etiqueta="Hora de fin" tipo="time" requerido />
            </div>
            <CampoCheck
              nombre="aplicarATodosLosInmuebles"
              etiqueta="Asignar a todos los inmuebles"
              marcado
              ayuda="Los inmuebles creados después también la reciben automáticamente."
            />
          </FormularioAccion>
        </Panel>

        <Panel titulo="Cómo funcionan las reservas" nota="Reglas que aplica el backend.">
          <ul className={`t-nota ${styles.lista}`}>
            <li>La zona debe estar activa y asignada al inmueble del residente.</li>
            <li>El residente debe estar habilitado: cuenta e inmueble activos y sin mora.</li>
            <li>La hora debe caer dentro del horario y la zona debe tener cupo.</li>
            <li>Un residente no puede reservar dos veces la misma zona.</li>
          </ul>
        </Panel>
      </div>

      <Panel titulo="Zonas del conjunto" nota={zonas.length === 1 ? '1 zona' : `${zonas.length} zonas`}>
        {!r.ok ? (
          <EstadoResultado resultado={r} porDefecto="No se pudieron cargar las zonas comunes." />
        ) : zonas.length === 0 ? (
          <Vacio>Todavía no hay zonas comunes. Crea la primera.</Vacio>
        ) : (
          <div className={styles.tablaMarco}>
            <table className={styles.tabla} data-cards>
              <caption className="sr-only">Zonas comunes</caption>
              <thead>
                <tr>
                  <th scope="col">Zona</th>
                  <th scope="col">Horario</th>
                  <th scope="col" className={styles.derecha}>
                    Capacidad
                  </th>
                  <th scope="col" className={styles.derecha}>
                    Reservas
                  </th>
                  <th scope="col">Estado</th>
                  <th scope="col">
                    <span className="sr-only">Acción</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {zonas.map((z) => (
                  <tr key={z.id}>
                    <td className={`t-voz ${styles.nombre} ${styles.celdaPrincipal}`} data-label="Zona">
                      {z.nombreZonaComun}
                    </td>
                    <td className={styles.ahora} data-label="Horario">
                      {horaLegible(z.horaInicio)} a {horaLegible(z.horaFin)}
                    </td>
                    <td className={`t-columna ${styles.derecha}`} data-label="Capacidad">{z.capacidad}</td>
                    <td className={`t-columna ${styles.derecha}`} data-label="Reservas">{z.reservasActuales}</td>
                    <td data-label="Estado">
                      <span className="chip" data-tone={z.isActive ? 'ok' : 'wait'}>
                        {z.isActive ? <Check aria-hidden="true" /> : <Clock aria-hidden="true" />}
                        {z.isActive ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className={styles.celdaAccion}>
                      <BotonAccion
                        accion={alternarZona.bind(null, z.id)}
                        variante={z.isActive ? 'quiet' : 'secondary'}
                        confirmar={`¿${z.isActive ? 'Desactivar' : 'Activar'} la zona ${z.nombreZonaComun}?`}
                      >
                        {z.isActive ? 'Desactivar' : 'Activar'}
                      </BotonAccion>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <p className={`t-nota ${styles.notaIcono}`}>
        <Plus aria-hidden="true" /> Las zonas nuevas se asignan también desde el detalle de cada inmueble.
      </p>
    </div>
  )
}
