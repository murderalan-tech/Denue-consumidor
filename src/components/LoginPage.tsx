import { LogIn } from 'lucide-react';

interface LoginPageProps {
  onFirebaseGoogleLogin: () => void;
}

export default function LoginPage({ onFirebaseGoogleLogin }: LoginPageProps) {
  return (
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col justify-center items-center p-6 select-none font-sans text-[#37352F]">
      
      {/* Notion-style Login Card */}
      <div className="w-full max-w-md bg-white border border-[#EAEAEA] rounded-2xl shadow-xl p-8 space-y-7 animate-in fade-in duration-200">
        
        {/* Brand Header */}
        <div className="text-center space-y-3 relative flex flex-col items-center">
          {/* Avatar Ricardo MecÃ¡nico Mobil / Alchisa */}
          <div className="relative">
            <img 
              src="/mechanic_avatar.png" 
              alt="MecÃ¡nico Ricardo Mobil Alchisa" 
              className="w-32 h-36 object-cover object-top rounded-2xl shadow-lg border-2 border-blue-600/20 mx-auto"
            />
          </div>

          <div className="flex items-center justify-center gap-2 pt-1">
            <h1 className="font-display font-extrabold text-2xl tracking-tight text-[#37352F]">
              DENUE CONSUMIDOR
            </h1>
          </div>
          <p className="text-xs text-[#7C7B77] max-w-xs mx-auto">
            Plataforma interna de prospecciÃ³n comercial y control de ventas para Alchisa.
          </p>
        </div>

        {/* ACTIVE OFFICIAL GOOGLE SIGN-IN BUTTON */}
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
            <span className="font-semibold text-[#3c4043]">Iniciar sesiÃ³n con Google</span>
          </button>

          <div className="text-[10px] text-center text-[#7C7B77] max-w-xs leading-normal">
            AutenticaciÃ³n directa de Google Workspace con correo empresarial Alchisa.
          </div>
        </div>

      </div>

      <footer className="mt-8 text-[9px] text-[#A0A09C] flex flex-col items-center gap-1 select-none">
        <div className="flex items-center gap-1.5 text-[#7C7B77]">
          <LogIn className="w-3 h-3" />
          Seguridad de Datos Alchisa.
        </div>
        <span className="text-[8px] text-neutral-400 font-medium tracking-wide">
          Designed by Alan Olivares C.
        </span>
      </footer>

    </div>
  );
}
