export type Giro = 'refaccionaria' | 'taller_mecanico' | 'gasolinera';

export type EstatusPros = 
  | 'sin_accion'
  | 'cliente'
  | 'prospecto_real'
  | 'cliente_de_cliente'
  | 'no_ligado_estrategia'
  | 'no_existe'
  | 'ex_cliente_moroso'
  | 'prospectado';

export type RolAsesor = 'asesor' | 'administrador';

export interface Asesor {
  id: string;
  nombre: string;
  correoGoogle: string;
  rol: RolAsesor;
  fotoUrl?: string; // Google Profile avatar image URL
}

export interface Empresa {
  id: string;
  nombre: string;
  giro: Giro;
  latitud: number;
  longitud: number;
  direccion: string;
  telefono: string;
  contacto: string;
  estatus: EstatusPros;
  asesorId: string | null; // null represents "No asesor"
  grupoGasolinero?: string; // only if giro === 'gasolinera'
  marcaCompetencia?: string; // sync from Plan de Trabajo or filled in plan
  razonSocial?: string; // optional RazÃ³n Social from DENUE
  ciudad?: string; // City where the company is located
  linkCrm360?: string; // Lead URL in CRM L360 (used for Gasolineras groups)
  comentariosNoAplica?: string; // Comments why gas station group does not apply
  vecesAgregadoAlPlan?: number; // Number of times added to work plan
  // Plan history fields â€“ persisted when prospecting cycle completes
  planLinkCrm360?: string;
  planOportunidadCreada?: boolean;
  planLinkOportunidad360?: string;
  planMotivoNoOportunidad?: string;
  planFechaInicio?: string; // ISO date of when the last plan cycle started
  planFechaFin?: string;   // ISO date of when the cycle completed
  ventaConcretada?: boolean;    // Was the sale closed after prospecting?
  volumenPrimeraVenta?: string; // Volume/amount of the first sale
  fechaActualizacion: string; // ISO date string
}

export interface PlanTrabajo {
  id: string;
  empresaId: string;
  fechaInicio?: string; // ISO date format string
  fechaFin?: string; // ISO date format string when cycle completed
  visitado: boolean;
  linkCrm360: string;
  marcasCompetencia?: string[]; // Array of selected brands
  marcaCompetencia?: string; // Legacy/string joining for compatibility
  oportunidadCreada: boolean;
  linkOportunidad360?: string;
  motivoNoOportunidad?: 'No se encontro al encargado' | 'No Interesado' | 'No contamos con el producto necesitado' | string;
  cicloCompletado: boolean; // calculated field
}

export interface UserSession {
  currentUser: Asesor;
  isAuthenticated: boolean;
}

export const ESTATUS_LABELS: Record<EstatusPros, { label: string; bg: string; text: string; border: string }> = {
  sin_accion: { 
    label: 'Sin acción', 
    bg: 'bg-neutral-100', 
    text: 'text-neutral-700', 
    border: 'border-neutral-200' 
  },
  cliente: { 
    label: 'Cliente', 
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-250', 
    text: 'text-emerald-700', 
    border: 'border-emerald-200' 
  },
  prospecto_real: { 
    label: 'Prospecto Real', 
    bg: 'bg-blue-50 text-blue-700 border-blue-200', 
    text: 'text-blue-700', 
    border: 'border-blue-200' 
  },
  cliente_de_cliente: { 
    label: 'Cliente de Cliente', 
    bg: 'bg-amber-50 text-amber-700 border-amber-250', 
    text: 'text-amber-700', 
    border: 'border-amber-200' 
  },
  no_ligado_estrategia: { 
    label: 'No Ligado a Estrategia', 
    bg: 'bg-slate-100 text-slate-500 border-slate-200', 
    text: 'text-slate-500', 
    border: 'border-slate-200' 
  },
  no_existe: { 
    label: 'No Existe', 
    bg: 'bg-rose-50 text-rose-600 border-rose-200', 
    text: 'text-rose-600', 
    border: 'border-rose-200' 
  },
  ex_cliente_moroso: {
    label: 'Ex-Cliente Moroso',
    bg: 'bg-red-50 text-red-700 border-red-200',
    text: 'text-red-700',
    border: 'border-red-200'
  },
  prospectado: {
    label: 'Prospectado',
    bg: 'bg-purple-50 text-purple-700 border-purple-200',
    text: 'text-purple-700',
    border: 'border-purple-200'
  }
};

export const GIRO_LABELS: Record<Giro, string> = {
  refaccionaria: 'Refaccionaria',
  taller_mecanico: 'Taller Mecánico',
  gasolinera: 'Gasolinera'
};
