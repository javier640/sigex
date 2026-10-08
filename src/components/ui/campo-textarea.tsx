/**
 * Área de texto accesible, con la misma estructura que CampoFormulario.
 */
import type { TextareaHTMLAttributes } from "react";

type Props = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id" | "className"> & {
  id: string;
  label: string;
  error?: string;
  ayuda?: string;
};

export function CampoTextarea({ id, label, error, ayuda, name, rows = 5, ...props }: Props) {
  const idAyuda = ayuda ? `${id}-ayuda` : undefined;
  const idError = error ? `${id}-error` : undefined;
  const describedBy = [idAyuda, idError].filter(Boolean).join(" ") || undefined;

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-slate-800">
        {label}
      </label>
      <textarea
        id={id}
        name={name ?? id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-teal-700 focus:ring-4 focus:ring-teal-700/15 focus:outline-none aria-invalid:border-red-600"
        {...props}
      />
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