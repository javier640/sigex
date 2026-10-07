/**
 * Página a la que redirige el proxy (y requerirPermiso) cuando el usuario
 * tiene sesión pero le falta el permiso para la ruta que pidió.
 */
import type { Metadata } from "next";
import { requerirSesion } from "@/lib/guards";
import { Enlace } from "@/components/ui/enlace";
import { LogoutButton } from "@/components/auth/logout-button";

export const metadata: Metadata = {
  title: "Acceso no autorizado · SIGEX",
};

export default async function NoAutorizadoPage() {
  const { usuario } = await requerirSesion();

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-100 px-4 py-10 text-slate-900">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-900/5">
        <div className="h-2 bg-amber-300" />
        <div className="p-8 sm:p-10">
          <p className="text-sm font-semibold tracking-wide text-amber-700">ACCESO RESTRINGIDO</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">No tienes permiso para ver esta sección</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Tu cuenta tiene el rol <strong className="font-semibold text-slate-800">{usuario.rol}</strong>, que no
            incluye acceso a esta parte del sistema. Si crees que es un error, solicita el permiso al administrador.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <Enlace href="/dashboard" className="text-sm">
              Ir al inicio
            </Enlace>
            <LogoutButton />
          </div>
        </div>
      </div>
    </main>
  );
}