/**
 * Etiqueta pequeña para estados (Activo, Abierto, Urgente...).
 * Recibe las clases de color desde un catálogo para que cada módulo
 * defina sus propios colores sin duplicar la forma.
 */
import type { ReactNode } from "react";

export function Insignia({ colores, children }: { colores: string; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset ${colores}`}
    >
      {children}
    </span>
  );
}