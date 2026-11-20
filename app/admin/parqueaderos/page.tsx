import type { Metadata } from 'next'
import Link from 'next/link'
import { FormularioAccion } from '@/components/gestion/acciones-cliente'
import { Campo, CampoSelect } from '@/components/gestion/campos'
import { Editar, Eliminar } from '@/components/gestion/crud'
import { Encabezado, EstadoResultado, Panel, Vacio } from '@/components/gestion/piezas'
import styles from '@/components/gestion/gestion.module.css'
import { pesos } from '@/lib/api/acciones'
import type { InmuebleResumen, Parqueadero } from '@/lib/api/tipos'
import { actualizarParqueadero, crearParqueadero, eliminarParqueadero } from '@/lib/admin/acciones'
import { listaDe, listado, type Listado } from '@/lib/api/paginacion'
import { RUTAS_API } from '@/lib/auth/config'
import { apiConSesion, requerirSesion } from '@/lib/auth/sesion'

export const metadata: Metadata = { title: 'Parqueaderos' }

export default async function ParqueaderosPage() {
  await requerirSesion('admin')
  const [parqueaderosR, inmueblesR] = await Promise.all([
    apiConSesion<Listado<Parqueadero>>('admin', listado(RUTAS_API.parqueaderos), { metodo: 'GET' }),
    apiConSesion<Listado<InmuebleResumen>>('admin', listado(RUTAS_API.inmuebles), { metodo: 'GET' }),
  ])
  const parqueaderos = listaDe(parqueaderosR)
  const inmuebles = listaDe(inmueblesR)
  const direccion = new Map(inmuebles.map((i) => [i.id, i.direccionInmueble]))
  // Un inmueble tiene a lo sumo un parqueadero: solo se ofrecen los que aún no tienen
  const conParqueadero = new Set(parqueaderos.map((p) => p.inmuebleId))
  const disponibles = inmuebles.filter((i) => !conParqueadero.has(i.id))
  const ordenados = [...parqueaderos].sort((a, b) =>
    (direccion.get(a.inmuebleId) ?? '').localeCompare(direccion.get(b.inmuebleId) ?? '', undefined, { numeric: true }),
  )

  return (
    <div className={styles.pagina}>
      <Encabezado
        titulo="Parqueaderos"
        descripcion="Cada inmueble puede tener un parqueadero con su valor mensual. El residente asigna su auto desde su cuenta."
      />

      <Panel titulo="Nuevo parqueadero" nota="Solo aparecen los inmuebles que aún no tienen uno.">
        {disponibles.length === 0 ? (
          <Vacio>Todos los inmuebles ya tienen parqueadero.</Vacio>
        ) : (
          <FormularioAccion accion={crearParqueadero} texto="Crear parqueadero">
            <div className={styles.rejilla}>
              <CampoSelect
                nombre="inmuebleId"
                etiqueta="Inmueble"
                requerido
                opciones={disponibles.map((i) => ({ valor: i.id, texto: i.direccionInmueble }))}
              />
              <Campo
                nombre="valorMensual"
                etiqueta="Valor mensual"
                tipo="number"
                min={0}
                step="any"
                requerido
                inputMode="decimal"
              />
            </div>
          </FormularioAccion>
        )}
      </Panel>

      <Panel
        titulo="Parqueaderos del conjunto"
        nota={parqueaderos.length === 1 ? '1 parqueadero' : `${parqueaderos.length} parqueaderos`}
      >
        {!parqueaderosR.ok ? (
          <EstadoResultado resultado={parqueaderosR} porDefecto="No se pudieron cargar los parqueaderos." />
        ) : ordenados.length === 0 ? (
          <Vacio>Todavía no hay parqueaderos.</Vacio>
        ) : (
          <div className={styles.tablaMarco}>
            <table className={styles.tabla} data-cards>
              <caption className="sr-only">Parqueaderos</caption>
              <thead>
                <tr>
                  <th scope="col">Inmueble</th>
                  <th scope="col" className={styles.derecha}>
                    Valor mensual
                  </th>
                  <th scope="col">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {ordenados.map((p) => {
                  const nombre = direccion.get(p.inmuebleId) ?? `Inmueble ${p.inmuebleId}`
                  return (
                    <tr key={p.id}>
                      <td className={`t-voz ${styles.nombre} ${styles.celdaPrincipal}`} data-label="Inmueble">
                        <Link href={`/admin/inmuebles/${p.inmuebleId}`} prefetch={false}>
                          {nombre}
                        </Link>
                      </td>
                      <td className={`t-columna ${styles.derecha}`} data-label="Valor mensual">
                        {pesos(p.valorMensual)}
                      </td>
                      <td className={styles.celdaAccion}>
                        <div className={styles.accionesCabecera}>
                          <Editar
                            titulo={`Parqueadero de ${nombre}`}
                            accion={actualizarParqueadero.bind(null, p.id)}
                            ariaLabel={`Editar el parqueadero de ${nombre}`}
                          >
                            <Campo
                              prefijo={`parq-${p.id}`}
                              nombre="valorMensual"
                              etiqueta="Valor mensual"
                              tipo="number"
                              min={0}
                              step="any"
                              valor={p.valorMensual}
                              requerido
                              inputMode="decimal"
                            />
                          </Editar>
                          <Eliminar
                            titulo={`Eliminar el parqueadero de ${nombre}`}
                            accion={eliminarParqueadero.bind(null, p.id)}
                            ariaLabel={`Eliminar el parqueadero de ${nombre}`}
                            efectos="Si un auto lo usaba, el auto queda sin parqueadero; el auto no se borra."
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  )
}
