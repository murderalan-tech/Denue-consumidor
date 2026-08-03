import { Asesor, Empresa, PlanTrabajo } from '../types';

export const SEED_ASESORES: Asesor[] = [
  {
    id: "admin_alan_id",
    nombre: "Alan Olivares",
    correoGoogle: "alan.olivares@alchisa.com",
    rol: "asesor"
  },
  {
    id: "admin_murder_id",
    nombre: "Alan Olivares (Admin)",
    correoGoogle: "murder.alan@gmail.com",
    rol: "administrador"
  },
  {
    id: "admin_id",
    nombre: "Supervisor de Ventas (Admin)",
    correoGoogle: "admin@alchisa.com",
    rol: "administrador"
  },
  {
    id: "juan_id",
    nombre: "Juan López",
    correoGoogle: "juan.lopez@alchisa.com",
    rol: "asesor"
  },
  {
    id: "maria_id",
    nombre: "María Gómez",
    correoGoogle: "maria.gomez@alchisa.com",
    rol: "asesor"
  }
];

export const SEED_EMPRESAS: Empresa[] = [
  // === REFACCIONARIAS (Chihuahua, Juárez, Delicias) ===
  {
    id: "ref_001",
    nombre: "Refaccionaria Chihuahua Centro",
    giro: "refaccionaria",
    latitud: 28.6368,
    longitud: -106.0712,
    direccion: "Av. Juárez 1102, Col. Centro, Chihuahua, Chih.",
    telefono: "6144131515",
    contacto: "Ing. Carlos Mendoza",
    estatus: "cliente",
    asesorId: "juan_id",
    fechaActualizacion: new Date().toISOString()
  },
  {
    id: "ref_002",
    nombre: "Refaccionaria AutoZone Universidad",
    giro: "refaccionaria",
    latitud: 28.6534,
    longitud: -106.0895,
    direccion: "Av. Universidad 2400, Col. San Felipe, Chihuahua, Chih.",
    telefono: "6144149020",
    contacto: "Lic. Andrea Ruiz",
    estatus: "prospecto_real",
    asesorId: "juan_id",
    fechaActualizacion: new Date().toISOString()
  },
  {
    id: "ref_003",
    nombre: "Refacciones y Partes El Norte",
    giro: "refaccionaria",
    latitud: 31.7215,
    longitud: -106.4485,
    direccion: "Av. Tecnológico 8500, Col. Infonavit, Cd. Juárez, Chih.",
    telefono: "6566172040",
    contacto: "Sr. Fernando Silva",
    estatus: "sin_accion",
    asesorId: null,
    fechaActualizacion: new Date().toISOString()
  },
  {
    id: "ref_004",
    nombre: "El Mundo de las Refacciones Juárez",
    giro: "refaccionaria",
    latitud: 31.6912,
    longitud: -106.4254,
    direccion: "Av. De la Raza 3110, Col. Chaveña, Cd. Juárez, Chih.",
    telefono: "6566120909",
    contacto: "Eduardo Gómez",
    estatus: "prospecto_real",
    asesorId: "maria_id",
    fechaActualizacion: new Date().toISOString()
  },
  {
    id: "ref_005",
    nombre: "Refaccionaria Eléctrica Delicias",
    giro: "refaccionaria",
    latitud: 28.1925,
    longitud: -105.4718,
    direccion: "Av. Agricultura Oriente 402, Col. Centro, Delicias, Chih.",
    telefono: "6394723050",
    contacto: "Martín Holguín",
    estatus: "cliente_de_cliente",
    asesorId: "maria_id",
    fechaActualizacion: new Date().toISOString()
  },
  {
    id: "ref_006",
    nombre: "Refaccionaria El Lagunero Parral",
    giro: "refaccionaria",
    latitud: 26.9312,
    longitud: -105.6645,
    direccion: "Av. Independencia 54, Col. Centro, Parral, Chih.",
    telefono: "6275231200",
    contacto: "",
    estatus: "sin_accion",
    asesorId: null,
    fechaActualizacion: new Date().toISOString()
  },
  {
    id: "ref_007",
    nombre: "Refacciones Diesel de Cuauhtémoc",
    giro: "refaccionaria",
    latitud: 28.4085,
    longitud: -106.8640,
    direccion: "Calzada 16 de Septiembre 840, Col. Centro, Cuauhtémoc, Chih.",
    telefono: "6255823412",
    contacto: "Peter Friesen",
    estatus: "no_ligado_estrategia",
    asesorId: "juan_id",
    fechaActualizacion: new Date().toISOString()
  },
  {
    id: "ref_008",
    nombre: "Refaccionaria Ruiz Hnos",
    giro: "refaccionaria",
    latitud: 28.6180,
    longitud: -106.0490,
    direccion: "Calle 11 y Av. Niños Héroes, Col. Centro, Chihuahua, Chih.",
    telefono: "",
    contacto: "",
    estatus: "no_existe",
    asesorId: "maria_id",
    fechaActualizacion: new Date().toISOString()
  },

  // === TALLERES MECANICOS ===
  {
    id: "tal_001",
    nombre: "Taller Mecánico Silva e Hijos",
    giro: "taller_mecanico",
    latitud: 28.6295,
    longitud: -106.0820,
    direccion: "Calle 20a 3402, Col. Santa Rosa, Chihuahua, Chih.",
    telefono: "6144102939",
    contacto: "Don Ramón Silva",
    estatus: "cliente",
    asesorId: "maria_id",
    fechaActualizacion: new Date().toISOString()
  },
  {
    id: "tal_002",
    nombre: "Servicio Automotriz Romano",
    giro: "taller_mecanico",
    latitud: 28.6645,
    longitud: -106.1154,
    direccion: "Av. de las Industrias 4901, Col. Nombre de Dios, Chihuahua, Chih.",
    telefono: "6144240989",
    contacto: "Sergio Romano",
    estatus: "prospecto_real",
    asesorId: "juan_id",
    fechaActualizacion: new Date().toISOString()
  },
  {
    id: "tal_003",
    nombre: "Taller Frenos y Alineaciones Juárez",
    giro: "taller_mecanico",
    latitud: 31.7056,
    longitud: -106.4012,
    direccion: "Av. López Mateos 1205, Col. El Colegio, Cd. Juárez, Chih.",
    telefono: "6566239080",
    contacto: "Manuel Oronoz",
    estatus: "sin_accion",
    asesorId: null,
    fechaActualizacion: new Date().toISOString()
  },
  {
    id: "tal_004",
    nombre: "Taller Hidráulico Menonita",
    giro: "taller_mecanico",
    latitud: 28.4312,
    longitud: -106.8890,
    direccion: "Corredor Comercial Km 10, Cuauhtémoc, Chih.",
    telefono: "6255861001",
    contacto: "Johan Giesbrecht",
    estatus: "cliente_de_cliente",
    asesorId: "juan_id",
    fechaActualizacion: new Date().toISOString()
  },
  {
    id: "tal_005",
    nombre: "Centro de Servicio LTH Delicias",
    giro: "taller_mecanico",
    latitud: 28.1880,
    longitud: -105.4650,
    direccion: "Av. Río Conchos 110, Col. Centro, Delicias, Chih.",
    telefono: "6394741212",
    contacto: "Rubén Alvídrez",
    estatus: "prospecto_real",
    asesorId: "maria_id",
    fechaActualizacion: new Date().toISOString()
  },
  {
    id: "tal_006",
    nombre: "Taller Electro-Mecánico El Chispas",
    giro: "taller_mecanico",
    latitud: 26.9425,
    longitud: -105.6590,
    direccion: "Calle Ojito 14, Col. Centro, Parral, Chih.",
    telefono: "6275220456",
    contacto: "Francisco 'Chispas' Villa",
    estatus: "sin_accion",
    asesorId: null,
    fechaActualizacion: new Date().toISOString()
  },
  {
    id: "tal_007",
    nombre: "Taller Mecánico Especializado BMW/Audi",
    giro: "taller_mecanico",
    latitud: 28.6412,
    longitud: -106.1345,
    direccion: "Av. Periférico de la Juventud 5700, Col. Las Carretas, Chihuahua, Chih.",
    telefono: "6144301567",
    contacto: "Ing. Jorge Valenzuela",
    estatus: "no_ligado_estrategia",
    asesorId: "maria_id",
    fechaActualizacion: new Date().toISOString()
  },

  // === GASOLINERAS (grouped by Grupo Gasolinero) ===
  {
    id: "gas_001",
    nombre: "Grupo Pemex",
    giro: "gasolinera",
    latitud: 28.6012,
    longitud: -106.0845,
    direccion: "Av. Silvestre Terrazas 9002, Col. Los Pinos, Chihuahua, Chih.",
    telefono: "6144180404",
    contacto: "Rogelio Baca",
    estatus: "prospecto_real",
    asesorId: "admin_alan_id",
    grupoGasolinero: "Grupo Pemex",
    fechaActualizacion: new Date().toISOString()
  },
  {
    id: "gas_002",
    nombre: "Grupo Oxxo Gas",
    giro: "gasolinera",
    latitud: 28.6289,
    longitud: -106.1034,
    direccion: "Av. Adolfo Ortiz Mena 3201, Col. Quintas del Sol, Chihuahua, Chih.",
    telefono: "6144158910",
    contacto: "Lic. Javier Solís",
    estatus: "prospecto_real",
    asesorId: "juan_id",
    grupoGasolinero: "Grupo Oxxo Gas",
    fechaActualizacion: new Date().toISOString()
  },
  {
    id: "gas_004",
    nombre: "Grupo Gazpro",
    giro: "gasolinera",
    latitud: 28.6745,
    longitud: -106.0987,
    direccion: "Av. Tecnológico 4905, Col. Granjas, Chihuahua, Chih.",
    telefono: "6144192030",
    contacto: "Ing. Roberto Loya",
    estatus: "prospecto_real",
    asesorId: "maria_id",
    grupoGasolinero: "Grupo Gazpro",
    fechaActualizacion: new Date().toISOString()
  },
  {
    id: "gas_006",
    nombre: "Grupo Petro-7",
    giro: "gasolinera",
    latitud: 31.7345,
    longitud: -106.4124,
    direccion: "Av. Paseo Triunfo de la República 4500, Cd. Juárez, Chih.",
    telefono: "6566184530",
    contacto: "Lic. Hugo Valles",
    estatus: "prospecto_real",
    asesorId: "maria_id",
    grupoGasolinero: "Grupo Petro-7",
    fechaActualizacion: new Date().toISOString()
  },
  {
    id: "gas_008",
    nombre: "Grupo Windstar",
    giro: "gasolinera",
    latitud: 31.7398,
    longitud: -106.4845,
    direccion: "Av. 16 de Septiembre 302, Col. Centro, Cd. Juárez, Chih.",
    telefono: "6566113940",
    contacto: "Sr. Albert Peters",
    estatus: "no_ligado_estrategia",
    asesorId: "juan_id",
    grupoGasolinero: "Grupo Windstar",
    comentariosNoAplica: "Compras corporativas centralizadas desde Monterrey.",
    fechaActualizacion: new Date().toISOString()
  }
];

export const SEED_PLANTTRABAJO: PlanTrabajo[] = [
  {
    id: "plan_001",
    empresaId: "ref_002",
    visitado: true,
    linkCrm360: "https://crm360.alchisa.com/lead/ref_002",
    marcaCompetencia: "Mobil / Castrol",
    oportunidadCreada: true,
    linkOportunidad360: "https://crm360.alchisa.com/opportunity/opp_908",
    cicloCompletado: true
  },
  {
    id: "plan_002",
    empresaId: "gas_002",
    visitado: true,
    linkCrm360: "https://crm360.alchisa.com/lead/gas_002",
    marcaCompetencia: "Roshfrans",
    oportunidadCreada: false,
    motivoNoOportunidad: "Tienen contrato de exclusividad vigente por 2 años.",
    cicloCompletado: true
  },
  {
    id: "plan_003",
    empresaId: "ref_004",
    visitado: false,
    linkCrm360: "",
    marcaCompetencia: "",
    oportunidadCreada: false,
    cicloCompletado: false
  }
];
