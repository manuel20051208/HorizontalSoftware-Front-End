import type { Metadata } from 'next'
import Link from 'next/link'
import { FormularioAccion } from '@/components/gestion/acciones-cliente'
import { Campo } from '@/components/gestion/campos'
import { Encabezado } from '@/components/gestion/piezas'
import styles from '@/components/gestion/gestion.module.css'
import { crearInmueble } from '@/lib/admin/acciones'
import { requerirSesion } from '@/lib/auth/sesion'

export const metadata: Metadata = { title: 'Nuevo inmueble' }

export default async function NuevoInmueblePage() {
  await requerirSesion('admin')

  return (
    <div className={styles.pagina}>
      <Encabezado
        titulo="Nuevo inmueble"
        descripcion="La dirección identifica la torre y el apartamento, por ejemplo A-302. Al crearlo, el inmueble queda con las zonas comunes activas."
        volverHref="/admin/inmuebles"
        volverTexto="Inmuebles"
      />

      <FormularioAccion
        accion={crearInmueble}
        texto="Crear inmueble"
        textoEnviando="Creando…"
        className={styles.formularioEstrecho}
        pie={
          <Link href="/admin/inmuebles" prefetch={false} className="btn" data-variant="quiet">
            Cancelar
          </Link>
        }
      >
        <div className={styles.rejilla}>
          <Campo
            nombre="direccionInmueble"
            etiqueta="Dirección"
            tipo="text"
            placeholder="A-302"
            maxLength={100}
            requerido
            ancho
            ayuda="Formato TORRE-APTO. Se guarda en mayúsculas."
          />
          <Campo
            nombre="valorParqueadero"
            etiqueta="Valor del parqueadero"
            tipo="number"
            min={0}
            step="any"
            opcional
            inputMode="decimal"
            ayuda="Si el inmueble tiene parqueadero, este valor se suma a la liquidación."
          />
        </div>
      </FormularioAccion>
    </div>
  )
}
