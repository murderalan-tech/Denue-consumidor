import { useState } from 'react';
import { ChevronDown, LogOut, Shield, Users } from 'lucide-react';
import { Asesor } from '../types';

interface UserProfileSwitcherProps {
  currentUser: Asesor;
  onUserChange?: (user: Asesor) => void;
  onLogout: () => void;
}

export default function UserProfileSwitcher({ currentUser, onLogout }: UserProfileSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative border-t border-[#EAEAEA] pt-4 mt-auto select-none">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#EFEFED] transition-colors text-left cursor-pointer"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white text-xs font-semibold shadow-xs shrink-0">
            {currentUser.nombre.charAt(0)}
          </div>
          <div className="min-w-0">
            <span className="block text-xs font-bold text-[#37352F] truncate leading-tight">
              {currentUser.nombre}
            </span>
            <span className="block text-[10px] text-[#7C7B77] truncate">
              {currentUser.correoGoogle}
            </span>
          </div>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-[#7C7B77] shrink-0" />
      </button>

      {/* Popover Menu with Only Logout option */}
      {isOpen && (
        <div className="absolute bottom-14 left-0 right-0 z-50 bg-white border border-[#EAEAEA] rounded-xl shadow-lg p-2 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="px-2 py-1.5 bg-neutral-50 rounded-lg border border-[#EAEAEA] flex items-center justify-between">
            <span className="text-[10px] text-[#7C7B77] font-semibold">Rol Activo:</span>
            {currentUser.rol === 'administrador' ? (
              <span className="text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1 uppercase">
                <Shield className="w-3 h-3" />
                Admin
              </span>
            ) : (
              <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full flex items-center gap-1 uppercase">
                <Users className="w-3 h-3" />
                Asesor
              </span>
            )}
          </div>

          <button
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
            className="w-full text-left p-2 rounded-lg text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer font-semibold"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Cerrar Sesión
          </button>
        </div>
      )}
    </div>
  );
}
