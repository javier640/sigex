"use client";

/**
 * Botón de envío reutilizable. Se desactiva solo mientras el formulario
 * padre ejecuta su Server Action (useFormStatus lee el estado del <form>).
 */
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

type Props = {
  children: ReactNode;
  textoPendiente?: string;
  variante?: "primario" | "secundario";
  className?: string;
};

const ESTILOS = {
  primario: "bg-teal-800 text-white shadow-sm hover:bg-teal-900 focus-visible:outline-teal-800",
  secundario:
    "bg-white text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50 focus-visible:outline-teal-800",
};

export function SubmitButton({ children, textoPendiente, variante = "primario", className = "" }: Props) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${ESTILOS[variante]} ${className}`}
    >
      {pending && (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none"
        />
      )}
      {pending && textoPendiente ? textoPendiente : children}
    </button>
  );
}