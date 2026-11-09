'use client'

import {
  Check,
  CircleAlert,
  ClipboardList,
  Copy,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useActionState, useEffect, useRef, useState } from 'react'
import { Chip } from '@/components/ui/chip'
import { type CampoCuenta, crearCuenta, type EstadoCrear } from '@/lib/usuarios/acciones'
import { type Inmueble, TIPOS_CUENTA, type TipoCuenta } from '@/lib/usuarios/tipos'
import styles from './usuarios.module.css'

const OPCIONES: { tipo: TipoCuenta; icono: LucideIcon; descripcion: string }[] = [
  { tipo: 'RESIDENTE', icono: KeyRound, descripcion: 'Vive en un apartamento del conjunto.' },
  { tipo: 'VIGILANTE', icono: ShieldCheck, descripcion: 'Trabaja en la portería, con contrato.' },
  { tipo: 'ADMINISTRADOR', icono: ClipboardList, descripcion: 'Gestiona el conjunto, con contrato.' },
]

// Mismo alfabeto que GeneradorContrasena del backend: sin 0/O ni 1/l/I, que se confunden al dictarlas
const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const NUMEROS = '23456789'

function generarContrasena() {
  const todo = LETRAS + NUMEROS
  const azar = crypto.getRandomValues(new Uint32Array(24))
  const c = [LETRAS[azar[0] % LETRAS.length], NUMEROS[azar[1] % NUMEROS.length]]
  for (let i = 2; i < 12; i++) c.push(todo[azar[i] % todo.length])
  for (let i = c.length - 1; i > 0; i--) {
    const j = azar[12 + i] % (i + 1)
    ;[c[i], c[j]] = [c[j], c[i]]
  }
  return c.join('')
}

