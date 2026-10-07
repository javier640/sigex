"use client";

import { useActionState } from "react";
import { restablecerPasswordAction, type RestablecerState } from "@/actions/auth.actions";
import { Alerta } from "@/components/ui/alerta";
import { CampoFormulario } from "@/components/ui/campo-formulario";
import { Enlace } from "@/components/ui/enlace";
import { SubmitButton } from "@/components/ui/submit-button";
import { DESCRIPCION_POLITICA_PASSWORD } from "@/lib/validations/auth";

const ESTADO_INICIAL: RestablecerState = {};

export function RestablecerForm({ token }: { token: string }) {
  const [estado, formAction] = useActionState(restablecerPasswordAction, ESTADO_INICIAL);

  return (
    <form action={formAction} noValidate className="space-y-6">
      <input type="hidden" name="token" value={token} />

      {estado.error && (
        <Alerta variante="error">
          {estado.error}{" "}
          {estado.enlaceInvalido && (
            <Enlace href="/recuperar" className="text-red-900">
              Solicitar un enlace nuevo
            </Enlace>
          )}
        </Alerta>
      )}

      <CampoFormulario
        id="password"
        label="Nueva contraseña"
        type="password"
        autoComplete="new-password"
        autoFocus
        ayuda={DESCRIPCION_POLITICA_PASSWORD}
        error={estado.fieldErrors?.password?.[0]}
      />

      <CampoFormulario
        id="confirmacion"
        label="Confirma la contraseña"
        type="password"
        autoComplete="new-password"
        error={estado.fieldErrors?.confirmacion?.[0]}
      />

      <SubmitButton textoPendiente="Guardando…" className="w-full">
        Guardar contraseña
      </SubmitButton>
    </form>
  );
}