
import type { Paginacion } from "@/types/expedientes";
import type { AccionBitacora } from "@/lib/validations/bitacora";

export type ValorBitacora = string | number | boolean | null;
export type ValoresBitacora = Record<string, ValorBitacora>;

export type RegistroBitacora = {
  id: number;
  accion: AccionBitacora;
  usuario: { id: number; nombre: string } | null;
  /** null si el expediente ya no existe en la BD (no debería ocurrir con baja lógica). */
  expediente: { id: number; folio: string; activo: boolean } | null;
  valoresAnteriores: ValoresBitacora | null;
  valoresNuevos: ValoresBitacora | null;
  ip: string | null;
  creadoEn: string;
};

export type RespuestaBitacora = {
  datos: RegistroBitacora[];
  paginacion: Paginacion;
};