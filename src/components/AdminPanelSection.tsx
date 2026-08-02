import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Shield,
  UserPlus,
  Trash2
} from 'lucide-react';
import { Empresa, Giro, Asesor, RolAsesor } from '../types';
import { addEmpresa, addEmpresasBulk, getAsesores, addAsesor, updateAsesor, deleteAsesor } from '../database/dbService';

interface AdminPanelSectionProps {
  currentUser: Asesor;
  onDataChange: () => void;
}

interface ParsedCSVRow {
  rowNum: number;
  nombre: string;
  giro: string;
  latitud: number | null;
  longitud: number | null;
  direccion: string;
  telefono: string;
  contacto: string;
  razonSocial: string;
  grupoGasolinero: string;
  correoAsesor: string;
  asesorId: string | null;
  isValid: boolean;
  error?: string;
}

export default function AdminPanelSection({ currentUser, onDataChange }: AdminPanelSectionProps) {
  const [activeSubTab, setActiveSubTab] = useState<'manual' | 'bulk' | 'admins'>('manual');
  
  // Manual Form States
  const [nombre, setNombre] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [giro, setGiro] = useState<Giro>('refaccionaria');
  const [direccion, setDireccion] = useState('');
  const [latitud, setLatitud] = useState('');
  const [longitud, setLongitud] = useState('');
  const [telefono, setTelefono] = useState('');
  const [contacto, setContacto] = useState('');
  const [grupoGasolinero, setGrupoGasolinero] = useState('');
  const [asesorId, setAsesorId] = useState<string | null>(null);
  
  const [manualSuccess, setManualSuccess] = useState(false);

  // Bulk Load States
  const [parsedRows, setParsedRows] = useState<ParsedCSVRow[]>([]);
  const [csvFileName, setCsvFileName] = useState('');
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState<string | null>(null);
  const [bulkErrorMsg, setBulkErrorMsg] = useState<string | null>(null);

  // Admin Form States
  const [adminNombre, setAdminNombre] = useState('');
  const [adminCorreo, setAdminCorreo] = useState('');
  const [adminRol, setAdminRol] = useState<RolAsesor>('administrador');
  const [adminSuccess, setAdminSuccess] = useState<string | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);

  const allUsers = getAsesores();
  const advisors = allUsers.filter(a => a.rol === 'asesor');

  // --- ADD ADMINISTRATOR / USER ACTION ---
  const handleAddAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminSuccess(null);
    setAdminError(null);

    if (!adminNombre.trim() || !adminCorreo.trim()) {
      setAdminError("Por favor completa el nombre y el correo de Google.");
      return;
    }

    const exists = allUsers.some(a => a.correoGoogle.toLowerCase() === adminCorreo.trim().toLowerCase());
    if (exists) {
      setAdminError(`El correo ${adminCorreo.trim()} ya se encuentra registrado.`);
      return;
    }

    const newAsesor: Asesor = {
      id: `asesor_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      nombre: adminNombre.trim(),
      correoGoogle: adminCorreo.trim(),
      rol: adminRol
    };

    addAsesor(newAsesor);
    setAdminNombre('');
    setAdminCorreo('');
    setAdminRol('administrador');
    setAdminSuccess(`¡${newAsesor.nombre} registrado exitosamente como ${newAsesor.rol === 'administrador' ? 'Administrador' : 'Asesor'}!`);
    
    onDataChange();
  };

  // --- CHANGE USER ROLE ACTION ---
  const handleChangeUserRole = (targetUser: Asesor, newRol: RolAsesor) => {
    if (targetUser.id === currentUser.id) {
      alert("No puedes cambiar tu propio rol mientras estás en sesión.");
      return;
    }
    const updatedUser: Asesor = {
      ...targetUser,
      rol: newRol
    };
    updateAsesor(updatedUser);
    setAdminSuccess(`Rol de ${targetUser.nombre} actualizado a ${newRol === 'administrador' ? 'Administrador' : 'Asesor'}.`);
    onDataChange();
  };

  // --- DELETE USER ACTION ---
  const handleDeleteUser = (userToDelete: Asesor) => {
    if (userToDelete.id === currentUser.id) {
      alert("No puedes revocar tu propio acceso mientras estás en sesión.");
      return;
    }

    if (window.confirm(`¿Estás seguro de revocar el acceso y eliminar a ${userToDelete.nombre} (${userToDelete.correoGoogle}) del directorio?`)) {
      deleteAsesor(userToDelete.id);
      setAdminSuccess(`Acceso revocado para ${userToDelete.nombre}.`);
      onDataChange();
    }
  };

  // --- MANUAL LOAD ACTION ---
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !direccion.trim() || !latitud.trim() || !longitud.trim()) return;

    const newEmpresa: Empresa = {
      id: `man_${Date.now()}`,
      nombre: nombre.trim(),
      razonSocial: razonSocial.trim() || 'N/A',
      giro,
      latitud: parseFloat(latitud),
      longitud: parseFloat(longitud),
      direccion: direccion.trim(),
      telefono: telefono.trim(),
      contacto: contacto.trim(),
      estatus: 'sin_accion',
      asesorId,
      grupoGasolinero: giro === 'gasolinera' ? (grupoGasolinero.trim() || 'Independiente') : undefined,
      fechaActualizacion: new Date().toISOString()
    };

    addEmpresa(newEmpresa);
    setManualSuccess(true);
    
    setNombre('');
    setRazonSocial('');
    setDireccion('');
    setLatitud('');
    setLongitud('');
    setTelefono('');
    setContacto('');
    setGrupoGasolinero('');
    setAsesorId(null);

    onDataChange();

    setTimeout(() => {
      setManualSuccess(false);
    }, 3000);
  };

  // --- CSV TEMPLATE EXPORT ---
  const handleDownloadTemplate = () => {
    const headers = [
      'Nombre',
      'Giro',
      'Latitud',
      'Longitud',
      'Direccion',
      'Telefono',
      'Contacto',
      'RazonSocial',
      'GrupoGasolinero',
      'CorreoAsesor'
    ];

    const sampleRows = [
      ['Refaccionaria La Cúpula', 'refaccionaria', '28.639102', '-106.082049', 'Av. Universidad 491, Col. San Felipe, Chihuahua, Chih.', '6145892301', 'Ing. Pedro Lopez', 'AUTO REFACCIONES LA CUPULA S.A.', '', 'juan.lopez@alchisa.com'],
      ['Taller Automotriz Ruiz', 'taller_mecanico', '31.734560', '-106.412490', 'Av. Triunfo de la Republica 203, Cd. Juarez, Chih.', '6561234567', 'Sr. Mario Ruiz', 'TALLER MECANICO RUIZ S.A. DE C.V.', '', 'maria.gomez@alchisa.com'],
      ['Gasolinera Pemex Juventud', 'gasolinera', '28.651230', '-106.134560', 'Av. Periferico de la Juventud 4500, Chihuahua, Chih.', '6149876543', 'Lic. Diana Soto', 'SERVICIOS GASOLINEROS DE CHIHUAHUA', 'Grupo Pemex', 'juan.lopez@alchisa.com']
    ];

    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...sampleRows.map(r => r.map(val => {
        let strVal = String(val);
        if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
          strVal = `"${strVal.replace(/"/g, '""')}"`;
        }
        return strVal;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'plantilla-denue-pv.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- CSV PARSING LOGIC ---
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    setBulkSuccessMsg(null);
    setBulkErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) {
        setBulkErrorMsg("El archivo está vacío o es ilegible.");
        return;
      }

      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      if (lines.length <= 1) {
        setBulkErrorMsg("El archivo no contiene filas de datos.");
        return;
      }

      const parsed: ParsedCSVRow[] = [];
      const currentAsesores = getAsesores();

      const parseCSVLine = (lineText: string) => {
        let p = '', r = [];
        let q = false;
        for (let i = 0; i < lineText.length; i++) {
          let c = lineText[i];
          if (c === '"') {
            q = !q;
          } else if (c === ',' && !q) {
            r.push(p);
            p = '';
          } else {
            p += c;
          }
        }
        r.push(p);
        return r;
      };

      for (let i = 1; i < lines.length; i++) {
        const columns = parseCSVLine(lines[i]);
        const nombreCol = columns[0] || '';
        const giroCol = (columns[1] || '').trim().toLowerCase();
        const latColStr = columns[2] || '';
        const lngColStr = columns[3] || '';
        const dirCol = columns[4] || '';
        const telCol = columns[5] || '';
        const contCol = columns[6] || '';
        const razonCol = columns[7] || '';
        const groupCol = columns[8] || '';
        const correoAsesorCol = (columns[9] || '').trim().toLowerCase();

        const latVal = parseFloat(latColStr);
        const lngVal = parseFloat(lngColStr);

        let isValid = true;
        let errorMsg = '';
        let matchedAsesorId: string | null = null;

        if (correoAsesorCol) {
          const foundAsesor = currentAsesores.find(a => a.correoGoogle.toLowerCase() === correoAsesorCol);
          if (foundAsesor) {
            matchedAsesorId = foundAsesor.id;
          }
        }

        if (!nombreCol.trim()) {
          isValid = false;
          errorMsg = 'Nombre vacío';
        } else if (giroCol !== 'refaccionaria' && giroCol !== 'taller_mecanico' && giroCol !== 'gasolinera') {
          isValid = false;
          errorMsg = `Giro inválido (${giroCol})`;
        } else if (isNaN(latVal) || isNaN(lngVal)) {
          isValid = false;
          errorMsg = 'Coordenadas GPS inválidas';
        } else if (!dirCol.trim()) {
          isValid = false;
          errorMsg = 'Dirección vacía';
        }

        parsed.push({
          rowNum: i + 1,
          nombre: nombreCol,
          giro: giroCol,
          latitud: isNaN(latVal) ? null : latVal,
          longitud: isNaN(lngVal) ? null : lngVal,
          direccion: dirCol,
          telefono: telCol,
          contacto: contCol,
          razonSocial: razonCol || 'N/A',
          grupoGasolinero: groupCol,
          correoAsesor: correoAsesorCol,
          asesorId: matchedAsesorId,
          isValid,
          error: errorMsg
        });
      }

      setParsedRows(parsed);
    };

    reader.readAsText(file, 'UTF-8');
  };

  // --- SAVE BULK IMPORT ---
  const handleCommitBulk = () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) return;

    const newEmpresas: Empresa[] = validRows.map((r, idx) => ({
      id: `csv_${Date.now()}_${idx}`,
      nombre: r.nombre.trim(),
      razonSocial: r.razonSocial.trim(),
      giro: r.giro as Giro,
      latitud: r.latitud!,
      longitud: r.longitud!,
      direccion: r.direccion.trim(),
      telefono: r.telefono.trim(),
      contacto: r.contacto.trim(),
      estatus: 'sin_accion',
      asesorId: r.asesorId,
      grupoGasolinero: r.giro === 'gasolinera' ? (r.grupoGasolinero.trim() || 'Independiente') : undefined,
      fechaActualizacion: new Date().toISOString()
    }));

    addEmpresasBulk(newEmpresas);
    setBulkSuccessMsg(`Se importaron con éxito ${newEmpresas.length} empresas a la base de datos.`);
    
    setParsedRows([]);
    setCsvFileName('');
    onDataChange();
  };

  const totalValid = parsedRows.filter(r => r.isValid).length;
  const totalInvalid = parsedRows.filter(r => !r.isValid).length;

  return (
    <div className="flex-1 flex flex-col bg-white border border-[#EAEAEA] rounded-xl overflow-hidden shadow-sm h-full max-h-[calc(100vh-80px)] select-none">
      
      {/* Tab Select Header */}
      <div className="p-4 border-b border-[#EAEAEA] bg-[#FBFBFA] flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <FileSpreadsheet className="w-5 h-5 text-blue-700" />
          <div>
            <h3 className="font-display font-bold text-sm text-[#37352F] uppercase tracking-wide leading-none">
              Panel de Carga Administrativa
            </h3>
            <span className="text-[9px] text-[#7C7B77] mt-1 block">
              Supervisor: {currentUser.nombre}
            </span>
          </div>
        </div>

        <div className="flex bg-neutral-100 p-0.5 rounded-lg border border-neutral-200">
          <button
            onClick={() => setActiveSubTab('manual')}
            className={`px-3 py-1.2 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
              activeSubTab === 'manual' 
                ? 'bg-white text-[#37352F] shadow-xs' 
                : 'text-[#7C7B77] hover:text-[#37352F]'
            }`}
          >
            Carga Manual
          </button>
          <button
            onClick={() => setActiveSubTab('bulk')}
            className={`px-3 py-1.2 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
              activeSubTab === 'bulk' 
                ? 'bg-white text-[#37352F] shadow-xs' 
                : 'text-[#7C7B77] hover:text-[#37352F]'
            }`}
          >
            Importación Masiva CSV
          </button>
          <button
            onClick={() => setActiveSubTab('admins')}
            className={`px-3 py-1.2 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'admins' 
                ? 'bg-white text-[#37352F] shadow-xs' 
                : 'text-[#7C7B77] hover:text-[#37352F]'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-blue-700" />
            Administradores & Usuarios
          </button>
        </div>
      </div>

      {/* Main Body container */}
      <div className="flex-1 overflow-y-auto p-6 bg-neutral-50/20 custom-scrollbar">
        
        {/* TAB 1: MANUAL FORM */}
        {activeSubTab === 'manual' && (
          <div className="max-w-xl mx-auto bg-white border border-[#EAEAEA] rounded-xl shadow-xs p-6 space-y-6">
            <div className="space-y-1">
              <h4 className="font-display font-bold text-sm text-[#37352F] flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-blue-700" />
                Registrar Nueva Empresa Manualmente
              </h4>
              <p className="text-[11px] text-[#7C7B77]">
                Ingresa los datos generales para dar de alta una refaccionaria, taller o gasolinera en Chihuahua.
              </p>
            </div>

            {manualSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Empresa registrada correctamente en la base de datos local.</span>
              </div>
            )}

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#7C7B77] uppercase block">
                    Nombre Comercial *
                  </label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Refaccionaria La Unión"
                    className="w-full px-3 py-1.8 bg-white border border-[#EAEAEA] hover:border-[#CCCCCC] focus:border-blue-600 rounded-lg text-xs focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#7C7B77] uppercase block">
                    Razón Social
                  </label>
                  <input
                    type="text"
                    value={razonSocial}
                    onChange={(e) => setRazonSocial(e.target.value)}
                    placeholder="Ej. UNION REFACCIONES S.A."
                    className="w-full px-3 py-1.8 bg-white border border-[#EAEAEA] hover:border-[#CCCCCC] focus:border-blue-600 rounded-lg text-xs focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#7C7B77] uppercase block">
                    Giro de Negocio *
                  </label>
                  <select
                    value={giro}
                    onChange={(e) => setGiro(e.target.value as Giro)}
                    className="w-full px-3 py-1.8 bg-white border border-[#EAEAEA] hover:border-[#CCCCCC] focus:border-blue-600 rounded-lg text-xs focus:outline-none transition-all"
                  >
                    <option value="refaccionaria">Refaccionaria</option>
                    <option value="taller_mecanico">Taller Mecánico</option>
                    <option value="gasolinera">Gasolinera</option>
                  </select>
                </div>

                {giro === 'gasolinera' ? (
                  <div className="space-y-1 animate-in fade-in duration-150">
                    <label className="text-[10px] font-bold text-[#7C7B77] uppercase block">
                      Grupo Gasolinero *
                    </label>
                    <input
                      type="text"
                      required
                      value={grupoGasolinero}
                      onChange={(e) => setGrupoGasolinero(e.target.value)}
                      placeholder="Ej. Grupo Pemex, Oxxo Gas..."
                      className="w-full px-3 py-1.8 bg-white border border-[#EAEAEA] hover:border-[#CCCCCC] focus:border-blue-600 rounded-lg text-xs focus:outline-none transition-all"
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#7C7B77] uppercase block">
                      Asesor Asignado
                    </label>
                    <select
                      value={asesorId || ''}
                      onChange={(e) => setAsesorId(e.target.value === '' ? null : e.target.value)}
                      className="w-full px-3 py-1.8 bg-white border border-[#EAEAEA] hover:border-[#CCCCCC] focus:border-blue-600 rounded-lg text-xs focus:outline-none transition-all"
                    >
                      <option value="">No asesor (Sin asignar)</option>
                      {advisors.map(a => (
                        <option key={a.id} value={a.id}>{a.nombre}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#7C7B77] uppercase block">
                  Dirección del Establecimiento *
                </label>
                <input
                  type="text"
                  required
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Calle, Número, Colonia, Municipio, Chihuahua"
                  className="w-full px-3 py-1.8 bg-white border border-[#EAEAEA] hover:border-[#CCCCCC] focus:border-blue-600 rounded-lg text-xs focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#7C7B77] uppercase block">
                    Latitud (Coordenadas) *
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={latitud}
                    onChange={(e) => setLatitud(e.target.value)}
                    placeholder="Ej. 28.635300"
                    className="w-full px-3 py-1.8 bg-white border border-[#EAEAEA] hover:border-[#CCCCCC] focus:border-blue-600 rounded-lg text-xs focus:outline-none transition-all font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#7C7B77] uppercase block">
                    Longitud (Coordenadas) *
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={longitud}
                    onChange={(e) => setLongitud(e.target.value)}
                    placeholder="Ej. -106.088900"
                    className="w-full px-3 py-1.8 bg-white border border-[#EAEAEA] hover:border-[#CCCCCC] focus:border-blue-600 rounded-lg text-xs focus:outline-none transition-all font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#7C7B77] uppercase block">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="Número de 10 dígitos"
                    className="w-full px-3 py-1.8 bg-white border border-[#EAEAEA] hover:border-[#CCCCCC] focus:border-blue-600 rounded-lg text-xs focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#7C7B77] uppercase block">
                    Persona de Contacto
                  </label>
                  <input
                    type="text"
                    value={contacto}
                    onChange={(e) => setContacto(e.target.value)}
                    placeholder="Nombre del contacto..."
                    className="w-full px-3 py-1.8 bg-white border border-[#EAEAEA] hover:border-[#CCCCCC] focus:border-blue-600 rounded-lg text-xs focus:outline-none transition-all"
                  />
                </div>
              </div>

              {giro === 'gasolinera' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#7C7B77] uppercase block">
                    Asesor Asignado
                  </label>
                  <select
                    value={asesorId || ''}
                    onChange={(e) => setAsesorId(e.target.value === '' ? null : e.target.value)}
                    className="w-full px-3 py-1.8 bg-white border border-[#EAEAEA] hover:border-[#CCCCCC] focus:border-blue-600 rounded-lg text-xs focus:outline-none transition-all"
                  >
                    <option value="">No asesor (Sin asignar)</option>
                    {advisors.map(a => (
                      <option key={a.id} value={a.id}>{a.nombre}</option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer pt-2"
              >
                <Plus className="w-4 h-4" />
                Registrar Empresa
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: BULK IMPORT */}
        {activeSubTab === 'bulk' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white border border-[#EAEAEA] rounded-xl p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1.5">
                <h4 className="font-display font-bold text-sm text-[#37352F] flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-blue-700" />
                  Carga Masiva de Empresas vía CSV
                </h4>
                <p className="text-[11px] text-[#7C7B77] max-w-xl leading-normal">
                  Descarga nuestra plantilla estándar, llénala con los datos de las refaccionarias, talleres y gasolineras, y súbela aquí.
                </p>
              </div>

              <button
                onClick={handleDownloadTemplate}
                className="py-2 px-3.5 bg-neutral-100 hover:bg-[#EFEFED] text-[#37352F] rounded-lg border border-neutral-200 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4 text-blue-700" />
                Descargar Plantilla
              </button>
            </div>

            {bulkSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-250 rounded-lg text-emerald-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                <span>{bulkSuccessMsg}</span>
              </div>
            )}

            {bulkErrorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-250 rounded-lg text-rose-600 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                <XCircle className="w-4.5 h-4.5 text-rose-600 shrink-0" />
                <span>{bulkErrorMsg}</span>
              </div>
            )}

            <div className="border-2 border-dashed border-[#EAEAEA] hover:border-blue-200 bg-white rounded-2xl p-8 text-center relative transition-all group flex flex-col items-center justify-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="p-3 bg-blue-50 rounded-full text-blue-700 mb-3 group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-[#37352F] block">
                {csvFileName ? `Archivo cargado: ${csvFileName}` : 'Arrastra tu archivo CSV aquí o haz clic para buscar'}
              </span>
              <span className="text-[10px] text-[#7C7B77] block mt-1">
                Solo archivos .csv delimitados por comas en formato UTF-8
              </span>
            </div>

            {parsedRows.length > 0 && (
              <div className="bg-white border border-[#EAEAEA] rounded-xl overflow-hidden shadow-xs space-y-4 p-5 animate-in fade-in duration-250">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-[#EAEAEA]">
                  <div className="flex items-center gap-4 text-xs font-bold text-[#37352F]">
                    <span>Filas leídas: {parsedRows.length}</span>
                    <span className="text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Válidos: {totalValid}
                    </span>
                    {totalInvalid > 0 && (
                      <span className="text-rose-500 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        Errores: {totalInvalid}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={handleCommitBulk}
                    disabled={totalValid === 0}
                    className="py-1.8 px-4 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Confirmar Carga de {totalValid} Empresas
                  </button>
                </div>

                <div className="overflow-x-auto max-h-[300px] overflow-y-auto custom-scrollbar border border-[#EAEAEA] rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-neutral-50 border-b border-[#EAEAEA] text-[9px] text-[#7C7B77] font-bold uppercase tracking-wider sticky top-0 z-10">
                        <th className="p-2.5 text-center">Fila</th>
                        <th className="p-2.5">Estatus</th>
                        <th className="p-2.5">Nombre</th>
                        <th className="p-2.5">Giro</th>
                        <th className="p-2.5">Asesor Asignado</th>
                        <th className="p-2.5">GPS (Lat/Lng)</th>
                        <th className="p-2.5">Dirección</th>
                        <th className="p-2.5">Detalles</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.map((row, idx) => (
                        <tr 
                          key={idx}
                          className={`border-b border-[#F1F1EF] last:border-0 text-[11px] ${
                            row.isValid ? 'hover:bg-[#FBFBFA]' : 'bg-rose-50/20 hover:bg-rose-50/30'
                          }`}
                        >
                          <td className="p-2.5 text-center font-mono text-[#7C7B77] font-medium">
                            {row.rowNum}
                          </td>
                          <td className="p-2.5 text-center">
                            {row.isValid ? (
                              <span className="inline-flex items-center text-emerald-600 font-bold" title="Línea correcta">
                                <CheckCircle2 className="w-4.5 h-4.5" />
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-rose-500 font-bold" title={row.error}>
                                <XCircle className="w-4.5 h-4.5" />
                              </span>
                            )}
                          </td>
                          <td className={`p-2.5 font-semibold ${row.isValid ? 'text-[#37352F]' : 'text-rose-700'}`}>
                            {row.nombre || <span className="text-rose-400 italic">Vacío</span>}
                          </td>
                          <td className="p-2.5 text-[#7C7B77] capitalize">
                            {row.giro ? row.giro.replace('_', ' ') : <span className="text-rose-400 italic">Vacío</span>}
                          </td>
                          <td className="p-2.5 text-[#7C7B77]">
                            {row.correoAsesor ? (
                              row.asesorId ? (
                                <span className="text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px]">
                                  {row.correoAsesor}
                                </span>
                              ) : (
                                <span className="text-amber-700 font-semibold bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded text-[10px]">
                                  {row.correoAsesor} (No reg.)
                                </span>
                              )
                            ) : (
                              <span className="text-neutral-400 italic text-[10px]">Sin asignar</span>
                            )}
                          </td>
                          <td className="p-2.5 font-mono text-[#7C7B77]">
                            {row.latitud !== null && row.longitud !== null 
                              ? `${row.latitud.toFixed(4)}, ${row.longitud.toFixed(4)}`
                              : <span className="text-rose-400 font-sans italic">Error GPS</span>}
                          </td>
                          <td className="p-2.5 text-[#7C7B77] max-w-xs truncate" title={row.direccion}>
                            {row.direccion || <span className="text-rose-400 italic">Vacío</span>}
                          </td>
                          <td className="p-2.5 text-[#7C7B77] font-semibold text-[10px]">
                            {row.isValid ? (
                              row.giro === 'gasolinera' && row.grupoGasolinero 
                                ? `Grupo: ${row.grupoGasolinero}` 
                                : 'Listo'
                            ) : (
                              <span className="text-rose-600 font-bold bg-rose-50 border border-rose-100 px-1.5 py-0.2 rounded">
                                {row.error}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalInvalid > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[10px] leading-normal flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Advertencia sobre datos erróneos:</strong> El archivo contiene {totalInvalid} filas inválidas. Puedes continuar con la importación; el sistema omitirá automáticamente las líneas con error.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ADMINISTRATORS & REGISTERED USERS */}
        {activeSubTab === 'admins' && (
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Form Card: Add Administrator */}
            <div className="bg-white border border-[#EAEAEA] rounded-xl shadow-xs p-6 space-y-5">
              <div className="space-y-1">
                <h4 className="font-display font-bold text-sm text-[#37352F] flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-blue-700" />
                  Registrar Nuevo Administrador o Asesor
                </h4>
                <p className="text-[11px] text-[#7C7B77]">
                  Registra un correo oficial de Google Workspace para autorizar su ingreso a la plataforma.
                </p>
              </div>

              {adminSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{adminSuccess}</span>
                </div>
              )}

              {adminError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{adminError}</span>
                </div>
              )}

              <form onSubmit={handleAddAdminSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#7C7B77] uppercase block">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={adminNombre}
                      onChange={(e) => setAdminNombre(e.target.value)}
                      placeholder="Ej. María Elena Torres"
                      className="w-full px-3 py-1.8 bg-white border border-[#EAEAEA] hover:border-[#CCCCCC] focus:border-blue-600 rounded-lg text-xs focus:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#7C7B77] uppercase block">
                      Correo de Google Workspace *
                    </label>
                    <input
                      type="email"
                      required
                      value={adminCorreo}
                      onChange={(e) => setAdminCorreo(e.target.value)}
                      placeholder="maria.torres@alchisa.com"
                      className="w-full px-3 py-1.8 bg-white border border-[#EAEAEA] hover:border-[#CCCCCC] focus:border-blue-600 rounded-lg text-xs focus:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#7C7B77] uppercase block">
                      Rol de Permisos *
                    </label>
                    <select
                      value={adminRol}
                      onChange={(e) => setAdminRol(e.target.value as RolAsesor)}
                      className="w-full px-3 py-1.8 bg-white border border-[#EAEAEA] hover:border-[#CCCCCC] focus:border-blue-600 rounded-lg text-xs focus:outline-none transition-all"
                    >
                      <option value="administrador">🛡️ Administrador (Acceso Total)</option>
                      <option value="asesor">👥 Asesor Comercial (Prospectador)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="py-2 px-5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    Registrar Usuario
                  </button>
                </div>
              </form>
            </div>

            {/* Table / List Card: Current Registered Users */}
            <div className="bg-white border border-[#EAEAEA] rounded-xl shadow-xs p-6 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-[#EAEAEA]">
                <div>
                  <h4 className="font-display font-bold text-sm text-[#37352F] flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-700" />
                    Directorio de Administradores y Usuarios Registrados
                  </h4>
                  <span className="text-[10px] text-[#7C7B77]">
                    Cuentas autorizadas para ingresar a la plataforma DENUE PV.
                  </span>
                </div>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 font-mono">
                  {allUsers.length} Usuarios Autorizados
                </span>
              </div>

              <div className="overflow-x-auto border border-[#EAEAEA] rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-[#EAEAEA] text-[9px] text-[#7C7B77] font-bold uppercase tracking-wider">
                      <th className="p-3">Nombre</th>
                      <th className="p-3">Correo Google</th>
                      <th className="p-3">Rol</th>
                      <th className="p-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map((u) => (
                      <tr key={u.id} className="border-b border-[#F1F1EF] last:border-0 hover:bg-[#FBFBFA] transition-colors">
                        <td className="p-3 font-semibold text-[#37352F]">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-neutral-100 font-bold text-[10px] flex items-center justify-center text-[#7C7B77]">
                              {u.nombre.charAt(0)}
                            </div>
                            <span>{u.nombre}</span>
                          </div>
                        </td>
                        <td className="p-3 text-[#7C7B77] font-mono text-[11px]">{u.correoGoogle}</td>
                        <td className="p-3">
                          {u.id === currentUser.id ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full uppercase">
                              <Shield className="w-3 h-3" />
                              Administrador (Tú)
                            </span>
                          ) : (
                            <select
                              value={u.rol}
                              onChange={(e) => handleChangeUserRole(u, e.target.value as RolAsesor)}
                              className="px-2 py-1 text-[10px] font-bold rounded-lg border border-[#EAEAEA] bg-white text-[#37352F] cursor-pointer focus:outline-none focus:border-blue-600 shadow-2xs"
                            >
                              <option value="asesor">👤 Asesor de Ventas</option>
                              <option value="administrador">🛡️ Administrador</option>
                            </select>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {u.id !== currentUser.id ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Revocar acceso y eliminar usuario"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="text-[9px] text-[#7C7B77] italic font-semibold">Sesión Actual</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
