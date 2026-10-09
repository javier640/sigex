"use client";

import { useActionState } from "react";
import { solicitarRecuperacionAction, type RecuperarState } from "@/actions/auth.actions";
import { Alerta } from "@/components/ui/alerta";
import { CampoFormulario } from "@/components/ui/campo-formulario";
import { Enlace } from "@/components/ui/enlace";
import { SubmitButton } from "@/components/ui/submit-button";

const ESTADO_INICIAL: RecuperarState = {};

export function RecuperarForm({ minutos }: { minutos: number }) {
  const [estado, formAction] = useActionState(solicitarRecuperacionAction, ESTADO_INICIAL);

  if (estado.enviado) {
    return (
      <div className="space-y-6">
        <Alerta variante="exito">
          Si <strong className="font-semibold">{estado.email}</strong> corresponde a una cuenta activa,
          recibirás un correo con un enlace para definir una nueva contraseña. El enlace vence en{" "}
          {minutos} minutos.
        </Alerta>
        <p className="text-sm text-slate-600">
          ¿No llegó? Revisa tu carpeta de spam o espera unos minutos antes de solicitarlo otra vez.
        </p>
        <Enlace href="/login" className="inline-block text-sm">
          Volver a iniciar sesión
        </Enlace>
      </div>
    );
  }

  return (
    <form action={formAction} noValidate className="space-y-6">
      <CampoFormulario
        id="email"
        label="Correo"
        type="email"
        autoComplete="email"
        autoFocus
        placeholder="nombre@dominio.com"
        defaultValue={estado.email}
        error={estado.fieldErrors?.email?.[0]}
      />

      <SubmitButton textoPendiente="Enviando…" className="w-full">
        Enviar enlace
      </SubmitButton>

      <p className="text-center text-sm text-slate-600">
        ¿Ya la recordaste? <Enlace href="/login">Inicia sesión</Enlace>
      </p>
    </form>
  );
}