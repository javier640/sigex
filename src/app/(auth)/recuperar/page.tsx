import type { Metadata } from "next";
import { RecuperarForm } from "@/components/auth/recuperar-form";
import { MINUTOS_EXPIRACION_RECUPERACION } from "@/lib/password-reset";

export const metadata: Metadata = {
  title: "Recuperar contraseña · SIGEX",
};

export default function RecuperarPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Recupera tu contraseña</h1>
      <p className="mt-1.5 mb-8 text-sm text-slate-600">
        Escribe tu correo y te enviaremos un enlace para definir una nueva.
      </p>
      <RecuperarForm minutos={MINUTOS_EXPIRACION_RECUPERACION} />
    </>
  );
}