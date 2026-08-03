import { 
  Wrench, 
  Settings, 
  Fuel, 
  ClipboardList, 
  LayoutDashboard,
  ShieldCheck,
  Trophy,
  User,
  X
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
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ currentRoute, onRouteChange, currentUser, onUserChange, onLogout, isCloudActive, isOpen, onClose }: SidebarProps) {
  const routes = [
    {
      id: 'refaccionarias' as SidebarRoute,
      label: 'Refaccionarias',
      icon: Settings,
      desc: 'Mapa de Refaccionarias'
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
      desc: 'Seguimiento post-prospección'
    });
    routes.push({
      id: 'admin_panel' as SidebarRoute,
      label: 'Panel Admin',
      icon: ShieldCheck,
      desc: 'Carga manual y masiva CSV'
    });
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-[9998] md:hidden backdrop-blur-sm transition-opacity" 
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed md:sticky top-0 left-0 z-[9999] md:z-auto
        w-72 md:w-64 h-[100dvh] md:h-screen border-r border-[#EAEAEA] bg-[#FBFBFA] flex flex-col justify-between p-4 select-none shrink-0
        transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        
        {/* Sidebar Header */}
        <div className="space-y-6">
          <div className="flex items-start justify-between px-2">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-blue-700 text-white rounded-lg shadow-2xs shrink-0 flex items-center gap-0.5 mt-0.5">
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
            
            {/* Close button for mobile */}
            <button onClick={onClose} className="md:hidden p-1.5 rounded-full hover:bg-neutral-200 text-neutral-500">
              <X className="w-5 h-5" />
            </button>
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
    </>
  );
}
