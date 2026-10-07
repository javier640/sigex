/**
 * SIGEX · Lógica de recuperación de contraseña
 *
 * Flujo:
 *  1. procesarSolicitudRecuperacion: si el correo pertenece a un usuario
 *     activo, crea un token de un solo uso y envía el enlace por correo.
 *  2. buscarTokenRecuperacionValido: verifica el token al abrir el enlace.
 *  3. restablecerPassword: cambia la contraseña, marca el token como usado
 *     e invalida todas las sesiones del usuario, en una sola transacción.
 */
import "server-only";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { enviarCorreo } from "@/lib/mail";
import { generarTokenSeguro, hashSha256 } from "@/lib/tokens";
import { TOKEN_RECUPERACION_REGEX } from "@/lib/validations/auth";
import { plantillaRecuperacion } from "@/emails/recuperacion";

/** El PDF pide entre 15 y 30 minutos. */
export const MINUTOS_EXPIRACION_RECUPERACION = 30;

/**
 * URL base para construir el enlace. Se toma de una variable de entorno y
 * NO del encabezado Host de la petición: ese encabezado lo controla el
 * cliente y podría usarse para que el correo apunte a un sitio falso.
 */
function urlBaseApp(): string {
  const url = process.env.APP_URL;
  if (url) return url;
  if (process.env.NODE_ENV === "production") {
    throw new Error("APP_URL no está definida.");
  }
  return "http://localhost:3000";
}

// ─────────────────────────────────────────────
// 1. Solicitud
// ─────────────────────────────────────────────

export async function procesarSolicitudRecuperacion(email: string): Promise<void> {
  const usuario = await db.usuario.findUnique({
    where: { email },
    select: { id: true, nombre: true, email: true, activo: true },
  });

  // Correo inexistente o usuario inactivo: no se hace nada, pero quien
  // llama responde lo mismo que en el caso exitoso.
  if (!usuario || !usuario.activo) return;

  const token = generarTokenSeguro();
  const expiraEn = new Date(Date.now() + MINUTOS_EXPIRACION_RECUPERACION * 60 * 1000);

  await db.$transaction([
    // Un enlace nuevo invalida cualquier enlace anterior sin usar
    db.tokenRecuperacion.deleteMany({ where: { usuarioId: usuario.id, usadoEn: null } }),
    db.tokenRecuperacion.create({
      data: { usuarioId: usuario.id, tokenHash: hashSha256(token), expiraEn },
    }),
  ]);

  const enlace = new URL(`/restablecer/${token}`, urlBaseApp()).toString();
  const correo = plantillaRecuperacion({
    nombre: usuario.nombre,
    enlace,
    minutos: MINUTOS_EXPIRACION_RECUPERACION,
  });

  const resultado = await enviarCorreo({ para: usuario.email, ...correo });

  if (!resultado.ok) {
    // Se registra en el servidor sin incluir el token
    console.error(`[recuperacion] No se pudo enviar el correo al usuario ${usuario.id}: ${resultado.error}`);
  }
}

// ─────────────────────────────────────────────
// 2. Validación del enlace
// ─────────────────────────────────────────────

export async function buscarTokenRecuperacionValido(
  token: string,
): Promise<{ id: number; usuarioId: number } | null> {
  // Descarta valores con formato incorrecto sin consultar la BD
  if (!TOKEN_RECUPERACION_REGEX.test(token)) return null;

  const registro = await db.tokenRecuperacion.findUnique({
    where: { tokenHash: hashSha256(token) },
    select: {
      id: true,
      usuarioId: true,
      expiraEn: true,
      usadoEn: true,
      usuario: { select: { activo: true } },
    },
  });

  if (!registro) return null;
  if (registro.usadoEn) return null;
  if (registro.expiraEn.getTime() <= Date.now()) return null;
  if (!registro.usuario.activo) return null;

  return { id: registro.id, usuarioId: registro.usuarioId };
}

// ─────────────────────────────────────────────
// 3. Aplicar el cambio
// ─────────────────────────────────────────────

/** Devuelve false si el token ya no es válido. */
export async function restablecerPassword(token: string, nuevaPassword: string): Promise<boolean> {
  const registro = await buscarTokenRecuperacionValido(token);
  if (!registro) return false;

  // bcrypt es lento a propósito: se calcula fuera de la transacción
  const passwordHash = await hashPassword(nuevaPassword);
  const ahora = new Date();

  return db.$transaction(async (tx) => {
    // Marca el token como usado SOLO si nadie lo usó antes. Si dos
    // peticiones llegan al mismo tiempo, únicamente una actualiza la fila.
    const { count } = await tx.tokenRecuperacion.updateMany({
      where: { id: registro.id, usadoEn: null, expiraEn: { gt: ahora } },
      data: { usadoEn: ahora },
    });
    if (count !== 1) return false;

    await tx.usuario.update({
      where: { id: registro.usuarioId },
      data: { passwordHash },
    });

    // Requisito del PDF: invalidar las sesiones activas tras el cambio
    await tx.sesion.deleteMany({ where: { usuarioId: registro.usuarioId } });

    // Cualquier otro enlace pendiente del usuario deja de servir
    await tx.tokenRecuperacion.updateMany({
      where: { usuarioId: registro.usuarioId, usadoEn: null },
      data: { usadoEn: ahora },
    });

    return true;
  });
}