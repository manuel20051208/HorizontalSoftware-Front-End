# ENDPOINTS - API de Torres del Parque

Contrato entre el backend (`HorizontalSoftware-Back-End`, Spring Boot) y el front-end (`software-residencial`, Next.js).

- **URL base:** `http://localhost:8080` (puerto por defecto de Spring). Todas las rutas empiezan por `/api`.
- **CORS:** el origen permitido es `http://localhost:3000` (`app.cors.allowed-origins`). Headers permitidos: `Authorization`, `Content-Type`, `X-Api-Key`.
- **Formato:** JSON. Fechas `yyyy-MM-dd`, horas `HH:mm` (o `HH:mm:ss`), fecha y hora `yyyy-MM-ddTHH:mm:ss` (ISO, **hora de Colombia**, sin zona horaria). Dinero como número decimal (COP).

## 1. Autenticación (OAuth2 + refresh token)

El backend es un servidor de recursos con JWT. Todo endpoint, salvo los marcados **Público**, exige el header:

```
Authorization: Bearer <access_token>
```

| Token | Duración | Uso |
|---|---|---|
| `access_token` | 15 min | Autentica cada petición |
| `refresh_token` | 7 días | Solo sirve para `POST /api/auth/refresh` |

**Rotación:** cada refresh devuelve un par nuevo e invalida el refresh anterior. Si se reutiliza un refresh ya rotado o revocado, la sesión se cierra por seguridad (hay que volver a hacer login).

**Flujo recomendado en el front:** guardar ambos tokens; ante un `401` hacer un único refresh y reintentar la petición; si el refresh falla, ir al login.

### Roles
`ADMINISTRADOR`, `RESIDENTE`, `VIGILANTE`. Cada endpoint declara su rol en la columna **Acceso**. Los invitados no inician sesión.

| Acceso | Significado |
|---|---|
| Público | Sin token |
| Autenticado | Cualquier usuario con sesión |
| ADMIN / RESIDENTE / VIGILANTE | Solo ese rol |
| ADMIN o RESIDENTE, ADMIN o VIGILANTE | Cualquiera de los dos |

## 2. Errores

Todos los errores tienen esta forma (`errores` solo aparece en validaciones):

```json
{
  "timestamp": "2026-11-08T15:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "mensaje": "Descripción legible para mostrar al usuario",
  "errores": { "campo": "mensaje de validación" }
}
```

| Status | Cuándo |
|---|---|
| 400 | Cuerpo inválido, parámetro faltante o regla de entrada no cumplida |
| 401 | Sin token, token vencido/inválido, credenciales incorrectas o firma del evento de la pasarela inválida |
| 403 | El rol no tiene permiso, o el recurso es de otro inmueble/usuario |
| 404 | El recurso no existe |
| 409 | Conflicto de estado (duplicado, pago en estado no válido, zona sin cupo, etc.) |
| 500 | Error inesperado |

### Paginación de listados

Todo endpoint que devuelve una lista está **paginado** (marcados `Pagina<T>` en las tablas). Parámetros de query, ambos opcionales:

| Parámetro | Por defecto | Regla |
|---|---|---|
| `pagina` | `0` | Empieza en **0**. Entero ≥ 0 |
| `tamano` | `20` | Entero de 1 a 100 |

Un valor fuera de rango o que no sea entero responde **400** (no se recorta en silencio). Pedir una página más allá del final devuelve `contenido` vacío con los totales correctos.

`Pagina<T>`:
```json
{
  "contenido": [ /* T */ ],
  "pagina": 0,
  "tamano": 20,
  "totalElementos": 137,
  "totalPaginas": 7
}
```
- El orden es estable entre páginas (cada listado desempata por `id`), así que una fila no se repite ni se salta al cambiar de página.
- `totalPaginas` es `0` cuando no hay filas.
- Los filtros propios de cada endpoint (`estado`, `inmuebleId`...) se combinan con la paginación: `totalElementos` cuenta solo lo filtrado.

## 3. Auth - `/api/auth`

