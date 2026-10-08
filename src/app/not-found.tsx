import { BotonEnlace } from "@/components/ui/boton-enlace";

export default function NoEncontrado() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-100 px-4 text-slate-900">
      <div className="text-center">
        <p className="text-sm font-semibold tracking-wide text-teal-800">ERROR 404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">No encontramos esta página</h1>
        <p className="mt-2 text-sm text-slate-600">La dirección no existe o el contenido ya no está disponible.</p>
        <BotonEnlace href="/dashboard" className="mt-6">
          Ir al inicio
        </BotonEnlace>
      </div>
    </main>
  );
}