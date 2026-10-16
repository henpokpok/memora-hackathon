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
          <div className="relative flex items-center space-x-3 text-left py-1.5 select-none pointer-events-none">
            {/* Extended Horizontal Aura Mist: Spanning from Logo all the way across "Memora" (Softened by 50%) */}
            <div className="absolute -inset-y-3 -left-4 -right-8 pointer-events-none z-0 opacity-50">
              {/* Outer horizontal swirling mist */}
              <div 
                className="absolute inset-0 rounded-full blur-xl opacity-75 animate-aura-mist pointer-events-none"
                style={{
                  background: 'linear-gradient(90deg, rgba(251, 191, 36, 0.45) 0%, rgba(251, 113, 133, 0.3) 45%, rgba(168, 85, 247, 0.2) 75%, transparent 100%)'
                }}
              />
              {/* Mid horizontal glowing trail */}
              <div 
                className="absolute -inset-x-2 inset-y-1 rounded-full blur-lg opacity-80 animate-aura-mist-glow pointer-events-none"
                style={{
                  background: 'linear-gradient(90deg, rgba(255, 200, 55, 0.4) 0%, rgba(244, 63, 94, 0.25) 40%, rgba(139, 92, 246, 0.18) 70%, transparent 95%)'
                }}
              />
              {/* Inner core radiant beam */}
              <div 
                className="absolute left-0 top-1/2 -translate-y-1/2 w-48 h-10 rounded-full blur-md opacity-70 animate-aura-mist-core pointer-events-none"
                style={{
                  background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.6) 0%, rgba(251, 191, 36, 0.4) 35%, rgba(244, 63, 94, 0.2) 65%, transparent 100%)'
                }}
              />
            </div>

            {/* Official Memora Memory Orb Cluster Logo */}
            <div className="relative flex items-center justify-center shrink-0 z-10">
              {/* Gentle ambient halo behind the logo cluster */}
              <div className="absolute -inset-2 rounded-full animate-aura-mist opacity-40 pointer-events-none z-0 blur-md" />
              <img
                src={logoImg}
                alt="Memora Logo"
                className="h-11 sm:h-13 w-auto object-contain drop-shadow-xs select-none relative z-10"
              />
            </div>

            {/* Wordmark "Memora" (Luxury Editorial Serif Typography) */}
            <span 
              className="relative z-10 text-2xl sm:text-[28px] font-bold tracking-tight text-slate-900 drop-shadow-xs select-none"
              style={{ fontFamily: "'Playfair Display', 'Cormorant Garamond', Georgia, serif" }}
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
