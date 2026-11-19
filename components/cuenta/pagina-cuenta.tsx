import { FormularioAccion } from '@/components/gestion/acciones-cliente'
import { Campo } from '@/components/gestion/campos'
import { Encabezado, EstadoResultado, Panel } from '@/components/gestion/piezas'
import styles from '@/components/gestion/gestion.module.css'
import { fechaLarga } from '@/lib/api/acciones'
import { MODULOS, RUTAS_API, type Modulo } from '@/lib/auth/config'
import { apiConSesion, requerirSesion } from '@/lib/auth/sesion'
import { cambiarContrasena } from '@/lib/cuenta/acciones'
import type { Usuario } from '@/lib/usuarios/tipos'

const INICIO: Record<Modulo, string> = { admin: 'Panel', residente: 'Inicio', vigilante: 'Portería' }

/** Mi cuenta: los datos de /api/auth/me y el cambio de contraseña. Igual para los tres roles. */
export async function PaginaCuenta({ modulo }: { modulo: Modulo }) {
  await requerirSesion(modulo)
  const r = await apiConSesion<Usuario>(modulo, RUTAS_API.me, { metodo: 'GET' })

  return (
    <div className={styles.pagina}>
      <Encabezado
        titulo="Mi cuenta"
        descripcion="Tus datos en el conjunto y tu contraseña de ingreso."
        volverHref={`/${modulo}`}
        volverTexto={INICIO[modulo]}
      />

      <Panel titulo="Tus datos" nota="Si algo no está bien, pídele a la administración que lo corrija.">
        {!r.ok ? (
          <EstadoResultado resultado={r} porDefecto="No se pudieron cargar tus datos." />
        ) : (
          <dl className={styles.datos}>
            <div>
              <dt>Nombre</dt>
              <dd>{r.datos.nombreCompleto}</dd>
            </div>
            <div>
              <dt>Correo</dt>
              <dd style={{ overflowWrap: 'anywhere' }}>{r.datos.correoElectronico}</dd>
            </div>
            <div>
              <dt>Identificación</dt>
              <dd>{r.datos.identificacion}</dd>
            </div>
            <div>
              <dt>Rol</dt>
              <dd>{MODULOS[modulo].nombre}</dd>
            </div>
            {r.datos.direccionInmueble && (
              <div>
                <dt>Inmueble</dt>
                <dd>{r.datos.direccionInmueble}</dd>
              </div>
            )}
            {r.datos.fechaCreacionCuenta && (
              <div>
                <dt>Cuenta creada</dt>
                <dd>{fechaLarga(r.datos.fechaCreacionCuenta)}</dd>
              </div>
            )}
          </dl>
        )}
      </Panel>

      <Panel
        titulo="Cambiar contraseña"
        id="contrasena"
        nota="Mínimo 8 caracteres, con letras y números. Si entraste con una contraseña temporal, cámbiala aquí."
      >
        <FormularioAccion accion={cambiarContrasena.bind(null, modulo)} texto="Cambiar contraseña" textoEnviando="Cambiando…">
          <Campo nombre="contrasenaActual" etiqueta="Contraseña actual" tipo="password" autoComplete="current-password" requerido />
          <Campo
            nombre="contrasenaNueva"
            etiqueta="Nueva contraseña"
            tipo="password"
            autoComplete="new-password"
            minLength={8}
            requerido
          />
          <Campo
            nombre="confirmacion"
            etiqueta="Repite la nueva contraseña"
            tipo="password"
            autoComplete="new-password"
            minLength={8}
            requerido
          />
        </FormularioAccion>
      </Panel>
    </div>
  )
}
