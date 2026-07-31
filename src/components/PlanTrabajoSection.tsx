import { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle2, 
  Clock, 
  ExternalLink,
  User
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

export default function PlanTrabajoSection({ currentUser, onDataChange }: PlanTrabajoSectionProps) {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [activePlans, setActivePlans] = useState<PlanTrabajo[]>([]);
  const [editingPlans, setEditingPlans] = useState<Record<string, PlanTrabajo>>({});

  const isAdmin = currentUser.rol === 'administrador';
  const asesores = getAsesores();

  // Load companies and active plans
  const loadData = () => {
    const allEmpresas = getEmpresas();
    const allPlans = getPlanTrabajo();
    
    // Filter companies: only prospecto_validado
    let validEmpresas = allEmpresas.filter(e => e.estatus === 'prospecto_validado');
    
    // Role filter
    if (!isAdmin) {
      validEmpresas = validEmpresas.filter(e => e.asesorId === currentUser.id);
    }
    
    setEmpresas(validEmpresas);

    // Filter plans that correspond to these valid companies
    const validEmpresasIds = new Set(validEmpresas.map(e => e.id));
    const filteredPlans = allPlans.filter(p => validEmpresasIds.has(p.empresaId));
    setActivePlans(filteredPlans);

    // Populate editing states
    const editStates: Record<string, PlanTrabajo> = {};
    filteredPlans.forEach(p => {
      editStates[p.empresaId] = { ...p };
    });
    setEditingPlans(editStates);
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  // Add a company to the active plan of work
  const handleAddToPlan = (empresaId: string) => {
    const existing = activePlans.find(p => p.empresaId === empresaId);
    if (existing) return;

    const newPlan: PlanTrabajo = {
      id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      empresaId,
      visitado: false,
      linkCrm360: '',
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
        visitado: false,
        linkCrm360: '',
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

  // Save the work plan card
  const handleSavePlan = (empresaId: string) => {
    const plan = editingPlans[empresaId];
    if (plan) {
      savePlanTrabajo(plan);
      loadData();
      onDataChange();
    }
  };

  const getAsesorName = (empresa: Empresa) => {
    if (!empresa.asesorId) return 'No asesor';
    const found = asesores.find(a => a.id === empresa.asesorId);
    return found ? found.nombre : 'No asesor';
  };

  // Candidates for plan (validated prospects not yet added to active plan)
  const activePlanEmpresaIds = new Set(activePlans.map(p => p.empresaId));
  const planCandidates = empresas.filter(e => !activePlanEmpresaIds.has(e.id));

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
              <span>No hay prospectos validados listos para prospección.</span>
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
          <span className="text-[10px] text-[#7C7B77]">
            Registra el avance y oportunidades
          </span>
        </div>

        {/* Work plan Cards container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-neutral-50/50 custom-scrollbar">
          {activePlans.length === 0 ? (
            <div className="py-20 text-center text-xs text-[#7C7B77] bg-white border border-[#EAEAEA] rounded-xl">
              <CheckCircle2 className="w-10 h-10 text-neutral-200 mx-auto mb-2.5" />
              <h4 className="font-bold text-sm text-[#37352F] mb-1">Plan de trabajo vacío</h4>
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
                          className="w-4 h-4 rounded border-[#CCCCCC] text-blue-700 focus:ring-blue-500"
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

                      {/* Competitor Brand */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[#7C7B77] block">
                          Marca de la Competencia en Sitio
                        </label>
                        <input
                          type="text"
                          placeholder="Ej. Roshfrans, Castrol, Chevron..."
                          value={editPlan.marcaCompetencia || ''}
                          onChange={(e) => handleFieldChange(emp.id, 'marcaCompetencia', e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-[#EAEAEA] hover:border-[#CCCCCC] focus:border-blue-600 rounded-lg text-xs focus:outline-none transition-all"
                        />
                      </div>

                    </div>

                    {/* Column Right Inputs: Opportunity creation */}
                    <div className="space-y-3 bg-[#FBFBFA]/50 border border-[#EAEAEA] p-3.5 rounded-xl">
                      
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C7B77] block">
                          ¿Se creó oportunidad comercial?
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
                            Sí, se creó
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
                            No se creó
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
                        // Conditional Motivo no oportunidad
                        <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-[#7C7B77] block">
                            Motivo por el cual no se creó
                          </label>
                          <textarea
                            placeholder="Describa el motivo..."
                            rows={2}
                            value={editPlan.motivoNoOportunidad || ''}
                            onChange={(e) => handleFieldChange(emp.id, 'motivoNoOportunidad', e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-[#EAEAEA] hover:border-[#CCCCCC] focus:border-blue-600 rounded-lg text-xs focus:outline-none resize-none"
                          />
                        </div>
                      )}

                    </div>

                  </div>

                  {/* Save changes triggers */}
                  <div className="flex justify-end pt-3 border-t border-[#F1F1EF]">
                    <button
                      onClick={() => handleSavePlan(emp.id)}
                      disabled={isSaved}
                      className={`px-4 py-1.8 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-2xs ${
                        isSaved 
                          ? 'bg-neutral-100 text-[#7C7B77] cursor-default border border-neutral-200' 
                          : 'bg-blue-700 hover:bg-blue-800 text-white cursor-pointer active:scale-95'
                      }`}
                    >
                      <Save className="w-3.5 h-3.5" />
                      {isSaved ? 'Seguimiento Guardado' : 'Guardar Seguimiento'}
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
