# SIGEX · Sistema Integral de Gestión de Expedientes

SIGEX es una aplicación web fullstack construida con Next.js (App Router) para la administración de expedientes. El sistema implementa autenticación con sesiones almacenadas en base de datos, control de acceso basado en permisos asignados a roles, un CRUD de expedientes con baja lógica y una bitácora de auditoría de solo inserción.

El documento [ARQUITECTURA.md](./ARQUITECTURA.md) describe el diseño de la solución, los flujos principales y las decisiones técnicas.

## Tabla de contenido

- [Funcionalidad](#funcionalidad)
- [Tecnologías](#tecnologías)
- [Requisitos previos](#requisitos-previos)
- [Instalación](#instalación)
- [Variables de entorno](#variables-de-entorno)
- [Base de datos: migraciones y seed](#base-de-datos-migraciones-y-seed)
- [Credenciales de prueba](#credenciales-de-prueba)
- [Roles y permisos](#roles-y-permisos)
- [Scripts disponibles](#scripts-disponibles)
- [Rutas de la aplicación](#rutas-de-la-aplicación)
- [API](#api)
- [Estructura del proyecto](#estructura-del-proyecto)

## Funcionalidad

| Módulo | Descripción |
|---|---|
| Autenticación | Inicio de sesión con correo y contraseña. La sesión se guarda en base de datos y se identifica mediante una cookie `httpOnly`. El cierre de sesión elimina la sesión en el servidor y la cookie. Los mensajes de error son genéricos para no revelar qué cuentas existen. |
| Recuperación de contraseña | Envío por correo (Resend) de un enlace con un token de un solo uso que vence en 30 minutos. El token se almacena como hash SHA-256. Al restablecer la contraseña se invalidan todas las sesiones activas del usuario. |
| Panel | Resumen de expedientes activos por estatus. El menú lateral muestra únicamente las opciones permitidas para el usuario. |
| Expedientes | Listado con paginación, búsqueda y filtros (estatus y expedientes propios), alta, detalle, edición, cambio de estatus y baja lógica. |
| Bitácora de auditoría | Registro automático de cada creación, edición, cambio de estatus y baja de un expediente, con valores anteriores y nuevos. El administrador la consulta con filtros por usuario, acción, rango de fechas y expediente. |
| Administración de usuarios | Alta de usuarios, asignación de rol, edición, activación y desactivación. Un usuario desactivado no puede iniciar sesión y sus sesiones vigentes se invalidan. |

## Tecnologías

| Aspecto | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) con TypeScript en modo estricto |
| Interfaz | React 19, Tailwind CSS 4 |
| Base de datos | PostgreSQL (Supabase) |
| ORM | Prisma 6 |
| Validación | Zod 4, con esquemas compartidos entre cliente y servidor |
| Contraseñas | bcrypt (`bcryptjs`, costo 12) |
| Correo transaccional | Resend |

## Requisitos previos

- Node.js 20.9 o superior.
- npm.
- Una base de datos PostgreSQL. El proyecto se desarrolló con Supabase en su plan gratuito; cualquier instancia de PostgreSQL 14 o superior es compatible.
- Una cuenta de Resend con una API key, necesaria únicamente para el envío de correos de recuperación.

## Instalación

1. Clonar el repositorio e instalar las dependencias:

   ```bash
   git clone https://github.com/javier640/sigex.git
   cd sigex
   npm install
   ```

   El script `postinstall` ejecuta `prisma generate` y crea el cliente de Prisma automáticamente.

2. Crear el archivo de variables de entorno a partir de la plantilla y completar sus valores (ver [Variables de entorno](#variables-de-entorno)):

   ```bash
   cp .env.example .env
   ```

3. Aplicar las migraciones y cargar los datos de prueba:

   ```bash
   npm run db:deploy
   npm run db:seed
   ```

4. Iniciar el servidor de desarrollo:

   ```bash
   npm run dev
   ```

   La aplicación queda disponible en `http://localhost:3000`.

## Variables de entorno

Todas las variables se leen exclusivamente en el servidor. Ninguna utiliza el prefijo `NEXT_PUBLIC_`, por lo que no se exponen al navegador. El archivo `.env` no debe incluirse en el repositorio.

| Variable | Obligatoria | Descripción |
|---|---|---|
| `DATABASE_URL` | Sí | Cadena de conexión que usa la aplicación. En Supabase corresponde a la conexión mediante el pooler. |
| `DIRECT_URL` | Sí | Conexión directa a PostgreSQL que Prisma utiliza para ejecutar migraciones. En Supabase corresponde a la conexión directa o al pooler en modo sesión (puerto 5432). |
| `RESEND_API_KEY` | Sí, para recuperación de contraseña | API key de Resend. |
| `MAIL_FROM` | No | Remitente de los correos. Valor por defecto: `SIGEX <onboarding@resend.dev>`. |
| `APP_URL` | Sí, en producción | URL base con la que se construyen los enlaces de los correos. En desarrollo, el valor por defecto es `http://localhost:3000`. No se deriva del encabezado `Host` de la petición para evitar que un cliente manipule el destino del enlace. |
| `SEED_EMAIL` | No | Correo registrado en la cuenta de Resend. El seed lo utiliza para generar los correos de los usuarios de prueba (ver [Credenciales de prueba](#credenciales-de-prueba)). |
| `SEED_PASSWORD` | No | Contraseña de los usuarios de prueba, con un mínimo de 8 caracteres. Valor por defecto: `Sigex2026!`. En producción es obligatoria. |

Ejemplo de `.env` para desarrollo:

```bash
DATABASE_URL="postgresql://usuario:contraseña@host:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://usuario:contraseña@host:5432/postgres"
RESEND_API_KEY="re_xxxxxxxxxxxx"
MAIL_FROM="SIGEX <onboarding@resend.dev>"
APP_URL="http://localhost:3000"
SEED_EMAIL="correo-de-la-cuenta-de-resend@dominio.com"
SEED_PASSWORD="Sigex2026!"
```

### Restricción del plan gratuito de Resend

Sin un dominio verificado, Resend solo permite enviar correos desde `onboarding@resend.dev` hacia el correo con el que se registró la cuenta. Por esta razón, el seed asigna al usuario administrador exactamente el valor de `SEED_EMAIL`, lo que garantiza que el flujo de recuperación de contraseña pueda probarse con ese usuario. Para enviar correos a cualquier destinatario es necesario verificar un dominio propio en Resend.

Si el envío falla, el error se registra en la consola del servidor sin incluir el token, y el usuario recibe la misma respuesta neutra que en un envío exitoso.

## Base de datos: migraciones y seed

### Migraciones

Las migraciones se encuentran versionadas en `prisma/migrations/`:

| Migración | Contenido |
|---|---|
| `init` | Tablas, tipos enumerados, llaves e índices del modelo de datos. |
| `bitacora_solo_insercion` | Trigger de PostgreSQL que rechaza cualquier `UPDATE`, `DELETE` o `TRUNCATE` sobre la tabla `bitacora`. |

La segunda migración se escribió de forma manual porque Prisma no genera triggers a partir del schema. Para agregar una migración de este tipo se utiliza `npx prisma migrate dev --create-only --name <nombre>` y se edita el archivo `migration.sql` generado antes de aplicarlo.

Durante el desarrollo, cualquier cambio al schema se aplica con `npm run db:migrate -- --name <descripcion>`. No se utiliza `prisma db push`, ya que no genera archivos de migración.

### Seed

El script `prisma/seed.ts` carga los datos necesarios para operar y probar el sistema:

- El catálogo de 8 permisos.
- Los 4 roles con sus permisos asignados.
- 6 usuarios de prueba, uno de ellos desactivado.
- 30 expedientes de ejemplo con distintos estatus, prioridades y autores; 2 de ellos con baja lógica.

El seed es idempotente: puede ejecutarse varias veces sin duplicar información. Los permisos de cada rol se sincronizan con el catálogo definido en el script, los usuarios se actualizan (incluida su contraseña) y los expedientes existentes no se modifican.

Para reiniciar la base de datos por completo, es decir, eliminar el schema, reaplicar las migraciones y ejecutar el seed, se utiliza:

```bash
npm run db:reset
```

Este comando elimina toda la información y no debe ejecutarse contra una base de datos de producción.

## Credenciales de prueba

Todos los usuarios comparten la contraseña definida en `SEED_PASSWORD` (por defecto, `Sigex2026!`). Al finalizar, el seed imprime en consola la tabla de correos generados.

Los correos dependen de la variable `SEED_EMAIL`. La siguiente tabla usa como ejemplo `SEED_EMAIL="usuario@dominio.com"`:

| Rol | Nombre | Correo con `SEED_EMAIL` | Correo sin `SEED_EMAIL` | Estado |
|---|---|---|---|---|
| Administrador | Ana Administradora | `usuario@dominio.com` | `admin@sigex.test` | Activo |
| Supervisor | Sergio Supervisor | `usuario+supervisor@dominio.com` | `supervisor@sigex.test` | Activo |
| Capturista | Carla Capturista | `usuario+capturista@dominio.com` | `capturista@sigex.test` | Activo |
| Capturista | Carlos Capturista | `usuario+capturista2@dominio.com` | `capturista2@sigex.test` | Activo |
| Consulta | Consuelo Consulta | `usuario+consulta@dominio.com` | `consulta@sigex.test` | Activo |
| Capturista | Iván Inactivo | `usuario+inactivo@dominio.com` | `inactivo@sigex.test` | Inactivo |

El segundo capturista permite comprobar que un capturista no puede editar expedientes creados por otro usuario. El usuario inactivo permite comprobar que una cuenta desactivada no puede iniciar sesión.

## Roles y permisos

Los permisos se asignan a roles y los roles a usuarios. El código nunca compara el nombre del rol; siempre consulta permisos concretos.

| Permiso | Habilita | Administrador | Supervisor | Capturista | Consulta |
|---|---|:---:|:---:|:---:|:---:|
| `expedientes:ver` | Listado y detalle de expedientes | Sí | Sí | Sí | Sí |
| `expedientes:crear` | Alta de expedientes | Sí | Sí | Sí | No |
| `expedientes:editar` | Edición de expedientes propios | Sí | Sí | Sí | No |
| `expedientes:editar_todos` | Edición de expedientes de cualquier usuario | Sí | Sí | No | No |
| `expedientes:cambiar_estatus` | Cambio de estatus | Sí | Sí | No | No |
| `expedientes:eliminar` | Baja lógica | Sí | No | No | No |
| `usuarios:gestionar` | Administración de usuarios | Sí | No | No | No |
| `bitacora:ver` | Consulta de la bitácora | Sí | No | No | No |

Los permisos `expedientes:editar_todos` y `expedientes:cambiar_estatus` complementan el catálogo mínimo solicitado. El primero permite expresar la regla "el capturista solo edita sus propios expedientes" sin depender del nombre del rol; el segundo separa el cambio de estatus de la edición general. La justificación se detalla en `ARQUITECTURA.md`.

## Scripts disponibles

| Script | Comando | Descripción |
|---|---|---|
| `dev` | `next dev` | Inicia el servidor de desarrollo. |
| `build` | `next build` | Genera la versión de producción. |
| `start` | `next start` | Ejecuta la versión de producción. |
| `lint` | `eslint` | Analiza el código con ESLint. |
| `postinstall` | `prisma generate` | Se ejecuta automáticamente después de `npm install`. |
| `db:generate` | `prisma generate` | Regenera el cliente de Prisma. |
| `db:migrate` | `prisma migrate dev` | Crea y aplica migraciones durante el desarrollo. |
| `db:deploy` | `prisma migrate deploy` | Aplica las migraciones existentes sin generar nuevas. |
| `db:seed` | `prisma db seed` | Ejecuta `prisma/seed.ts`. |
| `db:reset` | `prisma migrate reset` | Elimina el schema, reaplica las migraciones y ejecuta el seed. |
| `db:studio` | `prisma studio` | Abre una interfaz web para consultar las tablas. |

## Rutas de la aplicación

| Ruta | Acceso | Descripción |
|---|---|---|
| `/login` | Pública | Inicio de sesión. |
| `/recuperar` | Pública | Solicitud de recuperación de contraseña. |
| `/restablecer/[token]` | Pública | Definición de una nueva contraseña. |
| `/dashboard` | Sesión activa | Resumen de expedientes por estatus. |
| `/expedientes` | `expedientes:ver` | Listado con búsqueda, filtros y paginación. |
| `/expedientes/nuevo` | `expedientes:crear` | Alta de expediente. |
| `/expedientes/[id]` | `expedientes:ver` | Detalle, cambio de estatus y baja. |
| `/expedientes/[id]/editar` | `expedientes:editar` y ser el autor, o `expedientes:editar_todos` | Edición de expediente. |
| `/admin/usuarios` | `usuarios:gestionar` | Listado, alta, edición, activación y desactivación de usuarios. |
| `/admin/bitacora` | `bitacora:ver` | Consulta de la bitácora de auditoría. |
| `/no-autorizado` | Sesión activa | Página de acceso denegado. |

El archivo `src/proxy.ts` redirige a `/login` las peticiones sin sesión y a `/no-autorizado` las peticiones sin el permiso requerido. Esta es una primera barrera: cada página, Server Action y Route Handler vuelve a validar la sesión y los permisos en el servidor.

## API

Todos los endpoints responden en formato JSON, requieren una sesión válida y no se almacenan en caché.

### `GET /api/auth/me`

Devuelve el usuario de la sesión actual y sus permisos.

| Código | Situación |
|---|---|
| 200 | `{ usuario: { id, nombre, email, rol, permisos }, expiraEn }` |
| 401 | No existe una sesión válida. |
| 500 | Error interno. |

### `GET /api/expedientes`

Devuelve el listado paginado de expedientes activos. Requiere `expedientes:ver`.

| Parámetro | Tipo | Descripción |
|---|---|---|
| `pagina` | Entero ≥ 1 | Página solicitada. Valor por defecto: 1. |
| `porPagina` | Entero entre 1 y 50 | Registros por página. Valor por defecto: 10. |
| `busqueda` | Texto, máximo 100 caracteres | Coincidencia parcial en folio, título o solicitante. |
| `estatus` | `abierto`, `en_revision` o `cerrado` | Filtro por estatus. |
| `mios` | `1` | Limita el resultado a los expedientes creados por el usuario de la sesión. |

| Código | Situación |
|---|---|
| 200 | `{ datos: [...], paginacion: { pagina, porPagina, total, totalPaginas } }` |
| 400 | Parámetros inválidos. |
| 401 | No existe una sesión válida. |
| 403 | El usuario no tiene el permiso requerido. |
| 500 | Error interno. |

### `GET /api/bitacora`

Devuelve el listado paginado de la bitácora de auditoría. Requiere `bitacora:ver`.

| Parámetro | Tipo | Descripción |
|---|---|---|
| `pagina` | Entero ≥ 1 | Página solicitada. Valor por defecto: 1. |
| `porPagina` | Entero entre 1 y 100 | Registros por página. Valor por defecto: 20. |
| `usuarioId` | Entero | Usuario que realizó la acción. |
| `accion` | `crear`, `editar`, `cambiar_estatus` o `eliminar` | Tipo de acción. |
| `desde` | Fecha `AAAA-MM-DD` | Inicio del rango, en hora de la Ciudad de México. |
| `hasta` | Fecha `AAAA-MM-DD` | Fin del rango, inclusive. No puede ser anterior a `desde`. |
| `expediente` | Texto, máximo 30 caracteres | Folio completo o parcial. |

| Código | Situación |
|---|---|
| 200 | `{ datos: [...], paginacion: { pagina, porPagina, total, totalPaginas } }` |
| 400 | Parámetros inválidos, por ejemplo una fecha mal formada o un rango invertido. |
| 401 | No existe una sesión válida. |
| 403 | El usuario no tiene el permiso requerido. |
| 500 | Error interno. |

## Estructura del proyecto

```
sigex/
├── prisma/
│   ├── schema.prisma               Modelo de datos
│   ├── seed.ts                     Datos de prueba
│   └── migrations/                 Migraciones versionadas
├── src/
│   ├── proxy.ts                    Protección de rutas
│   ├── app/
│   │   ├── (auth)/                 Rutas públicas: login, recuperar, restablecer
│   │   ├── (app)/                  Rutas protegidas: dashboard, expedientes, admin
│   │   ├── api/                    Route Handlers
│   │   └── no-autorizado/
│   ├── actions/                    Server Actions (mutaciones)
│   ├── lib/                        Sesión, permisos, auditoría, correo, consultas
│   │   └── validations/            Esquemas Zod
│   ├── hooks/                      useSession, usePermission, useExpedientes, useDebounce...
│   ├── components/                 Componentes de interfaz y de cada módulo
│   ├── emails/                     Plantillas de correo
│   └── types/                      Tipos compartidos entre la API y el cliente
├── .env.example
├── README.md
└── ARQUITECTURA.md
```