/** Alta de cuentas: solo la administración crea usuarios; nadie se registra por su cuenta. */
export function NuevaCuentaForm({
  inmuebles,
  tipoInicial,
  hoy,
}: {
  /** null = no se pudieron cargar */
  inmuebles: Inmueble[] | null
  tipoInicial: TipoCuenta
  hoy: string
}) {
  const [estado, enviar, enviando] = useActionState(crearCuenta, undefined)
  const [descartado, setDescartado] = useState<EstadoCrear>(undefined)
  const [tipo, setTipo] = useState<TipoCuenta>(tipoInicial)
  const [contrasena, setContrasena] = useState('')
  const [formulario, setFormulario] = useState(0)
  const formRef = useRef<HTMLFormElement>(null)

  const errores = estado?.estado === 'error' ? estado.errores : {}
  const valores = estado?.estado === 'error' ? estado.valores : {}

  // Tras un error, el foco va al primer campo por corregir
  useEffect(() => {
    if (estado?.estado === 'error') {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
    }
  }, [estado])

  if (estado?.estado === 'creada' && estado !== descartado) {
    return (
      <CuentaCreada
        cuenta={estado}
        onOtra={() => {
          setDescartado(estado)
          setContrasena('')
          setFormulario((n) => n + 1)
        }}
      />
    )
  }

  /** id, name y la relación con su mensaje de error o de ayuda */
  const campo = (nombre: CampoCuenta, conAyuda = false) => ({
    id: nombre,
    name: nombre,
    'aria-invalid': errores[nombre] ? true : undefined,
    'aria-describedby': errores[nombre] ? `${nombre}-error` : conAyuda ? `${nombre}-ayuda` : undefined,
  })

  return (
    <form key={formulario} ref={formRef} action={enviar} className={`hoja ${styles.formulario}`} noValidate>
      <fieldset className={styles.seccion}>
        <legend className={`t-section ${styles.leyenda}`}>Tipo de cuenta</legend>
        <div className={styles.tipos}>
          {OPCIONES.map(({ tipo: t, icono: Icono, descripcion }) => (
            <label key={t} className={styles.tipo}>
              <input
                type="radio"
                name="tipoUsuario"
                value={t}
                checked={tipo === t}
                onChange={() => setTipo(t)}
                className={styles.radio}
              />
              <Icono className={styles.tipoIcono} aria-hidden="true" strokeWidth={1.75} />
              <span>
                <span className={styles.tipoNombre}>{TIPOS_CUENTA[t].nombre}</span>
                <span className={styles.tipoDescripcion}>{descripcion}</span>
              </span>
              <Check className={styles.marca} aria-hidden="true" strokeWidth={2.6} />
            </label>
          ))}
        </div>
        <MensajeCampo nombre="tipoUsuario" error={errores.tipoUsuario} />
      </fieldset>

      <fieldset className={styles.seccion}>
        <legend className={`t-section ${styles.leyenda}`}>Datos de la persona</legend>
        <div className={styles.rejilla}>
          <div className={`${styles.grupo} ${styles.ancho}`}>
            <label htmlFor="nombreCompleto" className={styles.etiqueta}>
              Nombre completo
            </label>
            <input
              {...campo('nombreCompleto')}
              className={styles.entrada}
              autoComplete="off"
              maxLength={150}
              defaultValue={valores.nombreCompleto}
            />
            <MensajeCampo nombre="nombreCompleto" error={errores.nombreCompleto} />
          </div>

          <div className={styles.grupo}>
            <label htmlFor="identificacion" className={styles.etiqueta}>
              Número de documento
            </label>
            <input
              {...campo('identificacion', true)}
              className={styles.entrada}
              inputMode="numeric"
              autoComplete="off"
              maxLength={15}
              defaultValue={valores.identificacion}
            />
            <MensajeCampo nombre="identificacion" error={errores.identificacion} ayuda="Cédula, sin puntos." />
          </div>

          <div className={styles.grupo}>
            <label htmlFor="fechaNacimiento" className={styles.etiqueta}>
              Fecha de nacimiento <span className={styles.opcional}>(opcional)</span>
            </label>
            <input
              {...campo('fechaNacimiento')}
              type="date"
              className={styles.entrada}
              max={hoy}
              defaultValue={valores.fechaNacimiento}
            />
            <MensajeCampo nombre="fechaNacimiento" error={errores.fechaNacimiento} />
          </div>

          <div className={`${styles.grupo} ${styles.ancho}`}>
            <label htmlFor="correoElectronico" className={styles.etiqueta}>
              Correo
            </label>
            <input
              {...campo('correoElectronico', true)}
              type="email"
              inputMode="email"
              className={styles.entrada}
              autoComplete="off"
              spellCheck={false}
              defaultValue={valores.correoElectronico}
            />
            <MensajeCampo
              nombre="correoElectronico"
              error={errores.correoElectronico}
              ayuda="Con este correo iniciará sesión."
            />
          </div>
        </div>
      </fieldset>

      {tipo === 'RESIDENTE' ? (
        <fieldset className={styles.seccion}>
          <legend className={`t-section ${styles.leyenda}`}>Vivienda</legend>
          <div className={styles.rejilla}>
            <div className={styles.grupo}>
              <label htmlFor="inmuebleId" className={styles.etiqueta}>
                Apartamento
              </label>
              <select
                {...campo('inmuebleId', !inmuebles?.length)}
                className={styles.entrada}
                defaultValue={valores.inmuebleId ?? ''}
                disabled={!inmuebles?.length}
              >
                <option value="">Elige el apartamento</option>
                {inmuebles?.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.direccionInmueble}
                  </option>
                ))}
              </select>
              <MensajeCampo
                nombre="inmuebleId"
                error={errores.inmuebleId}
                ayuda={
                  inmuebles === null
                    ? 'No se pudieron cargar los apartamentos. Recarga la página.'
                    : inmuebles.length === 0
                      ? 'Aún no hay apartamentos registrados.'
                      : undefined
                }
              />
            </div>
          </div>
        </fieldset>
      ) : (
        <fieldset className={styles.seccion}>
          <legend className={`t-section ${styles.leyenda}`}>Contrato</legend>
          <div className={styles.rejilla}>
            <div className={styles.grupo}>
              <label htmlFor="inicioContrato" className={styles.etiqueta}>
                Inicio
              </label>
              <input
                {...campo('inicioContrato')}
                type="date"
                className={styles.entrada}
                defaultValue={valores.inicioContrato}
              />
              <MensajeCampo nombre="inicioContrato" error={errores.inicioContrato} />
            </div>
            <div className={styles.grupo}>
              <label htmlFor="venceContrato" className={styles.etiqueta}>
                Vence
              </label>
              <input
                {...campo('venceContrato')}
                type="date"
                className={styles.entrada}
                defaultValue={valores.venceContrato}
              />
              <MensajeCampo nombre="venceContrato" error={errores.venceContrato} />
            </div>
          </div>
        </fieldset>
      )}

      <fieldset className={styles.seccion}>
        <legend className={`t-section ${styles.leyenda}`}>Acceso</legend>
        <div className={styles.rejilla}>
          <div className={`${styles.grupo} ${styles.ancho}`}>
            <label htmlFor="contrasena" className={styles.etiqueta}>
              Contraseña inicial
            </label>
            <div className={styles.clave}>
              <input
                {...campo('contrasena', true)}
                className={`${styles.entrada} ${styles.claveEntrada}`}
                autoComplete="new-password"
                spellCheck={false}
                autoCapitalize="off"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
              />
              <button type="button" className="btn" data-variant="secondary" onClick={() => setContrasena(generarContrasena())}>
                <RefreshCw aria-hidden="true" />
                Generar
              </button>
            </div>
            <MensajeCampo
              nombre="contrasena"
              error={errores.contrasena}
              ayuda="Mínimo 8 caracteres, con letras y números. Se la entregarás a la persona."
            />
          </div>
        </div>
      </fieldset>

      {estado?.estado === 'error' && estado.mensaje && (
        <p className={styles.problema} role="alert">
          <CircleAlert aria-hidden="true" />
          <span>{estado.mensaje}</span>
        </p>
      )}

      <div className={styles.pie}>
        <button type="submit" className="btn" data-variant="primary" data-size="lg" disabled={enviando}>
          <UserPlus aria-hidden="true" />
          {enviando ? 'Creando…' : 'Crear cuenta'}
        </button>
        <Link href="/admin/usuarios" prefetch={false} className="btn" data-variant="quiet">
          Cancelar
        </Link>
      </div>
    </form>
  )
}

