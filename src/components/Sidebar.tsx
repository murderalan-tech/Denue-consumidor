import { 
  Wrench, 
  Settings, 
  Fuel, 
  ClipboardList, 
  LayoutDashboard,
  ShieldCheck
} from 'lucide-react';
import { Asesor } from '../types';
import UserProfileSwitcher from './UserProfileSwitcher';

export type SidebarRoute = 'refaccionarias' | 'talleres' | 'gasolineras' | 'plan_trabajo' | 'dashboard' | 'admin_panel';

interface SidebarProps {
  currentRoute: SidebarRoute;
  onRouteChange: (route: SidebarRoute) => void;
  currentUser: Asesor;
  onUserChange: (user: Asesor) => void;
  onLogout: () => void;
  isCloudActive: boolean;
}

export default function Sidebar({ currentRoute, onRouteChange, currentUser, onUserChange, onLogout, isCloudActive }: SidebarProps) {
  const routes = [
    {
      id: 'refaccionarias' as SidebarRoute,
      label: 'Refaccionarias',
      icon: Settings,
      desc: 'Buscador y geolocalización'
    },
    {
      id: 'talleres' as SidebarRoute,
      label: 'Talleres mecánicos',
      icon: Wrench,
      desc: 'Mapa de talleres mecánicos'
    },
    {
      id: 'gasolineras' as SidebarRoute,
      label: 'Gasolineras',
      icon: Fuel,
      desc: 'Catálogo agrupado por marca'
    },
    {
      id: 'plan_trabajo' as SidebarRoute,
      label: 'Plan de trabajo',
      icon: ClipboardList,
      desc: 'Seguimiento de prospectos'
    },
    {
      id: 'dashboard' as SidebarRoute,
      label: 'Dashboard',
      icon: LayoutDashboard,
      desc: 'Ratios e indicadores comerciales'
    }
  ];

  if (currentUser.rol === 'administrador') {
    routes.push({
      id: 'admin_panel' as SidebarRoute,
      label: 'Panel Admin',
      icon: ShieldCheck,
      desc: 'Carga manual y masiva CSV'
    });
  }

  return (
    <aside className="w-64 border-r border-[#EAEAEA] bg-[#FBFBFA] flex flex-col justify-between p-4 h-screen select-none shrink-0 sticky top-0">
      
      {/* Sidebar Header */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 px-2">
          <div className="text-xl">🔷</div>
          <div>
            <span className="font-bold text-sm tracking-tight text-[#37352F] block leading-none">
              DENUE PV
            </span>
            <div className="flex items-center gap-1 mt-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isCloudActive ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'}`}></span>
              <span className="text-[8px] font-bold text-[#7C7B77] uppercase tracking-wider">
                {isCloudActive ? 'Nube (Firestore)' : 'Modo Local'}
              </span>
            </div>
          </div>
        </div>

        {/* Route Navigation List */}
        <nav className="space-y-1">
          {routes.map((route) => {
            const isActive = currentRoute === route.id;
            const Icon = route.icon;
            return (
              <button
                key={route.id}
                onClick={() => onRouteChange(route.id)}
                className={`w-full flex items-start gap-3 p-2.5 rounded-lg text-left transition-all ${
                  isActive 
                    ? 'bg-[#EFEFED] text-[#37352F] font-semibold' 
                    : 'hover:bg-[#F1F1EF] text-[#37352F] hover:text-[#000000]'
                }`}
              >
                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isActive ? 'text-blue-700' : 'text-[#7C7B77]'}`} />
                <div className="min-w-0">
                  <span className="block text-xs leading-none">{route.label}</span>
                  <span className="block text-[9px] text-[#7C7B77] mt-1 font-normal truncate">
                    {route.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer: User Switcher */}
      <UserProfileSwitcher 
        currentUser={currentUser} 
        onUserChange={onUserChange} 
        onLogout={onLogout}
      />

    </aside>
  );
}