| Método | Ruta | Acceso | Cuerpo | Respuesta |
|---|---|---|---|---|
| POST | `/api/auth/login` | Público | `{correo, contrasena}` | 200 `Sesion` |
| POST | `/api/auth/refresh` | Público | `{refreshToken}` | 200 `Sesion` |
| POST | `/api/auth/logout` | Autenticado | - | 204 (revoca el refresh) |
| POST | `/api/auth/activar` | Público | `{correo, contrasena}` | 200 `{active, mensaje}` |
| POST | `/api/auth/recuperar-contrasena` | Público | `{correo}` | 202 `{mensaje}` (igual exista o no el correo) |
| PUT | `/api/auth/contrasena` | Autenticado | `{contrasenaActual, contrasenaNueva}` | 204 |
| GET | `/api/auth/me` | Autenticado | - | 200 `Usuario` |

**Sesion** (los tokens van en snake_case, estándar OAuth2):
```json
{
  "access_token": "...", "token_type": "Bearer", "expires_in": 900,
  "refresh_token": "...",
  "usuario": { "id": 1, "identificacion": 1000000001, "nombreCompleto": "...", "correoElectronico": "...",
               "tipoUsuario": "ADMINISTRADOR", "active": true, "notificacionLeida": false,
               "fechaCreacionCuenta": "2026-11-08", "inmuebleId": null, "direccionInmueble": null }
}
```
> Nota: `refreshToken` va en camelCase en el cuerpo de `/refresh`, pero llega como `refresh_token` en la respuesta.

**Contraseña nueva:** mínimo 8 caracteres, con al menos una letra y un número.

## 4. Administrador

### 4.1 Panel y liquidaciones - `/api/admin`
| Método | Ruta | Cuerpo / parámetros | Respuesta |
|---|---|---|---|
| GET | `/api/admin/resumen?periodo=yyyy-MM-dd` | `periodo` opcional | 200 `ResumenAdmin` |
| POST | `/api/admin/liquidaciones` | `Generar` | 201 `Liquidacion` |
| POST | `/api/admin/liquidaciones/masiva` | `{periodo, fechaLimite?}` | 200 `{generadas, omitidas:[{inmuebleId, motivo}]}` |
| GET | `/api/admin/liquidaciones?inmuebleId=&estado=&periodo=&pagina=&tamano=` | filtros opcionales | 200 `Pagina<Liquidacion>` (periodo más reciente primero) |
| PATCH | `/api/admin/liquidaciones/{id}/mora` | - | 200 `Liquidacion` |
| PATCH | `/api/admin/liquidaciones/{id}/al-dia` | - | 200 `Liquidacion` |

Todos: **ADMIN**.

- `Generar`: `{inmuebleId, periodo, fechaLimite?, cuotaAdministracion?, valorServiciosComunes?}`. El `periodo` se normaliza al día 1; `fechaLimite` por defecto es el día 10; las tarifas por defecto se copian de la liquidación anterior.
- `Liquidacion`: `{id, inmuebleId, direccionInmueble, periodo, fechaGeneracion, fechaLimite, cuotaAdministracion, valorServiciosComunes, valorMultas, total, estado, vencida}`. `estado`: `PENDIENTE`, `AL_DIA`, `EN_MORA`.
- `ResumenAdmin`: `{periodo, totalInmuebles, alDia, porVencer, vencidas, sinLiquidacion, porCobrar, recaudoMes}`.
- Una tarea programada pasa a `EN_MORA` las liquidaciones vencidas sin pagar todos los días a las 00:05 (America/Bogota).

