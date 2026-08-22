import { Empresa, Asesor, GIRO_LABELS, ESTATUS_LABELS } from '../types';

function csvEscape(value: string | number | boolean | null | undefined): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

type Column = { header: string; get: (e: Empresa, asesorName: string, asesorCorreo: string) => string | number | boolean | null | undefined };

const COLUMNS: Column[] = [
  { header: 'ID', get: (e) => e.id },
  { header: 'Nombre', get: (e) => e.nombre },
  { header: 'Razón Social', get: (e) => e.razonSocial },
  { header: 'Giro', get: (e) => GIRO_LABELS[e.giro] || e.giro },
  { header: 'Estatus', get: (e) => ESTATUS_LABELS[e.estatus]?.label || e.estatus },
  { header: 'Dirección', get: (e) => e.direccion },
  { header: 'Ciudad', get: (e) => e.ciudad },
  { header: 'Teléfono', get: (e) => e.telefono },
  { header: 'Contacto', get: (e) => e.contacto },
  { header: 'Latitud', get: (e) => e.latitud },
  { header: 'Longitud', get: (e) => e.longitud },
  { header: 'Asesor Asignado', get: (_e, nombre) => nombre },
  { header: 'Correo Asesor', get: (_e, _n, correo) => correo },
  { header: 'Grupo Gasolinero', get: (e) => e.grupoGasolinero },
  { header: 'Marca Competencia', get: (e) => e.marcaCompetencia },
  { header: 'Link CRM 360', get: (e) => e.linkCrm360 },
  { header: 'Comentarios No Aplica', get: (e) => e.comentariosNoAplica },
  { header: 'Veces Agregado al Plan', get: (e) => e.vecesAgregadoAlPlan },
  { header: 'Plan Link CRM 360', get: (e) => e.planLinkCrm360 },
  { header: 'Plan Oportunidad Creada', get: (e) => e.planOportunidadCreada },
  { header: 'Plan Link Oportunidad 360', get: (e) => e.planLinkOportunidad360 },
  { header: 'Plan Motivo No Oportunidad', get: (e) => e.planMotivoNoOportunidad },
  { header: 'Plan Fecha Inicio', get: (e) => e.planFechaInicio },
  { header: 'Plan Fecha Fin', get: (e) => e.planFechaFin },
  { header: 'Venta Concretada', get: (e) => e.ventaConcretada },
  { header: 'Volumen Primera Venta', get: (e) => e.volumenPrimeraVenta },
  { header: 'Última Actualización', get: (e) => e.fechaActualizacion },
];

/**
 * Genera y descarga un CSV con TODOS los campos de las empresas dadas (tal
 * como viven en Firebase), sin aplicar los filtros de UI de la sección
 * (búsqueda/estatus/ciudad/asesor) — es un respaldo completo, no una
 * exportación de "lo que se ve en pantalla".
 */
export function downloadEmpresasCsv(empresas: Empresa[], asesores: Asesor[], filenamePrefix: string): void {
  const asesorInfo = (asesorId: string | null) => {
    if (!asesorId || asesorId === 'null') return { nombre: 'Sin asignar', correo: '' };
    const found = asesores.find(a => a.id === asesorId);
    return found ? { nombre: found.nombre, correo: found.correoGoogle } : { nombre: 'Asesor desconocido', correo: '' };
  };

  const header = COLUMNS.map(c => csvEscape(c.header)).join(',');
  const rows = empresas.map(emp => {
    const { nombre, correo } = asesorInfo(emp.asesorId);
    return COLUMNS.map(c => csvEscape(c.get(emp, nombre, correo))).join(',');
  });
  const csvContent = [header, ...rows].join('\r\n');

  // BOM al inicio para que Excel detecte UTF-8 y muestre bien los acentos/ñ.
  const BOM = String.fromCharCode(0xFEFF);
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  link.href = url;
  link.download = `${filenamePrefix}_${dateStr}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
