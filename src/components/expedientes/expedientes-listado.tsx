"use client";

/**
 * Listado interactivo de expedientes.
 *
 *  - Filtros en estado local; la búsqueda pasa por useDebounce.
 *  - Los datos llegan de GET /api/expedientes mediante useExpedientes.
 *  - Los filtros se reflejan en la URL para poder compartir o recargar
 *    la vista (y para que los enlaces del dashboard ?estatus=... funcionen).
 *  - Los botones dependen de permisos: puedeEditarExpediente y <Can>.
 *    Ocultarlos es solo interfaz; las acciones validan en el servidor.
 */
import Link from "next/link";
import { useEffect, useState } from "react";
import type { EstatusExpediente } from "@prisma/client";
import { useDebounce } from "@/hooks/use-debounce";
import { useExpedientes } from "@/hooks/use-expedientes";
import { useSession } from "@/hooks/use-session";
import { PERMISOS, puedeEditarExpediente } from "@/lib/permissions";
import { ESTATUS, ORDEN_ESTATUS, PRIORIDAD } from "@/lib/catalogos";
import { formatearFecha } from "@/lib/formato";
import { Can } from "@/components/auth/can";
import { Alerta } from "@/components/ui/alerta";
import { CampoFormulario } from "@/components/ui/campo-formulario";
import { CampoSelect } from "@/components/ui/campo-select";
import { Enlace } from "@/components/ui/enlace";
import { Insignia } from "@/components/ui/insignia";
import { Paginacion } from "@/components/ui/paginacion";
import { BotonEliminarExpediente } from "@/components/expedientes/boton-eliminar-expediente";
import { usePermission } from "@/hooks/use-permission";
type Props = {
  filtrosIniciales: { pagina: number; busqueda: string; estatus: EstatusExpediente | ""; mios: boolean };
};

