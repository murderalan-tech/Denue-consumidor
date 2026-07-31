import { useState } from 'react';
import { LogIn, Settings, Save, RefreshCw } from 'lucide-react';

interface LoginPageProps {
  onFirebaseGoogleLogin: () => void;
}

export default function LoginPage({ onFirebaseGoogleLogin }: LoginPageProps) {
  // Resolve Google Client ID from: LocalStorage -> Vite Env -> Sandbox fallback
  const [clientId, setClientId] = useState<string>(() => {
    const saved = localStorage.getItem('denue_pv_google_client_id');
    if (saved && saved.trim() !== '') return saved.trim();
    
    const envId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (envId && envId.trim() !== '') return envId.trim();
    
    return '468903748281-dummyclientid.apps.googleusercontent.com';
  });

  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'google' | 'firebase'>('google');
  
  const [tempClientId, setTempClientId] = useState(clientId);
  
  const [firebaseConfigInput, setFirebaseConfigInput] = useState<string>(() => {
    const saved = localStorage.getItem('denue_pv_firebase_config');
    return saved ? saved : '';
  });

  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveClientId = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempClientId.trim()) return;

    localStorage.setItem('denue_pv_google_client_id', tempClientId.trim());
    setClientId(tempClientId.trim());
    setSaveSuccess(true);

    setTimeout(() => {
      setSaveSuccess(false);
      setShowSettings(false);
      window.location.reload();
    }, 1500);
  };

  const handleResetClientId = () => {
    localStorage.removeItem('denue_pv_google_client_id');
    const defaultId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '468903748281-dummyclientid.apps.googleusercontent.com';
    setClientId(defaultId);
    setTempClientId(defaultId);
    window.location.reload();
  };

  const handleSaveFirebaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseConfigInput.trim()) {
      localStorage.removeItem('denue_pv_firebase_config');
      setSaveSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      return;
    }

    try {
      const parsed = JSON.parse(firebaseConfigInput);
      if (!parsed.apiKey || !parsed.projectId) {
        alert("El objeto JSON debe contener al menos 'apiKey' y 'projectId'.");
        return;
      }
      localStorage.setItem('denue_pv_firebase_config', JSON.stringify(parsed, null, 2));
      setSaveSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      alert("Error al parsear el JSON de Firebase. Asegúrate de copiar el objeto de configuración válido.");
    }
  };

  const handleResetFirebaseConfig = () => {
    localStorage.removeItem('denue_pv_firebase_config');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col justify-center items-center p-6 select-none font-sans text-[#37352F]">
      
      {/* Notion-style Login Card */}
      <div className="w-full max-w-md bg-white border border-[#EAEAEA] rounded-2xl shadow-xl p-8 space-y-7 animate-in fade-in duration-200">
        
        {/* Brand Header */}
        <div className="text-center space-y-2 relative">
          {/* Gear icon to toggle Google API console configuration */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="absolute right-0 top-0 p-1.5 rounded-lg hover:bg-neutral-100 text-[#7C7B77] hover:text-[#37352F] transition-all cursor-pointer"
            title="Configurar Google Client ID"
          >
            <Settings className="w-4 h-4" />
          </button>

          <div className="text-4xl">🔷</div>
          <h1 className="font-display font-extrabold text-2xl tracking-tight text-[#37352F]">
            DENUE PV
          </h1>
          <p className="text-xs text-[#7C7B77] max-w-xs mx-auto">
            Plataforma interna de prospección comercial y control de ventas para Alchisa.
          </p>
        </div>

        {/* SECTION A: COLLAPSIBLE CREDENTIALS GEAR CONFIG */}
        {showSettings && (
          <div className="p-4 bg-neutral-50 border border-[#EAEAEA] rounded-xl space-y-3 animate-in slide-in-from-top-2 duration-200">
            
            {/* Settings Inner Tabs */}
            <div className="flex border-b border-[#EAEAEA] pb-2 mb-2 text-[10px] font-bold text-[#7C7B77]">
              <button
                type="button"
                onClick={() => setSettingsTab('google')}
                className={`flex-1 text-center pb-1 border-b-2 ${
                  settingsTab === 'google' ? 'border-blue-600 text-blue-700' : 'border-transparent hover:text-[#37352F]'
                } cursor-pointer`}
              >
                Google Auth
              </button>
              <button
                type="button"
                onClick={() => setSettingsTab('firebase')}
                className={`flex-1 text-center pb-1 border-b-2 ${
                  settingsTab === 'firebase' ? 'border-blue-600 text-blue-700' : 'border-transparent hover:text-[#37352F]'
                } cursor-pointer`}
              >
                Firebase DB
              </button>
            </div>

            {saveSuccess && (
              <div className="p-2 bg-emerald-50 border border-emerald-250 rounded text-emerald-700 text-[10px] font-semibold flex items-center gap-1.5">
                <RefreshCw className="w-3 h-3 text-emerald-600 animate-spin" />
                Guardado. Sincronizando...
              </div>
            )}

            {settingsTab === 'google' ? (
              <form onSubmit={handleSaveClientId} className="space-y-2">
                <div className="space-y-1">
                  <span className="text-[9px] text-[#7C7B77] block leading-normal">
                    Pega tu Client ID obtenido de Google Cloud Console. Recuerda autorizar el origen <code className="bg-neutral-200 px-1 py-0.5 rounded font-mono">http://localhost:3001</code> en la consola.
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={tempClientId}
                  onChange={(e) => setTempClientId(e.target.value)}
                  placeholder="Ej. xxxxxxxx-xxxxxx.apps.googleusercontent.com"
                  className="w-full px-2.5 py-1.5 bg-white border border-[#EAEAEA] rounded-lg text-[9px] font-mono focus:outline-none focus:border-blue-600"
                />

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={handleResetClientId}
                    className="px-2.5 py-1.5 bg-white hover:bg-neutral-100 border border-[#EAEAEA] text-[#7C7B77] rounded-lg text-[10px] font-semibold transition-all cursor-pointer"
                  >
                    Restaurar
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSaveFirebaseConfig} className="space-y-2">
                <div className="space-y-1">
                  <span className="text-[9px] text-[#7C7B77] block leading-normal">
                    Pega tu objeto de configuración de Firebase en formato JSON:
                  </span>
                </div>
                <textarea
                  rows={4}
                  required
                  value={firebaseConfigInput}
                  onChange={(e) => setFirebaseConfigInput(e.target.value)}
                  placeholder='{
  "apiKey": "AIzaSy...",
  "authDomain": "...",
  "projectId": "..."
}'
                  className="w-full px-2.5 py-1.5 bg-white border border-[#EAEAEA] rounded-lg text-[9px] font-mono focus:outline-none focus:border-blue-600 resize-none"
                />

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Conectar Nube
                  </button>
                  <button
                    type="button"
                    onClick={handleResetFirebaseConfig}
                    className="px-2.5 py-1.5 bg-white hover:bg-neutral-100 border border-[#EAEAEA] text-[#7C7B77] rounded-lg text-[10px] font-semibold transition-all cursor-pointer"
                  >
                    Desconectar
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* SECTION B: ACTIVE OFFICIAL GOOGLE SIGN-IN BUTTON */}
        <div className="space-y-4 flex flex-col items-center pt-2">
          <div className="text-[10px] uppercase font-bold text-[#7C7B77] tracking-wider flex items-center gap-1.5">
            Ingreso Seguro de Personal
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" title="Google Auth Activo" />
          </div>
          
          {/* Official Google Sign-In Button triggering Firebase Auth */}
          <button
            type="button"
            onClick={onFirebaseGoogleLogin}
            className="w-full py-3 px-4 bg-white hover:bg-[#F8F9FA] text-[#3c4043] border border-[#DADCE0] hover:border-[#D2D4D7] rounded-xl text-sm font-medium transition-all shadow-xs flex items-center justify-center gap-3 cursor-pointer active:bg-[#EEEEEE]"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="font-semibold text-[#3c4043]">Iniciar sesión con Google</span>
          </button>

          <div className="text-[10px] text-center text-[#7C7B77] max-w-xs leading-normal">
            Autenticación directa de Google Workspace con correo empresarial Alchisa.
          </div>
        </div>

      </div>

      <footer className="mt-8 text-[9px] text-[#7C7B77] flex items-center gap-1.5">
        <LogIn className="w-3 h-3" />
        Seguridad de Datos Alchisa.
      </footer>

    </div>
  );
}
