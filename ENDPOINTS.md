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
               "fechaCreacionCuenta": "2026-11-08", "inmuebles": [],
               "correoVerificado": true }
}
```
`Usuario.inmuebles`: `[{id, direccionInmueble}]`, los apartamentos de un residente o invitado ordenados por dirección (vacío para administradores y vigilantes). Reemplaza a los antiguos `inmuebleId` y `direccionInmueble`.

> Nota: `refreshToken` va en camelCase en el cuerpo de `/refresh`, pero llega como `refresh_token` en la respuesta.

**Contraseña nueva:** mínimo 8 caracteres, con al menos una letra y un número.

**No hay activación pública.** `POST /api/auth/activar` ya no existe: una cuenta nueva solo se activa cuando la administración verifica su correo con el código de 4 cifras (sección 4.3).

## 4. Administrador

### 4.1 Panel y liquidaciones - `/api/admin`
| Método | Ruta | Cuerpo / parámetros | Respuesta |
|---|---|---|---|
| GET | `/api/admin/resumen?periodo=yyyy-MM-dd` | `periodo` opcional | 200 `ResumenAdmin` |
| GET | `/api/admin/reportes` | - | 200 `ReporteConsolidado` |
| POST | `/api/admin/liquidaciones` | `Generar` | 201 `Liquidacion` |
| POST | `/api/admin/liquidaciones/masiva` | `{periodo, fechaLimite?}` | 200 `{generadas, omitidas:[{inmuebleId, motivo}]}` |
| GET | `/api/admin/liquidaciones?inmuebleId=&estado=&periodo=&pagina=&tamano=` | filtros opcionales | 200 `Pagina<Liquidacion>` (periodo más reciente primero) |
| PATCH | `/api/admin/liquidaciones/{id}/mora` | - | 200 `Liquidacion` |
| PATCH | `/api/admin/liquidaciones/{id}/al-dia` | - | 200 `Liquidacion` |
| GET | `/api/admin/liquidaciones/{id}` | - | 200 `Liquidacion` |
| PUT | `/api/admin/liquidaciones/{id}` | `{fechaLimite, cuotaAdministracion, valorServiciosComunes, valorMultas}` | 200 `Liquidacion` (total recalculado; 409 si está `AL_DIA`) |
| DELETE | `/api/admin/liquidaciones/{id}` | - | 204 (409 si está `AL_DIA`; si era la vigente, pasa a serlo la más reciente que quede) |

Todos: **ADMIN**.

- `Generar`: `{inmuebleId, periodo, fechaLimite?, cuotaAdministracion?, valorServiciosComunes?}`. El `periodo` se normaliza al día 1; `fechaLimite` por defecto es el día 10; las tarifas por defecto se copian de la liquidación anterior.
- `Liquidacion`: `{id, inmuebleId, direccionInmueble, periodo, fechaGeneracion, fechaLimite, cuotaAdministracion, valorServiciosComunes, valorMultas, total, estado, vencida}`. `estado`: `PENDIENTE`, `AL_DIA`, `EN_MORA`.
- `ResumenAdmin`: `{periodo, totalInmuebles, alDia, porVencer, vencidas, sinLiquidacion, porCobrar, recaudoMes}`.
- `ReporteConsolidado` (caso de uso *Generar reportes consolidados*): `{fechaGeneracion, totalInmuebles, inmueblesAlDia, inmueblesEnMora, inmueblesPendientes, recaudo, mora, pendiente, inmuebles:[{inmuebleId, direccionInmueble, estadoPago, recaudado, saldoPendiente}]}`. `recaudo` = suma de los pagos `APROBADO`; `mora` = saldo de los inmuebles `VENCIDA`; `pendiente` = saldo de los inmuebles `POR_VENCER`. Es el acumulado a la fecha, no de un mes.
- Tareas programadas (America/Bogota), sin endpoint:
  - El día 1 de cada mes a las 00:00 genera la liquidación del periodo para todos los inmuebles activos, igual que `generar-masiva` sin `fechaLimite` (vence el día 10).
  - Todos los días a las 00:05 pasa a `EN_MORA` las liquidaciones vencidas sin pagar y envía a los residentes de cada inmueble afectado una notificación `PAGO_PENDIENTE`.
  - Cada hora en punto envía una notificación `RESERVA` («Recordatorio: su reserva de … empieza el …») a quien tenga una reserva que empiece entre 24 y 25 horas después.

### 4.2 Inmuebles - `/api/admin/inmuebles` (todos **ADMIN**)
| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| POST | `/api/admin/inmuebles` | `{direccionInmueble, valorParqueadero?}` (formato `TORRE-APTO`, ej. `A-302`) | 201 `Detalle` |
| GET | `/api/admin/inmuebles?pagina=&tamano=` | - | 200 `Pagina<Resumen>` (por dirección) |
| GET | `/api/admin/inmuebles/{id}` | - | 200 `Detalle` |
| PUT | `/api/admin/inmuebles/{id}` | `{direccionInmueble, isActive}` | 200 `Detalle` (409 si la dirección ya existe) |
| DELETE | `/api/admin/inmuebles/{id}` | - | 204. Borra con él sus pagos, parqueadero y liquidaciones (composición); a sus residentes, zonas y notificaciones solo les quita el vínculo (agregación). 409 si tiene reservas registradas: desactívelo con `isActive=false` |
| PUT | `/api/admin/inmuebles/{id}/tarifas` | `{cuotaAdministracion, valorServiciosComunes, valorParqueadero?}` | 200 `Liquidacion` |
| PUT | `/api/admin/inmuebles/{id}/multas` | `{valorMultas}` | 200 `Liquidacion` |
| PUT | `/api/admin/inmuebles/{id}/zonas-comunes` | `{zonaComunIds: [..]}` (no vacío) | 200 `Zona[]` |
| POST | `/api/admin/inmuebles/{id}/recordatorio-pago` | - | 201 `Notificacion` |
| POST | `/api/admin/inmuebles/{id}/conciliar-pago` | `{monto, metodoPago, referencia?}` | 201 `Pago` |
| GET | `/api/admin/inmuebles/{id}/usuarios` | - | 200 `UsuarioDeInmueble[]` (residentes e invitados del inmueble, por tipo y nombre; 404 si no existe). Ver *Apartamentos de residentes e invitados* en 4.3 |

- `Resumen`: `{id, direccionInmueble, isActive, estadoPago, saldoPendiente, fechaLimitePendiente, valorParqueadero, totalLiquidaciones}`.
- `Detalle`: lo anterior más `nombresUsuarios`, `usuarios` (`Usuario[]`), `zonasComunes` (`Zona[]`) y `liquidacionVigente`.
- `estadoPago`: `AL_DIA`, `POR_VENCER`, `VENCIDA`, `SIN_LIQUIDACION`. `saldoPendiente` suma todas las liquidaciones que el inmueble no ha pagado.
- **Conciliar pago** (efectivo, transferencia...): el `monto` debe ser **igual** al saldo pendiente del inmueble; si no, 400. Queda `APROBADO` y deja al día el inmueble.

### 4.3 Usuarios - `/api/admin/usuarios` (todos **ADMIN**)
| Método | Ruta | Cuerpo / parámetros | Respuesta |
|---|---|---|---|
| POST | `/api/admin/usuarios` | `CrearUsuario` | 201 `Usuario` |
| GET | `/api/admin/usuarios?tipo=&active=&pagina=&tamano=` | filtros opcionales | 200 `Pagina<Usuario>` (por nombre) |
| GET | `/api/admin/usuarios/{identificacion}` | - | 200 `Usuario` |
| PUT | `/api/admin/usuarios/{identificacion}` | `{nombreCompleto, fechaNacimiento?, correoElectronico, inicioContrato?, venceContrato?, venceAutorizacion?}` | 200 `Usuario`. Contrato obligatorio para ADMINISTRADOR y VIGILANTE; `venceAutorizacion` solo aplica a invitados. **Cambiar el correo deja la cuenta inactiva y sin sesión** y envía un código nuevo para verificarlo (409 si el correo es de otra cuenta) |
| DELETE | `/api/admin/usuarios/{identificacion}` | - | 204. Borra con la cuenta su auto y sus reservas (composición); sus invitados, notificaciones e inmuebles siguen existiendo (agregación). 409 si es la propia cuenta o un administrador que creó reglas de reserva |
| POST | `/api/admin/usuarios/{identificacion}/verificar-correo` | `{codigo}` (4 cifras) | 200 `Usuario` (correo verificado y cuenta activa) |
| POST | `/api/admin/usuarios/{identificacion}/reenviar-codigo` | - | 202 `{mensaje}` |
| PATCH | `/api/admin/usuarios/{identificacion}/activo` | - | 200 `{id, nombreCompleto, active}` (alterna activo/inactivo; 409 si intenta activar una cuenta con el correo sin verificar o una cuenta sin ningún inmueble) |
| GET | `/api/admin/usuarios/{identificacion}/inmuebles` | - | 200 `UsuarioInmuebles` |
| POST | `/api/admin/usuarios/{identificacion}/inmuebles` | `{inmuebleId}` | 201 `UsuarioInmuebles` (agrega un inmueble) |
| PUT | `/api/admin/usuarios/{identificacion}/inmuebles/{inmuebleId}` | `{inmuebleId}` (destino) | 200 `UsuarioInmuebles` (mudanza del inmueble de la ruta al del cuerpo) |
| DELETE | `/api/admin/usuarios/{identificacion}/inmuebles/{inmuebleId}` | - | 204 (lo quita de ese inmueble) |
| GET | `/api/admin/inmuebles/{id}/usuarios` | - | 200 `UsuarioDeInmueble[]` (por tipo y nombre) |

**Verificación del correo (la única forma de activar una cuenta nueva).**
1. `POST /api/admin/usuarios` crea la cuenta **inactiva** (`active: false`, `correoVerificado: false`) y envía un código de **4 cifras** al correo que escribió la administración.
2. El usuario se lo dicta a la administración, que lo confirma con `verificar-correo`. Con el código correcto el correo queda verificado y la cuenta **activa**: ya puede iniciar sesión.
3. El código se guarda cifrado, **vence a los 15 minutos** y admite **máximo 5 intentos fallidos**. `reenviar-codigo` envía uno nuevo, que **reemplaza** al anterior y **reinicia** los intentos.
4. El `PATCH .../activo` no salta este paso: con el correo sin verificar responde 409 (y también si la cuenta no tiene ningún inmueble: «Primero relacione la cuenta con un inmueble»; `verificar-correo` responde ese mismo 409). Desactivar y volver a activar una cuenta ya verificada funciona igual que antes. Los invitados (`USUARIO_AUTORIZADO`) no pasan por aquí: los autoriza su residente.
5. Las cuentas que ya estaban activas antes de este cambio quedaron verificadas. Las inactivas quedaron **por verificar**: la administración les reenvía el código desde la lista.

| Código | Cuándo (el front muestra el `mensaje` del back tal cual) |
|---|---|
| 400 | Código incorrecto (`"Codigo incorrecto. Quedan N intentos"`) o que no son 4 cifras (`errores.codigo`) |
| 403 | La cuenta es de un invitado |
| 404 | No existe un usuario con esa identificación |
| 409 | El correo ya está verificado; no hay código vigente; el código venció; se agotaron los intentos; la cuenta no tiene ningún inmueble («Primero relacione la cuenta con un inmueble») |

**Apartamentos de residentes e invitados (muchos a muchos).** Un residente o un invitado (`USUARIO_AUTORIZADO`)
puede estar relacionado con **varios** inmuebles, y un inmueble con varias personas. Administradores y vigilantes no
se relacionan con inmuebles. La administración agrega, muda o quita cada relación con
`/api/admin/usuarios/{identificacion}/inmuebles`.

- `UsuarioInmuebles`: `{id, identificacion, nombreCompleto, tipoUsuario, active, inmuebles:[{id, direccionInmueble}]}`.
- `UsuarioDeInmueble`: `{id, identificacion, nombreCompleto, tipoUsuario, active}`.
- **Agregar** (`POST`): 409 si ya está relacionado con ese inmueble; inmueble inexistente 404, inactivo 409. **No** activa la cuenta: después se activa con `PATCH .../activo` o `verificar-correo`.
- **Mudar** (`PUT .../inmuebles/{X}` con `{inmuebleId: Y}`): 409 si no estaba en X o ya está en Y.
- **Quitar** (`DELETE .../inmuebles/{X}`): 409 si no estaba en X.
- Al salir de X (quitar, o mudarse de X a Y), en la misma operación:
  1. Si es residente, cada invitado que él autorizó pierde X **solo si ningún otro anfitrión de ese invitado sigue en X**; en una mudanza ese invitado gana Y. Los vínculos residente–invitado se conservan.
  2. Si su auto tenía un parqueadero de X, queda libre (`parqueaderoId = null`).
  3. Sus reservas futuras `PROGRAMADA` de X: en una mudanza pasan a Y si la zona está asignada a Y; si no, se cancelan. Al quitar se cancelan todas. Las `EN_CURSO` no se tocan.
  4. **Una cuenta que se queda sin ningún inmueble queda inactiva y sin sesión** (también los invitados que se queden sin inmuebles por el punto 1), y no se puede activar ni verificar su correo (409 «Primero relacione la cuenta con un inmueble») hasta que se le agregue uno.
- Crear un residente (`POST /api/admin/usuarios`) sigue pidiendo `inmuebleId`: es su primer inmueble.
- Las personas sin ningún inmueble salen de `GET /api/admin/usuarios?tipo=RESIDENTE` o `?tipo=USUARIO_AUTORIZADO` con `inmuebles: []`.

| Código | Cuándo (el front muestra el `mensaje` del back tal cual) |
|---|---|
| 400 | Falta `inmuebleId` o no es positivo (`errores.inmuebleId`) |
| 404 | No existe el usuario o el inmueble |
| 409 | No es residente ni invitado («Solo residentes e invitados se relacionan con inmuebles»); ya está relacionado con ese inmueble; no estaba en el inmueble de la ruta; ya está en el destino; el inmueble está inactivo; el administrador no está vigente |

`CrearUsuario`: `{tipoUsuario, identificacion, nombreCompleto, fechaNacimiento?, correoElectronico, contrasena, inmuebleId?, inicioContrato?, venceContrato?}`.
`tipoUsuario`: `ADMINISTRADOR`, `RESIDENTE` o `VIGILANTE`. `inmuebleId` es obligatorio para `RESIDENTE`; `inicioContrato` y `venceContrato` para `ADMINISTRADOR` y `VIGILANTE`.
`Usuario` trae `correoVerificado` (`false` = falta confirmar el código; la cuenta no se puede activar) e `inmuebles` (sección 3). También trae `fechaNacimiento`, `inicioContrato` y `venceContrato` (administrador o vigilante; `null` en los demás) y `venceAutorizacion` (invitados), para prellenar el formulario de editar.

### 4.4 Zonas comunes - `/api/admin/zonas-comunes` (todos **ADMIN**)
| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| POST | `/api/admin/zonas-comunes` | `{nombreZonaComun, capacidad, horaInicio, horaFin, aplicarATodosLosInmuebles?}` | 201 `Zona` |
| GET | `/api/admin/zonas-comunes?pagina=&tamano=` | - | 200 `Pagina<Zona>` (por nombre) |
| PATCH | `/api/admin/zonas-comunes/{id}/estado` | - | 200 `Zona` (alterna activa/inactiva) |
| GET | `/api/admin/zonas-comunes/{id}` | - | 200 `Zona` |
| PUT | `/api/admin/zonas-comunes/{id}` | `{nombreZonaComun, capacidad, horaInicio, horaFin}` | 200 `Zona` (400 si las horas son iguales; 409 si el nombre ya existe) |
| DELETE | `/api/admin/zonas-comunes/{id}` | - | 204 (la quita de los inmuebles). 409 si tiene reservas (desactívela) o reglas asignadas (quítelas antes) |

`Zona`: `{id, nombreZonaComun, capacidad, horaInicio, horaFin, isActive, reservasActuales}`. `aplicarATodosLosInmuebles` es `true` por defecto. `capacidad` es cuántas reservas puede tener la zona **al mismo tiempo**. `reservasActuales` cuenta las reservas que aún no terminan (programadas o en curso).

### 4.5 Reglas de reserva - `/api/admin` (todos **ADMIN**)
| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| POST | `/api/admin/reglas-reserva` | `CrearRegla` | 201 `Regla` |
| GET | `/api/admin/reglas-reserva?pagina=&tamano=` | - | 200 `Pagina<Regla>` |
| PUT | `/api/admin/reglas-reserva/{id}` | `{anticipacionMinimaHoras, duracionMaximaHoras}` | 200 `Regla` |
| PATCH | `/api/admin/rompimientos/{id}/aplicar` | - | 200 `Rompimiento` |
| PATCH | `/api/admin/rompimientos/{id}/inactivar` | - | 200 `Rompimiento` |
| GET | `/api/admin/reglas-reserva/{id}` | - | 200 `Regla` |
| DELETE | `/api/admin/reglas-reserva/{id}` | - | 204 (409 si sigue aplicada a alguna zona) |
| POST | `/api/admin/reglas-reserva/{id}/zonas` | `{zonaComunId, observaciones?}` | 201 `Rompimiento` (aplica la regla a otra zona; 409 si ya estaba) |
| GET | `/api/admin/rompimientos/{id}` | - | 200 `Rompimiento` |
| DELETE | `/api/admin/rompimientos/{id}` | - | 204 (quita la regla de esa zona; la zona y la regla siguen) |

- `CrearRegla`: `{anticipacionMinimaHoras, duracionMaximaHoras, horasAntelacionPenalidad?, tarifaPenalidad?, zonaComunIds: [..], observaciones?}`.
- `Regla`: `{id, anticipacionMinimaHoras, duracionMaximaHoras, horasAntelacionPenalidad, tarifaPenalidad, adminId, zonas: Rompimiento[]}`.
- `Rompimiento` (asignación de una regla a una zona): `{id, zonaComunId, nombreZonaComun, reglaReservaId, fechaAplicacion, activa, observaciones}`.

### 4.6 Notificaciones - `/api/admin/notificaciones` (todos **ADMIN**)
| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| POST | `/api/admin/notificaciones` | `{mensaje, tipoNotificacion?, usuarioIds?, inmuebleId?}` | 201 `Notificacion` |
| GET | `/api/admin/notificaciones/{id}/lectura` | - | 200 `{notificacionId, leidos:[..], pendientes:[..]}` |
| GET | `/api/admin/notificaciones/incidencias?pagina=&tamano=` | - | 200 `Pagina<Notificacion>` (incidencias de portería, más recientes primero) |
| GET | `/api/admin/notificaciones?pagina=&tamano=` | - | 200 `Pagina<Notificacion>` (todas, más recientes primero) |
| GET | `/api/admin/notificaciones/{id}` | - | 200 `Notificacion` |
| DELETE | `/api/admin/notificaciones/{id}` | - | 204 (los usuarios e inmuebles destinatarios siguen existiendo) |

Destinatarios: `usuarioIds`, o `inmuebleId` (sus residentes activos). Si no se envía ninguno, la reciben todos los residentes activos. `tipoNotificacion` por defecto `GENERAL`. `leidos`/`pendientes` son `{usuarioId, nombreCompleto}`.

Las incidencias operativas son notificaciones de tipo `INCIDENCIA` que registra el vigilante (sección 9). Les llegan a todos los administradores activos, así que también aparecen en `GET /api/notificaciones` y se marcan como leídas con `PUT /api/notificaciones/leida`.

Una notificación solo se entrega a los destinatarios que aceptan ese tipo según sus preferencias (sección 6). Si ninguno lo acepta, `POST /api/admin/notificaciones` responde **409**. Las de tipo `INCIDENCIA` se entregan siempre.

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

### 4.8 Parqueaderos - `/api/admin/parqueaderos` (todos **ADMIN**)
| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| POST | `/api/admin/parqueaderos` | `{inmuebleId, valorMensual}` | 201 `Parqueadero` (404 si el inmueble no existe; 409 si ya tiene uno) |
| GET | `/api/admin/parqueaderos?pagina=&tamano=` | - | 200 `Pagina<Parqueadero>` (por inmueble) |
| GET | `/api/admin/parqueaderos/{id}` | - | 200 `Parqueadero` |
| PUT | `/api/admin/parqueaderos/{id}` | `{valorMensual}` | 200 `Parqueadero` |
| DELETE | `/api/admin/parqueaderos/{id}` | - | 204 (el auto que lo usaba queda sin parqueadero, no se borra) |

`Parqueadero`: `{id, inmuebleId, valorMensual}`. Un inmueble tiene como máximo uno.

## 5. Residente - `/api/residente` (todos **RESIDENTE**)

**Apartamento elegido.** Un residente puede tener varios apartamentos y trabaja sobre uno a la vez. **Todos** los
endpoints de `/api/residente/**` y `/api/pagos/**` aceptan `?inmuebleId=` (query):
- si viene, debe ser uno de los suyos (si no → 403 «Ese inmueble no es suyo»);
- si no viene y tiene exactamente uno, se usa ese;
- si no viene y tiene varios → 400 «Indique el inmueble (inmuebleId)»; si no tiene ninguno → 409.

El estado de cuenta, los pagos, las reservas, los invitados y el auto son los del apartamento resuelto. Crear una
reserva o un invitado los deja en ese apartamento (la reserva guarda su `inmuebleId`).

| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| GET | `/api/residente/inmuebles` | - | 200 `[{id, direccionInmueble}]` (sus apartamentos, por dirección) |

El front guarda el apartamento elegido en una cookie y lo envía como `?inmuebleId=` en cada llamada del residente;
con un solo apartamento el selector no se muestra.

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
| PUT | `/api/residente/auto` | `{placa, parqueaderoId?}` | 200 `Auto` (`parqueaderoId` nulo lo deja sin parqueadero; 403 si es de un inmueble ajeno; 409 si la placa o el parqueadero están ocupados) |
| DELETE | `/api/residente/auto` | - | 204 |
| GET | `/api/residente/invitados/{id}` | - | 200 `Invitado` (403 si no lo autorizó usted) |
| PUT | `/api/residente/invitados/{id}` | `{nombreCompleto, fechaNacimiento?, venceAutorizacion?}` | 200 `Invitado` (400 si `venceAutorizacion` ya pasó) |
| DELETE | `/api/residente/invitados/{id}` | - | 204. Quita **su** autorización; el invitado no se borra. Si ningún otro residente lo autoriza, queda inactivo |

- `CrearInvitado`: `{identificacion, nombreCompleto, fechaNacimiento?, correoElectronico?, venceAutorizacion?}`. Sin `venceAutorizacion` la autorización es permanente.
- `Invitado`: `{id, identificacion, nombreCompleto, correoElectronico, active, venceAutorizacion, vigente, inmuebles:[{id, direccionInmueble}], fechaNacimiento}`. `vigente` = activo y autorización no vencida. Un invitado puede estar en varios apartamentos (de uno o varios anfitriones). Autorizar a un invitado que ya existe le agrega el apartamento elegido.
- `Auto`: `{id, duenoId, nombreDueno, placa, parqueaderoId, inmuebleId, direccionInmueble}`. La `placa` es numérica (así está en el diagrama de clases).

### 5.3 Zonas comunes y reservas
| Método | Ruta | Cuerpo / parámetros | Respuesta |
|---|---|---|---|
| GET | `/api/residente/zonas-comunes?pagina=&tamano=` | - | 200 `Pagina<Zona>` (las activas asignadas a su inmueble) |
| GET | `/api/residente/zonas-comunes/{id}/disponibilidad?inicio=&fin=` | `inicio` y `fin` obligatorios (`yyyy-MM-ddTHH:mm`) | 200 `Disponibilidad` |
| GET | `/api/residente/reservas?estado=&pagina=&tamano=` | `estado` opcional: `PROGRAMADA`, `EN_CURSO` o `FINALIZADA` | 200 `Pagina<Reserva>` (las suyas, la de inicio más reciente primero) |
| POST | `/api/residente/reservas` | `{zonaComunId, fechaHoraInicio, fechaHoraFin}` | 201 `Reserva` |
| DELETE | `/api/residente/reservas/{id}` | - | 204 (solo quien reservó y solo si está `PROGRAMADA`) |
| GET | `/api/residente/reservas/{id}` | - | 200 `Reserva` (403 si no es suya) |
| PUT | `/api/residente/reservas/{id}` | `{fechaHoraInicio, fechaHoraFin}` | 200 `Reserva`. Reprograma una reserva suya `PROGRAMADA` con **las mismas validaciones de reservar** (la propia reserva no cuenta contra el cupo ni el solape). 403 si no es suya, 409 si ya empezó |

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
| GET | `/api/notificaciones/preferencias` | 200 `Preferencias` |
| PUT | `/api/notificaciones/preferencias` | cuerpo `{tipoNotificacion}` → 200 `Preferencias` |

`Notificacion`: `{id, mensaje, tipoNotificacion, fechaEnvio}` (`fechaEnvio` en formato `yyyy-MM-ddTHH:mm:ss`).

`Preferencias`: `{preferenciasNotificacion:[..]}`, los tipos de notificación que el usuario quiere recibir (`GENERAL`, `RESERVA`, `PAGO_PENDIENTE`, `PAGO_ACTUALIZADO`, `VISITA`, ...). **Lista vacía = recibe todos** (así empieza toda cuenta). El `PUT` alterna un tipo: si no estaba lo agrega, si ya estaba lo quita; el tipo se guarda en mayúsculas. Con al menos un tipo en la lista, el usuario solo recibe esos. Responde 409 si la cuenta está inactiva.

## 7. Pagos compartidos y consultas

| Método | Ruta | Acceso | Respuesta |
|---|---|---|---|
| GET | `/api/pagos/{id}/comprobante` | ADMIN o RESIDENTE | 200 `{referencia, comprobante}` (texto; solo pagos `APROBADO`/`REEMBOLSADO`, 409 si no) |
| GET | `/api/pagos/estado/{referencia}` | ADMIN o RESIDENTE | 200 `{referencia, estado}` |
| GET | `/api/invitados/{id}/residentes?pagina=&tamano=` | ADMIN o VIGILANTE | 200 `Pagina<Anfitrion>` |
| GET | `/api/autos/{id}/duenos?inmuebleId=` | ADMIN o VIGILANTE | 200 `{autoId, inmuebleId, duenos:[..]}` |

Un residente solo accede a pagos de sus propios inmuebles (403 si no). Acepta `?inmuebleId=` como todo `/api/residente/**` (sección 5).
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
| GET | `/api/vigilante/invitados?pagina=&tamano=` | 200 `Pagina<Invitado>` (todos los invitados registrados, por nombre) |
| GET | `/api/vigilante/invitados/{identificacion}` | 200 `InvitadoConsulta` |
| POST | `/api/vigilante/invitados/{identificacion}/ingreso` | 200 `Ingreso` |
| POST | `/api/vigilante/incidencias` | cuerpo `{descripcion}` (máx. 300) → 201 `Notificacion` |

- `Acceso`: `{identificacion, nombreCompleto, permitido, motivo, zonasPermitidas:[{zonaComunId, nombreZonaComun, horaInicio, horaFin, reservaHasta}]}`. `permitido`: la persona tiene **ahora** una reserva `EN_CURSO` de una zona activa (suya o de su anfitrión, si es invitado). Una reserva solo programada o ya finalizada no da acceso. `horaInicio`/`horaFin` son el horario de la zona y `reservaHasta` es cuándo termina la reserva que da el acceso.
- `GET /api/vigilante/invitados`: lista todos los invitados (usuarios autorizados) de la copropiedad, activos o no, ordenados por `nombreCompleto` (desempate por `id`). Cada fila es un `Invitado` (5.2): `{id, identificacion, nombreCompleto, correoElectronico, active, venceAutorizacion, vigente, inmuebles}`; `vigente` = activo y autorización no vencida. Ejemplo:
  ```json
  {
    "contenido": [
      { "id": 10, "identificacion": 1090123456, "nombreCompleto": "Ana Invitada", "correoElectronico": "ana@mail.com",
        "active": true, "venceAutorizacion": "2026-11-30", "vigente": true,
        "inmuebles": [{ "id": 4, "direccionInmueble": "A-302" }] }
    ],
    "pagina": 0,
    "tamano": 20,
    "totalElementos": 1,
    "totalPaginas": 1
  }
  ```
- `InvitadoConsulta`: `{existe, vigente, invitado}`.
- `Ingreso`: `{permitido, mensaje, visitante, inmueblesNotificados:[..]}`. Registrar el ingreso notifica a los inmuebles anfitriones.
- Incidencia operativa: se guarda como `Notificacion` de tipo `INCIDENCIA` con el mensaje `Incidencia reportada por <vigilante>: <descripcion>` y les llega a los administradores activos (409 si no hay ninguno). El administrador las consulta en `GET /api/admin/notificaciones/incidencias`.

## 10. Resumen de acceso por rol

| Rol | Rutas |
|---|---|
| Público | `/api/auth/login`, `/refresh`, `/recuperar-contrasena`, `/api/pasarela/webhook` (firma de Wompi) |
| Autenticado | `/api/auth/logout`, `/contrasena`, `/me`, `/api/notificaciones/**` |
| ADMINISTRADOR | `/api/admin/**` |
| RESIDENTE | `/api/residente/**` |
| VIGILANTE | `/api/vigilante/**` |
| ADMIN o RESIDENTE | `/api/pagos/**` |
| ADMIN o VIGILANTE | `/api/invitados/{id}/residentes`, `/api/autos/{id}/duenos` |

La protección está en anotaciones sobre cada método, no en reglas por URL. Una prueba garantiza que ningún endpoint quede sin etiqueta.

## 11. Cambios recientes del contrato

Lo que el front debe tener en cuenta desde la última versión de este documento (11-nov-2026). El resto del contrato no cambió.

### 19-nov-2026 - CRUD completo de las clases del diagrama
Endpoints nuevos (detalle en cada sección): `GET/PUT/DELETE` de inmuebles (4.2), usuarios (4.3), zonas comunes (4.4) y
liquidaciones (4.1); `GET/DELETE` de reglas y rompimientos y `POST /api/admin/reglas-reserva/{id}/zonas` (4.5);
`GET` y `DELETE` de notificaciones (4.6); CRUD de parqueaderos (4.8, nuevo); `PUT/DELETE /api/residente/auto`,
`GET/PUT/DELETE /api/residente/invitados/{id}` (5.2) y `GET/PUT /api/residente/reservas/{id}` (5.3).
`Usuario` agrega `fechaNacimiento`, `inicioContrato`, `venceContrato` y `venceAutorizacion`; `Invitado` agrega
`fechaNacimiento`. Los borrados siguen el diagrama de clases: en una **composición** se borran las partes con el todo; en una
**agregación** solo se quita el vínculo; si una asociación obligatoria lo impide responde **409**. Los pagos no se
borran (se anulan o reembolsan) y la pasarela solo se activa o desactiva.

### 19-nov-2026 - relación muchos a muchos
Residentes e invitados pueden tener **varios apartamentos** y un apartamento varias personas. Reemplaza a la relación
1 a muchos publicada antes ese mismo día: **se eliminan** `GET/POST/PUT/DELETE /api/admin/usuarios/{identificacion}/inmueble`
(singular) y `GET /api/admin/inmuebles/{id}/residentes`.

| Rol | Endpoint | Para qué | Sección |
|---|---|---|---|
| ADMIN | `GET /api/admin/usuarios/{identificacion}/inmuebles` | Apartamentos de un residente o invitado (`UsuarioInmuebles`). | 4.3 |
| ADMIN | `POST /api/admin/usuarios/{identificacion}/inmuebles` | Le agrega un apartamento (`{inmuebleId}`); 201. | 4.3 |
| ADMIN | `PUT /api/admin/usuarios/{identificacion}/inmuebles/{inmuebleId}` | Lo muda de ese apartamento al del cuerpo: reservas futuras pasan si la zona existe en el destino (si no, se cancelan); los invitados se mudan solo si ningún otro anfitrión sigue en el origen. | 4.3 |
| ADMIN | `DELETE /api/admin/usuarios/{identificacion}/inmuebles/{inmuebleId}` | Lo quita de ese apartamento; si era el último, la cuenta queda inactiva y sin sesión; 204. | 4.3 |
| ADMIN | `GET /api/admin/inmuebles/{id}/usuarios` | Residentes e invitados del apartamento (`UsuarioDeInmueble[]`). | 4.2 / 4.3 |
| RESIDENTE | `GET /api/residente/inmuebles` | Sus apartamentos, para el selector. | 5 |

**Comportamiento que cambia en endpoints que ya existían**
- `Usuario` (`/api/auth/me`, listados de admin, crear cuenta, `verificar-correo`) e `Invitado` (residente y vigilante) ya no traen `inmuebleId` ni `direccionInmueble`: traen `inmuebles: [{id, direccionInmueble}]`.
- Todo `/api/residente/**` y `/api/pagos/**` acepta `?inmuebleId=`. Con varios apartamentos y sin ese parámetro responde **400** «Indique el inmueble (inmuebleId)»; con uno ajeno, **403**.
- `PATCH .../activo` y `POST .../verificar-correo` responden 409 «Primero relacione la cuenta con un inmueble» si la cuenta (residente o invitado) no tiene ningún inmueble.

### 19-nov-2026 - verificación del correo con código
| Rol | Endpoint | Para qué | Sección |
|---|---|---|---|
| ADMIN | `POST /api/admin/usuarios/{identificacion}/verificar-correo` | Confirma el código de 4 cifras que llegó al correo: verifica el correo y activa la cuenta. | 4.3 |
| ADMIN | `POST /api/admin/usuarios/{identificacion}/reenviar-codigo` | Envía un código nuevo (reemplaza al anterior). | 4.3 |
| - | ~~`POST /api/auth/activar`~~ | **Eliminado.** Ya no hay activación pública. | 3 |

`Usuario` trae el campo nuevo `correoVerificado`. `PATCH .../activo` responde 409 si intenta activar una cuenta con el correo sin verificar.

### 17-nov-2026 - endpoint nuevo
| Rol | Endpoint | Para qué | Sección |
|---|---|---|---|
| VIGILANTE | `GET /api/vigilante/invitados?pagina=&tamano=` | Lista paginada de todos los invitados registrados (`Pagina<Invitado>`, por nombre). | 9 |

### 14-nov-2026 - endpoints nuevos
| Rol | Endpoint | Para qué | Sección |
|---|---|---|---|
| ADMIN | `GET /api/admin/reportes` | Reporte consolidado: recaudo, mora y pendientes, con el detalle por inmueble (`ReporteConsolidado`). | 4.1 |
| ADMIN | `GET /api/admin/notificaciones/incidencias?pagina=&tamano=` | Incidencias operativas que registra portería, paginadas. | 4.6 |
| VIGILANTE | `POST /api/vigilante/incidencias` | Registra una incidencia (`{descripcion}`, máx. 300). Responde 201 `Notificacion`. | 9 |
| Autenticado | `GET /api/notificaciones/preferencias` | Tipos de notificación que el usuario quiere recibir. | 6 |
| Autenticado | `PUT /api/notificaciones/preferencias` | Activa o desactiva un tipo (`{tipoNotificacion}`); alterna. | 6 |

**Comportamiento que cambia en endpoints que ya existían**
- `POST /api/admin/notificaciones` y las notificaciones automáticas (reserva, pago, visita) **respetan las preferencias** de cada usuario: solo llegan a quien acepta ese tipo. Lista vacía = recibe todos. Si ningún destinatario acepta el tipo, `POST /api/admin/notificaciones` responde **409**. Las de tipo `INCIDENCIA` se entregan siempre.
- Las incidencias llegan a los administradores activos como notificaciones de tipo `INCIDENCIA`: aparecen en `GET /api/notificaciones` y se marcan leídas con `PUT /api/notificaciones/leida`. Hay un tipo nuevo para mostrar en la bandeja.

### Sin cambios para el front
- **Zonas comunes del residente** (`GET /api/residente/zonas-comunes`): misma ruta y misma respuesta; solo cambió cómo se resuelve el inmueble por dentro.
- **Base de datos (V4):** el borrado en cascada sigue el diagrama de clases (composición = cascada, agregación = borrado normal). No hay endpoints que borren inmuebles, residentes, pagos ni zonas, así que no cambia ninguna respuesta. Los únicos `DELETE` son `/api/residente/reservas/{id}` y `/api/admin/usuarios/{identificacion}/inmuebles/{inmuebleId}` (quita la relación, no borra la cuenta).
- **Tipos del modelo** (`contrasena` como `String`, `Lombok`): son cambios internos; los cuerpos de `/api/auth/**` son los mismos.
