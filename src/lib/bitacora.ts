/**
 * SIGEX · Consultas de la bitácora (solo servidor)
 *
 * Este módulo SOLO lee. La escritura vive en lib/audit.ts y la BD impide
 * modificar o borrar registros (trigger bitacora_solo_insercion).
 */
import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ENTIDADES } from "@/lib/audit";
import type { FiltrosBitacora } from "@/lib/validations/bitacora";
import type { RegistroBitacora, RespuestaBitacora, ValoresBitacora } from "@/types/bitacora";

/**
 * Las fechas del filtro son días del calendario de México. La Ciudad de
 * México usa UTC-6 todo el año desde 2022 (ya no hay horario de verano).
 */
const DESFASE_MEXICO = "-06:00";

function inicioDelDia(fecha: string): Date {
  return new Date(`${fecha}T00:00:00${DESFASE_MEXICO}`);
}

function inicioDelDiaSiguiente(fecha: string): Date {
  const dia = inicioDelDia(fecha);
  dia.setUTCDate(dia.getUTCDate() + 1);
  return dia;
}

/** La columna es JSON libre: solo se aceptan objetos planos. */
function comoValores(valor: Prisma.JsonValue | null): ValoresBitacora | null {
  if (valor && typeof valor === "object" && !Array.isArray(valor)) return valor as ValoresBitacora;
  return null;
}

export async function listarBitacora({
  pagina,
  porPagina,
  usuarioId,
  accion,
  expediente,
  desde,
  hasta,
}: FiltrosBitacora): Promise<RespuestaBitacora> {
  const where: Prisma.BitacoraWhereInput = {
    entidad: ENTIDADES.EXPEDIENTE,
    ...(usuarioId && { usuarioId }),
    ...(accion && { accion }),
    ...((desde || hasta) && {
      creadoEn: {
        ...(desde && { gte: inicioDelDia(desde) }),
        ...(hasta && { lt: inicioDelDiaSiguiente(hasta) }),
      },
    }),
  };

  // La bitácora guarda el id del expediente, no su folio: primero se buscan
  // los expedientes cuyo folio coincide (incluidos los dados de baja).
  if (expediente) {
    const coincidencias = await db.expediente.findMany({
      where: { folio: { contains: expediente, mode: "insensitive" } },
      select: { id: true },
      take: 500,
    });
    where.entidadId = { in: coincidencias.map((e) => String(e.id)) };
  }

  const [registros, total] = await db.$transaction([
    db.bitacora.findMany({
      where,
      select: {
        id: true,
        accion: true,
        entidadId: true,
        valoresAnteriores: true,
        valoresNuevos: true,
        ip: true,
        creadoEn: true,
        usuario: { select: { id: true, nombre: true } },
      },
      orderBy: [{ creadoEn: "desc" }, { id: "desc" }],
      skip: (pagina - 1) * porPagina,
      take: porPagina,
    }),
    db.bitacora.count({ where }),
  ]);

  // Folios de los expedientes de esta página, en una sola consulta
  const ids = [...new Set(registros.map((r) => Number(r.entidadId)).filter(Number.isInteger))];
  const expedientes = await db.expediente.findMany({
    where: { id: { in: ids } },
    select: { id: true, folio: true, eliminadoEn: true },
  });
  const expedientePorId = new Map(expedientes.map((e) => [e.id, e]));

  const datos: RegistroBitacora[] = registros.map((r) => {
    const exp = expedientePorId.get(Number(r.entidadId));
    return {
      id: r.id,
      accion: r.accion as RegistroBitacora["accion"],
      usuario: r.usuario,
      expediente: exp ? { id: exp.id, folio: exp.folio, activo: exp.eliminadoEn === null } : null,
      valoresAnteriores: comoValores(r.valoresAnteriores),
      valoresNuevos: comoValores(r.valoresNuevos),
      ip: r.ip,
      creadoEn: r.creadoEn.toISOString(),
    };
  });

  return {
    datos,
    paginacion: { pagina, porPagina, total, totalPaginas: Math.max(1, Math.ceil(total / porPagina)) },
  };
}

/** Usuarios para el filtro (incluye inactivos: sus registros siguen en la bitácora). */
export function obtenerUsuariosParaFiltro() {
  return db.usuario.findMany({
    select: { id: true, nombre: true, activo: true },
    orderBy: { nombre: "asc" },
  });
}