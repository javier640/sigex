"use client";

/**
 * Baja lógica con confirmación en línea.
 *
 * Usa useTransition para llamar a la Server Action como una función normal
 * (sin <form>): así puede ejecutar algo DESPUÉS de que termine, como
 * recargar el listado o navegar a otra página.
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { eliminarExpedienteAction } from "@/actions/expedientes.actions";

type Props = {
  expedienteId: number;
  folio: string;
  /** Se ejecuta al eliminar (ej. recargar el listado). */
  alEliminar?: () => void;
  /** Si se indica, navega a esta ruta al eliminar (ej. desde el detalle). */
  redirigirA?: string;
  tamano?: "normal" | "chico";
};

export function BotonEliminarExpediente({ expedienteId, folio, alEliminar, redirigirA, tamano = "chico" }: Props) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciarTransicion] = useTransition();

  const texto = tamano === "chico" ? "text-xs px-2.5 py-1.5 rounded-md" : "text-sm px-4 py-2.5 rounded-lg";

  function eliminar() {
    setError(null);
    iniciarTransicion(async () => {
      const resultado = await eliminarExpedienteAction(expedienteId);
      if (resultado.error) {
        setError(resultado.error);
        return;
      }
      setConfirmando(false);
      if (redirigirA) router.push(redirigirA);
      else alEliminar?.();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      {confirmando ? (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="text-xs text-slate-600">¿Dar de baja {folio}?</span>
          <button
            type="button"
            onClick={eliminar}
            disabled={pendiente}
            className={`inline-flex items-center gap-2 bg-red-700 font-semibold text-white shadow-sm hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:opacity-60 ${texto}`}
          >
            {pendiente && (
              <span
                aria-hidden="true"
                className="size-3.5 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none"
              />
            )}
            {pendiente ? "Eliminando…" : "Sí, dar de baja"}
          </button>
          <button
            type="button"
            onClick={() => setConfirmando(false)}
            disabled={pendiente}
            className={`font-medium text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-teal-800 ${texto}`}
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className={`font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-700 ${texto}`}
        >
          Eliminar
        </button>
      )}
      {error && (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}