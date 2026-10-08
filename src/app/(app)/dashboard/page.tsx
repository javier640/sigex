/**
 * Panel de inicio: resumen de expedientes por estatus.
 * Server Component: consulta la BD directamente, sin pasar por la API.
 */
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requerirSesion } from "@/lib/guards";
import { can, PERMISOS } from "@/lib/permissions";
import { ESTATUS, ORDEN_ESTATUS } from "@/lib/catalogos";
import { BotonEnlace } from "@/components/ui/boton-enlace";
import { Icono } from "@/components/ui/iconos";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Inicio · SIGEX",
};

export default async function DashboardPage() {
  const { usuario } = await requerirSesion();
  const puedeVer = can(usuario, PERMISOS.EXPEDIENTES_VER);
  const puedeCrear = can(usuario, PERMISOS.EXPEDIENTES_CREAR);

  const conteos = puedeVer
    ? await db.expediente.groupBy({
        by: ["estatus"],
        where: { eliminadoEn: null },
        _count: { _all: true },
      })
    : [];

  const porEstatus = new Map<string, number>(conteos.map((c:{ estatus: string; _count: { _all: number } }) => [c.estatus, c._count._all]));
  const total = conteos.reduce((suma:number, c:{ _count: { _all: number } }) => suma + c._count._all, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Hola, {usuario.nombre.split(" ")[0]}</h1>
          <p className="mt-1 text-sm text-slate-600">Este es el estado actual de los expedientes.</p>
        </div>
        {puedeCrear && (
          <BotonEnlace href="/expedientes/nuevo">
            <Icono nombre="mas" className="size-4" />
            Nuevo expediente
          </BotonEnlace>
        )}
      </div>

      {puedeVer ? (
        <section aria-label="Resumen por estatus" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <TarjetaResumen etiqueta="Total activos" valor={total} marca="bg-teal-700" href="/expedientes" />
          {ORDEN_ESTATUS.map((estatus: string) => (
            <TarjetaResumen
              key={estatus}
              etiqueta={ESTATUS[estatus].etiqueta}
              valor={porEstatus.get(estatus) ?? 0}
              marca={ESTATUS[estatus].color}
              href={`/expedientes?estatus=${estatus}`}
            />
          ))}
        </section>
      ) : (
        <p className="rounded-xl bg-white p-6 text-sm text-slate-600 ring-1 ring-slate-900/5">
          Tu rol no incluye acceso a expedientes.
        </p>
      )}
    </div>
  );
}

function TarjetaResumen({ etiqueta, valor, marca, href }: { etiqueta: string; valor: number; marca: string; href: string }) {
  return (
    <Link
      href={href}
      className="group rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5 transition hover:shadow-md hover:ring-slate-900/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800"
    >
      <span aria-hidden="true" className={`block h-1.5 w-10 rounded-full ${marca}`} />
      <p className="mt-4 text-sm font-medium text-slate-600">{etiqueta}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">{valor}</p>
      <p className="mt-3 text-xs font-medium text-teal-800 group-hover:underline">Ver expedientes</p>
    </Link>
  );
}