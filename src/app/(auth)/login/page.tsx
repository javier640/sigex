import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { obtenerSesion } from "@/lib/session";
import { Alerta } from "@/components/ui/alerta";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión · SIGEX",
};

type Props = {
  searchParams: Promise<{ from?: string | string[]; restablecida?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  if (await obtenerSesion()) redirect("/dashboard");

  const { from, restablecida } = await searchParams;
  const redirectTo = typeof from === "string" ? from : undefined;

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Inicia sesión</h1>
      <p className="mt-1.5 mb-8 text-sm text-slate-600">Usa el correo con el que te dieron de alta.</p>

      {restablecida === "1" && (
        <div className="mb-6">
          <Alerta variante="exito">Tu contraseña se actualizó. Inicia sesión con la nueva.</Alerta>
        </div>
      )}

      <LoginForm redirectTo={redirectTo} />
    </>
  );
}