import { ArrowLeft, Check, CircleAlert, Clock, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { Chip } from '@/components/ui/chip'
import type { Resultado } from '@/lib/auth/api'
import { alternarActivo } from '@/lib/usuarios/acciones'
import { esTipoCuenta, TIPOS_CUENTA, type TipoCuenta, type Usuario } from '@/lib/usuarios/tipos'
import { BotonActivo } from './boton-activo'
import styles from './usuarios.module.css'

type Estado = 'activas' | 'inactivas'

const fecha = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

function enlace(tipo?: TipoCuenta, estado?: Estado) {
  const q = new URLSearchParams()
  if (tipo) q.set('tipo', TIPOS_CUENTA[tipo].filtro)
  if (estado) q.set('estado', estado)
  return q.size ? `/admin/usuarios?${q}` : '/admin/usuarios'
}

function mensajeProblema(r: Extract<Resultado<unknown>, { ok: false }>) {
  if (r.status === 0) return 'No pudimos conectar con el servidor, así que no se ven las cuentas. Intenta de nuevo en un momento.'
  if (r.status === 403) return 'Tu cuenta no tiene permiso para ver los usuarios.'
  return 'No se pudieron cargar las cuentas. Intenta de nuevo en un momento.'
}

/** Lista de cuentas del conjunto, con filtros por tipo y estado. Se renderiza en el servidor. */
export function UsuariosVista({
  resultado,
  tipo,
  estado,
}: {
  resultado: Resultado<Usuario[]>
  tipo?: TipoCuenta
  estado?: Estado
}) {
  // Los invitados (USUARIO_AUTORIZADO) los maneja cada residente; aquí solo van las cuentas que crea la administración
  const usuarios =
    resultado.ok && Array.isArray(resultado.datos) ? resultado.datos.filter((u) => esTipoCuenta(u.tipoUsuario)) : []

  return (
    <div className={styles.pagina}>
      <Link href="/admin" prefetch={false} className={`btn ${styles.volver}`} data-variant="quiet" data-size="sm">
        <ArrowLeft aria-hidden="true" />
        Panel
      </Link>

      <header className={styles.cabecera}>
        <div className={styles.titulo}>
          <h1 className="t-title">Usuarios</h1>
          <p className={styles.sub}>Las cuentas del conjunto. Solo la administración las crea: nadie se registra por su cuenta.</p>
        </div>
        <Link href="/admin/usuarios/nueva" prefetch={false} className="btn" data-variant="primary">
          <UserPlus aria-hidden="true" />
          Crear cuenta
        </Link>
      </header>

      <nav className={styles.filtros} aria-label="Filtrar usuarios">
        <ul className={styles.grupoFiltro} aria-label="Por tipo">
          <li>
            <Link href={enlace(undefined, estado)} className={styles.filtro} aria-current={!tipo ? 'page' : undefined}>
              Todas
            </Link>
          </li>
          {(Object.keys(TIPOS_CUENTA) as TipoCuenta[]).map((t) => (
            <li key={t}>
              <Link href={enlace(t, estado)} className={styles.filtro} aria-current={tipo === t ? 'page' : undefined}>
                {TIPOS_CUENTA[t].plural}
              </Link>
            </li>
          ))}
        </ul>
        <ul className={styles.grupoFiltro} aria-label="Por estado">
          {([undefined, 'activas', 'inactivas'] as const).map((e) => (
            <li key={e ?? 'todas'}>
              <Link href={enlace(tipo, e)} className={styles.filtro} aria-current={estado === e ? 'page' : undefined}>
                {e === 'activas' ? 'Activas' : e === 'inactivas' ? 'Inactivas' : 'Cualquier estado'}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <section className={`hoja ${styles.panel}`} aria-labelledby="cuentas-titulo">
        <header className={styles.panelCabecera}>
          <h2 id="cuentas-titulo" className="t-section">
            Cuentas
          </h2>
          {resultado.ok && (
            <p className="t-nota">{usuarios.length === 1 ? '1 cuenta' : `${usuarios.length} cuentas`}</p>
          )}
        </header>

        {!resultado.ok ? (
          <p className={styles.problema} role="alert">
            <CircleAlert aria-hidden="true" />
            <span>{mensajeProblema(resultado)}</span>
          </p>
        ) : usuarios.length === 0 ? (
          <p className={styles.vacio}>
            {tipo || estado ? 'No hay cuentas con estos filtros.' : 'Aún no hay cuentas. Crea la primera.'}
          </p>
        ) : (
          <table className={styles.tabla}>
            <caption className="sr-only">Cuentas de usuario del conjunto</caption>
            <thead>
              <tr>
                <th scope="col">Persona</th>
                <th scope="col">Tipo</th>
                <th scope="col">Apartamento</th>
                <th scope="col">Estado</th>
                <th scope="col">Creada</th>
                <th scope="col">
                  <span className="sr-only">Acción</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => {
                const activa = u.active === true
                const tipoU = u.tipoUsuario as TipoCuenta
                return (
                  <tr key={u.id}>
                    <td className={styles.cPersona}>
                      <span className={`t-voz ${styles.nombre}`}>{u.nombreCompleto}</span>
                      <span className={`t-nota ${styles.correo}`}>{u.correoElectronico}</span>
                    </td>
                    <td className={styles.cTipo}>{TIPOS_CUENTA[tipoU].nombre}</td>
                    <td className={`${styles.cApto} ${u.direccionInmueble ? '' : styles.sinDato}`}>
                      {u.direccionInmueble ?? <span aria-label="Sin apartamento">—</span>}
                    </td>
                    <td className={styles.cEstado}>
                      {activa ? (
                        <Chip tono="ok" icono={Check}>
                          Activa
                        </Chip>
                      ) : (
                        <Chip tono="wait" icono={Clock}>
                          Inactiva
                        </Chip>
                      )}
                    </td>
                    <td className={`t-nota t-columna ${styles.cCreada}`}>
                      {u.fechaCreacionCuenta ? fecha.format(new Date(`${u.fechaCreacionCuenta}T00:00:00Z`)) : '—'}
                    </td>
                    <td className={styles.cAccion}>
                      {/* El backend no deja activar ni desactivar administradores desde aquí */}
                      {tipoU !== 'ADMINISTRADOR' && (
                        <BotonActivo
                          activa={activa}
                          nombre={u.nombreCompleto}
                          accion={alternarActivo.bind(null, u.identificacion)}
                        />
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
