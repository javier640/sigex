/**
 * Detalle de un expediente.
 * Las acciones visibles dependen de los permisos del usuario:
 *  - Editar:            puedeEditarExpediente (propios o todos)
 *  - Cambiar estatus:   expedientes:cambiar_estatus
 *  - Eliminar:          expedientes:eliminar
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requerirPermiso } from "@/lib/guards";
import { can, PERMISOS, puedeEditarExpediente } from "@/lib/permissions";
import { obtenerExpediente } from "@/lib/expedientes";
import { ESTATUS, PRIORIDAD } from "@/lib/catalogos";
import { formatearFechaHora } from "@/lib/formato";
import { Alerta } from "@/components/ui/alerta";
import { BotonEnlace } from "@/components/ui/boton-enlace";
import { Enlace } from "@/components/ui/enlace";
import { Insignia } from "@/components/ui/insignia";
import { BotonEliminarExpediente } from "@/components/expedientes/boton-eliminar-expediente";
import { CambiarEstatusForm } from "@/components/expedientes/cambiar-estatus-form";

export const metadata: Metadata = {
  title: "Expediente · SIGEX",
};

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aviso?: string }>;
};

const AVISOS: Record<string, string> = {
  creado: "El expediente se creó correctamente.",
  actualizado: "Los cambios se guardaron correctamente.",
};

export default async function DetalleExpedientePage({ params, searchParams }: Props) {
  const { usuario } = await requerirPermiso(PERMISOS.EXPEDIENTES_VER);

  const { id } = await params;
  const expedienteId = Number(id);
  if (!Number.isInteger(expedienteId) || expedienteId <= 0) notFound();

  const expediente = await obtenerExpediente(expedienteId);
  if (!expediente) notFound();

  const { aviso } = await searchParams;
  const mensajeAviso = aviso ? AVISOS[aviso] : undefined;

  const puedeEditar = puedeEditarExpediente(usuario, expediente);
  const puedeCambiarEstatus = can(usuario, PERMISOS.EXPEDIENTES_CAMBIAR_ESTATUS);
  const puedeEliminar = can(usuario, PERMISOS.EXPEDIENTES_ELIMINAR);

  return (
    <div className="space-y-6">
      <Enlace href="/expedientes" className="text-sm">
        ← Expedientes
      </Enlace>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-sm font-semibold text-teal-800">{expediente.folio}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{expediente.titulo}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <Insignia colores={ESTATUS[expediente.estatus].insignia}>{ESTATUS[expediente.estatus].etiqueta}</Insignia>
            <Insignia colores={PRIORIDAD[expediente.prioridad].insignia}>
              Prioridad {PRIORIDAD[expediente.prioridad].etiqueta.toLowerCase()}
            </Insignia>
          </div>
        </div>
        <div className="flex flex-wrap items-start gap-3">
          {puedeEditar && (
            <BotonEnlace href={`/expedientes/${expediente.id}/editar`} variante="secundario">
              Editar
            </BotonEnlace>
          )}
          {puedeEliminar && (
            <BotonEliminarExpediente
              expedienteId={expediente.id}
              folio={expediente.folio}
              redirigirA="/expedientes?aviso=eliminado"
              tamano="normal"
            />
          )}
        </div>
      </div>

      {mensajeAviso && <Alerta variante="exito">{mensajeAviso}</Alerta>}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5 lg:col-span-2">
          <dl className="space-y-6">
            <div>
              <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Solicitante</dt>
              <dd className="mt-1 text-slate-900">{expediente.solicitante}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Descripción</dt>
              <dd className="mt-1 leading-relaxed whitespace-pre-line text-slate-700">
                {expediente.descripcion || <span className="text-slate-400">Sin descripción.</span>}
              </dd>
            </div>
          </dl>
        </section>

        <aside className="space-y-6">
          {puedeCambiarEstatus && (
            <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
              <h2 className="mb-4 text-sm font-semibold text-slate-900">Seguimiento</h2>
              <CambiarEstatusForm expedienteId={expediente.id} estatus={expediente.estatus} />
            </section>
          )}

          <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Registro</h2>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-slate-500">Creado por</dt>
                <dd className="font-medium text-slate-900">{expediente.creadoPor.nombre}</dd>
                <dd className="text-slate-600">{formatearFechaHora(expediente.creadoEn)}</dd>
              </div>
              {expediente.actualizadoPor && (
                <div>
                  <dt className="text-slate-500">Última modificación</dt>
                  <dd className="font-medium text-slate-900">{expediente.actualizadoPor.nombre}</dd>
                  <dd className="text-slate-600">{formatearFechaHora(expediente.actualizadoEn)}</dd>
                </div>
              )}
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}