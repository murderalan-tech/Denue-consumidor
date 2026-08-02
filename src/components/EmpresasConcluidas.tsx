import { useState, useEffect, useCallback } from "react";
import {
  Trophy,
  Search,
  ExternalLink,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Package,
  TrendingUp,
  Users,
  Filter,
  BarChart2
} from "lucide-react";
import { Empresa, Asesor } from "../types";
import { getEmpresas, getAsesores, updateEmpresa } from "../database/dbService";

interface EmpresasConcluiSectionProps {
  onDataChange: () => void;
}

export default function EmpresasConcluidas({ onDataChange }: EmpresasConcluiSectionProps) {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [asesores, setAsesores] = useState<Asesor[]>([]);
  const [search, setSearch] = useState("");
  const [filterAsesor, setFilterAsesor] = useState<string>("todos");
  const [filterVenta, setFilterVenta] = useState<string>("todos");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editStates, setEditStates] = useState<Record<string, { ventaConcretada?: boolean; volumenPrimeraVenta?: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const [fechaInicioFilter, setFechaInicioFilter] = useState<string>("");
  const [fechaFinFilter, setFechaFinFilter] = useState<string>("");

  const loadData = useCallback(() => {
    const all = getEmpresas().filter(
      (e) => e.estatus === "prospectado" && (e.giro === "refaccionaria" || e.giro === "taller_mecanico")
    );
    setEmpresas(all);
    setAsesores(getAsesores());
    const init: Record<string, { ventaConcretada?: boolean; volumenPrimeraVenta?: string }> = {};
    all.forEach((e) => {
      init[e.id] = { ventaConcretada: e.ventaConcretada, volumenPrimeraVenta: e.volumenPrimeraVenta || "" };
    });
    setEditStates(init);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = (emp: Empresa) => {
    const state = editStates[emp.id];
    if (!state) return;
    setSavingId(emp.id);
    const updated: Empresa = {
      ...emp,
      ventaConcretada: state.ventaConcretada,
      volumenPrimeraVenta: state.volumenPrimeraVenta || "",
      fechaActualizacion: new Date().toISOString(),
    };
    updateEmpresa(updated);
    onDataChange();
    setSavedIds((prev) => new Set(prev).add(emp.id));
    setTimeout(() => setSavedIds((prev) => { const n = new Set(prev); n.delete(emp.id); return n; }), 2500);
    setSavingId(null);
    loadData();
  };

  const getAsesorName = (asesorId: string | null) => {
    if (!asesorId) return "Sin asesor";
    return asesores.find((a) => a.id === asesorId)?.nombre || "Sin asesor";
  };

  const hasChanges = (emp: Empresa) => {
    const s = editStates[emp.id];
    if (!s) return false;
    return s.ventaConcretada !== emp.ventaConcretada || (s.volumenPrimeraVenta || "") !== (emp.volumenPrimeraVenta || "");
  };

  const filtered = empresas.filter((e) => {
    const matchSearch = e.nombre.toLowerCase().includes(search.toLowerCase()) || e.direccion.toLowerCase().includes(search.toLowerCase());
    const matchAsesor = filterAsesor === "todos" || e.asesorId === filterAsesor;
    const matchVenta =
      filterVenta === "todos" ||
      (filterVenta === "con_oportunidad" && e.planOportunidadCreada === true) ||
      (filterVenta === "sin_oportunidad" && e.planOportunidadCreada === false) ||
      (filterVenta === "venta_concretada" && e.ventaConcretada === true) ||
      (filterVenta === "venta_no_concretada" && e.ventaConcretada === false);

    // Date range filter
    let matchFecha = true;
    const empFechaStr = e.planFechaFin || e.fechaActualizacion;
    if (empFechaStr) {
      const empTime = new Date(empFechaStr).getTime();
      if (fechaInicioFilter) {
        const startTime = new Date(`${fechaInicioFilter}T00:00:00`).getTime();
        if (empTime < startTime) matchFecha = false;
      }
      if (fechaFinFilter) {
        const endTime = new Date(`${fechaFinFilter}T23:59:59`).getTime();
        if (empTime > endTime) matchFecha = false;
      }
    }

    return matchSearch && matchAsesor && matchVenta && matchFecha;
  });

  const totalConcluidas = empresas.length;
  const conOportunidad = empresas.filter((e) => e.planOportunidadCreada === true).length;
  const ventasConcretadas = empresas.filter((e) => e.ventaConcretada === true).length;
  const empresasConVolumen = empresas.filter((e) => !!e.volumenPrimeraVenta?.trim()).length;

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-80px)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between pb-5 border-b border-[#EAEAEA] shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl">
            <Trophy className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-[#37352F] leading-none">Empresas Concluidas</h2>
            <p className="text-[10px] text-[#7C7B77] mt-0.5">Seguimiento post-prospección · Empresas con ciclo completado</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-5 shrink-0">
        {[
          { icon: Users, color: "purple", val: totalConcluidas, label: "Total prospectadas" },
          { icon: TrendingUp, color: "blue", val: conOportunidad, label: "Con oportunidad creada" },
          { icon: Package, color: "emerald", val: ventasConcretadas, label: "Ventas concretadas" },
          { icon: BarChart2, color: "amber", val: empresasConVolumen, label: "Con volumen registrado" },
        ].map(({ icon: Icon, color, val, label }) => (
          <div key={label} className="bg-white border border-[#EAEAEA] rounded-xl p-4 flex items-center gap-3 shadow-xs">
            <div className={`p-2 bg-${color}-50 rounded-lg`}>
              <Icon className={`w-4 h-4 text-${color}-600`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#37352F]">{val}</p>
              <p className="text-[10px] text-[#7C7B77]">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 pb-4 shrink-0">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#7C7B77]" />
          <input
            type="text"
            placeholder="Buscar empresa o dirección..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-white border border-[#EAEAEA] rounded-lg text-xs focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <Filter className="w-3.5 h-3.5 text-[#7C7B77]" />
        
        {/* Date Range Inputs */}
        <div className="flex items-center gap-1.5 bg-white border border-[#EAEAEA] rounded-lg px-2.5 py-1 text-xs">
          <span className="text-[10px] font-bold text-[#7C7B77] uppercase">Desde:</span>
          <input
            type="date"
            value={fechaInicioFilter}
            onChange={(e) => setFechaInicioFilter(e.target.value)}
            className="bg-transparent text-xs text-[#37352F] focus:outline-none cursor-pointer"
          />
          <span className="text-[10px] font-bold text-[#7C7B77] uppercase ml-1">Hasta:</span>
          <input
            type="date"
            value={fechaFinFilter}
            onChange={(e) => setFechaFinFilter(e.target.value)}
            className="bg-transparent text-xs text-[#37352F] focus:outline-none cursor-pointer"
          />
          {(fechaInicioFilter || fechaFinFilter) && (
            <button
              onClick={() => { setFechaInicioFilter(""); setFechaFinFilter(""); }}
              className="text-[10px] text-rose-600 font-bold hover:underline ml-1 cursor-pointer"
              title="Limpiar fechas"
            >
              ✕
            </button>
          )}
        </div>

        <select value={filterAsesor} onChange={(e) => setFilterAsesor(e.target.value)} className="px-3 py-2 bg-white border border-[#EAEAEA] rounded-lg text-xs focus:outline-none cursor-pointer">
          <option value="todos">Todos los asesores</option>
          {asesores.filter((a) => a.rol === "asesor").map((a) => (<option key={a.id} value={a.id}>{a.nombre}</option>))}
        </select>
        <select value={filterVenta} onChange={(e) => setFilterVenta(e.target.value)} className="px-3 py-2 bg-white border border-[#EAEAEA] rounded-lg text-xs focus:outline-none cursor-pointer">
          <option value="todos">Todos los resultados</option>
          <option value="con_oportunidad">Con oportunidad creada</option>
          <option value="sin_oportunidad">Sin oportunidad</option>
          <option value="venta_concretada">Venta concretada</option>
          <option value="venta_no_concretada">Sin venta aún</option>
        </select>
      </div>

      {/* Cards list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
        {filtered.length === 0 ? (
          <div className="py-20 text-center text-xs text-[#7C7B77] bg-white border border-[#EAEAEA] rounded-xl">
            <Trophy className="w-8 h-8 mx-auto mb-3 text-neutral-300" />
            <p className="font-semibold">No hay empresas concluidas</p>
            <p className="mt-1 text-[10px]">Cuando se complete el ciclo de prospección aparecerá aquí.</p>
          </div>
        ) : (
          filtered.map((emp) => {
            const isExpanded = expandedId === emp.id;
            const state = editStates[emp.id] || {};
            const changed = hasChanges(emp);
            const isSaved = savedIds.has(emp.id);

            return (
              <div key={emp.id} className="bg-white border border-[#EAEAEA] rounded-xl shadow-xs hover:border-neutral-300 transition-colors overflow-hidden">
                {/* Header row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : emp.id)}
                  className="w-full flex items-center justify-between p-4 text-left cursor-pointer hover:bg-[#FBFBFA] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[8px] bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded font-bold uppercase tracking-wider shrink-0">
                      {emp.giro.replace("_", " ")}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-[#37352F] truncate">{emp.nombre}</p>
                      </div>
                      <p className="text-[10px] text-[#7C7B77] truncate">{emp.direccion}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0 ml-4">
                    {/* Asesor info */}
                    <span className="text-[10px] bg-neutral-100 text-[#37352F] border border-neutral-200 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                      👤 <strong className="font-semibold">{getAsesorName(emp.asesorId)}</strong>
                    </span>

                    {/* Fecha de concluido */}
                    {(emp.planFechaFin || emp.fechaActualizacion) && (
                      <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                        📅 <span className="font-semibold">{new Date(emp.planFechaFin || emp.fechaActualizacion).toLocaleDateString("es-MX")}</span>
                      </span>
                    )}

                    {/* Volumen registrado */}
                    {emp.volumenPrimeraVenta && (
                      <span className="text-[10px] bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                        📊 Vol: <strong className="font-semibold">{emp.volumenPrimeraVenta}</strong>
                      </span>
                    )}

                    {emp.planOportunidadCreada === true ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 text-[9px] font-bold rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Oportunidad creada
                      </span>
                    ) : emp.planOportunidadCreada === false ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 text-[9px] font-bold rounded-full">
                        <XCircle className="w-3 h-3" /> Sin oportunidad
                      </span>
                    ) : null}
                    {emp.ventaConcretada === true ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold rounded-full">
                        <Package className="w-3 h-3" /> Venta concretada
                      </span>
                    ) : emp.ventaConcretada === false ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-100 text-neutral-500 border border-neutral-200 text-[9px] font-bold rounded-full">
                        Sin venta aún
                      </span>
                    ) : null}
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-[#7C7B77]" /> : <ChevronDown className="w-4 h-4 text-[#7C7B77]" />}
                  </div>
                </button>

                {/* Expanded */}
                {isExpanded && (
                  <div className="border-t border-[#F1F1EF] p-5 bg-[#FBFBFA] animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                      {/* Left: Prospecting data */}
                      <div className="space-y-4">
                        <h5 className="text-[10px] font-bold text-[#7C7B77] uppercase tracking-wider border-b border-[#EAEAEA] pb-1">Datos de prospección</h5>

                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#7C7B77]">Enlace CRM L360</p>
                          {emp.planLinkCrm360 ? (
                            <a href={emp.planLinkCrm360} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-blue-700 hover:underline font-medium break-all">
                              <ExternalLink className="w-3.5 h-3.5 shrink-0" />{emp.planLinkCrm360}
                            </a>
                          ) : <p className="text-xs text-neutral-400 italic">Sin enlace registrado</p>}
                        </div>

                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#7C7B77]">Marcas de la competencia</p>
                          {emp.marcaCompetencia ? (
                            <div className="flex flex-wrap gap-1">
                              {emp.marcaCompetencia.split(",").map((m) => m.trim()).filter(Boolean).map((m) => (
                                <span key={m} className="px-2 py-0.5 bg-neutral-100 border border-neutral-200 rounded text-[10px] font-medium">{m}</span>
                              ))}
                            </div>
                          ) : <p className="text-xs text-neutral-400 italic">Sin marcas registradas</p>}
                        </div>

                        <div className="space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#7C7B77]">¿Oportunidad comercial?</p>
                          {emp.planOportunidadCreada === true ? (
                            <div className="space-y-1.5">
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-bold"><CheckCircle2 className="w-3.5 h-3.5" /> Sí se creó</span>
                              {emp.planLinkOportunidad360 && (
                                <div>
                                  <a href={emp.planLinkOportunidad360} target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs text-blue-700 hover:underline font-medium">
                                    <ExternalLink className="w-3.5 h-3.5 shrink-0" /> Ver oportunidad en L360
                                  </a>
                                </div>
                              )}
                            </div>
                          ) : emp.planOportunidadCreada === false ? (
                            <div>
                              <span className="inline-flex items-center gap-1 text-xs text-rose-600 font-bold"><XCircle className="w-3.5 h-3.5" /> No se creó</span>
                              {emp.planMotivoNoOportunidad && (
                                <p className="text-[10px] text-rose-700 mt-1 bg-rose-50 border border-rose-100 rounded px-2 py-1">
                                  Motivo: <span className="font-semibold">{emp.planMotivoNoOportunidad}</span>
                                </p>
                              )}
                            </div>
                          ) : <p className="text-xs text-neutral-400 italic">Sin registro</p>}
                        </div>

                        {emp.planFechaInicio && (
                          <div className="flex gap-4 text-[10px] text-[#7C7B77]">
                            <span>📅 Inicio: <strong className="text-[#37352F]">{new Date(emp.planFechaInicio).toLocaleDateString("es-MX")}</strong></span>
                            {emp.planFechaFin && <span>✅ Concluido: <strong className="text-[#37352F]">{new Date(emp.planFechaFin).toLocaleDateString("es-MX")}</strong></span>}
                          </div>
                        )}
                      </div>

                      {/* Right: Post-sale */}
                      <div className="space-y-4">
                        <h5 className="text-[10px] font-bold text-[#7C7B77] uppercase tracking-wider border-b border-[#EAEAEA] pb-1">
                          Seguimiento post-prospección
                        </h5>

                        {emp.planOportunidadCreada === true ? (
                          <div className="space-y-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold uppercase tracking-wider text-[#37352F] block">¿Se concretó la venta?</label>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setEditStates((prev) => ({ ...prev, [emp.id]: { ...prev[emp.id], ventaConcretada: true } }))}
                                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${state.ventaConcretada === true ? "bg-emerald-600 text-white border-emerald-600 shadow-sm" : "bg-white text-[#37352F] border-[#EAEAEA] hover:border-emerald-300 hover:bg-emerald-50"}`}
                                >
                                  ✅ Sí
                                </button>
                                <button
                                  onClick={() => setEditStates((prev) => ({ ...prev, [emp.id]: { ...prev[emp.id], ventaConcretada: false, volumenPrimeraVenta: "" } }))}
                                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${state.ventaConcretada === false ? "bg-rose-500 text-white border-rose-500 shadow-sm" : "bg-white text-[#37352F] border-[#EAEAEA] hover:border-rose-300 hover:bg-rose-50"}`}
                                >
                                  ❌ No
                                </button>
                              </div>
                            </div>

                            {state.ventaConcretada === true && (
                              <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-[#37352F] block">Volumen de la primera venta</label>
                                <input
                                  type="text"
                                  placeholder="Ej. 24 litros, $3,200, 2 cajas..."
                                  value={state.volumenPrimeraVenta || ""}
                                  onChange={(e) => setEditStates((prev) => ({ ...prev, [emp.id]: { ...prev[emp.id], volumenPrimeraVenta: e.target.value } }))}
                                  className="w-full px-3 py-2 bg-white border border-[#EAEAEA] hover:border-[#CCCCCC] focus:border-blue-600 rounded-lg text-xs focus:outline-none transition-all"
                                />
                              </div>
                            )}

                            <button
                              onClick={() => handleSave(emp)}
                              disabled={(!changed && !isSaved) || savingId === emp.id}
                              className={`w-full py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                isSaved ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default"
                                  : changed ? "bg-blue-700 hover:bg-blue-800 text-white shadow-xs active:scale-95 cursor-pointer"
                                  : "bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200"
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {isSaved ? "Guardado ✓" : "Guardar seguimiento"}
                            </button>
                          </div>
                        ) : (
                          <div className="py-8 text-center text-[10px] text-neutral-400 bg-neutral-50 border border-dashed border-neutral-200 rounded-lg">
                            <XCircle className="w-6 h-6 mx-auto mb-2 text-neutral-300" />
                            No se registró oportunidad comercial.
                            {emp.planMotivoNoOportunidad && <p className="mt-1 font-semibold text-neutral-500">{emp.planMotivoNoOportunidad}</p>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
