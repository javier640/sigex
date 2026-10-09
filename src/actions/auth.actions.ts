"use server";


import { after } from "next/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { crearSesion, destruirSesion } from "@/lib/session";
import { simularVerificacion, verificarPassword } from "@/lib/password";
import { procesarSolicitudRecuperacion, restablecerPassword } from "@/lib/password-reset";
import { loginSchema, recuperarSchema, restablecerSchema } from "@/lib/validations/auth";

const MENSAJE_ERROR_SERVIDOR = "No fue posible completar la operación. Intenta de nuevo en unos minutos.";

function textoDe(valor: FormDataEntryValue | null): string {
  return typeof valor === "string" ? valor : "";
}

export type LoginState = {
  error?: string;
  fieldErrors?: { email?: string[]; password?: string[] };
  email?: string;
};

const MENSAJE_CREDENCIALES = "Correo o contraseña incorrectos.";
const DESTINO_DEFAULT = "/dashboard";


function destinoSeguro(valor: FormDataEntryValue | null): string {
  if (typeof valor !== "string") return DESTINO_DEFAULT;
  const esInterna = valor.startsWith("/") && !valor.startsWith("//") && !valor.startsWith("/\\");
  if (!esInterna || valor.startsWith("/login")) return DESTINO_DEFAULT;
  return valor;
}

export async function loginAction(_estadoPrevio: LoginState, formData: FormData): Promise<LoginState> {
  const emailIngresado = textoDe(formData.get("email"));

  const resultado = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!resultado.success) {
    return { fieldErrors: z.flattenError(resultado.error).fieldErrors, email: emailIngresado };
  }

  const { email, password } = resultado.data;

  try {
    const usuario = await db.usuario.findUnique({
      where: { email },
      select: { id: true, passwordHash: true, activo: true },
    });

    if (!usuario) {
      await simularVerificacion(password);
      return { error: MENSAJE_CREDENCIALES, email };
    }

    const passwordValida = await verificarPassword(password, usuario.passwordHash);

    if (!passwordValida || !usuario.activo) {
      return { error: MENSAJE_CREDENCIALES, email };
    }

    await crearSesion(usuario.id);
  } catch (error) {
    console.error("[loginAction] Error inesperado:", error);
    return { error: MENSAJE_ERROR_SERVIDOR, email };
  }

  redirect(destinoSeguro(formData.get("redirectTo")));
}


export async function logoutAction(): Promise<void> {
  await destruirSesion();
  redirect("/login");
}


export type RecuperarState = {
  enviado?: boolean;
  fieldErrors?: { email?: string[] };
  email?: string;
};

export async function solicitarRecuperacionAction(
  _estadoPrevio: RecuperarState,
  formData: FormData,
): Promise<RecuperarState> {
  const resultado = recuperarSchema.safeParse({ email: formData.get("email") });

  if (!resultado.success) {
    return { fieldErrors: z.flattenError(resultado.error).fieldErrors, email: textoDe(formData.get("email")) };
  }

  const { email } = resultado.data;

  after(async () => {
    try {
      await procesarSolicitudRecuperacion(email);
    } catch (error) {
      console.error("[solicitarRecuperacionAction] Error inesperado:", error);
    }
  });

  return { enviado: true, email };
}



export type RestablecerState = {
  error?: string;
  enlaceInvalido?: boolean;
  fieldErrors?: { password?: string[]; confirmacion?: string[] };
};

const MENSAJE_ENLACE_INVALIDO = "El enlace no es válido o ya venció. Solicita uno nuevo.";

export async function restablecerPasswordAction(
  _estadoPrevio: RestablecerState,
  formData: FormData,
): Promise<RestablecerState> {
  const resultado = restablecerSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmacion: formData.get("confirmacion"),
  });

  if (!resultado.success) {
    const errores = z.flattenError(resultado.error).fieldErrors;
    if (errores.token) return { error: MENSAJE_ENLACE_INVALIDO, enlaceInvalido: true };
    return { fieldErrors: { password: errores.password, confirmacion: errores.confirmacion } };
  }

  const { token, password } = resultado.data;

  try {
    const cambiada = await restablecerPassword(token, password);
    if (!cambiada) return { error: MENSAJE_ENLACE_INVALIDO, enlaceInvalido: true };
  } catch (error) {
    console.error("[restablecerPasswordAction] Error inesperado:", error);
    return { error: MENSAJE_ERROR_SERVIDOR };
  }

  redirect("/login?restablecida=1");
}