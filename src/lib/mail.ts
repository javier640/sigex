/**
 * SIGEX · Envío de correo con Resend
 *
 * La API key solo vive en el servidor (RESEND_API_KEY, sin NEXT_PUBLIC_).
 * El cliente se crea de forma perezosa para que el build no falle si la
 * variable no está definida en entornos donde no se envían correos.
 */
import "server-only";
import { Resend } from "resend";

const REMITENTE = process.env.MAIL_FROM ?? "SIGEX <onboarding@resend.dev>";

let cliente: Resend | null = null;

function obtenerCliente(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY no está definida.");
  cliente ??= new Resend(apiKey);
  return cliente;
}

type Correo = {
  para: string;
  asunto: string;
  html: string;
  texto: string;
};

export type ResultadoEnvio = { ok: true; id: string } | { ok: false; error: string };

export async function enviarCorreo({ para, asunto, html, texto }: Correo): Promise<ResultadoEnvio> {
  try {
    const { data, error } = await obtenerCliente().emails.send({
      from: REMITENTE,
      to: para,
      subject: asunto,
      html,
      text: texto,
    });

    if (error) return { ok: false, error: `${error.name}: ${error.message}` };
    return { ok: true, id: data?.id ?? "" };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}