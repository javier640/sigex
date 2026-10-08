"use client";

import { useContext } from "react";
import { SessionContext, type ContextoSesion } from "@/components/providers/session-provider";

/**
 * Devuelve el usuario de la sesión y una función para refrescarla.
 * Solo funciona dentro del layout protegido (app).
 */
export function useSession(): ContextoSesion {
  const contexto = useContext(SessionContext);
  if (!contexto) {
    throw new Error("useSession debe usarse dentro de <SessionProvider>.");
  }
  return contexto;
}