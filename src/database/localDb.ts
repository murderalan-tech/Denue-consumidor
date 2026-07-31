import { Empresa, Asesor, PlanTrabajo } from '../types';
import { SEED_ASESORES, SEED_EMPRESAS, SEED_PLANTTRABAJO } from './initialSeed';

const KEY_EMPRESAS = 'denue_pv_empresas';
const KEY_ASESORES = 'denue_pv_asesores';
const KEY_PLAN_TRABAJO = 'denue_pv_plantrabajo';

export function initializeDb() {
  if (!localStorage.getItem(KEY_ASESORES)) {
    localStorage.setItem(KEY_ASESORES, JSON.stringify(SEED_ASESORES));
  } else {
    // Ensure SEED_ASESORES entries (e.g. alan.olivares@alchisa.com) exist in local database
    try {
      const existing: Asesor[] = JSON.parse(localStorage.getItem(KEY_ASESORES) || '[]');
      let updated = false;
      SEED_ASESORES.forEach(seed => {
        if (!existing.some(a => a.correoGoogle.toLowerCase() === seed.correoGoogle.toLowerCase())) {
          existing.push(seed);
          updated = true;
        }
      });
      if (updated) {
        localStorage.setItem(KEY_ASESORES, JSON.stringify(existing));
      }
    } catch (e) {}
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

export function deleteAsesor(id: string): void {
  const asesores = getAsesores();
  const filtered = asesores.filter(a => a.id !== id);
  localStorage.setItem(KEY_ASESORES, JSON.stringify(filtered));
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
    
    if (updatedEmpresa.estatus !== 'prospecto_validado') {
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

export function savePlanTrabajo(plan: PlanTrabajo): PlanTrabajo {
  const plans = getPlanTrabajo();
  const empresas = getEmpresas();
  
  const crmFilled = !!plan.linkCrm360?.trim();
  const competitorFilled = !!plan.marcaCompetencia?.trim();
  let opportunityDetailsFilled = false;
  
  if (plan.oportunidadCreada) {
    opportunityDetailsFilled = !!plan.linkOportunidad360?.trim();
  } else {
    opportunityDetailsFilled = !!plan.motivoNoOportunidad?.trim();
  }

  plan.cicloCompletado = crmFilled && competitorFilled && opportunityDetailsFilled;

  const idx = plans.findIndex(p => p.id === plan.id || p.empresaId === plan.empresaId);
  if (idx !== -1) {
    plans[idx] = plan;
  } else {
    plans.push(plan);
  }
  
  localStorage.setItem(KEY_PLAN_TRABAJO, JSON.stringify(plans));

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
