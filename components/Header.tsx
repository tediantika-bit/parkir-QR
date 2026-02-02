
import React from 'react';
import { Home } from 'lucide-react';

interface HeaderProps {
  onBackToHome?: () => void;
  showBackButton?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onBackToHome, showBackButton }) => {
  return (
    <header className="bg-blue-600 text-white p-4 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white p-1.5 rounded-full shrink-0 shadow-md">
            <img 
              src="https://iili.io/fLQoCep.png" 
              alt="Logo SMAN 1 Ciruas" 
              className="w-10 h-10 object-contain"
            />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Sistem Aplikasi Parkir</h1>
            <p className="text-xs text-blue-100 font-medium tracking-wide">SMAN 1 CIRUAS</p>
          </div>
        </div>

        {showBackButton && onBackToHome && (
          <button 
            onClick={onBackToHome}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors flex items-center gap-2 group border border-white/20"
            title="Kembali ke Beranda"
          >
            <Home size={20} className="group-active:scale-90 transition-transform" />
            <span className="hidden sm:inline text-xs font-semibold">Beranda</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
