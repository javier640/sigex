/**
 * SIGEX · Tipos compartidos entre la API y el cliente
 *
 * Es el "contrato" de GET /api/expedientes: el Route Handler responde con
 * esta forma y el hook useExpedientes la consume. Las fechas viajan como
 * texto ISO porque JSON no tiene tipo fecha.
 */
import type { EstatusExpediente, PrioridadExpediente } from "@prisma/client";

export type ExpedienteResumen = {
  id: number;
  folio: string;
  titulo: string;
  solicitante: string;
  estatus: EstatusExpediente;
  prioridad: PrioridadExpediente;
  creadoPorId: number;
  creadoPor: string;
  creadoEn: string;
};

export type Paginacion = {
  pagina: number;
  porPagina: number;
  total: number;
  totalPaginas: number;
};

export type RespuestaListadoExpedientes = {
  datos: ExpedienteResumen[];
  paginacion: Paginacion;
};