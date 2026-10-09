/**
 * SIGEX · Filtros de la bitácora (compartidos cliente/servidor)
 *
 * El PDF pide filtrar por usuario, acción, fecha y expediente.
 */
import { z } from "zod";

/** Deben coincidir con ACCIONES de lib/audit.ts. */
export const ACCIONES_BITACORA = ["crear", "editar", "cambiar_estatus", "eliminar"] as const;
export type AccionBitacora = (typeof ACCIONES_BITACORA)[number];

export const POR_PAGINA_BITACORA = 20;

const vacioAIndefinido = (valor: unknown) => (valor === "" || valor === null ? undefined : valor);

/** Fecha del <input type="date">: AAAA-MM-DD y que exista en el calendario. */
const fecha = z.preprocess(
  vacioAIndefinido,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida.")
    .refine((v) => !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime()), "Fecha inválida.")
    .optional(),
);

export const filtrosBitacoraSchema = z
  .object({
    pagina: z.preprocess(vacioAIndefinido, z.coerce.number().int().min(1).max(100000).default(1)),
    porPagina: z.preprocess(vacioAIndefinido, z.coerce.number().int().min(1).max(100).default(POR_PAGINA_BITACORA)),
    usuarioId: z.preprocess(vacioAIndefinido, z.coerce.number().int().positive().optional()),
    accion: z.preprocess(vacioAIndefinido, z.enum(ACCIONES_BITACORA).optional()),
    /** Folio completo o parcial (ej. "EXP-2026-000031" o "31"). */
    expediente: z.preprocess(
      vacioAIndefinido,
      z
        .string()
        .trim()
        .max(30)
        .optional()
        .transform((v) => v || undefined),
    ),
    desde: fecha,
    hasta: fecha,
  })
  .refine((f) => !f.desde || !f.hasta || f.desde <= f.hasta, {
    path: ["hasta"],
    error: "La fecha final no puede ser anterior a la inicial.",
  });

export type FiltrosBitacora = z.infer<typeof filtrosBitacoraSchema>;