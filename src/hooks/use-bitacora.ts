"use client";

import { useConsultaApi } from "@/hooks/use-consulta-api";
import type { RespuestaBitacora } from "@/types/bitacora";
import type { AccionBitacora } from "@/lib/validations/bitacora";

export type FiltrosBitacoraCliente = {
  pagina: number;
  usuarioId: string;
  accion: AccionBitacora | "";
  expediente: string;
  desde: string;
  hasta: string;
};

/** Arma los parámetros de la URL omitiendo los filtros vacíos. */
export function parametrosBitacora(filtros: FiltrosBitacoraCliente): URLSearchParams {
  const parametros = new URLSearchParams();
  if (filtros.pagina > 1) parametros.set("pagina", String(filtros.pagina));
  if (filtros.usuarioId) parametros.set("usuarioId", filtros.usuarioId);
  if (filtros.accion) parametros.set("accion", filtros.accion);
  if (filtros.expediente) parametros.set("expediente", filtros.expediente);
  if (filtros.desde) parametros.set("desde", filtros.desde);
  if (filtros.hasta) parametros.set("hasta", filtros.hasta);
  return parametros;
}

/** Consume GET /api/bitacora con los filtros indicados. */
export function useBitacora(filtros: FiltrosBitacoraCliente) {
  return useConsultaApi<RespuestaBitacora>(`/api/bitacora?${parametrosBitacora(filtros)}`);
}