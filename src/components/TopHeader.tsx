import React from 'react';
import { Settings } from 'lucide-react';
import logoImg from '../assets/memora-logo.png';

interface TopHeaderProps {
  onOpenSettings: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onOpenSettings }) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-2xs overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo with Living Shifting Aura Mist: Non-Clickable Branding Header */}
          <div className="relative flex items-center space-x-3 sm:space-x-3.5 text-left py-1 select-none pointer-events-none">
            {/* Ethereal Soft Ambient Glow - Seamlessly feathered, zero rectangular edges */}
            <div 
              className="absolute -left-6 -top-6 w-44 h-32 sm:w-60 sm:h-36 rounded-full pointer-events-none z-0 blur-3xl opacity-35"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(251, 191, 36, 0.4) 0%, rgba(244, 114, 182, 0.22) 45%, rgba(168, 85, 247, 0.12) 70%, transparent 100%)'
              }}
            />
            {/* Gentle Warm Halo under wordmark */}
            <div 
              className="absolute left-10 top-1/2 -translate-y-1/2 w-48 h-12 rounded-full pointer-events-none z-0 blur-2xl opacity-25"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(253, 224, 71, 0.3) 0%, rgba(251, 146, 60, 0.15) 60%, transparent 100%)'
              }}
            />

            {/* Official Memora Memory Orb Cluster Logo */}
            <div className="relative flex items-center justify-center shrink-0 z-10">
              <img
                src={logoImg}
                alt="Memora Logo"
                className="h-12 sm:h-14 w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.06)] select-none relative z-10"
              />
            </div>

            {/* Wordmark "Memora" (Quiet Luxury Editorial Serif Typography) */}
            <span 
              className="relative z-10 text-[27px] sm:text-[32px] font-semibold tracking-[0.04em] text-slate-800 select-none leading-none pt-0.5"
              style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif" }}
            >
              Memora
            </span>
          </div>

          {/* Right Action: Pure Settings Icon Button ⚙️ (Uncluttered, Friendly for Seniors) */}
          <div className="flex items-center">
            <button
              onClick={onOpenSettings}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-white text-slate-700 hover:text-slate-950 flex items-center justify-center shadow-2xs active:scale-95 transition-all cursor-pointer"
              title="ตั้งค่าแอป / Settings"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5 stroke-[2.2]" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
