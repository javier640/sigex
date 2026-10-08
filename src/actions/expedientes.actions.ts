"use server";

/**
 * SIGEX · Server Actions de expedientes
 *
 * Cada acción:
 *   1. Verifica sesión y permiso en el servidor
 *   2. Valida la entrada con Zod
 *   3. Aplica el cambio y registra la bitácora en UNA transacción
 *   4. Llama a revalidatePath para refrescar las páginas afectadas
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { verificarAcceso } from "@/lib/guards";
import { PERMISOS, puedeEditarExpediente } from "@/lib/permissions";
import { ACCIONES, ENTIDADES, calcularCambios, instantanea, registrarBitacora } from "@/lib/audit";
import { CAMPOS_AUDITADOS_EXPEDIENTE, folioTemporal, generarFolio } from "@/lib/expedientes";
import { cambiarEstatusSchema, expedienteSchema, idExpedienteSchema } from "@/lib/validations/expedientes";

const MENSAJE_ERROR_SERVIDOR = "No fue posible guardar los cambios. Intenta de nuevo en unos minutos.";
const MENSAJE_NO_EXISTE = "El expediente no existe o fue dado de baja.";
const MENSAJE_SIN_PERMISO = "No tienes permiso para modificar este expediente.";

type CampoExpediente = "titulo" | "solicitante" | "prioridad" | "descripcion";

export type ExpedienteFormState = {
  error?: string;
  fieldErrors?: Partial<Record<CampoExpediente, string[]>>;
  valores?: Record<CampoExpediente, string>;
};

export type EstadoAccion = { error?: string; ok?: boolean };

function leerValores(formData: FormData): Record<CampoExpediente, string> {
  const texto = (campo: string) => {
    const valor = formData.get(campo);
    return typeof valor === "string" ? valor : "";
  };
  return {
    titulo: texto("titulo"),
    solicitante: texto("solicitante"),
    prioridad: texto("prioridad"),
    descripcion: texto("descripcion"),
  };
}

function revalidarExpediente(id?: number) {
  revalidatePath("/expedientes");
  revalidatePath("/dashboard");
  if (id) revalidatePath(`/expedientes/${id}`);
}

// ─────────────────────────────────────────────
// Crear
// ─────────────────────────────────────────────

export async function crearExpedienteAction(
  _estadoPrevio: ExpedienteFormState,
  formData: FormData,
): Promise<ExpedienteFormState> {
  const acceso = await verificarAcceso(PERMISOS.EXPEDIENTES_CREAR);
  if (!acceso.ok) return { error: acceso.mensaje };

  const valores = leerValores(formData);
  const resultado = expedienteSchema.safeParse(valores);
  if (!resultado.success) {
    return { fieldErrors: z.flattenError(resultado.error).fieldErrors, valores };
  }

  const usuarioId = acceso.sesion.usuario.id;
  let nuevoId: number;

  try {
    nuevoId = await db.$transaction(async (tx) => {
      // 1. Insertar con folio provisional para obtener el id
      const creado = await tx.expediente.create({
        data: { ...resultado.data, folio: folioTemporal(), creadoPorId: usuarioId },
        select: { id: true },
      });

      // 2. Asignar el folio definitivo derivado del id
      const expediente = await tx.expediente.update({
        where: { id: creado.id },
        data: { folio: generarFolio(creado.id) },
      });

      // 3. Bitácora: no hay valores anteriores, solo los nuevos
      await registrarBitacora(
        {
          usuarioId,
          accion: ACCIONES.CREAR,
          entidad: ENTIDADES.EXPEDIENTE,
          entidadId: expediente.id,
          nuevos: instantanea(expediente, CAMPOS_AUDITADOS_EXPEDIENTE),
        },
        tx,
      );

      return expediente.id;
    });
  } catch (error) {
    console.error("[crearExpedienteAction] Error inesperado:", error);
    return { error: MENSAJE_ERROR_SERVIDOR, valores };
  }

  revalidarExpediente();
  redirect(`/expedientes/${nuevoId}?aviso=creado`);
}

// ─────────────────────────────────────────────
// Editar
// ─────────────────────────────────────────────

/**
 * El id llega con .bind(null, id) desde la página de edición.
 * Se valida de nuevo porque cualquier dato que viene del cliente es manipulable.
 */
