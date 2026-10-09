import "server-only";
import { db } from "@/lib/db";

export type FiltrosUsuarios = {
  busqueda?: string;
  rolId?: number;
  activo?: boolean;
};

export function obtenerRoles() {
  return db.rol.findMany({
    select: { id: true, nombre: true, descripcion: true },
    orderBy: { id: "asc" },
  });
}

export function listarUsuarios({ busqueda, rolId, activo }: FiltrosUsuarios) {
  return db.usuario.findMany({
    where: {
      ...(busqueda && {
        OR: [
          { nombre: { contains: busqueda, mode: "insensitive" } },
          { email: { contains: busqueda, mode: "insensitive" } },
        ],
      }),
      ...(rolId && { rolId }),
      ...(activo !== undefined && { activo }),
    },
    select: {
      id: true,
      nombre: true,
      email: true,
      activo: true,
      creadoEn: true,
      rol: { select: { nombre: true } },
    },
    orderBy: [{ activo: "desc" }, { nombre: "asc" }],
  });
}

export function obtenerUsuario(id: number) {
  return db.usuario.findUnique({
    where: { id },
    select: {
      id: true,
      nombre: true,
      email: true,
      activo: true,
      rolId: true,
      rol: { select: { nombre: true } },
    },
  });
}