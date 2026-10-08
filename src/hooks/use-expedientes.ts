"use client";

/**
 * Consume GET /api/expedientes y expone datos, carga y error.
 *
 *  - Cancela la petición anterior si los filtros cambian antes de que
 *    responda (AbortController), así nunca se pinta un resultado viejo.
 *  - Mientras carga, conserva los datos anteriores para que la tabla
 *    no "parpadee".
 *  - Si la API responde 401 (sesión vencida), manda a /login.
 */
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { EstatusExpediente } from "@prisma/client";
import type { RespuestaListadoExpedientes } from "@/types/expedientes";

export type FiltrosListado = {
  pagina: number;
  busqueda: string;
  estatus: EstatusExpediente | "";
};

type Resultado = {
  /** Identifica a qué combinación de filtros corresponde este resultado. */
  clave: string;
  datos?: RespuestaListadoExpedientes;
  error?: string;
};

export function useExpedientes({ pagina, busqueda, estatus }: FiltrosListado) {
  const router = useRouter();
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [version, setVersion] = useState(0);

  const clave = `${pagina}|${busqueda}|${estatus}|${version}`;

  useEffect(() => {
    const controlador = new AbortController();
    const parametros = new URLSearchParams({ pagina: String(pagina) });
    if (busqueda) parametros.set("busqueda", busqueda);
    if (estatus) parametros.set("estatus", estatus);

    fetch(`/api/expedientes?${parametros}`, { signal: controlador.signal, cache: "no-store" })
      .then(async (respuesta) => {
        if (respuesta.status === 401) {
          router.replace("/login");
          return;
        }
        const cuerpo = await respuesta.json();
        if (!respuesta.ok) throw new Error(cuerpo.error ?? "No se pudo cargar el listado.");
        setResultado({ clave, datos: cuerpo as RespuestaListadoExpedientes });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setResultado((previo) => ({
          clave,
          datos: previo?.datos,
          error: error instanceof Error ? error.message : "No se pudo cargar el listado.",
        }));
      });

    return () => controlador.abort();
  }, [clave, pagina, busqueda, estatus, router]);

  /** Vuelve a pedir la página actual (ej. después de eliminar un expediente). */
  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  const actualizado = resultado?.clave === clave;

  return {
    datos: resultado?.datos,
    cargando: !actualizado,
    error: actualizado ? resultado?.error : undefined,
    recargar,
  };
}