import { useState, useEffect } from 'react';
import { Menu, User } from 'lucide-react';
import Sidebar, { SidebarRoute } from './components/Sidebar';
import DirectoryMapSection from './components/DirectoryMapSection';
import GasolinerasListSection from './components/GasolinerasListSection';
import PlanTrabajoSection from './components/PlanTrabajoSection';
import DashboardSection from './components/DashboardSection';
import AdminPanelSection from './components/AdminPanelSection';
import EmpresasConcluidas from './components/EmpresasConcluidas';
import DetailSidebar from './components/DetailSidebar';
import LoginPage from './components/LoginPage';
import { Empresa, Asesor } from './types';
import { 
  getEmpresas, 
  getAsesores, 
  initializeDb, 
  updateEmpresa,
  isCloudActive,
  syncCloudToLocal,
  loginWithFirebaseGoogle
} from './database/dbService';

export default function App() {
  // --- INITIALIZE ---
  useEffect(() => {
    const init = async () => {
      await initializeDb();
      await syncCloudToLocal();
      loadEmpresas();
    };
    init();
  }, []);

  // --- STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('denue_pv_auth') === 'true';
  });

  const [currentUser, setCurrentUser] = useState<Asesor | null>(() => {
    initializeDb();
    const saved = localStorage.getItem('denue_pv_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [currentRoute, setCurrentRoute] = useState<SidebarRoute>('refaccionarias');
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  
  // Details Sheet Drawer State
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Mobile Navigation State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const loadEmpresas = () => {
    setEmpresas(getEmpresas());
  };

  // Sync data on startup or user change
  useEffect(() => {
    if (currentUser) {
      loadEmpresas();
    }
  }, [currentUser]);

  // --- AUTH HANDLERS ---

  const handleFirebaseGoogleLogin = async () => {
    const res = await loginWithFirebaseGoogle();
    if (!res) return;

    const email = res.email;
    const allAdvisors = getAsesores();

    let matched = allAdvisors.find(a => a.correoGoogle.toLowerCase() === email.toLowerCase());

    if (matched) {
      const userWithPhoto: Asesor = {
        ...matched,
        fotoUrl: res.photoURL || matched.fotoUrl
      };
      setCurrentUser(userWithPhoto);
      setIsAuthenticated(true);
      localStorage.setItem('denue_pv_auth', 'true');
      localStorage.setItem('denue_pv_user', JSON.stringify(userWithPhoto));
    } else {
      // Access Denied: User is NOT registered in directory!
      alert(`⛔ Acceso Denegado\n\nEl correo (${email}) no se encuentra registrado en el directorio de usuarios autorizados.\n\nPor favor, solicita a un Administrador que agregue tu correo en el Panel Admin -> Administradores & Usuarios.`);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('denue_pv_auth');
    localStorage.removeItem('denue_pv_user');
    setIsDrawerOpen(false);
    setSelectedEmpresa(null);
  };

  // --- HANDLERS ---
  const handleSelectEmpresa = (empresa: Empresa) => {
    setSelectedEmpresa(empresa);
    setIsDrawerOpen(true);
  };

  const handleSaveEmpresa = (updated: Empresa) => {
    updateEmpresa(updated);
    loadEmpresas();
    
    // Update active details state
    setSelectedEmpresa(updated);
    setIsDrawerOpen(false);
  };

  const handleUserChange = (newUser: Asesor) => {
    setCurrentUser(newUser);
    localStorage.setItem('denue_pv_user', JSON.stringify(newUser));
    setIsDrawerOpen(false);
    setSelectedEmpresa(null);
  };

  // --- RENDER LOGIN GATES ---
  if (!isAuthenticated || !currentUser) {
    return (
      <LoginPage 
        onFirebaseGoogleLogin={handleFirebaseGoogleLogin}
      />
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#FBFBFA]">
      
      {/* Sidebar Navigation */}
      <Sidebar 
        currentRoute={currentRoute}
        onRouteChange={(route) => {
          setCurrentRoute(route);
          setIsMobileMenuOpen(false);
        }}
        currentUser={currentUser}
        onUserChange={handleUserChange}
        onLogout={handleLogout}
        isCloudActive={isCloudActive()}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
        
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-[#EAEAEA] shrink-0 z-40">
           <div className="flex items-center gap-2 text-[#37352F] font-bold text-[10px] sm:text-xs uppercase tracking-tight">
              <div className="p-1.5 bg-blue-700 text-white rounded shadow-sm">
                <User className="w-3.5 h-3.5" />
              </div>
              DENUE CONSUMIDOR
           </div>
           <button onClick={() => setIsMobileMenuOpen(true)} className="p-1.5 rounded-md hover:bg-neutral-100 border border-transparent hover:border-neutral-200 transition-colors cursor-pointer">
             <Menu className="w-5 h-5 text-neutral-600" />
           </button>
        </div>

        {/* Content Wrapper */}
        <div className="flex-1 overflow-hidden flex flex-col p-4 md:p-6 bg-[#FBFBFA]">
          {/* Conditional Sections */}
        {currentRoute === 'refaccionarias' && (
          <DirectoryMapSection 
            giro="refaccionaria"
            empresas={empresas}
            currentUser={currentUser}
            onSelectEmpresa={handleSelectEmpresa}
          />
        )}

        {currentRoute === 'talleres' && (
          <DirectoryMapSection 
            giro="taller_mecanico"
            empresas={empresas}
            currentUser={currentUser}
            onSelectEmpresa={handleSelectEmpresa}
          />
        )}

        {currentRoute === 'gasolineras' && (
          <GasolinerasListSection 
            empresas={empresas}
            currentUser={currentUser}
            onSelectEmpresa={handleSelectEmpresa}
            onDataChange={loadEmpresas}
          />
        )}

        {currentRoute === 'plan_trabajo' && (
          <PlanTrabajoSection 
            currentUser={currentUser}
            onDataChange={loadEmpresas}
          />
        )}

        {currentRoute === 'dashboard' && (
          <DashboardSection 
            empresas={empresas}
            currentUser={currentUser}
          />
        )}

        {currentRoute === 'admin_panel' && (
          <AdminPanelSection 
            currentUser={currentUser}
            onDataChange={loadEmpresas}
          />
        )}

        {currentRoute === 'empresas_concluidas' && currentUser.rol === 'administrador' && (
          <EmpresasConcluidas
            onDataChange={loadEmpresas}
          />
        )}
        </div>
      </main>

      {/* Slide-out Detail Sidebar Drawer Sheet (Overlay) */}
      <DetailSidebar 
        empresa={selectedEmpresa}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentUser={currentUser}
        onSave={handleSaveEmpresa}
      />



    </div>
  );
}
