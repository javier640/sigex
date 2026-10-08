/**
 * SIGEX · Definición del menú lateral
 *
 * El filtrado por permisos ocurre en el SERVIDOR (layout de (app)): al
 * navegador solo llegan las opciones permitidas. Aun así, ocultar una
 * opción no es seguridad: el proxy y cada página validan de nuevo.
 *
 * Los permisos aquí deben coincidir con REGLAS_RUTAS de permissions.ts.
 */
import { can, PERMISOS, type Permiso, type SujetoConPermisos } from "@/lib/permissions";

export type IconoMenu = "inicio" | "expedientes" | "usuarios" | "bitacora";

export type ItemMenu = { href: string; etiqueta: string; icono: IconoMenu };
export type SeccionMenu = { titulo?: string; items: ItemMenu[] };

type DefinicionItem = ItemMenu & { permiso?: Permiso };

const MENU: { titulo?: string; items: DefinicionItem[] }[] = [
  {
    items: [
      { href: "/dashboard", etiqueta: "Inicio", icono: "inicio" },
      { href: "/expedientes", etiqueta: "Expedientes", icono: "expedientes", permiso: PERMISOS.EXPEDIENTES_VER },
    ],
  },
  {
    titulo: "Administración",
    items: [
      { href: "/admin/usuarios", etiqueta: "Usuarios", icono: "usuarios", permiso: PERMISOS.USUARIOS_GESTIONAR },
      { href: "/admin/bitacora", etiqueta: "Bitácora", icono: "bitacora", permiso: PERMISOS.BITACORA_VER },
    ],
  },
];

/** Devuelve solo las secciones y opciones a las que el usuario tiene acceso. */
export function construirMenu(usuario: SujetoConPermisos): SeccionMenu[] {
  return MENU.map((seccion) => ({
    titulo: seccion.titulo,
    items: seccion.items
      .filter((item) => !item.permiso || can(usuario, item.permiso))
      .map(({ href, etiqueta, icono }) => ({ href, etiqueta, icono })),
  })).filter((seccion) => seccion.items.length > 0);
}