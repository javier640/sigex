/**
 * Edición de un expediente.
 * El proxy ya verificó expedientes:editar; aquí además se aplica la regla
 * "editar propios", que necesita el registro de la BD para saber quién lo creó.
 */
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requerirPermiso } from "@/lib/guards";
import { PERMISOS, puedeEditarExpediente } from "@/lib/permissions";
import { obtenerExpediente } from "@/lib/expedientes";
import { editarExpedienteAction } from "@/actions/expedientes.actions";
import { EncabezadoPagina } from "@/components/ui/encabezado-pagina";
import { Enlace } from "@/components/ui/enlace";
import { ExpedienteForm } from "@/components/expedientes/expediente-form";

export const metadata: Metadata = {
  title: "Editar expediente · SIGEX",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditarExpedientePage({ params }: Props) {
  const { usuario } = await requerirPermiso(PERMISOS.EXPEDIENTES_EDITAR);

  const { id } = await params;
  const expedienteId = Number(id);
  if (!Number.isInteger(expedienteId) || expedienteId <= 0) notFound();

  const expediente = await obtenerExpediente(expedienteId);
  if (!expediente) notFound();

  if (!puedeEditarExpediente(usuario, expediente)) redirect("/no-autorizado");

  const urlDetalle = `/expedientes/${expediente.id}`;

  return (
    <div className="space-y-6">
      <Enlace href={urlDetalle} className="text-sm">
        ← {expediente.folio}
      </Enlace>
      <EncabezadoPagina titulo="Editar expediente" descripcion={expediente.folio} />
      <div className="max-w-3xl rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5 sm:p-8">
        <ExpedienteForm
          modo="editar"
          accion={editarExpedienteAction.bind(null, expediente.id)}
          inicial={{
            titulo: expediente.titulo,
            solicitante: expediente.solicitante,
            prioridad: expediente.prioridad,
            descripcion: expediente.descripcion,
          }}
          urlCancelar={urlDetalle}
        />
      </div>
    </div>
  );
}