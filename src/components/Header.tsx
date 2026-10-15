import React from 'react';
import { Sparkles, MessageCircle, Volume2, ShieldCheck } from 'lucide-react';
import { MemoryOrb } from '../types';

interface HeaderProps {
  orbs: MemoryOrb[];
  unlockedCount: number;
  onOpenLineModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  orbs,
  unlockedCount,
  onOpenLineModal,
}) => {
  return (
    <header className="bg-[#090C1A]/80 backdrop-blur-md border-b border-indigo-950/60 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-amber-400/30 blur-md animate-pulse"></div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 p-[1.5px] relative z-10 shadow-lg shadow-amber-500/20 flex items-center justify-center">
              <span className="text-xl">🔮</span>
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-amber-200 via-yellow-100 to-white bg-clip-text text-transparent">
                Memora
              </span>
              <span className="text-xs text-amber-300/80 font-medium">ใจจำ</span>
              <span className="bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-mono px-2 py-0.5 rounded-full">
                Memory Orbs
              </span>
            </div>
            <p className="text-[11px] text-indigo-300/60">
              ลูกแก้วฟื้นฟูความทรงจำสำหรับผู้สูงวัย
            </p>
          </div>
        </div>

        {/* Core Memory Progress & LINE Capsule Trigger */}
        <div className="flex items-center space-x-3">
          {/* Daily 5 Orbs Counter */}
          <div className="hidden sm:flex items-center space-x-2 bg-indigo-950/40 border border-indigo-900/60 rounded-full px-3.5 py-1.5 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="text-indigo-200 text-[11px]">ปลดล็อกแล้ว:</span>
            <div className="flex items-center space-x-1.5">
              {orbs.map((o) => (
                <div
                  key={o.id}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    o.isUnlocked 
                      ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)] scale-110' 
                      : 'bg-indigo-950 border border-indigo-800'
                  }`}
                />
              ))}
            </div>
            <span className="font-mono font-bold text-amber-300 text-xs ml-1">
              {unlockedCount}/5
            </span>
          </div>

          {/* ElevenLabs Voice Badge */}
          <div className="hidden md:flex items-center space-x-1.5 bg-emerald-950/40 border border-emerald-800/50 rounded-full px-3 py-1.5 text-[11px] font-mono text-emerald-300">
            <Volume2 className="w-3.5 h-3.5" />
            <span>ElevenLabs Voice</span>
          </div>

          {/* Child's LINE Capsule Preview Button */}
          <button
            onClick={onOpenLineModal}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-[#06C755] hover:bg-[#05B34C] text-white text-xs font-semibold shadow-lg shadow-emerald-950/40 transition-all active:scale-95"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>LINE ครอบครัว</span>
          </button>
        </div>
      </div>
    </header>
  );
};