### 4.2 Inmuebles - `/api/admin/inmuebles` (todos **ADMIN**)
| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| POST | `/api/admin/inmuebles` | `{direccionInmueble, valorParqueadero?}` (formato `TORRE-APTO`, ej. `A-302`) | 201 `Detalle` |
| GET | `/api/admin/inmuebles?pagina=&tamano=` | - | 200 `Pagina<Resumen>` (por dirección) |
| GET | `/api/admin/inmuebles/{id}` | - | 200 `Detalle` |
| PUT | `/api/admin/inmuebles/{id}/tarifas` | `{cuotaAdministracion, valorServiciosComunes, valorParqueadero?}` | 200 `Liquidacion` |
| PUT | `/api/admin/inmuebles/{id}/multas` | `{valorMultas}` | 200 `Liquidacion` |
| PUT | `/api/admin/inmuebles/{id}/zonas-comunes` | `{zonaComunIds: [..]}` (no vacío) | 200 `Zona[]` |
| POST | `/api/admin/inmuebles/{id}/recordatorio-pago` | - | 201 `Notificacion` |
| POST | `/api/admin/inmuebles/{id}/conciliar-pago` | `{monto, metodoPago, referencia?}` | 201 `Pago` |

- `Resumen`: `{id, direccionInmueble, isActive, estadoPago, saldoPendiente, fechaLimitePendiente, valorParqueadero, totalLiquidaciones}`.
- `Detalle`: lo anterior más `nombresUsuarios`, `usuarios` (`Usuario[]`), `zonasComunes` (`Zona[]`) y `liquidacionVigente`.
- `estadoPago`: `AL_DIA`, `POR_VENCER`, `VENCIDA`, `SIN_LIQUIDACION`. `saldoPendiente` suma todas las liquidaciones que el inmueble no ha pagado.
- **Conciliar pago** (efectivo, transferencia...): el `monto` debe ser **igual** al saldo pendiente del inmueble; si no, 400. Queda `APROBADO` y deja al día el inmueble.

### 4.3 Usuarios - `/api/admin/usuarios` (todos **ADMIN**)
| Método | Ruta | Cuerpo / parámetros | Respuesta |
|---|---|---|---|
| POST | `/api/admin/usuarios` | `CrearUsuario` | 201 `Usuario` |
| GET | `/api/admin/usuarios?tipo=&active=&pagina=&tamano=` | filtros opcionales | 200 `Pagina<Usuario>` (por nombre) |
| PATCH | `/api/admin/usuarios/{identificacion}/activo` | - | 200 `{id, nombreCompleto, active}` (alterna activo/inactivo) |

`CrearUsuario`: `{tipoUsuario, identificacion, nombreCompleto, fechaNacimiento?, correoElectronico, contrasena, inmuebleId?, inicioContrato?, venceContrato?}`.
`tipoUsuario`: `ADMINISTRADOR`, `RESIDENTE` o `VIGILANTE`. `inmuebleId` es obligatorio para `RESIDENTE`; `inicioContrato` y `venceContrato` para `ADMINISTRADOR` y `VIGILANTE`.

### 4.4 Zonas comunes - `/api/admin/zonas-comunes` (todos **ADMIN**)
| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| POST | `/api/admin/zonas-comunes` | `{nombreZonaComun, capacidad, horaInicio, horaFin, aplicarATodosLosInmuebles?}` | 201 `Zona` |
| GET | `/api/admin/zonas-comunes?pagina=&tamano=` | - | 200 `Pagina<Zona>` (por nombre) |
| PATCH | `/api/admin/zonas-comunes/{id}/estado` | - | 200 `Zona` (alterna activa/inactiva) |

`Zona`: `{id, nombreZonaComun, capacidad, horaInicio, horaFin, isActive, reservasActuales}`. `aplicarATodosLosInmuebles` es `true` por defecto. `capacidad` es cuántas reservas puede tener la zona **al mismo tiempo**. `reservasActuales` cuenta las reservas que aún no terminan (programadas o en curso).

### 4.5 Reglas de reserva - `/api/admin` (todos **ADMIN**)
| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| POST | `/api/admin/reglas-reserva` | `CrearRegla` | 201 `Regla` |
| GET | `/api/admin/reglas-reserva?pagina=&tamano=` | - | 200 `Pagina<Regla>` |
| PUT | `/api/admin/reglas-reserva/{id}` | `{anticipacionMinimaHoras, duracionMaximaHoras}` | 200 `Regla` |
| PATCH | `/api/admin/rompimientos/{id}/aplicar` | - | 200 `Rompimiento` |
| PATCH | `/api/admin/rompimientos/{id}/inactivar` | - | 200 `Rompimiento` |

