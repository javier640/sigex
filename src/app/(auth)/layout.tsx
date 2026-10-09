import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-100 px-4 py-10 text-slate-900">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-900/5 md:grid-cols-2">
        <aside className="hidden flex-col justify-between gap-10 bg-teal-900 p-10 text-teal-50 md:flex">
          <div>
            <p className="text-sm font-medium text-teal-200">Sistema Integral de Gestión de Expedientes</p>
            <p className="mt-1 text-4xl font-bold tracking-tight">SIGEX</p>
          </div>

          <PilaDeExpedientes />

          <p className="max-w-xs text-sm leading-relaxed text-teal-100">
            Cada alta, edición y cambio de estatus queda registrado con su autor y su fecha.
          </p>
        </aside>

        <section className="p-8 sm:p-12">
          <div className="mb-8 md:hidden">
            <p className="text-2xl font-bold tracking-tight text-teal-900">SIGEX</p>
            <p className="text-sm text-slate-600">Sistema Integral de Gestión de Expedientes</p>
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}

function PilaDeExpedientes() {
  const carpetas = [
    { posicion: "top-0 left-0", pestana: "bg-amber-400", cuerpo: "bg-amber-300" },
    { posicion: "top-7 left-8", pestana: "bg-amber-300", cuerpo: "bg-amber-200" },
    { posicion: "top-14 left-16", pestana: "bg-amber-200", cuerpo: "bg-amber-100" },
  ];

  return (
    <div aria-hidden="true" className="relative h-44">
      {carpetas.map((c, i) => (
        <div key={i} className={`absolute ${c.posicion}`}>
          <div className={`h-4 w-16 rounded-t-md ${c.pestana}`} />
          <div className={`h-28 w-60 space-y-2.5 rounded-tr-md rounded-b-md p-4 shadow-lg shadow-teal-950/30 ${c.cuerpo}`}>
            <div className="h-1.5 w-24 rounded-full bg-amber-900/25" />
            <div className="h-1.5 w-40 rounded-full bg-amber-900/15" />
            <div className="h-1.5 w-32 rounded-full bg-amber-900/15" />
          </div>
        </div>
      ))}
    </div>
  );
}