"use client";


import { useActionState } from "react";
import type { UsuarioFormState } from "@/actions/usuarios.actions";
import { Alerta } from "@/components/ui/alerta";
import { BotonEnlace } from "@/components/ui/boton-enlace";
import { CampoFormulario } from "@/components/ui/campo-formulario";
import { CampoSelect } from "@/components/ui/campo-select";
import { SubmitButton } from "@/components/ui/submit-button";
import { DESCRIPCION_POLITICA_PASSWORD } from "@/lib/validations/auth";

type Rol = { id: number; nombre: string; descripcion: string | null };

type Props = {
  modo: "crear" | "editar";
  accion: (estado: UsuarioFormState, formData: FormData) => Promise<UsuarioFormState>;
  roles: Rol[];
  inicial?: { nombre: string; email: string; rolId: number };
  rolBloqueado?: boolean;
};

const ESTADO_INICIAL: UsuarioFormState = {};

export function UsuarioForm({ modo, accion, roles, inicial, rolBloqueado = false }: Props) {
  const [estado, formAction] = useActionState(accion, ESTADO_INICIAL);
  const errores = estado.fieldErrors;

  const valor = {
    nombre: estado.valores?.nombre ?? inicial?.nombre ?? "",
    email: estado.valores?.email ?? inicial?.email ?? "",
    rolId: estado.valores?.rolId ?? (inicial ? String(inicial.rolId) : ""),
  };

  return (
    <form action={formAction} noValidate className="space-y-6">
      {estado.error && <Alerta variante="error">{estado.error}</Alerta>}

      <div className="grid gap-6 sm:grid-cols-2">
        <CampoFormulario
          id="nombre"
          label="Nombre completo"
          autoComplete="off"
          defaultValue={valor.nombre}
          error={errores?.nombre?.[0]}
        />
        <CampoFormulario
          id="email"
          label="Correo"
          type="email"
          autoComplete="off"
          placeholder="nombre@dominio.com"
          defaultValue={valor.email}
          error={errores?.email?.[0]}
        />
      </div>

      {/* Un select deshabilitado no se envía: el valor viaja en un campo oculto */}
      {rolBloqueado && <input type="hidden" name="rolId" value={valor.rolId} />}
      <CampoSelect
        id="rolId"
        name={rolBloqueado ? "" : "rolId"}
        label="Rol"
        defaultValue={valor.rolId}
        disabled={rolBloqueado}
        ayuda={
          rolBloqueado
            ? "No puedes cambiar tu propio rol. Pide a otro administrador que lo haga."
            : "El rol define qué puede ver y hacer el usuario."
        }
        error={errores?.rolId?.[0]}
      >
        <option value="" disabled>
          Selecciona un rol
        </option>
        {roles.map((rol) => (
          <option key={rol.id} value={rol.id}>
            {rol.nombre}
            {rol.descripcion ? ` — ${rol.descripcion}` : ""}
          </option>
        ))}
      </CampoSelect>

      {modo === "crear" && (
        <fieldset className="space-y-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <legend className="px-1 text-sm font-semibold text-slate-800">Contraseña inicial</legend>
          <div className="grid gap-6 sm:grid-cols-2">
            <CampoFormulario
              id="password"
              label="Contraseña"
              type="password"
              autoComplete="new-password"
              ayuda={DESCRIPCION_POLITICA_PASSWORD}
              error={errores?.password?.[0]}
            />
            <CampoFormulario
              id="confirmacion"
              label="Confirma la contraseña"
              type="password"
              autoComplete="new-password"
              error={errores?.confirmacion?.[0]}
            />
          </div>
          <p className="text-sm text-slate-600">
            Comparte esta contraseña con el usuario por un medio seguro. Después podrá cambiarla desde
            &ldquo;¿Olvidaste tu contraseña?&rdquo;.
          </p>
        </fieldset>
      )}

      <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-6">
        <BotonEnlace href="/admin/usuarios" variante="secundario">
          Cancelar
        </BotonEnlace>
        <SubmitButton textoPendiente="Guardando…">
          {modo === "crear" ? "Crear usuario" : "Guardar cambios"}
        </SubmitButton>
      </div>
    </form>
  );
}