/**
 * Listado de expedientes.
 * La página (servidor) valida el permiso y lee los filtros iniciales de la URL;
 * la tabla (cliente) se encarga de buscar, filtrar y paginar vía la API.
 */
import type { Metadata } from "next";
import { requerirPermiso } from "@/lib/guards";
import { can, PERMISOS } from "@/lib/permissions";
import { filtrosExpedientesSchema } from "@/lib/validations/expedientes";
import { Alerta } from "@/components/ui/alerta";
import { BotonEnlace } from "@/components/ui/boton-enlace";
import { EncabezadoPagina } from "@/components/ui/encabezado-pagina";
import { Icono } from "@/components/ui/iconos";
import { ExpedientesListado } from "@/components/expedientes/expedientes-listado";

export const metadata: Metadata = {
  title: "Expedientes · SIGEX",
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ExpedientesPage({ searchParams }: Props) {
  const { usuario } = await requerirPermiso(PERMISOS.EXPEDIENTES_VER);

  const params = await searchParams;
  // Si la URL trae valores inválidos, se ignoran y se usan los de por defecto
  const filtros = filtrosExpedientesSchema.safeParse(params);
  const iniciales = filtros.success ? filtros.data : filtrosExpedientesSchema.parse({});

  return (
    <div className="space-y-6">
      <EncabezadoPagina
        titulo="Expedientes"
        descripcion="Consulta, búsqueda y seguimiento de expedientes."
        acciones={
          can(usuario, PERMISOS.EXPEDIENTES_CREAR) && (
            <BotonEnlace href="/expedientes/nuevo">
              <Icono nombre="mas" className="size-4" />
              Nuevo expediente
            </BotonEnlace>
          )
        }
      />

      {params.aviso === "eliminado" && <Alerta variante="exito">El expediente se dio de baja.</Alerta>}

      <ExpedientesListado
        filtrosIniciales={{
          pagina: iniciales.pagina,
          busqueda: iniciales.busqueda ?? "",
          estatus: iniciales.estatus ?? "",
        }}
      />
    </div>
  );
}