- `CrearRegla`: `{anticipacionMinimaHoras, duracionMaximaHoras, horasAntelacionPenalidad?, tarifaPenalidad?, zonaComunIds: [..], observaciones?}`.
- `Regla`: `{id, anticipacionMinimaHoras, duracionMaximaHoras, horasAntelacionPenalidad, tarifaPenalidad, adminId, zonas: Rompimiento[]}`.
- `Rompimiento` (asignación de una regla a una zona): `{id, zonaComunId, nombreZonaComun, reglaReservaId, fechaAplicacion, activa, observaciones}`.

### 4.6 Notificaciones - `/api/admin/notificaciones` (todos **ADMIN**)
| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| POST | `/api/admin/notificaciones` | `{mensaje, tipoNotificacion?, usuarioIds?, inmuebleId?}` | 201 `Notificacion` |
| GET | `/api/admin/notificaciones/{id}/lectura` | - | 200 `{notificacionId, leidos:[..], pendientes:[..]}` |

Destinatarios: `usuarioIds`, o `inmuebleId` (sus residentes activos). Si no se envía ninguno, la reciben todos los residentes activos. `tipoNotificacion` por defecto `GENERAL`. `leidos`/`pendientes` son `{usuarioId, nombreCompleto}`.

### 4.7 Pagos y pasarela - `/api/admin` (todos **ADMIN**)
| Método | Ruta | Cuerpo / parámetros | Respuesta |
|---|---|---|---|
| GET | `/api/admin/pagos?inmuebleId=&estado=&pagina=&tamano=` | filtros opcionales (más recientes primero) | 200 `Pagina<Pago>` |
| POST | `/api/admin/pagos/{id}/anular` | - | 200 `Pago` (solo `PENDIENTE`) |
| POST | `/api/admin/pagos/{id}/reembolso` | - | 200 `Pago` (solo `APROBADO`) |
| GET | `/api/admin/pasarela` | - | 200 `Pasarela` |
| PUT | `/api/admin/pasarela` | `{estado}` (`ACTIVA` o `INACTIVA`) | 200 `Pasarela` |

- `Pago`: `{id, inmuebleId, direccionInmueble, monto, fechaPago, concepto, metodoPago, estado, referencia}`.
- `estado` del pago: `PENDIENTE`, `APROBADO`, `RECHAZADO`, `ANULADO`, `REEMBOLSADO`.
- `Pasarela`: `{id, nombrePasarela, urlApi, apiKey, estado}`. **`apiKey` sale enmascarada** (solo los últimos 4 caracteres). `estado`: `ACTIVA` o `INACTIVA`.
- **Nombre, URLs y llaves se configuran solo en el `.env` del servidor** (`PASARELA_*`). Al arrancar, el back sincroniza la tabla con esos valores y conserva el `estado`. Por API solo se activa o desactiva la pasarela.
- Anular un pago que no está `PENDIENTE` o reembolsar uno que no está `APROBADO` devuelve 409. Reembolsar reabre la liquidación vigente y notifica al inmueble.

## 5. Residente - `/api/residente` (todos **RESIDENTE**)

### 5.1 Cuenta y pagos
| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| GET | `/api/residente/mi-cuenta` | - | 200 `EstadoCuenta` |
| GET | `/api/residente/pagos?pagina=&tamano=` | - | 200 `Pagina<Pago>` (historial del inmueble, más recientes primero) |
| POST | `/api/residente/pagos` | `{metodoPago}` | 201 `{pago, urlCheckout}` |
| GET | `/api/residente/pagos/{id}` | - | 200 `Pago` (403 si es de otro inmueble) |

