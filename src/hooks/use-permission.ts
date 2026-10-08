"use client";

import { can, type Permiso } from "@/lib/permissions";
import { useSession } from "@/hooks/use-session";

/**
 * ¿El usuario actual tiene este permiso?
 * Úsalo para mostrar u ocultar elementos en la interfaz. NO es seguridad:
 * la acción o API correspondiente siempre valida de nuevo en el servidor.
 */
export function usePermission(permiso: Permiso): boolean {
  const { usuario } = useSession();
  return can(usuario, permiso);
}