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
            {/* Logo Sphere with Centered Organic Swirling Mist Vapor */}
            <div className="relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12">
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

            {/* Wordmark "Memora" (Pure & Clean Typography) */}
            <span className="relative z-10 text-2xl sm:text-[26px] font-extrabold tracking-tight text-slate-900">
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
