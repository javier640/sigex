"use client";

/**
 * Formulario de alta y edición de expedientes.
 * El estatus NO se edita aquí: tiene su propia acción y su propio permiso.
 */
import { useActionState } from "react";
import type { PrioridadExpediente } from "@prisma/client";
import type { ExpedienteFormState } from "@/actions/expedientes.actions";
import { ORDEN_PRIORIDAD, PRIORIDAD } from "@/lib/catalogos";
import { Alerta } from "@/components/ui/alerta";
import { BotonEnlace } from "@/components/ui/boton-enlace";
import { CampoFormulario } from "@/components/ui/campo-formulario";
import { CampoSelect } from "@/components/ui/campo-select";
import { CampoTextarea } from "@/components/ui/campo-textarea";
import { SubmitButton } from "@/components/ui/submit-button";

type Props = {
  modo: "crear" | "editar";
  accion: (estado: ExpedienteFormState, formData: FormData) => Promise<ExpedienteFormState>;
  inicial?: {
    titulo: string;
    solicitante: string;
    prioridad: PrioridadExpediente;
    descripcion: string | null;
  };
  /** A dónde lleva "Cancelar". */
  urlCancelar: string;
};

const ESTADO_INICIAL: ExpedienteFormState = {};

export function ExpedienteForm({ modo, accion, inicial, urlCancelar }: Props) {
  const [estado, formAction] = useActionState(accion, ESTADO_INICIAL);
  const errores = estado.fieldErrors;

  const valor = {
    titulo: estado.valores?.titulo ?? inicial?.titulo ?? "",
    solicitante: estado.valores?.solicitante ?? inicial?.solicitante ?? "",
    prioridad: estado.valores?.prioridad ?? inicial?.prioridad ?? "media",
    descripcion: estado.valores?.descripcion ?? inicial?.descripcion ?? "",
  };

  return (
    <form action={formAction} noValidate className="space-y-6">
      {estado.error && <Alerta variante="error">{estado.error}</Alerta>}

      <CampoFormulario
        id="titulo"
        label="Título"
        autoComplete="off"
        placeholder="Ej. Solicitud de constancia de no adeudo"
        defaultValue={valor.titulo}
        error={errores?.titulo?.[0]}
      />

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <CampoFormulario
            id="solicitante"
            label="Solicitante"
            autoComplete="off"
            placeholder="Nombre de la persona o dependencia"
            defaultValue={valor.solicitante}
            error={errores?.solicitante?.[0]}
          />
        </div>
        <CampoSelect id="prioridad" label="Prioridad" defaultValue={valor.prioridad} error={errores?.prioridad?.[0]}>
          {ORDEN_PRIORIDAD.map((p) => (
            <option key={p} value={p}>
              {PRIORIDAD[p].etiqueta}
            </option>
          ))}
        </CampoSelect>
      </div>

      <CampoTextarea
        id="descripcion"
        label="Descripción"
        rows={6}
        placeholder="Detalles del trámite, documentos recibidos, observaciones…"
        ayuda="Opcional. Hasta 5000 caracteres."
        defaultValue={valor.descripcion}
        error={errores?.descripcion?.[0]}
      />

      <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-6">
        <BotonEnlace href={urlCancelar} variante="secundario">
          Cancelar
        </BotonEnlace>
        <SubmitButton textoPendiente="Guardando…">
          {modo === "crear" ? "Crear expediente" : "Guardar cambios"}
        </SubmitButton>
      </div>
    </form>
  );
}