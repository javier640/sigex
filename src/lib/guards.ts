/**
 * SIGEX · Guards de autorización (solo servidor)
 *
 * Combinan la sesión (session.ts) con el modelo de permisos (permissions.ts).
 * Están separados de permissions.ts porque dependen de cookies y BD,
 * y permissions.ts debe poder importarse también desde el cliente.
 *
 * Dos estilos, según quién los use:
 *  - requerir*:  redirigen. Para páginas y layouts (Server Components).
 *  - verificar*: devuelven un resultado. Para Server Actions y Route
 *                Handlers, que deben responder con un error o código HTTP.
 */
import "server-only";
import { redirect } from "next/navigation";
import { obtenerSesion, type Sesion } from "@/lib/session";
import { can, type Permiso } from "@/lib/permissions";

// ─────────────────────────────────────────────
// Para páginas y layouts: redirigen
// ─────────────────────────────────────────────

/** Exige sesión; si no hay, redirige a /login. */
export async function requerirSesion(): Promise<Sesion> {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/login");
  return sesion;
}

/** Exige sesión y permiso; redirige a /login o a /no-autorizado. */
export async function requerirPermiso(permiso: Permiso): Promise<Sesion> {
  const sesion = await requerirSesion();
  if (!can(sesion.usuario, permiso)) redirect("/no-autorizado");
  return sesion;
}

// ─────────────────────────────────────────────
// Para Server Actions y Route Handlers: devuelven resultado
// ─────────────────────────────────────────────

export type ResultadoAcceso =
  | { ok: true; sesion: Sesion }
  | { ok: false; status: 401 | 403; mensaje: string };

/**
 * Verifica sesión y, opcionalmente, un permiso.
 *  - 401: no hay sesión válida.
 *  - 403: hay sesión, pero falta el permiso.
 *
 * Ejemplo en un Route Handler:
 *   const acceso = await verificarAcceso(PERMISOS.BITACORA_VER);
 *   if (!acceso.ok) {
 *     return NextResponse.json({ error: acceso.mensaje }, { status: acceso.status });
 *   }
 */
export async function verificarAcceso(permiso?: Permiso): Promise<ResultadoAcceso> {
  const sesion = await obtenerSesion();

  if (!sesion) {
    return { ok: false, status: 401, mensaje: "No autenticado." };
  }

  if (permiso && !can(sesion.usuario, permiso)) {
    return { ok: false, status: 403, mensaje: "No tienes permiso para realizar esta acción." };
  }

  return { ok: true, sesion };
}