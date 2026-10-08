/**
 * SIGEX · Formato de fechas
 *
 * Se fija la zona horaria para que el resultado no dependa de dónde corra
 * el servidor (Vercel usa UTC).
 */
const ZONA_HORARIA = "America/Mexico_City";

const FORMATO_FECHA = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeZone: ZONA_HORARIA,
});

const FORMATO_FECHA_HORA = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: ZONA_HORARIA,
});

export function formatearFecha(fecha: Date | string): string {
  return FORMATO_FECHA.format(new Date(fecha));
}

export function formatearFechaHora(fecha: Date | string): string {
  return FORMATO_FECHA_HORA.format(new Date(fecha));
}