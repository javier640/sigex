import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";

// ─────────────────────────────────────────────
// Configuración
// ─────────────────────────────────────────────

export const SESSION_COOKIE = "sigex_session";

/** Duración de la sesión: una jornada laboral (8 horas). */
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

// ─────────────────────────────────────────────
// Tipos públicos
// ─────────────────────────────────────────────

export type UsuarioSesion = {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  permisos: string[];
};

export type Sesion = {
  usuario: UsuarioSesion;
  expiraEn: Date;
};

// ─────────────────────────────────────────────
// Utilidades internas
// ─────────────────────────────────────────────

function generarToken(): string {
  // 32 bytes = 256 bits de entropía; base64url es seguro para cookies
  return randomBytes(32).toString("base64url");
}

function hashToken(token: string): string {
  // SHA-256 basta: el token ya es aleatorio y largo, no necesita bcrypt
  return createHash("sha256").update(token).digest("hex");
}

// ─────────────────────────────────────────────
// Crear sesión (login)
// ─────────────────────────────────────────────

/**
 * Crea la sesión en BD y escribe la cookie.
 * Llamar solo desde una Server Action o un Route Handler,
 * DESPUÉS de verificar credenciales y que el usuario esté activo.
 */
export async function crearSesion(usuarioId: number): Promise<void> {
  const token = generarToken();
  const expiraEn = new Date(Date.now() + SESSION_DURATION_MS);

  await db.sesion.create({
    data: { id: hashToken(token), usuarioId, expiraEn },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiraEn,
  });
}

// ─────────────────────────────────────────────
// Validar sesión
// ─────────────────────────────────────────────

/**
 * Valida un token de sesión y devuelve el usuario con sus permisos.
 * Recibe el token como parámetro para poder usarse también desde
 * proxy.ts, donde la cookie se lee de `request.cookies`.
 *
 * Devuelve null si la sesión no existe, expiró o el usuario está inactivo.
 */
export async function validarTokenSesion(token: string): Promise<Sesion | null> {
  if (!token) return null;

  const sesionId = hashToken(token);

  const sesion = await db.sesion.findUnique({
    where: { id: sesionId },
    select: {
      expiraEn: true,
      usuario: {
        select: {
          id: true,
          nombre: true,
          email: true,
          activo: true,
          rol: {
            select: {
              nombre: true,
              permisos: { select: { permiso: { select: { clave: true } } } },
            },
          },
        },
      },
    },
  });

  if (!sesion) return null;

  // Sesión expirada: se borra de forma perezosa
  if (sesion.expiraEn.getTime() <= Date.now()) {
    await db.sesion.deleteMany({ where: { id: sesionId } });
    return null;
  }

  const { usuario } = sesion;

  // Usuario desactivado: se invalidan TODAS sus sesiones
  if (!usuario.activo) {
    await db.sesion.deleteMany({ where: { usuarioId: usuario.id } });
    return null;
  }

  return {
    expiraEn: sesion.expiraEn,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol.nombre,
      permisos: usuario.rol.permisos.map((rp: { permiso: { clave: string } }) => rp.permiso.clave),
    },
  };
}

/**
 * Obtiene la sesión de la petición actual leyendo la cookie.
 * Usar en Server Components, Server Actions y Route Handlers.
 *
 * `cache` de React hace que, dentro de una misma petición, la consulta
 * a BD se ejecute una sola vez aunque layout, página y componentes
 * llamen a esta función por separado.
 */
export const obtenerSesion = cache(async (): Promise<Sesion | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return validarTokenSesion(token);
});

// ─────────────────────────────────────────────
// Destruir sesiones
// ─────────────────────────────────────────────

/**
 * Cierra la sesión actual: la borra de BD y elimina la cookie.
 * Llamar solo desde una Server Action o un Route Handler (logout).
 */
export async function destruirSesion(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    // deleteMany no lanza error si la sesión ya no existe
    await db.sesion.deleteMany({ where: { id: hashToken(token) } });
  }

  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Invalida todas las sesiones de un usuario.
 * Usar al cambiar su contraseña o al desactivarlo.
 * Devuelve cuántas sesiones se eliminaron (útil para la bitácora).
 */
export async function destruirSesionesDeUsuario(usuarioId: number): Promise<number> {
  const { count } = await db.sesion.deleteMany({ where: { usuarioId } });
  return count;
}

/**
 * Elimina de BD todas las sesiones expiradas.
 * No es indispensable (las expiradas se borran al intentar usarlas),
 * pero sirve para mantener la tabla limpia, por ejemplo desde un cron.
 */
export async function limpiarSesionesExpiradas(): Promise<number> {
  const { count } = await db.sesion.deleteMany({
    where: { expiraEn: { lte: new Date() } },
  });
  return count;
}