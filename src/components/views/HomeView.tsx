import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MemoryOrb, NavigationPage, Language, FamilyMember, OrbEmotion } from '../../types';
import { Play, ArrowRight, Sparkles, X, Mic } from 'lucide-react';
import { speakWithElevenLabs, stopSpeech } from '../../services/elevenlabs';
import { translations } from '../../data/translations';

interface HomeViewProps {
  orbs: MemoryOrb[];
  unlockedCount: number;
  onNavigate: (page: NavigationPage) => void;
  onSelectOrbForTest: (orbId: string) => void;
  lang: Language;
  activeSenior: FamilyMember;
}

// Unified Color Themes mapped strictly to each emotion
interface EmotionStyle {
  gradient: string;
  auraColor: string;
  glowHex: string;
  radialGradient: string;
  labelTh: string;
  labelEn: string;
  emoji: string;
}

const emotionStyles: Record<OrbEmotion, EmotionStyle> = {
  joy: {
    gradient: 'from-amber-300 via-amber-500 to-yellow-600',
    auraColor: 'rgba(251, 191, 36, 0.55)',
    glowHex: '#FBBF24',
    radialGradient: 'radial-gradient(circle, rgba(251,191,36,0.55) 0%, rgba(245,158,11,0.18) 55%, transparent 100%)',
    labelTh: 'ความสุข',
    labelEn: 'Joy',
    emoji: '☀️',
  },
  nostalgia: {
    gradient: 'from-sky-300 via-cyan-500 to-blue-600',
    auraColor: 'rgba(14, 165, 233, 0.55)',
    glowHex: '#0EA5E9',
    radialGradient: 'radial-gradient(circle, rgba(14,165,233,0.55) 0%, rgba(2,132,199,0.18) 55%, transparent 100%)',
    labelTh: 'คิดถึงวันวาน',
    labelEn: 'Nostalgia',
    emoji: '🌊',
  },
  love: {
    gradient: 'from-rose-300 via-pink-500 to-rose-600',
    auraColor: 'rgba(244, 63, 94, 0.55)',
    glowHex: '#F43F5E',
    radialGradient: 'radial-gradient(circle, rgba(244,63,94,0.55) 0%, rgba(225,29,72,0.18) 55%, transparent 100%)',
    labelTh: 'ความรัก',
    labelEn: 'Love',
    emoji: '💖',
  },
  vitality: {
    gradient: 'from-emerald-300 via-teal-500 to-green-600',
    auraColor: 'rgba(16, 185, 129, 0.55)',
    glowHex: '#10B981',
    radialGradient: 'radial-gradient(circle, rgba(16,185,129,0.55) 0%, rgba(5,150,105,0.18) 55%, transparent 100%)',
    labelTh: 'สดชื่น',
    labelEn: 'Vitality',
    emoji: '🌿',
  },
  celebration: {
    gradient: 'from-purple-300 via-violet-500 to-indigo-600',
    auraColor: 'rgba(139, 92, 246, 0.55)',
    glowHex: '#8B5CF6',
    radialGradient: 'radial-gradient(circle, rgba(139,92,246,0.55) 0%, rgba(124,58,237,0.18) 55%, transparent 100%)',
    labelTh: 'ภาคภูมิใจ',
    labelEn: 'Pride',
    emoji: '🎉',
  },
};

type AnimationPhase = 'idle' | 'floating-to-center' | 'morphed' | 'closing';

