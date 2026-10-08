"use client";

/**
 * Menú lateral. Recibe del servidor SOLO las opciones permitidas.
 *  - Escritorio (lg+): fijo a la izquierda.
 *  - Móvil: barra superior con botón que abre el menú como panel deslizable.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import type { SeccionMenu } from "@/lib/navegacion";
import { Icono } from "@/components/ui/iconos";

type Props = {
  secciones: SeccionMenu[];
  usuario: { nombre: string; rol: string };
  /** Contenido al pie del menú (el botón de cerrar sesión). */
  pie: ReactNode;
};

function estaActiva(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ secciones, usuario, pie }: Props) {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);

  // Cerrar con Escape mientras el panel móvil está abierto
  useEffect(() => {
    if (!abierto) return;
    function alPresionarTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") setAbierto(false);
    }
    document.addEventListener("keydown", alPresionarTecla);
    return () => document.removeEventListener("keydown", alPresionarTecla);
  }, [abierto]);

  return (
    <>
      {/* Barra superior (solo móvil) */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-teal-900 px-4 text-white lg:hidden">
        <Marca />
        <button
          type="button"
          onClick={() => setAbierto(true)}
          aria-expanded={abierto}
          aria-controls="menu-lateral"
          aria-label="Abrir menú"
          className="rounded-lg p-2 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-amber-300"
        >
          <Icono nombre="menu" className="size-6" />
        </button>
      </header>

      {/* Fondo oscuro detrás del panel (solo móvil) */}
      {abierto && (
        <div aria-hidden="true" onClick={() => setAbierto(false)} className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden" />
      )}

      <aside
        id="menu-lateral"
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col bg-teal-900 text-teal-50 transition-all duration-200 motion-reduce:transition-none lg:sticky lg:top-0 lg:z-auto lg:h-dvh lg:visible lg:translate-x-0 ${
          abierto ? "visible translate-x-0" : "invisible -translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-6">
          <Marca />
          <button
            type="button"
            onClick={() => setAbierto(false)}
            aria-label="Cerrar menú"
            className="rounded-lg p-1.5 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-amber-300 lg:hidden"
          >
            <Icono nombre="cerrar" />
          </button>
        </div>

        <nav aria-label="Principal" className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
          {secciones.map((seccion, i) => (
            <div key={seccion.titulo ?? i}>
              {seccion.titulo && (
                <p className="mb-2 px-3 text-xs font-semibold tracking-wider text-teal-300 uppercase">
                  {seccion.titulo}
                </p>
              )}
              <ul className="space-y-1">
                {seccion.items.map((item) => {
                  const activa = estaActiva(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setAbierto(false)}
                        aria-current={activa ? "page" : undefined}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-amber-300 ${
                          activa ? "bg-white/10 text-white" : "text-teal-100 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <Icono nombre={item.icono} className={`size-5 ${activa ? "text-amber-300" : "text-teal-300"}`} />
                        {item.etiqueta}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="space-y-3 border-t border-white/10 p-4">
          <div className="px-2">
            <p className="truncate text-sm font-semibold text-white">{usuario.nombre}</p>
            <p className="text-xs text-teal-300">{usuario.rol}</p>
          </div>
          {pie}
        </div>
      </aside>
    </>
  );
}

function Marca() {
  return (
    <span className="flex items-center gap-2 text-lg font-bold tracking-tight text-white">
      <span aria-hidden="true" className="flex flex-col">
        <span className="h-1 w-3 rounded-t-sm bg-amber-300" />
        <span className="h-3 w-5 rounded-tr-sm rounded-b-sm bg-amber-200" />
      </span>
      SIGEX
    </span>
  );
}