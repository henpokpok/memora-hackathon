import React from 'react';
import { MemoryOrb } from '../types';
import { CheckCircle2, Lock } from 'lucide-react';

interface OrbRailProps {
  orbs: MemoryOrb[];
  activeOrbId: string;
  onSelectOrb: (orbId: string) => void;
}

const emotionEmoji: Record<string, string> = {
  joy: '☀️',
  nostalgia: '🌊',
  love: '💖',
  vitality: '🌿',
  celebration: '🎉',
};

const emotionGlowClass: Record<string, string> = {
  joy: 'shadow-[0_0_24px_rgba(251,191,36,0.7)] border-amber-400',
  nostalgia: 'shadow-[0_0_24px_rgba(56,189,248,0.7)] border-sky-400',
  love: 'shadow-[0_0_24px_rgba(236,72,153,0.7)] border-pink-400',
  vitality: 'shadow-[0_0_24px_rgba(74,222,128,0.7)] border-emerald-400',
  celebration: 'shadow-[0_0_24px_rgba(168,85,247,0.7)] border-purple-400',
};

export const OrbRail: React.FC<OrbRailProps> = ({
  orbs,
  activeOrbId,
  onSelectOrb,
}) => {
  return (
    <div className="relative w-full max-w-4xl mx-auto px-4 py-2">
      {/* Decorative Inside Out Orb Rail / Track */}
      <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1.5 bg-gradient-to-r from-indigo-950 via-indigo-600/40 to-indigo-950 rounded-full border-t border-indigo-400/20 shadow-[0_0_15px_rgba(99,102,241,0.3)] pointer-events-none" />
      <div className="absolute left-10 right-10 top-1/2 translate-y-1 h-0.5 bg-indigo-500/20 rounded-full blur-[1px] pointer-events-none" />

      {/* Orbs Row */}
      <div className="relative z-10 flex items-center justify-between gap-2 sm:gap-4 overflow-x-auto py-3 px-2 no-scrollbar">
        {orbs.map((orb, index) => {
          const isActive = orb.id === activeOrbId;
          const isUnlocked = orb.isUnlocked;

          return (
            <button
              key={orb.id}
              onClick={() => onSelectOrb(orb.id)}
              className={`group flex flex-col items-center focus:outline-none transition-all duration-300 relative ${
                isActive ? 'scale-110 -translate-y-1' : 'opacity-80 hover:opacity-100 hover:-translate-y-0.5'
              }`}
            >
              {/* Active Indicator beam */}
              {isActive && (
                <div className="absolute -top-3 w-2 h-2 rounded-full bg-amber-300 animate-ping" />
              )}

              {/* Orb Sphere on the Rail */}
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full relative flex items-center justify-center transition-all duration-500 ${
                  isUnlocked
                    ? `bg-gradient-to-br ${orb.accentBg} ${isActive ? emotionGlowClass[orb.emotion] : 'shadow-[0_0_12px_rgba(255,255,255,0.25)]'}`
                    : 'bg-gradient-to-br from-slate-800 to-indigo-950 border border-indigo-800/60 shadow-inner'
                }`}
              >
                {/* Embedded photo preview if unlocked */}
                {isUnlocked ? (
                  <div className="absolute inset-1 rounded-full overflow-hidden opacity-85">
                    <img
                      src={orb.photoUrl}
                      alt={orb.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/20" />
                  </div>
                ) : (
                  <div className="text-indigo-400/60">
                    <Lock className="w-5 h-5" />
                  </div>
                )}

                {/* Glass reflection sheen */}
                <div className="orb-shine" />
                <div className="orb-bottom-rim" />

                {/* Unlocked checkmark badge */}
                {isUnlocked && (
                  <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 rounded-full p-0.5 shadow-md">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                )}

                {/* Emotion Icon Pill */}
                <div className="absolute -top-1.5 -left-1.5 text-xs bg-black/60 rounded-full px-1 py-0.5 backdrop-blur-sm border border-white/20">
                  {emotionEmoji[orb.emotion]}
                </div>
              </div>

              {/* Memory Index / Number */}
              <div className="mt-2 text-center">
                <span
                  className={`text-[11px] font-medium block truncate max-w-[70px] sm:max-w-[85px] ${
                    isActive ? 'text-amber-200 font-bold' : 'text-slate-400'
                  }`}
                >
                  {index + 1}. {orb.title.split(' ')[0]}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