- `EstadoCuenta`: `{inmuebleId, direccionInmueble, estadoPago, saldoPendiente, pazYSalvo, liquidacionVigente}`.
- **Pagar:** `metodoPago` es `PSE`, `TARJETA` o `NEQUI`. **El valor lo calcula el servidor** (saldo pendiente); el cliente nunca envía el monto. El pago nace `PENDIENTE` y el front debe **redirigir al residente a `urlCheckout`**. El resultado llega después por webhook (ver sección 8); el front puede consultarlo con `GET /api/pagos/estado/{referencia}`.
- Errores típicos: 403 cuenta inactiva; 409 sin saldo pendiente o pasarela mal configurada en el servidor (llaves o URLs faltantes, inválidas o de ambientes mezclados).

### 5.2 Invitados y auto
| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| GET | `/api/residente/invitados?pagina=&tamano=` | - | 200 `Pagina<Invitado>` (por nombre) |
| POST | `/api/residente/invitados` | `CrearInvitado` | 201 `Invitado` |
| PATCH | `/api/residente/invitados/{id}/estado` | - | 200 `{invitadoId, active}` (alterna) |
| PATCH | `/api/residente/invitados/estado` | `{invitadoIds: [..]}` | 200 `{cambios:[{invitadoId, active}]}` |
| GET | `/api/residente/auto` | - | 200 `Auto` |
| POST | `/api/residente/auto` | `{placa, parqueaderoId?}` | 201 `Auto` |

- `CrearInvitado`: `{identificacion, nombreCompleto, fechaNacimiento?, correoElectronico?, venceAutorizacion?}`. Sin `venceAutorizacion` la autorización es permanente.
- `Invitado`: `{id, identificacion, nombreCompleto, correoElectronico, active, venceAutorizacion, vigente}`. `vigente` = activo y autorización no vencida.
- `Auto`: `{id, duenoId, nombreDueno, placa, parqueaderoId, inmuebleId, direccionInmueble}`. La `placa` es numérica (así está en el diagrama de clases).

### 5.3 Zonas comunes y reservas
| Método | Ruta | Cuerpo / parámetros | Respuesta |
|---|---|---|---|
| GET | `/api/residente/zonas-comunes?pagina=&tamano=` | - | 200 `Pagina<Zona>` (las activas asignadas a su inmueble) |
| GET | `/api/residente/zonas-comunes/{id}/disponibilidad?inicio=&fin=` | `inicio` y `fin` obligatorios (`yyyy-MM-ddTHH:mm`) | 200 `Disponibilidad` |
| GET | `/api/residente/reservas?estado=&pagina=&tamano=` | `estado` opcional: `PROGRAMADA`, `EN_CURSO` o `FINALIZADA` | 200 `Pagina<Reserva>` (las suyas, la de inicio más reciente primero) |
| POST | `/api/residente/reservas` | `{zonaComunId, fechaHoraInicio, fechaHoraFin}` | 201 `Reserva` |
| DELETE | `/api/residente/reservas/{id}` | - | 204 (solo quien reservó y solo si está `PROGRAMADA`) |

Cada reserva ocupa un intervalo de fecha y hora: desde `fechaHoraInicio` (incluida) hasta `fechaHoraFin` (excluida), en **hora de Colombia**. Ejemplo:

```json
POST /api/residente/reservas
{ "zonaComunId": 3, "fechaHoraInicio": "2026-11-20T10:00:00", "fechaHoraFin": "2026-11-20T12:00:00" }
```

Los segundos se ignoran (se guarda al minuto).

- `Reserva`: `{id, zonaComunId, nombreZonaComun, fechaHoraInicio, fechaHoraFin, estado, enCurso, cancelable, duenoReservaId, nombreDueno, inmuebleId, direccionInmueble}`.
- **`estado`** lo calcula el servidor con la hora actual de Colombia, en cada respuesta (no se guarda):

  | `estado` | Cuándo | `cancelable` |
  |---|---|---|
  | `PROGRAMADA` | Aún no empieza | `true` |
  | `EN_CURSO` | Ya empezó y no ha terminado | `false` |
  | `FINALIZADA` | Ya terminó (desde `fechaHoraFin`) | `false` |

  `enCurso` es `true` si la reserva está `EN_CURSO` **y** la zona sigue activa. El front debe mostrar el `estado` tal cual (por ejemplo, la etiqueta **Finalizada**) y ofrecer el botón de cancelar solo si `cancelable` es `true`.
