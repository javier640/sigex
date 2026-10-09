
import "server-only";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import type { ExpedienteResumen, RespuestaListadoExpedientes } from "@/types/expedientes";
import type { FiltrosExpedientes } from "@/lib/validations/expedientes";

/** Campos que se guardan en la bitácora (antes y después de cada cambio). */
export const CAMPOS_AUDITADOS_EXPEDIENTE = [
  "folio",
  "titulo",
  "descripcion",
  "solicitante",
  "estatus",
  "prioridad",
  "eliminadoEn",
] as const;

// ─────────────────────────────────────────────
// Folio
// ─────────────────────────────────────────────

/** Año en curso en la zona horaria de México (el servidor puede estar en UTC). */
function anioActual(): string {
  return new Intl.DateTimeFormat("en", { year: "numeric", timeZone: "America/Mexico_City" }).format(new Date());
}

/**
 * Folio definitivo a partir del id autoincremental: EXP-2026-000031.
 * El id es único y lo asigna PostgreSQL, así que dos altas simultáneas
 * nunca obtienen el mismo folio, sin tablas de contadores ni bloqueos.
 */
export function generarFolio(id: number): string {
  return `EXP-${anioActual()}-${String(id).padStart(6, "0")}`;
}

/**
 * Valor provisional para el INSERT: el folio es obligatorio y único, pero el
 * definitivo depende del id, que aún no existe. Se reemplaza en la misma
 * transacción, así que nunca es visible fuera de ella.
 */
export function folioTemporal(): string {
  return `TMP-${randomBytes(12).toString("hex")}`;
}

// ─────────────────────────────────────────────
// Consultas
// ─────────────────────────────────────────────

/** Listado paginado de expedientes activos (sin baja lógica). */
export async function listarExpedientes({
  pagina,
  porPagina,
  busqueda,
  estatus,
  mios
}: FiltrosExpedientes ,usuarioId: number ): Promise<RespuestaListadoExpedientes> {
  const where = {
    eliminadoEn: null,
    ...(estatus && { estatus }),
    ...(mios && { creadoPorId: usuarioId }),
    ...(busqueda && {
      OR: [
        { folio: { contains: busqueda, mode: "insensitive" as const } },
        { titulo: { contains: busqueda, mode: "insensitive" as const } },
        { solicitante: { contains: busqueda, mode: "insensitive" as const } },
      ],
    }),
  };

  // Ambas consultas en una transacción para que total y datos sean coherentes
  const [registros, total] = await db.$transaction([
    db.expediente.findMany({
      where,
      select: {
        id: true,
        folio: true,
        titulo: true,
        solicitante: true,
        estatus: true,
        prioridad: true,
        creadoPorId: true,
        creadoEn: true,
        creadoPor: { select: { nombre: true } },
      },
      orderBy: [{ creadoEn: "desc" }, { id: "desc" }],
      skip: (pagina - 1) * porPagina,
      take: porPagina,
    }),
    db.expediente.count({ where }),
  ]);

  const datos: ExpedienteResumen[] = registros.map((r) => ({
    id: r.id,
    folio: r.folio,
    titulo: r.titulo,
    solicitante: r.solicitante,
    estatus: r.estatus,
    prioridad: r.prioridad,
    creadoPorId: r.creadoPorId,
    creadoPor: r.creadoPor.nombre,
    creadoEn: r.creadoEn.toISOString(),
  }));

  return {
    datos,
    paginacion: {
      pagina,
      porPagina,
      total,
      totalPaginas: Math.max(1, Math.ceil(total / porPagina)),
    },
  };
}

/** Detalle de un expediente activo, o null si no existe o tiene baja lógica. */
export function obtenerExpediente(id: number) {
  return db.expediente.findFirst({
    where: { id, eliminadoEn: null },
    select: {
      id: true,
      folio: true,
      titulo: true,
      descripcion: true,
      solicitante: true,
      estatus: true,
      prioridad: true,
      creadoPorId: true,
      creadoEn: true,
      actualizadoEn: true,
      creadoPor: { select: { nombre: true } },
      actualizadoPor: { select: { nombre: true } },
    },
  });
}