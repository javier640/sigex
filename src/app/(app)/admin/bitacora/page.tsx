/**
 * Consulta de la bitácora de auditoría (solo Administrador).
 */
import type { Metadata } from "next";
import { requerirPermiso } from "@/lib/guards";
import { PERMISOS } from "@/lib/permissions";
import { obtenerUsuariosParaFiltro } from "@/lib/bitacora";
import { filtrosBitacoraSchema } from "@/lib/validations/bitacora";
import { EncabezadoPagina } from "@/components/ui/encabezado-pagina";
import { BitacoraListado } from "@/components/bitacora/bitacora-listado";

export const metadata: Metadata = {
  title: "Bitácora · SIGEX",
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BitacoraPage({ searchParams }: Props) {
  await requerirPermiso(PERMISOS.BITACORA_VER);

  // Filtros iniciales desde la URL (ej. al llegar desde el detalle de un expediente)
  const filtros = filtrosBitacoraSchema.safeParse(await searchParams);
  const iniciales = filtros.success ? filtros.data : filtrosBitacoraSchema.parse({});

  const usuarios = await obtenerUsuariosParaFiltro();

  return (
    <div className="space-y-6">
      <EncabezadoPagina
        titulo="Bitácora de auditoría"
        descripcion="Registro de cada creación, edición, cambio de estatus y baja de expedientes. Los registros no se pueden modificar ni eliminar."
      />
      <BitacoraListado
        usuarios={usuarios}
        filtrosIniciales={{
          pagina: iniciales.pagina,
          usuarioId: iniciales.usuarioId ? String(iniciales.usuarioId) : "",
          accion: iniciales.accion ?? "",
          expediente: iniciales.expediente ?? "",
          desde: iniciales.desde ?? "",
          hasta: iniciales.hasta ?? "",
        }}
      />
    </div>
  );
}