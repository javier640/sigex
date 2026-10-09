"use client";

/**
 * Hook genérico para consultar un endpoint GET de la app.
 *
 *  - Cancela la petición anterior si la ruta cambia antes de que responda.
 *  - Conserva los datos anteriores mientras carga (la tabla no parpadea).
 *  - Si la API responde 401 (sesión vencida), manda a /login.
 *  - Si responde otro error, expone el mensaje del campo `error` del JSON.
 */
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Resultado<T> = {
  /** A qué ruta (y versión) corresponde este resultado. */
  clave: string;
  datos?: T;
  error?: string;
};

const MENSAJE_GENERICO = "No se pudo cargar la información.";

export function useConsultaApi<T>(ruta: string) {
  const router = useRouter();
  const [resultado, setResultado] = useState<Resultado<T> | null>(null);
  const [version, setVersion] = useState(0);

  const clave = `${ruta}#${version}`;

  useEffect(() => {
    const controlador = new AbortController();

    fetch(ruta, { signal: controlador.signal, cache: "no-store" })
      .then(async (respuesta) => {
        if (respuesta.status === 401) {
          router.replace("/login");
          return;
        }
        const cuerpo = await respuesta.json();
        if (!respuesta.ok) throw new Error(cuerpo.error ?? MENSAJE_GENERICO);
        setResultado({ clave, datos: cuerpo as T });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setResultado((previo) => ({
          clave,
          datos: previo?.datos,
          error: error instanceof Error ? error.message : MENSAJE_GENERICO,
        }));
      });

    return () => controlador.abort();
  }, [clave, ruta, router]);

  /** Vuelve a pedir la misma ruta. */
  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  const actualizado = resultado?.clave === clave;

  return {
    datos: resultado?.datos,
    cargando: !actualizado,
    error: actualizado ? resultado?.error : undefined,
    recargar,
  };
}