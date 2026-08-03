import { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle2, 
  Clock, 
  ExternalLink,
  User,
  Download
} from 'lucide-react';
import { Empresa, Asesor, PlanTrabajo } from '../types';
import { 
  getPlanTrabajo, 
  savePlanTrabajo, 
  deletePlanTrabajoByEmpresa,
  getEmpresas,
  getAsesores
} from '../database/dbService';

interface PlanTrabajoSectionProps {
  currentUser: Asesor;
  // Triggered when any update occurs, to sync the main state in App.tsx
  onDataChange: () => void;
}

const MARCAS_OPCIONES = [
  'Mobil Americano',
  'Shell',
  'Quaker State',
  'Motul',
  'Roshfrans',
  'Valvoline',
  'Chevron',
  'Motorcraft',
  'Total',
  'Otro'
];

const MOTIVOS_NO_OPORTUNIDAD = [
  'No se encontro al encargado',
  'No Interesado',
  'No contamos con el producto necesitado'
];

export default function PlanTrabajoSection({ currentUser, onDataChange }: PlanTrabajoSectionProps) {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [activePlans, setActivePlans] = useState<PlanTrabajo[]>([]);
  const [editingPlans, setEditingPlans] = useState<Record<string, PlanTrabajo>>({});

  const isAdmin = currentUser.rol === 'administrador';
  const asesores = getAsesores();

  // Helper to calculate days in plan
  const getDaysInPlan = (fechaInicio?: string) => {
    if (!fechaInicio) return 0;
    const start = new Date(fechaInicio).getTime();
    const now = new Date().getTime();
    const diff = Math.max(0, now - start);
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  // Load companies and active plans
  const loadData = () => {
    const allEmpresas = getEmpresas();
    const allPlans = getPlanTrabajo();
    
    // Filter companies: only prospecto_real, ONLY refaccionaria or taller_mecanico, AND MUST HAVE AN ASSIGNED ADVISOR (asesorId !== null)
    let validEmpresas = allEmpresas.filter(e => 
      e.estatus === 'prospecto_real' && 
      (e.giro === 'refaccionaria' || e.giro === 'taller_mecanico') &&
      e.asesorId !== null
    );
    
    // Role filter for left column candidate companies
    if (!isAdmin) {
      validEmpresas = validEmpresas.filter(e => e.asesorId === currentUser.id);
    }
    
    setEmpresas(validEmpresas);

    // Active plans: filter plans for valid companies (if non-admin, filter by user's assigned companies)
    let filteredPlans = allPlans;
    if (!isAdmin) {
      const userEmpresaIds = new Set(validEmpresas.map(e => e.id));
      filteredPlans = allPlans.filter(p => userEmpresaIds.has(p.empresaId));
    }
    setActivePlans(filteredPlans);

    // Populate editing states
    const editStates: Record<string, PlanTrabajo> = {};
    filteredPlans.forEach(p => {
      let marcas = p.marcasCompetencia;
      if (!marcas && p.marcaCompetencia) {
        marcas = p.marcaCompetencia.split(',').map(s => s.trim()).filter(Boolean);
      }
      editStates[p.empresaId] = {
        ...p,
        marcasCompetencia: marcas || []
      };
    });
    setEditingPlans(editStates);
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  // Add a company to the active plan of work
  const handleAddToPlan = (empresaId: string) => {
    const allPlans = getPlanTrabajo();
    const existing = allPlans.find(p => p.empresaId === empresaId);
    if (existing) return;

    const newPlan: PlanTrabajo = {
      id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      empresaId,
      fechaInicio: new Date().toISOString(),
      visitado: false,
      linkCrm360: '',
      marcasCompetencia: [],
      marcaCompetencia: '',
      oportunidadCreada: false,
      linkOportunidad360: '',
      motivoNoOportunidad: '',
      cicloCompletado: false
    };

    savePlanTrabajo(newPlan);
    loadData();
    onDataChange();
  };

  // Remove a company from the active plan of work
  const handleRemoveFromPlan = (empresaId: string) => {
    deletePlanTrabajoByEmpresa(empresaId);
    loadData();
    onDataChange();
  };

  // Handle individual field edits
  const handleFieldChange = (empresaId: string, field: keyof PlanTrabajo, value: any) => {
    setEditingPlans(prev => {
      const plan = prev[empresaId] || {
        id: `plan_${Date.now()}`,
        empresaId,
        fechaInicio: new Date().toISOString(),
        visitado: false,
        linkCrm360: '',
        marcasCompetencia: [],
        marcaCompetencia: '',
        oportunidadCreada: false,
        linkOportunidad360: '',
        motivoNoOportunidad: '',
        cicloCompletado: false
      };

      return {
        ...prev,
        [empresaId]: {
          ...plan,
          [field]: value
        }
      };
    });
  };

  // Handle competitor brand checkbox toggles
  const handleBrandToggle = (empresaId: string, brand: string) => {
    setEditingPlans(prev => {
      const plan = prev[empresaId] || {
        id: `plan_${Date.now()}`,
        empresaId,
        fechaInicio: new Date().toISOString(),
        visitado: false,
        linkCrm360: '',
        marcasCompetencia: [],
        marcaCompetencia: '',
        oportunidadCreada: false,
        linkOportunidad360: '',
        motivoNoOportunidad: '',
        cicloCompletado: false
      };

      const currentBrands = plan.marcasCompetencia || [];
      const updatedBrands = currentBrands.includes(brand)
        ? currentBrands.filter(b => b !== brand)
        : [...currentBrands, brand];

      return {
        ...prev,
        [empresaId]: {
          ...plan,
          marcasCompetencia: updatedBrands,
          marcaCompetencia: updatedBrands.join(', ')
        }
      };
    });
  };

  // Save the work plan card
  const handleSavePlan = (empresaId: string, cycleReady: boolean = false) => {
    const plan = editingPlans[empresaId];
    if (!plan) return;

    if (cycleReady) {
      const confirmed = window.confirm('\u00bfYa Terminaste de Prospectar esta Empresa?\n\nAl confirmar, se concluirÃ¡ el ciclo de prospecciÃ³n y la empresa se marcarÃ¡ como PROSPECTADO.');
      if (!confirmed) return;
    }

    savePlanTrabajo(plan);
    loadData();
    onDataChange();
  };

  const getAsesorName = (empresa: Empresa) => {
    if (!empresa.asesorId) return 'No asesor';
    const found = asesores.find(a => a.id === empresa.asesorId);
    return found ? found.nombre : 'No asesor';
  };

  // Candidates for plan (validated prospects not yet added to active plan)
  const allActivePlans = getPlanTrabajo();
  const activePlanEmpresaIds = new Set(allActivePlans.map(p => p.empresaId));
  const planCandidates = empresas.filter(e => !activePlanEmpresaIds.has(e.id));

  // Export CSV function
  const handleExportCSV = () => {
    const allPlans = getPlanTrabajo();
    const allEmpresas = getEmpresas();
    const allAsesores = getAsesores();

    // --- Part 1: Active plans (in plan_trabajo collection) ---
    const exportActivePlans = isAdmin 
      ? allPlans 
      : allPlans.filter(p => {
          const emp = allEmpresas.find(e => e.id === p.empresaId);
          return emp?.asesorId === currentUser.id;
        });

    // --- Part 2: Completed companies (estatus === 'prospectado', no longer in active plans) ---
    const activePlanIds = new Set(allPlans.map(p => p.empresaId));
    let prospectadoEmpresas = allEmpresas.filter(e =>
      e.estatus === 'prospectado' &&
      (e.giro === 'refaccionaria' || e.giro === 'taller_mecanico') &&
      !activePlanIds.has(e.id)
    );
    if (!isAdmin) {
      prospectadoEmpresas = prospectadoEmpresas.filter(e => e.asesorId === currentUser.id);
    }

    // Headers
    const headers = [
      'Empresa',
      'Giro',
      'DirecciÃ³n',
      'Asesor',
      'Enlace CRM L360',
      'Marcas Competencia',
      'Â¿Oportunidad Creada?',
      'Enlace Oportunidad L360',
      'Motivo No Oportunidad',
      'Fecha Inicio (Agregado)',
      'DÃ­as en Plan',
      'Veces Agregada al Plan',
      'Ciclo',
      'Fecha Fin (Concluido)'
    ];

    // Build rows for active plans
    const activeRows = exportActivePlans.map(plan => {
      const currentPlanState = editingPlans[plan.empresaId] || plan;
      const emp = allEmpresas.find(e => e.id === plan.empresaId);
      const asesor = emp?.asesorId ? allAsesores.find(a => a.id === emp.asesorId) : null;
      const marcasArr = currentPlanState.marcasCompetencia || 
        (currentPlanState.marcaCompetencia ? currentPlanState.marcaCompetencia.split(',').map(s => s.trim()) : []);
      const marcasStr = marcasArr.join('; ');
      const fechaInicioStr = currentPlanState.fechaInicio 
        ? new Date(currentPlanState.fechaInicio).toLocaleDateString('es-MX') : '';
      const fechaFinStr = currentPlanState.fechaFin 
        ? new Date(currentPlanState.fechaFin).toLocaleDateString('es-MX') : '';
      const diasEnPlan = getDaysInPlan(currentPlanState.fechaInicio);
      const vecesAgregada = emp?.vecesAgregadoAlPlan || 1;
      const cicloStatus = currentPlanState.cicloCompletado || emp?.estatus === 'prospectado' 
        ? 'Concluido' : 'En proceso';

      return [
        `"${(emp?.nombre || '').replace(/"/g, '""')}"`,
        `"${(emp?.giro || '').replace(/_/g, ' ')}"`,
        `"${(emp?.direccion || '').replace(/"/g, '""')}"`,
        `"${(asesor?.nombre || 'Sin asesor').replace(/"/g, '""')}"`,
        `"${(currentPlanState.linkCrm360 || '').replace(/"/g, '""')}"`,
        `"${marcasStr.replace(/"/g, '""')}"`,
        currentPlanState.oportunidadCreada ? 'SÃ­' : 'No',
        `"${(currentPlanState.linkOportunidad360 || '').replace(/"/g, '""')}"`,
        `"${(currentPlanState.motivoNoOportunidad || '').replace(/"/g, '""')}"`,
        `"${fechaInicioStr}"`,
        `"${diasEnPlan}"`,
        `"${vecesAgregada}"`,
        `"${cicloStatus}"`,
        `"${fechaFinStr}"`
      ].join(',');
    });

    // Build rows for completed (prospectado) companies
    const completedRows = prospectadoEmpresas.map(emp => {
      const asesor = emp.asesorId ? allAsesores.find(a => a.id === emp.asesorId) : null;
      const marcasStr = emp.marcaCompetencia || '';
      const vecesAgregada = emp.vecesAgregadoAlPlan || 1;

      // Use historical plan fields saved when the cycle was completed
      const linkCrm = emp.planLinkCrm360 || emp.linkCrm360 || '';
      const oportunidadCreada = emp.planOportunidadCreada;
      const linkOportunidad = emp.planLinkOportunidad360 || '';
      const motivoNoOportunidad = emp.planMotivoNoOportunidad || '';
      const fechaInicioStr = emp.planFechaInicio 
        ? new Date(emp.planFechaInicio).toLocaleDateString('es-MX') : '';
      const fechaFinStr = emp.planFechaFin 
        ? new Date(emp.planFechaFin).toLocaleDateString('es-MX') 
        : (emp.fechaActualizacion ? new Date(emp.fechaActualizacion).toLocaleDateString('es-MX') : '');

      // Calculate days in plan from fechaInicio to fechaFin (or today)
      let diasEnPlan = '';
      if (emp.planFechaInicio) {
        const start = new Date(emp.planFechaInicio).getTime();
        const end = emp.planFechaFin ? new Date(emp.planFechaFin).getTime() : Date.now();
        diasEnPlan = String(Math.max(0, Math.floor((end - start) / (1000 * 60 * 60 * 24))));
      }

      return [
        `"${(emp.nombre || '').replace(/"/g, '""')}"`,
        `"${(emp.giro || '').replace(/_/g, ' ')}"`,
        `"${(emp.direccion || '').replace(/"/g, '""')}"`,
        `"${(asesor?.nombre || 'Sin asesor').replace(/"/g, '""')}"`,
        `"${linkCrm.replace(/"/g, '""')}"`,
        `"${marcasStr.replace(/"/g, '""')}"`,
        oportunidadCreada === true ? 'SÃ­' : oportunidadCreada === false ? 'No' : '',
        `"${linkOportunidad.replace(/"/g, '""')}"`,
        `"${motivoNoOportunidad.replace(/"/g, '""')}"`,
        `"${fechaInicioStr}"`,
        `"${diasEnPlan}"`,
        `"${vecesAgregada}"`,
        'Concluido',
        `"${fechaFinStr}"`
      ].join(',');
    });

    const allRows = [...activeRows, ...completedRows];
    const csvContent = '\uFEFF' + [headers.join(','), ...allRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_plan_trabajo_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-5 h-[calc(100vh-80px)] overflow-hidden">
      
      {/* Column Left: Validated Prospect list */}
      <div className="w-full lg:w-96 shrink-0 flex flex-col bg-white border border-[#EAEAEA] rounded-xl overflow-hidden shadow-sm h-full">
        <div className="p-4 border-b border-[#EAEAEA] bg-[#FBFBFA] flex items-center justify-between">
          <span className="text-xs font-bold text-[#37352F] uppercase tracking-wide">
            Prospectos Validados ({planCandidates.length})
          </span>
          <span className="text-[10px] text-[#7C7B77]">
            Por prospectar
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FBFBFA]/30 custom-scrollbar">
          {planCandidates.length === 0 ? (
            <div className="py-20 text-center text-xs text-[#7C7B77] bg-white border border-[#EAEAEA] rounded-lg">
              <ClipboardList className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
              <span>No hay prospectos validados (Refaccionarias/Talleres) listos.</span>
            </div>
          ) : (
            planCandidates.map(emp => (
              <div 
                key={emp.id}
                className="p-3 bg-white border border-[#EAEAEA] rounded-lg shadow-2xs space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <div className="flex justify-between items-start gap-1">
                    <span className="text-xs font-bold text-[#37352F]">{emp.nombre}</span>
                    <span className="text-[8px] bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.2 rounded uppercase shrink-0 font-bold">
                      {emp.giro.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#7C7B77] line-clamp-2">{emp.direccion}</p>
                  
                  {isAdmin && (
                    <div className="flex items-center gap-1 text-[9px] text-[#7C7B77] pt-1">
                      <User className="w-3 h-3 text-[#7C7B77]" />
                      <span>Asesor: {getAsesorName(emp)}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleAddToPlan(emp.id)}
                  className="w-full mt-2 py-1.5 bg-neutral-100 hover:bg-blue-50 hover:text-blue-700 text-[#37352F] rounded text-[10px] font-bold transition-all flex items-center justify-center gap-1 border border-neutral-200/60 hover:border-blue-200 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agregar al Plan
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Column Right: Active Work Plan list */}
      <div className="flex-1 flex flex-col bg-white border border-[#EAEAEA] rounded-xl overflow-hidden shadow-sm h-full">
        <div className="p-4 border-b border-[#EAEAEA] bg-[#FBFBFA] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-blue-700" />
            <h3 className="font-display font-bold text-sm text-[#37352F] uppercase tracking-wide">
              Plan de Trabajo Activo ({activePlans.length})
            </h3>
          </div>
          
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Descargar Reporte CSV
          </button>
        </div>

        {/* Work plan Cards container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-neutral-50/50 custom-scrollbar">
          {activePlans.length === 0 ? (
            <div className="py-20 text-center text-xs text-[#7C7B77] bg-white border border-[#EAEAEA] rounded-xl">
              <CheckCircle2 className="w-10 h-10 text-neutral-200 mx-auto mb-2.5" />
              <h4 className="font-bold text-sm text-[#37352F] mb-1">Plan de trabajo vacÃ­o</h4>
              <p className="max-w-xs mx-auto text-[11px]">
                Selecciona empresas validadas del panel izquierdo para agregarlas y registrar su plan de trabajo.
              </p>
            </div>
          ) : (
            activePlans.map(plan => {
              const emp = getEmpresas().find(e => e.id === plan.empresaId);
              if (!emp) return null;

              const editPlan = editingPlans[plan.empresaId] || plan;
              const isSaved = JSON.stringify(plan) === JSON.stringify(editPlan);

              // Determine if all fields are filled and cycle is ready to complete
              const crmFilled = !!editPlan.linkCrm360?.trim();
              const marcasFilled = (editPlan.marcasCompetencia && editPlan.marcasCompetencia.length > 0) || !!editPlan.marcaCompetencia?.trim();
              const opportunityDetailsFilled = editPlan.oportunidadCreada
                ? !!editPlan.linkOportunidad360?.trim()
                : !!editPlan.motivoNoOportunidad?.trim();
              const isCycleReady = editPlan.visitado && crmFilled && marcasFilled && opportunityDetailsFilled;

              return (
                <div 
                  key={plan.id}
                  className="bg-white border border-[#EAEAEA] rounded-xl shadow-xs p-5 space-y-4 hover:border-neutral-300 transition-colors relative"
                >
                  {/* Status Indicator Pill */}
                  <div className="absolute top-5 right-5 flex items-center gap-1.5">
                    {plan.cicloCompletado ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-250 text-[9px] font-bold rounded-full uppercase">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Ciclo Completado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-neutral-100 text-neutral-600 border border-neutral-200 text-[9px] font-bold rounded-full uppercase">
                        <Clock className="w-3 h-3 text-neutral-500" />
                        En Seguimiento
                      </span>
                    )}

                    {/* Trash remove button */}
                    <button 
                      onClick={() => handleRemoveFromPlan(emp.id)}
                      className="p-1 hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-100 rounded text-neutral-400 transition-all cursor-pointer"
                      title="Quitar del plan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Card Title Header */}
                  <div className="space-y-1 pr-32">
                    <span className="text-[9px] bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                      {emp.giro.replace('_', ' ')}
                    </span>
                    <h4 className="font-display font-bold text-sm text-[#37352F] mt-1.5">{emp.nombre}</h4>
                    <p className="text-[10px] text-[#7C7B77]">{emp.direccion}</p>
                    
                    {/* Fecha de inicio, dÃ­as transcurridos y veces agregada al plan */}
                    {editPlan.fechaInicio && (
                      <div className="flex flex-wrap items-center gap-2.5 text-[10px] text-neutral-500 font-medium pt-1">
                        <span>ðŸ“… Agregado al plan: <strong className="text-neutral-700">{new Date(editPlan.fechaInicio).toLocaleDateString('es-MX')}</strong></span>
                        
                        {(() => {
                          const days = getDaysInPlan(editPlan.fechaInicio);
                          const isOverOneWeek = days >= 7;
                          return (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold border transition-colors ${
                              isOverOneWeek
                                ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                                : 'bg-blue-50 text-blue-700 border-blue-100'
                            }`}>
                              â³ {days} {days === 1 ? 'dÃ­a' : 'dÃ­as'} en plan
                            </span>
                          );
                        })()}

                        <span className="inline-flex items-center px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-bold">
                          ðŸ”„ {emp.vecesAgregadoAlPlan || 1} {(!emp.vecesAgregadoAlPlan || emp.vecesAgregadoAlPlan === 1) ? 'vez agregada' : 'veces agregada'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Plan Inputs Grid Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-[#F1F1EF]">
                    
                    {/* Column Left Inputs */}
                    <div className="space-y-3.5">
                      
                      {/* Visit Checkbox */}
                      <label className="flex items-center gap-2.5 p-2 bg-[#F7F7F5] border border-[#EAEAEA] rounded-lg cursor-pointer hover:bg-neutral-100/80 transition-colors select-none">
                        <input
                          type="checkbox"
                          checked={editPlan.visitado}
                          onChange={(e) => handleFieldChange(emp.id, 'visitado', e.target.checked)}
                          className="w-4 h-4 rounded border-[#CCCCCC] text-blue-700 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-xs font-semibold text-[#37352F]">
                          Establecimiento Visitado
                        </span>
                      </label>

                      {/* CRM Link URL */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[#7C7B77] block">
                          Enlace CRM L360
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="https://crm360.alchisa.com/lead/..."
                            value={editPlan.linkCrm360 || ''}
                            onChange={(e) => handleFieldChange(emp.id, 'linkCrm360', e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-[#EAEAEA] hover:border-[#CCCCCC] focus:border-blue-600 rounded-lg text-xs focus:outline-none transition-all pr-8"
                          />
                          {editPlan.linkCrm360 && (
                            <a 
                              href={editPlan.linkCrm360} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-blue-700"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Competitor Brand Checkboxes */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[#7C7B77] block">
                          Marcas de la Competencia en Sitio
                        </label>
                        <div className="grid grid-cols-2 gap-1.5 p-2 bg-[#F9F9F8] border border-[#EAEAEA] rounded-lg max-h-36 overflow-y-auto custom-scrollbar">
                          {MARCAS_OPCIONES.map(brand => {
                            const isChecked = (editPlan.marcasCompetencia || []).includes(brand);
                            return (
                              <label key={brand} className="flex items-center gap-1.5 text-[11px] text-[#37352F] cursor-pointer hover:bg-neutral-200/50 p-1 rounded transition-colors select-none">
                                <input 
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleBrandToggle(emp.id, brand)}
                                  className="w-3.5 h-3.5 rounded border-neutral-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="truncate">{brand}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                    </div>

                    {/* Column Right Inputs: Opportunity creation */}
                    <div className="space-y-3 bg-[#FBFBFA]/50 border border-[#EAEAEA] p-3.5 rounded-xl">
                      
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C7B77] block">
                          Â¿Se creÃ³ oportunidad comercial?
                        </span>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleFieldChange(emp.id, 'oportunidadCreada', true)}
                            className={`py-1.5 px-3 border rounded-lg text-xs font-semibold transition-all ${
                              editPlan.oportunidadCreada
                                ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold'
                                : 'bg-white border-[#EAEAEA] text-[#7C7B77] hover:bg-[#F1F1EF]'
                            }`}
                          >
                            SÃ­, se creÃ³
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFieldChange(emp.id, 'oportunidadCreada', false)}
                            className={`py-1.5 px-3 border rounded-lg text-xs font-semibold transition-all ${
                              !editPlan.oportunidadCreada
                                ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold'
                                : 'bg-white border-[#EAEAEA] text-[#7C7B77] hover:bg-[#F1F1EF]'
                            }`}
                          >
                            No se creÃ³
                          </button>
                        </div>
                      </div>

                      {/* Conditional Link of Opportunity 360 */}
                      {editPlan.oportunidadCreada ? (
                        <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-[#7C7B77] block">
                            Enlace Oportunidad L360
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="https://crm360.alchisa.com/opportunity/..."
                              value={editPlan.linkOportunidad360 || ''}
                              onChange={(e) => handleFieldChange(emp.id, 'linkOportunidad360', e.target.value)}
                              className="w-full px-3 py-1.5 bg-white border border-[#EAEAEA] hover:border-[#CCCCCC] focus:border-blue-600 rounded-lg text-xs focus:outline-none pr-8"
                            />
                            {editPlan.linkOportunidad360 && (
                              <a 
                                href={editPlan.linkOportunidad360} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-blue-700"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      ) : (
                        // Conditional Motivo no oportunidad Select Dropdown
                        <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-[#7C7B77] block">
                            Motivo por el cual no se creÃ³
                          </label>
                          <select
                            value={editPlan.motivoNoOportunidad || ''}
                            onChange={(e) => handleFieldChange(emp.id, 'motivoNoOportunidad', e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-[#EAEAEA] hover:border-[#CCCCCC] focus:border-blue-600 rounded-lg text-xs focus:outline-none cursor-pointer"
                          >
                            <option value="">-- Seleccionar motivo --</option>
                            {MOTIVOS_NO_OPORTUNIDAD.map(motivo => (
                              <option key={motivo} value={motivo}>{motivo}</option>
                            ))}
                          </select>
                          {editPlan.motivoNoOportunidad === 'No se encontro al encargado' && (
                            <p className="text-[9px] text-amber-600 font-medium pt-1">
                              * Al guardar, la empresa regresarÃ¡ a la lista de prospectos validados identificando que ya fue visitada.
                            </p>
                          )}
                        </div>
                      )}

                    </div>

                  </div>

                  {/* Save changes triggers */}
                  <div className="flex justify-end pt-3 border-t border-[#F1F1EF]">
                    <button
                      onClick={() => handleSavePlan(emp.id, isCycleReady)}
                      disabled={isSaved && !isCycleReady}
                      className={`px-4 py-1.8 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-2xs ${
                        isCycleReady
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-95 ring-2 ring-emerald-300 ring-offset-1 animate-pulse'
                          : isSaved
                            ? 'bg-neutral-100 text-[#7C7B77] cursor-default border border-neutral-200'
                            : 'bg-blue-700 hover:bg-blue-800 text-white cursor-pointer active:scale-95'
                      }`}
                    >
                      {isCycleReady ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Concluir Ciclo
                        </>
                      ) : isSaved ? (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          Seguimiento Guardado
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          Guardar Seguimiento
                        </>
                      )}
                    </button>
                  </div>

                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
