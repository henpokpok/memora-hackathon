import React from 'react';
import { OrbEmotion } from '../../types';

export interface MemoryOrbProps {
  emotion: OrbEmotion | 'all';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  photoUrl?: string;
  isSelected?: boolean;
  isInteractive?: boolean;
  showAura?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  title?: string;
}

interface OrbTheme {
  primary: string;
  glowHex: string;
  auraColor: string;
  coreGradient: string;
  swirlGradient: string;
  harmonicGradient: string;
  labelEn: string;
  labelTh: string;
}

export const ORB_THEMES: Record<OrbEmotion | 'all', OrbTheme> = {
  joy: {
    primary: '#F59E0B',
    glowHex: '#FBBF24',
    auraColor: 'rgba(251, 191, 36, 0.55)',
    coreGradient: 'radial-gradient(circle at 35% 30%, #FEF08A 0%, #FBBF24 32%, #D97706 68%, #78350F 100%)',
    swirlGradient: 'from-amber-200 via-amber-400 to-yellow-600',
    harmonicGradient: 'from-yellow-300 via-orange-400 to-amber-600',
    labelEn: 'Joy',
    labelTh: 'ความสุข',
  },
  nostalgia: {
    primary: '#0284C7',
    glowHex: '#0EA5E9',
    auraColor: 'rgba(14, 165, 233, 0.55)',
    coreGradient: 'radial-gradient(circle at 35% 30%, #BAE6FD 0%, #38BDF8 32%, #0284C7 68%, #0C4A6E 100%)',
    swirlGradient: 'from-sky-200 via-cyan-400 to-blue-600',
    harmonicGradient: 'from-teal-300 via-sky-400 to-indigo-600',
    labelEn: 'Nostalgia',
    labelTh: 'วันวาน',
  },
  love: {
    primary: '#E11D48',
    glowHex: '#F43F5E',
    auraColor: 'rgba(244, 63, 94, 0.55)',
    coreGradient: 'radial-gradient(circle at 35% 30%, #FECDD3 0%, #FB7185 32%, #E11D48 68%, #4C0519 100%)',
    swirlGradient: 'from-rose-200 via-pink-400 to-rose-600',
    harmonicGradient: 'from-pink-300 via-rose-400 to-red-600',
    labelEn: 'Love',
    labelTh: 'ความรัก',
  },
  vitality: {
    primary: '#059669',
    glowHex: '#10B981',
    auraColor: 'rgba(16, 185, 129, 0.55)',
    coreGradient: 'radial-gradient(circle at 35% 30%, #A7F3D0 0%, #34D399 32%, #059669 68%, #064E3B 100%)',
    swirlGradient: 'from-emerald-200 via-teal-400 to-green-600',
    harmonicGradient: 'from-lime-300 via-emerald-400 to-teal-700',
    labelEn: 'Vitality',
    labelTh: 'มีชีวิตชีวา',
  },
  celebration: {
    primary: '#7C3AED',
    glowHex: '#8B5CF6',
    auraColor: 'rgba(139, 92, 246, 0.55)',
    coreGradient: 'radial-gradient(circle at 35% 30%, #DDD6FE 0%, #A78BFA 32%, #7C3AED 68%, #2E1065 100%)',
    swirlGradient: 'from-purple-200 via-violet-400 to-indigo-600',
    harmonicGradient: 'from-fuchsia-300 via-purple-400 to-violet-700',
    labelEn: 'Celebration',
    labelTh: 'ภาคภูมิใจ',
  },
  all: {
    primary: '#6366F1',
    glowHex: '#A855F7',
    auraColor: 'rgba(168, 85, 247, 0.55)',
    coreGradient: 'radial-gradient(circle at 35% 30%, #FFFFFF 0%, #FDE047 22%, #F43F5E 45%, #6366F1 70%, #065F46 100%)',
    swirlGradient: 'from-amber-300 via-rose-400 to-indigo-500',
    harmonicGradient: 'from-cyan-300 via-indigo-400 to-pink-500',
    labelEn: 'All Orbs',
    labelTh: 'ทั้งหมด',
  },
};

const SIZE_MAP: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', number> = {
  xs: 18,
  sm: 28,
  md: 48,
  lg: 64,
  xl: 96,
};

