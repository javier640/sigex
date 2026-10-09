import type { Metadata } from "next";
import { buscarTokenRecuperacionValido } from "@/lib/password-reset";
import { Alerta } from "@/components/ui/alerta";
import { Enlace } from "@/components/ui/enlace";
import { RestablecerForm } from "@/components/auth/restablecer-form";

export const metadata: Metadata = {
  title: "Nueva contraseña · SIGEX",
  referrer: "no-referrer",
};

type Props = {
  params: Promise<{ token: string }>;
};

export default async function RestablecerPage({ params }: Props) {
  const { token } = await params;
  const registro = await buscarTokenRecuperacionValido(token);

  if (!registro) {
    return (
      <>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Enlace no válido</h1>
        <p className="mt-1.5 mb-8 text-sm text-slate-600">No podemos usar este enlace para cambiar tu contraseña.</p>
        <div className="space-y-6">
          <Alerta variante="error">
            El enlace ya se usó, venció o está incompleto. Por seguridad, cada enlace funciona una sola vez y por
            tiempo limitado.
          </Alerta>
          <Enlace href="/recuperar" className="inline-block text-sm">
            Solicitar un enlace nuevo
          </Enlace>
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Define una nueva contraseña</h1>
      <p className="mt-1.5 mb-8 text-sm text-slate-600">
        Al guardarla se cerrarán todas tus sesiones abiertas.
      </p>
      <RestablecerForm token={token} />
    </>
  );
}