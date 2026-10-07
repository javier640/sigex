/**
 * SIGEX · Modelo de permisos
 *
 * Este archivo es "puro": no toca BD, cookies ni nada exclusivo del servidor.
 * Por eso se puede importar desde cualquier lugar:
 *  - Servidor: proxy.ts, layouts, Server Actions, Route Handlers.
 *  - Cliente: hooks como usePermission para mostrar u ocultar botones.
 *
 * Regla del proyecto: NUNCA se valida comparando el nombre del rol
 * (if (rol === 'admin')). Siempre se pregunta por un permiso concreto.
 */

// ─────────────────────────────────────────────
// Catálogo de permisos
// ─────────────────────────────────────────────
// Debe coincidir con las claves que inserta prisma/seed.ts.

export const PERMISOS = {
  EXPEDIENTES_VER: "expedientes:ver",
  EXPEDIENTES_CREAR: "expedientes:crear",
  EXPEDIENTES_EDITAR: "expedientes:editar",
  EXPEDIENTES_EDITAR_TODOS: "expedientes:editar_todos",
  EXPEDIENTES_CAMBIAR_ESTATUS: "expedientes:cambiar_estatus",
  EXPEDIENTES_ELIMINAR: "expedientes:eliminar",
  USUARIOS_GESTIONAR: "usuarios:gestionar",
  BITACORA_VER: "bitacora:ver",
} as const;

/** Unión de todas las claves válidas: "expedientes:ver" | "expedientes:crear" | ... */
export type Permiso = (typeof PERMISOS)[keyof typeof PERMISOS];

/** Lo mínimo que se necesita para evaluar permisos (compatible con UsuarioSesion). */
export type SujetoConPermisos = {
  id: number;
  permisos: readonly string[];
};

// ─────────────────────────────────────────────
// Verificaciones generales
// ─────────────────────────────────────────────

/** ¿El usuario tiene este permiso? Un usuario nulo nunca tiene permisos. */
export function can(
  usuario: SujetoConPermisos | null | undefined,
  permiso: Permiso,
): boolean {
  return usuario?.permisos.includes(permiso) ?? false;
}

/** ¿El usuario tiene al menos uno de estos permisos? */
export function canAny(
  usuario: SujetoConPermisos | null | undefined,
  permisos: readonly Permiso[],
): boolean {
  return permisos.some((p) => can(usuario, p));
}

// ─────────────────────────────────────────────
// Reglas que dependen del recurso
// ─────────────────────────────────────────────

/**
 * Edición de expedientes:
 *  - Necesita siempre `expedientes:editar`.
 *  - Con `expedientes:editar_todos` edita cualquiera (Admin, Supervisor).
 *  - Sin él, solo los que creó (Capturista: "editar propios").
 */
export function puedeEditarExpediente(
  usuario: SujetoConPermisos | null | undefined,
  expediente: { creadoPorId: number },
): boolean {
  if (!usuario || !can(usuario, PERMISOS.EXPEDIENTES_EDITAR)) return false;
  if (can(usuario, PERMISOS.EXPEDIENTES_EDITAR_TODOS)) return true;
  return expediente.creadoPorId === usuario.id;
}

// ─────────────────────────────────────────────
// Permisos por ruta (los usa proxy.ts)
// ─────────────────────────────────────────────

type ReglaRuta = { patron: RegExp; permiso: Permiso };

/**
 * Ordenadas de la más específica a la más general: gana la primera que coincide.
 * Las rutas protegidas que no aparecen aquí (ej. /dashboard) solo requieren sesión.
 *
 * Nota: para /expedientes/[id]/editar el proxy solo puede verificar el permiso
 * general; si el expediente es propio o no se valida en la página y en la
 * Server Action, porque requiere consultar el expediente.
 */
const REGLAS_RUTAS: readonly ReglaRuta[] = [
  { patron: /^\/expedientes\/nuevo\/?$/, permiso: PERMISOS.EXPEDIENTES_CREAR },
  { patron: /^\/expedientes\/[^/]+\/editar\/?$/, permiso: PERMISOS.EXPEDIENTES_EDITAR },
  { patron: /^\/expedientes(\/|$)/, permiso: PERMISOS.EXPEDIENTES_VER },
  { patron: /^\/admin\/usuarios(\/|$)/, permiso: PERMISOS.USUARIOS_GESTIONAR },
  { patron: /^\/admin\/bitacora(\/|$)/, permiso: PERMISOS.BITACORA_VER },
];

/** Devuelve el permiso que exige una ruta, o null si basta con tener sesión. */
export function permisoRequeridoParaRuta(pathname: string): Permiso | null {
  return REGLAS_RUTAS.find((r) => r.patron.test(pathname))?.permiso ?? null;
}