export const MemoryOrb: React.FC<MemoryOrbProps> = ({
  emotion,
  size = 'md',
  photoUrl,
  isSelected = false,
  isInteractive = false,
  showAura = true,
  className = '',
  onClick,
  title,
}) => {
  const pixelSize = typeof size === 'number' ? size : SIZE_MAP[size];
  const theme = ORB_THEMES[emotion] || ORB_THEMES.joy;

  return (
    <div
      onClick={onClick}
      title={title || `${theme.labelEn} • ${theme.labelTh}`}
      style={{
        width: pixelSize,
        height: pixelSize,
      }}
      className={`relative inline-flex items-center justify-center select-none shrink-0 ${
        isInteractive ? 'cursor-pointer group' : 'pointer-events-none'
      } ${className}`}
    >
      {/* 1. Ambient Atmospheric Aura Glow (Breathing light matching emotion) */}
      {showAura && (
        <div
          className={`absolute rounded-full pointer-events-none transition-all duration-500 ${
            isSelected
              ? 'opacity-90 scale-125 blur-[10px]'
              : isInteractive
              ? 'opacity-40 group-hover:opacity-75 blur-[6px] group-hover:scale-115'
              : 'opacity-45 blur-[5px]'
          }`}
          style={{
            inset: -pixelSize * 0.15,
            background: `radial-gradient(circle, ${theme.auraColor} 20%, ${theme.glowHex}40 60%, transparent 80%)`,
          }}
        />
      )}

      {/* 2. Glass Sphere Outer Shell with Volumetric Depth */}
      <div
        className={`w-full h-full rounded-full relative overflow-hidden transition-all duration-300 ${
          isInteractive ? 'group-hover:scale-105 active:scale-95' : ''
        } ${
          isSelected
            ? 'ring-2 ring-white/90 shadow-[0_0_16px_rgba(255,255,255,0.85)]'
            : ''
        }`}
        style={{
          background: theme.coreGradient,
          boxShadow: `
            inset 0 2px 5px rgba(255, 255, 255, 0.95),
            inset 0 -4px 10px rgba(15, 23, 42, 0.4),
            0 4px 12px -2px rgba(0, 0, 0, 0.2),
            0 0 10px 1px ${theme.auraColor}
          `,
          border: '1px solid rgba(255, 255, 255, 0.85)',
        }}
      >
        {/* 3.1 Primary Swirling Nebula (มนๆ Mix - Organic liquid color swirl) */}
        <div
          className={`absolute inset-0 rounded-full bg-gradient-to-tr ${theme.swirlGradient} opacity-75 animate-mist-swirl filter blur-[0.6px] mix-blend-screen pointer-events-none`}
        />

        {/* 3.2 Counter-Rotating Caustic Sweep ("วิ่งๆ" - Liquid light stream) */}
        <div
          className={`absolute inset-0 rounded-full bg-gradient-to-br ${theme.harmonicGradient} opacity-60 animate-orb-caustic filter blur-[0.8px] mix-blend-color-dodge pointer-events-none`}
        />

        {/* 3.3 Orbiting Light Beam ("วิ่งๆ" - Dynamic prismatic beam stream) */}
        <div
          className="absolute -inset-1 rounded-full opacity-65 animate-orb-stream mix-blend-screen filter blur-[0.6px] pointer-events-none"
          style={{
            background: `conic-gradient(from 0deg, transparent 0%, ${theme.glowHex} 35%, rgba(255,255,255,0.9) 50%, transparent 65%)`,
          }}
        />

        {/* 4. Memory Image (Only present if photoUrl provided, with radial vignette mask) */}
        {photoUrl && (
          <>
            <div
              className="absolute inset-1.5 aspect-square rounded-full overflow-hidden pointer-events-none orb-faint-projection"
              style={{
                opacity: 0.82,
              }}
            >
              <img
                src={photoUrl}
                alt=""
                decoding="async"
                className="w-full h-full aspect-square rounded-full object-cover scale-105"
              />
            </div>
            {/* Subtle emotion tint wash over photo */}
            <div
              className={`absolute inset-1.5 rounded-full bg-gradient-to-tr ${theme.swirlGradient} opacity-20 mix-blend-color pointer-events-none orb-faint-projection`}
            />
          </>
        )}

        {/* 5. Bright Center Light Core (Inner Radiance bloom for abstract orbs) */}
        {!photoUrl && (
          <div
            className="absolute inset-[20%] rounded-full opacity-65 filter blur-[1px] pointer-events-none"
            style={{
              background: `radial-gradient(circle at 45% 40%, rgba(255,255,255,0.98) 0%, ${theme.glowHex} 50%, transparent 80%)`,
            }}
          />
        )}

        {/* 8. Primary Glass Specular Highlight (Crisp top-left glossy crescent) */}
        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            top: '8%',
            left: '14%',
            width: '46%',
            height: '28%',
            background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0) 75%)',
            transform: 'rotate(-32deg)',
            filter: pixelSize > 30 ? 'blur(0.2px)' : 'none',
          }}
        />

        {/* 9. Caustic Bounce Rim Reflection (Bottom-right glass curvature reflection) */}
        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            bottom: '6%',
            right: '14%',
            width: '44%',
            height: '22%',
            background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.55) 0%, rgba(255, 255, 255, 0) 72%)',
            transform: 'rotate(28deg)',
          }}
        />
      </div>
    </div>
  );
};
