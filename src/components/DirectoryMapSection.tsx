import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { Empresa, Asesor, EstatusPros, ESTATUS_LABELS } from '../types';
import { getAsesores } from '../database/dbService';

interface DirectoryMapSectionProps {
  giro: 'refaccionaria' | 'taller_mecanico';
  empresas: Empresa[];
  currentUser: Asesor;
  onSelectEmpresa: (empresa: Empresa) => void;
}

export default function DirectoryMapSection({ giro, empresas, currentUser, onSelectEmpresa }: DirectoryMapSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [asesorFilter, setAsesorFilter] = useState<string>('all');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);

  const L = (window as any).L;
  const asesores = getAsesores().filter(a => a.rol === 'asesor');
  const isAdmin = currentUser.rol === 'administrador';

  // 1. Filter Leads list strictly by Giro ('refaccionaria' | 'taller_mecanico'), Advisor Role and search inputs
  const filteredEmpresas = empresas.filter(emp => {
    // Giro filter: ONLY show companies matching this section's giro!
    if (emp.giro !== giro) {
      return false;
    }

    // Role filter
    if (!isAdmin && emp.asesorId !== currentUser.id) {
      return false;
    }
    
    // Search text filter
    const matchesSearch = 
      emp.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.direccion.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus = statusFilter === 'all' || emp.estatus === statusFilter;

    // Advisor filter (Admin only)
    let matchesAsesor = true;
    if (isAdmin) {
      if (asesorFilter === 'unassigned') {
        matchesAsesor = emp.asesorId === null;
      } else if (asesorFilter !== 'all') {
        matchesAsesor = emp.asesorId === asesorFilter;
      }
    }

    return matchesSearch && matchesStatus && matchesAsesor;
  });

  // 2. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center of Chihuahua State
    mapInstanceRef.current = L.map(mapContainerRef.current, {
      center: [28.6353, -106.0889],
      zoom: 12,
      zoomControl: true
    });

    // Light theme tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(mapInstanceRef.current);

    layerGroupRef.current = L.layerGroup().addTo(mapInstanceRef.current);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 3. Update Markers when listings change
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;

    const L = (window as any).L;
    layerGroupRef.current.clearLayers();

    if (filteredEmpresas.length > 0) {
      const bounds: any[] = [];

      filteredEmpresas.forEach(emp => {
        if (!emp.latitud || !emp.longitud) return;

        // Determine color based on status
        const statusColors: Record<EstatusPros, string> = {
          sin_accion: '#9ca3af',       // Gray
          cliente: '#10b981',          // Emerald
          prospecto_validado: '#3b82f6', // Blue
          cliente_de_cliente: '#f59e0b', // Amber
          no_aplica: '#6b7280',        // Slate
          no_existe: '#ef4444'         // Red
        };

        const color = statusColors[emp.estatus] || '#9ca3af';

        // Custom Leaflet pin icon matching status
        const customIcon = L.divIcon({
          className: 'custom-leaflet-marker-pv',
          html: `<div class="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-md transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all hover:scale-125" style="background-color: ${color};">
                   <div class="w-2 h-2 bg-white rounded-full"></div>
                 </div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const marker = L.marker([emp.latitud, emp.longitud], { icon: customIcon })
          .addTo(layerGroupRef.current);

        const popupContent = `
          <div class="p-1 select-none">
            <h4 class="font-bold text-xs text-[#37352F] leading-tight mb-1">${emp.nombre}</h4>
            <p class="text-[10px] text-[#7C7B77] mb-2">${emp.direccion}</p>
            <button 
              id="map-btn-${emp.id}"
              class="w-full py-1 bg-blue-700 hover:bg-blue-800 text-white rounded text-[10px] font-semibold transition-colors cursor-pointer text-center"
            >
              Ver Detalle CRM
            </button>
          </div>
        `;

        marker.bindPopup(popupContent, { minWidth: 160 });
        bounds.push([emp.latitud, emp.longitud]);

        marker.on('popupopen', () => {
          const btn = document.getElementById(`map-btn-${emp.id}`);
          if (btn) {
            btn.onclick = () => {
              onSelectEmpresa(emp);
              marker.closePopup();
            };
          }
        });
      });

      // Fit map bounds to show matches
      if (bounds.length > 0) {
        mapInstanceRef.current.fitBounds(L.latLngBounds(bounds), {
          padding: [40, 40],
          maxZoom: 14
        });
      }
    }
  }, [filteredEmpresas]);

  return (
    <div className="flex-1 flex flex-col md:flex-row gap-5 h-[calc(100vh-80px)] overflow-hidden">
      
      {/* Left panel: Filters and Cards List */}
      <div className="w-full md:w-80 shrink-0 flex flex-col bg-white border border-[#EAEAEA] rounded-xl overflow-hidden shadow-sm h-full">
        
        {/* Filters Header */}
        <div className="p-4 border-b border-[#EAEAEA] bg-[#FBFBFA] space-y-3">
          
          {/* Search text */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#EAEAEA] rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 placeholder-[#CCCCCC]"
            />
            <Search className="w-3.5 h-3.5 text-[#7C7B77] absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>

          {/* Status select */}
          <div className="grid grid-cols-1 gap-2">
            <div>
              <span className="text-[9px] font-bold text-[#7C7B77] uppercase block mb-1">Filtrar Estatus</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-2 py-1 bg-white border border-[#EAEAEA] rounded text-xs focus:outline-none"
              >
                <option value="all">Todos los estatus</option>
                {Object.entries(ESTATUS_LABELS).map(([key, details]) => (
                  <option key={key} value={key}>{details.label}</option>
                ))}
              </select>
            </div>

            {/* Advisor select (Admin only) */}
            {isAdmin && (
              <div>
                <span className="text-[9px] font-bold text-[#7C7B77] uppercase block mb-1">Asesor Asignado</span>
                <select
                  value={asesorFilter}
                  onChange={(e) => setAsesorFilter(e.target.value)}
                  className="w-full px-2 py-1 bg-white border border-[#EAEAEA] rounded text-xs focus:outline-none"
                >
                  <option value="all">Todos los asesores</option>
                  <option value="unassigned">No asesor (Sin asignar)</option>
                  {asesores.map(a => (
                    <option key={a.id} value={a.id}>{a.nombre}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar bg-neutral-50/50">
          {filteredEmpresas.length === 0 ? (
            <div className="py-10 text-center text-xs text-[#7C7B77]">
              No se encontraron {giro === 'refaccionaria' ? 'refaccionarias' : 'talleres'}.
            </div>
          ) : (
            filteredEmpresas.map(emp => {
              const estLabel = ESTATUS_LABELS[emp.estatus];
              return (
                <div
                  key={emp.id}
                  onClick={() => onSelectEmpresa(emp)}
                  className="p-3 bg-white border border-[#EAEAEA] hover:border-[#CCCCCC] rounded-lg cursor-pointer transition-all shadow-xs space-y-2 select-none"
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-semibold text-[#37352F] line-clamp-1">
                      {emp.nombre}
                    </span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 ${estLabel.bg} ${estLabel.border} ${estLabel.text}`}>
                      {estLabel.label}
                    </span>
                  </div>
                  
                  <p className="text-[10px] text-[#7C7B77] line-clamp-2 leading-relaxed">
                    {emp.direccion}
                  </p>

                  <div className="flex justify-between items-center text-[9px] pt-1.5 border-t border-[#F1F1EF] text-[#7C7B77]">
                    <span className="truncate max-w-[120px]">
                      👤 {isAdmin ? (asesores.find(a => a.id === emp.asesorId)?.nombre || 'No asesor') : 'Tú'}
                    </span>
                    {emp.telefono && <span className="shrink-0">📞 Activo</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right panel: Leaflet Map */}
      <div className="flex-1 relative bg-white border border-[#EAEAEA] rounded-xl overflow-hidden shadow-sm h-full">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Floating Map Legend */}
        <div className="absolute bottom-4 left-4 z-20 bg-white/95 border border-[#EAEAEA] p-3 rounded-lg shadow-md max-w-xs text-[10px] text-[#37352F] space-y-1.5 pointer-events-none select-none">
          <span className="font-bold text-[#37352F] block">Estatus de Prospectos</span>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#10b981' }} />
              <span>Cliente</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#3b82f6' }} />
              <span>Validado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
              <span>C. de Cliente</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#9ca3af' }} />
              <span>Sin Acción</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
