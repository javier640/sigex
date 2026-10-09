import { NextResponse } from "next/server";
import { verificarAcceso } from "@/lib/guards";

const SIN_CACHE = { "Cache-Control": "private, no-store" };

export async function GET() {
  try {
    const acceso = await verificarAcceso();

    if (!acceso.ok) {
      return NextResponse.json({ error: acceso.mensaje }, { status: acceso.status, headers: SIN_CACHE });
    }

    const { usuario, expiraEn } = acceso.sesion;
    return NextResponse.json({ usuario, expiraEn: expiraEn.toISOString() }, { headers: SIN_CACHE });
  } catch (error) {
    console.error("[GET /api/auth/me] Error inesperado:", error);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500, headers: SIN_CACHE });
  }
}