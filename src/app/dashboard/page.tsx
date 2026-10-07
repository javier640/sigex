/**
 * TEMPORAL: solo para probar login y logout.
 * Se reemplazará por el dashboard real (resumen por estatus) y el
 * botón de logout se moverá al menú lateral del layout (app).
 */
import { requerirSesion } from "@/lib/guards";
import { LogoutButton } from "@/components/auth/logout-button";

export default async function DashboardPage() {
  const { usuario, expiraEn } = await requerirSesion();

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Hola, {usuario.nombre}</h1>
          <p className="text-sm text-gray-600">
            {usuario.email} · Rol: {usuario.rol}
          </p>
        </div>
        <LogoutButton />
      </div>

      <section>
        <h2 className="mb-2 font-medium">Permisos de esta sesión</h2>
        <ul className="list-inside list-disc text-sm">
          {usuario.permisos.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-gray-500">Sesión válida hasta: {expiraEn.toLocaleString("es-MX")}</p>
    </main>
  );
}