"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { verificarAcceso } from "@/lib/guards";
import { PERMISOS } from "@/lib/permissions";
import { hashPassword } from "@/lib/password";
import {
  cambiarEstadoUsuarioSchema,
  crearUsuarioSchema,
  editarUsuarioSchema,
} from "@/lib/validations/usuarios";

const RUTA_LISTADO = "/admin/usuarios";
const MENSAJE_ERROR_SERVIDOR = "No fue posible guardar los cambios. Intenta de nuevo en unos minutos.";
const MENSAJE_CORREO_DUPLICADO = "Ya existe un usuario con ese correo.";
const MENSAJE_ROL_INVALIDO = "Selecciona un rol válido.";

type CampoUsuario = "nombre" | "email" | "rolId" | "password" | "confirmacion";

export type UsuarioFormState = {
  error?: string;
  fieldErrors?: Partial<Record<CampoUsuario, string[]>>;
  valores?: { nombre: string; email: string; rolId: string };
};

export type EstadoAccion = { error?: string; ok?: boolean };

function leerValores(formData: FormData) {
  const texto = (campo: string) => {
    const valor = formData.get(campo);
    return typeof valor === "string" ? valor : "";
  };
  return { nombre: texto("nombre"), email: texto("email"), rolId: texto("rolId") };
}

function esCorreoDuplicado(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

async function existeRol(rolId: number): Promise<boolean> {
  const rol = await db.rol.findUnique({ where: { id: rolId }, select: { id: true } });
  return rol !== null;
}


export async function crearUsuarioAction(
  _estadoPrevio: UsuarioFormState,
  formData: FormData,
): Promise<UsuarioFormState> {
  const acceso = await verificarAcceso(PERMISOS.USUARIOS_GESTIONAR);
  if (!acceso.ok) return { error: acceso.mensaje };

  const valores = leerValores(formData);
  const resultado = crearUsuarioSchema.safeParse({
    ...valores,
    password: formData.get("password"),
    confirmacion: formData.get("confirmacion"),
  });

  if (!resultado.success) {
    return { fieldErrors: z.flattenError(resultado.error).fieldErrors, valores };
  }

  const { nombre, email, rolId, password } = resultado.data;

  try {
    if (!(await existeRol(rolId))) return { fieldErrors: { rolId: [MENSAJE_ROL_INVALIDO] }, valores };

    await db.usuario.create({
      data: { nombre, email, rolId, passwordHash: await hashPassword(password) },
    });
  } catch (error) {
    if (esCorreoDuplicado(error)) return { fieldErrors: { email: [MENSAJE_CORREO_DUPLICADO] }, valores };
    console.error("[crearUsuarioAction] Error inesperado:", error);
    return { error: MENSAJE_ERROR_SERVIDOR, valores };
  }

  revalidatePath(RUTA_LISTADO);
  redirect(`${RUTA_LISTADO}?aviso=creado`);
}

export async function editarUsuarioAction(
  usuarioId: number,
  _estadoPrevio: UsuarioFormState,
  formData: FormData,
): Promise<UsuarioFormState> {
  const acceso = await verificarAcceso(PERMISOS.USUARIOS_GESTIONAR);
  if (!acceso.ok) return { error: acceso.mensaje };

  const valores = leerValores(formData);

  if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
    return { error: "Usuario no válido.", valores };
  }

  const resultado = editarUsuarioSchema.safeParse(valores);
  if (!resultado.success) {
    return { fieldErrors: z.flattenError(resultado.error).fieldErrors, valores };
  }

  const { nombre, email, rolId } = resultado.data;
  const esPropio = usuarioId === acceso.sesion.usuario.id;

  try {
    const actual = await db.usuario.findUnique({ where: { id: usuarioId }, select: { rolId: true } });
    if (!actual) return { error: "El usuario ya no existe.", valores };

    // Evita que el administrador se quite a sí mismo el acceso
    if (esPropio && rolId !== actual.rolId) {
      return { fieldErrors: { rolId: ["No puedes cambiar tu propio rol."] }, valores };
    }

    if (!(await existeRol(rolId))) return { fieldErrors: { rolId: [MENSAJE_ROL_INVALIDO] }, valores };

    await db.usuario.update({ where: { id: usuarioId }, data: { nombre, email, rolId } });
  } catch (error) {
    if (esCorreoDuplicado(error)) return { fieldErrors: { email: [MENSAJE_CORREO_DUPLICADO] }, valores };
    console.error("[editarUsuarioAction] Error inesperado:", error);
    return { error: MENSAJE_ERROR_SERVIDOR, valores };
  }

  revalidatePath(RUTA_LISTADO);
  revalidatePath(`${RUTA_LISTADO}/${usuarioId}/editar`);
  redirect(`${RUTA_LISTADO}?aviso=actualizado`);
}

export async function cambiarEstadoUsuarioAction(
  _estadoPrevio: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const acceso = await verificarAcceso(PERMISOS.USUARIOS_GESTIONAR);
  if (!acceso.ok) return { error: acceso.mensaje };

  const resultado = cambiarEstadoUsuarioSchema.safeParse({
    usuarioId: formData.get("usuarioId"),
    activar: formData.get("activar"),
  });
  if (!resultado.success) return { error: "Solicitud no válida." };

  const { usuarioId, activar } = resultado.data;

  if (!activar && usuarioId === acceso.sesion.usuario.id) {
    return { error: "No puedes desactivar tu propia cuenta." };
  }

  try {
    const actual = await db.usuario.findUnique({ where: { id: usuarioId }, select: { activo: true } });
    if (!actual) return { error: "El usuario ya no existe." };

    if (activar) {
      await db.usuario.update({ where: { id: usuarioId }, data: { activo: true } });
    } else {
      // Requisito del PDF: las sesiones vigentes de un usuario desactivado
      // dejan de ser válidas. Ambas operaciones van en una transacción.
      await db.$transaction([
        db.usuario.update({ where: { id: usuarioId }, data: { activo: false } }),
        db.sesion.deleteMany({ where: { usuarioId } }),
      ]);
    }
  } catch (error) {
    console.error("[cambiarEstadoUsuarioAction] Error inesperado:", error);
    return { error: MENSAJE_ERROR_SERVIDOR };
  }

  revalidatePath(RUTA_LISTADO);
  return { ok: true };
}