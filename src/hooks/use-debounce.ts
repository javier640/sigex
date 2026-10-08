"use client";

import { useEffect, useState } from "react";

/**
 * Devuelve `valor` solo cuando deja de cambiar durante `espera` ms.
 * Evita llamar a la API con cada tecla que se escribe en el buscador.
 */
export function useDebounce<T>(valor: T, espera = 350): T {
  const [valorEstable, setValorEstable] = useState(valor);

  useEffect(() => {
    const temporizador = setTimeout(() => setValorEstable(valor), espera);
    return () => clearTimeout(temporizador);
  }, [valor, espera]);

  return valorEstable;
}