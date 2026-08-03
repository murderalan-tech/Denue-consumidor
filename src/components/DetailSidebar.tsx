import React, { useState, useEffect } from 'react';
import { X, Phone, User, Tag, Save, MapPin, RotateCcw } from 'lucide-react';
import { Empresa, Asesor, EstatusPros, ESTATUS_LABELS, GIRO_LABELS } from '../types';
import { getAsesores, deletePlanTrabajoByEmpresa } from '../database/dbService';

interface DetailSidebarProps {
  empresa: Empresa | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: Asesor;
  onSave: (updated: Empresa) => void;
}

export default function DetailSidebar({ empresa, isOpen, onClose, currentUser, onSave }: DetailSidebarProps) {
  const [telefono, setTelefono] = useState('');
  const [contacto, setContacto] = useState('');
  const [estatus, setEstatus] = useState<EstatusPros>('sin_accion');
  const [asesorId, setAsesorId] = useState<string | null>(null);

  const asesores = getAsesores().filter(a => a.rol === 'asesor');
  const isAdmin = currentUser.rol === 'administrador';

  // Sync state with selected company
  useEffect(() => {
    if (empresa) {
      setTelefono(empresa.telefono || '');
      setContacto(empresa.contacto || '');
      setEstatus(empresa.estatus || 'sin_accion');
      setAsesorId(empresa.asesorId);
    }
  }, [empresa]);

  if (!empresa || !isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...empresa,
      telefono,
      contacto,
      estatus,
      asesorId
    });
  };

  const handleOpenGoogleMaps = () => {
    if (empresa.latitud && empresa.longitud) {
      const url = `https://www.google.com/maps/search/?api=1&query=${empresa.latitud},${empresa.longitud}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleResetCycle = () => {
    if (window.confirm(`¿Estás seguro de reiniciar el ciclo de prospección para "${empresa.nombre}"? Se borrarán los datos registrados del plan de trabajo y la empresa volverá a la lista de prospectos validados.`)) {
      // 1. Delete work plan entry
      deletePlanTrabajoByEmpresa(empresa.id);

      // 2. Clear company competitor brand and set status to prospecto_real
      const updatedEmpresa: Empresa = {
        ...empresa,
        estatus: 'prospecto_real',
        marcaCompetencia: '',
        fechaActualizacion: new Date().toISOString()
      };

      setEstatus('prospecto_real');
      onSave(updatedEmpresa);
      onClose();
    }
  };

  const getAssignedAsesorName = () => {
    if (!empresa.asesorId) return 'No asesor';
    const all = getAsesores();
    const found = all.find(a => a.id === empresa.asesorId);
    return found ? found.nombre : 'No asesor';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      
      {/* Dimmed backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/35 backdrop-blur-xs transition-opacity duration-300"
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-[#EAEAEA] z-10 animate-in slide-in-from-right duration-250">
        
        {/* Header */}
        <div className="p-6 border-b border-[#EAEAEA] flex justify-between items-start">
          <div className="space-y-1 pr-6">
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-[#F1F1EF] text-[#7C7B77] px-2 py-0.5 rounded font-mono font-semibold">
                ID: {empresa.id}
              </span>
              <span className="text-[10px] text-[#7C7B77] font-semibold">
                {GIRO_LABELS[empresa.giro]}
              </span>
            </div>
            <h3 className="font-display font-bold text-base text-[#37352F] leading-tight">
              {empresa.nombre}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-[#EFEFED] rounded text-[#7C7B77] transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          {/* Status Prospectado Banner and Reset Cycle Action */}
          {empresa.estatus === 'prospectado' && (
            <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-900 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-purple-600 rounded-full inline-block"></span>
                  Ciclo de prospección concluido
                </span>
              </div>
              <p className="text-[11px] text-purple-700 leading-relaxed">
                Esta empresa ya completó su ciclo de prospección (estatus PROSPECTADO). Puedes reiniciar el ciclo si necesitas realizar una nueva labor comercial.
              </p>
              <button
                type="button"
                onClick={handleResetCycle}
                className="w-full mt-1 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reiniciar Ciclo
              </button>
            </div>
          )}

          {/* Read-Only Details */}
          <div className="space-y-3 p-4 bg-[#F7F7F5] rounded-lg border border-[#EAEAEA] text-xs">
            <div className="grid grid-cols-3">
              <span className="text-[#7C7B77] font-semibold">Dirección</span>
              <span className="col-span-2 text-[#37352F]">{empresa.direccion}</span>
            </div>
            <div className="grid grid-cols-3">
              <span className="text-[#7C7B77] font-semibold">Giro</span>
              <span className="col-span-2 text-[#37352F] capitalize">{empresa.giro.replace('_', ' ')}</span>
            </div>
            {empresa.grupoGasolinero && (
              <div className="grid grid-cols-3">
                <span className="text-[#7C7B77] font-semibold">Grupo</span>
                <span className="col-span-2 text-[#37352F] font-bold">{empresa.grupoGasolinero}</span>
              </div>
            )}
            <div className="grid grid-cols-3 items-center">
              <span className="text-[#7C7B77] font-semibold">GPS / Ubicación</span>
              <div className="col-span-2 flex items-center justify-between gap-2">
                <span className="text-[#7C7B77] font-mono text-[11px]">{empresa.latitud}, {empresa.longitud}</span>
                <button
                  type="button"
                  onClick={handleOpenGoogleMaps}
                  className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 hover:border-blue-300 rounded text-[10px] font-bold transition-all flex items-center gap-1 shadow-2xs shrink-0 cursor-pointer"
                >
                  <MapPin className="w-3 h-3 text-blue-600" />
                  MAPS
                </button>
              </div>
            </div>
          </div>

          {/* Contact Fields */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#7C7B77] pb-1 border-b border-[#EAEAEA]">
              Datos de Contacto
            </h4>

            {/* Teléfono */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#37352F] flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#7C7B77]" />
                Teléfono de Contacto
              </label>
              <input
                type="text"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ingresa número de teléfono..."
                className="w-full px-3 py-2 bg-white border border-[#EAEAEA] hover:border-[#CCCCCC] focus:border-blue-600 rounded-lg text-xs focus:outline-none transition-all"
              />
            </div>

            {/* Persona de Contacto */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#37352F] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#7C7B77]" />
                Persona de Contacto
              </label>
              <input
                type="text"
                value={contacto}
                onChange={(e) => setContacto(e.target.value)}
                placeholder="Nombre de la persona encargada..."
                className="w-full px-3 py-2 bg-white border border-[#EAEAEA] hover:border-[#CCCCCC] focus:border-blue-600 rounded-lg text-xs focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Prospection Status */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#7C7B77] pb-1 border-b border-[#EAEAEA]">
              Estatus de Prospección
            </h4>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#37352F] flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#7C7B77]" />
                Estatus Comercial
              </label>
              <select
                value={estatus}
                onChange={(e) => setEstatus(e.target.value as EstatusPros)}
                className="w-full px-3 py-2 bg-white border border-[#EAEAEA] hover:border-[#CCCCCC] focus:border-blue-600 rounded-lg text-xs focus:outline-none transition-all"
              >
                {Object.entries(ESTATUS_LABELS)
                  .filter(([key]) => !(empresa.giro === 'refaccionaria' && key === 'cliente_de_cliente'))
                  .map(([key, details]) => (
                  <option key={key} value={key}>
                    {details.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Advisor Assignment (Admin Only vs Read-Only) */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#7C7B77] pb-1 border-b border-[#EAEAEA]">
              Asesor Comercial
            </h4>

            {isAdmin ? (
              <div className="space-y-1 bg-blue-50/20 border border-blue-200/50 p-3 rounded-lg">
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wide block mb-1">
                  Control de Supervisor (Reasignar)
                </span>
                <select
                  value={asesorId || ''}
                  onChange={(e) => setAsesorId(e.target.value === '' ? null : e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-blue-200 hover:border-blue-300 rounded-lg text-xs focus:outline-none"
                >
                  <option value="">No asesor (Sin asignar)</option>
                  {asesores.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.nombre} ({a.correoGoogle})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-[#37352F] p-3 bg-neutral-50 border border-neutral-100 rounded-lg">
                <span className="font-semibold text-[#7C7B77]">Asignado a:</span>
                <span className="font-bold">{getAssignedAsesorName()}</span>
                {!empresa.asesorId && (
                  <span className="px-1.5 py-0.5 bg-neutral-200 text-neutral-600 rounded text-[9px] font-bold">
                    No asesor
                  </span>
                )}
              </div>
            )}
          </div>

        </form>

        {/* Footer Actions */}
        <div className="p-6 border-t border-[#EAEAEA] bg-[#F7F7F5] flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 border border-[#EAEAEA] bg-white hover:bg-[#F1F1EF] rounded-lg text-xs text-[#37352F] font-semibold transition-colors cursor-pointer text-center"
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            onClick={handleSubmit}
            className="flex-1 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            Guardar Cambios
          </button>
        </div>

      </div>

    </div>
  );
}