function MensajeCampo({ nombre, error, ayuda }: { nombre: CampoCuenta; error?: string; ayuda?: string }) {
  if (error) {
    return (
      <p id={`${nombre}-error`} className={styles.errorCampo}>
        <CircleAlert aria-hidden="true" />
        {error}
      </p>
    )
  }
  if (ayuda) {
    return (
      <p id={`${nombre}-ayuda`} className={styles.ayudaCampo}>
        {ayuda}
      </p>
    )
  }
  return null
}

function CuentaCreada({
  cuenta,
  onOtra,
}: {
  cuenta: Extract<EstadoCrear, { estado: 'creada' }>
  onOtra: () => void
}) {
  const [copiado, setCopiado] = useState(false)
  const ref = useRef<HTMLElement>(null)
  const modulo = TIPOS_CUENTA[cuenta.tipo].nombre

  useEffect(() => ref.current?.focus(), [])

  function copiar() {
    const texto = `Torres del Parque · módulo ${modulo}\nCorreo: ${cuenta.correo}\nContraseña: ${cuenta.contrasena}`
    navigator.clipboard
      ?.writeText(texto)
      .then(() => setCopiado(true))
      .catch(() => {})
  }

  return (
    <section ref={ref} tabIndex={-1} className={`hoja ${styles.exito}`} aria-labelledby="exito-titulo">
      <Chip tono="ok" icono={Check}>
        Cuenta creada
      </Chip>
      <h2 id="exito-titulo" className={`t-voz ${styles.exitoNombre}`}>
        {cuenta.nombre}
      </h2>
      <p className="t-nota">Entrégale estos datos para que ingrese por el módulo {modulo}.</p>

      <dl className={styles.credenciales}>
        <div>
          <dt>Correo</dt>
          <dd>{cuenta.correo}</dd>
        </div>
        <div>
          <dt>Contraseña inicial</dt>
          <dd className={styles.claveTexto}>{cuenta.contrasena}</dd>
        </div>
      </dl>

      <p className={styles.activacion}>
        {cuenta.activa
          ? 'La cuenta ya está activa: puede ingresar ahora.'
          : cuenta.tipo === 'ADMINISTRADOR'
            ? 'La cuenta se creó, pero no se pudo activar. Intenta activarla más tarde.'
            : 'La cuenta se creó, pero no se pudo activar. Actívala desde la lista de usuarios.'}
      </p>

      <div className={styles.exitoAcciones}>
        <button type="button" className="btn" data-variant="secondary" onClick={copiar}>
          {copiado ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          <span aria-live="polite">{copiado ? 'Datos copiados' : 'Copiar datos'}</span>
        </button>
        <button type="button" className="btn" data-variant="secondary" onClick={onOtra}>
          <UserPlus aria-hidden="true" />
          Crear otra cuenta
        </button>
        <Link href="/admin/usuarios" prefetch={false} className="btn" data-variant="primary">
          Ver usuarios
        </Link>
      </div>
    </section>
  )
}
