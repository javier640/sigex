/**
 * SIGEX · Bitácora de auditoría
 *
 * Alcance (según el PDF): se audita cada creación, edición, cambio de
 * estatus o eliminación de un EXPEDIENTE.
 *
 * Reglas:
 *  - Solo inserción: este módulo no expone funciones para editar ni borrar
 *    registros (y la BD lo refuerza con un trigger, ver la migración
 *    bitacora_solo_insercion).
 *  - Cada cambio guarda quién, qué acción, sobre qué entidad, cuándo,
 *    desde qué IP, y los valores anteriores y nuevos.
 *  - Nunca se guardan datos sensibles (hashes de contraseña o tokens).
 *
 * Uso típico dentro de una Server Action (en la MISMA transacción que el
 * cambio, para que no exista un cambio sin su registro ni al revés):
 *
 *   await prisma.$transaction(async (tx) => {
 *     const antes = await tx.expediente.findUniqueOrThrow({ where: { id } });
 *     const despues = await tx.expediente.update({ where: { id }, data });
 *
 *     const cambios = calcularCambios(
 *       instantanea(antes, CAMPOS_EXPEDIENTE),
 *       instantanea(despues, CAMPOS_EXPEDIENTE),
 *     );
 *     if (cambios) {
 *       await registrarBitacora(
 *         { usuarioId, accion: ACCIONES.EDITAR, entidad: ENTIDADES.EXPEDIENTE, entidadId: id, ...cambios },
 *         tx,
 *       );
 *     }
 *   });
 */
import "server-only";
import { headers } from "next/headers";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { debug } from "console";

// ─────────────────────────────────────────────
// Catálogos
// ─────────────────────────────────────────────

export const ACCIONES = {
  CREAR: "crear",
  EDITAR: "editar",
  CAMBIAR_ESTATUS: "cambiar_estatus",
  ELIMINAR: "eliminar",
} as const;

export type Accion = (typeof ACCIONES)[keyof typeof ACCIONES];

/**
 * Hoy solo existe "expediente". La columna `entidad` se conserva porque
 * forma parte del modelo mínimo del PDF y permitiría auditar otras
 * entidades en el futuro sin cambiar la tabla.
 */
export const ENTIDADES = {
  EXPEDIENTE: "expediente",
} as const;

export type Entidad = (typeof ENTIDADES)[keyof typeof ENTIDADES];

// ─────────────────────────────────────────────
// Instantáneas y diferencias
// ─────────────────────────────────────────────

/** Valor que se guarda en el JSON de la bitácora. */
export type ValorAuditable = string | number | boolean | null;

/** Copia "plana" de los campos auditados de un registro. */
export type Instantanea = Record<string, ValorAuditable>;

/** Campos que jamás deben llegar a la bitácora, aunque se pidan. */
const CAMPOS_PROHIBIDOS = new Set(["password", "passwordHash", "token", "tokenHash"]);

function normalizar(valor: unknown): ValorAuditable {
  if (valor === null || valor === undefined) return null;
  if (valor instanceof Date) return valor.toISOString();
  if (typeof valor === "string" || typeof valor === "number" || typeof valor === "boolean") return valor;
  if (typeof valor === "bigint") return valor.toString();
  return JSON.stringify(valor);
}

/**
 * Toma solo los campos indicados de un registro y los convierte a valores
 * seguros para JSON (las fechas pasan a texto ISO).
 */
export function instantanea<T extends object>(registro: T, campos: readonly (keyof T & string)[]): Instantanea {
  const resultado: Instantanea = {};
  for (const campo of campos) {
    if (CAMPOS_PROHIBIDOS.has(campo)) continue;
    resultado[campo] = normalizar(registro[campo]);
  }
  return resultado;
}

/**
 * Compara dos instantáneas y devuelve SOLO los campos que cambiaron.
 * Devuelve null si no cambió nada (útil para no registrar ediciones vacías).
 */
export function calcularCambios(
  antes: Instantanea,
  despues: Instantanea,
): { anteriores: Instantanea; nuevos: Instantanea } | null {
  const anteriores: Instantanea = {};
  const nuevos: Instantanea = {};

  const campos = new Set([...Object.keys(antes), ...Object.keys(despues)]);
  for (const campo of campos) {
    const valorAntes = antes[campo] ?? null;
    const valorDespues = despues[campo] ?? null;
    if (valorAntes !== valorDespues) {
      anteriores[campo] = valorAntes;
      nuevos[campo] = valorDespues;
    }
  }

  return Object.keys(nuevos).length > 0 ? { anteriores, nuevos } : null;
}

// ─────────────────────────────────────────────
// IP del cliente
// ─────────────────────────────────────────────

/**
 * IP de quien hace la petición. Detrás de Vercel u otro proxy confiable,
 * la IP real llega en x-forwarded-for (el primer valor de la lista).
 * Devuelve null fuera de una petición (por ejemplo, en el seed).
 *
 * Limitación: si la app se expusiera sin un proxy confiable delante,
 * el cliente podría falsificar este encabezado.
 */
export async function obtenerIpCliente(): Promise<string | null> {
  try {
    const encabezados = await headers();
    const reenviada = encabezados.get("x-forwarded-for")?.split(",")[0]?.trim();
    const ip = reenviada || encabezados.get("x-real-ip")?.trim() || null;
    return ip ? ip.slice(0, 45) : null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// Registro
// ─────────────────────────────────────────────

export type EntradaBitacora = {
  /** Quién hizo el cambio (null solo para procesos del sistema). */
  usuarioId: number | null;
  accion: Accion;
  entidad: Entidad;
  entidadId?: string | number | null;
  anteriores?: Instantanea | null;
  nuevos?: Instantanea | null;
  /** Si no se indica, se toma de la petición actual. */
  ip?: string | null;
};

/** Cliente normal o el `tx` de una transacción. */
type ClienteBD = Prisma.TransactionClient | typeof db;

/**
 * Inserta un registro en la bitácora.
 * Lanza error si falla: dentro de una transacción, eso revierte también
 * el cambio auditado, que es justo lo que se quiere.
 */
export async function registrarBitacora(entrada: EntradaBitacora, cliente: ClienteBD = db): Promise<void> {
  const ip = entrada.ip !== undefined ? entrada.ip : await obtenerIpCliente();

  await cliente.bitacora.create({
    data: {
      usuarioId: entrada.usuarioId,
      accion: entrada.accion,
      entidad: entrada.entidad,
      entidadId: entrada.entidadId == null ? null : String(entrada.entidadId),
      valoresAnteriores: entrada.anteriores ?? undefined,
      valoresNuevos: entrada.nuevos ?? undefined,
      ip,
    },
  });
}