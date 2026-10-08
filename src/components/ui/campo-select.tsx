/**
 * Lista desplegable accesible, con la misma estructura que CampoFormulario.
 */
import type { ReactNode, SelectHTMLAttributes } from "react";

type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, "id" | "className"> & {
  id: string;
  label: string;
  error?: string;
  ayuda?: string;
  children: ReactNode;
};

export function CampoSelect({ id, label, error, ayuda, name, children, ...selectProps }: Props) {
  const idAyuda = ayuda ? `${id}-ayuda` : undefined;
  const idError = error ? `${id}-error` : undefined;
  const describedBy = [idAyuda, idError].filter(Boolean).join(" ") || undefined;

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-slate-800">
        {label}
      </label>
      <select
        id={id}
        name={name ?? id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm transition focus:border-teal-700 focus:ring-4 focus:ring-teal-700/15 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 aria-invalid:border-red-600"
        {...selectProps}
      >
        {children}
      </select>
      {ayuda && (
        <p id={idAyuda} className="text-sm text-slate-500">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={idError} className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}