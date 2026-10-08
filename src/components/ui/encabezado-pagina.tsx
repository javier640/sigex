/**
 * Título de página con descripción y acciones opcionales a la derecha.
 */
import type { ReactNode } from "react";

type Props = {
  titulo: string;
  descripcion?: string;
  acciones?: ReactNode;
};

export function EncabezadoPagina({ titulo, descripcion, acciones }: Props) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{titulo}</h1>
        {descripcion && <p className="mt-1 text-sm text-slate-600">{descripcion}</p>}
      </div>
      {acciones && <div className="flex flex-wrap gap-3">{acciones}</div>}
    </div>
  );
}