"use client";

/**
 * Captura errores inesperados al renderizar páginas de (app).
 * No muestra el detalle técnico al usuario; solo lo registra en consola.
 */
import { useEffect } from "react";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorApp({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-900/5">
      <p className="text-sm font-semibold tracking-wide text-red-700">ALGO SALIÓ MAL</p>
      <h1 className="mt-2 text-xl font-semibold tracking-tight">No pudimos cargar esta sección</h1>
      <p className="mt-2 text-sm text-slate-600">
        Intenta de nuevo. Si el problema continúa, avisa al administrador
        {error.digest && (
          <>
            {" "}con el código <code className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-800">{error.digest}</code>
          </>
        )}
        .
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-lg bg-teal-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800"
      >
        Reintentar
      </button>
    </div>
  );
}