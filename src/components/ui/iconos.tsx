/**
 * Íconos de línea en SVG. Heredan el color del texto (currentColor)
 * y son decorativos: el texto junto a ellos ya describe la acción.
 */
type NombreIcono = "inicio" | "expedientes" | "usuarios" | "bitacora" | "menu" | "cerrar" | "mas";

const TRAZOS: Record<NombreIcono, string[]> = {
  inicio: ["M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"],
  expedientes: ["M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"],
  usuarios: [
    "M16 20v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1",
    "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7",
    "M22 20v-1a4 4 0 0 0-3-3.87",
    "M16 4.13a3.5 3.5 0 0 1 0 6.75",
  ],
  bitacora: ["M9 3h6v3H9z", "M7 4.5H5a1 1 0 0 0-1 1V20a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V5.5a1 1 0 0 0-1-1h-2", "M8 11h8", "M8 15h5"],
  menu: ["M4 6h16", "M4 12h16", "M4 18h16"],
  cerrar: ["M6 6l12 12", "M18 6 6 18"],
  mas: ["M12 5v14", "M5 12h14"],
};

export function Icono({ nombre, className = "size-5" }: { nombre: NombreIcono; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {TRAZOS[nombre].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}