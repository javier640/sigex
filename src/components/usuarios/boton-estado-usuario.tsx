"use client";


import { useActionState, useState } from "react";
import { cambiarEstadoUsuarioAction, type EstadoAccion } from "@/actions/usuarios.actions";
import { SubmitButton } from "@/components/ui/submit-button";

type Props = {
  usuarioId: number;
  nombre: string;
  activo: boolean;
};

const ESTADO_INICIAL: EstadoAccion = {};

export function BotonEstadoUsuario({ usuarioId, nombre, activo }: Props) {
  const [estado, formAction] = useActionState(cambiarEstadoUsuarioAction, ESTADO_INICIAL);
  const [confirmando, setConfirmando] = useState(false);

  const camposOcultos = (
    <>
      <input type="hidden" name="usuarioId" value={usuarioId} />
      <input type="hidden" name="activar" value={String(!activo)} />
    </>
  );

  return (
    <div className="flex flex-col items-end gap-1.5">
      {!activo ? (
        <form action={formAction}>
          {camposOcultos}
          <SubmitButton variante="secundario" tamano="chico" textoPendiente="Activando…">
            Activar
          </SubmitButton>
        </form>
      ) : confirmando ? (
        <form action={formAction} className="flex items-center gap-2">
          {camposOcultos}
          <span className="text-xs text-slate-600">¿Desactivar a {nombre.split(" ")[0]}?</span>
          <SubmitButton variante="peligro" tamano="chico" textoPendiente="Desactivando…">
            Sí, desactivar
          </SubmitButton>
          <button
            type="button"
            onClick={() => setConfirmando(false)}
            className="rounded-md px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-teal-800"
          >
            Cancelar
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-700"
        >
          Desactivar
        </button>
      )}

      {estado.error && (
        <p role="alert" className="text-xs text-red-700">
          {estado.error}
        </p>
      )}
    </div>
  );
}