import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { verificarAcceso } from "@/lib/guards";
import { PERMISOS } from "@/lib/permissions";
import { listarBitacora } from "@/lib/bitacora";
import { filtrosBitacoraSchema } from "@/lib/validations/bitacora";

const SIN_CACHE = { "Cache-Control": "private, no-store" };

export async function GET(request: NextRequest) {
  try {
    const acceso = await verificarAcceso(PERMISOS.BITACORA_VER);
    if (!acceso.ok) {
      return NextResponse.json({ error: acceso.mensaje }, { status: acceso.status, headers: SIN_CACHE });
    }

    const filtros = filtrosBitacoraSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
    if (!filtros.success) {
      const detalles = z.flattenError(filtros.error).fieldErrors;
      const primerError = Object.values(detalles).flat()[0];
      return NextResponse.json(
        { error: primerError ?? "Parámetros inválidos.", detalles },
        { status: 400, headers: SIN_CACHE },
      );
    }

    return NextResponse.json(await listarBitacora(filtros.data), { headers: SIN_CACHE });
  } catch (error) {
    console.error("[GET /api/bitacora] Error inesperado:", error);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500, headers: SIN_CACHE });
  }
}