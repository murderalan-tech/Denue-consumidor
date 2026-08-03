import { useState, useEffect } from 'react';
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
        onRouteChange={setCurrentRoute}
        currentUser={currentUser}
        onUserChange={handleUserChange}
        onLogout={handleLogout}
        isCloudActive={isCloudActive()}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col p-6 min-w-0 overflow-hidden bg-white">
        
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

      </main>

      {/* Slide-out Detail Sidebar Drawer Sheet (Overlay) */}
      <DetailSidebar 
        empresa={selectedEmpresa}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentUser={currentUser}
        onSave={handleSaveEmpresa}
      />

      {/* Floating WhatsApp Support Button */}
      <a
        href="https://wa.me/526142180855?text=Hola%2C%20tengo%20dudas%20sobre%20DENUE%20Consumidor"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 z-50 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs px-3.5 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 cursor-pointer active:scale-95 group"
        title="Contactar por WhatsApp (+52 614 218 0855)"
      >
        <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
        </svg>
        <span>¿Tienes dudas?</span>
      </a>

    </div>
  );
}