- `Disponibilidad`: `{zonaComunId, fechaHoraInicio, fechaHoraFin, horarioValido, cumpleReglas, hayCupo, habilitado, disponible, mensaje}`. Aplica **las mismas validaciones** que reservar, sin guardar nada. `disponible` es `true` solo si todas se cumplen; `mensaje` es `"Disponible"` o el primer motivo por el que no se puede.
- **Validaciones al reservar** (y al consultar disponibilidad), en este orden; la respuesta trae el primer motivo que falle:

  | # | Regla | Error |
  |---|---|---|
  | 1 | `fechaHoraFin` posterior a `fechaHoraInicio` (y ambos enviados) | 400 |
  | 2 | La reserva empieza en el futuro | 400 |
  | 3 | La zona está asignada a su inmueble y activa | 403 |
  | 4 | El residente está **habilitado**: cuenta activa, inmueble activo y sin mora | 403 |
  | 5 | Todo el intervalo cabe en el horario de la zona. Con horario que cruza la medianoche (ej. `20:00`-`02:00`) la reserva puede terminar al día siguiente | 409 |
  | 6 | Reglas activas de la zona (sección 4.5): empieza con al menos `anticipacionMinimaHoras` de anticipación y dura como máximo `duracionMaximaHoras`. Si la zona tiene varias reglas activas gana la más estricta; sin reglas no hay límite | 409 |
  | 7 | Hay cupo: las reservas de la zona que se cruzan con ese intervalo son menos que la `capacidad` | 409 |
  | 8 | No se cruza con otra reserva suya de la misma zona (una que empieza justo cuando termina la otra sí se permite) | 409 |
- **Cancelar:** solo el dueño (403) y solo mientras esté `PROGRAMADA` (409 si ya está `EN_CURSO` o `FINALIZADA`). La penalidad por cancelación tardía de la regla (`horasAntelacionPenalidad`, `tarifaPenalidad`) todavía no se cobra.
- Al reservar, el residente recibe una notificación con el día y la hora (`Su reserva de BBQ para el 2026-11-20 de 10:00 a 12:00 quedo registrada.`).
- Las reservas creadas antes de este cambio no tenían fecha: la migración `V2` las cerró como `FINALIZADA` (una hora que termina en el momento de migrar), así que no ocupan cupo.

## 6. Notificaciones - `/api/notificaciones` (**Autenticado**)
| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/api/notificaciones?pagina=&tamano=` | 200 `Pagina<Notificacion>` (las del usuario, más recientes primero) |
| PUT | `/api/notificaciones/leida` | 204 (marca todas como leídas) |

`Notificacion`: `{id, mensaje, tipoNotificacion, fechaEnvio}` (`fechaEnvio` en formato `yyyy-MM-ddTHH:mm:ss`).

## 7. Pagos compartidos y consultas

| Método | Ruta | Acceso | Respuesta |
|---|---|---|---|
| GET | `/api/pagos/{id}/comprobante` | ADMIN o RESIDENTE | 200 `{referencia, comprobante}` (texto; solo pagos `APROBADO`/`REEMBOLSADO`, 409 si no) |
| GET | `/api/pagos/estado/{referencia}` | ADMIN o RESIDENTE | 200 `{referencia, estado}` |
| GET | `/api/invitados/{id}/residentes?pagina=&tamano=` | ADMIN o VIGILANTE | 200 `Pagina<Anfitrion>` |
| GET | `/api/autos/{id}/duenos?inmuebleId=` | ADMIN o VIGILANTE | 200 `{autoId, inmuebleId, duenos:[..]}` |

Un residente solo accede a pagos de su propio inmueble (403 si no).
`Anfitrion` / `Dueno`: `{id, identificacion, nombreCompleto, inmuebleId, direccionInmueble}`.

## 8. Webhook de la pasarela (Wompi)

| Método | Ruta | Acceso | Cuerpo | Respuesta |
|---|---|---|---|---|
| POST | `/api/pasarela/webhook` | Público + firma del evento | Evento de Wompi (`{event, data:{transaction}, signature:{properties, checksum}, timestamp, ...}`) | 200 sin cuerpo |

Lo llama **Wompi**, no el front-end. Se configura en el dashboard de Wompi como *URL de eventos*: `https://<api>/api/pasarela/webhook`.

