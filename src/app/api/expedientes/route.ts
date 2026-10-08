/**
 * GET /api/expedientes?pagina=1&porPagina=10&busqueda=texto&estatus=abierto
 *
 *  - 200: { datos, paginacion }
 *  - 400: parámetros inválidos
 *  - 401: sin sesión
 *  - 403: sin permiso expedientes:ver
 *  - 500: error inesperado
 *
 * Lo consume el hook useExpedientes para paginar y buscar sin recargar la página.
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { verificarAcceso } from "@/lib/guards";
import { PERMISOS } from "@/lib/permissions";
import { listarExpedientes } from "@/lib/expedientes";
import { filtrosExpedientesSchema } from "@/lib/validations/expedientes";

const SIN_CACHE = { "Cache-Control": "private, no-store" };

export async function GET(request: NextRequest) {
  try {
    const acceso = await verificarAcceso(PERMISOS.EXPEDIENTES_VER);
    if (!acceso.ok) {
      return NextResponse.json({ error: acceso.mensaje }, { status: acceso.status, headers: SIN_CACHE });
    }

    const parametros = Object.fromEntries(request.nextUrl.searchParams);
    const filtros = filtrosExpedientesSchema.safeParse(parametros);

    if (!filtros.success) {
      return NextResponse.json(
        { error: "Parámetros inválidos.", detalles: z.flattenError(filtros.error).fieldErrors },
        { status: 400, headers: SIN_CACHE },
      );
    }

    const respuesta = await listarExpedientes(filtros.data);
    return NextResponse.json(respuesta, { headers: SIN_CACHE });
  } catch (error) {
    console.error("[GET /api/expedientes] Error inesperado:", error);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500, headers: SIN_CACHE });
  }
}