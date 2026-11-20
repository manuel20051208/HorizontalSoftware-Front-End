'use client'

import { Pencil, Trash2 } from 'lucide-react'
import { useActionState } from 'react'
import { Popover, useCerrarAlTerminar, useCerrarPopover } from '@/components/modules/usuarios/popover'
import u from '@/components/modules/usuarios/usuarios.module.css'
import type { EstadoAccion } from '@/lib/api/acciones'
import { Mensaje } from './acciones-cliente'

type AccionFormulario = (previo: EstadoAccion, datos: FormData) => Promise<EstadoAccion>
type AccionBoton = (previo: EstadoAccion) => Promise<EstadoAccion>

function FormularioEditar({
  accion,
  textoGuardar,
  children,
}: {
  accion: AccionFormulario
  textoGuardar: string
  children: React.ReactNode
}) {
  const [estado, enviar, enviando] = useActionState(accion, undefined)
  const cerrar = useCerrarPopover()
  useCerrarAlTerminar(estado)

  return (
    <form action={enviar} className={u.popoverForm} noValidate>
      {children}
      <Mensaje estado={estado} />
      <div className={u.popoverAcciones}>
        <button type="button" className="btn" data-variant="quiet" data-size="sm" onClick={cerrar}>
          Cancelar
        </button>
        <button type="submit" className="btn" data-variant="primary" data-size="sm" disabled={enviando}>
          {enviando ? 'Guardando…' : textoGuardar}
        </button>
      </div>
    </form>
  )
}

/**
 * «Editar» un registro: botón que abre un panel flotante con el formulario ya lleno. Al guardar bien se cierra
 * y la página muestra el cambio (la Server Action revalida la ruta).
 */
export function Editar({
  titulo,
  accion,
  children,
  boton = 'Editar',
  textoGuardar = 'Guardar',
  alinear = 'fin',
  ariaLabel,
}: {
  titulo: string
  accion: AccionFormulario
  children: React.ReactNode
  boton?: string
  textoGuardar?: string
  alinear?: 'inicio' | 'fin'
  ariaLabel?: string
}) {
  return (
    <Popover
      boton={
        <>
          <Pencil aria-hidden="true" />
          {boton}
        </>
      }
      ariaLabel={ariaLabel}
      titulo={titulo}
      variante="quiet"
      alinear={alinear}
      ancho="amplio"
    >
      <FormularioEditar accion={accion} textoGuardar={textoGuardar}>
        {children}
      </FormularioEditar>
    </Popover>
  )
}

function ConfirmarEliminar({
  accion,
  efectos,
  textoConfirmar,
}: {
  accion: AccionBoton
  efectos: React.ReactNode
  textoConfirmar: string
}) {
  const [estado, enviar, enviando] = useActionState(accion, undefined)
  const cerrar = useCerrarPopover()
  useCerrarAlTerminar(estado)

  return (
    <form action={enviar} className={u.popoverForm}>
      <p className={u.popoverAyuda}>{efectos}</p>
      <Mensaje estado={estado} />
      <div className={u.popoverAcciones}>
        <button type="button" className="btn" data-variant="quiet" data-size="sm" onClick={cerrar}>
          Cancelar
        </button>
        <button
          type="submit"
          className={`btn ${u.btnPeligro}`}
          data-variant="primary"
          data-size="sm"
          disabled={enviando}
        >
          {enviando ? 'Eliminando…' : textoConfirmar}
        </button>
      </div>
    </form>
  )
}

/**
 * «Eliminar» con confirmación dentro del panel (nada de window.confirm). `efectos` explica qué se borra con el
 * registro y qué sigue existiendo. Si el back responde 409 (p. ej. «tiene reservas»), el mensaje se ve ahí.
 */
export function Eliminar({
  titulo,
  accion,
  efectos,
  boton = 'Eliminar',
  textoConfirmar = 'Sí, eliminar',
  alinear = 'fin',
  ariaLabel,
}: {
  titulo: string
  accion: AccionBoton
  efectos: React.ReactNode
  boton?: string
  textoConfirmar?: string
  alinear?: 'inicio' | 'fin'
  ariaLabel?: string
}) {
  return (
    <Popover
      boton={
        <>
          <Trash2 aria-hidden="true" />
          {boton}
        </>
      }
      ariaLabel={ariaLabel}
      titulo={titulo}
      variante="quiet"
      alinear={alinear}
    >
      <ConfirmarEliminar accion={accion} efectos={efectos} textoConfirmar={textoConfirmar} />
    </Popover>
  )
}
