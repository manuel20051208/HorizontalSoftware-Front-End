import { Check, Clock, UserCheck } from 'lucide-react'
import type { Metadata } from 'next'
import { BotonAccion, FormularioAccion } from '@/components/gestion/acciones-cliente'
import { Campo } from '@/components/gestion/campos'
import { Encabezado, EstadoResultado, Panel, Vacio } from '@/components/gestion/piezas'
import styles from '@/components/gestion/gestion.module.css'
import { fechaLarga } from '@/lib/api/acciones'
import type { Invitado } from '@/lib/api/tipos'
import { alternarInvitado, crearInvitado } from '@/lib/residente/acciones'
import { RUTAS_API } from '@/lib/auth/config'
import { apiConSesion, requerirSesion } from '@/lib/auth/sesion'

export const metadata: Metadata = { title: 'Mis invitados' }

export default async function InvitadosPage() {
  await requerirSesion('residente')
  const r = await apiConSesion<Invitado[]>('residente', RUTAS_API.invitados, { metodo: 'GET' })
  const invitados =
    r.ok && Array.isArray(r.datos)
      ? [...r.datos].sort(
          (a, b) => Number(b.vigente) - Number(a.vigente) || a.nombreCompleto.localeCompare(b.nombreCompleto),
        )
      : []
  const vigentes = invitados.filter((i) => i.vigente).length

  return (
    <div className={styles.pagina}>
      <Encabezado
        titulo="Mis invitados"
        descripcion="Autoriza el ingreso de tus visitantes. La portería los deja pasar mientras su autorización esté vigente."
        volverHref="/residente"
        volverTexto="Mi apartamento"
      />

      <Panel titulo="Autorizar un invitado" nota="Sin fecha de vencimiento la autorización es permanente.">
        <FormularioAccion accion={crearInvitado} texto="Autorizar invitado" className={styles.formularioEstrecho}>
          <div className={styles.rejilla}>
            <Campo nombre="nombreCompleto" etiqueta="Nombre completo" maxLength={150} requerido ancho />
            <Campo
              nombre="identificacion"
              etiqueta="Identificación"
              tipo="number"
              min={1}
              step={1}
              requerido
              inputMode="numeric"
            />
            <Campo nombre="venceAutorizacion" etiqueta="Vence la autorización" tipo="date" opcional ayuda="Déjalo vacío para que sea permanente." />
            <Campo nombre="correoElectronico" etiqueta="Correo" tipo="email" opcional autoComplete="off" />
            <Campo nombre="fechaNacimiento" etiqueta="Fecha de nacimiento" tipo="date" opcional />
          </div>
        </FormularioAccion>
      </Panel>

      <Panel
        titulo="Invitados registrados"
        nota={`${vigentes} con autorización vigente de ${invitados.length} en total.`}
      >
        {!r.ok ? (
          <EstadoResultado resultado={r} porDefecto="No se pudieron cargar tus invitados." />
        ) : invitados.length === 0 ? (
          <Vacio>Todavía no has autorizado a ningún invitado.</Vacio>
        ) : (
          <div className={styles.tablaMarco}>
            <table className={styles.tabla}>
              <caption className="sr-only">Invitados autorizados</caption>
              <thead>
                <tr>
                  <th scope="col">Invitado</th>
                  <th scope="col">Identificación</th>
                  <th scope="col">Vence</th>
                  <th scope="col">Estado</th>
                  <th scope="col">
                    <span className="sr-only">Acción</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {invitados.map((i) => (
                  <tr key={i.id}>
                    <td className={`t-voz ${styles.nombre}`}>{i.nombreCompleto}</td>
                    <td className={styles.ahora}>{i.identificacion}</td>
                    <td className={`t-nota ${styles.ahora}`}>
                      {i.venceAutorizacion ? fechaLarga(i.venceAutorizacion) : 'Permanente'}
                    </td>
                    <td>
                      <span className="chip" data-tone={i.vigente ? 'ok' : 'neutral'}>
                        {i.vigente ? <UserCheck aria-hidden="true" /> : <Clock aria-hidden="true" />}
                        {i.vigente ? 'Vigente' : 'Inactiva'}
                      </span>
                    </td>
                    <td>
                      <BotonAccion
                        accion={alternarInvitado.bind(null, i.id)}
                        variante={i.active ? 'quiet' : 'secondary'}
                        confirmar={`¿${i.active ? 'Desactivar' : 'Activar'} la autorización de ${i.nombreCompleto}?`}
                      >
                        {i.active ? 'Desactivar' : 'Activar'}
                      </BotonAccion>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <p className="t-nota">
        <Check aria-hidden="true" style={{ display: 'inline', width: '1rem', height: '1rem' }} /> «Vigente» significa
        autorización activa y sin vencer: así la ve la portería al registrar el ingreso.
      </p>
    </div>
  )
}
