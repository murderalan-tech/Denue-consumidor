import { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  CheckCircle2, 
  Building, 
  Target
} from 'lucide-react';
import { Empresa, Asesor, EstatusPros, ESTATUS_LABELS } from '../types';
import { getPlanTrabajo, getAsesores } from '../database/dbService';

interface DashboardSectionProps {
  empresas: Empresa[];
  currentUser: Asesor;
}

export default function DashboardSection({ empresas, currentUser }: DashboardSectionProps) {
  const [selectedAsesor, setSelectedAsesor] = useState<string>('all');

  const isAdmin = currentUser.rol === 'administrador';
  const advisors = getAsesores().filter(a => a.rol === 'asesor');
  const allPlans = getPlanTrabajo();

  // 1. Filter empresas by user role or selected advisor filter
  const currentAdvisorId = isAdmin ? selectedAsesor : currentUser.id;
  const filteredEmpresas = empresas.filter(emp => {
    if (currentAdvisorId === 'all') return true;
    return emp.asesorId === currentAdvisorId;
  });

  const totalEmpresas = filteredEmpresas.length;

  // 2. Count by Status
  const getStatusCount = (status: EstatusPros, giro?: 'refaccionaria' | 'taller_mecanico' | 'gasolinera') => {
    return filteredEmpresas.filter(e => e.estatus === status && (!giro || e.giro === giro)).length;
  };

  // 3. Count Completion Cycles
  // Cycle is completed if there is an active PlanTrabajo with cicloCompletado = true
  const getCycleStats = (giro?: 'refaccionaria' | 'taller_mecanico' | 'gasolinera') => {
    const validatedEmpresas = filteredEmpresas.filter(e => e.estatus === 'prospecto_real' && (!giro || e.giro === giro));
    const validatedIds = new Set(validatedEmpresas.map(e => e.id));
    
    const plansForFiltered = allPlans.filter(p => validatedIds.has(p.empresaId));
    const completedCount = plansForFiltered.filter(p => p.cicloCompletado).length;
    const inProcessCount = validatedEmpresas.length - completedCount;

    return {
      total: validatedEmpresas.length,
      completed: completedCount,
      inProcess: inProcessCount,
      percentage: validatedEmpresas.length > 0 ? Math.round((completedCount / validatedEmpresas.length) * 100) : 0
    };
  };

  const globalCycle = getCycleStats();

  // 4. Calculate Hit Rate Opp (Oportunidades Creadas / Empresas con Ciclo Concluido * 100)
  const getHitRateOppStats = (giro: 'refaccionaria' | 'taller_mecanico' | 'gasolinera') => {
    const prospectadas = filteredEmpresas.filter(e => e.estatus === 'prospectado' && e.giro === giro);
    const giroEmpresas = filteredEmpresas.filter(e => e.giro === giro);
    const giroEmpresaIds = new Set(giroEmpresas.map(e => e.id));
    const completedActivePlans = allPlans.filter(p => giroEmpresaIds.has(p.empresaId) && p.cicloCompletado);

    let totalConcluidas = 0;
    let oportunidadesCreadas = 0;

    prospectadas.forEach(e => {
      totalConcluidas++;
      if (e.planOportunidadCreada === true) {
        oportunidadesCreadas++;
      }
    });

    const prospectadaIds = new Set(prospectadas.map(e => e.id));
    completedActivePlans.forEach(p => {
      if (!prospectadaIds.has(p.empresaId)) {
        totalConcluidas++;
        if (p.oportunidadCreada === true) {
          oportunidadesCreadas++;
        }
      }
    });

    const hitRate = totalConcluidas > 0 ? Math.round((oportunidadesCreadas / totalConcluidas) * 100) : 0;

    return {
      totalConcluidas,
      oportunidadesCreadas,
      hitRate
    };
  };

  // Giro summaries
  const giros: Array<{ id: 'refaccionaria' | 'taller_mecanico' | 'gasolinera'; label: string; icon: any }> = [
    { id: 'refaccionaria', label: 'Refaccionarias', icon: Building },
    { id: 'taller_mecanico', label: 'Talleres Mecánicos', icon: Target },
    { id: 'gasolinera', label: 'Gasolineras', icon: TrendingUp }
  ];

  return (
    <div className="flex-1 space-y-6 overflow-y-auto max-h-[calc(100vh-80px)] pr-2 p-1 custom-scrollbar">
      
      {/* Header and Advisor Switcher for Admin */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-[#EAEAEA] p-4 rounded-xl shadow-xs">
        <div>
          <h2 className="font-display font-extrabold text-base text-[#37352F] flex items-center gap-2">
            Dashboard Comercial
          </h2>
          <p className="text-xs text-[#7C7B77] mt-0.5">
            Métricas de prospección y cobertura comercial en Chihuahua.
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-bold text-[#7C7B77] uppercase tracking-wide">
              Vista del Asesor:
            </span>
            <select
              value={selectedAsesor}
              onChange={(e) => setSelectedAsesor(e.target.value)}
              className="px-2 py-1 bg-white border border-[#EAEAEA] rounded text-xs focus:outline-none"
            >
              <option value="all">Ver Todos (Consolidado)</option>
              <option value="unassigned">No asesor (Sin asignar)</option>
              {advisors.map(a => (
                <option key={a.id} value={a.id}>{a.nombre}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* KPI Cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        
        {/* KPI 1: Total Leads */}
        <div className="bg-white border border-[#EAEAEA] p-4.5 rounded-xl shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 bg-blue-50 rounded-lg text-blue-700">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-[#7C7B77] block">Cuentas Mapeadas</span>
            <span className="font-display font-extrabold text-xl text-[#37352F]">{totalEmpresas}</span>
            <span className="text-[9px] text-[#7C7B77] block mt-0.5">Empresas totales</span>
          </div>
        </div>

        {/* KPI 2: Active Clients */}
        <div className="bg-white border border-[#EAEAEA] p-4.5 rounded-xl shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-[#7C7B77] block">Clientes Activos</span>
            <span className="font-display font-extrabold text-xl text-emerald-700">
              {getStatusCount('cliente')}
            </span>
            <span className="text-[9px] text-[#7C7B77] block mt-0.5">Estatus: Cliente</span>
          </div>
        </div>

        {/* KPI 3: Validated Prospects */}
        <div className="bg-white border border-[#EAEAEA] p-4.5 rounded-xl shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-[#7C7B77] block">Prospectos Validados</span>
            <span className="font-display font-extrabold text-xl text-blue-700">
              {getStatusCount('prospecto_real')}
            </span>
            <span className="text-[9px] text-[#7C7B77] block mt-0.5">En plan de prospección</span>
          </div>
        </div>

        {/* KPI 4: Plan Completion Ratio */}
        <div className="bg-white border border-[#EAEAEA] p-4.5 rounded-xl shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-600">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-[#7C7B77] block">Avance de Prospección</span>
            <span className="font-display font-extrabold text-xl text-indigo-700">
              {globalCycle.percentage}%
            </span>
            <span className="text-[9px] text-[#7C7B77] block mt-0.5">
              {globalCycle.completed} de {globalCycle.total} concluidos
            </span>
          </div>
        </div>

      </div>

      {/* Main analytical details per GIRO category */}
      <div className="space-y-6">
        
        {giros.map((giroInfo) => {
          const stats = getCycleStats(giroInfo.id);
          const hitRateStats = getHitRateOppStats(giroInfo.id);
          const totalInGiro = filteredEmpresas.filter(e => e.giro === giroInfo.id).length;

          if (totalInGiro === 0) return null;

          return (
            <div key={giroInfo.id} className="bg-white border border-[#EAEAEA] rounded-xl shadow-sm p-6 space-y-4">
              
              {/* Giro Category Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-[#EAEAEA]">
                <div className="flex items-center gap-2">
                  <giroInfo.icon className="w-4.5 h-4.5 text-blue-700" />
                  <h4 className="font-display font-bold text-sm text-[#37352F]">
                    {giroInfo.label} ({totalInGiro} empresas)
                  </h4>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  {/* Progress bar cycle completed */}
                  {stats.total > 0 && (
                    <div className="flex items-center gap-2 text-[10px] text-[#7C7B77] font-semibold bg-neutral-50 px-2.5 py-1 rounded border border-[#EAEAEA]">
                      <span>Prospección concluida:</span>
                      <span className="text-indigo-600 font-bold">{stats.completed}/{stats.total} ({stats.percentage}%)</span>
                    </div>
                  )}

                  {/* Hit Rate Opp Pill */}
                  <div className="flex items-center gap-1.5 text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2.5 py-1 rounded border border-emerald-200">
                    <span>Hit Rate Opp:</span>
                    <span className="text-emerald-700 font-extrabold">{hitRateStats.hitRate}%</span>
                    <span className="text-[9px] font-normal text-emerald-600">({hitRateStats.oportunidadesCreadas}/{hitRateStats.totalConcluidas})</span>
                  </div>
                </div>
              </div>

              {/* Grid: Left - Status counts, Right - Completion progress details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Estatus Distribution list */}
                <div className="space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C7B77] block">
                    Distribución de Cuentas por Estatus
                  </span>

                  <div className="space-y-2.5">
                    {Object.entries(ESTATUS_LABELS).map(([key, details]) => {
                      const count = getStatusCount(key as EstatusPros, giroInfo.id);
                      const pct = totalInGiro > 0 ? (count / totalInGiro) * 100 : 0;
                      
                      return (
                        <div key={key} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className={`text-[9px] font-bold px-2 py-0.2 rounded border uppercase ${details.bg} ${details.border} ${details.text}`}>
                              {details.label}
                            </span>
                            <span className="font-medium text-[#37352F]">
                              {count} <span className="text-[9px] text-[#7C7B77] font-normal">({Math.round(pct)}%)</span>
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full bg-neutral-400/70"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Progress cycle & Hit Rate Opp visualization */}
                <div className="space-y-4 bg-[#FBFBFA]/80 border border-[#EAEAEA] p-5 rounded-xl flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C7B77] block">
                      Ratios de Eficiencia Comercial
                    </span>
                    <p className="text-[11px] text-[#7C7B77] leading-relaxed">
                      El <strong>Hit Rate Opp</strong> mide la tasa de éxito al convertir prospectos con ciclo concluido en oportunidades comerciales creadas en L360.
                    </p>
                  </div>

                  {/* Hit Rate Opp Highlight Card */}
                  <div className="bg-emerald-50/60 border border-emerald-200/80 p-3.5 rounded-lg space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-emerald-900">
                      <span>🎯 Hit Rate Opp</span>
                      <span className="text-emerald-700 font-extrabold text-base">{hitRateStats.hitRate}%</span>
                    </div>
                    <div className="h-2 w-full bg-emerald-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                        style={{ width: `${hitRateStats.hitRate}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-emerald-700 font-medium">
                      {hitRateStats.oportunidadesCreadas} oportunidades creadas de {hitRateStats.totalConcluidas} empresas con ciclo concluido
                    </p>
                  </div>

                  {stats.total > 0 ? (
                    <div className="space-y-3 pt-1 border-t border-[#EAEAEA]">
                      <div className="flex justify-between items-end text-xs font-semibold">
                        <span className="text-[#37352F]">Avance de Trabajo en Plan</span>
                        <span className="text-indigo-600 font-extrabold text-sm">{stats.percentage}%</span>
                      </div>
                      
                      <div className="h-2.5 w-full bg-[#EAEAEA] rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500"
                          style={{ width: `${stats.percentage}%` }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] text-[#7C7B77]">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                          <span>{stats.completed} Completados</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                          <span>{stats.inProcess} En Seguimiento</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-3 text-center text-[11px] text-[#7C7B77] border border-dashed border-[#EAEAEA] rounded-lg">
                      No hay prospectos en estado "Prospecto validado" para analizar.
                    </div>
                  )}

                </div>

              </div>

            </div>
          );
        })}

      </div>

    </div>
  );
}