export function ExpedientesListado({ filtrosIniciales }: Props) {
  const { usuario } = useSession();

  const [textoBusqueda, setTextoBusqueda] = useState(filtrosIniciales.busqueda);
  const [estatus, setEstatus] = useState<EstatusExpediente | "">(filtrosIniciales.estatus);
  const [soloMios, setSoloMios] = useState(filtrosIniciales.mios);

  // Solo aplica si el usuario puede crear expedientes (si no, no tiene "propios")
  const puedeCrear = usePermission(PERMISOS.EXPEDIENTES_CREAR);
  const mios = soloMios && puedeCrear;
  const busqueda = useDebounce(textoBusqueda.trim());

  // La página vuelve a 1 cuando cambian los filtros. Se guarda junto con
  // la combinación de filtros a la que pertenece: si esa combinación ya no
  // es la actual, la página vigente es 1 (sin efectos ni renders extra).
  const claveFiltros = `${busqueda}|${estatus}|${mios}`;
  const [paginacion, setPaginacion] = useState({ pagina: filtrosIniciales.pagina, claveFiltros });
  const pagina = paginacion.claveFiltros === claveFiltros ? paginacion.pagina : 1;

  const { datos, cargando, error, recargar } = useExpedientes({ pagina, busqueda, estatus, mios });

  // Reflejar filtros en la URL sin provocar una navegación
  useEffect(() => {
    const parametros = new URLSearchParams();
    if (busqueda) parametros.set("busqueda", busqueda);
    if (estatus) parametros.set("estatus", estatus);
    if (mios) parametros.set("mios", "1");
    if (pagina > 1) parametros.set("pagina", String(pagina));
    const consulta = parametros.toString();
    window.history.replaceState(null, "", consulta ? `?${consulta}` : window.location.pathname);
  }, [busqueda, estatus, mios, pagina]);

  const expedientes = datos?.datos ?? [];
  const hayFiltros = Boolean(busqueda || estatus || mios);

  return (
    <div className="space-y-4">
      {/* Filtros: no es un <form> que se envíe; cada cambio actualiza el listado */}
      <div role="search" className="grid gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5 sm:grid-cols-4 sm:items-end">
        <div className="sm:col-span-2">
          <CampoFormulario
            id="busqueda"
            label="Buscar"
            type="search"
            placeholder="Folio, título o solicitante"
            value={textoBusqueda}
            onChange={(e) => setTextoBusqueda(e.target.value)}
          />
        </div>
        <CampoSelect
          id="estatus"
          label="Estatus"
          value={estatus}
          onChange={(e) => setEstatus(e.target.value as EstatusExpediente | "")}
        >
          <option value="">Todos</option>
          {ORDEN_ESTATUS.map((e) => (
            <option key={e} value={e}>
              {ESTATUS[e].etiqueta}
            </option>
          ))}
        </CampoSelect>
        <Can permiso={PERMISOS.EXPEDIENTES_CREAR}>
          <CampoSelect
            id="mios"
            label="Mostrar"
            value={soloMios ? "mios" : ""}
            onChange={(e) => setSoloMios(e.target.value === "mios")}
          >
            <option value="">Todos</option>
            <option value="mios">Solo los míos</option>
          </CampoSelect>
        </Can>
      </div>

      {error && (
        <Alerta variante="error">
          {error}{" "}
          <button type="button" onClick={recargar} className="font-semibold underline underline-offset-2">
            Reintentar
          </button>
        </Alerta>
      )}

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-900/5">
        {!datos && cargando ? (
          <EsqueletoTabla />
        ) : expedientes.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-slate-600">
            {hayFiltros ? "No hay expedientes que coincidan con los filtros." : "Todavía no hay expedientes."}
          </p>
        ) : (
          <div
            aria-busy={cargando}
            className={`overflow-x-auto transition-opacity ${cargando ? "opacity-60" : "opacity-100"}`}
          >
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold tracking-wide text-slate-600 uppercase">
                <tr>
                  <th scope="col" className="px-5 py-3">Folio</th>
                  <th scope="col" className="px-5 py-3">Expediente</th>
                  <th scope="col" className="px-5 py-3">Estatus</th>
                  <th scope="col" className="px-5 py-3">Prioridad</th>
                  <th scope="col" className="px-5 py-3">Alta</th>
                  <th scope="col" className="px-5 py-3 text-right">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expedientes.map((exp) => (
                  <tr key={exp.id} className="align-top">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <Link
                        href={`/expedientes/${exp.id}`}
                        className="rounded font-mono text-xs font-semibold text-teal-800 hover:underline focus-visible:outline-2 focus-visible:outline-teal-800"
                      >
                        {exp.folio}
                      </Link>
                    </td>
                    <td className="max-w-xs px-5 py-4">
                      <p className="font-medium text-slate-900">{exp.titulo}</p>
                      <p className="text-slate-500">{exp.solicitante}</p>
                    </td>
                    <td className="px-5 py-4">
                      <Insignia colores={ESTATUS[exp.estatus].insignia}>{ESTATUS[exp.estatus].etiqueta}</Insignia>
                    </td>
                    <td className="px-5 py-4">
                      <Insignia colores={PRIORIDAD[exp.prioridad].insignia}>{PRIORIDAD[exp.prioridad].etiqueta}</Insignia>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-600">
                      <p>{formatearFecha(exp.creadoEn)}</p>
                      <p className="text-xs text-slate-500">{exp.creadoPor}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-start justify-end gap-3">
                        <Enlace href={`/expedientes/${exp.id}`} className="py-1.5 text-xs">
                          Ver
                        </Enlace>
                        {puedeEditarExpediente(usuario, exp) && (
                          <Enlace href={`/expedientes/${exp.id}/editar`} className="py-1.5 text-xs">
                            Editar
                          </Enlace>
                        )}
                        <Can permiso={PERMISOS.EXPEDIENTES_ELIMINAR}>
                          <BotonEliminarExpediente expedienteId={exp.id} folio={exp.folio} alEliminar={recargar} />
                        </Can>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {datos && datos.paginacion.total > 0 && (
          <div className="border-t border-slate-200 px-5 py-3">
            <Paginacion
              pagina={datos.paginacion.pagina}
              totalPaginas={datos.paginacion.totalPaginas}
              total={datos.paginacion.total}
              deshabilitado={cargando}
              onCambiar={(nueva) => setPaginacion({ pagina: nueva, claveFiltros })}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function EsqueletoTabla() {
  return (
    <div role="status" className="animate-pulse space-y-3 p-5 motion-reduce:animate-none">
      <span className="sr-only">Cargando expedientes…</span>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="h-10 rounded-lg bg-slate-100" />
      ))}
    </div>
  );
}