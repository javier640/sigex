/**
 * SIGEX · Esquemas Zod de autenticación
 *
 * Archivo compartido: sin dependencias de servidor, para poder usarse
 * también en el cliente si se quiere validar antes de enviar.
 */
import { z } from "zod";

/** Política mínima de contraseñas. */
export const PASSWORD_MIN = 8;
/** bcrypt solo toma en cuenta los primeros 72 bytes de la contraseña. */
export const PASSWORD_MAX = 72;

/** Los tokens de recuperación son 32 bytes en base64url: 43 caracteres. */
export const TOKEN_RECUPERACION_REGEX = /^[A-Za-z0-9_-]{43}$/;

export const DESCRIPCION_POLITICA_PASSWORD = `Mínimo ${PASSWORD_MIN} caracteres, con al menos una letra y un número.`;

/** Correo normalizado: sin espacios y en minúsculas. */
export const emailSchema = z
  .string({ error: "Ingresa tu correo." })
  .trim()
  .toLowerCase()
  .min(1, "Ingresa tu correo.")
  .max(255, "El correo es demasiado largo.")
  .pipe(z.email("Ingresa un correo válido."));

/** Contraseña nueva: aquí sí se aplica la política. */
export const passwordNuevaSchema = z
  .string({ error: "Ingresa una contraseña." })
  .min(PASSWORD_MIN, `Debe tener al menos ${PASSWORD_MIN} caracteres.`)
  .regex(/[A-Za-z]/, "Debe incluir al menos una letra.")
  .regex(/\d/, "Debe incluir al menos un número.")
  .refine((v) => new TextEncoder().encode(v).length <= PASSWORD_MAX, "La contraseña es demasiado larga.");

// ─────────────────────────────────────────────
// Login
// ─────────────────────────────────────────────

export const loginSchema = z.object({
  email: emailSchema,
  // En el login no se aplica la política de longitud mínima: solo se
  // verifica que venga algo. La política se aplica al crear o cambiar.
  password: z
    .string({ error: "Ingresa tu contraseña." })
    .min(1, "Ingresa tu contraseña.")
    .max(PASSWORD_MAX, "Correo o contraseña incorrectos."),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ─────────────────────────────────────────────
// Recuperación de contraseña
// ─────────────────────────────────────────────

export const recuperarSchema = z.object({ email: emailSchema });

export const restablecerSchema = z
  .object({
    token: z.string().regex(TOKEN_RECUPERACION_REGEX),
    password: passwordNuevaSchema,
    confirmacion: z.string({ error: "Confirma tu contraseña." }).min(1, "Confirma tu contraseña."),
  })
  .refine((d) => d.password === d.confirmacion, {
    path: ["confirmacion"],
    error: "Las contraseñas no coinciden.",
  });