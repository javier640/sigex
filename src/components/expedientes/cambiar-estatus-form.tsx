"use client";

/**
 * Cambio de estatus desde el detalle del expediente.
 * Solo se muestra a quien tiene expedientes:cambiar_estatus (Admin, Supervisor).
 */
import { useActionState } from "react";
import type { EstatusExpediente } from "@prisma/client";
import { cambiarEstatusAction, type EstadoAccion } from "@/actions/expedientes.actions";
import { ESTATUS, ORDEN_ESTATUS } from "@/lib/catalogos";
import { Alerta } from "@/components/ui/alerta";
import { CampoSelect } from "@/components/ui/campo-select";
import { SubmitButton } from "@/components/ui/submit-button";

const ESTADO_INICIAL: EstadoAccion = {};

export function CambiarEstatusForm({ expedienteId, estatus }: { expedienteId: number; estatus: EstatusExpediente }) {
  const [estado, formAction] = useActionState(cambiarEstatusAction, ESTADO_INICIAL);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="expedienteId" value={expedienteId} />
      <CampoSelect id="estatus" label="Estatus" defaultValue={estatus}>
        {ORDEN_ESTATUS.map((e) => (
          <option key={e} value={e}>
            {ESTATUS[e].etiqueta}
          </option>
        ))}
      </CampoSelect>
      <SubmitButton variante="secundario" textoPendiente="Actualizando…" className="w-full">
        Actualizar estatus
      </SubmitButton>
      {estado.error && <Alerta variante="error">{estado.error}</Alerta>}
      {estado.ok && <Alerta variante="exito">Estatus actualizado.</Alerta>}
    </form>
  );
}