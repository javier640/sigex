/**
 * Layout del grupo (app): todas las rutas protegidas.
 *
 * Es un Server Component: obtiene la sesión, arma el menú filtrado por
 * permisos y pasa el usuario al SessionProvider para los Client Components.
 */
import type { ReactNode } from "react";
import { requerirSesion } from "@/lib/guards";
import { construirMenu } from "@/lib/navegacion";
import { SessionProvider } from "@/components/providers/session-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { LogoutButton } from "@/components/auth/logout-button";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { usuario } = await requerirSesion();

  return (
    <SessionProvider usuario={usuario}>
      <div className="min-h-dvh bg-slate-100 text-slate-900 lg:flex">
        <Sidebar
          secciones={construirMenu(usuario)}
          usuario={{ nombre: usuario.nombre, rol: usuario.rol }}
          pie={<LogoutButton className="w-full" />}
        />
        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">{children}</div>
        </main>
      </div>
    </SessionProvider>
  );
}