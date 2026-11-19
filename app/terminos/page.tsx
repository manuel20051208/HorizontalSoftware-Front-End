import type { Metadata } from 'next'
import Link from 'next/link'
import { CORREO_CONTACTO, DocumentoLegal } from '@/components/legal/documento-legal'

export const metadata: Metadata = {
  title: 'Condiciones del servicio',
  description: 'Reglas de uso de habita., la plataforma de gestión del conjunto residencial.',
}

/** Pública: no pasa por proxy.ts (su matcher solo cubre el ingreso y los módulos). */
export default function TerminosPage() {
  return (
    <DocumentoLegal titulo="Condiciones del servicio">
      <p>
        Estas condiciones regulan el uso de habita., la plataforma de gestión para conjuntos residenciales en propiedad
        horizontal. Al ingresar y usar la plataforma aceptas estas condiciones y la{' '}
        <Link href="/privacidad">Política de privacidad</Link>.
      </p>

      <h2>1. Proyecto académico</h2>
      <p>
        habita. es un proyecto académico desarrollado por estudiantes de Ingeniería de Software de la Universidad Simón
        Bolívar (Colombia). Se ofrece con fines educativos y de demostración, sin ánimo de lucro, y puede cambiar,
        interrumpirse o dejar de prestarse en cualquier momento.
      </p>

      <h2>2. Cuentas y roles</h2>
      <p>Las cuentas las crea la administración del conjunto. Cada cuenta tiene un rol:</p>
      <ul>
        <li>
          <strong>Administrador:</strong> gestiona residentes, pagos, reservas, comunicados y reportes del conjunto.
        </li>
        <li>
          <strong>Residente:</strong> consulta y paga su administración, reserva zonas comunes, recibe notificaciones y
          autoriza a sus invitados.
        </li>
        <li>
          <strong>Vigilante:</strong> registra la entrada y salida de visitantes y vehículos.
        </li>
      </ul>
      <p>
        Eres responsable de mantener tu contraseña en secreto y de la actividad que ocurra con tu cuenta. Si crees que
        alguien más la usa, cambia la contraseña y avisa a la administración.
      </p>

      <h2>3. Uso aceptable</h2>
      <p>Al usar habita. te comprometes a:</p>
      <ul>
        <li>Dar información verdadera y mantenerla actualizada.</li>
        <li>Usar solo las funciones de tu rol y no intentar acceder a información de otros usuarios.</li>
        <li>No interferir con el funcionamiento del servicio ni intentar vulnerar su seguridad.</li>
        <li>No usar la plataforma para enviar contenido ofensivo, ilegal o publicidad no solicitada.</li>
        <li>Registrar datos de visitantes solo con la finalidad de controlar el acceso al conjunto.</li>
      </ul>
      <p>La administración puede suspender o desactivar las cuentas que incumplan estas reglas.</p>

      <h2>4. Pagos</h2>
      <p>
        Los pagos en línea los procesa <strong>Wompi</strong>, una pasarela de pagos de terceros, bajo sus propios
        términos. habita. no guarda datos de tarjetas ni claves bancarias. Un pago se refleja en la plataforma cuando
        Wompi confirma la transacción. Los reclamos sobre cobros, reversos o devoluciones se tramitan con la
        administración del conjunto y, si corresponde, con Wompi o tu entidad financiera.
      </p>

      <h2>5. Correos y notificaciones</h2>
      <p>
        La plataforma envía correos de servicio (notificaciones del conjunto, comprobantes y recuperación de
        contraseña) desde una cuenta de Gmail del proyecto mediante la API de Gmail, con permiso solo para enviar
        mensajes.
      </p>

      <h2>6. Limitación de responsabilidad</h2>
      <p>
        habita. se ofrece «tal como está» y «según disponibilidad», sin garantías de funcionamiento ininterrumpido o
        libre de errores. En la medida que lo permita la ley, los desarrolladores y la Universidad Simón Bolívar no
        responden por daños derivados del uso o la imposibilidad de usar la plataforma, por pérdida de información, ni
        por fallas de servicios de terceros como Wompi o Google. La información de pagos y accesos registrada en
        habita. no reemplaza los registros oficiales de la administración del conjunto.
      </p>

      <h2>7. Cambios a las condiciones</h2>
      <p>
        Podemos actualizar estas condiciones. La versión vigente siempre estará en esta página con su fecha de
        actualización. Si sigues usando la plataforma después de un cambio, entendemos que lo aceptas.
      </p>

      <h2>8. Ley aplicable</h2>
      <p>Estas condiciones se rigen por las leyes de la República de Colombia.</p>

      <h2>9. Contacto</h2>
      <p>
        Si tienes preguntas sobre estas condiciones, escribe a{' '}
        <a href={`mailto:${CORREO_CONTACTO}`}>{CORREO_CONTACTO}</a>.
      </p>
    </DocumentoLegal>
  )
}
