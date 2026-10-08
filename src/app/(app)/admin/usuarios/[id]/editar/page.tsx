import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requerirPermiso } from "@/lib/guards";
import { PERMISOS } from "@/lib/permissions";
import { obtenerRoles, obtenerUsuario } from "@/lib/usuarios";
import { editarUsuarioAction } from "@/actions/usuarios.actions";
import { Alerta } from "@/components/ui/alerta";
import { EncabezadoPagina } from "@/components/ui/encabezado-pagina";
import { Enlace } from "@/components/ui/enlace";
import { UsuarioForm } from "@/components/usuarios/usuario-form";

export const metadata: Metadata = {
  title: "Editar usuario · SIGEX",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditarUsuarioPage({ params }: Props) {
  const { usuario: actual } = await requerirPermiso(PERMISOS.USUARIOS_GESTIONAR);

  const { id } = await params;
  const usuarioId = Number(id);
  if (!Number.isInteger(usuarioId) || usuarioId <= 0) notFound();

  const [usuario, roles] = await Promise.all([obtenerUsuario(usuarioId), obtenerRoles()]);
  if (!usuario) notFound();

  const esPropio = usuario.id === actual.id;

  return (
    <div className="space-y-6">
      <Enlace href="/admin/usuarios" className="text-sm">
        ← Usuarios
      </Enlace>
      <EncabezadoPagina titulo={`Editar a ${usuario.nombre}`} descripcion={usuario.email} />

      {!usuario.activo && (
        <div className="max-w-3xl">
          <Alerta variante="info">
            Este usuario está desactivado y no puede iniciar sesión. Puedes activarlo desde el listado.
          </Alerta>
        </div>
      )}

      <div className="max-w-3xl rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5 sm:p-8">
        <UsuarioForm
          modo="editar"
          // .bind fija el primer argumento (el id); el formulario aporta los demás
          accion={editarUsuarioAction.bind(null, usuario.id)}
          roles={roles}
          inicial={{ nombre: usuario.nombre, email: usuario.email, rolId: usuario.rolId }}
          rolBloqueado={esPropio}
        />
      </div>
    </div>
  );
}