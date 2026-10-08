"use client";

/**
 * Muestra su contenido solo si el usuario tiene el permiso.
 *
 *   <Can permiso={PERMISOS.EXPEDIENTES_ELIMINAR}>
 *     <BotonEliminar />
 *   </Can>
 *
 * En Server Components no hace falta: ahí se usa can(sesion.usuario, ...).
 */
import type { ReactNode } from "react";
import type { Permiso } from "@/lib/permissions";
import { usePermission } from "@/hooks/use-permission";

type Props = {
  permiso: Permiso;
  children: ReactNode;
  /** Qué mostrar si no tiene el permiso (por defecto, nada). */
  alternativa?: ReactNode;
};

export function Can({ permiso, children, alternativa = null }: Props) {
  return usePermission(permiso) ? children : alternativa;
}