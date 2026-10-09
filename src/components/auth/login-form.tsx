"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type LoginState } from "@/actions/auth.actions";
import { SubmitButton } from "@/components/ui/submit-button";

const ESTADO_INICIAL: LoginState = {};

const CLASES_INPUT =
  "block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-teal-700 focus:ring-4 focus:ring-teal-700/15 focus:outline-none aria-invalid:border-red-600 aria-invalid:focus:ring-red-600/15";

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [estado, formAction] = useActionState(loginAction, ESTADO_INICIAL);
  const errorEmail = estado.fieldErrors?.email?.[0];
  const errorPassword = estado.fieldErrors?.password?.[0];

  return (
    <form action={formAction} noValidate className="space-y-6">
      {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}

      {estado.error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800">
          {estado.error}
        </p>
      )}

      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-slate-800">
          Correo
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          autoFocus
          placeholder="nombre@dominio.com"
          defaultValue={estado.email}
          aria-invalid={errorEmail ? true : undefined}
          aria-describedby={errorEmail ? "email-error" : undefined}
          className={CLASES_INPUT}
        />
        {errorEmail && (
          <p id="email-error" className="text-sm text-red-700">
            {errorEmail}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-4">
          <label htmlFor="password" className="block text-sm font-medium text-slate-800">
            Contraseña
          </label>
          <Link
            href="/recuperar"
            className="rounded text-sm font-medium text-teal-800 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={errorPassword ? true : undefined}
          aria-describedby={errorPassword ? "password-error" : undefined}
          className={CLASES_INPUT}
        />
        {errorPassword && (
          <p id="password-error" className="text-sm text-red-700">
            {errorPassword}
          </p>
        )}
      </div>

      <SubmitButton textoPendiente="Verificando…" className="w-full">
        Iniciar sesión
      </SubmitButton>
    </form>
  );
}