export async function editarExpedienteAction(
  expedienteId: number,
  _estadoPrevio: ExpedienteFormState,
  formData: FormData,
): Promise<ExpedienteFormState> {
  const acceso = await verificarAcceso(PERMISOS.EXPEDIENTES_EDITAR);
  if (!acceso.ok) return { error: acceso.mensaje };

  const valores = leerValores(formData);

  const id = idExpedienteSchema.safeParse(expedienteId);
  if (!id.success) return { error: MENSAJE_NO_EXISTE, valores };

  const resultado = expedienteSchema.safeParse(valores);
  if (!resultado.success) {
    return { fieldErrors: z.flattenError(resultado.error).fieldErrors, valores };
  }

  const { usuario } = acceso.sesion;

  try {
    const desenlace = await db.$transaction(async (tx) => {
      const actual = await tx.expediente.findFirst({ where: { id: id.data, eliminadoEn: null } });
      if (!actual) return "no-existe" as const;

      // Regla "editar propios": se valida con el registro real de la BD
      if (!puedeEditarExpediente(usuario, actual)) return "sin-permiso" as const;

      const cambios = calcularCambios(
        instantanea(actual, CAMPOS_AUDITADOS_EXPEDIENTE),
        instantanea({ ...actual, ...resultado.data }, CAMPOS_AUDITADOS_EXPEDIENTE),
      );
      if (!cambios) return "sin-cambios" as const;

      await tx.expediente.update({
        where: { id: actual.id },
        data: { ...resultado.data, actualizadoPorId: usuario.id },
      });

      await registrarBitacora(
        {
          usuarioId: usuario.id,
          accion: ACCIONES.EDITAR,
          entidad: ENTIDADES.EXPEDIENTE,
          entidadId: actual.id,
          ...cambios,
        },
        tx,
      );
      return "ok" as const;
    });

    if (desenlace === "no-existe") return { error: MENSAJE_NO_EXISTE, valores };
    if (desenlace === "sin-permiso") return { error: MENSAJE_SIN_PERMISO, valores };
  } catch (error) {
    console.error("[editarExpedienteAction] Error inesperado:", error);
    return { error: MENSAJE_ERROR_SERVIDOR, valores };
  }

  revalidarExpediente(id.data);
  redirect(`/expedientes/${id.data}?aviso=actualizado`);
}

// ─────────────────────────────────────────────
// Cambiar estatus
// ─────────────────────────────────────────────

export async function cambiarEstatusAction(_estadoPrevio: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const acceso = await verificarAcceso(PERMISOS.EXPEDIENTES_CAMBIAR_ESTATUS);
  if (!acceso.ok) return { error: acceso.mensaje };

  const resultado = cambiarEstatusSchema.safeParse({
    expedienteId: formData.get("expedienteId"),
    estatus: formData.get("estatus"),
  });
  if (!resultado.success) return { error: "Selecciona un estatus válido." };

  const { expedienteId, estatus } = resultado.data;
  const usuarioId = acceso.sesion.usuario.id;

  try {
    const desenlace = await db.$transaction(async (tx) => {
      const actual = await tx.expediente.findFirst({
        where: { id: expedienteId, eliminadoEn: null },
        select: { id: true, estatus: true },
      });
      if (!actual) return "no-existe" as const;
      if (actual.estatus === estatus) return "sin-cambios" as const;

      await tx.expediente.update({ where: { id: actual.id }, data: { estatus, actualizadoPorId: usuarioId } });

      await registrarBitacora(
        {
          usuarioId,
          accion: ACCIONES.CAMBIAR_ESTATUS,
          entidad: ENTIDADES.EXPEDIENTE,
          entidadId: actual.id,
          anteriores: { estatus: actual.estatus },
          nuevos: { estatus },
        },
        tx,
      );
      return "ok" as const;
    });

    if (desenlace === "no-existe") return { error: MENSAJE_NO_EXISTE };
  } catch (error) {
    console.error("[cambiarEstatusAction] Error inesperado:", error);
    return { error: MENSAJE_ERROR_SERVIDOR };
  }

  revalidarExpediente(expedienteId);
  return { ok: true };
}

// ─────────────────────────────────────────────
// Eliminar (baja lógica)
// ─────────────────────────────────────────────

/**
 * Se llama directamente desde el cliente con useTransition (no desde un
 * <form>), por eso recibe el id como argumento y no un FormData.
 */
export async function eliminarExpedienteAction(expedienteId: number): Promise<EstadoAccion> {
  const acceso = await verificarAcceso(PERMISOS.EXPEDIENTES_ELIMINAR);
  if (!acceso.ok) return { error: acceso.mensaje };

  const id = idExpedienteSchema.safeParse(expedienteId);
  if (!id.success) return { error: MENSAJE_NO_EXISTE };

  const usuarioId = acceso.sesion.usuario.id;

  try {
    const desenlace = await db.$transaction(async (tx) => {
      const actual = await tx.expediente.findFirst({ where: { id: id.data, eliminadoEn: null } });
      if (!actual) return "no-existe" as const;

      const eliminado = await tx.expediente.update({
        where: { id: actual.id },
        data: { eliminadoEn: new Date(), actualizadoPorId: usuarioId },
      });

      // Se guarda la instantánea completa: queda constancia de qué se dio de baja
      await registrarBitacora(
        {
          usuarioId,
          accion: ACCIONES.ELIMINAR,
          entidad: ENTIDADES.EXPEDIENTE,
          entidadId: actual.id,
          anteriores: instantanea(actual, CAMPOS_AUDITADOS_EXPEDIENTE),
          nuevos: instantanea(eliminado, ["eliminadoEn"]),
        },
        tx,
      );
      return "ok" as const;
    });

    if (desenlace === "no-existe") return { error: MENSAJE_NO_EXISTE };
  } catch (error) {
    console.error("[eliminarExpedienteAction] Error inesperado:", error);
    return { error: MENSAJE_ERROR_SERVIDOR };
  }

  revalidarExpediente(id.data);
  return { ok: true };
}