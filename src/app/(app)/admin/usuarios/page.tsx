/**
 * Listado de usuarios con filtros.
 *
 * Server Component: los filtros viajan en la URL (?busqueda=&rol=&estado=)
 * con un formulario GET, así funcionan sin JavaScript y se pueden compartir.
 */
import type { Metadata } from "next";
import { requerirPermiso } from "@/lib/guards";
import { PERMISOS } from "@/lib/permissions";
import { listarUsuarios, obtenerRoles, type FiltrosUsuarios } from "@/lib/usuarios";
import { formatearFecha } from "@/lib/formato";
import { Alerta } from "@/components/ui/alerta";
import { BotonEnlace } from "@/components/ui/boton-enlace";
import { CampoFormulario } from "@/components/ui/campo-formulario";
import { CampoSelect } from "@/components/ui/campo-select";
import { EncabezadoPagina } from "@/components/ui/encabezado-pagina";
import { Enlace } from "@/components/ui/enlace";
import { Icono } from "@/components/ui/iconos";
import { Insignia } from "@/components/ui/insignia";
import { BotonEstadoUsuario } from "@/components/usuarios/boton-estado-usuario";

export const metadata: Metadata = {
  title: "Usuarios · SIGEX",
};

type Props = {
  searchParams: Promise<{ busqueda?: string; rol?: string; estado?: string; aviso?: string }>;
};

const AVISOS: Record<string, string> = {
  creado: "El usuario se creó correctamente.",
  actualizado: "Los cambios se guardaron correctamente.",
};

function leerFiltros(params: Awaited<Props["searchParams"]>): FiltrosUsuarios {
  const busqueda = typeof params.busqueda === "string" ? params.busqueda.trim().slice(0, 100) : "";
  const rolId = Number(params.rol);
  return {
    busqueda: busqueda || undefined,
    rolId: Number.isInteger(rolId) && rolId > 0 ? rolId : undefined,
    activo: params.estado === "activos" ? true : params.estado === "inactivos" ? false : undefined,
  };
}

function iniciales(nombre: string): string {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("");
}

export default async function UsuariosPage({ searchParams }: Props) {
  const { usuario: actual } = await requerirPermiso(PERMISOS.USUARIOS_GESTIONAR);

  const params = await searchParams;
  const filtros = leerFiltros(params);
  const hayFiltros = Boolean(filtros.busqueda || filtros.rolId || filtros.activo !== undefined);

  const [usuarios, roles] = await Promise.all([listarUsuarios(filtros), obtenerRoles()]);
  const aviso = params.aviso ? AVISOS[params.aviso] : undefined;

  return (
    <div className="space-y-6">
      <EncabezadoPagina
        titulo="Usuarios"
        descripcion="Alta de usuarios, asignación de rol y control de acceso."
        acciones={
          <BotonEnlace href="/admin/usuarios/nuevo">
            <Icono nombre="mas" className="size-4" />
            Nuevo usuario
          </BotonEnlace>
        }
      />

      {aviso && <Alerta variante="exito">{aviso}</Alerta>}

      {/* Filtros: formulario GET, sin JavaScript */}
      <form
        method="get"
        className="grid gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5 sm:grid-cols-2 lg:grid-cols-4 lg:items-end"
      >
        <CampoFormulario
          id="busqueda"
          label="Buscar"
          type="search"
          placeholder="Nombre o correo"
          defaultValue={filtros.busqueda ?? ""}
        />
        <CampoSelect id="rol" label="Rol" defaultValue={filtros.rolId ? String(filtros.rolId) : ""}>
          <option value="">Todos</option>
          {roles.map((rol:{ id: number; nombre: string }) => (
            <option key={rol.id} value={rol.id}>
              {rol.nombre}
            </option>
          ))}
        </CampoSelect>
        <CampoSelect id="estado" label="Estado" defaultValue={params.estado ?? ""}>
          <option value="">Todos</option>
          <option value="activos">Activos</option>
          <option value="inactivos">Inactivos</option>
        </CampoSelect>
        <div className="flex gap-3">
          <button
            type="submit"
            className="flex-1 rounded-lg bg-teal-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800"
          >
            Filtrar
          </button>
          {hayFiltros && (
            <BotonEnlace href="/admin/usuarios" variante="secundario">
              Limpiar
            </BotonEnlace>
          )}
        </div>
      </form>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-900/5">
        <div className="border-b border-slate-200 px-5 py-3">
          <p className="text-sm text-slate-600">
            {usuarios.length === 1 ? "1 usuario" : `${usuarios.length} usuarios`}
            {hayFiltros && " con los filtros aplicados"}
          </p>
        </div>

        {usuarios.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-slate-600">No hay usuarios que coincidan con la búsqueda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold tracking-wide text-slate-600 uppercase">
                <tr>
                  <th scope="col" className="px-5 py-3">Usuario</th>
                  <th scope="col" className="px-5 py-3">Rol</th>
                  <th scope="col" className="px-5 py-3">Estado</th>
                  <th scope="col" className="px-5 py-3">Alta</th>
                  <th scope="col" className="px-5 py-3 text-right">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuarios.map((u: { id: number; nombre: string; email: string; rol: { nombre: string }; activo: boolean; creadoEn: string }) => {
                  const esPropio = u.id === actual.id;
                  return (
                    <tr key={u.id} className={u.activo ? "" : "bg-slate-50/60"}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span
                            aria-hidden="true"
                            className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                              u.activo ? "bg-teal-100 text-teal-800" : "bg-slate-200 text-slate-500"
                            }`}
                          >
                            {iniciales(u.nombre)}
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900">
                              {u.nombre}
                              {esPropio && <span className="ml-2 text-xs font-normal text-slate-500">(tú)</span>}
                            </p>
                            <p className="truncate text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-slate-700">{u.rol.nombre}</td>
                      <td className="px-5 py-4">
                        {u.activo ? (
                          <Insignia colores="bg-emerald-50 text-emerald-800 ring-emerald-600/20">Activo</Insignia>
                        ) : (
                          <Insignia colores="bg-slate-100 text-slate-600 ring-slate-500/20">Inactivo</Insignia>
                        )}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-slate-600">{formatearFecha(u.creadoEn)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-start justify-end gap-3">
                          <Enlace href={`/admin/usuarios/${u.id}/editar`} className="py-1.5 text-xs">
                            Editar
                          </Enlace>
                          {/* key con el estado: al cambiar, el componente se reinicia y
                              se cierra la confirmación que hubiera quedado abierta */}
                          {!esPropio && (
                            <BotonEstadoUsuario key={`${u.id}-${u.activo}`} usuarioId={u.id} nombre={u.nombre} activo={u.activo} />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}