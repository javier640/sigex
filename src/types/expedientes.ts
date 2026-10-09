
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