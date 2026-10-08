import type { Metadata } from "next";
import { requerirPermiso } from "@/lib/guards";
import { PERMISOS } from "@/lib/permissions";
import { obtenerRoles } from "@/lib/usuarios";
import { crearUsuarioAction } from "@/actions/usuarios.actions";
import { EncabezadoPagina } from "@/components/ui/encabezado-pagina";
import { Enlace } from "@/components/ui/enlace";
import { UsuarioForm } from "@/components/usuarios/usuario-form";

export const metadata: Metadata = {
  title: "Nuevo usuario · SIGEX",
};

export default async function NuevoUsuarioPage() {
  await requerirPermiso(PERMISOS.USUARIOS_GESTIONAR);
  const roles = await obtenerRoles();

  return (
    <div className="space-y-6">
      <Enlace href="/admin/usuarios" className="text-sm">
        ← Usuarios
      </Enlace>
      <EncabezadoPagina titulo="Nuevo usuario" descripcion="El usuario podrá iniciar sesión en cuanto lo guardes." />
      <div className="max-w-3xl rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5 sm:p-8">
        <UsuarioForm modo="crear" accion={crearUsuarioAction} roles={roles} />
      </div>
    </div>
  );
}