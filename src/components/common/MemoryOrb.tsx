import React from 'react';
import { OrbEmotion } from '../../types';

export interface MemoryOrbProps {
  emotion: OrbEmotion | 'all';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'responsive' | number;
  photoUrl?: string;
  isSelected?: boolean;
  isInteractive?: boolean;
  showAura?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  title?: string;
}

export interface OrbTheme {
  primary: string;
  glowHex: string;
  auraColor: string;
  gradient: string;
  labelEn: string;
  labelTh: string;
  rainbowAura?: string;
  secondaryRainbowAura?: string;
}

export const ORB_THEMES: Record<OrbEmotion | 'all', OrbTheme> = {
  joy: {
    primary: '#F59E0B',
    glowHex: '#FBBF24',
    auraColor: 'rgba(251, 191, 36, 0.85)',
    gradient: 'from-amber-300 via-amber-500 to-yellow-600',
    labelEn: 'Joy',
    labelTh: 'ความสุข',
  },
  nostalgia: {
    primary: '#0284C7',
    glowHex: '#0EA5E9',
    auraColor: 'rgba(14, 165, 233, 0.85)',
    gradient: 'from-sky-300 via-cyan-500 to-blue-600',
    labelEn: 'Nostalgia',
    labelTh: 'วันวาน',
  },
  love: {
    primary: '#E11D48',
    glowHex: '#F43F5E',
    auraColor: 'rgba(244, 63, 94, 0.85)',
    gradient: 'from-rose-300 via-pink-500 to-rose-600',
    labelEn: 'Love',
    labelTh: 'ความรัก',
  },
  vitality: {
    primary: '#059669',
    glowHex: '#10B981',
    auraColor: 'rgba(16, 185, 129, 0.85)',
    gradient: 'from-emerald-300 via-teal-500 to-green-600',
    labelEn: 'Vitality',
    labelTh: 'สดชื่น',
  },
  celebration: {
    primary: '#7C3AED',
    glowHex: '#8B5CF6',
    auraColor: 'rgba(139, 92, 246, 0.85)',
    gradient: 'from-purple-300 via-violet-500 to-indigo-600',
    labelEn: 'Celebration',
    labelTh: 'ภาคภูมิใจ',
  },
  all: {
    primary: '#EC4899',
    glowHex: '#EC4899',
    auraColor: 'rgba(236, 72, 153, 0.45)',
    gradient: 'from-rose-400 via-amber-300 via-emerald-400 via-sky-400 to-purple-500',
    rainbowAura: 'conic-gradient(from 0deg, rgba(244,63,94,0.65), rgba(245,158,11,0.65), rgba(16,185,129,0.65), rgba(14,165,233,0.65), rgba(139,92,246,0.65), rgba(236,72,153,0.65), rgba(244,63,94,0.65))',
    secondaryRainbowAura: 'radial-gradient(circle, rgba(251,191,36,0.25) 0%, rgba(16,185,129,0.2) 35%, rgba(14,165,233,0.2) 60%, rgba(139,92,246,0.18) 80%, transparent 95%)',
    labelEn: 'All',
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
  const pixelSize = typeof size === 'number' ? size : size === 'responsive' ? undefined : SIZE_MAP[size];
  const theme = ORB_THEMES[emotion] || ORB_THEMES.joy;

  return (
    <div
      onClick={onClick}
      title={title || `${theme.labelEn} • ${theme.labelTh}`}
      style={
        pixelSize
          ? {
              width: pixelSize,
              height: pixelSize,
            }
          : undefined
      }
      className={`relative inline-flex items-center justify-center select-none shrink-0 ${
        isInteractive ? 'cursor-pointer group' : 'pointer-events-none'
      } ${className}`}
    >
      {/* 1. Dual Atmospheric Aura Glow breathing behind the orb */}
      {showAura && (
        <>
          <div
            className={`absolute rounded-full pointer-events-none filter blur-[6px] animate-aura-breathe-soft transition-all duration-500 ${
              isSelected ? 'opacity-85 scale-105' : 'opacity-35 group-hover:opacity-60'
            }`}
            style={{
              inset: pixelSize ? -Math.max(3, pixelSize * 0.1) : '-10%',
              background: theme.rainbowAura
                ? theme.rainbowAura
                : `radial-gradient(circle, ${theme.auraColor} 30%, ${theme.glowHex} 65%, transparent 85%)`,
            }}
          />
          <div
            className={`absolute rounded-full pointer-events-none filter blur-[10px] transition-opacity duration-500 ${
              isSelected ? 'opacity-60 animate-pulse' : 'opacity-20 group-hover:opacity-35'
            }`}
            style={{
              inset: pixelSize ? -Math.max(5, pixelSize * 0.18) : '-18%',
              background: theme.secondaryRainbowAura
                ? theme.secondaryRainbowAura
                : `radial-gradient(circle, ${theme.glowHex} 25%, ${theme.auraColor} 50%, transparent 80%)`,
            }}
          />
        </>
      )}

      {/* 2. Glass Orb Sphere (Real 3D Glass Surface + Inside Out Swirling Core) */}
      <div
        className={`w-full h-full rounded-full relative glass-memory-orb-light flex items-center justify-center p-0.5 overflow-hidden transition-all duration-300 ${
          isInteractive ? 'group-hover:scale-105 active:scale-95' : ''
        } ${
          isSelected
            ? 'ring-2 ring-amber-400/90 shadow-[0_0_16px_rgba(251,191,36,0.7)]'
            : 'group-hover:shadow-[0_0_12px_rgba(251,191,36,0.4)]'
        }`}
        style={{
          boxShadow: isSelected
            ? `0 0 14px 2px ${theme.auraColor}, inset 0 3px 10px rgba(255,255,255,0.9), inset 0 -6px 14px rgba(15,23,42,0.3)`
            : `0 0 6px 1px ${theme.auraColor}, inset 0 2px 7px rgba(255,255,255,0.85), inset 0 -4px 8px rgba(15,23,42,0.2)`,
          border: '1.5px solid rgba(255, 255, 255, 0.85)',
        }}
      >
        {/* Swirling Emotion Core inside the glass marble */}
        <div
          className={`w-full h-full rounded-full bg-gradient-to-tr ${theme.gradient} animate-mist-swirl opacity-95 filter blur-[0.4px] shadow-inner`}
        />

        {/* Luminous Inner Core bloom (Privacy-Safe Normal Version) */}
        <div
          className="absolute inset-[18%] rounded-full opacity-65 filter blur-[1px] pointer-events-none"
          style={{
            background: `radial-gradient(circle at 45% 40%, rgba(255,255,255,0.95) 0%, ${theme.glowHex} 50%, transparent 80%)`,
          }}
        />

        {/* Optional photo if provided */}
        {photoUrl && (
          <div
            className="absolute inset-1 sm:inset-1.5 aspect-square rounded-full overflow-hidden pointer-events-none orb-faint-projection"
            style={{ opacity: 0.82 }}
          >
            <img
              src={photoUrl}
              alt=""
              decoding="async"
              className="w-full h-full aspect-square rounded-full object-cover scale-105"
            />
          </div>
        )}

        {/* Photorealistic 3D Spherical Light Refraction Overlay */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 35% 28%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.2) 28%, transparent 52%, rgba(15,23,42,0.25) 80%, rgba(15,23,42,0.6) 100%)',
          }}
        />

        {/* Specular Highlight (Hotspot Glare at top-left) */}
        <div className="orb-shine-light" />

        {/* Caustic Bottom Light (Bounce reflection at bottom-rim) */}
        <div className="orb-bottom-rim-light" />

        {/* Inner Glass Glow Ring */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            boxShadow: 'inset 0 0 8px 1px rgba(255,255,255,0.65)',
          }}
        />

        {/* Active Selection Golden/White Core Ring */}
        {isSelected && (
          <div className="absolute inset-0 rounded-full ring-2 ring-white/90 shadow-[inset_0_0_12px_rgba(255,255,255,0.85)] pointer-events-none" />
        )}
      </div>
    </div>
  );
};
