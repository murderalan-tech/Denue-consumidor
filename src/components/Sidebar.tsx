import { 
  Wrench, 
  Settings, 
  Fuel, 
  ClipboardList, 
  LayoutDashboard,
  ShieldCheck,
  Trophy,
  User
} from 'lucide-react';
import { Asesor } from '../types';
import UserProfileSwitcher from './UserProfileSwitcher';

export type SidebarRoute = 'refaccionarias' | 'talleres' | 'gasolineras' | 'plan_trabajo' | 'dashboard' | 'admin_panel' | 'empresas_concluidas';

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
      desc: 'Mapa de Refaccionarias'
    },
    {
      id: 'talleres' as SidebarRoute,
      label: 'Talleres mecÃ¡nicos',
      icon: Wrench,
      desc: 'Mapa de talleres mecÃ¡nicos'
    },
    {
      id: 'gasolineras' as SidebarRoute,
      label: 'Gasolineras',
      icon: Fuel,
      desc: 'Grupos Gasolineros'
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
      id: 'empresas_concluidas' as SidebarRoute,
      label: 'Empresas Concluidas',
      icon: Trophy,
      desc: 'Seguimiento post-prospecciÃ³n'
    });
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
        <div className="flex items-center gap-2.5 px-2">
          <div className="p-1.5 bg-blue-700 text-white rounded-lg shadow-2xs shrink-0 flex items-center gap-0.5">
            <User className="w-4 h-4" />
            <Wrench className="w-3 h-3 -ml-1.5" />
          </div>
          <div>
            <span className="font-bold text-xs tracking-tight text-[#37352F] block leading-none uppercase">
              DENUE CONSUMIDOR
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
