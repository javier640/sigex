/**
 * SIGEX · Esquemas Zod de expedientes (compartidos cliente/servidor)
 */
import { z } from "zod";

export const ESTATUS_VALORES = ["abierto", "en_revision", "cerrado"] as const;
export const PRIORIDAD_VALORES = ["baja", "media", "alta", "urgente"] as const;

export const POR_PAGINA_DEFAULT = 10;
export const POR_PAGINA_MAX = 50;

/** Los formularios y la URL envían "" para "sin valor": se trata como ausente. */
const vacioAIndefinido = (valor: unknown) => (valor === "" || valor === null ? undefined : valor);

// ─────────────────────────────────────────────
// Alta y edición
// ─────────────────────────────────────────────

export const expedienteSchema = z.object({
  titulo: z
    .string({ error: "Ingresa el título." })
    .trim()
    .min(3, "El título debe tener al menos 3 caracteres.")
    .max(200, "El título no puede pasar de 200 caracteres."),
  solicitante: z
    .string({ error: "Ingresa el solicitante." })
    .trim()
    .min(3, "El solicitante debe tener al menos 3 caracteres.")
    .max(200, "El solicitante no puede pasar de 200 caracteres."),
  prioridad: z.enum(PRIORIDAD_VALORES, { error: "Selecciona una prioridad." }),
  descripcion: z
    .string()
    .trim()
    .max(5000, "La descripción no puede pasar de 5000 caracteres.")
    .optional()
    .transform((v) => v || null),
});

export type ExpedienteInput = z.infer<typeof expedienteSchema>;

// ─────────────────────────────────────────────
// Cambio de estatus y baja
// ─────────────────────────────────────────────

export const idExpedienteSchema = z.coerce.number().int().positive();

export const cambiarEstatusSchema = z.object({
  expedienteId: idExpedienteSchema,
  estatus: z.enum(ESTATUS_VALORES, { error: "Selecciona un estatus válido." }),
});

// ─────────────────────────────────────────────
// Filtros del listado (URL y API)
// ─────────────────────────────────────────────

export const filtrosExpedientesSchema = z.object({
  pagina: z.preprocess(vacioAIndefinido, z.coerce.number().int().min(1).max(100000).default(1)),
  porPagina: z.preprocess(
    vacioAIndefinido,
    z.coerce.number().int().min(1).max(POR_PAGINA_MAX).default(POR_PAGINA_DEFAULT),
  ),
  busqueda: z.preprocess(
    vacioAIndefinido,
    z
      .string()
      .trim()
      .max(100)
      .optional()
      .transform((v) => v || undefined),
  ),
  estatus: z.preprocess(vacioAIndefinido, z.enum(ESTATUS_VALORES).optional()),
  mios: z.preprocess(vacioAIndefinido, z.literal("1").optional()).transform((v) => v === "1"),
});

export type FiltrosExpedientes = z.infer<typeof filtrosExpedientesSchema>;