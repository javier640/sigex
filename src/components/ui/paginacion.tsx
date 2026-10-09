/**
 * Controles de paginación: "Página X de Y" con Anterior / Siguiente.
 */
type Props = {
  pagina: number;
  totalPaginas: number;
  total: number;
  onCambiar: (pagina: number) => void;
  deshabilitado?: boolean;
  /** Cómo se llaman los elementos contados (por defecto, expedientes). */
  etiqueta?: { singular: string; plural: string };
};

const CLASES_BOTON =
  "rounded-lg px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800 disabled:cursor-not-allowed disabled:opacity-50";

export function Paginacion({
  pagina,
  totalPaginas,
  total,
  onCambiar,
  deshabilitado = false,
  etiqueta = { singular: "expediente", plural: "expedientes" },
}: Props) {
  return (
    <nav aria-label="Paginación" className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-slate-600">
        Página <span className="font-medium text-slate-900">{pagina}</span> de{" "}
        <span className="font-medium text-slate-900">{totalPaginas}</span>
        <span className="text-slate-400"> · </span>
        {total === 1 ? `1 ${etiqueta.singular}` : `${total} ${etiqueta.plural}`}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onCambiar(pagina - 1)}
          disabled={deshabilitado || pagina <= 1}
          className={CLASES_BOTON}
        >
          Anterior
        </button>
        <button
          type="button"
          onClick={() => onCambiar(pagina + 1)}
          disabled={deshabilitado || pagina >= totalPaginas}
          className={CLASES_BOTON}
        >
          Siguiente
        </button>
      </div>
    </nav>
  );
}