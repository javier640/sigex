/**
 * SIGEX · Hash y verificación de contraseñas
 */
import "server-only";
import { compare, hash } from "bcryptjs";

/** Debe coincidir con BCRYPT_COST de prisma/seed.ts. */
export const BCRYPT_COST = 12;

export function hashPassword(password: string): Promise<string> {
  return hash(password, BCRYPT_COST);
}

export function verificarPassword(password: string, passwordHash: string): Promise<boolean> {
  return compare(password, passwordHash);
}

let hashSenuelo: Promise<string> | null = null;

/**
 * Hace una comparación bcrypt contra un hash señuelo.
 * Se usa cuando el correo NO existe, para que la respuesta tarde lo mismo
 * que cuando sí existe. Sin esto, un atacante podría medir tiempos de
 * respuesta y descubrir qué correos están registrados.
 */
export async function simularVerificacion(password: string): Promise<void> {
  hashSenuelo ??= hash("sigex-hash-senuelo", BCRYPT_COST);
  await compare(password, await hashSenuelo);
}