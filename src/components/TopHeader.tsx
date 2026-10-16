import React from 'react';
import { Settings } from 'lucide-react';

interface TopHeaderProps {
  onOpenSettings: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onOpenSettings }) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-2xs overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo with Living Shifting Aura Mist: Non-Clickable Branding Header */}
          <div className="relative flex items-center space-x-3.5 text-left py-1.5 select-none pointer-events-none">
            {/* Extended Horizontal Aura Mist: Spanning from Logo all the way across "Memora" */}
            <div className="absolute -inset-y-3 -left-4 -right-8 pointer-events-none z-0">
              {/* Outer horizontal swirling mist */}
              <div 
                className="absolute inset-0 rounded-full blur-xl opacity-75 animate-aura-mist pointer-events-none"
                style={{
                  background: 'linear-gradient(90deg, rgba(251, 191, 36, 0.7) 0%, rgba(251, 113, 133, 0.5) 45%, rgba(168, 85, 247, 0.35) 75%, transparent 100%)'
                }}
              />
              {/* Mid horizontal glowing trail */}
              <div 
                className="absolute -inset-x-2 inset-y-1 rounded-full blur-lg opacity-80 animate-aura-mist-glow pointer-events-none"
                style={{
                  background: 'linear-gradient(90deg, rgba(255, 200, 55, 0.65) 0%, rgba(244, 63, 94, 0.45) 40%, rgba(139, 92, 246, 0.3) 70%, transparent 95%)'
                }}
              />
              {/* Inner core radiant beam */}
              <div 
                className="absolute left-0 top-1/2 -translate-y-1/2 w-48 h-10 rounded-full blur-md opacity-90 animate-aura-mist-core pointer-events-none"
                style={{
                  background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.9) 0%, rgba(251, 191, 36, 0.7) 35%, rgba(244, 63, 94, 0.35) 65%, transparent 100%)'
                }}
              />
            </div>

            {/* Logo Sphere with Centered Organic Swirling Mist Vapor */}
            <div className="relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 z-10">
              {/* Multi-layered Organic Mist Vapor (Centered on Orb, Dynamic Size, Rounded & Soft Swirling, Contained within Top Bar) */}
              <div className="absolute w-20 h-20 sm:w-24 sm:h-24 rounded-full animate-aura-mist pointer-events-none z-0" />
              <div className="absolute w-16 h-16 sm:w-20 sm:h-20 rounded-full animate-aura-mist-glow pointer-events-none z-0" />
              <div className="absolute w-12 h-12 sm:w-14 sm:h-14 rounded-full animate-aura-mist-core pointer-events-none z-0" />

              {/* Logo Sphere */}
              <div className="relative z-10 w-full h-full rounded-full bg-gradient-to-tr from-amber-400 via-rose-400 to-indigo-500 p-[1.5px] shadow-sm shadow-amber-200/50 flex items-center justify-center">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                  <span className="text-xl sm:text-2xl">🔮</span>
                </div>
              </div>
            </div>

            {/* Wordmark "Memora" (Pure & Clean Typography with subtle ambient text shadow) */}
            <span className="relative z-10 text-2xl sm:text-[26px] font-extrabold tracking-normal text-slate-900 drop-shadow-xs">
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