export const HomeView: React.FC<HomeViewProps> = ({
  orbs,
  unlockedCount,
  onNavigate,
  onSelectOrbForTest,
  lang,
  activeSenior,
}) => {
  // Active expanded orb state & Direct fluid morphing
  const [expandedOrb, setExpandedOrb] = useState<MemoryOrb | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>('idle');
  const [isTrayPaused, setIsTrayPaused] = useState<boolean>(false);
  const [originPos, setOriginPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [orbSize, setOrbSize] = useState<number>(64);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  // Auto Mini-Preview Feature:
  // When idle for 3s (rail slides), an orb moves to center and descends to preview stage for 10s.
  // Then returns to rail and rail resumes. Tapping it or any orb immediately opens full-screen!
  const [autoPreviewIndex, setAutoPreviewIndex] = useState<number>(0);
  const [miniPreviewOrb, setMiniPreviewOrb] = useState<MemoryOrb | null>(null);
  const [isMiniPreviewVisible, setIsMiniPreviewVisible] = useState<boolean>(false);
  const [activeOrbKey, setActiveOrbKey] = useState<string | null>(null);
  const [spotlightBeam, setSpotlightBeam] = useState<{
    startX: number;
    startY: number;
    photoLeftX: number;
    photoRightX: number;
    photoTopY: number;
  } | null>(null);

  const railContainerRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const morphTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up all pending animation & auto-preview timers on component unmount
  useEffect(() => {
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      if (dockTimerRef.current) clearTimeout(dockTimerRef.current);
      if (morphTimerRef.current) clearTimeout(morphTimerRef.current);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      stopSpeech();
    };
  }, []);

  // Exact proportional dimensions for manual click full-screen morphing photograph (16:10 aspect ratio)
  const [targetDims, setTargetDims] = useState<{ width: number; height: number }>({ width: 460, height: 288 });

  useEffect(() => {
    const updateDims = () => {
      if (typeof window === 'undefined') return;
      const w = Math.min(window.innerWidth - 32, 460);
      const h = Math.round(w * 0.625); // exactly 16:10 (460x288)
      setTargetDims({ width: w, height: h });
    };
    updateDims();
    window.addEventListener('resize', updateDims, { passive: true });
    return () => window.removeEventListener('resize', updateDims);
  }, []);

  // Determine time of day for greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = activeSenior.name;

    if (lang === 'en') {
      if (hour >= 5 && hour < 12) return `Good Morning, ${name} ✨`;
      if (hour >= 12 && hour < 18) return `Good Afternoon, ${name} ✨`;
      return `Good Evening, ${name} ✨`;
    } else {
      if (hour >= 5 && hour < 12) return `อรุณสวัสดิ์, ${name} ✨`;
      if (hour >= 12 && hour < 18) return `สวัสดีตอนบ่าย, ${name} ✨`;
      return `สวัสดีตอนค่ำ, ${name} ✨`;
    }
  };

  // Auto-cycle mini preview: 3s idle running -> choose the real orb closest to rail center -> beam spotlight -> 10s display -> unpause
  useEffect(() => {
    if (expandedOrb !== null || animationPhase !== 'idle' || orbs.length === 0) {
      setIsMiniPreviewVisible(false);
      setMiniPreviewOrb(null);
      setActiveOrbKey(null);
      setSpotlightBeam(null);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      if (dockTimerRef.current) clearTimeout(dockTimerRef.current);
      return;
    }

    // 1. Wait 3s while rail slides
    idleTimerRef.current = setTimeout(() => {
      const railEl = railContainerRef.current;
      const previewEl = previewContainerRef.current;

      let chosenOrb: MemoryOrb = orbs[autoPreviewIndex % orbs.length];
      let chosenKey: string | null = null;
      let startX = 0;
      let startY = 0;
      let photoLeftX = 0;
      let photoRightX = 0;
      let photoTopY = 28;

      if (railEl && previewEl) {
        const railRect = railEl.getBoundingClientRect();
        const previewRect = previewEl.getBoundingClientRect();
        const railCenterX = railRect.left + railRect.width / 2;

        const orbEls = Array.from(railEl.querySelectorAll<HTMLElement>('[data-orb-key]'));
        let bestEl: HTMLElement | null = null;
        let minDistance = Infinity;

        for (const el of orbEls) {
          const r = el.getBoundingClientRect();
          const elCenterX = r.left + r.width / 2;
          // Must be visible within horizontal rail span
          if (r.right > railRect.left + 30 && r.left < railRect.right - 30) {
            const dist = Math.abs(elCenterX - railCenterX);
            if (dist < minDistance) {
              minDistance = dist;
              bestEl = el;
            }
          }
        }

        if (bestEl) {
          const orbId = bestEl.getAttribute('data-orb-id');
          chosenKey = bestEl.getAttribute('data-orb-key');
          const matched = orbs.find((o) => o.id === orbId);
          if (matched) chosenOrb = matched;

          const buttonEl = bestEl.querySelector('button') || bestEl;
          const bestRect = buttonEl.getBoundingClientRect();
          startX = bestRect.left + bestRect.width / 2 - previewRect.left;
          startY = bestRect.bottom - previewRect.top - 2;

          photoLeftX = previewRect.width / 2 - 110;
          photoRightX = previewRect.width / 2 + 110;
          photoTopY = 28;

          const photoEl = previewEl.querySelector<HTMLElement>('[data-mini-photo]');
          if (photoEl) {
            const pRect = photoEl.getBoundingClientRect();
            photoLeftX = pRect.left - previewRect.left;
            photoRightX = pRect.right - previewRect.left;
            photoTopY = pRect.top - previewRect.top;
          }
        } else {
          startX = previewRect.width / 2;
          startY = 0;
          photoLeftX = previewRect.width / 2 - 110;
          photoRightX = previewRect.width / 2 + 110;
          photoTopY = 28;
        }
      }

      setActiveOrbKey(chosenKey);
      setSpotlightBeam({ startX, startY, photoLeftX, photoRightX, photoTopY });
      setMiniPreviewOrb(chosenOrb);
      setIsTrayPaused(true); // Pause the rail while presenting
      setIsMiniPreviewVisible(true);

      // Fine-tune exact lens coordinates once active orb and photo element are fully rendered
      setTimeout(() => {
        if (!previewContainerRef.current) return;
        const pEl = previewContainerRef.current;
        const pRect = pEl.getBoundingClientRect();

        const lensEl = document.querySelector<HTMLElement>('[data-orb-lens]');
        let sX = startX;
        let sY = startY;
        if (lensEl) {
          const lRect = lensEl.getBoundingClientRect();
          sX = lRect.left + lRect.width / 2 - pRect.left;
          sY = lRect.top + lRect.height / 2 - pRect.top;
        }

        const photoNode = pEl.querySelector<HTMLElement>('[data-mini-photo]');
        if (photoNode) {
          const pr = photoNode.getBoundingClientRect();
          setSpotlightBeam({
            startX: sX,
            startY: sY,
            photoLeftX: pr.left - pRect.left,
            photoRightX: pr.right - pRect.left,
            photoTopY: pr.top - pRect.top,
          });
        }
      }, 40);

      // 2. Display mini preview for 10s
      dismissTimerRef.current = setTimeout(() => {
        setIsMiniPreviewVisible(false); // Animate spotlight and photo fading
        setSpotlightBeam(null);

        // 3. Resume rail after smooth fade
        dockTimerRef.current = setTimeout(() => {
          setMiniPreviewOrb(null);
          setActiveOrbKey(null);
          setIsTrayPaused(false);
          setAutoPreviewIndex((prev) => (prev + 1) % orbs.length);
        }, 350);
      }, 10000);
    }, 3000);

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      if (dockTimerRef.current) clearTimeout(dockTimerRef.current);
    };
  }, [expandedOrb, animationPhase, autoPreviewIndex, orbs]);

  // Keep spotlight beam locked to the active orb on window resize
  useEffect(() => {
    if (!isMiniPreviewVisible || !activeOrbKey) return;
    const handleResize = () => {
      const previewEl = previewContainerRef.current;
      if (!previewEl) return;
      const pRect = previewEl.getBoundingClientRect();
      const lensEl = document.querySelector<HTMLElement>('[data-orb-lens]');
      let sX = pRect.width / 2;
      let sY = 0;
      if (lensEl) {
        const lRect = lensEl.getBoundingClientRect();
        sX = lRect.left + lRect.width / 2 - pRect.left;
        sY = lRect.top + lRect.height / 2 - pRect.top;
      }
      let pLeft = pRect.width / 2 - 110;
      let pRight = pRect.width / 2 + 110;
      let pTop = 28;
      const photoEl = previewEl.querySelector<HTMLElement>('[data-mini-photo]');
      if (photoEl) {
        const pr = photoEl.getBoundingClientRect();
        pLeft = pr.left - pRect.left;
        pRight = pr.right - pRect.left;
        pTop = pr.top - pRect.top;
      }
      setSpotlightBeam({
        startX: sX,
        startY: sY,
        photoLeftX: pLeft,
        photoRightX: pRight,
        photoTopY: pTop,
      });
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, [isMiniPreviewVisible, activeOrbKey]);

  // Play voice narration only when the orb has arrived at center and morphed into rectangle
  useEffect(() => {
    if (expandedOrb && animationPhase === 'morphed') {
      const timer = setTimeout(() => {
        const textToSpeak = lang === 'en'
          ? (expandedOrb.descriptionEn || expandedOrb.voicePromptEn || expandedOrb.voicePrompt)
          : (expandedOrb.description || expandedOrb.voicePrompt);

        setIsPlayingAudio(true);
        speakWithElevenLabs(textToSpeak, undefined, () => {
          setIsPlayingAudio(false);
        }, lang);
      }, 350);

      return () => {
        clearTimeout(timer);
        stopSpeech();
      };
    } else if (!expandedOrb || animationPhase === 'closing') {
      stopSpeech();
      setIsPlayingAudio(false);
    }
  }, [expandedOrb, animationPhase, lang]);

  // Lock body scroll while orb modal is open so originPos stays 100% pixel-perfect
  useEffect(() => {
    if (expandedOrb) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [expandedOrb]);

  // Open full-screen when clicking the auto mini preview
  const handleOpenFromMiniPreview = (orb: MemoryOrb, event: React.MouseEvent<HTMLDivElement>) => {
    if (animationPhase !== 'idle') return;
    const photoEl = event.currentTarget.querySelector<HTMLElement>('[data-mini-photo]');
    const rect = photoEl ? photoEl.getBoundingClientRect() : event.currentTarget.getBoundingClientRect();

    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    if (dockTimerRef.current) clearTimeout(dockTimerRef.current);

    const targetKey = activeOrbKey;

    setOriginPos({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
    setOrbSize(Math.min(rect.width, rect.height));
    setSelectedKey(targetKey || `s1-${orb.id}-0`);
    setExpandedOrb(orb);
    setIsTrayPaused(true);
    setIsMiniPreviewVisible(false);
    setActiveOrbKey(null);
    setSpotlightBeam(null);
    setAnimationPhase('floating-to-center');

    if (morphTimerRef.current) clearTimeout(morphTimerRef.current);
    morphTimerRef.current = setTimeout(() => {
      setAnimationPhase('morphed');
    }, 360);
  };

  // Two-stage Choreographed Morphing:
  // 1. Orb detaches from rail, floats up to center as glowing 3D sphere (360ms)
  // 2. Once centered, blooms smoothly into rectangle photo (420ms)
  const handleOrbClick = (orb: MemoryOrb, itemKey: string, event: React.MouseEvent<HTMLButtonElement>) => {
    if (animationPhase !== 'idle') return;

    // Immediately cancel pending auto preview
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    if (dockTimerRef.current) clearTimeout(dockTimerRef.current);
    setIsMiniPreviewVisible(false);
    setMiniPreviewOrb(null);
    setActiveOrbKey(null);
    setSpotlightBeam(null);

    const rect = event.currentTarget.getBoundingClientRect();
    const size = rect.width;
    setOriginPos({
      x: rect.left + size / 2,
      y: rect.top + rect.height / 2,
    });
    setOrbSize(size);
    setSelectedKey(itemKey);
    setExpandedOrb(orb);
    setIsTrayPaused(true);
    setAnimationPhase('floating-to-center');

    if (morphTimerRef.current) clearTimeout(morphTimerRef.current);
    morphTimerRef.current = setTimeout(() => {
      setAnimationPhase('morphed');
    }, 360);
  };

  // Exit Animation: Single fluid reverse morph back to the orb on the rail
  const handleCloseOrb = () => {
    if (animationPhase !== 'morphed') return;
    stopSpeech();
    setIsPlayingAudio(false);

    // Re-read live position of the orb on the rail
    let socketEl: Element | null = null;
    if (selectedKey) {
      socketEl = document.querySelector(`[data-orb-key="${selectedKey}"]`);
    }

    if (!socketEl || socketEl.getBoundingClientRect().right < 0 || socketEl.getBoundingClientRect().left > window.innerWidth) {
      const railEl = railContainerRef.current;
      if (railEl && expandedOrb) {
        const railRect = railEl.getBoundingClientRect();
        const railCenterX = railRect.left + railRect.width / 2;
        const matchingEls = Array.from(railEl.querySelectorAll<HTMLElement>(`[data-orb-id="${expandedOrb.id}"]`));
        let bestEl: HTMLElement | null = null;
        let minDistance = Infinity;

        for (const el of matchingEls) {
          const r = el.getBoundingClientRect();
          const elCenterX = r.left + r.width / 2;
          if (r.right > railRect.left && r.left < railRect.right) {
            const dist = Math.abs(elCenterX - railCenterX);
            if (dist < minDistance) {
              minDistance = dist;
              bestEl = el;
            }
          }
        }
        if (bestEl) socketEl = bestEl;
      }
    }

    if (socketEl) {
      const rect = socketEl.getBoundingClientRect();
      setOriginPos({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
      setOrbSize(rect.width);
    }

    setAnimationPhase('closing');

    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setIsTrayPaused(false);
      setAnimationPhase('idle');
      setExpandedOrb(null);
      setSelectedKey(null);
    }, 440);
  };

  // Ensure enough orbs in the track so Set 1 spans >= 1200px (wider than any tablet/desktop container)
  const trackOrbsSet = React.useMemo(() => {
    if (!orbs || orbs.length === 0) return [];
    let list = [...orbs];
    while (list.length < 12) {
      list = [...list, ...orbs];
    }
    return list;
  }, [orbs]);

  // Helper to render an individual orb button on the rail with 100% consistent, uniform styling
  const renderOrbItem = (orb: MemoryOrb, itemKey: string, orbIndex: number) => {
    const style = emotionStyles[orb.emotion] || emotionStyles.joy;
    const isSelected = selectedKey === itemKey && animationPhase !== 'idle';
    const isAutoTarget = activeOrbKey === itemKey && isMiniPreviewVisible;

    return (
      <div
        key={itemKey}
        data-orb-key={itemKey}
        data-orb-id={orb.id}
        className="relative w-14 h-14 sm:w-16 sm:h-16 aspect-square shrink-0 flex items-center justify-center"
      >
        <button
          onClick={(e) => handleOrbClick(orb, itemKey, e)}
          className={`group/ball absolute inset-0 w-full h-full rounded-full flex items-center justify-center focus:outline-none transition-transform duration-200 ${
            isSelected
              ? 'opacity-0 pointer-events-none'
              : 'opacity-100 hover:scale-115 active:scale-95'
          }`}
          title={`${orb.title} - แตะเพื่อเปิดลูกแก้ว`}
        >
          {/* Subtle Projector Origin Focus at bottom contour of the orb */}
          {isAutoTarget && (
            <div
              data-orb-lens
              className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-3.5 h-2 rounded-full pointer-events-none z-20"
              style={{
                background: `radial-gradient(ellipse at center, rgba(255,255,255,0.98) 0%, ${style.glowHex} 70%, transparent 100%)`,
                filter: 'blur(0.4px)',
              }}
            />
          )}

          {/* Living Emotional Aura Glow: Balanced, soft colored mist */}
          <div
            className="absolute -inset-2 rounded-full pointer-events-none filter blur-[6px] animate-aura-breathe-soft opacity-60"
            style={{
              background: style.radialGradient,
            }}
          />

          {/* Spherical 3D Glass Memory Orb with Color Driven by Emotion (Soft, rounded & 3D) */}
          <div 
            className="w-full h-full rounded-full relative glass-memory-orb-light flex items-center justify-center p-1 overflow-hidden"
            style={{
              boxShadow: `
                inset 0 4px 14px rgba(255, 255, 255, 0.95),
                inset 0 -10px 22px rgba(15, 23, 42, 0.25),
                0 8px 20px -4px rgba(0, 0, 0, 0.12),
                0 0 12px 2px ${style.auraColor}
              `,
            }}
          >
            {/* Swirling Inner Mist Gradient */}
            <div
              className={`w-full h-full rounded-full bg-gradient-to-tr ${style.gradient} animate-mist-swirl opacity-90 filter blur-[0.6px] shadow-inner`}
            />

            {/* Faint, dreamy memory image inside the glass (soft & hazy reflection, not sharp) */}
            <div className="absolute inset-1 aspect-square rounded-full overflow-hidden opacity-30 mix-blend-overlay pointer-events-none filter blur-[0.6px]">
              <img
                src={orb.photoUrl}
                alt=""
                decoding="async"
                className="w-full h-full aspect-square rounded-full object-cover"
              />
            </div>

            {/* 3D Glass Sphere Highlights */}
            <div className="orb-shine-light" />
            <div className="orb-bottom-rim-light" />

            {orb.isUnlocked && (
              <div 
                className="absolute inset-0 rounded-full shadow-[inset_0_0_8px_rgba(255,255,255,0.7)] pointer-events-none"
              />
            )}
          </div>
        </button>
      </div>
    );
  };

  // Active orb style matching its emotion 100%
  const activeStyle = expandedOrb
    ? (emotionStyles[expandedOrb.emotion] || emotionStyles.celebration)
    : emotionStyles.joy;

  return (
    <div className="space-y-6 sm:space-y-8 py-2 relative">
      {/* =========================================================================
          1. GREETING (Flush to the left, No "Grandma", Just "Good Morning, Name")
         ========================================================================= */}
      <div className="text-left px-2 sm:px-1 space-y-1">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {getGreeting()}
        </h1>
        <p className="text-sm sm:text-base text-slate-500 font-medium">
          {lang === 'en'
            ? 'Touch any memory orb on the rail to bring it forward.'
            : 'แตะที่ลูกแก้วความทรงจำเพื่อเปิดชมเรื่องราวอันแสนอบอุ่น'}
        </p>
      </div>

      {/* =========================================================================
          2. INSIDE OUT MEMORY VAULT SHELF (BORDERLESS, ZERO LAYOUT SHIFT)
             Ample vertical room + soft edge gradient mask eliminates all clipping
         ========================================================================= */}
      <div 
        ref={railContainerRef}
        data-rail-container
        className="relative w-full h-28 sm:h-30 flex items-center overflow-hidden"
        style={{
          isolation: 'isolate',
          maskImage: '-webkit-radial-gradient(white, black)',
          WebkitMaskImage: '-webkit-radial-gradient(white, black)',
        }}
      >
        {/* Soft Left & Right fade masks so orbs glide smoothly into view without box edges */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-r from-[#F8FAFC] to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-l from-[#F8FAFC] to-transparent z-10" />

        {/* Soft Top & Bottom fade masks (High-performance GPU-friendly alternative to mask-image) */}
        <div className="pointer-events-none absolute left-0 right-0 top-0 h-2 sm:h-2.5 bg-gradient-to-b from-[#F8FAFC] to-transparent z-10" />
        <div className="pointer-events-none absolute left-0 right-0 bottom-0 h-2 sm:h-2.5 bg-gradient-to-t from-[#F8FAFC] to-transparent z-10" />

        {/* Floating Illuminated Rails Track line */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1.5 bg-gradient-to-r from-transparent via-amber-200/50 via-sky-200/50 to-transparent rounded-full pointer-events-none" />

        {/* Continuous Right-to-Left Sliding Row of Misty Spherical Balls
            PAUSES WHEN AN ORB IS SELECTED OR DURING AUTO-PREVIEW, AND ONLY RESUMES AFTER ORB RETURNS & RESTS! */}
        <div
          style={{ animationPlayState: isTrayPaused ? 'paused' : 'running' }}
          className="animate-shelf-scroll flex items-center cursor-pointer"
        >
          {/* Set 1 */}
          <div className="flex items-center gap-7 sm:gap-8 pr-7 sm:pr-8 shrink-0">
            {trackOrbsSet.map((orb, index) => renderOrbItem(orb, `s1-${orb.id}-${index}`, index))}
          </div>
          {/* Set 2 (Identical Clone for 100% seamless infinite loop without jump) */}
          <div className="flex items-center gap-7 sm:gap-8 pr-7 sm:pr-8 shrink-0" aria-hidden="true">
            {trackOrbsSet.map((orb, index) => renderOrbItem(orb, `s2-${orb.id}-${index}`, index))}
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. FULL-SCREEN PORTAL: GLIDE OUT ➔ FLASH & MORPH ➔ REVERSE GLIDE BACK IN
             Rendered via createPortal to document.body: covers 100vw x 100dvh
         ========================================================================= */}
      {typeof document !== 'undefined' &&
        expandedOrb &&
        createPortal(
          <div
            data-modal-portal
            className="fixed inset-0 z-[9999] overflow-hidden select-none"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100dvh',
            }}
          >
            {/* Dimmed Backdrop */}
            <motion.div
              data-modal-backdrop
              initial={{ opacity: 0 }}
              animate={{
                opacity: animationPhase === 'closing' ? 0 : 1,
              }}
              transition={{
                duration: 0.35,
                ease: 'easeOut',
              }}
              onClick={handleCloseOrb}
              className="absolute inset-0 w-full h-full cursor-pointer z-40 bg-slate-950/45 backdrop-blur-sm"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                height: '100%',
                pointerEvents: animationPhase === 'closing' ? 'none' : 'auto',
              }}
            />

            {/* Top-right close button */}
            <AnimatePresence>
              {animationPhase === 'morphed' && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  onClick={handleCloseOrb}
                  className="absolute top-5 right-5 z-50 p-2.5 rounded-full bg-slate-900/60 hover:bg-slate-900/80 text-white/90 transition-all cursor-pointer border border-white/20 shadow-lg"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Ambient Colored Projection Beam Glow behind floating photo matching orb emotion */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{
                opacity: animationPhase === 'closing' ? 0 : animationPhase === 'morphed' ? 0.6 : 0.45,
              }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="pointer-events-none z-45 overflow-hidden flex items-center justify-center"
              style={{
                position: 'fixed',
                left: '50%',
                top: '36%',
                transform: 'translate(-50%, -50%)',
                width: targetDims.width + 100,
                height: targetDims.height + 100,
              }}
            >
              <div
                className="w-full h-full rounded-3xl filter blur-[45px] pointer-events-none"
                style={{
                  background: activeStyle.radialGradient,
                }}
              />
            </motion.div>

            {/* =========================================================================
                THE MORPHING ACTOR (Sphere ➔ Float to Center ➔ Bloom into Rectangle ➔ Sphere)
                2-Stage Choreographed Morph:
                1. Sphere detaches from rail and floats up to center (360ms)
                2. Sphere blooms smoothly into rectangle photograph (420ms)
               ========================================================================= */}
            <motion.div
              initial={{
                position: 'fixed',
                left: originPos.x,
                top: originPos.y,
                x: '-50%',
                y: '-50%',
                width: orbSize,
                height: orbSize,
                borderRadius: `${orbSize / 2}px`,
                zIndex: 50,
                scale: 1,
              }}
              animate={
                animationPhase === 'floating-to-center'
                  ? {
                      position: 'fixed',
                      left: '50%',
                      top: '36%',
                      x: '-50%',
                      y: '-50%',
                      width: 84,
                      height: 84,
                      borderRadius: '42px',
                      zIndex: 50,
                      scale: 1,
                      transition: {
                        duration: 0.36,
                        ease: [0.22, 1, 0.36, 1],
                      },
                    }
                  : animationPhase === 'morphed'
                  ? {
                      position: 'fixed',
                      left: '50%',
                      top: '36%',
                      x: '-50%',
                      y: '-50%',
                      width: targetDims.width,
                      height: targetDims.height,
                      borderRadius: '24px',
                      zIndex: 50,
                      scale: 1,
                      transition: {
                        duration: 0.42,
                        ease: [0.16, 1, 0.3, 1],
                      },
                    }
                  : {
                      position: 'fixed',
                      left: originPos.x,
                      top: originPos.y,
                      x: '-50%',
                      y: '-50%',
                      width: orbSize,
                      height: orbSize,
                      borderRadius: `${orbSize / 2}px`,
                      zIndex: 50,
                      scale: 1,
                      transition: {
                        duration: 0.44,
                        ease: [0.22, 1, 0.36, 1],
                      },
                    }
              }
              onClick={handleCloseOrb}
              className="cursor-pointer flex items-center justify-center relative select-none"
              style={{
                willChange: 'transform, width, height, border-radius',
                isolation: 'isolate',
              }}
            >
              {/* Primary soft aura glow emanating directly from the photo frame in the orb color */}
              <motion.div
                animate={{
                  opacity: animationPhase === 'closing' ? 0.6 : animationPhase === 'morphed' ? 0.95 : 0.7,
                  borderRadius: animationPhase === 'morphed' ? '24px' : '9999px',
                }}
                transition={{ duration: animationPhase === 'closing' ? 0.44 : 0.35, ease: 'easeOut' }}
                className="absolute inset-0 pointer-events-none"
                style={{
                  borderRadius: animationPhase === 'morphed' ? '24px' : '9999px',
                  boxShadow:
                    animationPhase === 'morphed'
                      ? `0 0 32px 8px ${activeStyle.auraColor}, 0 0 14px 3px ${activeStyle.glowHex}88, 0 20px 45px -8px rgba(0,0,0,0.55)`
                      : `0 0 12px 2px ${activeStyle.auraColor}`,
                }}
              />

              {/* Secondary wider soft halo layer */}
              <motion.div
                animate={{
                  opacity: animationPhase === 'closing' ? 0 : animationPhase === 'morphed' ? 0.55 : 0,
                  borderRadius: animationPhase === 'morphed' ? '28px' : '9999px',
                }}
                transition={{ duration: animationPhase === 'closing' ? 0.44 : 0.35, ease: 'easeOut' }}
                className="absolute -inset-2.5 sm:-inset-3.5 pointer-events-none"
                style={{
                  borderRadius: animationPhase === 'morphed' ? '28px' : '9999px',
                  boxShadow: animationPhase === 'morphed' ? `0 0 45px 12px ${activeStyle.auraColor}` : undefined,
                  filter: 'blur(4px)',
                }}
              />

              {/* The Photo Container: Morphs smoothly between circle and rounded rectangle */}
              <motion.div
                animate={{
                  borderRadius: animationPhase === 'morphed' ? '24px' : '9999px',
                }}
                transition={{
                  duration: animationPhase === 'closing' ? 0.44 : animationPhase === 'morphed' ? 0.42 : 0.36,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={`w-full h-full overflow-hidden relative bg-slate-900 flex items-center justify-center ${
                  animationPhase !== 'morphed' ? 'glass-memory-orb-light' : 'shadow-2xl'
                }`}
                style={{
                  boxShadow:
                    animationPhase === 'morphed'
                      ? undefined
                      : `inset 0 4px 14px rgba(255, 255, 255, 0.95), inset 0 -10px 22px rgba(15, 23, 42, 0.25), 0 8px 20px -4px rgba(0, 0, 0, 0.12), 0 0 12px 2px ${activeStyle.auraColor}`,
                  maskImage: '-webkit-radial-gradient(white, black)',
                  WebkitMaskImage: '-webkit-radial-gradient(white, black)',
                  isolation: 'isolate',
                  WebkitBackfaceVisibility: 'hidden',
                  backfaceVisibility: 'hidden',
                }}
              >
                {/* 1. Swirling Inner Mist Gradient (fades out when morphed, fades in over 0.44s during closing) */}
                <motion.div
                  animate={{
                    opacity: animationPhase === 'morphed' ? 0 : 0.9,
                    borderRadius: animationPhase === 'morphed' ? '24px' : '9999px',
                  }}
                  transition={{
                    duration: animationPhase === 'closing' ? 0.44 : 0.35,
                    ease: 'easeOut',
                  }}
                  className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none rounded-[inherit]"
                >
                  <div
                    className={`w-full h-full bg-gradient-to-tr ${activeStyle.gradient} animate-mist-swirl filter blur-[0.6px] shadow-inner`}
                  />
                </motion.div>

                {/* 2. Memory Photograph: crisp when morphed; soft, dreamy & blended when orb */}
                <motion.div
                  animate={{
                    opacity: animationPhase === 'morphed' ? 1 : 0.3,
                    borderRadius: animationPhase === 'morphed' ? '24px' : '9999px',
                    filter: animationPhase === 'morphed' ? 'blur(0px)' : 'blur(0.6px)',
                  }}
                  transition={{
                    duration: animationPhase === 'closing' ? 0.44 : 0.35,
                    ease: 'easeOut',
                  }}
                  className={`absolute inset-0 w-full h-full pointer-events-none ${
                    animationPhase === 'morphed' ? '' : 'mix-blend-overlay'
                  }`}
                >
                  <img
                    src={expandedOrb.photoUrl}
                    alt={expandedOrb.title}
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </motion.div>

                {/* 3. 3D Glass Highlights (top shine & bottom rim) */}
                <motion.div
                  animate={{
                    opacity: animationPhase === 'morphed' ? 0 : 1,
                  }}
                  transition={{
                    duration: animationPhase === 'closing' ? 0.44 : 0.32,
                    ease: 'easeOut',
                  }}
                  className="absolute inset-0 pointer-events-none rounded-[inherit] overflow-hidden z-20"
                >
                  <div className="orb-shine-light" />
                  <div className="orb-bottom-rim-light" />
                  {expandedOrb.isUnlocked && (
                    <div className="absolute inset-0 rounded-full shadow-[inset_0_0_8px_rgba(255,255,255,0.7)] pointer-events-none" />
                  )}
                </motion.div>
              </motion.div>
            </motion.div>

            {/* =========================================================================
                FLOATING DESCRIPTION & RECALL BUTTON (Centered directly beneath the photo)
               ========================================================================= */}
            <AnimatePresence>
              {animationPhase === 'morphed' && (
                <motion.div
                  initial={{ opacity: 0, x: '-50%', y: 14 }}
                  animate={{ opacity: 1, x: '-50%', y: 0 }}
                  exit={{ opacity: 0, x: '-50%', y: -10 }}
                  transition={{ duration: 0.3, delay: 0.15 }}
                  style={{
                    position: 'fixed',
                    left: '50%',
                    top: `calc(36% + ${targetDims.height / 2 + 16}px)`,
                    width: targetDims.width,
                    zIndex: 50,
                  }}
                  className="text-center space-y-2 px-2 pointer-events-auto flex flex-col items-center justify-center"
                >
                  {/* Title */}
                  <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md text-center">
                    {lang === 'en' && expandedOrb.titleEn ? expandedOrb.titleEn : expandedOrb.title}
                  </h3>

                  {/* Story description */}
                  <p className="text-sm sm:text-base text-slate-100 font-medium leading-relaxed drop-shadow-sm px-1 max-w-md mx-auto text-center">
                    {lang === 'en' && expandedOrb.descriptionEn
                      ? expandedOrb.descriptionEn
                      : (expandedOrb.description || expandedOrb.voicePrompt)}
                  </p>

                  {/* Year & Who sent it */}
                  <div className="flex items-center justify-center space-x-2 text-xs text-amber-200/90 font-medium pt-0.5">
                    <span>{lang === 'en' && expandedOrb.memoryYearEn ? expandedOrb.memoryYearEn : expandedOrb.memoryYear}</span>
                    <span>•</span>
                    <span>{lang === 'en' && expandedOrb.uploadedByEn ? expandedOrb.uploadedByEn : (expandedOrb.uploadedBy || 'ครอบครัว')}</span>
                  </div>

                  {/* Recall Action Button */}
                  <div className="pt-2 flex items-center justify-center w-full">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        stopSpeech();
                        onSelectOrbForTest(expandedOrb.id);
                      }}
                      className="flex items-center justify-center space-x-2.5 px-8 py-3.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-300 text-slate-950 font-black text-base shadow-xl shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                      <Play className="w-5 h-5 fill-slate-950" />
                      <span>{lang === 'en' ? 'Recall This Memory' : 'เริ่มทบทวนความทรงจำนี้'}</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-300/80 pt-1 pointer-events-none text-center">
                    {lang === 'en' ? 'Tap photo or outside to close' : 'แตะที่รูปภาพหรือพื้นที่ว่างเพื่อปิด'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>,
          document.body
        )}

      {/* =========================================================================
          3. AMBIENT AUTO MINI-PREVIEW (SPOTLIGHT PROJECTED MEMORY PREVIEW)
             Soft projector spotlight connects paused ball on rail to rectangular photo!
             Subtle, calm ambient presence ("every 3s idle, preview for 10s").
         ========================================================================= */}
      <div ref={previewContainerRef} className="relative w-full h-[235px] overflow-visible flex flex-col items-center justify-start -mt-4 sm:-mt-5">
        <AnimatePresence mode="wait">
          {isMiniPreviewVisible && miniPreviewOrb && (() => {
            const miniStyle = emotionStyles[miniPreviewOrb.emotion] || emotionStyles.joy;
            return (
              <motion.div
                key={`auto-preview-${miniPreviewOrb.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onClick={(e) => handleOpenFromMiniPreview(miniPreviewOrb, e)}
                className="w-full cursor-pointer flex flex-col items-center justify-start select-none group relative pt-7 sm:pt-8"
                title={lang === 'en' ? 'Tap to view full story' : 'แตะเพื่อเปิดดูความทรงจำเต็มจอ'}
              >
                {/* 1. Soft Ambient Projector Spotlight: Casts downward from orb to rectangle */}
                {spotlightBeam && (
                  <motion.div
                    initial={{ scaleY: 0, opacity: 0 }}
                    animate={{ scaleY: 1, opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.25 } }}
                    transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      transformOrigin: `${spotlightBeam.startX}px ${spotlightBeam.startY}px`,
                    }}
                    className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-20"
                  >
                    <svg
                      className="w-full h-full pointer-events-none overflow-visible"
                      style={{
                        overflow: 'visible',
                        willChange: 'transform, opacity',
                      }}
                    >
                      <defs>
                        {/* Soft Natural Spotlight Gradient (calm ambient light) */}
                        <linearGradient id={`soft-spotlight-grad-${miniPreviewOrb.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
                          <stop offset="15%" stopColor={miniStyle.glowHex} stopOpacity="0.45" />
                          <stop offset="65%" stopColor={miniStyle.glowHex} stopOpacity="0.18" />
                          <stop offset="100%" stopColor={miniStyle.glowHex} stopOpacity="0.03" />
                        </linearGradient>

                        {/* Safari-safe SVG Gaussian Blur Feathering Filter */}
                        <filter id={`spotlight-feather-${miniPreviewOrb.id}`} x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="3.5" />
                        </filter>
                        <filter id={`spotlight-wide-${miniPreviewOrb.id}`} x="-30%" y="-30%" width="160%" height="160%">
                          <feGaussianBlur stdDeviation="7" />
                        </filter>
                      </defs>

                      {/* Soft Ambient Volumetric Spotlight Cone */}
                      <polygon
                        points={`
                          ${spotlightBeam.startX - 3},${spotlightBeam.startY}
                          ${spotlightBeam.startX + 3},${spotlightBeam.startY}
                          ${spotlightBeam.photoRightX},${spotlightBeam.photoTopY}
                          ${spotlightBeam.photoLeftX},${spotlightBeam.photoTopY}
                        `}
                        fill={`url(#soft-spotlight-grad-${miniPreviewOrb.id})`}
                        filter={`url(#spotlight-feather-${miniPreviewOrb.id})`}
                      />

                      {/* Soft Outer Atmospheric Glow */}
                      <polygon
                        points={`
                          ${spotlightBeam.startX - 6},${spotlightBeam.startY}
                          ${spotlightBeam.startX + 6},${spotlightBeam.startY}
                          ${spotlightBeam.photoRightX + 4},${spotlightBeam.photoTopY}
                          ${spotlightBeam.photoLeftX - 4},${spotlightBeam.photoTopY}
                        `}
                        fill={`url(#soft-spotlight-grad-${miniPreviewOrb.id})`}
                        opacity="0.3"
                        filter={`url(#spotlight-wide-${miniPreviewOrb.id})`}
                      />

                      {/* Gentle Landing Light Line on top edge of photo (NO dots at corners) */}
                      <line
                        x1={spotlightBeam.photoLeftX}
                        y1={spotlightBeam.photoTopY}
                        x2={spotlightBeam.photoRightX}
                        y2={spotlightBeam.photoTopY}
                        stroke={miniStyle.glowHex}
                        strokeWidth="2.5"
                        opacity="0.5"
                        filter={`url(#spotlight-feather-${miniPreviewOrb.id})`}
                      />
                    </svg>
                  </motion.div>
                )}

                {/* 2. Floating Rectangular Photo (Clean, compact 220x136, NO heavy card box, NO countdown line) */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  data-mini-photo
                  className="relative flex items-center justify-center -mt-0.5"
                  style={{ width: 220, height: 136 }}
                >
                  {/* Very soft ambient back aura (subtle, calm) */}
                  <div
                    className="absolute -inset-2.5 rounded-2xl pointer-events-none transition-opacity duration-300"
                    style={{
                      background: miniStyle.radialGradient,
                      filter: 'blur(8px)',
                      opacity: 0.35,
                    }}
                  />

                  {/* The Floating Photo Frame */}
                  <div
                    className="w-full h-full rounded-2xl overflow-hidden relative border border-white/60 bg-slate-900 shadow-md group-hover:scale-102 transition-transform duration-300"
                    style={{
                      boxShadow: `0 0 16px 2px ${miniStyle.auraColor}, 0 8px 20px -6px rgba(0,0,0,0.25)`,
                      WebkitMaskImage: '-webkit-radial-gradient(white, black)',
                      maskImage: '-webkit-radial-gradient(white, black)',
                      isolation: 'isolate',
                    }}
                  >
                    <img
                      src={miniPreviewOrb.photoUrl}
                      alt={miniPreviewOrb.title}
                      className="w-full h-full object-cover rounded-2xl"
                    />

                    {/* Pure Date/Year text directly on photo */}
                    <div className="absolute top-2.5 right-3 z-10 text-xs font-bold text-white/95 drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)] pointer-events-none tracking-tight">
                      {(() => {
                        const rawDate =
                          lang === 'en'
                            ? miniPreviewOrb.memoryYearEn || miniPreviewOrb.uploadDateEn || miniPreviewOrb.memoryYear || ''
                            : miniPreviewOrb.memoryYear || miniPreviewOrb.uploadDate || miniPreviewOrb.memoryYearEn || '';
                        return rawDate.replace(/\s*\([^)]*\)/g, '').trim();
                      })()}
                    </div>

                    {/* Subtle top rim light where spotlight lands */}
                    <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                  </div>
                </motion.div>

                {/* 3. Floating Description Text (Comfortable spacing and senior-friendly readable font sizes) */}
                <motion.div
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.4, ease: 'easeOut' }}
                  className="mt-3.5 sm:mt-4 text-center space-y-1.5 max-w-[320px] sm:max-w-[360px] pointer-events-auto select-none flex flex-col items-center px-2"
                >
                  <h4 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight leading-snug drop-shadow-xs line-clamp-1">
                    {lang === 'en' && miniPreviewOrb.titleEn ? miniPreviewOrb.titleEn : miniPreviewOrb.title}
                  </h4>

                  <p className="text-sm text-slate-600 font-medium line-clamp-2 leading-relaxed">
                    {lang === 'en' && miniPreviewOrb.descriptionEn
                      ? miniPreviewOrb.descriptionEn
                      : (miniPreviewOrb.description || miniPreviewOrb.voicePrompt)}
                  </p>
                </motion.div>
              </motion.div>
            );
          })()}

          {!isMiniPreviewVisible && (
            <div className="h-full flex items-center justify-center pointer-events-none select-none opacity-30 transition-opacity duration-500">
              <p className="text-xs text-slate-400 font-medium tracking-wide">
                {lang === 'en'
                  ? '✦ Tap any orb to recall a memory'
                  : '✦ แตะที่ลูกแก้วใดก็ได้เพื่อเปิดชมความทรงจำ'}
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* =========================================================================
          3.5 TODAY'S RECAP WIDGET (บันทึกเรื่องราววันนี้)
         ========================================================================= */}
      <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 rounded-[32px] border border-amber-200/90 p-5 sm:p-6 shadow-sm relative overflow-hidden backdrop-blur-xs">
        {/* Ambient warm radial glow */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />

        <div className="w-full sm:w-auto text-left space-y-1.5 relative z-10 flex flex-col items-start">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-100/90 border border-amber-300/70 text-amber-900 text-xs font-bold tracking-wide shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            <span>{lang === 'en' ? "Today's Recap" : 'บันทึกเรื่องราววันนี้'}</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight text-left">
            {lang === 'en' ? 'How are you feeling today?' : 'วันนี้คุณเป็นยังไงบ้าง'}
          </h3>
          <p className="text-sm sm:text-base text-slate-600 font-medium text-left">
            {lang === 'en' ? 'Tell us your story, we’d love to listen.' : 'เล่าให้พวกเราฟังหน่อยสิ'}
          </p>
        </div>

        <button
          onClick={() => onNavigate('today-recap')}
          className="w-full sm:w-auto flex items-center justify-center space-x-3 px-7 py-4 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 hover:from-amber-400 hover:to-amber-200 text-slate-950 font-extrabold text-base sm:text-lg shadow-md shadow-amber-300/60 hover:shadow-lg hover:scale-102 active:scale-96 transition-all group shrink-0 cursor-pointer border border-amber-300/80"
        >
          <div className="w-9 h-9 rounded-full bg-slate-950 text-amber-300 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
            <Mic className="w-5 h-5 text-amber-400 animate-pulse" />
          </div>
          <span>{lang === 'en' ? "Tell Today's Story" : 'เล่าเรื่องราววันนี้'}</span>
          <ArrowRight className="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* =========================================================================
          4. PRIMARY INTERACTIVE PLAY BUTTON (SPACED DOWN FOR BREATHING ROOM)
         ========================================================================= */}
      <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-50/70 via-rose-50/40 to-indigo-50/60 rounded-[32px] border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <div className="w-full sm:w-auto text-left space-y-1.5 flex flex-col items-start max-w-xl">
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug text-left">
            {lang === 'en'
              ? 'Recall your heartwarming family memories'
              : 'ย้อนดูความทรงจำดีๆที่ผ่านมาของคุณกัน'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 font-medium text-left">
            {lang === 'en'
              ? 'With fun memory games, voice stories, and photos'
              : 'พร้อมเกมความจำสนุกๆ ฟังเสียงและดูภาพประกอบ'}
          </p>
        </div>

        <button
          onClick={() => onNavigate(unlockedCount >= orbs.length ? 'session-review' : 'test')}
          className="w-full sm:w-auto flex items-center justify-center space-x-3 px-8 py-4 sm:py-4.5 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 font-extrabold text-lg sm:text-xl shadow-lg shadow-amber-200/80 hover:shadow-xl hover:scale-102 active:scale-96 transition-all group shrink-0 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-slate-950 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </div>
          <span>
            {unlockedCount >= orbs.length
              ? (lang === 'en' ? 'View Daily Review 🏆' : 'ดูสรุปผลความทรงจำ 🏆')
              : (lang === 'en' ? 'Start Playing 🔮' : 'แตะเพื่อเริ่มเล่นเลย 🔮')}
          </span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};
