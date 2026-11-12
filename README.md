# Torres del Parque — Front-end

Aplicación web para la administración de la propiedad horizontal **Torres del Parque**. Un solo ingreso para los tres roles; según la cuenta, cada persona entra a su módulo:

| Módulo | Ruta | Qué puede hacer |
|---|---|---|
| Administración | `/admin` | Usuarios, inmuebles, liquidaciones, pagos y comprobantes, zonas comunes, reglas de reserva y notificaciones |
| Residente | `/residente` | Pagos y comprobantes, reservas de zonas comunes (fecha y hora), invitados, vehículo y notificaciones |
| Portería | `/vigilante` | Registrar el ingreso de invitados |

El back-end es un proyecto aparte (`HorizontalSoftware-Back-End`, Spring Boot). El contrato de la API está en [`ENDPOINTS.md`](ENDPOINTS.md).

## Tecnologías

- [Next.js 16](https://nextjs.org) (App Router, Server Components y Server Actions) con React 19 y TypeScript
- Tailwind CSS 4 y CSS Modules
- Base UI y componentes estilo shadcn
- Iconos de [Lucide](https://lucide.dev)
- pnpm como gestor de paquetes

> Esta versión de Next.js trae cambios respecto a versiones anteriores (por ejemplo, `middleware.ts` ahora es `proxy.ts`). Antes de tocar código, revisa la guía en `node_modules/next/dist/docs/`.

## Requisitos

- Node.js 20 o superior
- pnpm (`corepack enable` lo deja disponible)
- El back-end corriendo en local (`http://localhost:8080`) o acceso al back-end desplegado

## Puesta en marcha

```bash
pnpm install
pnpm dev
```

La app queda en [http://localhost:3000](http://localhost:3000) y redirige a `/ingresar`.

### Qué back-end usa

| Modo | Back-end por defecto |
|---|---|
| `pnpm dev` | `http://localhost:8080` |
| `pnpm build` + `pnpm start` | `https://horizontal-proyect.duckdns.org` |

Para cambiarlo, crea un `.env.local` con la variable `API_URL`; manda sobre ambos modos. Por ejemplo, para desarrollar contra el back-end desplegado:

```bash
API_URL=https://horizontal-proyect.duckdns.org
```

Todas las llamadas a la API se hacen del lado del servidor (Server Actions y `proxy.ts`), así que el navegador nunca habla directo con el back-end y el CORS no aplica.

### Cuentas

No hay registro: las cuentas las crea la administración desde `/admin/usuarios`. Un usuario nuevo nace inactivo y se activa con `POST /api/auth/activar`.

## Scripts

| Comando | Uso |
|---|---|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build de producción |
| `pnpm start` | Sirve el build de producción |

## Autenticación

- `/ingresar` es el único formulario de ingreso. El back-end devuelve el rol y la app abre el módulo que le corresponde.
- El `access_token` (15 min) y el `refresh_token` (7 días) se guardan en cookies `httpOnly`.
- `proxy.ts` corre antes de cada página de módulo: si no hay sesión del rol correcto manda a `/ingresar`, y si el access token venció pero queda el refresh, renueva la sesión sin pedir login. Solo lee cookies, no consulta la base de datos.
- Cada página vuelve a validar la sesión con `requerirSesion` (`lib/auth/sesion.ts`) como segunda barrera.

## Estructura

```
app/
  ingresar/        Formulario de ingreso único
  admin/           Módulo de administración
  residente/       Módulo del residente
  vigilante/       Módulo de portería
components/
  brand/           Logo
  gateway/         Pantalla de acceso y formulario de ingreso
  gestion/         Kit compartido de las pantallas de gestión (tablas, campos, acciones)
  modules/         Tableros y piezas propias de cada módulo
  shell/           Marco de la app: menú, encabezado, estados de carga
  ui/              Componentes básicos (botones, chips, avisos)
lib/
  auth/            Sesión, cookies, tokens y llamadas autenticadas a la API
  api/             Tipos del contrato, paginación y utilidades compartidas
  admin/ residente/ vigilante/ usuarios/ cuenta/
                   Server Actions de cada módulo
proxy.ts           Protección de rutas y renovación de sesión
ENDPOINTS.md       Contrato de la API con el back-end
```

## Diseño responsive

Todas las pantallas están pensadas para funcionar desde 320 px de ancho. En el teléfono las tablas se muestran como tarjetas (atributo `data-cards`) para que nada se salga de la pantalla.
