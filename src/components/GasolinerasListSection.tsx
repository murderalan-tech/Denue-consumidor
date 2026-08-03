import { useState, useEffect } from 'react';
import { 
  Fuel, 
  Search, 
  ExternalLink, 
  Save, 
  CheckCircle2, 
  User, 
  Building2, 
  MessageSquare, 
  Link2 
} from 'lucide-react';
import { Empresa, Asesor } from '../types';
import { getAsesores, updateEmpresa, savePlanTrabajo, getPlanTrabajo } from '../database/dbService';

interface GasolinerasListSectionProps {
  empresas: Empresa[];
  currentUser: Asesor;
  onSelectEmpresa?: (empresa: Empresa) => void;
  onDataChange?: () => void;
}

interface GroupState {
  estatus: 'prospecto_real' | 'no_ligado_estrategia';
  asesorId: string | null;
  linkCrm360: string;
  comentariosNoAplica: string;
  isSaved?: boolean;
}

export default function GasolinerasListSection({ empresas, currentUser, onDataChange }: GasolinerasListSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'prospecto_real' | 'no_ligado_estrategia'>('all');
  const [asesorFilter, setAsesorFilter] = useState('all');

  const asesores = getAsesores().filter(a => a.rol === 'asesor');
  const isAdmin = currentUser.rol === 'administrador';

  // 1. Group gas stations by Corporate Group name
  const gasolineras = empresas.filter(e => e.giro === 'gasolinera');

  // Map of groupName -> list of station Empresas
  const groupsMap: Record<string, Empresa[]> = {};
  gasolineras.forEach(gas => {
    const grp = gas.grupoGasolinero?.trim() || 'Independiente / Otro';
    if (!groupsMap[grp]) {
      groupsMap[grp] = [];
    }
    groupsMap[grp].push(gas);
  });

  // Local state for each group's editable fields
  const [editingGroups, setEditingGroups] = useState<Record<string, GroupState>>({});

  // Initialize group state from database values
  useEffect(() => {
    const initialStates: Record<string, GroupState> = {};
    Object.entries(groupsMap).forEach(([groupName, stations]) => {
      const first = stations[0];
      // Default to 'prospecto_real' or 'no_ligado_estrategia'
      let defaultStatus: 'prospecto_real' | 'no_ligado_estrategia' = 'prospecto_real';
      if (first?.estatus === 'no_ligado_estrategia') {
        defaultStatus = 'no_ligado_estrategia';
      } else if (stations.some(s => s.estatus === 'prospecto_real')) {
        defaultStatus = 'prospecto_real';
      }

      initialStates[groupName] = {
        estatus: defaultStatus,
        asesorId: first?.asesorId || null,
        linkCrm360: first?.linkCrm360 || '',
        comentariosNoAplica: first?.comentariosNoAplica || '',
        isSaved: true
      };
    });
    setEditingGroups(initialStates);
  }, [empresas]);

  const handleFieldChange = (groupName: string, field: keyof GroupState, value: any) => {
    setEditingGroups(prev => ({
      ...prev,
      [groupName]: {
        ...prev[groupName],
        [field]: value,
        isSaved: false
      }
    }));
  };

  // Save changes to all stations in the group
  const handleSaveGroup = (groupName: string) => {
    const groupState = editingGroups[groupName];
    if (!groupState) return;

    const stations = groupsMap[groupName] || [];
    stations.forEach(station => {
      const updatedStation: Empresa = {
        ...station,
        estatus: groupState.estatus,
        asesorId: groupState.asesorId,
        linkCrm360: groupState.estatus === 'prospecto_real' ? groupState.linkCrm360.trim() : '',
        comentariosNoAplica: groupState.estatus === 'no_ligado_estrategia' ? groupState.comentariosNoAplica.trim() : '',
        fechaActualizacion: new Date().toISOString()
      };
      updateEmpresa(updatedStation);

      // If prospecto_real and linkCrm360 is filled, also update or create PlanTrabajo for prospection
      if (groupState.estatus === 'prospecto_real' && groupState.linkCrm360.trim()) {
        const existingPlans = getPlanTrabajo();
        const plan = existingPlans.find(p => p.empresaId === station.id) || {
          id: `plan_${Date.now()}_${station.id}`,
          empresaId: station.id,
          visitado: false,
          linkCrm360: groupState.linkCrm360.trim(),
          marcaCompetencia: station.marcaCompetencia || '',
          oportunidadCreada: false,
          cicloCompletado: false
        };

        savePlanTrabajo({
          ...plan,
          linkCrm360: groupState.linkCrm360.trim()
        });
      }
    });

    setEditingGroups(prev => ({
      ...prev,
      [groupName]: {
        ...prev[groupName],
        isSaved: true
      }
    }));

    if (onDataChange) {
      onDataChange();
    }
  };

  // Filter groups list
  const filteredGroupNames = Object.keys(groupsMap).filter(groupName => {
    const stations = groupsMap[groupName] || [];
    const groupState = editingGroups[groupName];

    // Role filter
    if (!isAdmin) {
      const isAssigned = stations.some(s => s.asesorId === currentUser.id);
      if (!isAssigned) return false;
    }

    // Search text
    const matchesSearch = groupName.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    let matchesStatus = true;
    if (statusFilter !== 'all' && groupState) {
      matchesStatus = groupState.estatus === statusFilter;
    }

    // Advisor filter (Admin only)
    let matchesAsesor = true;
    if (isAdmin && groupState) {
      if (asesorFilter === 'unassigned') {
        matchesAsesor = groupState.asesorId === null;
      } else if (asesorFilter !== 'all') {
        matchesAsesor = groupState.asesorId === asesorFilter;
      }
    }

    return matchesSearch && matchesStatus && matchesAsesor;
  });

  return (
    <div className="flex-1 flex flex-col bg-white border border-[#EAEAEA] rounded-xl overflow-hidden shadow-sm h-full max-h-[calc(100vh-80px)] select-none">
      
      {/* Header Controls */}
      <div className="p-4 border-b border-[#EAEAEA] bg-[#FBFBFA] flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <Fuel className="w-5 h-5 text-blue-700" />
          <div>
            <h3 className="font-display font-bold text-sm text-[#37352F] uppercase tracking-wide leading-none">
              Prospección por Grupos Gasolineros
            </h3>
            <span className="text-[10px] text-[#7C7B77] mt-1 block">
              Gestión comercial centralizada a nivel grupo corporativo
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Search box */}
          <div className="relative flex-1 sm:flex-initial">
            <input
              type="text"
              placeholder="Buscar grupo gasolinero..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-56 pl-8 pr-3 py-1.5 bg-white border border-[#EAEAEA] rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 placeholder-[#CCCCCC]"
            />
            <Search className="w-3.5 h-3.5 text-[#7C7B77] absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1.5 bg-white border border-[#EAEAEA] rounded-md text-xs focus:outline-none shrink-0"
          >
            <option value="all">Estatus: Todos</option>
            <option value="prospecto_real">Prospecto Validado</option>
            <option value="no_ligado_estrategia">No Aplica</option>
          </select>

          {/* Advisor filter (Admin only) */}
          {isAdmin && (
            <select
              value={asesorFilter}
              onChange={(e) => setAsesorFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-[#EAEAEA] rounded-md text-xs focus:outline-none shrink-0"
            >
              <option value="all">Asesor: Todos</option>
              <option value="unassigned">Sin asignar</option>
              {asesores.map(a => (
                <option key={a.id} value={a.id}>{a.nombre}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Main Groups List Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar bg-neutral-50/30">
        {filteredGroupNames.length === 0 ? (
          <div className="py-20 text-center text-xs text-[#7C7B77] bg-white border border-[#EAEAEA] rounded-xl">
            <Building2 className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
            <span>No se encontraron grupos gasolineros con los filtros aplicados.</span>
          </div>
        ) : (
          filteredGroupNames.map(groupName => {
            const state = editingGroups[groupName] || {
              estatus: 'prospecto_real',
              asesorId: null,
              linkCrm360: '',
              comentariosNoAplica: '',
              isSaved: true
            };

            return (
              <div 
                key={groupName}
                className="bg-white border border-[#EAEAEA] rounded-xl shadow-xs p-5 space-y-4 hover:border-neutral-300 transition-all"
              >
                {/* Group Card Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-[#F1F1EF]">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg">
                      <Fuel className="w-5 h-5" />
                    </div>
                    <h4 className="font-display font-bold text-sm text-[#37352F]">{groupName}</h4>
                  </div>

                  {/* Status Indicator Pill */}
                  <div>
                    {state.estatus === 'prospecto_real' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold rounded-full uppercase">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Prospecto Validado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold rounded-full uppercase">
                        No Aplica
                      </span>
                    )}
                  </div>
                </div>

                {/* Form Controls Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                  
                  {/* Column Left: Status & Advisor Selection */}
                  <div className="space-y-3.5">
                    
                    {/* Estatus Selector (Restricted to Prospecto Validado / No Aplica) */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#7C7B77] block">
                        Estatus Comercial del Grupo *
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleFieldChange(groupName, 'estatus', 'prospecto_real')}
                          className={`py-2 px-3 border rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            state.estatus === 'prospecto_real'
                              ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold shadow-2xs'
                              : 'bg-white border-[#EAEAEA] text-[#7C7B77] hover:bg-[#F1F1EF]'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Prospecto Validado
                        </button>

                        <button
                          type="button"
                          onClick={() => handleFieldChange(groupName, 'estatus', 'no_ligado_estrategia')}
                          className={`py-2 px-3 border rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            state.estatus === 'no_ligado_estrategia'
                              ? 'bg-slate-100 border-slate-300 text-slate-700 font-bold shadow-2xs'
                              : 'bg-white border-[#EAEAEA] text-[#7C7B77] hover:bg-[#F1F1EF]'
                          }`}
                        >
                          No Aplica
                        </button>
                      </div>
                    </div>

                    {/* Asesor Asignado Selector */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#7C7B77] block flex items-center gap-1">
                        <User className="w-3 h-3 text-[#7C7B77]" />
                        Asesor Comercial Asignado
                      </label>
                      {isAdmin ? (
                        <select
                          value={state.asesorId || ''}
                          onChange={(e) => handleFieldChange(groupName, 'asesorId', e.target.value === '' ? null : e.target.value)}
                          className="w-full px-3 py-1.8 bg-white border border-[#EAEAEA] hover:border-[#CCCCCC] focus:border-blue-600 rounded-lg text-xs focus:outline-none transition-all"
                        >
                          <option value="">No asesor (Sin asignar)</option>
                          {asesores.map(a => (
                            <option key={a.id} value={a.id}>{a.nombre} ({a.correoGoogle})</option>
                          ))}
                        </select>
                      ) : (
                        <div className="px-3 py-1.8 bg-neutral-50 border border-[#EAEAEA] rounded-lg text-xs font-semibold text-[#37352F]">
                          {state.asesorId ? (asesores.find(a => a.id === state.asesorId)?.nombre || 'Asesor Asignado') : 'Sin Asignar'}
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Column Right: Conditional Inputs */}
                  <div className="space-y-3 bg-[#FBFBFA]/60 border border-[#EAEAEA] p-3.5 rounded-xl flex flex-col justify-between">
                    
                    {state.estatus === 'prospecto_real' ? (
                      /* CONDITIONAL A: LINK CRM L360 LEAD */
                      <div className="space-y-2 animate-in fade-in duration-150">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block flex items-center gap-1">
                          <Link2 className="w-3.5 h-3.5" />
                          Enlace de Lead en CRM L360 (Google / CRM) *
                        </label>
                        <div className="relative">
                          <input
                            type="url"
                            placeholder="https://crm360.alchisa.com/lead/..."
                            value={state.linkCrm360}
                            onChange={(e) => handleFieldChange(groupName, 'linkCrm360', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-[#EAEAEA] hover:border-[#CCCCCC] focus:border-blue-600 rounded-lg text-xs focus:outline-none transition-all pr-8"
                          />
                          {state.linkCrm360 && (
                            <a
                              href={state.linkCrm360}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-blue-700 transition-colors"
                              title="Abrir enlace L360"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                        <span className="text-[9px] text-[#7C7B77] block">
                          Introduce la URL directa al prospecto registrado en el CRM L360 de Alchisa.
                        </span>
                      </div>
                    ) : (
                      /* CONDITIONAL B: COMENTARIOS NO APLICA */
                      <div className="space-y-2 animate-in fade-in duration-150">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5" />
                          Comentarios / Motivo por el cual No Aplica *
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Escriba los comentarios detallados por los cuales este grupo no aplica..."
                          value={state.comentariosNoAplica}
                          onChange={(e) => handleFieldChange(groupName, 'comentariosNoAplica', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-[#EAEAEA] hover:border-[#CCCCCC] focus:border-blue-600 rounded-lg text-xs focus:outline-none transition-all resize-none"
                        />
                        <span className="text-[9px] text-[#7C7B77] block">
                          Describe las razones comerciales o institucionales por las cuales el grupo fue descartado.
                        </span>
                      </div>
                    )}

                    {/* Save Button */}
                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => handleSaveGroup(groupName)}
                        disabled={state.isSaved}
                        className={`px-4 py-1.8 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs ${
                          state.isSaved 
                            ? 'bg-neutral-100 text-[#7C7B77] cursor-default border border-neutral-200' 
                            : 'bg-blue-700 hover:bg-blue-800 text-white cursor-pointer active:scale-95'
                        }`}
                      >
                        <Save className="w-3.5 h-3.5" />
                        {state.isSaved ? 'Grupo Guardado' : 'Guardar Avance del Grupo'}
                      </button>
                    </div>

                  </div>

                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
