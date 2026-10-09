
import type { ReactNode } from "react";

type Variante = "error" | "exito" | "info";

const ESTILOS: Record<Variante, string> = {
  error: "border-red-200 bg-red-50 text-red-800",
  exito: "border-emerald-200 bg-emerald-50 text-emerald-800",
  info: "border-sky-200 bg-sky-50 text-sky-900",
};

export function Alerta({ variante, children }: { variante: Variante; children: ReactNode }) {
  return (
    <div
      role={variante === "error" ? "alert" : "status"}
      className={`rounded-lg border px-3.5 py-3 text-sm leading-relaxed ${ESTILOS[variante]}`}
    >
      {children}
    </div>
  );
}