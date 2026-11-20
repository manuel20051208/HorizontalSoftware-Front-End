import { ArrowLeft, Check, CircleAlert, Clock, MailWarning, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { Chip } from '@/components/ui/chip'
import { listaDe, type Listado } from '@/lib/api/paginacion'
import type { Resultado } from '@/lib/auth/api'
import { Campo } from '@/components/gestion/campos'
import { Editar, Eliminar } from '@/components/gestion/crud'
import { actualizarCuenta, alternarActivo, eliminarCuenta } from '@/lib/usuarios/acciones'
import {
  esTipoCuenta,
  type Inmueble,
  INVITADO,
  tieneApartamentos,
  TIPOS_CUENTA,
  type TipoCuenta,
  type Usuario,
} from '@/lib/usuarios/tipos'
import { BotonActivo } from './boton-activo'
import { ApartamentosUsuario } from './relacion-inmueble'
import styles from './usuarios.module.css'
import { VerificarCorreo } from './verificar-correo'

type Estado = 'activas' | 'inactivas'
/** Filtro por tipo: las cuentas que crea la administración y los invitados (para manejar sus apartamentos). */
export type FiltroTipo = TipoCuenta | typeof INVITADO.tipo

const FILTROS: { tipo: FiltroTipo; plural: string; filtro: string }[] = [
  ...(Object.keys(TIPOS_CUENTA) as TipoCuenta[]).map((t) => ({ tipo: t, ...TIPOS_CUENTA[t] })),
  INVITADO,
]

function nombreTipo(tipoUsuario: string) {
  return esTipoCuenta(tipoUsuario) ? TIPOS_CUENTA[tipoUsuario].nombre : INVITADO.nombre
}

const fecha = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

function enlace(tipo?: FiltroTipo, estado?: Estado) {
  const q = new URLSearchParams()
  if (tipo) q.set('tipo', FILTROS.find((f) => f.tipo === tipo)!.filtro)
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
  inmuebles,
}: {
  resultado: Resultado<Listado<Usuario>>
  tipo?: FiltroTipo
  estado?: Estado
  /** Apartamentos activos, para asignar o cambiar el de un residente (null = no se pudieron cargar). */
  inmuebles: Inmueble[] | null
}) {
  // Los invitados (USUARIO_AUTORIZADO) los crea y activa cada residente: aquí solo se manejan sus apartamentos
  const usuarios = listaDe(resultado).filter((u) => esTipoCuenta(u.tipoUsuario) || u.tipoUsuario === INVITADO.tipo)

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
          {FILTROS.map((f) => (
            <li key={f.tipo}>
              <Link href={enlace(f.tipo, estado)} className={styles.filtro} aria-current={tipo === f.tipo ? 'page' : undefined}>
                {f.plural}
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
                <th scope="col">Apartamentos</th>
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
                // Sin verificar el correo la cuenta no se puede activar: primero va el código
                const tipoU = u.tipoUsuario
                // Los invitados no verifican correo con la administración: los autoriza su residente
                const pendiente = !activa && u.correoVerificado === false && esTipoCuenta(tipoU)
                return (
                  <tr key={u.id}>
                    <td className={styles.cPersona}>
                      <span className={`t-voz ${styles.nombre}`}>{u.nombreCompleto}</span>
                      <span className={`t-nota ${styles.correo}`}>{u.correoElectronico}</span>
                    </td>
                    <td className={styles.cTipo}>{nombreTipo(tipoU)}</td>
                    {tieneApartamentos(tipoU) ? (
                      <td className={styles.cApto}>
                        <ApartamentosUsuario
                          identificacion={u.identificacion}
                          nombre={u.nombreCompleto}
                          tipoUsuario={tipoU}
                          inmuebles={u.inmuebles ?? []}
                          disponibles={inmuebles}
                        />
                      </td>
                    ) : (
                      <td className={`${styles.cApto} ${styles.sinDato}`}>
                        <span aria-label="No aplica">—</span>
                      </td>
                    )}
                    <td className={styles.cEstado}>
                      {activa ? (
                        <Chip tono="ok" icono={Check}>
                          Activa
                        </Chip>
                      ) : pendiente ? (
                        <Chip tono="wait" icono={MailWarning}>
                          Por verificar
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
                      <div className={styles.accionesFila}>
                      {pendiente ? (
                        <VerificarCorreo
                          identificacion={u.identificacion}
                          correo={u.correoElectronico}
                          nombre={u.nombreCompleto}
                          compacto
                        />
                      ) : (
                        /* El backend no deja activar ni desactivar administradores desde aquí */
                        /* Ni administradores ni invitados (los activa su residente) */
                        esTipoCuenta(tipoU) && tipoU !== 'ADMINISTRADOR' && (
                        <BotonActivo
                          activa={activa}
                          nombre={u.nombreCompleto}
                          accion={alternarActivo.bind(null, u.identificacion)}
                        />
                        )
                      )}
                      <Editar
                        titulo={`Editar a ${u.nombreCompleto}`}
                        accion={actualizarCuenta.bind(null, u.identificacion, tipoU)}
                        ariaLabel={`Editar la cuenta de ${u.nombreCompleto}`}
                      >
                        <Campo
                          prefijo={`u-${u.id}`}
                          nombre="nombreCompleto"
                          etiqueta="Nombre completo"
                          maxLength={150}
                          valor={u.nombreCompleto}
                          requerido
                        />
                        <Campo
                          prefijo={`u-${u.id}`}
                          nombre="correoElectronico"
                          etiqueta="Correo"
                          tipo="email"
                          valor={u.correoElectronico}
                          requerido
                          ayuda={
                            tipoU === INVITADO.tipo
                              ? undefined
                              : 'Si lo cambias, la cuenta queda inactiva hasta verificar el código que llegará al correo nuevo.'
                          }
                        />
                        <Campo
                          prefijo={`u-${u.id}`}
                          nombre="fechaNacimiento"
                          etiqueta="Fecha de nacimiento"
                          tipo="date"
                          valor={u.fechaNacimiento ?? ''}
                          opcional
                        />
                        {(tipoU === 'ADMINISTRADOR' || tipoU === 'VIGILANTE') && (
                          <>
                            <Campo
                              prefijo={`u-${u.id}`}
                              nombre="inicioContrato"
                              etiqueta="Inicio del contrato"
                              tipo="date"
                              valor={u.inicioContrato ?? ''}
                              requerido
                            />
                            <Campo
                              prefijo={`u-${u.id}`}
                              nombre="venceContrato"
                              etiqueta="Vencimiento del contrato"
                              tipo="date"
                              valor={u.venceContrato ?? ''}
                              requerido
                            />
                          </>
                        )}
                        {tipoU === INVITADO.tipo && (
                          <Campo
                            prefijo={`u-${u.id}`}
                            nombre="venceAutorizacion"
                            etiqueta="Vence la autorización"
                            tipo="date"
                            valor={u.venceAutorizacion ?? ''}
                            opcional
                            ayuda="Vacío = autorización permanente."
                          />
                        )}
                      </Editar>
                      <Eliminar
                        titulo={`Eliminar a ${u.nombreCompleto}`}
                        accion={eliminarCuenta.bind(null, u.identificacion)}
                        ariaLabel={`Eliminar la cuenta de ${u.nombreCompleto}`}
                        efectos="Se borran con la cuenta su auto y sus reservas. Sus invitados, comunicados e inmuebles siguen existiendo; solo pierden el vínculo. No puedes eliminar tu propia cuenta ni a un administrador que haya creado reglas de reserva."
                      />
                      </div>
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
