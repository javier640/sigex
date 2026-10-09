
import type { RegistroBitacora, ValorBitacora, ValoresBitacora } from "@/types/bitacora";
import { CAMPO_EXPEDIENTE, ESTATUS, PRIORIDAD } from "@/lib/catalogos";
import { formatearFechaHora } from "@/lib/formato";

function formatearValor(campo: string, valor: ValorBitacora | undefined): string {
  if (valor === null || valor === undefined || valor === "") return "—";
  if (campo === "estatus" && typeof valor === "string" && valor in ESTATUS) {
    return ESTATUS[valor as keyof typeof ESTATUS].etiqueta;
  }
  if (campo === "prioridad" && typeof valor === "string" && valor in PRIORIDAD) {
    return PRIORIDAD[valor as keyof typeof PRIORIDAD].etiqueta;
  }
  if (campo === "eliminadoEn" && typeof valor === "string") return formatearFechaHora(valor);
  return String(valor);
}

function nombreCampo(campo: string): string {
  return CAMPO_EXPEDIENTE[campo] ?? campo;
}

function ListaValores({ valores }: { valores: ValoresBitacora }) {
  const campos = Object.keys(valores).filter((c) => c !== "eliminadoEn" || valores[c] !== null);
  return (
    <dl className="grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-3">
      {campos.map((campo) => (
        <div key={campo} className="contents">
          <dt className="text-slate-500">{nombreCampo(campo)}</dt>
          <dd className="break-words text-slate-800 sm:col-span-2">
            <span className="line-clamp-3">{formatearValor(campo, valores[campo])}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function CambiosRegistro({ registro }: { registro: RegistroBitacora }) {
  const anteriores = registro.valoresAnteriores ?? {};
  const nuevos = registro.valoresNuevos ?? {};

  if (registro.accion === "crear") {
    return <ListaValores valores={nuevos} />;
  }

  if (registro.accion === "eliminar") {
    return (
      <div className="space-y-2 text-sm">
        <p className="text-slate-800">
          Expediente dado de baja
          {typeof nuevos.eliminadoEn === "string" && ` el ${formatearFechaHora(nuevos.eliminadoEn)}`}.
        </p>
        {Object.keys(anteriores).length > 0 && (
          <details className="group rounded-lg bg-slate-50 p-3">
            <summary className="cursor-pointer text-sm font-medium text-teal-800 hover:underline">
              Datos que tenía al darse de baja
            </summary>
            <div className="mt-3">
              <ListaValores valores={anteriores} />
            </div>
          </details>
        )}
      </div>
    );
  }

  const campos = [...new Set([...Object.keys(anteriores), ...Object.keys(nuevos)])];
  return (
    <ul className="space-y-2 text-sm">
      {campos.map((campo) => (
        <li key={campo}>
          <span className="font-medium text-slate-700">{nombreCampo(campo)}: </span>
          <span className="break-words text-slate-500 line-through decoration-slate-300">
            {formatearValor(campo, anteriores[campo])}
          </span>
          <span aria-label="cambió a" className="mx-1.5 text-slate-400">
            →
          </span>
          <span className="break-words font-medium text-slate-900">{formatearValor(campo, nuevos[campo])}</span>
        </li>
      ))}
    </ul>
  );
}