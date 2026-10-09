"use client";


import Link from "next/link";
import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { parametrosBitacora, useBitacora, type FiltrosBitacoraCliente } from "@/hooks/use-bitacora";
import { ACCIONES_BITACORA, type AccionBitacora } from "@/lib/validations/bitacora";
import { ACCION_BITACORA } from "@/lib/catalogos";
import { formatearFechaHora } from "@/lib/formato";
import { Alerta } from "@/components/ui/alerta";
import { CampoFormulario } from "@/components/ui/campo-formulario";
import { CampoSelect } from "@/components/ui/campo-select";
import { Insignia } from "@/components/ui/insignia";
import { Paginacion } from "@/components/ui/paginacion";
import { CambiosRegistro } from "@/components/bitacora/cambios-registro";

type Props = {
  usuarios: { id: number; nombre: string; activo: boolean }[];
  filtrosIniciales: FiltrosBitacoraCliente;
};

export function BitacoraListado({ usuarios, filtrosIniciales }: Props) {
  const [usuarioId, setUsuarioId] = useState(filtrosIniciales.usuarioId);
  const [accion, setAccion] = useState<AccionBitacora | "">(filtrosIniciales.accion);
  const [desde, setDesde] = useState(filtrosIniciales.desde);
  const [hasta, setHasta] = useState(filtrosIniciales.hasta);
  const [textoExpediente, setTextoExpediente] = useState(filtrosIniciales.expediente);
  const expediente = useDebounce(textoExpediente.trim());

  const claveFiltros = [usuarioId, accion, desde, hasta, expediente].join("|");
  const [paginacion, setPaginacion] = useState({ pagina: filtrosIniciales.pagina, claveFiltros });
  const pagina = paginacion.claveFiltros === claveFiltros ? paginacion.pagina : 1;

  const filtros: FiltrosBitacoraCliente = { pagina, usuarioId, accion, expediente, desde, hasta };
  const { datos, cargando, error, recargar } = useBitacora(filtros);

  const consulta = parametrosBitacora(filtros).toString();
  useEffect(() => {
    window.history.replaceState(null, "", consulta ? `?${consulta}` : window.location.pathname);
  }, [consulta]);

  const hayFiltros = Boolean(usuarioId || accion || desde || hasta || expediente);
  const registros = datos?.datos ?? [];

  function limpiarFiltros() {
    setUsuarioId("");
    setAccion("");
    setDesde("");
    setHasta("");
    setTextoExpediente("");
  }

  return (
    <div className="space-y-4">
      <div role="search" className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
          <CampoSelect id="usuarioId" label="Usuario" value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)}>
            <option value="">Todos</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre}
                {u.activo ? "" : " (inactivo)"}
              </option>
            ))}
          </CampoSelect>
          <CampoSelect
            id="accion"
            label="Acción"
            value={accion}
            onChange={(e) => setAccion(e.target.value as AccionBitacora | "")}
          >
            <option value="">Todas</option>
            {ACCIONES_BITACORA.map((a) => (
              <option key={a} value={a}>
                {ACCION_BITACORA[a].etiqueta}
              </option>
            ))}
          </CampoSelect>
          <CampoFormulario
            id="desde"
            label="Desde"
            type="date"
            value={desde}
            max={hasta || undefined}
            onChange={(e) => setDesde(e.target.value)}
          />
          <CampoFormulario
            id="hasta"
            label="Hasta"
            type="date"
            value={hasta}
            min={desde || undefined}
            onChange={(e) => setHasta(e.target.value)}
          />
          <CampoFormulario
            id="expediente"
            label="Expediente"
            type="search"
            placeholder="Folio"
            value={textoExpediente}
            onChange={(e) => setTextoExpediente(e.target.value)}
          />
        </div>
        {hayFiltros && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={limpiarFiltros}
              className="rounded text-sm font-medium text-teal-800 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800"
            >
              Limpiar filtros
            </button>
          </div>
        )}
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
          <div role="status" className="animate-pulse space-y-3 p-5 motion-reduce:animate-none">
            <span className="sr-only">Cargando bitácora…</span>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : registros.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-slate-600">
            {hayFiltros ? "No hay registros que coincidan con los filtros." : "Todavía no hay registros en la bitácora."}
          </p>
        ) : (
          <ol aria-busy={cargando} className={`divide-y divide-slate-100 transition-opacity ${cargando ? "opacity-60" : ""}`}>
            {registros.map((r) => (
              <li key={r.id} className="grid gap-4 px-5 py-4 sm:grid-cols-3">
                <div className="space-y-1.5 text-sm">
                  <Insignia colores={ACCION_BITACORA[r.accion].insignia}>{ACCION_BITACORA[r.accion].etiqueta}</Insignia>
                  <p className="font-medium text-slate-900">
                    {r.expediente ? (
                      r.expediente.activo ? (
                        <Link
                          href={`/expedientes/${r.expediente.id}`}
                          className="rounded font-mono text-xs text-teal-800 hover:underline focus-visible:outline-2 focus-visible:outline-teal-800"
                        >
                          {r.expediente.folio}
                        </Link>
                      ) : (
                        <span className="font-mono text-xs text-slate-500">
                          {r.expediente.folio} <span className="font-sans">(dado de baja)</span>
                        </span>
                      )
                    ) : (
                      <span className="text-slate-400">Expediente no disponible</span>
                    )}
                  </p>
                  <p className="text-slate-700">{r.usuario?.nombre ?? "Sistema"}</p>
                  <p className="text-xs text-slate-500">
                    <time dateTime={r.creadoEn}>{formatearFechaHora(r.creadoEn)}</time>
                    {r.ip && <span> · IP {r.ip}</span>}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <CambiosRegistro registro={r} />
                </div>
              </li>
            ))}
          </ol>
        )}

        {datos && datos.paginacion.total > 0 && (
          <div className="border-t border-slate-200 px-5 py-3">
            <Paginacion
              pagina={datos.paginacion.pagina}
              totalPaginas={datos.paginacion.totalPaginas}
              total={datos.paginacion.total}
              deshabilitado={cargando}
              etiqueta={{ singular: "registro", plural: "registros" }}
              onCambiar={(nueva) => setPaginacion({ pagina: nueva, claveFiltros })}
            />
          </div>
        )}
      </div>
    </div>
  );
}