/**
 * SIGEX · Utilidades de tokens aleatorios
 */
import "server-only";
import { createHash, randomBytes } from "node:crypto";

/** Token criptográficamente seguro, codificado en base64url (apto para URL y cookies). */
export function generarTokenSeguro(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/** Hash SHA-256 en hexadecimal. Suficiente para tokens largos y aleatorios. */
export function hashSha256(valor: string): string {
  return createHash("sha256").update(valor).digest("hex");
}