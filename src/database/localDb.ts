import { Empresa, Asesor, PlanTrabajo } from '../types';
import { SEED_ASESORES, SEED_EMPRESAS, SEED_PLANTTRABAJO } from './initialSeed';

const KEY_EMPRESAS = 'denue_pv_empresas';
const KEY_ASESORES = 'denue_pv_asesores';
const KEY_PLAN_TRABAJO = 'denue_pv_plantrabajo';

export function initializeDb() {
  if (!localStorage.getItem(KEY_ASESORES)) {
    localStorage.setItem(KEY_ASESORES, JSON.stringify(SEED_ASESORES));
  }

  if (!localStorage.getItem(KEY_EMPRESAS)) {
    localStorage.setItem(KEY_EMPRESAS, JSON.stringify(SEED_EMPRESAS));
  }
  if (!localStorage.getItem(KEY_PLAN_TRABAJO)) {
    localStorage.setItem(KEY_PLAN_TRABAJO, JSON.stringify(SEED_PLANTTRABAJO));
  }
}

export function getAsesores(): Asesor[] {
  initializeDb();
  const data = localStorage.getItem(KEY_ASESORES);
  return data ? JSON.parse(data) : [];
}

export function addAsesor(asesor: Asesor): Asesor {
  const asesores = getAsesores();
  const updated = [...asesores.filter(a => a.id !== asesor.id), asesor];
  localStorage.setItem(KEY_ASESORES, JSON.stringify(updated));
  return asesor;
}

export function updateAsesor(asesor: Asesor): Asesor {
  const asesores = getAsesores();
  const idx = asesores.findIndex(a => a.id === asesor.id);
  if (idx !== -1) {
    asesores[idx] = asesor;
    localStorage.setItem(KEY_ASESORES, JSON.stringify(asesores));
  }
  return asesor;
}

export function deleteAsesor(id: string): void {
  const asesores = getAsesores();
  const filtered = asesores.filter(a => a.id !== id);
  localStorage.setItem(KEY_ASESORES, JSON.stringify(filtered));

  // Unassign companies linked to this deleted advisor (set asesorId to null)
  const empresas = getEmpresas();
  let empUpdated = false;
  empresas.forEach((emp, idx) => {
    if (emp.asesorId === id) {
      empresas[idx] = {
        ...emp,
        asesorId: null,
        fechaActualizacion: new Date().toISOString()
      };
      empUpdated = true;
    }
  });

  if (empUpdated) {
    localStorage.setItem(KEY_EMPRESAS, JSON.stringify(empresas));
  }
}

export function getEmpresas(): Empresa[] {
  initializeDb();
  const data = localStorage.getItem(KEY_EMPRESAS);
  return data ? JSON.parse(data) : [];
}

export function getPlanTrabajo(): PlanTrabajo[] {
  initializeDb();
  const data = localStorage.getItem(KEY_PLAN_TRABAJO);
  return data ? JSON.parse(data) : [];
}

export function updateEmpresa(updatedEmpresa: Empresa): Empresa {
  const empresas = getEmpresas();
  const idx = empresas.findIndex(e => e.id === updatedEmpresa.id);
  
  if (idx !== -1) {
    empresas[idx] = {
      ...updatedEmpresa,
      fechaActualizacion: new Date().toISOString()
    };
    localStorage.setItem(KEY_EMPRESAS, JSON.stringify(empresas));
    
    if (updatedEmpresa.estatus !== 'prospecto_real') {
      const plans = getPlanTrabajo();
      const planIdx = plans.findIndex(p => p.empresaId === updatedEmpresa.id);
      if (planIdx !== -1) {
        plans.splice(planIdx, 1);
        localStorage.setItem(KEY_PLAN_TRABAJO, JSON.stringify(plans));
      }
    }
  }
  return updatedEmpresa;
}

export function deleteAllEmpresas(): void {
  localStorage.setItem(KEY_EMPRESAS, JSON.stringify([]));
  localStorage.setItem(KEY_PLAN_TRABAJO, JSON.stringify([]));
}

