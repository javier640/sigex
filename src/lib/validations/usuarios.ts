/**
 * SIGEX · Esquemas Zod de administración de usuarios
 */
import { z } from "zod";
import { emailSchema, passwordNuevaSchema } from "@/lib/validations/auth";

const nombre = z
  .string({ error: "Ingresa el nombre." })
  .trim()
  .min(3, "El nombre debe tener al menos 3 caracteres.")
  .max(150, "El nombre es demasiado largo.");

// Los <select> envían texto: coerce lo convierte a número ("" → 0, que no es positivo)
const rolId = z.coerce.number({ error: "Selecciona un rol." }).int().positive("Selecciona un rol.");

export const crearUsuarioSchema = z
  .object({
    nombre,
    email: emailSchema,
    rolId,
    password: passwordNuevaSchema,
    confirmacion: z.string({ error: "Confirma la contraseña." }).min(1, "Confirma la contraseña."),
  })
  .refine((d) => d.password === d.confirmacion, {
    path: ["confirmacion"],
    error: "Las contraseñas no coinciden.",
  });

export const editarUsuarioSchema = z.object({
  nombre,
  email: emailSchema,
  rolId,
});

export const cambiarEstadoUsuarioSchema = z.object({
  usuarioId: z.coerce.number().int().positive(),
  activar: z.enum(["true", "false"]).transform((v) => v === "true"),
});