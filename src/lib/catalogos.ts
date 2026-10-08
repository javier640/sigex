/**
 * SIGEX · Catálogos de presentación de expedientes
 *
 * Solo importa TIPOS de Prisma (`import type`), así que puede usarse
 * también en Client Components sin meter el cliente de Prisma al navegador.
 */
import type { EstatusExpediente, PrioridadExpediente } from "@prisma/client";

export const ORDEN_ESTATUS: readonly EstatusExpediente[] = ["abierto", "en_revision", "cerrado"];

export const ESTATUS: Record<EstatusExpediente, { etiqueta: string; color: string; insignia: string }> = {
  abierto: { etiqueta: "Abierto", color: "bg-sky-500", insignia: "bg-sky-50 text-sky-800 ring-sky-600/20" },
  en_revision: {
    etiqueta: "En revisión",
    color: "bg-amber-400",
    insignia: "bg-amber-50 text-amber-800 ring-amber-600/20",
  },
  cerrado: {
    etiqueta: "Cerrado",
    color: "bg-emerald-500",
    insignia: "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
  },
};

export const PRIORIDAD: Record<PrioridadExpediente, { etiqueta: string; insignia: string }> = {
  baja: { etiqueta: "Baja", insignia: "bg-slate-50 text-slate-700 ring-slate-500/20" },
  media: { etiqueta: "Media", insignia: "bg-teal-50 text-teal-800 ring-teal-600/20" },
  alta: { etiqueta: "Alta", insignia: "bg-orange-50 text-orange-800 ring-orange-600/20" },
  urgente: { etiqueta: "Urgente", insignia: "bg-red-50 text-red-800 ring-red-600/20" },
};