export function savePlanTrabajo(plan: PlanTrabajo): PlanTrabajo {
  const plans = getPlanTrabajo();
  const empresas = getEmpresas();
  
  if (!plan.fechaInicio) {
    plan.fechaInicio = new Date().toISOString();
  }

  // Support array of competitor brands
  if (Array.isArray(plan.marcasCompetencia)) {
    plan.marcaCompetencia = plan.marcasCompetencia.join(', ');
  } else if (plan.marcaCompetencia && !plan.marcasCompetencia) {
    plan.marcasCompetencia = plan.marcaCompetencia.split(',').map(s => s.trim()).filter(Boolean);
  }

  const crmFilled = !!plan.linkCrm360?.trim();
  const competitorFilled = (plan.marcasCompetencia && plan.marcasCompetencia.length > 0) || !!plan.marcaCompetencia?.trim();
  let opportunityDetailsFilled = false;
  
  if (plan.oportunidadCreada) {
    opportunityDetailsFilled = !!plan.linkOportunidad360?.trim();
  } else {
    opportunityDetailsFilled = !!plan.motivoNoOportunidad?.trim();
  }

  plan.cicloCompletado = plan.visitado && crmFilled && competitorFilled && opportunityDetailsFilled;

  if (plan.cicloCompletado && !plan.fechaFin) {
    plan.fechaFin = new Date().toISOString();
  } else if (!plan.cicloCompletado) {
    delete plan.fechaFin;
  }

  // Handle special case: "No se encontro al encargado"
  if (!plan.oportunidadCreada && plan.motivoNoOportunidad === 'No se encontro al encargado') {
    // 1. Delete plan of work
    deletePlanTrabajoByEmpresa(plan.empresaId);

    // 2. Keep company as prospecto_real and mark visitado flag if needed or log
    const empIdx = empresas.findIndex(e => e.id === plan.empresaId);
    if (empIdx !== -1) {
      empresas[empIdx] = {
        ...empresas[empIdx],
        marcaCompetencia: plan.marcaCompetencia,
        fechaActualizacion: new Date().toISOString()
      };
      localStorage.setItem(KEY_EMPRESAS, JSON.stringify(empresas));
    }
    return plan;
  }

  // Handle completion: when completed, remove from plan of work and mark company status as 'prospectado'
  if (plan.cicloCompletado) {
    deletePlanTrabajoByEmpresa(plan.empresaId);

    // Update company status to 'prospectado' and persist ALL plan fields for historical reporting
    const empIdx = empresas.findIndex(e => e.id === plan.empresaId);
    if (empIdx !== -1) {
      empresas[empIdx] = {
        ...empresas[empIdx],
        estatus: 'prospectado',
        marcaCompetencia: plan.marcaCompetencia,
        // Persist plan history fields so CSV report can read them after plan is deleted
        planLinkCrm360: plan.linkCrm360 || '',
        planOportunidadCreada: plan.oportunidadCreada,
        planLinkOportunidad360: plan.linkOportunidad360 || '',
        planMotivoNoOportunidad: plan.motivoNoOportunidad || '',
        planFechaInicio: plan.fechaInicio || '',
        planFechaFin: plan.fechaFin || new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
      };
      localStorage.setItem(KEY_EMPRESAS, JSON.stringify(empresas));
    }
    return plan;
  }

  // Otherwise update or add plan
  const idx = plans.findIndex(p => p.id === plan.id || p.empresaId === plan.empresaId);
  const isNewPlan = idx === -1;
  if (idx !== -1) {
    plans[idx] = plan;
  } else {
    plans.push(plan);
  }
  
  localStorage.setItem(KEY_PLAN_TRABAJO, JSON.stringify(plans));

  const empIdx = empresas.findIndex(e => e.id === plan.empresaId);
  if (empIdx !== -1) {
    const currentCount = empresas[empIdx].vecesAgregadoAlPlan || 0;
    empresas[empIdx] = {
      ...empresas[empIdx],
      vecesAgregadoAlPlan: isNewPlan ? currentCount + 1 : (currentCount === 0 ? 1 : currentCount),
      marcaCompetencia: plan.marcaCompetencia,
      fechaActualizacion: new Date().toISOString()
    };
    localStorage.setItem(KEY_EMPRESAS, JSON.stringify(empresas));
  }

  return plan;
}

export function deletePlanTrabajoByEmpresa(empresaId: string) {
  const plans = getPlanTrabajo();
  const filtered = plans.filter(p => p.empresaId !== empresaId);
  localStorage.setItem(KEY_PLAN_TRABAJO, JSON.stringify(filtered));
}

export function resetDb() {
  localStorage.removeItem(KEY_ASESORES);
  localStorage.removeItem(KEY_EMPRESAS);
  localStorage.removeItem(KEY_PLAN_TRABAJO);
  initializeDb();
}

export function addEmpresa(empresa: Empresa): Empresa {
  const empresas = getEmpresas();
  empresas.push({
    ...empresa,
    fechaActualizacion: new Date().toISOString()
  });
  localStorage.setItem(KEY_EMPRESAS, JSON.stringify(empresas));
  return empresa;
}

export function addEmpresasBulk(newEmpresas: Empresa[]): Empresa[] {
  const empresas = getEmpresas();
  const dateStr = new Date().toISOString();
  
  const mapped = newEmpresas.map(e => ({
    ...e,
    fechaActualizacion: dateStr
  }));
  
  const combined = [...empresas, ...mapped];
  localStorage.setItem(KEY_EMPRESAS, JSON.stringify(combined));
  return mapped;
}
