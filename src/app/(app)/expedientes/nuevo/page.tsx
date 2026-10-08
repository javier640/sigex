import type { Metadata } from "next";
import { requerirPermiso } from "@/lib/guards";
import { PERMISOS } from "@/lib/permissions";
import { crearExpedienteAction } from "@/actions/expedientes.actions";
import { EncabezadoPagina } from "@/components/ui/encabezado-pagina";
import { Enlace } from "@/components/ui/enlace";
import { ExpedienteForm } from "@/components/expedientes/expediente-form";

export const metadata: Metadata = {
  title: "Nuevo expediente · SIGEX",
};

export default async function NuevoExpedientePage() {
  await requerirPermiso(PERMISOS.EXPEDIENTES_CREAR);

  return (
    <div className="space-y-6">
      <Enlace href="/expedientes" className="text-sm">
        ← Expedientes
      </Enlace>
      <EncabezadoPagina
        titulo="Nuevo expediente"
        descripcion="El folio se asigna automáticamente y el expediente inicia con estatus Abierto."
      />
      <div className="max-w-3xl rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5 sm:p-8">
        <ExpedienteForm modo="crear" accion={crearExpedienteAction} urlCancelar="/expedientes" />
      </div>
    </div>
  );
}