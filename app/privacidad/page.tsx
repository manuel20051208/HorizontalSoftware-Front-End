import type { Metadata } from 'next'
import { CORREO_CONTACTO, DocumentoLegal } from '@/components/legal/documento-legal'

export const metadata: Metadata = {
  title: 'Política de privacidad',
  description: 'Qué datos guarda habita., para qué los usa y cómo ejercer tus derechos.',
}

/** Pública: no pasa por proxy.ts (su matcher solo cubre el ingreso y los módulos). */
export default function PrivacidadPage() {
  return (
    <DocumentoLegal titulo="Política de privacidad">
      <p>
        habita. es una plataforma de gestión para conjuntos residenciales en propiedad horizontal: pagos de
        administración, reservas de zonas comunes, notificaciones y control de visitantes. Esta política explica qué
        datos personales tratamos, para qué, con quién los compartimos y cómo puedes ejercer tus derechos, conforme a la
        Ley 1581 de 2012 y el Decreto 1377 de 2013 de Colombia.
      </p>

      <h2>1. Responsable del tratamiento</h2>
      <p>
        habita. es un proyecto académico desarrollado por estudiantes de Ingeniería de Software de la Universidad Simón
        Bolívar (Colombia). Para cualquier asunto de privacidad puedes escribir a{' '}
        <a href={`mailto:${CORREO_CONTACTO}`}>{CORREO_CONTACTO}</a>.
      </p>

      <h2>2. Qué datos guardamos</h2>
      <ul>
        <li>
          <strong>Datos de la cuenta:</strong> nombre, correo electrónico, número de documento, rol (administrador,
          residente o vigilante) y la contraseña, guardada solo como hash cifrado.
        </li>
        <li>
          <strong>Datos del inmueble:</strong> torre y apartamento asociados al residente.
        </li>
        <li>
          <strong>Pagos:</strong> conceptos, valores, fechas y estado de los pagos de administración. Los pagos los
          procesa Wompi; habita. no recibe ni guarda números de tarjeta ni claves bancarias, solo la referencia y el
          resultado de la transacción.
        </li>
        <li>
          <strong>Registro de visitantes:</strong> nombre y documento del visitante, apartamento que visita, placa del
          vehículo si aplica, y fecha y hora de entrada y salida, registrados por la vigilancia.
        </li>
        <li>
          <strong>Uso del servicio:</strong> reservas, notificaciones enviadas y preferencias de la cuenta.
        </li>
      </ul>

      <h2>3. Para qué los usamos</h2>
      <ul>
        <li>Identificarte e iniciar sesión según tu rol.</li>
        <li>Administrar los pagos, las reservas y el acceso de visitantes del conjunto.</li>
        <li>Enviarte notificaciones del conjunto, comprobantes y avisos de tu cuenta.</li>
        <li>Recuperar tu contraseña cuando lo solicites.</li>
        <li>Mantener la seguridad del servicio y la trazabilidad de los accesos.</li>
      </ul>
      <p>No vendemos tus datos ni los usamos para publicidad.</p>

      <h2>4. Uso del correo electrónico y de Gmail</h2>
      <p>
        Tu correo se usa únicamente para enviarte mensajes relacionados con el servicio: notificaciones del conjunto,
        comprobantes y recuperación de contraseña. Los correos salen desde una cuenta de Gmail del proyecto mediante la
        API de Gmail, con el permiso <code>gmail.send</code>, que solo permite enviar mensajes. habita. no lee, busca,
        modifica ni elimina correos de ningún buzón, ni accede a tu cuenta de Google.
      </p>
      <p>
        El uso que hace habita. de la información recibida de las API de Google se ajusta a la{' '}
        <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer">
          Política de datos de usuario de los servicios de API de Google
        </a>
        , incluidos los requisitos de uso limitado.
      </p>

      <h2>5. Con quién los compartimos</h2>
      <ul>
        <li>
          <strong>Wompi</strong> (Bancolombia), para procesar los pagos en línea. Wompi trata los datos de pago bajo su
          propia política de privacidad.
        </li>
        <li>
          <strong>Google</strong>, como proveedor del envío de correos a través de la API de Gmail.
        </li>
        <li>
          <strong>La administración del conjunto</strong>, que ve la información necesaria para gestionar pagos,
          reservas y accesos.
        </li>
        <li>Autoridades competentes, solo cuando una ley o una orden judicial lo exija.</li>
      </ul>

      <h2>6. Conservación</h2>
      <p>
        Guardamos los datos mientras tu cuenta esté activa y el tiempo necesario para cumplir las finalidades descritas.
        Cuando una cuenta se desactiva o se solicita su supresión, eliminamos o anonimizamos sus datos, salvo los que
        deban conservarse por una obligación legal o contable.
      </p>

      <h2>7. Seguridad</h2>
      <p>
        La comunicación con el servicio va cifrada por HTTPS, las contraseñas se guardan con hash, las sesiones usan
        tokens de corta duración y cada rol solo ve la información que le corresponde. Ningún sistema es infalible,
        pero aplicamos medidas razonables para proteger tus datos contra acceso, pérdida o uso no autorizado.
      </p>

      <h2>8. Tus derechos</h2>
      <p>Como titular de los datos, según la Ley 1581 de 2012, puedes:</p>
      <ul>
        <li>Conocer, actualizar y rectificar tus datos personales.</li>
        <li>Pedir prueba de la autorización que nos diste.</li>
        <li>Saber qué uso se ha dado a tus datos.</li>
        <li>Revocar la autorización o pedir la supresión de tus datos cuando no exista un deber legal de conservarlos.</li>
        <li>Presentar quejas ante la Superintendencia de Industria y Comercio.</li>
        <li>Acceder gratuitamente a tus datos.</li>
      </ul>
      <p>
        Para ejercerlos, escribe a <a href={`mailto:${CORREO_CONTACTO}`}>{CORREO_CONTACTO}</a>. Responderemos las
        consultas en un máximo de 10 días hábiles y los reclamos en un máximo de 15 días hábiles.
      </p>

      <h2>9. Cambios a esta política</h2>
      <p>
        Si cambiamos esta política, publicaremos la nueva versión en esta página con su fecha de actualización. Si el
        cambio es importante, también lo avisaremos dentro de la plataforma.
      </p>
    </DocumentoLegal>
  )
}
