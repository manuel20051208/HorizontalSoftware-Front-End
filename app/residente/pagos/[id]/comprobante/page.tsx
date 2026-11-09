import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Encabezado, EstadoResultado } from '@/components/gestion/piezas'
import styles from '@/components/gestion/gestion.module.css'
import type { Comprobante } from '@/lib/api/tipos'
import { RUTAS_API } from '@/lib/auth/config'
import { apiConSesion, requerirSesion } from '@/lib/auth/sesion'

export const metadata: Metadata = { title: 'Comprobante de pago' }

type Props = { params: Promise<{ id: string }> }

export default async function ComprobanteResidentePage({ params }: Props) {
  await requerirSesion('residente')
  const { id } = await params
  const pagoId = Number(id)
  if (!Number.isSafeInteger(pagoId) || pagoId <= 0) notFound()

  const r = await apiConSesion<Comprobante>('residente', RUTAS_API.comprobante(pagoId), { metodo: 'GET' })
  if (!r.ok && r.status === 404) notFound()

  return (
    <div className={styles.pagina}>
      <Encabezado
        titulo="Comprobante de pago"
        descripcion="Documento generado para tus pagos aprobados o reembolsados."
        volverHref="/residente/pagos"
        volverTexto="Mis pagos"
      />
      {!r.ok ? (
        <EstadoResultado resultado={r} porDefecto="No se pudo generar el comprobante." />
      ) : (
        <section className="hoja" style={{ padding: '1.5rem' }}>
          <p className={styles.etiqueta}>Referencia {r.datos.referencia}</p>
          <pre
            style={{
              marginTop: '1rem',
              whiteSpace: 'pre-wrap',
              overflowWrap: 'anywhere',
              fontFamily: 'var(--font-voz)',
              fontSize: '1rem',
              lineHeight: 1.6,
            }}
          >
            {r.datos.comprobante}
          </pre>
        </section>
      )}
    </div>
  )
}
