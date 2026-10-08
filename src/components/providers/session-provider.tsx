"use client";

/**
 * Pone el usuario de la sesión al alcance de los Client Components.
 *
 * El usuario llega ya resuelto desde el layout (Server Component), así que
 * no hay una petición extra al cargar la página. Además:
 *  - Al volver a la pestaña, consulta /api/auth/me. Si la sesión venció,
 *    manda a /login; si cambiaron los permisos, refresca los datos del servidor.
 *  - Si el navegador restaura la página desde su caché de historial (botón
 *    Atrás), la recarga para que el proxy vuelva a validar la sesión.
 */
import { createContext, useCallback, useEffect, useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { UsuarioSesion } from "@/lib/session";

export type ContextoSesion = {
  usuario: UsuarioSesion;
  /** Vuelve a consultar la sesión en el servidor. */
  refrescar: () => Promise<void>;
};

export const SessionContext = createContext<ContextoSesion | null>(null);

export function SessionProvider({ usuario, children }: { usuario: UsuarioSesion; children: ReactNode }) {
  const router = useRouter();

  const refrescar = useCallback(async () => {
    try {
      const respuesta = await fetch("/api/auth/me", { cache: "no-store" });

      if (respuesta.status === 401) {
        router.replace("/login");
        return;
      }
      if (!respuesta.ok) return;

      const datos: { usuario: UsuarioSesion } = await respuesta.json();
      // Si el rol o los permisos cambiaron, se vuelve a renderizar el
      // layout en el servidor para actualizar menú y botones.
      if (JSON.stringify(datos.usuario) !== JSON.stringify(usuario)) {
        router.refresh();
      }
    } catch {
      // Sin red: no se hace nada; el siguiente intento lo resolverá
    }
  }, [router, usuario]);

  useEffect(() => {
    function alCambiarVisibilidad() {
      if (document.visibilityState === "visible") void refrescar();
    }
    function alMostrarPagina(evento: PageTransitionEvent) {
      if (evento.persisted) window.location.reload();
    }

    document.addEventListener("visibilitychange", alCambiarVisibilidad);
    window.addEventListener("pageshow", alMostrarPagina);
    return () => {
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
      window.removeEventListener("pageshow", alMostrarPagina);
    };
  }, [refrescar]);

  const valor = useMemo(() => ({ usuario, refrescar }), [usuario, refrescar]);

  return <SessionContext.Provider value={valor}>{children}</SessionContext.Provider>;
}