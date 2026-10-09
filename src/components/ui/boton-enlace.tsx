
import Link from "next/link";
import type { ComponentProps } from "react";

const ESTILOS = {
  primario: "bg-teal-800 text-white shadow-sm hover:bg-teal-900",
  secundario: "bg-white text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50",
};

type Props = ComponentProps<typeof Link> & { variante?: keyof typeof ESTILOS };

export function BotonEnlace({ variante = "primario", className = "", ...props }: Props) {
  return (
    <Link
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800 ${ESTILOS[variante]} ${className}`}
      {...props}
    />
  );
}