- **Autenticidad:** no usa Bearer ni llaves en cabeceras. El back recalcula `signature.checksum` con el secreto de eventos (`PASARELA_EVENTS_SECRET`). Si falta la firma o no coincide responde **401** y no toca ningún pago.
- **Fuente de verdad:** el contenido del evento no se usa para decidir. El back consulta la transacción en la API de Wompi con la llave privada (`PASARELA_PRIVATE_KEY`) y actúa según lo que diga Wompi:
  - `APPROVED`, con monto y moneda (`COP`) iguales a los del pago: aprueba. Si no coinciden, el pago queda `PENDIENTE` para revisión manual.
  - `DECLINED`, `VOIDED` o `ERROR`: rechaza.
  - `PENDING`: no cambia nada.
- **Respuestas:** 200 procesado o ignorado (otros tipos de evento, pago ya resuelto); 404 referencia desconocida; 409 secreto de eventos no configurado; 502 la API de Wompi no respondió. Con cualquier respuesta distinta de 200, Wompi reintenta.
- Es idempotente: un evento repetido no cambia nada ni vuelve a notificar. Al aprobar, la liquidación del inmueble queda `AL_DIA` y se notifica el resultado.

**Checkout (`urlCheckout` de `POST /api/residente/pagos`):** va firmado con `signature:integrity` y, si está configurado `PASARELA_REDIRECT_URL`, lleva `redirect-url` para que Wompi devuelva al residente a esa pantalla del front. Wompi agrega `?id=<idTransaccion>` a esa URL; el front muestra el resultado con `GET /api/pagos/estado/{referencia}`.

## 9. Vigilante - `/api/vigilante` (todos **VIGILANTE**)
| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/api/vigilante/reservas?estado=&pagina=&tamano=` | 200 `Pagina<Reserva>` (todas, por `fechaHoraInicio`; `estado` opcional como en 5.3) |
| GET | `/api/vigilante/zonas-comunes/acceso?identificacion=` | 200 `Acceso` |
| GET | `/api/vigilante/invitados/{identificacion}` | 200 `InvitadoConsulta` |
| POST | `/api/vigilante/invitados/{identificacion}/ingreso` | 200 `Ingreso` |

- `Acceso`: `{identificacion, nombreCompleto, permitido, motivo, zonasPermitidas:[{zonaComunId, nombreZonaComun, horaInicio, horaFin, reservaHasta}]}`. `permitido`: la persona tiene **ahora** una reserva `EN_CURSO` de una zona activa (suya o de su anfitrión, si es invitado). Una reserva solo programada o ya finalizada no da acceso. `horaInicio`/`horaFin` son el horario de la zona y `reservaHasta` es cuándo termina la reserva que da el acceso.
- `InvitadoConsulta`: `{existe, vigente, invitado}`.
- `Ingreso`: `{permitido, mensaje, visitante, inmueblesNotificados:[..]}`. Registrar el ingreso notifica a los inmuebles anfitriones.

## 10. Resumen de acceso por rol

| Rol | Rutas |
|---|---|
| Público | `/api/auth/login`, `/refresh`, `/activar`, `/recuperar-contrasena`, `/api/pasarela/webhook` (firma de Wompi) |
| Autenticado | `/api/auth/logout`, `/contrasena`, `/me`, `/api/notificaciones/**` |
| ADMINISTRADOR | `/api/admin/**` |
| RESIDENTE | `/api/residente/**` |
| VIGILANTE | `/api/vigilante/**` |
| ADMIN o RESIDENTE | `/api/pagos/**` |
| ADMIN o VIGILANTE | `/api/invitados/{id}/residentes`, `/api/autos/{id}/duenos` |

La protección está en anotaciones sobre cada método, no en reglas por URL. Una prueba garantiza que ningún endpoint quede sin etiqueta.
